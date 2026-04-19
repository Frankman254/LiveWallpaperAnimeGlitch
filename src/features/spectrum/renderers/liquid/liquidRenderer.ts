import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import { getLinearBase } from '@/features/spectrum/renderers/linear/linearRenderer';

const WAVE_LAYERS = 3;

/**
 * Draw layered liquid/fluid waves that deform with audio frequency data.
 * Each layer uses a subset of frequency bands to drive wave amplitude.
 */
export function drawLiquid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const w = canvas.width;
	const h = canvas.height;
	const pixelHeights = runtime.pixelHeights;
	const barCount = Math.max(pixelHeights.length, 1);
	const t = runtime.idleTime;
	const isRadial = settings.spectrumMode === 'radial';

	ctx.save();

	if (isRadial) {
		_drawRadialLiquid(ctx, canvas, runtime, settings, t, barCount);
	} else {
		_drawLinearLiquid(ctx, canvas, runtime, settings, t, barCount, w, h);
	}

	ctx.restore();
}

function _drawLinearLiquid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	t: number,
	barCount: number,
	w: number,
	h: number
): void {
	const pixelHeights = runtime.pixelHeights;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const spanF = Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const totalSpan = (isVertical ? h : w) * spanF;
	const axisStart = isVertical ? (h - totalSpan) / 2 : (w - totalSpan) / 2;
	const maxH = settings.spectrumMaxHeight;
	const steps = 120;

	for (let layer = 0; layer < WAVE_LAYERS; layer++) {
		const layerT = layer / Math.max(WAVE_LAYERS - 1, 1); // 0..1
		const phaseOffset = layerT * Math.PI * 0.66;
		const speedMult = 1 - layerT * 0.3;
		const ampMult = 1 - layerT * 0.35;
		const alpha = settings.spectrumOpacity * (0.55 + (1 - layerT) * 0.45);
		const layerColor = getColor(
			settings,
			layerT + t * 0.05 + phaseOffset / (Math.PI * 2)
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth = settings.spectrumBarWidth * (1.5 - layerT * 0.5);
		ctx.lineCap = 'round';
		ctx.shadowColor = layerColor;
		ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity * (1 - layerT * 0.5);

		const points: [number, number][] = [];

		for (let step = 0; step <= steps; step++) {
			const frac = step / steps;
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin =
				Math.sin(frac * Math.PI * 6 + t * speedMult * 1.2 + phaseOffset) * 0.15;
			const amp = (rawH * ampMult + waveSin) * maxH;

			if (isVertical) {
				const y = axisStart + frac * totalSpan;
				const x = baseX + direction * amp;
				points.push([x, y]);
			} else {
				const x = axisStart + frac * totalSpan;
				const y = baseY + direction * amp;
				points.push([x, y]);
			}
		}

		// Polyline (no quadratic beziers — avoids elliptical bulging between bins)
		ctx.beginPath();
		if (points.length > 0) {
			ctx.moveTo(points[0][0], points[0][1]);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i][0], points[i][1]);
			}
		}
		ctx.stroke();

		if (settings.spectrumWaveFillOpacity > 0.01 && points.length > 1) {
			if (isVertical) {
				ctx.lineTo(baseX, axisStart + totalSpan);
				ctx.lineTo(baseX, axisStart);
			} else {
				ctx.lineTo(axisStart + totalSpan, baseY);
				ctx.lineTo(axisStart, baseY);
			}
			ctx.closePath();
			ctx.save();
			ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
			ctx.fill();
			ctx.restore();
		}

		if (settings.spectrumMirror && points.length > 0) {
			ctx.beginPath();
			const mirrorPoints: [number, number][] = points.map(([x, y]) =>
				isVertical
					? [baseX + (baseX - x), y]
					: [x, baseY + (baseY - y)]
			);
			ctx.moveTo(mirrorPoints[0][0], mirrorPoints[0][1]);
			for (let i = 1; i < mirrorPoints.length; i++) {
				ctx.lineTo(mirrorPoints[i][0], mirrorPoints[i][1]);
			}
			ctx.stroke();
		}

		ctx.restore();
	}
}

function _drawRadialLiquid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	t: number,
	barCount: number
): void {
	const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const pixelHeights = runtime.pixelHeights;
	const maxH = settings.spectrumMaxHeight;
	const baseR = settings.spectrumInnerRadius;
	const rotation = runtime.rotation;
	const N = 128; // angular resolution

	for (let layer = 0; layer < WAVE_LAYERS; layer++) {
		const layerT = layer / Math.max(WAVE_LAYERS - 1, 1);
		const phaseOffset = layerT * Math.PI * 0.5;
		const speedMult = 1 - layerT * 0.25;
		const ampMult = 1 - layerT * 0.3;
		const alpha = settings.spectrumOpacity * (0.55 + (1 - layerT) * 0.45);
		const layerColor = getColor(
			settings,
			layerT + rotation / (Math.PI * 2) + phaseOffset / (Math.PI * 2)
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth = settings.spectrumBarWidth * (1.5 - layerT * 0.5);
		ctx.shadowColor = layerColor;
		ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

		ctx.beginPath();
		for (let i = 0; i <= N; i++) {
			const frac = i / N;
			const angle = frac * Math.PI * 2 + rotation + phaseOffset;
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin = Math.sin(frac * Math.PI * 4 + t * speedMult + phaseOffset) * 0.12;
			const amp = (rawH * ampMult + waveSin) * maxH * 0.5;
			const r = baseR + amp;
			const x = cx + Math.cos(angle) * r;
			const y = cy + Math.sin(angle) * r;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();

		if (settings.spectrumWaveFillOpacity > 0.01) {
			ctx.save();
			ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
			ctx.fill();
			ctx.restore();
		}

		ctx.restore();
	}
}
