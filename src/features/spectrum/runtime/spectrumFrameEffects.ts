import { getLinearBase, getLinearMetrics } from '@/features/spectrum/renderers/linear/linearRenderer';
import { createWaveGradient, getColor, hexToRgb, mixHexColors } from '@/features/spectrum/color/spectrumColor';
import { getRadialBaseRadius } from '@/features/spectrum/geometry/radialGeometry';
import type { PerformanceMode } from '@/types/wallpaper';
import {
	type SpectrumSettings,
	type SpectrumRuntimeState,
	copyCanvas,
	ensureSnapshotCanvas
} from './spectrumRuntime';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function rgba(color: string, alpha: number): string {
	const [r, g, b] = hexToRgb(color);
	return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function getHistoryDepth(performanceMode: PerformanceMode): number {
	switch (performanceMode) {
		case 'low':
			return 2;
		case 'high':
			return 4;
		case 'medium':
		default:
			return 3;
	}
}

function resolveTrailAngle(settings: SpectrumSettings, rotation: number): number {
	if (
		settings.spectrumFamily === 'tunnel' ||
		settings.spectrumFamily === 'orbital' ||
		settings.spectrumMode === 'radial'
	) {
		return rotation - Math.PI / 2;
	}

	if (settings.spectrumLinearOrientation === 'vertical') {
		return settings.spectrumLinearDirection === 'normal' ? 0 : Math.PI;
	}

	return settings.spectrumLinearDirection === 'normal'
		? -Math.PI / 2
		: Math.PI / 2;
}

function ensureHistoryCanvases(
	runtime: SpectrumRuntimeState,
	width: number,
	height: number,
	count: number
): Array<HTMLCanvasElement | null> {
	const existing = runtime.frameHistoryCanvases ?? [];
	const next = Array.from({ length: count }, (_, index) =>
		ensureSnapshotCanvas(existing[index] ?? null, width, height)
	);
	runtime.frameHistoryCanvases = next;
	if (
		typeof runtime.frameHistoryIndex !== 'number' ||
		runtime.frameHistoryIndex < 0 ||
		runtime.frameHistoryIndex >= count
	) {
		runtime.frameHistoryIndex = 0;
	}
	return next;
}

function drawSmoothPath(
	ctx: CanvasRenderingContext2D,
	points: Array<[number, number]>
): void {
	if (points.length === 0) return;
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);
	for (let index = 1; index < points.length - 1; index += 1) {
		const mx = (points[index][0] + points[index + 1][0]) / 2;
		const my = (points[index][1] + points[index + 1][1]) / 2;
		ctx.quadraticCurveTo(points[index][0], points[index][1], mx, my);
	}
	if (points.length > 1) {
		const last = points[points.length - 1];
		ctx.lineTo(last[0], last[1]);
	}
	ctx.stroke();
}

export function drawSpectrumFrameMemoryUnderlay(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	energyNormalized: number,
	performanceMode: PerformanceMode
): void {
	const width = canvas.width;
	const height = canvas.height;
	const historyDepth = getHistoryDepth(performanceMode);
	const afterglow = clamp(settings.spectrumAfterglow, 0, 1);
	const ghostFrames = clamp(settings.spectrumGhostFrames, 0, 1);
	const motionTrails = clamp(settings.spectrumMotionTrails, 0, 1);

	if (afterglow > 0.001 && runtime.feedbackCanvas) {
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = 0.08 + afterglow * 0.22;
		const blurPx =
			performanceMode === 'low' ? 0 : Math.max(0, afterglow * 10);
		if (blurPx > 0.5) {
			ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
		}
		ctx.drawImage(runtime.feedbackCanvas, 0, 0, width, height);
		ctx.restore();
	}

	if (ghostFrames <= 0.001 && motionTrails <= 0.001) return;

	const trailAngle = resolveTrailAngle(settings, runtime.rotation);
	const trailDrift = (3 + energyNormalized * 14) * motionTrails;
	const historyCanvases = ensureHistoryCanvases(
		runtime,
		width,
		height,
		historyDepth
	);
	const writeIndex = runtime.frameHistoryIndex ?? 0;

	for (let age = 1; age <= historyDepth; age += 1) {
		const historyIndex =
			(writeIndex - age + historyCanvases.length) % historyCanvases.length;
		const historyCanvas = historyCanvases[historyIndex];
		if (!historyCanvas) continue;

		const ageFactor = 1 - (age - 1) / Math.max(historyDepth, 1);
		const alpha =
			ghostFrames * (0.08 + ageFactor * 0.12) +
			motionTrails * (0.05 + ageFactor * 0.1);
		if (alpha <= 0.002) continue;

		const drift = trailDrift * age;
		const offsetX = Math.cos(trailAngle) * drift;
		const offsetY = Math.sin(trailAngle) * drift;

		ctx.save();
		ctx.globalCompositeOperation = motionTrails > 0.001 ? 'lighter' : 'source-over';
		ctx.globalAlpha = clamp(alpha, 0, 0.42);
		const blurPx =
			performanceMode === 'low'
				? 0
				: Math.max(0, motionTrails * age * 1.8 + ghostFrames * 1.1);
		if (blurPx > 0.5) {
			ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
		}
		ctx.translate(offsetX, offsetY);
		ctx.drawImage(historyCanvas, 0, 0, width, height);
		ctx.restore();
	}
}

