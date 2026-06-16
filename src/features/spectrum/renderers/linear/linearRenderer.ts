import { getColor, createWaveGradient } from '../../color/spectrumColor';
import type {
	SpectrumLinearDirection,
	SpectrumLinearOrientation
} from '@/types/wallpaper';
import type { SpectrumSettings } from '../../runtime/spectrumRuntime';

/**
 * Shared glow-blur cap.
 *
 * Without this, `shadowBlur (max 60) × glowIntensity (max 3) = 180 px` blur
 * fires on every fillRect / arc, which torches FPS on any non-trivial bar
 * count. `drawLinearBlocks` already had its own cap with a bar-count-aware
 * floor; this helper lifts the pattern so bars / dots / wave behave the
 * same. The defaults (40 / 24) match the upper bound users actually hit in
 * practice — anything past that is purely a cost without visual gain.
 */
export function computeClassicGlowBlur(
	settings: SpectrumSettings,
	barCount: number,
	options: { lowDensityCap?: number; highDensityCap?: number } = {}
): number {
	const requested =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings);
	const highCap = options.highDensityCap ?? 24;
	const lowCap = options.lowDensityCap ?? 40;
	const cap = barCount > 160 ? highCap : lowCap;
	// Performance-mode blur ceiling. Canvas2D `shadowBlur` cost grows roughly
	// with the blur radius squared, so shrinking the cap on medium/low modes is
	// the single cheapest spectrum win — and the doubled main+clone pass feels
	// it twice. `high` is left untouched so quality is identical there.
	const perfScale =
		settings.performanceMode === 'low'
			? 0.5
			: settings.performanceMode === 'medium'
				? 0.7
				: 1;
	return Math.min(requested, cap * perfScale);
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

export function resolveGlowReach(settings: SpectrumSettings): number {
	return Math.max(1, Math.min(3, settings.spectrumGlowReach ?? 1));
}

