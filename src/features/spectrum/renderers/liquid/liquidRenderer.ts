import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import {
	getLinearBase,
	resolveGlowReach,
	resolveManualGlow
} from '@/features/spectrum/renderers/linear/linearRenderer';
import {
	getRadialShapeDefinition,
	getShapedRadiusAtAngle,
	getSpectrumRadialAngleRad,
	RADIAL_SHAPE_SAMPLE_PHASE
} from '@/features/spectrum/geometry/radialGeometry';
import {
	anyLiquidLayerRigid,
	getSpectrumLiquidLayerParams,
	SPECTRUM_LIQUID_LAYER_COUNT,
	type SpectrumLiquidLayerIndex
} from '@/features/spectrum/spectrumLiquidLayers';

// Halved from 128/120. Liquid contours are smooth blobs (no sharp vertices
// like star), so 64 samples is visually indistinguishable from 128 at
// typical viewport sizes — pure perf win for the layered shadow stack.
const RADIAL_STEPS = 64;
const LINEAR_STEPS = 64;
const RIGID_RADIAL_STEP_MULTIPLIER = 3;

/**
 * Shared glow-blur cap for the 3 liquid layers.
 *
 * Each layer draws a shadowed stroke + an optional shadowed fill = up to 6
 * shadow passes per frame. The original code multiplied `shadowBlur ×
 * glowIntensity × (1 - layer * 0.18)` with no upper bound — at max
 * settings (60 × 3 = 180), even the dimmest layer ran 110px blur per pass.
 * Caps modeled after Classic's helper but stricter because liquid stacks
 * full-canvas filled blobs, not stroke outlines.
 */
function computeLiquidGlowBlur(
	settings: SpectrumSettings,
	layerDepthFactor: number,
	rigidShape = false,
	activeLayerCount = 1
): number {
	// Heavy-composition cap: every visible liquid layer adds a shadowed pass,
	// and the clone instance stacks even more onto the same canvas. Scale the
	// per-layer blur down as the stack grows so total bloom — and the GPU cost
	// of the shadow passes — stays bounded. 1 layer is unchanged; 2 layers run
	// ~71% blur each, 3 layers ~58%.
	const stackScale = 1 / Math.sqrt(Math.max(1, activeLayerCount));
	const requested =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings) *
		layerDepthFactor *
		stackScale;
	return Math.min(requested, rigidShape ? 10 : 28);
}

