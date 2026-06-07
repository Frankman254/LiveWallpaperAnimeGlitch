import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import {
	getLinearBase,
	resolveGlowReach
} from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	getRadialShapeDefinition,
	getSpectrumRadialAngleRad,
	traceRadialShapeAnnulus,
	traceRadialShapeContour
} from '@/features/spectrum/geometry/radialGeometry';

/** How many outer rings get shadow when `ringCount > SHADOW_RING_BUDGET`. */
const SHADOW_RING_BUDGET = 6;

/**
 * Pick the segment count needed to render a shape's contour without
 * stair-stepping at high ring counts. Reads from the shape registry —
 * adding a new shape only requires an entry in `radialGeometry.ts`.
 */
function getTunnelSegmentsForShape(shape: SpectrumRadialShape): number {
	return getRadialShapeDefinition(shape).tunnelSegments;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/**
 * Shared glow-blur cap for tunnel rings + walls.
 *
 * Tunnel multiplies blur cost by ring count (each ring runs its own
 * stroke + shadow), so even moderate `shadowBlur × glow` torches FPS when
 * the user maxes them on a 24-ring tunnel. Lifts the Classic cap pattern
 * but uses `ringCount` as the density signal and tighter ceilings — the
 * visual difference past 30px on a tunnel ring is invisible anyway.
 */
function computeTunnelGlowBlur(
	settings: SpectrumSettings,
	ringCount: number,
	modulator: number
): number {
	const requested =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings) *
		modulator;
	const cap = ringCount >= 12 ? 30 : 50;
	return Math.min(requested, cap);
}

/** 0 = evenly spaced rings, 1 = pack rings toward the outer rim (stronger depth cue). */
function depthPosition(ring: number, ringCount: number, spacing: number): number {
	const linear = ring / Math.max(ringCount - 1, 1);
	const exponent = 1 + clamp01(spacing) * 2.4;
	return Math.pow(linear, exponent);
}

function sampleBandEnergy(
	pixelHeights: Float32Array,
	barCount: number,
	ring: number,
	ringCount: number
): number {
	const t = depthPosition(ring, ringCount, 0);
	const bandStart = Math.floor(t * barCount * 0.85);
	const bandEnd = Math.min(
		barCount - 1,
		Math.floor((t + 1 / ringCount) * barCount * 0.85) + 1
	);
	let sum = 0;
	let samples = 0;
	for (let b = bandStart; b <= bandEnd; b++) {
		sum += pixelHeights[b] ?? 0;
		samples++;
	}
	return samples > 0 ? sum / samples : 0;
}

type RingSample = {
	depthT: number;
	radius: number;
	energyNorm: number;
	color: string;
	alpha: number;
	lineWidth: number;
	/** Phase offset applied to this ring's contour (rotation in radians). */
	rotationPhase: number;
	/** True when this ring should paint its glow shadow. Inner rings get
	 *  skipped at high ringCount to keep perf sane — see SHADOW_RING_BUDGET. */
	shadowEligible: boolean;
};

function buildRadialRings(
	settings: SpectrumSettings,
	runtime: SpectrumRuntimeState,
	maxR: number
): RingSample[] {
	const ringCount = Math.max(1, settings.spectrumTunnelRingCount);
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const baseInnerR = settings.spectrumInnerRadius;
	const maxH = Math.max(settings.spectrumMaxHeight, 1);
	const depthFalloff = clamp01(settings.spectrumTunnelDepthFalloff);
	const spacing = clamp01(settings.spectrumTunnelRingSpacing);
	const pulseStrength = clamp01(settings.spectrumTunnelPulseStrength);
	const rotation = runtime.rotation;
	const alternate = settings.spectrumTunnelAlternateRotation;
	// Outer rings carry the visible glow; inner rings (small, dim) cost the
	// same shadow blur and disappear behind depth alpha. Budget = the
	// outermost `SHADOW_RING_BUDGET` rings keep shadow when ringCount is
	// past that threshold; smaller tunnels keep shadow on every ring.
	const shadowFloor =
		ringCount > SHADOW_RING_BUDGET ? ringCount - SHADOW_RING_BUDGET : 0;

	const rings: RingSample[] = [];

	for (let ring = 0; ring < ringCount; ring++) {
		const depthT = depthPosition(ring, ringCount, spacing);
		const baseR = baseInnerR + depthT * (maxR - baseInnerR);

		const avgEnergy = sampleBandEnergy(
			pixelHeights,
			barCount,
			ring,
			ringCount
		);
		const energyNorm = Math.min(avgEnergy / maxH, 1);

		// Pulse pushes rings outward — stronger on outer (closer) rings.
		const depthBoost = 0.35 + depthT * 0.65;
		const pulseR =
			baseR +
			energyNorm * settings.spectrumMaxHeight * 0.22 * pulseStrength * depthBoost;

		const strokeColor = getColor(
			settings,
			depthT +
				rotation / (Math.PI * 2) +
				energyNorm * 0.1 +
				ring * 0.02
		);

		// Far rings (center) dimmer; near rings brighter — depth falloff.
		const depthAlpha = 0.12 + depthT * (0.88 * (1 - depthFalloff * 0.55));
		const alpha =
			settings.spectrumOpacity *
			depthAlpha *
			(0.35 + energyNorm * 0.65);

		const lineWidth =
			(settings.spectrumBarWidth * (0.45 + depthT * 0.85) + 0.75) *
			(0.7 + energyNorm * 0.5);

		// Rotation: every ring spins by `runtime.rotation`. When
		// `alternate` is on, odd rings counter-rotate, producing a layered
		// depth illusion (each pair of adjacent rings spins opposite).
		// Without `alternate` the rings rotate in sync (single direction).
		const rotationSign = alternate && ring % 2 === 1 ? -1 : 1;
		const rotationPhase = rotation * rotationSign;

		rings.push({
			depthT,
			radius: pulseR,
			energyNorm,
			color: strokeColor,
			alpha: Math.max(0, Math.min(1, alpha)),
			lineWidth,
			rotationPhase,
			shadowEligible: ring >= shadowFloor
		});
	}

	return rings;
}

