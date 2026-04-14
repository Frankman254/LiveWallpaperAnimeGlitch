import { getColor, createWaveGradient } from '../../color/spectrumColor';
import type { SpectrumLinearDirection, SpectrumLinearOrientation } from '@/types/wallpaper';
import type { SpectrumSettings } from '../../runtime/spectrumRuntime';

export function resolveLinearDirection(
	orientation: SpectrumLinearOrientation,
	direction: SpectrumLinearDirection
): 1 | -1 {
	if (orientation === 'vertical') {
		return direction === 'normal' ? 1 : -1;
	}
	return direction === 'normal' ? -1 : 1;
}

export function getLinearBase(
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings
): { baseX: number; baseY: number; direction: 1 | -1 } {
	const baseX =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const baseY =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	return {
		baseX,
		baseY,
		direction: resolveLinearDirection(
			settings.spectrumLinearOrientation,
			settings.spectrumLinearDirection
		)
	};
}

export function getLinearMetrics(
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	barCount: number
) {
	const totalSpan =
		(settings.spectrumLinearOrientation === 'vertical'
			? canvas.height
			: canvas.width) *
		Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const gap = Math.max(
		0,
		totalSpan / Math.max(barCount, 1) - settings.spectrumBarWidth
	);
	const stride = settings.spectrumBarWidth + gap;
	const totalLength = Math.max(0, barCount * stride - gap);
	return { totalSpan, gap, stride, totalLength };
}

function drawPeakMarker(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
) {
	ctx.fillStyle = '#ffffff';
	ctx.shadowBlur = 0;
	ctx.fillRect(x, y, width, height);
}

export function drawLinearBars(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	peaks: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const showMirror = settings.spectrumMirror;

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		const h = heights[i];
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur =
			settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride;
			ctx.fillRect(baseX, y, h * direction, settings.spectrumBarWidth);
			if (showMirror)
				ctx.fillRect(
					baseX,
					y,
					h * -direction,
					settings.spectrumBarWidth
				);
			if (
				settings.spectrumPeakHold &&
				peaks[i] > settings.spectrumMinHeight + 1
			) {
				drawPeakMarker(
					ctx,
					baseX + peaks[i] * direction,
					y,
					2 * direction,
					settings.spectrumBarWidth
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						baseX - peaks[i] * direction,
						y,
						-2 * direction,
						settings.spectrumBarWidth
					);
			}
		} else {
			const x = start + i * stride;
			ctx.fillRect(x, baseY, settings.spectrumBarWidth, h * direction);
			if (showMirror)
				ctx.fillRect(
					x,
					baseY,
					settings.spectrumBarWidth,
					h * -direction
				);
			if (
				settings.spectrumPeakHold &&
				peaks[i] > settings.spectrumMinHeight + 1
			) {
				drawPeakMarker(
					ctx,
					x,
					baseY + peaks[i] * direction,
					settings.spectrumBarWidth,
					2 * direction
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						x,
						baseY - peaks[i] * direction,
						settings.spectrumBarWidth,
						-2 * direction
					);
			}
		}
	}
}

export function fillCapsuleRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const left = Math.min(x, x + width);
	const top = Math.min(y, y + height);
	const safeWidth = Math.abs(width);
	const safeHeight = Math.abs(height);
	const radius = Math.min(safeWidth, safeHeight) / 2;
	ctx.beginPath();
	if (typeof ctx.roundRect === 'function') {
		ctx.roundRect(left, top, safeWidth, safeHeight, radius);
	} else {
		ctx.rect(left, top, safeWidth, safeHeight);
	}
	ctx.fill();
}

export function drawLinearCapsules(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur =
			settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride;
			fillCapsuleRect(
				ctx,
				baseX,
				y,
				heights[i] * direction,
				settings.spectrumBarWidth
			);
			if (settings.spectrumMirror) {
				fillCapsuleRect(
					ctx,
					baseX - heights[i] * direction,
					y,
					heights[i] * direction,
					settings.spectrumBarWidth
				);
			}
		} else {
			const x = start + i * stride;
			fillCapsuleRect(
				ctx,
				x,
				baseY,
				settings.spectrumBarWidth,
				heights[i] * direction
			);
			if (settings.spectrumMirror) {
				fillCapsuleRect(
					ctx,
					x,
					baseY - heights[i] * direction,
					settings.spectrumBarWidth,
					heights[i] * direction
				);
			}
		}
	}
}

export function drawLinearSpikes(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur =
			settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride;
			ctx.beginPath();
			ctx.moveTo(baseX, y);
			ctx.lineTo(
				baseX + heights[i] * direction,
				y + settings.spectrumBarWidth / 2
			);
			ctx.lineTo(baseX, y + settings.spectrumBarWidth);
			ctx.closePath();
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.moveTo(baseX, y);
				ctx.lineTo(
					baseX - heights[i] * direction,
					y + settings.spectrumBarWidth / 2
				);
				ctx.lineTo(baseX, y + settings.spectrumBarWidth);
				ctx.closePath();
				ctx.fill();
			}
		} else {
			const x = start + i * stride;
			ctx.beginPath();
			ctx.moveTo(x, baseY);
			ctx.lineTo(
				x + settings.spectrumBarWidth / 2,
				baseY + heights[i] * direction
			);
			ctx.lineTo(x + settings.spectrumBarWidth, baseY);
			ctx.closePath();
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.moveTo(x, baseY);
				ctx.lineTo(
					x + settings.spectrumBarWidth / 2,
					baseY - heights[i] * direction
				);
				ctx.lineTo(x + settings.spectrumBarWidth, baseY);
				ctx.closePath();
				ctx.fill();
			}
		}
	}
}

