import type { WallpaperState } from '@/types/wallpaper';
import { getCachedLyricsDocument } from '@/features/lyrics/cache';
import { findActiveLyricsLineIndex } from '@/features/lyrics/parser';
import { hasRenderableLyrixaBundle } from '@/features/lyrics/lyrixaBundle';
import { drawLyrixaLyricsBundle } from '@/features/lyrics/lyrixaBundleRenderer';
import { buildTrackFont } from '@/components/audio/trackFonts';
import { applyTextTreatment } from '@/components/audio/trackTextTreatment';
import type {
	LyrixaClipPositionPreset,
	LyrixaLyricLayer
} from '@/features/lyrics/lyrixaBundleTypes';
import type {
	LyricsActiveAnimation,
	LyricsTextTransition
} from '@/types/wallpaper';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function getFont(state: WallpaperState): string {
	return buildTrackFont(
		state.audioLyricsFontStyle,
		state.audioLyricsFontSize
	);
}

function measureSpacedTextWidth(
	ctx: CanvasRenderingContext2D,
	text: string,
	letterSpacing: number
): number {
	if (!text) return 0;
	return (
		ctx.measureText(text).width +
		Math.max(0, text.length - 1) * Math.max(0, letterSpacing)
	);
}

function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	letterSpacing: number
): string[] {
	if (!text.trim()) return [''];
	if (measureSpacedTextWidth(ctx, text, letterSpacing) <= maxWidth) {
		return [text];
	}

	const words = text.split(/\s+/).filter(Boolean);
	if (words.length === 0) return [''];

	const lines: string[] = [];
	let current = '';
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (measureSpacedTextWidth(ctx, next, letterSpacing) <= maxWidth) {
			current = next;
			continue;
		}
		if (current) lines.push(current);
		current = word;
	}
	if (current) lines.push(current);
	return lines;
}

function drawSpacedText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	letterSpacing: number,
	stroke?: { color: string; width: number }
) {
	if (!text) return;
	let cursorX = x;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index]!;
		if (stroke && stroke.width > 0) {
			ctx.lineJoin = 'round';
			ctx.lineWidth = stroke.width;
			ctx.strokeStyle = stroke.color;
			ctx.strokeText(char, cursorX, y);
		}
		ctx.fillText(char, cursorX, y);
		cursorX += ctx.measureText(char).width + letterSpacing;
	}
}

function resolveTransitionPreset(
	preset: LyricsTextTransition,
	progress: number,
	direction: 'in' | 'out',
	fontSize: number
): {
	alpha: number;
	scale: number;
	offsetX: number;
	offsetY: number;
	blur: number;
} {
	if (preset === 'none') {
		return { alpha: 1, scale: 1, offsetX: 0, offsetY: 0, blur: 0 };
	}
	const p = clamp(progress, 0, 1);
	const eased = 1 - Math.pow(1 - p, 3);
	const entering = direction === 'in';
	const amount = entering ? 1 - eased : eased;
	switch (preset) {
		case 'slide-up':
			return {
				alpha: entering ? eased : 1 - eased,
				scale: 1,
				offsetX: 0,
				offsetY: amount * fontSize * (entering ? 0.9 : -0.7),
				blur: 0
			};
		case 'slide-down':
			return {
				alpha: entering ? eased : 1 - eased,
				scale: 1,
				offsetX: 0,
				offsetY: amount * fontSize * (entering ? -0.9 : 0.7),
				blur: 0
			};
		case 'scale':
			return {
				alpha: entering ? eased : 1 - eased,
				scale: entering ? 0.86 + eased * 0.14 : 1 - eased * 0.12,
				offsetX: 0,
				offsetY: 0,
				blur: 0
			};
		case 'pop':
			return {
				alpha: entering ? eased : 1 - eased,
				scale: entering
					? 0.72 + eased * 0.28 + Math.sin(p * Math.PI) * 0.08
					: 1 + eased * 0.14,
				offsetX: 0,
				offsetY: 0,
				blur: 0
			};
		case 'blur':
			return {
				alpha: entering ? eased : 1 - eased,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				blur: amount * fontSize * 0.2
			};
		case 'fade':
		default:
			return {
				alpha: entering ? eased : 1 - eased,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				blur: 0
			};
	}
}

