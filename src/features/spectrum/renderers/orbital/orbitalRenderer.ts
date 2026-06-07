import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import {
	getLinearBase,
	resolveGlowReach
} from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	getRadialShapeDefinition,
	getShapedRadiusAtAngle,
	getSpectrumRadialAngleRad,
	traceRadialShapeContour
} from '@/features/spectrum/geometry/radialGeometry';
import { rotationDirectionSign } from '@/features/stageFx/stageFxConfig';

/**
 * Orbital cost = blur_px × particle_count (each fill = independent shadow
 * pass; canvas2D can't batch them). A flat 24px cap is fine for ~64 bars but
 * torches FPS at 256 bars × every-frame shadow. Treat the cap as a
 * shadow-px BUDGET that shrinks as density grows so the slider stays useful
 * at low counts without melting the GPU at high ones:
 *
 *   barCount ≤ 64  → up to 24px (full quality)
 *   barCount = 128 → up to 12px
 *   barCount = 256 → up to ~6px
 *   barCount > 384 → 4px floor
 *
 * `requested === 0` short-circuits — when the user keeps Shadow Blur at 0
 * we want canvas2D to skip the shadow path entirely (it's much cheaper than
 * shadowBlur=1).
 */
function computeOrbitalGlowBlur(
	settings: SpectrumSettings,
	barCount: number
): number {
	const requested =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings);
	if (requested <= 0) return 0;
	const density = Math.max(1, barCount);
	const cap = Math.max(4, Math.min(24, 1536 / density));
	return Math.min(requested, cap);
}

function ensureOrbitalAngles(
	runtime: SpectrumRuntimeState,
	barCount: number
): Float32Array {
	if (!runtime.orbitalAngles || runtime.orbitalAngles.length !== barCount) {
		runtime.orbitalAngles = new Float32Array(barCount);
		for (let i = 0; i < barCount; i++) {
			runtime.orbitalAngles[i] = (i / barCount) * Math.PI * 2;
		}
	}
	return runtime.orbitalAngles;
}

function advanceOrbitalAngles(
	runtime: SpectrumRuntimeState,
	pixelHeights: Float32Array,
	barCount: number,
	maxH: number,
	baseSpeed: number,
	dt: number
): void {
	const angles = ensureOrbitalAngles(runtime, barCount);
	const tau = Math.PI * 2;
	for (let i = 0; i < barCount; i++) {
		const energyNorm = Math.min(
			(pixelHeights[i] ?? 0) / Math.max(maxH, 1),
			1
		);
		const orbitalSpeed =
			baseSpeed * (0.5 + energyNorm * 1.5) * (1 + (i % 8) * 0.04);
		const nextAngle = angles[i] + orbitalSpeed * dt;
		angles[i] = ((nextAngle % tau) + tau) % tau;
	}
}

function getOrbitalBaseSpeed(
	rotationSpeed: number,
	allowIdleFallback: boolean
): number {
	if (Math.abs(rotationSpeed) < 0.001) return allowIdleFallback ? 0.3 : 0;
	const direction = rotationSpeed < 0 ? -1 : 1;
	return direction * (Math.abs(rotationSpeed) * 0.8 + 0.3);
}

function getEffectiveOrbitalRotationSpeed(
	settings: SpectrumSettings,
	runtime: SpectrumRuntimeState
): number {
	const fixedSpeed =
		settings.spectrumRotationDrive === 'fixed' ||
		settings.spectrumRotationDrive === 'fixed-audio'
			? Math.abs(settings.spectrumRotationSpeed)
			: 0;
	const audioSpeed =
		settings.spectrumRotationDrive === 'audio' ||
		settings.spectrumRotationDrive === 'fixed-audio'
			? runtime.audioRotationSpeed
			: 0;
	return (
		rotationDirectionSign(settings.spectrumRotationDirection) *
		(fixedSpeed + audioSpeed)
	);
}