export function drawLinearBlocks(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const baseSegmentLength = Math.max(10, settings.spectrumBarWidth * 3.6);
	const baseSegmentGap = Math.max(2, settings.spectrumBarWidth * 0.75);
	const maxSegmentsPerBar = barCount > 180 ? 4 : barCount > 120 ? 5 : 6;
	const shadowBlur = Math.min(
		settings.spectrumShadowBlur * settings.spectrumGlowIntensity,
		barCount > 160 ? 6 : 10
	);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = shadowBlur;
		const estimatedSegments = Math.max(
			1,
			Math.round(
				(heights[i] + baseSegmentGap) /
					(baseSegmentLength + baseSegmentGap)
			)
		);
		const segments = Math.min(maxSegmentsPerBar, estimatedSegments);
		const segmentGap = Math.min(baseSegmentGap, heights[i] * 0.18);
		const segmentLength = Math.max(
			baseSegmentLength,
			(heights[i] - Math.max(0, segments - 1) * segmentGap) / segments
		);

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride + settings.spectrumBarWidth / 2;
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const width = Math.min(segmentLength, heights[i] - offset);
				ctx.fillRect(
					baseX + offset * direction,
					y - settings.spectrumBarWidth / 2,
					width * direction,
					settings.spectrumBarWidth
				);
				if (settings.spectrumMirror) {
					ctx.fillRect(
						baseX - offset * direction,
						y - settings.spectrumBarWidth / 2,
						-width * direction,
						settings.spectrumBarWidth
					);
				}
			}
		} else {
			const x = start + i * stride + settings.spectrumBarWidth / 2;
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const height = Math.min(segmentLength, heights[i] - offset);
				ctx.fillRect(
					x - settings.spectrumBarWidth / 2,
					baseY + offset * direction,
					settings.spectrumBarWidth,
					height * direction
				);
				if (settings.spectrumMirror) {
					ctx.fillRect(
						x - settings.spectrumBarWidth / 2,
						baseY - offset * direction,
						settings.spectrumBarWidth,
						-height * direction
					);
				}
			}
		}
	}
}

export function drawLinearDots(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const dotRadius = Math.max(settings.spectrumBarWidth * 0.7, 1.5);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur =
			settings.spectrumShadowBlur * settings.spectrumGlowIntensity;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			ctx.arc(
				baseX + heights[i] * direction,
				y,
				dotRadius,
				0,
				Math.PI * 2
			);
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.arc(
					baseX - heights[i] * direction,
					y,
					dotRadius,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		} else {
			const x = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			ctx.arc(
				x,
				baseY + heights[i] * direction,
				dotRadius,
				0,
				Math.PI * 2
			);
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.arc(
					x,
					baseY - heights[i] * direction,
					dotRadius,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		}
	}
}

export function drawLinearWave(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const totalSpan =
		(settings.spectrumLinearOrientation === 'vertical'
			? canvas.height
			: canvas.width) *
		Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalSpan) / 2
			: (canvas.width - totalSpan) / 2;
	const step = totalSpan / Math.max(barCount - 1, 1);
	const gradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		settings.spectrumLinearOrientation
	);

	ctx.beginPath();
	for (let i = 0; i < barCount; i++) {
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * step;
			const x = baseX + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		} else {
			const x = start + i * step;
			const y = baseY + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
	}

	if (settings.spectrumMirror) {
		for (let i = barCount - 1; i >= 0; i--) {
			if (settings.spectrumLinearOrientation === 'vertical') {
				ctx.lineTo(baseX - heights[i] * direction, start + i * step);
			} else {
				ctx.lineTo(start + i * step, baseY - heights[i] * direction);
			}
		}
	} else if (settings.spectrumLinearOrientation === 'vertical') {
		ctx.lineTo(baseX, start + totalSpan);
		ctx.lineTo(baseX, start);
	} else {
		ctx.lineTo(start + totalSpan, baseY);
		ctx.lineTo(start, baseY);
	}

	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.save();
	ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
	ctx.fill();
	ctx.restore();

	ctx.beginPath();
	for (let i = 0; i < barCount; i++) {
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * step;
			const x = baseX + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		} else {
			const x = start + i * step;
			const y = baseY + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
	}
	ctx.strokeStyle = gradient;
	ctx.lineWidth = settings.spectrumBarWidth;
	ctx.shadowColor = settings.spectrumPrimaryColor;
	ctx.shadowBlur =
		settings.spectrumShadowBlur * settings.spectrumGlowIntensity;
	ctx.stroke();
}
