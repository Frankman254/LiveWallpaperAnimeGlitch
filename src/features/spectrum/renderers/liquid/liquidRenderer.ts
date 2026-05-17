import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import { getLinearBase } from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	getShapedRadiusAtAngle,
	getSpectrumRadialAngleRad,
	RADIAL_SHAPE_SAMPLE_PHASE
} from '@/features/spectrum/geometry/radialGeometry';
import {
	getSpectrumLiquidLayerParams,
	SPECTRUM_LIQUID_LAYER_COUNT,
	type SpectrumLiquidLayerIndex
} from '@/features/spectrum/spectrumLiquidLayers';

const RADIAL_STEPS = 128;
const LINEAR_STEPS = 120;

/**
 * Draw layered liquid/fluid waves that deform with audio frequency data.
 * Each layer has its own opacity, amplitude, fill, and wobble speed.
 */
export function drawLiquid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const w = canvas.width;
	const h = canvas.height;
	const barCount = Math.max(runtime.pixelHeights.length, 1);
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

	for (let layer = 0; layer < SPECTRUM_LIQUID_LAYER_COUNT; layer++) {
		const layerIndex = layer as SpectrumLiquidLayerIndex;
		const params = getSpectrumLiquidLayerParams(settings, layerIndex);
		const phaseOffset = (layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1)) * Math.PI * 0.66;
		const alpha = settings.spectrumOpacity * params.opacity;
		const layerColor = getColor(
			settings,
			layer / SPECTRUM_LIQUID_LAYER_COUNT + t * 0.05 + phaseOffset / (Math.PI * 2)
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth =
			settings.spectrumBarWidth * (1.5 - layer * 0.2) * (0.65 + params.amp * 0.35);
		ctx.lineCap = 'round';
		ctx.shadowColor = layerColor;
		ctx.shadowBlur =
			settings.spectrumShadowBlur *
			settings.spectrumGlowIntensity *
			(1 - layer * 0.18);

		const points: [number, number][] = [];

		for (let step = 0; step <= LINEAR_STEPS; step++) {
			const frac = step / LINEAR_STEPS;
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin =
				Math.sin(frac * Math.PI * 6 + t * params.speed * 1.2 + phaseOffset) * 0.15;
			const amp = (rawH * params.amp + waveSin) * maxH;

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

		ctx.beginPath();
		if (points.length > 0) {
			ctx.moveTo(points[0][0], points[0][1]);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i][0], points[i][1]);
			}
		}
		ctx.stroke();

		const layerFill =
			settings.spectrumWaveFillOpacity * params.fill;
		if (layerFill > 0.01 && points.length > 1) {
			if (isVertical) {
				ctx.lineTo(baseX, axisStart + totalSpan);
				ctx.lineTo(baseX, axisStart);
			} else {
				ctx.lineTo(axisStart + totalSpan, baseY);
				ctx.lineTo(axisStart, baseY);
			}
			ctx.closePath();
			ctx.save();
			ctx.globalAlpha *= layerFill;
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

function traceRadialLiquidContour(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	settings: SpectrumSettings,
	radiusAtAngle: (angle: number) => number
): void {
	for (let i = 0; i <= RADIAL_STEPS; i++) {
		const frac = i / RADIAL_STEPS;
		const angle = RADIAL_SHAPE_SAMPLE_PHASE + frac * Math.PI * 2;
		const r = radiusAtAngle(angle);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
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
	const cx =
		canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const pixelHeights = runtime.pixelHeights;
	const maxH = settings.spectrumMaxHeight;
	const baseR = settings.spectrumInnerRadius;
	const rotation = runtime.rotation;
	const radialAngleRad = getSpectrumRadialAngleRad(settings.spectrumRadialAngle);
	const shape = settings.spectrumRadialShape;

	const shapedRadius = (nominal: number, angle: number) =>
		getShapedRadiusAtAngle(shape, nominal, angle, radialAngleRad);

	for (let layer = 0; layer < SPECTRUM_LIQUID_LAYER_COUNT; layer++) {
		const layerIndex = layer as SpectrumLiquidLayerIndex;
		const params = getSpectrumLiquidLayerParams(settings, layerIndex);
		const phaseOffset = (layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1)) * Math.PI * 0.5;
		const alpha = settings.spectrumOpacity * params.opacity;
		const layerColor = getColor(
			settings,
			layer / SPECTRUM_LIQUID_LAYER_COUNT +
				rotation / (Math.PI * 2) +
				phaseOffset / (Math.PI * 2)
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth =
			settings.spectrumBarWidth * (1.5 - layer * 0.2) * (0.65 + params.amp * 0.35);
		ctx.shadowColor = layerColor;
		ctx.shadowBlur =
			settings.spectrumShadowBlur *
			settings.spectrumGlowIntensity *
			(1 - layer * 0.18);

		const outerRadiusAt = (angle: number) => {
			const sampleAngle = angle + rotation + phaseOffset;
			let frac =
				(sampleAngle - RADIAL_SHAPE_SAMPLE_PHASE) / (Math.PI * 2);
			frac = frac - Math.floor(frac);
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin =
				Math.sin(frac * Math.PI * 4 + t * params.speed + phaseOffset) * 0.12;
			const amp = (rawH * params.amp + waveSin) * maxH * 0.5;
			return shapedRadius(baseR + amp, angle);
		};

		const innerRadiusAt = (angle: number) =>
			shapedRadius(baseR * (0.92 + layer * 0.02), angle);

		ctx.beginPath();
		traceRadialLiquidContour(ctx, cx, cy, settings, outerRadiusAt);
		ctx.closePath();
		ctx.stroke();

		const layerFill =
			settings.spectrumWaveFillOpacity * params.fill;
		if (layerFill > 0.01) {
			ctx.beginPath();
			traceRadialLiquidContour(ctx, cx, cy, settings, outerRadiusAt);
			for (let i = RADIAL_STEPS; i >= 0; i--) {
				const frac = i / RADIAL_STEPS;
				const angle = RADIAL_SHAPE_SAMPLE_PHASE + frac * Math.PI * 2;
				const r = innerRadiusAt(angle);
				const x = cx + Math.cos(angle) * r;
				const y = cy + Math.sin(angle) * r;
				ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.save();
			ctx.globalAlpha *= layerFill;
			ctx.fill();
			ctx.restore();
		}

		ctx.restore();
	}
}