export function drawClassicGlowHaloPass(
	ctx: CanvasRenderingContext2D,
	color: string,
	settings: SpectrumSettings,
	barCount: number,
	draw: (expansion: number) => void,
	options: {
		blurMultiplier?: number;
		alphaBoost?: number;
		expansionMultiplier?: number;
	} = {}
): number {
	const glowBlur = computeClassicGlowBlur(settings, barCount);
	if (glowBlur <= 0.001 || settings.spectrumGlowIntensity <= 0.001) {
		return glowBlur;
	}

	const glowT = clamp01(settings.spectrumGlowIntensity / 3);
	const glowReach = resolveGlowReach(settings);
	const haloAlpha = Math.min(
		0.95,
		(options.alphaBoost ?? 0.16) + glowT * 0.34 + (glowReach - 1) * 0.08
	);
	const expansion =
		(0.8 + glowBlur * 0.06 + settings.spectrumGlowIntensity * 0.9) *
		(0.72 + glowReach * 0.56) *
		(options.expansionMultiplier ?? 1);

	ctx.save();
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.shadowColor = color;
	ctx.shadowBlur = Math.max(
		glowBlur * (options.blurMultiplier ?? 1.65) * (0.85 + glowReach * 0.3),
		glowBlur + 6
	);
	ctx.globalAlpha = Math.max(ctx.globalAlpha, haloAlpha);
	draw(expansion);
	ctx.restore();

	return glowBlur;
}

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
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		const h = heights[i];
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride - expansion / 2;
				ctx.fillRect(
					baseX,
					y,
					(h + expansion) * direction,
					settings.spectrumBarWidth + expansion
				);
				if (showMirror) {
					ctx.fillRect(
						baseX,
						y,
						(h + expansion) * -direction,
						settings.spectrumBarWidth + expansion
					);
				}
			} else {
				const x = start + i * stride - expansion / 2;
				ctx.fillRect(
					x,
					baseY,
					settings.spectrumBarWidth + expansion,
					(h + expansion) * direction
				);
				if (showMirror) {
					ctx.fillRect(
						x,
						baseY,
						settings.spectrumBarWidth + expansion,
						(h + expansion) * -direction
					);
				}
			}
		});
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = glowBlur;

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
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride - expansion / 2;
				fillCapsuleRect(
					ctx,
					baseX,
					y,
					(heights[i] + expansion) * direction,
					settings.spectrumBarWidth + expansion
				);
				if (settings.spectrumMirror) {
					fillCapsuleRect(
						ctx,
						baseX - (heights[i] + expansion) * direction,
						y,
						(heights[i] + expansion) * direction,
						settings.spectrumBarWidth + expansion
					);
				}
			} else {
				const x = start + i * stride - expansion / 2;
				fillCapsuleRect(
					ctx,
					x,
					baseY,
					settings.spectrumBarWidth + expansion,
					(heights[i] + expansion) * direction
				);
				if (settings.spectrumMirror) {
					fillCapsuleRect(
						ctx,
						x,
						baseY - (heights[i] + expansion) * direction,
						settings.spectrumBarWidth + expansion,
						(heights[i] + expansion) * direction
					);
				}
			}
		});
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = glowBlur;

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
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride - expansion / 2;
				ctx.beginPath();
				ctx.moveTo(baseX, y);
				ctx.lineTo(
					baseX + (heights[i] + expansion) * direction,
					y + (settings.spectrumBarWidth + expansion) / 2
				);
				ctx.lineTo(baseX, y + settings.spectrumBarWidth + expansion);
				ctx.closePath();
				ctx.fill();
				if (settings.spectrumMirror) {
					ctx.beginPath();
					ctx.moveTo(baseX, y);
					ctx.lineTo(
						baseX - (heights[i] + expansion) * direction,
						y + (settings.spectrumBarWidth + expansion) / 2
					);
					ctx.lineTo(
						baseX,
						y + settings.spectrumBarWidth + expansion
					);
					ctx.closePath();
					ctx.fill();
				}
			} else {
				const x = start + i * stride - expansion / 2;
				ctx.beginPath();
				ctx.moveTo(x, baseY);
				ctx.lineTo(
					x + (settings.spectrumBarWidth + expansion) / 2,
					baseY + (heights[i] + expansion) * direction
				);
				ctx.lineTo(x + settings.spectrumBarWidth + expansion, baseY);
				ctx.closePath();
				ctx.fill();
				if (settings.spectrumMirror) {
					ctx.beginPath();
					ctx.moveTo(x, baseY);
					ctx.lineTo(
						x + (settings.spectrumBarWidth + expansion) / 2,
						baseY - (heights[i] + expansion) * direction
					);
					ctx.lineTo(
						x + settings.spectrumBarWidth + expansion,
						baseY
					);
					ctx.closePath();
					ctx.fill();
				}
			}
		});
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = glowBlur;

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
	// Blocks accumulates more fillRect calls than other shapes (1 per
	// segment per bar), so it uses a stricter cap than the default helper.
	const shadowBlur = computeClassicGlowBlur(settings, barCount, {
		lowDensityCap: 10,
		highDensityCap: 6
	});

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

		// Accumulate every segment (and its mirror) for this bar into a single
		// path and fill once. shadowBlur is computed per draw call, so batching
		// the bar's N segments into one fill() collapses N shadowed passes into
		// one — the dominant cost of this shape at high bar/segment counts.
		// Segments never overlap, so a nonzero-winding fill is pixel-identical
		// to the previous per-segment fillRect calls.
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const width = Math.min(segmentLength, heights[i] - offset);
				ctx.rect(
					baseX + offset * direction,
					y - settings.spectrumBarWidth / 2,
					width * direction,
					settings.spectrumBarWidth
				);
				if (settings.spectrumMirror) {
					ctx.rect(
						baseX - offset * direction,
						y - settings.spectrumBarWidth / 2,
						-width * direction,
						settings.spectrumBarWidth
					);
				}
			}
			ctx.fill();
		} else {
			const x = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const height = Math.min(segmentLength, heights[i] - offset);
				ctx.rect(
					x - settings.spectrumBarWidth / 2,
					baseY + offset * direction,
					settings.spectrumBarWidth,
					height * direction
				);
				if (settings.spectrumMirror) {
					ctx.rect(
						x - settings.spectrumBarWidth / 2,
						baseY - offset * direction,
						settings.spectrumBarWidth,
						-height * direction
					);
				}
			}
			ctx.fill();
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
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		drawClassicGlowHaloPass(ctx, color, settings, barCount, expansion => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride + settings.spectrumBarWidth / 2;
				ctx.beginPath();
				ctx.arc(
					baseX + heights[i] * direction,
					y,
					dotRadius + expansion * 0.45,
					0,
					Math.PI * 2
				);
				ctx.fill();
				if (settings.spectrumMirror) {
					ctx.beginPath();
					ctx.arc(
						baseX - heights[i] * direction,
						y,
						dotRadius + expansion * 0.45,
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
					dotRadius + expansion * 0.45,
					0,
					Math.PI * 2
				);
				ctx.fill();
				if (settings.spectrumMirror) {
					ctx.beginPath();
					ctx.arc(
						x,
						baseY - heights[i] * direction,
						dotRadius + expansion * 0.45,
						0,
						Math.PI * 2
					);
					ctx.fill();
				}
			}
		});
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = glowBlur;

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
	const waveGlowBlur = drawClassicGlowHaloPass(
		ctx,
		settings.spectrumPrimaryColor,
		settings,
		barCount,
		expansion => {
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
			ctx.lineWidth = settings.spectrumBarWidth + expansion * 1.2;
			ctx.strokeStyle = settings.spectrumPrimaryColor;
			ctx.stroke();
		},
		{ alphaBoost: 0.22, expansionMultiplier: 1.25 }
	);
	ctx.shadowBlur = waveGlowBlur;
	ctx.stroke();
}
