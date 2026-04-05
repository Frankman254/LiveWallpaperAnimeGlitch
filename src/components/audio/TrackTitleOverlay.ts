import type { WallpaperState } from '@/types/wallpaper';

type TrackTitleSettings = Pick<
	WallpaperState,
	| 'audioTrackTitleFontStyle'
	| 'audioTrackTitleLayoutMode'
	| 'audioTrackTitleUppercase'
	| 'audioTrackTitlePositionX'
	| 'audioTrackTitlePositionY'
	| 'audioTrackTitleFontSize'
	| 'audioTrackTitleLetterSpacing'
	| 'audioTrackTitleWidth'
	| 'audioTrackTitleOpacity'
	| 'audioTrackTitleScrollSpeed'
	| 'audioTrackTitleRgbShift'
	| 'audioTrackTitleTextColor'
	| 'audioTrackTitleGlowColor'
	| 'audioTrackTitleGlowBlur'
	| 'audioTrackTitleBackdropEnabled'
	| 'audioTrackTitleBackdropColor'
	| 'audioTrackTitleBackdropOpacity'
	| 'audioTrackTitleBackdropPadding'
	| 'audioTrackTitleFilterBrightness'
	| 'audioTrackTitleFilterContrast'
	| 'audioTrackTitleFilterSaturation'
	| 'audioTrackTitleFilterBlur'
	| 'audioTrackTitleFilterHueRotate'
>;

type TrackTitleRuntime = {
	offset: number;
	effectTime: number;
	lastTitle: string;
	cacheKey: string;
	renderedCanvas: HTMLCanvasElement | null;
	measuredWidth: number;
	canvasPaddingX: number;
};

const runtimeState: TrackTitleRuntime = {
	offset: 0,
	effectTime: 0,
	lastTitle: '',
	cacheKey: '',
	renderedCanvas: null,
	measuredWidth: 0,
	canvasPaddingX: 0
};

const TRACK_TITLE_FONT_STACKS: Record<
	TrackTitleSettings['audioTrackTitleFontStyle'],
	string
> = {
	clean: '"Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "Apple SD Gothic Neo", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	condensed:
		'"Arial Narrow", "Roboto Condensed", "Segoe UI", Arial, "Noto Sans", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	techno: '"Orbitron", "Eurostile", "Trebuchet MS", Verdana, "Segoe UI", "Noto Sans", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	mono: '"SFMono-Regular", Consolas, "Liberation Mono", "Noto Sans Mono", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace',
	serif: 'Georgia, "Times New Roman", "Noto Serif", "Songti SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif'
};

const TRACK_TITLE_FONT_WEIGHT: Record<
	TrackTitleSettings['audioTrackTitleFontStyle'],
	number
> = {
	clean: 700,
	condensed: 800,
	techno: 800,
	mono: 700,
	serif: 700
};

const TRACK_TITLE_STYLE_SPACING_BONUS: Record<
	TrackTitleSettings['audioTrackTitleFontStyle'],
	number
> = {
	clean: 0,
	condensed: 0.8,
	techno: 2.6,
	mono: 1.2,
	serif: 0.3
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function applyRoundedRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
	const safeRadius = clamp(radius, 0, Math.min(width, height) / 2);
	ctx.beginPath();
	ctx.moveTo(x + safeRadius, y);
	ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
	ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
	ctx.arcTo(x, y + height, x, y, safeRadius);
	ctx.arcTo(x, y, x + width, y, safeRadius);
	ctx.closePath();
}

function buildFilterString(settings: TrackTitleSettings): string {
	return [
		`brightness(${settings.audioTrackTitleFilterBrightness})`,
		`contrast(${settings.audioTrackTitleFilterContrast})`,
		`saturate(${settings.audioTrackTitleFilterSaturation})`,
		`blur(${settings.audioTrackTitleFilterBlur}px)`,
		`hue-rotate(${settings.audioTrackTitleFilterHueRotate}deg)`
	].join(' ');
}

function createOffscreenCanvas(
	width: number,
	height: number
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null;
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.ceil(width));
	canvas.height = Math.max(1, Math.ceil(height));
	return canvas;
}

function resolveHorizontalCenter(
	canvas: HTMLCanvasElement,
	settings: TrackTitleSettings,
	boxWidth: number,
	padding: number
): number {
	switch (settings.audioTrackTitleLayoutMode) {
		case 'left-dock':
			return boxWidth / 2 + padding + 16;
		case 'right-dock':
			return canvas.width - (boxWidth / 2 + padding + 16);
		case 'centered':
			return canvas.width / 2;
		case 'free':
		default:
			return (
				canvas.width / 2 +
				settings.audioTrackTitlePositionX * canvas.width * 0.5
			);
	}
}