function drawOrbitalParticle(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	energyNorm: number,
	settings: SpectrumSettings,
	color: string,
	trailFrom?: { x: number; y: number }
): void {
	const dotRadius = settings.spectrumBarWidth * (0.8 + energyNorm * 1.5);
	const alpha = settings.spectrumOpacity * (0.3 + energyNorm * 0.7);

	ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
	ctx.fillStyle = color;
	ctx.shadowColor = color;
	ctx.beginPath();
	ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
	ctx.fill();

	if (trailFrom && settings.spectrumGlowIntensity > 0.5) {
		// Trail strokes inherit the outer ctx.shadowBlur. With N particles +
		// trails that doubles the shadow-pass count per frame. Zero out the
		// blur just around the stroke so the trail is still drawn (motion
		// hint) without spawning a second shadow pass per particle. The
		// particle's own fill keeps its glow halo.
		const prevShadowBlur = ctx.shadowBlur;
		ctx.shadowBlur = 0;
		ctx.save();
		ctx.globalAlpha *= 0.35;
		ctx.strokeStyle = color;
		ctx.lineWidth = dotRadius * 0.7;
		ctx.beginPath();
		ctx.moveTo(trailFrom.x, trailFrom.y);
		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.restore();
		ctx.shadowBlur = prevShadowBlur;
	}
}

/**
 * Orbiting particles — radial: shells follow Radial Shape; linear: beads wobble on the axis.
 */
export function drawOrbital(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number
): void {
	if (settings.spectrumMode === 'linear') {
		_drawLinearOrbital(ctx, canvas, runtime, settings, dt);
	} else {
		_drawRadialOrbital(ctx, canvas, runtime, settings, dt);
	}
}

function _drawRadialOrbital(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number
): void {
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const cx =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const innerR = settings.spectrumInnerRadius;
	const maxH = settings.spectrumMaxHeight;
	const maxR = innerR + maxH;
	const baseSpeed = getOrbitalBaseSpeed(
		getEffectiveOrbitalRotationSpeed(settings, runtime),
		settings.spectrumRotationDrive === 'fixed' ||
			settings.spectrumRotationDrive === 'fixed-audio'
	);
	const trailDirection = baseSpeed < 0 ? -1 : 1;
	const radialAngleRad = getSpectrumRadialAngleRad(
		settings.spectrumRadialAngle
	);
	const shape = settings.spectrumRadialShape;

	advanceOrbitalAngles(runtime, pixelHeights, barCount, maxH, baseSpeed, dt);
	const angles = runtime.orbitalAngles!;

	ctx.save();
	ctx.shadowBlur = computeOrbitalGlowBlur(settings, barCount);

	const shellCount = Math.min(barCount, 8);
	const barsPerShell = Math.ceil(barCount / shellCount);
	const shellContourSegments = getRadialShapeDefinition(shape).tunnelSegments;

	const shapedR = (nominal: number, angle: number) =>
		getShapedRadiusAtAngle(shape, nominal, angle, radialAngleRad);

	for (let shell = 0; shell < shellCount; shell++) {
		const shellT = shell / Math.max(shellCount - 1, 1);
		const shellInnerR = innerR + shellT * (maxR - innerR) * 0.7;

		let shellEnergy = 0;
		const shellStart = shell * barsPerShell;
		const shellEnd = Math.min(barCount, shellStart + barsPerShell);
		for (let b = shellStart; b < shellEnd; b++) {
			shellEnergy += pixelHeights[b] ?? 0;
		}
		shellEnergy /= Math.max(shellEnd - shellStart, 1);
		const shellNorm = Math.min(shellEnergy / Math.max(maxH, 1), 1);
		const shellR = shellInnerR + shellNorm * (maxH * 0.3);

		const particleColor = getColor(
			settings,
			shellT + runtime.rotation / (Math.PI * 2) + shellNorm * 0.06
		);

		for (let b = shellStart; b < shellEnd; b++) {
			const energyNorm = Math.min(
				(pixelHeights[b] ?? 0) / Math.max(maxH, 1),
				1
			);
			const angle = angles[b] ?? 0;
			const nominalR = shellR + energyNorm * maxH * 0.12;
			const r = shapedR(nominalR, angle);

			const x = cx + Math.cos(angle) * r;
			const y = cy + Math.sin(angle) * r;

			let trailFrom: { x: number; y: number } | undefined;
			if (settings.spectrumGlowIntensity > 0.5) {
				const prevAngle = angle - trailDirection * 0.15;
				const prevR = shapedR(nominalR, prevAngle);
				trailFrom = {
					x: cx + Math.cos(prevAngle) * prevR,
					y: cy + Math.sin(prevAngle) * prevR
				};
			}

			drawOrbitalParticle(
				ctx,
				x,
				y,
				energyNorm,
				settings,
				particleColor,
				trailFrom
			);
		}

		if (settings.spectrumOpacity > 0.3) {
			ctx.save();
			ctx.globalAlpha =
				settings.spectrumOpacity * 0.08 * (0.3 + shellNorm * 0.7);
			ctx.strokeStyle = particleColor;
			ctx.lineWidth = 1;
			ctx.shadowBlur = 0;
			ctx.beginPath();
			traceRadialShapeContour(
				ctx,
				cx,
				cy,
				shape,
				shellR,
				radialAngleRad,
				{ segments: shellContourSegments }
			);
			ctx.stroke();
			ctx.restore();
		}
	}

	ctx.restore();
}

