import { getColor, createWaveGradient } from '../../color/spectrumColor';
import { resolveManualGlow } from '../../effects/manualGlow';
import { drawLinearRgbSplitPass } from '../../effects/rgbSplitPass';
import {
	drawNeonCorePass,
	resolveNeonCoreStrokeStyle
} from '../../effects/neonCorePass';
import { resolveGradientFlowPhase } from '../../effects/gradientFlow';
import { drawPeakSparksPass } from '../../effects/peakSparksPass';
import {
	drawEchoTracePasses,
	updateEchoTraceHistory
} from '../../effects/echoTrace';
import type {
	SpectrumLinearDirection,
	SpectrumLinearOrientation
} from '@/types/wallpaper';
import type {
	SpectrumRuntimeState,
	SpectrumSettings
} from '../../runtime/spectrumRuntime';

export {
	resolveManualGlow,
	type ResolvedManualGlow
} from '../../effects/manualGlow';

export type LinearWaveFrameContext = {
	runtime?: SpectrumRuntimeState;
	audioEnergy?: number;
	dt?: number;
};

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
	height: number,
	color = '#ffffff'
) {
	ctx.fillStyle = color;
	ctx.shadowBlur = 0;
	ctx.fillRect(x, y, width, height);
}

export function drawLinearBars(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	peaks: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	frame: LinearWaveFrameContext = {}
) {
	const { audioEnergy = 0, dt = 1 / 60 } = frame;
	const gradientPhase = resolveGradientFlowPhase(settings, audioEnergy, dt);
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
		const color = getColor(
			settings,
			settings.spectrumGradientFlow ? t + gradientPhase : t
		);
		const glow = resolveManualGlow(settings, t, color);
		const peakColor = glow.peak ?? '#ffffff';
		const h = heights[i];
		drawClassicGlowHaloPass(
			ctx,
			glow.halo,
			settings,
			barCount,
			expansion => {
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
			}
		);
		ctx.fillStyle = color;
		ctx.shadowColor = glow.core;
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
					settings.spectrumBarWidth,
					peakColor
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						baseX - peaks[i] * direction,
						y,
						-2 * direction,
						settings.spectrumBarWidth,
						peakColor
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
					2 * direction,
					peakColor
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						x,
						baseY - peaks[i] * direction,
						settings.spectrumBarWidth,
						-2 * direction,
						peakColor
					);
			}
		}
	}

	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + index * stride + settings.spectrumBarWidth / 2;
			const x = baseX + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
			if (showMirror) {
				ctx.beginPath();
				ctx.arc(
					baseX - heights[index] * direction,
					y,
					size * 0.5,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		} else {
			const x = start + index * stride + settings.spectrumBarWidth / 2;
			const y = baseY + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
			if (showMirror) {
				ctx.beginPath();
				ctx.arc(
					x,
					baseY - heights[index] * direction,
					size * 0.5,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		}
	});
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

/**
 * Retro LED equalizer. Each bar is a stacked column of hard square cells
 * snapped to a fixed grid — no anti-aliasing, no glow — for a chunky pixel-art
 * / VU-meter look. The cell side equals the bar width so cells are square; the
 * number of lit cells is the bar height quantized to the cell pitch.
 */
export function drawLinearPixel(
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
	const vertical = settings.spectrumLinearOrientation === 'vertical';
	const start = vertical
		? (canvas.height - totalLength) / 2
		: (canvas.width - totalLength) / 2;

	const cellSize = Math.max(2, settings.spectrumBarWidth);
	const cellGap = Math.max(1, cellSize * 0.28);
	const cellPitch = cellSize + cellGap;
	const maxCells = 256; // hard safety cap on the per-bar loop

	// Pixel art means crisp edges: kill the shadow/glow for this shape.
	ctx.shadowBlur = 0;

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		ctx.fillStyle = getColor(settings, t);
		const litCells = Math.min(maxCells, Math.floor(heights[i] / cellPitch));
		if (litCells <= 0) continue;
		const lineCenter = start + i * stride + settings.spectrumBarWidth / 2;

		for (let cell = 0; cell < litCells; cell++) {
			const offset = cell * cellPitch;
			if (vertical) {
				ctx.fillRect(
					baseX + offset * direction,
					lineCenter - cellSize / 2,
					cellSize * direction,
					cellSize
				);
				if (settings.spectrumMirror) {
					ctx.fillRect(
						baseX - offset * direction,
						lineCenter - cellSize / 2,
						-cellSize * direction,
						cellSize
					);
				}
			} else {
				ctx.fillRect(
					lineCenter - cellSize / 2,
					baseY + offset * direction,
					cellSize,
					cellSize * direction
				);
				if (settings.spectrumMirror) {
					ctx.fillRect(
						lineCenter - cellSize / 2,
						baseY - offset * direction,
						cellSize,
						-cellSize * direction
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
	settings: SpectrumSettings,
	frame: LinearWaveFrameContext = {}
) {
	const { runtime, audioEnergy = 0, dt = 1 / 60 } = frame;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const orientation = settings.spectrumLinearOrientation;
	const totalSpan =
		(orientation === 'vertical' ? canvas.height : canvas.width) *
		Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const start =
		orientation === 'vertical'
			? (canvas.height - totalSpan) / 2
			: (canvas.width - totalSpan) / 2;
	const step = totalSpan / Math.max(barCount - 1, 1);
	const referencePx = Math.min(canvas.width, canvas.height);
	const gradientPhase = resolveGradientFlowPhase(settings, audioEnergy, dt);
	const gradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		orientation,
		undefined,
		undefined,
		undefined,
		undefined,
		gradientPhase
	);

	const traceOpenWave = (
		source: Float32Array,
		perpOffset = 0,
		alongOffset = 0
	) => {
		ctx.beginPath();
		for (let i = 0; i < barCount; i++) {
			if (orientation === 'vertical') {
				const y = start + i * step + alongOffset;
				const x = baseX + source[i] * direction + perpOffset;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			} else {
				const x = start + i * step + alongOffset;
				const y = baseY + source[i] * direction + perpOffset;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
		}
	};

	if (runtime) {
		drawEchoTracePasses(runtime, {
			ctx,
			settings,
			traceHeights: (echoHeights, alpha, offset) => {
				ctx.save();
				ctx.globalAlpha *= alpha;
				traceOpenWave(echoHeights, offset, 0);
				ctx.strokeStyle = gradient;
				ctx.lineWidth = Math.max(
					0.75,
					settings.spectrumBarWidth * 0.82
				);
				ctx.shadowBlur = 0;
				ctx.stroke();
				ctx.restore();
			}
		});
	}

	ctx.beginPath();
	for (let i = 0; i < barCount; i++) {
		if (orientation === 'vertical') {
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
			if (orientation === 'vertical') {
				ctx.lineTo(baseX - heights[i] * direction, start + i * step);
			} else {
				ctx.lineTo(start + i * step, baseY - heights[i] * direction);
			}
		}
	} else if (orientation === 'vertical') {
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

	traceOpenWave(heights);
	const waveGlow = resolveManualGlow(
		settings,
		0.5,
		settings.spectrumPrimaryColor
	);

	// 3. Glow halo (expanded stroke, no main trace yet)
	drawClassicGlowHaloPass(
		ctx,
		waveGlow.halo,
		settings,
		barCount,
		expansion => {
			traceOpenWave(heights);
			ctx.lineWidth = settings.spectrumBarWidth + expansion * 1.2;
			ctx.strokeStyle = waveGlow.halo;
			ctx.stroke();
		},
		{ alphaBoost: 0.22, expansionMultiplier: 1.25 }
	);

	// 4. RGB split fringes (before main trace — draw-order contract)
	drawLinearRgbSplitPass(
		ctx,
		settings,
		referencePx,
		barCount,
		settings.spectrumBarWidth,
		orientation,
		() => traceOpenWave(heights)
	);

	// 5. Main trace
	traceOpenWave(heights);
	ctx.strokeStyle = gradient;
	ctx.lineWidth = settings.spectrumBarWidth;
	ctx.shadowColor = waveGlow.core;
	const waveGlowBlur = computeClassicGlowBlur(settings, barCount);
	ctx.shadowBlur = waveGlowBlur;
	ctx.save();
	ctx.stroke();
	ctx.restore();
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';

	// 6. Neon core
	if (settings.spectrumNeonCore) {
		traceOpenWave(heights);
		drawNeonCorePass(
			ctx,
			settings.spectrumBarWidth,
			settings.spectrumNeonCoreIntensity,
			settings.spectrumNeonCoreWidth,
			resolveNeonCoreStrokeStyle(
				settings,
				settings.spectrumNeonCoreIntensity
			)
		);
	}

	// 7. Peak sparks
	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		if (orientation === 'vertical') {
			const y = start + index * step;
			const x = baseX + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
		} else {
			const x = start + index * step;
			const y = baseY + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
		}
	});

	if (runtime) {
		updateEchoTraceHistory(runtime, settings, heights, barCount);
	}
}