function drawTextRun(
	ctx: CanvasRenderingContext2D,
	title: string,
	anchorX: number,
	centerY: number,
	rgbShift: number,
	textColor: string,
	letterSpacing: number
) {
	const drawSpacedText = (offsetX: number, color: string) => {
		ctx.save();
		ctx.fillStyle = color;
		let cursor = anchorX + offsetX;
		for (const char of title) {
			ctx.fillText(char, cursor, centerY);
			cursor += ctx.measureText(char).width + letterSpacing;
		}
		ctx.restore();
	};

	if (rgbShift > 0) {
		ctx.save();
		ctx.shadowBlur = 0;
		drawSpacedText(-rgbShift, 'rgba(255, 70, 120, 0.55)');
		drawSpacedText(rgbShift, 'rgba(0, 234, 255, 0.55)');
		ctx.restore();
	}

	drawSpacedText(0, textColor);
}

function buildTitleRenderKey(
	title: string,
	font: string,
	letterSpacing: number,
	rgbShiftPx: number,
	settings: TrackTitleSettings
): string {
	return [
		title,
		font,
		letterSpacing.toFixed(3),
		rgbShiftPx.toFixed(2),
		settings.audioTrackTitleTextColor,
		settings.audioTrackTitleGlowColor,
		settings.audioTrackTitleGlowBlur.toFixed(2),
		settings.audioTrackTitleFilterBrightness.toFixed(3),
		settings.audioTrackTitleFilterContrast.toFixed(3),
		settings.audioTrackTitleFilterSaturation.toFixed(3),
		settings.audioTrackTitleFilterBlur.toFixed(2),
		settings.audioTrackTitleFilterHueRotate.toFixed(1)
	].join('|');
}

function renderTitleToCache(
	title: string,
	font: string,
	fontSize: number,
	letterSpacing: number,
	rgbShiftPx: number,
	settings: TrackTitleSettings
): void {
	const glyphs = Array.from(title);
	const measureCanvas = createOffscreenCanvas(8, 8);
	const measureCtx = measureCanvas?.getContext('2d');
	if (!measureCtx) return;

	measureCtx.font = font;
	measureCtx.textBaseline = 'middle';

	const glyphWidths = glyphs.map(char => measureCtx.measureText(char).width);
	const measuredWidth = glyphWidths.reduce(
		(sum, width, index) =>
			sum + width + (index < glyphWidths.length - 1 ? letterSpacing : 0),
		0
	);

	const padX = Math.ceil(
		12 + Math.max(rgbShiftPx, settings.audioTrackTitleGlowBlur)
	);
	const padY = Math.ceil(
		fontSize * 0.9 +
			settings.audioTrackTitleGlowBlur +
			settings.audioTrackTitleFilterBlur * 2
	);
	const renderCanvas = createOffscreenCanvas(
		measuredWidth + padX * 2,
		fontSize * 2.8 + padY * 2
	);
	const renderCtx = renderCanvas?.getContext('2d');
	if (!renderCanvas || !renderCtx) return;

	renderCtx.font = font;
	renderCtx.textBaseline = 'middle';
	renderCtx.textAlign = 'left';
	renderCtx.filter = buildFilterString(settings);
	renderCtx.shadowColor = settings.audioTrackTitleGlowColor;
	renderCtx.shadowBlur = settings.audioTrackTitleGlowBlur;

	const baselineY = renderCanvas.height / 2;
	const drawSpacedText = (offsetX: number, color: string) => {
		renderCtx.save();
		renderCtx.fillStyle = color;
		let cursor = padX + offsetX;
		for (let index = 0; index < glyphs.length; index++) {
			renderCtx.fillText(glyphs[index], cursor, baselineY);
			cursor +=
				glyphWidths[index] +
				(index < glyphs.length - 1 ? letterSpacing : 0);
		}
		renderCtx.restore();
	};

	if (rgbShiftPx > 0) {
		renderCtx.save();
		renderCtx.shadowBlur = 0;
		drawSpacedText(-rgbShiftPx, 'rgba(255, 70, 120, 0.55)');
		drawSpacedText(rgbShiftPx, 'rgba(0, 234, 255, 0.55)');
		renderCtx.restore();
	}

	drawSpacedText(0, settings.audioTrackTitleTextColor);

	runtimeState.renderedCanvas = renderCanvas;
	runtimeState.measuredWidth = measuredWidth;
	runtimeState.canvasPaddingX = padX;
}