/** Count liquid layers that will actually draw (alpha above the cull threshold). */
function countActiveLiquidLayers(settings: SpectrumSettings): number {
	let count = 0;
	for (let layer = 0; layer < SPECTRUM_LIQUID_LAYER_COUNT; layer++) {
		const params = getSpectrumLiquidLayerParams(
			settings,
			layer as SpectrumLiquidLayerIndex
		);
		if (settings.spectrumOpacity * params.opacity > 0.001) count++;
	}
	return Math.max(1, count);
}

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
	if (settings.spectrumOpacity <= 0.001) return;
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
	const activeLayerCount = countActiveLiquidLayers(settings);

	for (let layer = 0; layer < SPECTRUM_LIQUID_LAYER_COUNT; layer++) {
		const layerIndex = layer as SpectrumLiquidLayerIndex;
		const params = getSpectrumLiquidLayerParams(settings, layerIndex);
		const phaseOffset =
			(layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1)) *
			Math.PI *
			0.66;
		const alpha = settings.spectrumOpacity * params.opacity;
		if (alpha <= 0.001) continue;
		const layerColor = getColor(
			settings,
			layer / SPECTRUM_LIQUID_LAYER_COUNT +
				t * 0.05 +
				phaseOffset / (Math.PI * 2)
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.strokeStyle = layerColor;
		ctx.fillStyle = layerColor;
		ctx.lineWidth =
			settings.spectrumBarWidth *
			(1.5 - layer * 0.2) *
			(0.65 + params.amp * 0.35);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.miterLimit = 2;
		ctx.shadowColor = resolveManualGlow(
			settings,
			layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1),
			layerColor
		).core;
		ctx.shadowBlur = computeLiquidGlowBlur(
			settings,
			1 - layer * 0.18,
			false,
			activeLayerCount
		);

		const points: [number, number][] = [];

		for (let step = 0; step <= LINEAR_STEPS; step++) {
			const frac = step / LINEAR_STEPS;
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin =
				Math.sin(
					frac * Math.PI * 6 + t * params.speed * 1.2 + phaseOffset
				) * 0.15;
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

		const layerFill = settings.spectrumWaveFillOpacity * params.fill;
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
			// Fill area glow is largely hidden behind the stroke's glow but
			// costs a full shadowed pass over a large region — skip it.
			ctx.shadowBlur = 0;
			ctx.fill();
			ctx.restore();
		}

		if (settings.spectrumMirror && points.length > 0) {
			ctx.beginPath();
			const mirrorPoints: [number, number][] = points.map(([x, y]) =>
				isVertical ? [baseX + (baseX - x), y] : [x, baseY + (baseY - y)]
			);
			ctx.moveTo(mirrorPoints[0][0], mirrorPoints[0][1]);
			for (let i = 1; i < mirrorPoints.length; i++) {
				ctx.lineTo(mirrorPoints[i][0], mirrorPoints[i][1]);
			}
			ctx.stroke();

			// Mirror the wave fill too — previously only the stroke was cloned,
			// so the mirrored side showed a thin outline (bar width) with no
			// filled body even when Wave Fill was on. Close the mirrored
			// contour back to the baseline and fill it the same way as the
			// main side.
			if (layerFill > 0.01 && mirrorPoints.length > 1) {
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
				ctx.shadowBlur = 0;
				ctx.fill();
				ctx.restore();
			}
		}

		ctx.restore();
	}
}

