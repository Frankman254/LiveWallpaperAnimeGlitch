import type { WallpaperState } from '@/types/wallpaper';
import { getCachedLyricsDocument } from '@/features/lyrics/cache';
import { findActiveLyricsLineIndex } from '@/features/lyrics/parser';

const FONT_STACKS: Record<WallpaperState['audioLyricsFontStyle'], string> = {
	clean: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
	condensed: '"Arial Narrow", "Roboto Condensed", "Segoe UI", Arial, sans-serif',
	techno: '"Orbitron", "Eurostile", "Trebuchet MS", Verdana, sans-serif',
	mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
	serif: 'Georgia, "Times New Roman", serif'
};

const FONT_WEIGHTS: Record<WallpaperState['audioLyricsFontStyle'], number> = {
	clean: 700,
	condensed: 800,
	techno: 800,
	mono: 700,
	serif: 700
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function getFont(state: WallpaperState): string {
	return `${FONT_WEIGHTS[state.audioLyricsFontStyle]} ${state.audioLyricsFontSize}px ${FONT_STACKS[state.audioLyricsFontStyle]}`;
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
	letterSpacing: number
) {
	if (!text) return;
	let cursorX = x;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index]!;
		ctx.fillText(char, cursorX, y);
		cursorX += ctx.measureText(char).width + letterSpacing;
	}
}

function drawLine(
	ctx: CanvasRenderingContext2D,
	text: string,
	centerX: number,
	baselineY: number,
	letterSpacing: number,
	color: string,
	alpha: number,
	glowColor: string,
	glowBlur: number
) {
	const width = measureSpacedTextWidth(ctx, text, letterSpacing);
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = color;
	ctx.shadowColor = glowColor;
	ctx.shadowBlur = glowBlur;
	drawSpacedText(ctx, text, centerX - width / 2, baselineY, letterSpacing);
	ctx.restore();
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
	if (!entry?.rawText.trim()) return;

	const lyrics = getCachedLyricsDocument(entry, durationSec);
	if (lyrics.lines.length === 0) return;

	const adjustedTime = Math.max(
		0,
		currentTimeSec + state.audioLyricsTimeOffsetMs / 1000
	);
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
	const endIndex = Math.min(lyrics.lines.length - 1, activeIndex + radius);
	const maxWidth = canvas.width * state.audioLyricsWidth;
	const centerX =
		state.audioLyricsLayoutMode === 'left-dock'
			? maxWidth / 2 + 36
			: state.audioLyricsLayoutMode === 'right-dock'
				? canvas.width - maxWidth / 2 - 36
				: state.audioLyricsLayoutMode === 'centered'
					? canvas.width / 2
					: canvas.width / 2 + state.audioLyricsPositionX * canvas.width * 0.5;
	const anchorY =
		canvas.height / 2 - state.audioLyricsPositionY * canvas.height * 0.5;
	const lineHeightPx = state.audioLyricsFontSize * state.audioLyricsLineHeight;
	const letterSpacing = state.audioLyricsLetterSpacing;

	ctx.save();
	ctx.font = getFont(state);
	ctx.textBaseline = 'middle';
	ctx.filter = 'none';

	const physicalLines: Array<{
		text: string;
		alpha: number;
		color: string;
		isActive: boolean;
	}> = [];

	for (let index = startIndex; index <= endIndex; index += 1) {
		const lyric = lyrics.lines[index]!;
		const sourceText = state.audioLyricsUppercase
			? lyric.text.toUpperCase()
			: lyric.text;
		const wrapped = wrapText(ctx, sourceText, maxWidth, letterSpacing);
		for (const segment of wrapped) {
			physicalLines.push({
				text: segment,
				alpha:
					index === activeIndex
						? state.audioLyricsOpacity
						: state.audioLyricsOpacity * state.audioLyricsInactiveOpacity,
				color:
					index === activeIndex
						? state.audioLyricsActiveColor
						: state.audioLyricsInactiveColor,
				isActive: index === activeIndex
			});
		}
	}

	if (physicalLines.length === 0) {
		ctx.restore();
		return;
	}

	const totalHeight = physicalLines.length * lineHeightPx;
	const topY = anchorY - totalHeight / 2 + lineHeightPx / 2;
	const maxMeasuredWidth = physicalLines.reduce(
		(max, line) =>
			Math.max(max, measureSpacedTextWidth(ctx, line.text, letterSpacing)),
		0
	);

	if (state.audioLyricsBackdropEnabled) {
		const pad = state.audioLyricsBackdropPadding;
		const boxWidth = maxMeasuredWidth + pad * 2;
		const boxHeight = totalHeight + pad * 2;
		const boxX = centerX - boxWidth / 2;
		const boxY = topY - lineHeightPx / 2 - pad;
		const radiusPx = clamp(
			state.audioLyricsBackdropRadius,
			0,
			Math.min(boxWidth, boxHeight) / 2
		);

		ctx.save();
		ctx.globalAlpha = state.audioLyricsBackdropOpacity;
		ctx.fillStyle = state.audioLyricsBackdropColor;
		ctx.beginPath();
		ctx.moveTo(boxX + radiusPx, boxY);
		ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxHeight, radiusPx);
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

	physicalLines.forEach((line, index) => {
		drawLine(
			ctx,
			line.text,
			centerX,
			topY + index * lineHeightPx,
			letterSpacing,
			line.color,
			clamp(line.alpha, 0, 1),
			state.audioLyricsGlowColor,
			line.isActive ? state.audioLyricsGlowBlur : state.audioLyricsGlowBlur * 0.42
		);
	});

	ctx.restore();
}