export function drawTrackTitleOverlay(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	title: string,
	dt: number,
	settings: TrackTitleSettings
): void {
	const cleanTitle = (
		settings.audioTrackTitleUppercase ? title.toUpperCase() : title
	).trim();
	if (!cleanTitle) {
		runtimeState.lastTitle = '';
		runtimeState.offset = 0;
		runtimeState.effectTime = 0;
		return;
	}

	if (runtimeState.lastTitle !== cleanTitle) {
		runtimeState.lastTitle = cleanTitle;
		runtimeState.offset = 0;
	}

	const widthRatio = clamp(settings.audioTrackTitleWidth, 0.2, 1);
	const boxWidth = canvas.width * widthRatio;
	const fontSize = clamp(settings.audioTrackTitleFontSize, 12, 160);
	const padding = clamp(settings.audioTrackTitleBackdropPadding, 0, 48);
	const boxHeight = fontSize * 1.55;
	const cx = resolveHorizontalCenter(canvas, settings, boxWidth, padding);
	const cy =
		canvas.height / 2 -
		settings.audioTrackTitlePositionY * canvas.height * 0.5;
	const left = cx - boxWidth / 2;
	const top = cy - boxHeight / 2;
	const gap = fontSize * 1.6;
	const rgbShiftPx =
		clamp(settings.audioTrackTitleRgbShift, 0, 0.03) * canvas.width;
	const effectiveLetterSpacing = clamp(
		settings.audioTrackTitleLetterSpacing +
			TRACK_TITLE_STYLE_SPACING_BONUS[settings.audioTrackTitleFontStyle],
		0,
		fontSize * 0.4
	);
	const font = `${TRACK_TITLE_FONT_WEIGHT[settings.audioTrackTitleFontStyle]} ${fontSize}px ${TRACK_TITLE_FONT_STACKS[settings.audioTrackTitleFontStyle]}`;

	ctx.save();
	ctx.globalAlpha = clamp(settings.audioTrackTitleOpacity, 0, 1);
	ctx.font = font;
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';

	const cacheKey = buildTitleRenderKey(
		cleanTitle,
		font,
		effectiveLetterSpacing,
		rgbShiftPx,
		settings
	);
	if (runtimeState.cacheKey !== cacheKey || !runtimeState.renderedCanvas) {
		runtimeState.cacheKey = cacheKey;
		renderTitleToCache(
			cleanTitle,
			font,
			fontSize,
			effectiveLetterSpacing,
			rgbShiftPx,
			settings
		);
	}

	runtimeState.effectTime += dt;

	const measuredWidth = runtimeState.measuredWidth;
	const shouldScroll =
		measuredWidth > boxWidth && settings.audioTrackTitleScrollSpeed > 0;
	if (shouldScroll) {
		const cycle = measuredWidth + gap;
		runtimeState.offset =
			(runtimeState.offset + settings.audioTrackTitleScrollSpeed * dt) %
			cycle;
	} else {
		runtimeState.offset = 0;
	}

	if (settings.audioTrackTitleBackdropEnabled) {
		ctx.save();
		ctx.fillStyle = settings.audioTrackTitleBackdropColor;
		ctx.globalAlpha *= clamp(settings.audioTrackTitleBackdropOpacity, 0, 1);
		applyRoundedRectPath(
			ctx,
			left - padding,
			top - padding * 0.65,
			boxWidth + padding * 2,
			boxHeight + padding * 1.3,
			Math.max(10, fontSize * 0.45)
		);
		ctx.fill();
		ctx.restore();
	}

	ctx.save();
	applyRoundedRectPath(
		ctx,
		left,
		top,
		boxWidth,
		boxHeight,
		Math.max(8, fontSize * 0.35)
	);
	ctx.clip();
	ctx.filter = 'none';
	ctx.shadowBlur = 0;

	const renderedCanvas = runtimeState.renderedCanvas;

	if (renderedCanvas && shouldScroll) {
		const cycle = measuredWidth + gap;
		const anchorX = left - runtimeState.offset;
		const drawX = anchorX - runtimeState.canvasPaddingX;
		ctx.drawImage(renderedCanvas, drawX, cy - renderedCanvas.height / 2);
		ctx.drawImage(
			renderedCanvas,
			drawX + cycle,
			cy - renderedCanvas.height / 2
		);
	} else if (renderedCanvas) {
		ctx.drawImage(
			renderedCanvas,
			cx - measuredWidth / 2 - runtimeState.canvasPaddingX,
			cy - renderedCanvas.height / 2
		);
	} else if (shouldScroll) {
		const cycle = measuredWidth + gap;
		const anchorX = left - runtimeState.offset;
		drawTextRun(
			ctx,
			cleanTitle,
			anchorX,
			cy,
			rgbShiftPx,
			settings.audioTrackTitleTextColor,
			effectiveLetterSpacing
		);
		drawTextRun(
			ctx,
			cleanTitle,
			anchorX + cycle,
			cy,
			rgbShiftPx,
			settings.audioTrackTitleTextColor,
			effectiveLetterSpacing
		);
	} else {
		drawTextRun(
			ctx,
			cleanTitle,
			cx - measuredWidth / 2,
			cy,
			rgbShiftPx,
			settings.audioTrackTitleTextColor,
			effectiveLetterSpacing
		);
	}

	ctx.restore();
	ctx.restore();
}