function drawRadialTunnelWalls(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	rings: RingSample[],
	wallOpacity: number,
	settings: SpectrumSettings
): void {
	if (wallOpacity <= 0.001 || rings.length < 2) return;

	const radialAngleRad = getSpectrumRadialAngleRad(settings.spectrumRadialAngle);
	const segments = getTunnelSegmentsForShape(settings.spectrumRadialShape);

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';

	for (let i = 0; i < rings.length - 1; i++) {
		const inner = rings[i];
		const outer = rings[i + 1];
		const midAlpha =
			((inner.alpha + outer.alpha) * 0.5) *
			wallOpacity *
			(0.25 + (inner.energyNorm + outer.energyNorm) * 0.35);

		if (midAlpha <= 0.002) continue;

		ctx.beginPath();
		traceRadialShapeAnnulus(
			ctx,
			cx,
			cy,
			settings.spectrumRadialShape,
			inner.radius,
			outer.radius,
			radialAngleRad,
			{ segments }
		);
		ctx.fillStyle = outer.color;
		ctx.globalAlpha = Math.min(0.55, midAlpha);
		ctx.fill();
	}

	ctx.restore();
}

function drawRadialTunnelRings(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	rings: RingSample[],
	settings: SpectrumSettings
): void {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	const radialAngleRad = getSpectrumRadialAngleRad(settings.spectrumRadialAngle);
	const segments = getTunnelSegmentsForShape(settings.spectrumRadialShape);

	for (const ring of rings) {
		ctx.globalAlpha = ring.alpha;
		ctx.strokeStyle = ring.color;
		ctx.lineWidth = ring.lineWidth;
		if (ring.shadowEligible) {
			ctx.shadowColor = ring.color;
			ctx.shadowBlur = computeTunnelGlowBlur(
				settings,
				rings.length,
				0.25 + ring.energyNorm * 0.75
			);
		} else {
			// Inner rings skip shadow entirely — clearing shadowColor +
			// shadowBlur lets canvas2D skip the (very expensive) blur
			// pass for these strokes.
			ctx.shadowColor = 'rgba(0,0,0,0)';
			ctx.shadowBlur = 0;
		}

		ctx.beginPath();
		traceRadialShapeContour(
			ctx,
			cx,
			cy,
			settings.spectrumRadialShape,
			ring.radius,
			radialAngleRad,
			{
				segments,
				phase: -Math.PI / 2 + ring.rotationPhase
			}
		);
		ctx.stroke();
	}

	// Vanishing-point glow in the center (tunnel depth)
	if (rings.length > 0) {
		const inner = rings[0];
		const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner.radius * 1.4);
		grad.addColorStop(0, inner.color);
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.globalAlpha = settings.spectrumOpacity * 0.12;
		ctx.fillStyle = grad;
		ctx.shadowColor = 'rgba(0,0,0,0)';
		ctx.shadowBlur = 0;
		ctx.beginPath();
		traceRadialShapeContour(
			ctx,
			cx,
			cy,
			settings.spectrumRadialShape,
			inner.radius * 1.35,
			radialAngleRad,
			{
				segments,
				phase: -Math.PI / 2 + inner.rotationPhase
			}
		);
		ctx.fill();
	}

	ctx.restore();
}

function drawTunnelRadial(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const ringCount = settings.spectrumTunnelRingCount;
	if (ringCount <= 0) return;

	const cx =
		canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const maxR = Math.min(canvas.width, canvas.height) * 0.48;

	const rings = buildRadialRings(settings, runtime, maxR);
	const wallOpacity = clamp01(settings.spectrumTunnelWallOpacity);

	drawRadialTunnelWalls(ctx, cx, cy, rings, wallOpacity, settings);
	drawRadialTunnelRings(ctx, cx, cy, rings, settings);
}