function resolveActiveAnimation(
	preset: LyricsActiveAnimation,
	timeSec: number,
	lineIndex: number,
	fontSize: number
): {
	alpha: number;
	scale: number;
	offsetX: number;
	offsetY: number;
	glowMultiplier: number;
} {
	const phase = timeSec * Math.PI * 2 + lineIndex * 0.55;
	switch (preset) {
		case 'pulse': {
			const pulse = (Math.sin(phase * 0.82) + 1) / 2;
			return {
				alpha: 1,
				scale: 1 + pulse * 0.045,
				offsetX: 0,
				offsetY: 0,
				glowMultiplier: 1 + pulse * 0.25
			};
		}
		case 'glow-pulse': {
			const pulse = (Math.sin(phase * 0.95) + 1) / 2;
			return {
				alpha: 1,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				glowMultiplier: 1.15 + pulse * 0.85
			};
		}
		case 'breathing': {
			const pulse = (Math.sin(phase * 0.42) + 1) / 2;
			return {
				alpha: 0.92 + pulse * 0.08,
				scale: 0.985 + pulse * 0.035,
				offsetX: 0,
				offsetY: 0,
				glowMultiplier: 1 + pulse * 0.18
			};
		}
		case 'shake-light':
			return {
				alpha: 1,
				scale: 1,
				offsetX: Math.sin(phase * 5.7) * fontSize * 0.025,
				offsetY: Math.cos(phase * 4.9) * fontSize * 0.015,
				glowMultiplier: 1.15
			};
		case 'wave':
			return {
				alpha: 1,
				scale: 1,
				offsetX: 0,
				offsetY: Math.sin(phase * 1.6) * fontSize * 0.08,
				glowMultiplier: 1.2
			};
		case 'flicker': {
			const flicker =
				Math.sin(phase * 5.1) > 0.82 || Math.sin(phase * 8.3) < -0.92;
			return {
				alpha: flicker ? 0.68 : 1,
				scale: 1,
				offsetX: flicker ? fontSize * 0.025 : 0,
				offsetY: 0,
				glowMultiplier: flicker ? 1.65 : 1.1
			};
		}
		case 'none':
		default:
			return {
				alpha: 1,
				scale: 1,
				offsetX: 0,
				offsetY: 0,
				glowMultiplier: 1
			};
	}
}

function drawLine(
	ctx: CanvasRenderingContext2D,
	text: string,
	centerX: number,
	baselineY: number,
	letterSpacing: number,
	color: string,
	secondaryColor: string,
	alpha: number,
	glowColor: string,
	glowBlur: number,
	glowReach: number,
	treatment: WallpaperState['audioLyricsTextTreatment'],
	strokeColor: string,
	strokeWidth: number,
	scale: number,
	offsetX: number,
	offsetY: number,
	extraBlur: number
) {
	const width = measureSpacedTextWidth(ctx, text, letterSpacing);
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.translate(centerX + offsetX, baselineY + offsetY);
	ctx.scale(scale, scale);
	ctx.filter = extraBlur > 0 ? `blur(${extraBlur}px)` : 'none';
	if (glowBlur > 0.01) {
		const reach = clamp(glowReach, 1, 3);
		ctx.save();
		ctx.fillStyle = glowColor;
		ctx.shadowColor = glowColor;
		ctx.shadowBlur = glowBlur * reach;
		ctx.globalAlpha *= Math.min(1, 0.34 + (reach - 1) * 0.14);
		drawSpacedText(ctx, text, -width / 2, 0, letterSpacing);
		ctx.restore();
	}
	ctx.shadowColor = glowColor;
	ctx.shadowBlur = glowBlur * 0.35;
	const stroke = applyTextTreatment(ctx, treatment, {
		top: -ctx.measureText('M').actualBoundingBoxAscent,
		height: Math.max(1, ctx.measureText('M').actualBoundingBoxAscent * 1.2),
		baseColor: color,
		secondaryColor,
		userStrokeColor: strokeColor,
		userStrokeWidth: strokeWidth
	});
	drawSpacedText(ctx, text, -width / 2, 0, letterSpacing, stroke);
	ctx.restore();
}

