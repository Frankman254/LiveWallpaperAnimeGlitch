import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import { getLinearBase } from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	getSpectrumRadialAngleRad,
	traceRadialShapeAnnulus,
	traceRadialShapeContour
} from '@/features/spectrum/geometry/radialGeometry';

const RING_SEGMENTS = 96;

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
		settings.spectrumShadowBlur * settings.spectrumGlowIntensity * modulator;
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

		rings.push({
			depthT,
			radius: pulseR,
			energyNorm,
			color: strokeColor,
			alpha: Math.max(0, Math.min(1, alpha)),
			lineWidth
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
			radialAngleRad
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

	for (const ring of rings) {
		ctx.globalAlpha = ring.alpha;
		ctx.strokeStyle = ring.color;
		ctx.lineWidth = ring.lineWidth;
		ctx.shadowColor = ring.color;
		ctx.shadowBlur = computeTunnelGlowBlur(
			settings,
			rings.length,
			0.25 + ring.energyNorm * 0.75
		);

		ctx.beginPath();
		traceRadialShapeContour(
			ctx,
			cx,
			cy,
			settings.spectrumRadialShape,
			ring.radius,
			radialAngleRad
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
		ctx.beginPath();
		traceRadialShapeContour(
			ctx,
			cx,
			cy,
			settings.spectrumRadialShape,
			inner.radius * 1.35,
			radialAngleRad
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

	// Corridor walls between depth slices
	if (wallOpacity > 0.001 && rings.length >= 2) {
		ctx.globalCompositeOperation = 'lighter';
		for (let i = 0; i < rings.length - 1; i++) {
			const inner = rings[i];
			const outer = rings[i + 1];
			const midAlpha = ((inner.alpha + outer.alpha) * 0.5) * wallOpacity * 0.35;
			if (midAlpha <= 0.002) continue;

			ctx.strokeStyle = outer.color;
			ctx.globalAlpha = Math.min(0.45, midAlpha);
			ctx.lineWidth = Math.abs(outer.offset - inner.offset);

			ctx.beginPath();
			for (let step = 0; step <= RING_SEGMENTS; step++) {
				const frac = step / RING_SEGMENTS;
				if (isVertical) {
					const y = axisStart + frac * totalSpan;
					const xInner = baseX + direction * inner.offset;
					const xOuter = baseX + direction * outer.offset;
					const x = xInner + (xOuter - xInner) * 0.5;
					if (step === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				} else {
					const x = axisStart + frac * totalSpan;
					const yInner = baseY + direction * inner.offset;
					const yOuter = baseY + direction * outer.offset;
					const y = yInner + (yOuter - yInner) * 0.5;
					if (step === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
			}
			ctx.stroke();
		}
	}

	// Smooth elliptical rings along the spectrum axis (corridor cross-section)
	for (const ring of rings) {
		ctx.globalCompositeOperation = 'source-over';
		ctx.strokeStyle = ring.color;
		ctx.globalAlpha = ring.alpha;
		ctx.lineWidth = settings.spectrumBarWidth * (0.5 + ring.depth * 0.9) + 1;
		ctx.shadowColor = ring.color;
		ctx.shadowBlur = computeTunnelGlowBlur(settings, rings.length, 0.5);

		ctx.beginPath();
		for (let step = 0; step <= RING_SEGMENTS; step++) {
			const frac = step / RING_SEGMENTS;
			if (isVertical) {
				const y = axisStart + frac * totalSpan;
				const x = baseX + direction * ring.offset;
				if (step === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			} else {
				const x = axisStart + frac * totalSpan;
				const y = baseY + direction * ring.offset;
				if (step === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
		}
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