function drawTunnelLinear(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const ringCount = settings.spectrumTunnelRingCount;
	if (ringCount <= 0) return;

	const w = canvas.width;
	const h = canvas.height;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const maxD = Math.min(w, h) * 0.48;
	const baseInnerD = settings.spectrumInnerRadius;
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const maxH = Math.max(settings.spectrumMaxHeight, 1);
	const depthFalloff = clamp01(settings.spectrumTunnelDepthFalloff);
	const spacing = clamp01(settings.spectrumTunnelRingSpacing);
	const pulseStrength = clamp01(settings.spectrumTunnelPulseStrength);
	const wallOpacity = clamp01(settings.spectrumTunnelWallOpacity);

	const spanF = Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const totalSpan = (isVertical ? h : w) * spanF;
	const axisStart = isVertical ? (h - totalSpan) / 2 : (w - totalSpan) / 2;

	const rings: Array<{ depth: number; offset: number; color: string; alpha: number }> =
		[];

	for (let ring = 0; ring < ringCount; ring++) {
		const depthT = depthPosition(ring, ringCount, spacing);
		const baseD = baseInnerD + depthT * (maxD - baseInnerD);

		const avgEnergy = sampleBandEnergy(
			pixelHeights,
			barCount,
			ring,
			ringCount
		);
		const energyNorm = Math.min(avgEnergy / maxH, 1);
		const depthBoost = 0.35 + depthT * 0.65;
		const pulseD =
			baseD +
			energyNorm * settings.spectrumMaxHeight * 0.22 * pulseStrength * depthBoost;

		const strokeColor = getColor(settings, depthT + energyNorm * 0.1);
		const depthAlpha = 0.12 + depthT * (0.88 * (1 - depthFalloff * 0.55));
		const alpha =
			settings.spectrumOpacity *
			depthAlpha *
			(0.35 + energyNorm * 0.65);

		rings.push({
			depth: depthT,
			offset: pulseD,
			color: strokeColor,
			alpha: Math.max(0, Math.min(1, alpha))
		});
	}

	ctx.save();
	ctx.lineCap = 'round';

	// Each linear "ring" is a straight line across the spectrum axis, so we
	// only need moveTo + a single lineTo per ring. The original code iterated
	// 96 times to draw what was always a straight line — 95× waste on perf,
	// no visual difference removed.
	const drawLinearRingLine = (offset: number): void => {
		if (isVertical) {
			const x = baseX + direction * offset;
			ctx.moveTo(x, axisStart);
			ctx.lineTo(x, axisStart + totalSpan);
		} else {
			const y = baseY + direction * offset;
			ctx.moveTo(axisStart, y);
			ctx.lineTo(axisStart + totalSpan, y);
		}
	};

	// Corridor walls between depth slices. Same simplification — the wall
	// midpoint is a straight line at `(inner + outer) / 2`.
	if (wallOpacity > 0.001 && rings.length >= 2) {
		ctx.globalCompositeOperation = 'lighter';
		ctx.shadowColor = 'rgba(0,0,0,0)';
		ctx.shadowBlur = 0;
		for (let i = 0; i < rings.length - 1; i++) {
			const inner = rings[i];
			const outer = rings[i + 1];
			const midAlpha = ((inner.alpha + outer.alpha) * 0.5) * wallOpacity * 0.35;
			if (midAlpha <= 0.002) continue;

			ctx.strokeStyle = outer.color;
			ctx.globalAlpha = Math.min(0.45, midAlpha);
			ctx.lineWidth = Math.abs(outer.offset - inner.offset);

			ctx.beginPath();
			drawLinearRingLine((inner.offset + outer.offset) * 0.5);
			ctx.stroke();
		}
	}

	// Outer-ring shadow budget — same idea as the radial pass. Inner rings
	// (closer to the axis) are smaller and dimmer; the glow is invisible
	// behind depth alpha, only the GPU cost remains.
	const shadowFloor =
		rings.length > SHADOW_RING_BUDGET
			? rings.length - SHADOW_RING_BUDGET
			: 0;

	for (let i = 0; i < rings.length; i++) {
		const ring = rings[i];
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = ring.color;
		ctx.globalAlpha = ring.alpha;
		ctx.lineWidth = settings.spectrumBarWidth * (0.5 + ring.depth * 0.9) + 1;
		if (i >= shadowFloor) {
			ctx.shadowColor = ring.color;
			ctx.shadowBlur = computeTunnelGlowBlur(settings, rings.length, 0.5);
		} else {
			ctx.shadowColor = 'rgba(0,0,0,0)';
			ctx.shadowBlur = 0;
		}

		ctx.beginPath();
		drawLinearRingLine(ring.offset);
		ctx.stroke();
	}

	ctx.restore();
}

/**
 * Concentric depth rings with optional wall fill — reads as a 3D tunnel, not jagged polygons.
 */
export function drawTunnel(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	if (settings.spectrumMode === 'linear') {
		drawTunnelLinear(ctx, canvas, runtime, settings);
	} else {
		drawTunnelRadial(ctx, canvas, runtime, settings);
	}
}