function _drawLinearOrbital(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number
): void {
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const w = canvas.width;
	const h = canvas.height;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const spanF = Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const totalSpan = (isVertical ? h : w) * spanF;
	const axisStart = isVertical ? (h - totalSpan) / 2 : (w - totalSpan) / 2;
	const innerR = settings.spectrumInnerRadius;
	const maxH = settings.spectrumMaxHeight;
	const baseSpeed = getOrbitalBaseSpeed(
		getEffectiveOrbitalRotationSpeed(settings, runtime),
		settings.spectrumRotationDrive === 'fixed' ||
			settings.spectrumRotationDrive === 'fixed-audio'
	);
	const trailDirection = baseSpeed < 0 ? -1 : 1;

	advanceOrbitalAngles(runtime, pixelHeights, barCount, maxH, baseSpeed, dt);
	const angles = runtime.orbitalAngles!;

	ctx.save();
	ctx.shadowBlur = computeOrbitalGlowBlur(settings, barCount);

	for (let b = 0; b < barCount; b++) {
		const energyNorm = Math.min(
			(pixelHeights[b] ?? 0) / Math.max(maxH, 1),
			1
		);
		const frac = (b + 0.5) / barCount;
		const spread = innerR + energyNorm * maxH;
		const phase = angles[b] ?? 0;
		const wobble = Math.cos(phase) * spread;

		const particleColor = getColor(
			settings,
			frac + runtime.rotation / (Math.PI * 2) + energyNorm * 0.08
		);

		let x: number;
		let y: number;
		let trailFrom: { x: number; y: number } | undefined;

		if (isVertical) {
			const axisY = axisStart + frac * totalSpan;
			x = baseX + direction * wobble;
			y = axisY;
			if (settings.spectrumGlowIntensity > 0.5) {
				const prevWobble =
					Math.cos(phase - trailDirection * 0.15) * spread;
				trailFrom = { x: baseX + direction * prevWobble, y: axisY };
			}
		} else {
			const axisX = axisStart + frac * totalSpan;
			x = axisX;
			y = baseY + direction * wobble;
			if (settings.spectrumGlowIntensity > 0.5) {
				const prevWobble =
					Math.cos(phase - trailDirection * 0.15) * spread;
				trailFrom = { x: axisX, y: baseY + direction * prevWobble };
			}
		}

		drawOrbitalParticle(
			ctx,
			x,
			y,
			energyNorm,
			settings,
			particleColor,
			trailFrom
		);
	}

	// Faint axis guide
	if (settings.spectrumOpacity > 0.25) {
		ctx.save();
		ctx.globalAlpha = settings.spectrumOpacity * 0.12;
		ctx.strokeStyle = getColor(settings, runtime.rotation / (Math.PI * 2));
		ctx.lineWidth = 1;
		ctx.shadowBlur = 0;
		ctx.beginPath();
		if (isVertical) {
			ctx.moveTo(baseX, axisStart);
			ctx.lineTo(baseX, axisStart + totalSpan);
		} else {
			ctx.moveTo(axisStart, baseY);
			ctx.lineTo(axisStart + totalSpan, baseY);
		}
		ctx.stroke();
		ctx.restore();
	}

	ctx.restore();
}