function resolveAnchorFromLyrixaPreset(
	preset: LyrixaClipPositionPreset | undefined,
	canvas: HTMLCanvasElement,
	fallbackX: number,
	fallbackY: number
): { x: number; y: number } {
	const marginX = canvas.width * 0.08;
	const marginY = canvas.height * 0.12;
	switch (preset) {
		case 'top':
			return { x: canvas.width / 2, y: marginY };
		case 'bottom':
			return { x: canvas.width / 2, y: canvas.height - marginY };
		case 'top-left':
			return { x: marginX, y: marginY };
		case 'top-right':
			return { x: canvas.width - marginX, y: marginY };
		case 'bottom-left':
			return { x: marginX, y: canvas.height - marginY };
		case 'bottom-right':
			return { x: canvas.width - marginX, y: canvas.height - marginY };
		case 'center':
			return { x: canvas.width / 2, y: canvas.height / 2 };
		default:
			return { x: fallbackX, y: fallbackY };
	}
}

export function drawLyricsOverlay(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	state: WallpaperState,
	activeTrackAssetId: string | null,
	currentTimeSec: number,
	durationSec: number
) {
	if (!state.audioLyricsEnabled || !activeTrackAssetId) return;
	const entry = state.audioLyricsByTrackAssetId[activeTrackAssetId];
	const adjustedTime = Math.max(
		0,
		currentTimeSec + state.audioLyricsTimeOffsetMs / 1000
	);
	const lyrixaRenderMode = entry?.lyrixaRenderMode ?? 'editor';
	if (
		entry?.lyrixaBundle &&
		lyrixaRenderMode === 'bundle' &&
		hasRenderableLyrixaBundle(entry.lyrixaBundle)
	) {
		drawLyrixaLyricsBundle(ctx, canvas, entry.lyrixaBundle, adjustedTime, {
			layerOverrides: entry.lyrixaLayerOverrides
		});
		return;
	}

	type SourceLine = {
		text: string;
		isActive: boolean;
		startTime: number;
		endTime: number;
		layerId?: string;
		layer?: LyrixaLyricLayer;
	};
	const sourceLines: SourceLine[] = [];

	if (entry?.lyrixaBundle && lyrixaRenderMode === 'editor') {
		// Read clip endTimes straight from the bundle. Going through LRC
		// would have collapsed each clip's endTime to the next clip's
		// startTime, which is exactly what hid the silences before.
		const layerOverrides = entry.lyrixaLayerOverrides ?? {};
		const visibleLayers = new Map(
			entry.lyrixaBundle.project.layers
				.filter(
					layer =>
						(layer.visible !== false ||
							layerOverrides[layer.id]?.visible === true) &&
						layerOverrides[layer.id]?.visible !== false
				)
				.sort((a, b) => a.order - b.order)
				.map(layer => [layer.id, layer])
		);
		for (const clip of entry.lyrixaBundle.project.clips
			.filter(clip => {
				const layer = visibleLayers.get(clip.layerId);
				return (
					layer &&
					!clip.muted &&
					adjustedTime >= clip.startTime &&
					adjustedTime <= clip.endTime &&
					(!layer.renderSettings?.suppressClipText ||
						clip.forceTextRender)
				);
			})
			.sort((a, b) => {
				const layerA = visibleLayers.get(a.layerId)?.order ?? 0;
				const layerB = visibleLayers.get(b.layerId)?.order ?? 0;
				return layerA - layerB || a.startTime - b.startTime;
			})) {
			const layer = visibleLayers.get(clip.layerId);
			sourceLines.push({
				text: clip.text,
				isActive: true,
				startTime: clip.startTime,
				endTime: clip.endTime,
				layerId: clip.layerId,
				layer
			});
		}
		if (sourceLines.length === 0) return;
	} else if (entry?.rawText.trim()) {
		const lyrics = getCachedLyricsDocument(entry, durationSec);
		if (lyrics.lines.length === 0) return;
		const activeIndex = findActiveLyricsLineIndex(
			lyrics.lines,
			adjustedTime,
			lyrics.hasTimestamps
		);
		if (activeIndex < 0) return;
		const visibleLyricLines = Math.max(
			1,
			Math.round(state.audioLyricsVisibleLineCount)
		);
		const radius = Math.max(0, Math.round((visibleLyricLines - 1) / 2));
		const startIndex = Math.max(0, activeIndex - radius);
		const endIndex = Math.min(
			lyrics.lines.length - 1,
			activeIndex + radius
		);
		for (let i = startIndex; i <= endIndex; i += 1) {
			const lyricLine = lyrics.lines[i]!;
			sourceLines.push({
				text: lyricLine.text,
				isActive: i === activeIndex,
				startTime: lyricLine.startTime,
				endTime: lyricLine.endTime
			});
		}
	} else {
		return;
	}

	const maxWidth = canvas.width * state.audioLyricsWidth;
	const centerX =
		state.audioLyricsLayoutMode === 'left-dock'
			? maxWidth / 2 + 36
			: state.audioLyricsLayoutMode === 'right-dock'
				? canvas.width - maxWidth / 2 - 36
				: state.audioLyricsLayoutMode === 'centered'
					? canvas.width / 2
					: canvas.width / 2 +
						state.audioLyricsPositionX * canvas.width * 0.5;
	const anchorY =
		canvas.height / 2 - state.audioLyricsPositionY * canvas.height * 0.5;
	const lineHeightPx =
		state.audioLyricsFontSize * state.audioLyricsLineHeight;
	const letterSpacing = state.audioLyricsLetterSpacing;

	ctx.save();
	ctx.font = getFont(state);
	ctx.textBaseline = 'middle';
	ctx.filter = 'none';

	const physicalLines: Array<{
		text: string;
		alpha: number;
		color: string;
		secondaryColor: string;
		isActive: boolean;
		startTime: number;
		endTime: number;
		layerId: string;
		layer?: LyrixaLyricLayer;
	}> = [];

	for (const source of sourceLines) {
		const sourceText = state.audioLyricsUppercase
			? source.text.toUpperCase()
			: source.text;
		const wrapped = wrapText(ctx, sourceText, maxWidth, letterSpacing);
		for (const segment of wrapped) {
			physicalLines.push({
				text: segment,
				alpha: source.isActive
					? state.audioLyricsOpacity
					: state.audioLyricsOpacity *
						state.audioLyricsInactiveOpacity,
				color: source.isActive
					? state.audioLyricsActiveColor
					: state.audioLyricsInactiveColor,
				secondaryColor: state.audioLyricsInactiveColor,
				isActive: source.isActive,
				startTime: source.startTime,
				endTime: source.endTime,
				layerId: source.layerId ?? '__default__',
				layer: source.layer
			});
		}
	}

	if (physicalLines.length === 0) {
		ctx.restore();
		return;
	}

	const groupedLines = new Map<string, typeof physicalLines>();
	for (const line of physicalLines) {
		const group = groupedLines.get(line.layerId) ?? [];
		group.push(line);
		groupedLines.set(line.layerId, group);
	}

	groupedLines.forEach((lines, layerId) => {
		const layer = lines[0]?.layer;
		const layerOverride =
			layerId !== '__default__'
				? (entry?.lyrixaLayerOverrides ?? {})[layerId]
				: undefined;
		const layerScale = clamp(layerOverride?.scale ?? 1, 0.2, 4);
		const groupLineHeightPx = lineHeightPx * layerScale;
		const layerAnchor = resolveAnchorFromLyrixaPreset(
			layer?.renderSettings?.positionPreset,
			canvas,
			centerX,
			anchorY
		);
		// positionOffset maps to a full screen dimension so any layer can be
		// dragged edge-to-edge regardless of its bundle position preset.
		const groupCenterX =
			layerAnchor.x +
			clamp(layerOverride?.positionOffsetX ?? 0, -2, 2) * canvas.width;
		const groupAnchorY =
			layerAnchor.y -
			clamp(layerOverride?.positionOffsetY ?? 0, -2, 2) * canvas.height;
		const totalHeight = lines.length * groupLineHeightPx;
		const unclampedTopY =
			groupAnchorY - totalHeight / 2 + groupLineHeightPx / 2;
		const topY = clamp(
			unclampedTopY,
			groupLineHeightPx / 2,
			Math.max(
				groupLineHeightPx / 2,
				canvas.height - totalHeight + groupLineHeightPx / 2
			)
		);
		const maxMeasuredWidth = lines.reduce(
			(max, line) =>
				Math.max(
					max,
					measureSpacedTextWidth(ctx, line.text, letterSpacing)
				),
			0
		);

		if (state.audioLyricsBackdropEnabled) {
			const pad = state.audioLyricsBackdropPadding;
			const boxWidth = maxMeasuredWidth * layerScale + pad * 2;
			const boxHeight = totalHeight + pad * 2;
			const boxX = groupCenterX - boxWidth / 2;
			const boxY = topY - groupLineHeightPx / 2 - pad;
			const radiusPx = clamp(
				state.audioLyricsBackdropRadius,
				0,
				Math.min(boxWidth, boxHeight) / 2
			);

			ctx.save();
			ctx.globalAlpha =
				state.audioLyricsBackdropOpacity *
				clamp(layerOverride?.opacity ?? 1, 0, 1);
			ctx.fillStyle = state.audioLyricsBackdropColor;
			ctx.beginPath();
			ctx.moveTo(boxX + radiusPx, boxY);
			ctx.arcTo(
				boxX + boxWidth,
				boxY,
				boxX + boxWidth,
				boxY + boxHeight,
				radiusPx
			);
			ctx.arcTo(
				boxX + boxWidth,
				boxY + boxHeight,
				boxX,
				boxY + boxHeight,
				radiusPx
			);
			ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY, radiusPx);
			ctx.arcTo(boxX, boxY, boxX + boxWidth, boxY, radiusPx);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}

		lines.forEach((line, index) => {
			const durationMs = Math.max(
				60,
				state.audioLyricsAnimationDurationMs
			);
			const enterProgress =
				((adjustedTime - line.startTime) * 1000) / durationMs;
			const exitProgress =
				1 - ((line.endTime - adjustedTime) * 1000) / durationMs;
			const inFx = line.isActive
				? resolveTransitionPreset(
						state.audioLyricsTransitionIn,
						enterProgress,
						'in',
						state.audioLyricsFontSize
					)
				: { alpha: 1, scale: 1, offsetX: 0, offsetY: 0, blur: 0 };
			const outFx = line.isActive
				? resolveTransitionPreset(
						state.audioLyricsTransitionOut,
						exitProgress,
						'out',
						state.audioLyricsFontSize
					)
				: { alpha: 1, scale: 1, offsetX: 0, offsetY: 0, blur: 0 };
			const activeFx = line.isActive
				? resolveActiveAnimation(
						state.audioLyricsActiveAnimation,
						adjustedTime,
						index,
						state.audioLyricsFontSize
					)
				: {
						alpha: 1,
						scale: 1,
						offsetX: 0,
						offsetY: 0,
						glowMultiplier: 1
					};
			const alpha =
				line.alpha *
				Math.min(inFx.alpha, outFx.alpha) *
				activeFx.alpha *
				clamp(layerOverride?.opacity ?? 1, 0, 1);
			const glowIntensityScale =
				layerOverride?.glowIntensity !== undefined
					? clamp(layerOverride.glowIntensity, 0, 4)
					: 1;
			const glowBlur =
				(line.isActive
					? state.audioLyricsGlowBlur
					: state.audioLyricsGlowBlur * 0.42) *
				activeFx.glowMultiplier *
				glowIntensityScale;
			drawLine(
				ctx,
				line.text,
				groupCenterX,
				topY + index * groupLineHeightPx,
				letterSpacing,
				layerOverride?.textColor ?? line.color,
				line.secondaryColor,
				clamp(alpha, 0, 1),
				layerOverride?.glowColor ?? state.audioLyricsGlowColor,
				glowBlur,
				state.audioLyricsGlowReach,
				state.audioLyricsTextTreatment,
				state.audioLyricsStrokeColor,
				state.audioLyricsStrokeWidth,
				inFx.scale * outFx.scale * activeFx.scale * layerScale,
				inFx.offsetX + outFx.offsetX + activeFx.offsetX,
				inFx.offsetY + outFx.offsetY + activeFx.offsetY,
				Math.max(inFx.blur, outFx.blur, layerOverride?.blurAmount ?? 0)
			);
		});
	});

	ctx.restore();
}
