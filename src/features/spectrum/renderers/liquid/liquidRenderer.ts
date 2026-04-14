import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { hexToRgb } from '@/features/spectrum/color/spectrumColor';

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

	const [arR, arG, arB] = hexToRgb(settings.spectrumPrimaryColor) ?? [0, 255, 255];
	const [brR, brG, brB] = hexToRgb(settings.spectrumSecondaryColor) ?? [255, 0, 255];
	const colorA = { r: arR, g: arG, b: arB };
	const colorB = { r: brR, g: brG, b: brB };

	ctx.save();

	if (isRadial) {
		_drawRadialLiquid(ctx, canvas, runtime, settings, colorA, colorB, t, barCount);
	} else {
		_drawLinearLiquid(ctx, canvas, runtime, settings, colorA, colorB, t, barCount, w, h);
	}

	ctx.restore();
}

function _drawLinearLiquid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	colorA: { r: number; g: number; b: number },
	colorB: { r: number; g: number; b: number },
	t: number,
	barCount: number,
	w: number,
	h: number
): void {
	const pixelHeights = runtime.pixelHeights;
	const posNormX = settings.spectrumPositionX ?? 0;
	const posNormY = settings.spectrumPositionY ?? 0;
	const centerY = h / 2 - posNormY * h * 0.5;
	const span = settings.spectrumSpan ?? 1;
	const spanW = w * span;
	const startX = w / 2 + posNormX * w * 0.5 - spanW / 2;
	const maxH = settings.spectrumMaxHeight;
	const steps = 120;

	for (let layer = 0; layer < WAVE_LAYERS; layer++) {
		const layerT = layer / Math.max(WAVE_LAYERS - 1, 1); // 0..1
		const phaseOffset = layerT * Math.PI * 0.66;
		const speedMult = 1 - layerT * 0.3;
		const ampMult = 1 - layerT * 0.35;
		const alpha = settings.spectrumOpacity * (0.55 + (1 - layerT) * 0.45);

		// Color per layer: blend from colorA to colorB
		const lr = Math.round(colorA.r * (1 - layerT) + colorB.r * layerT);
		const lg = Math.round(colorA.g * (1 - layerT) + colorB.g * layerT);
		const lb = Math.round(colorA.b * (1 - layerT) + colorB.b * layerT);
		const layerColor = settings.spectrumColorMode === 'solid'
			? settings.spectrumPrimaryColor
			: `rgb(${lr},${lg},${lb})`;

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth = settings.spectrumBarWidth * (1.5 - layerT * 0.5);
		ctx.lineCap = 'round';
		ctx.shadowColor = layerColor;
		ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity * (1 - layerT * 0.5);

		ctx.beginPath();
		const points: [number, number][] = [];

		for (let step = 0; step <= steps; step++) {
			const frac = step / steps;
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			// Add a sinusoidal base movement and audio reactivity
			const waveSin = Math.sin(frac * Math.PI * 6 + t * speedMult * 1.2 + phaseOffset) * 0.15;
			const amp = (rawH * ampMult + waveSin) * maxH;
			const x = startX + frac * spanW;
			const y = centerY - amp;
			points.push([x, y]);
		}

		// Draw smooth path using bezier curves
		if (points.length > 2) {
			ctx.moveTo(points[0][0], points[0][1]);
			for (let i = 1; i < points.length - 1; i++) {
				const mx = (points[i][0] + points[i + 1][0]) / 2;
				const my = (points[i][1] + points[i + 1][1]) / 2;
				ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
			}
			ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
		}
		ctx.stroke();

		// Wave fill
		if (settings.spectrumWaveFillOpacity > 0.01) {
			ctx.lineTo(startX + spanW, centerY);
			ctx.lineTo(startX, centerY);
			ctx.closePath();
			ctx.save();
			ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
			ctx.fill();
			ctx.restore();
		}

		// Mirror wave
		if (settings.spectrumMirror) {
			ctx.beginPath();
			const mirrorPoints = points.map(([x, y]): [number, number] => [x, centerY + (centerY - y)]);
			if (mirrorPoints.length > 2) {
				ctx.moveTo(mirrorPoints[0][0], mirrorPoints[0][1]);
				for (let i = 1; i < mirrorPoints.length - 1; i++) {
					const mx = (mirrorPoints[i][0] + mirrorPoints[i + 1][0]) / 2;
					const my = (mirrorPoints[i][1] + mirrorPoints[i + 1][1]) / 2;
					ctx.quadraticCurveTo(mirrorPoints[i][0], mirrorPoints[i][1], mx, my);
				}
				ctx.lineTo(mirrorPoints[mirrorPoints.length - 1][0], mirrorPoints[mirrorPoints.length - 1][1]);
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
	colorA: { r: number; g: number; b: number },
	colorB: { r: number; g: number; b: number },
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

		const lr = Math.round(colorA.r * (1 - layerT) + colorB.r * layerT);
		const lg = Math.round(colorA.g * (1 - layerT) + colorB.g * layerT);
		const lb = Math.round(colorA.b * (1 - layerT) + colorB.b * layerT);
		const layerColor = settings.spectrumColorMode === 'solid'
			? settings.spectrumPrimaryColor
			: `rgb(${lr},${lg},${lb})`;

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