function traceRadialLiquidContour(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	settings: SpectrumSettings,
	radiusAtAngle: (angle: number) => number,
	steps = RADIAL_STEPS,
	includeEndpoint = true
): void {
	const lastStep = includeEndpoint ? steps : steps - 1;
	for (let i = 0; i <= lastStep; i++) {
		const frac = i / steps;
		const angle = RADIAL_SHAPE_SAMPLE_PHASE + frac * Math.PI * 2;
		const r = radiusAtAngle(angle);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
}

function traceRadialLiquidContourReverse(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	radiusAtAngle: (angle: number) => number,
	steps = RADIAL_STEPS,
	includeEndpoint = true
): void {
	const firstStep = includeEndpoint ? steps : steps - 1;
	for (let i = firstStep; i >= 0; i--) {
		const frac = i / steps;
		const angle = RADIAL_SHAPE_SAMPLE_PHASE + frac * Math.PI * 2;
		const r = radiusAtAngle(angle);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === firstStep) ctx.moveTo(x, y);
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
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const pixelHeights = runtime.pixelHeights;
	const maxH = settings.spectrumMaxHeight;
	const baseR = settings.spectrumInnerRadius;
	const rotation = runtime.rotation;
	const radialAngleRad = getSpectrumRadialAngleRad(
		settings.spectrumRadialAngle
	);
	const shape = settings.spectrumRadialShape;
	const activeLayerCount = countActiveLiquidLayers(settings);
	let meanEnergyNorm = 0;
	if (anyLiquidLayerRigid(settings)) {
		for (let i = 0; i < barCount; i++) {
			meanEnergyNorm += (pixelHeights[i] ?? 0) / Math.max(maxH, 1);
		}
		meanEnergyNorm = Math.min(1, meanEnergyNorm / Math.max(barCount, 1));
	}

	for (let layer = 0; layer < SPECTRUM_LIQUID_LAYER_COUNT; layer++) {
		const layerIndex = layer as SpectrumLiquidLayerIndex;
		const params = getSpectrumLiquidLayerParams(settings, layerIndex);
		const alpha = settings.spectrumOpacity * params.opacity;
		if (alpha <= 0.001) continue;
		const rigidShape = params.rigidShape;
		const phaseOffset =
			(layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1)) *
			Math.PI *
			0.5;
		const layerRadialAngleRad =
			radialAngleRad + (rigidShape ? t * params.rotationSpeed : 0);
		const shapedRadius = (nominal: number, angle: number) =>
			getShapedRadiusAtAngle(
				params.shape ?? shape,
				nominal,
				angle,
				layerRadialAngleRad
			);
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
			settings.spectrumBarWidth *
			(1.5 - layer * 0.2) *
			(0.65 + params.amp * 0.35);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.miterLimit = 2;
		ctx.shadowColor = resolveManualGlow(
			settings,
			layer / Math.max(SPECTRUM_LIQUID_LAYER_COUNT - 1, 1),
			layerColor
		).core;
		ctx.shadowBlur = computeLiquidGlowBlur(
			settings,
			1 - layer * 0.18,
			rigidShape,
			activeLayerCount
		);
		const contourSteps = rigidShape
			? Math.max(
					RADIAL_STEPS * RIGID_RADIAL_STEP_MULTIPLIER,
					getRadialShapeDefinition(params.shape ?? shape)
						.tunnelSegments * RIGID_RADIAL_STEP_MULTIPLIER
				)
			: RADIAL_STEPS;

		const outerRadiusAt = (angle: number) => {
			if (rigidShape) {
				const amp = meanEnergyNorm * params.amp * maxH * 0.5;
				return shapedRadius(baseR + amp, angle);
			}
			const sampleAngle = angle + rotation + phaseOffset;
			let frac =
				(sampleAngle - RADIAL_SHAPE_SAMPLE_PHASE) / (Math.PI * 2);
			frac = frac - Math.floor(frac);
			const binIdx = Math.floor(frac * (barCount - 1));
			const rawH = (pixelHeights[binIdx] ?? 0) / Math.max(maxH, 1);
			const waveSin =
				Math.sin(frac * Math.PI * 4 + t * params.speed + phaseOffset) *
				0.12;
			const amp = (rawH * params.amp + waveSin) * maxH * 0.5;
			return shapedRadius(baseR + amp, angle);
		};

		const innerRadiusAt = (angle: number) =>
			shapedRadius(baseR * (0.92 + layer * 0.02), angle);

		ctx.beginPath();
		// Closed paths must not duplicate the first point before closePath().
		// Duplicating it creates a brighter shadow/glow seam at the radial
		// split, especially on rigid angular shapes.
		traceRadialLiquidContour(
			ctx,
			cx,
			cy,
			settings,
			outerRadiusAt,
			contourSteps,
			false
		);
		ctx.closePath();
		ctx.stroke();

		const layerFill = settings.spectrumWaveFillOpacity * params.fill;
		if (layerFill > 0.01) {
			ctx.beginPath();
			// Non-rigid liquid is an annulus. Keep outer/inner contours as
			// separate closed subpaths and fill with even-odd; connecting them
			// with a radial line creates the visible "cut" through the layer.
			traceRadialLiquidContour(
				ctx,
				cx,
				cy,
				settings,
				outerRadiusAt,
				contourSteps,
				false
			);
			ctx.closePath();
			if (!rigidShape) {
				traceRadialLiquidContourReverse(
					ctx,
					cx,
					cy,
					innerRadiusAt,
					contourSteps,
					false
				);
				ctx.closePath();
			}
			ctx.save();
			ctx.globalAlpha *= layerFill;
			// Fill area glow is largely hidden behind the stroke's glow but
			// costs a full shadowed pass over a large region — skip it for
			// both rigid and fluid layers.
			ctx.shadowBlur = 0;
			ctx.fill(rigidShape ? 'nonzero' : 'evenodd');
			ctx.restore();
		}

		ctx.restore();
	}
}