export function drawSpectrumEnergyBloom(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	energyNormalized: number,
	cx: number,
	cy: number
): void {
	const intensity = clamp(settings.spectrumEnergyBloom, 0, 2);
	if (intensity <= 0.001) return;

	const radius =
		Math.max(80, settings.spectrumInnerRadius * 0.9) +
		settings.spectrumMaxHeight * (0.7 + intensity * 0.18) +
		energyNormalized * (90 + intensity * 36);
	const coreColor = mixHexColors(
		settings.spectrumPrimaryColor,
		settings.spectrumSecondaryColor,
		0.35 + energyNormalized * 0.25
	);
	const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
	gradient.addColorStop(
		0,
		rgba(coreColor, (0.06 + energyNormalized * 0.16) * intensity)
	);
	gradient.addColorStop(
		0.45,
		rgba(settings.spectrumSecondaryColor, (0.04 + energyNormalized * 0.08) * intensity)
	);
	gradient.addColorStop(1, rgba(settings.spectrumPrimaryColor, 0));

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();
}

export function drawSpectrumPeakRibbons(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	cx: number,
	cy: number
): void {
	const intensity = clamp(settings.spectrumPeakRibbons, 0, 1.5);
	if (intensity <= 0.001) return;
	if (settings.spectrumFamily === 'spectrogram') return;

	const peaks = settings.spectrumPeakHold
		? runtime.pixelPeaks
		: runtime.pixelHeights;
	if (!peaks.length) return;

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.globalAlpha = clamp(settings.spectrumOpacity * (0.16 + intensity * 0.28), 0, 0.72);
	ctx.lineWidth = Math.max(1, settings.spectrumBarWidth * (0.7 + intensity * 0.9));
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.shadowColor = settings.spectrumSecondaryColor;
	ctx.shadowBlur =
		settings.spectrumShadowBlur * Math.max(0.25, 0.25 + intensity * 0.25);

	const radialLike =
		settings.spectrumFamily === 'tunnel' ||
		settings.spectrumFamily === 'orbital' ||
		settings.spectrumMode === 'radial';

	if (radialLike) {
		ctx.strokeStyle = createWaveGradient(
			ctx,
			canvas,
			settings,
			'radial',
			cx,
			cy,
			settings.spectrumInnerRadius + settings.spectrumMaxHeight,
			runtime.rotation
		);
		ctx.beginPath();
		for (let index = 0; index <= peaks.length; index += 1) {
			const safeIndex = index % peaks.length;
			const t = safeIndex / Math.max(peaks.length - 1, 1);
			const angle = t * Math.PI * 2 + runtime.rotation;
			const radius =
				getRadialBaseRadius(
					settings.spectrumRadialShape,
					settings.spectrumInnerRadius,
					angle,
					(settings.spectrumRadialAngle * Math.PI) / 180
				) +
				peaks[safeIndex] +
				intensity * 4;
			const x = cx + Math.cos(angle) * radius;
			const y = cy + Math.sin(angle) * radius;
			if (index === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
		return;
	}

	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(canvas, settings, peaks.length);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	ctx.strokeStyle = createWaveGradient(
		ctx,
		canvas,
		settings,
		settings.spectrumLinearOrientation
	);

	const mainPoints: Array<[number, number]> = [];
	const mirrorPoints: Array<[number, number]> = [];

	for (let index = 0; index < peaks.length; index += 1) {
		const offset = start + index * stride + settings.spectrumBarWidth * 0.5;
		const peak = peaks[index] + intensity * 2.5;
		if (settings.spectrumLinearOrientation === 'vertical') {
			mainPoints.push([baseX + peak * direction, offset]);
			mirrorPoints.push([baseX - peak * direction, offset]);
		} else {
			mainPoints.push([offset, baseY + peak * direction]);
			mirrorPoints.push([offset, baseY - peak * direction]);
		}
	}

	drawSmoothPath(ctx, mainPoints);
	if (settings.spectrumMirror) {
		drawSmoothPath(ctx, mirrorPoints);
	}
	ctx.restore();
}

export function updateSpectrumShockwavesAndDraw(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number,
	channelInstant: number,
	energyNormalized: number,
	cx: number,
	cy: number,
	performanceMode: PerformanceMode
): void {
	const intensity = clamp(settings.spectrumBassShockwave, 0, 1.5);
	if (intensity <= 0.001) return;

	const shockwaves = runtime.shockwaves ?? [];
	runtime.shockwaves = shockwaves;

	const lastLevel = runtime.lastShockwaveLevel ?? 0;
	const lastTime = runtime.lastShockwaveTime ?? Number.NEGATIVE_INFINITY;
	const risingEdge = channelInstant - lastLevel;
	const threshold = 0.24 + (1 - Math.min(1, intensity / 1.5)) * 0.16;
	const cooldown = performanceMode === 'low' ? 0.24 : 0.16;

	if (
		channelInstant > threshold &&
		risingEdge > 0.05 &&
		runtime.idleTime - lastTime > cooldown
	) {
		shockwaves.push({
			radius: Math.max(24, settings.spectrumInnerRadius * 0.8),
			alpha: clamp(0.2 + intensity * 0.24 + energyNormalized * 0.18, 0, 0.9),
			thickness: 2 + intensity * 6 + energyNormalized * 10,
			speed: 160 + intensity * 140 + energyNormalized * 100
		});
		runtime.lastShockwaveTime = runtime.idleTime;
		if (performanceMode === 'low' && shockwaves.length > 2) {
			shockwaves.splice(0, shockwaves.length - 2);
		}
	}

	runtime.lastShockwaveLevel = channelInstant;

	if (shockwaves.length === 0) return;

	for (let index = shockwaves.length - 1; index >= 0; index -= 1) {
		const wave = shockwaves[index];
		wave.radius += wave.speed * dt;
		wave.alpha *= Math.exp(-dt * 2.8);
		if (wave.alpha <= 0.01 || wave.radius > Math.max(canvas.width, canvas.height) * 1.1) {
			shockwaves.splice(index, 1);
			continue;
		}

		const color = getColor(settings, (runtime.idleTime * 0.07 + index * 0.14) % 1);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.globalAlpha = wave.alpha;
		ctx.lineWidth = wave.thickness;
		ctx.strokeStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = settings.spectrumShadowBlur * 0.45 + wave.thickness * 1.4;
		ctx.beginPath();
		if (settings.spectrumMode === 'linear') {
			const radiusX =
				settings.spectrumLinearOrientation === 'vertical'
					? wave.radius * 0.68
					: wave.radius * 1.18;
			const radiusY =
				settings.spectrumLinearOrientation === 'vertical'
					? wave.radius * 1.18
					: wave.radius * 0.68;
			ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
		} else {
			ctx.arc(cx, cy, wave.radius, 0, Math.PI * 2);
		}
		ctx.stroke();
		ctx.restore();
	}
}

export function commitSpectrumFrameMemory(
	runtime: SpectrumRuntimeState,
	canvas: HTMLCanvasElement,
	performanceMode: PerformanceMode
): void {
	const width = canvas.width;
	const height = canvas.height;
	const historyDepth = getHistoryDepth(performanceMode);
	runtime.feedbackCanvas = ensureSnapshotCanvas(
		runtime.feedbackCanvas ?? null,
		width,
		height
	);
	copyCanvas(canvas, runtime.feedbackCanvas ?? null);

	const historyCanvases = ensureHistoryCanvases(
		runtime,
		width,
		height,
		historyDepth
	);
	if (historyCanvases.length === 0) return;
	const writeIndex = runtime.frameHistoryIndex ?? 0;
	copyCanvas(canvas, historyCanvases[writeIndex] ?? null);
	runtime.frameHistoryIndex = (writeIndex + 1) % historyCanvases.length;
}
