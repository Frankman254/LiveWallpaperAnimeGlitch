import type { LyrixaLyricClip, LyrixaLyricLayer } from './lyrixaBundleTypes';
import type {
	LyrixaClipPositionPreset,
	LyrixaLyricsBundleEnvelope,
	LyrixaLyricVisualStyle
} from './lyrixaBundleTypes';
import {
	DEFAULT_LYRIXA_LYRIC_STYLE
} from './lyrixaBundleTypes';
import { mergeLyrixaVisualStyle } from './lyrixaBundle';

type Anchor = {
	x: number;
	y: number;
	align: CanvasTextAlign;
};

type RenderableBundleLine = {
	text: string;
	style: LyrixaLyricVisualStyle;
	anchor: Anchor;
	zIndex: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function parseCssNumber(
	value: string | number | undefined,
	fontSizePx = 16
): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value !== 'string') return 0;
	const trimmed = value.trim();
	if (!trimmed) return 0;
	if (trimmed.endsWith('rem')) {
		return Number.parseFloat(trimmed) * 16;
	}
	if (trimmed.endsWith('em')) {
		return Number.parseFloat(trimmed) * fontSizePx;
	}
	if (trimmed.endsWith('px')) {
		return Number.parseFloat(trimmed);
	}
	return Number.parseFloat(trimmed);
}

function resolveAnchorFromPreset(
	preset: LyrixaClipPositionPreset,
	canvas: HTMLCanvasElement
): Anchor {
	const marginX = canvas.width * 0.08;
	const marginY = canvas.height * 0.12;
	switch (preset) {
		case 'top':
			return { x: canvas.width / 2, y: marginY, align: 'center' };
		case 'bottom':
			return {
				x: canvas.width / 2,
				y: canvas.height - marginY,
				align: 'center'
			};
		case 'top-left':
			return { x: marginX, y: marginY, align: 'left' };
		case 'top-right':
			return {
				x: canvas.width - marginX,
				y: marginY,
				align: 'right'
			};
		case 'bottom-left':
			return {
				x: marginX,
				y: canvas.height - marginY,
				align: 'left'
			};
		case 'bottom-right':
			return {
				x: canvas.width - marginX,
				y: canvas.height - marginY,
				align: 'right'
			};
		case 'center':
		default:
			return {
				x: canvas.width / 2,
				y: canvas.height / 2,
				align: 'center'
			};
	}
}

function resolveTextTransform(
	text: string,
	transform: LyrixaLyricVisualStyle['textTransform']
): string {
	if (transform === 'uppercase') return text.toUpperCase();
	if (transform === 'lowercase') return text.toLowerCase();
	return text;
}

function resolveLineAnchor(
	layer: LyrixaLyricLayer,
	clip: LyrixaLyricClip,
	canvas: HTMLCanvasElement,
	indexInLayer: number,
	lineHeightPx: number
): Anchor {
	if (clip.coords) {
		return {
			x: clip.coords.x * canvas.width,
			y: clip.coords.y * canvas.height + indexInLayer * lineHeightPx,
			align: 'center'
		};
	}

	const preset =
		clip.position && clip.position !== 'center'
			? clip.position
			: layer.renderSettings?.positionPreset ?? 'center';
	const anchor = resolveAnchorFromPreset(preset, canvas);
	const textAlign = layer.renderSettings?.textAlign;
	const baselineOffset = indexInLayer * lineHeightPx;
	return {
		x: anchor.x,
		y: anchor.y + baselineOffset,
		align:
			textAlign === 'left' || textAlign === 'right' || textAlign === 'center'
				? textAlign
				: anchor.align
	};
}

function strokeAndFillText(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor,
	style: LyrixaLyricVisualStyle
) {
	if ((style.strokeWidth ?? 0) > 0) {
		ctx.lineJoin = 'round';
		ctx.lineWidth = Math.max(0, style.strokeWidth ?? 0);
		ctx.strokeStyle =
			style.strokeColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.strokeColor;
		ctx.strokeText(text, anchor.x, anchor.y);
	}
	ctx.fillStyle = style.textColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.textColor;
	ctx.fillText(text, anchor.x, anchor.y);
}

function drawBackgroundPill(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor,
	style: LyrixaLyricVisualStyle,
	fontSizePx: number
) {
	if (!style.backgroundPill && !style.backgroundEmphasis) return;
	const metrics = ctx.measureText(text);
	const width = metrics.width + fontSizePx * 0.8;
	const height = fontSizePx * 1.35;
	const x =
		anchor.align === 'left'
			? anchor.x - fontSizePx * 0.25
			: anchor.align === 'right'
				? anchor.x - width + fontSizePx * 0.25
				: anchor.x - width / 2;
	const y = anchor.y - height / 2;
	const radius = height / 2;

	ctx.save();
	ctx.globalAlpha = clamp(
		style.backgroundOpacity ?? DEFAULT_LYRIXA_LYRIC_STYLE.backgroundOpacity,
		0,
		1
	);
	ctx.fillStyle =
		style.backgroundColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.backgroundColor;
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + width, y, x + width, y + height, radius);
	ctx.arcTo(x + width, y + height, x, y + height, radius);
	ctx.arcTo(x, y + height, x, y, radius);
	ctx.arcTo(x, y, x + width, y, radius);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function collectRenderableLines(
	envelope: LyrixaLyricsBundleEnvelope,
	canvas: HTMLCanvasElement,
	currentTimeSec: number
): RenderableBundleLine[] {
	const layers = [...envelope.project.layers]
		.filter(layer => layer.visible !== false)
		.sort((a, b) => a.order - b.order);
	const lines: RenderableBundleLine[] = [];

	layers.forEach(layer => {
		const layerClips = envelope.project.clips
			.filter(
				clip =>
					clip.layerId === layer.id &&
					!clip.muted &&
					currentTimeSec >= clip.startTime &&
					currentTimeSec <= clip.endTime
			)
			.sort((a, b) => a.startTime - b.startTime);
		layerClips.forEach((clip, index) => {
			const style = mergeLyrixaVisualStyle(
				envelope.project.styleConfig,
				layer.styleDefaults,
				clip.styleOverride
			);
			const fontSizePx = Math.max(
				12,
				parseCssNumber(
					style.fontSize ?? DEFAULT_LYRIXA_LYRIC_STYLE.fontSize
				)
			);
			const lineHeightMultiplier = Math.max(
				0.8,
				parseCssNumber(
					style.lineHeight ?? DEFAULT_LYRIXA_LYRIC_STYLE.lineHeight,
					fontSizePx
				)
			);
			const anchor = resolveLineAnchor(
				layer,
				clip,
				canvas,
				index,
				fontSizePx * lineHeightMultiplier
			);
			lines.push({
				text: resolveTextTransform(
					clip.text,
					style.textTransform ?? DEFAULT_LYRIXA_LYRIC_STYLE.textTransform
				),
				style,
				anchor,
				zIndex: layer.renderSettings?.zIndex ?? layer.order
			});
		});
	});

	return lines.sort((a, b) => a.zIndex - b.zIndex);
}

export function drawLyrixaLyricsBundle(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	envelope: LyrixaLyricsBundleEnvelope,
	currentTimeSec: number
) {
	const lines = collectRenderableLines(envelope, canvas, currentTimeSec);
	if (lines.length === 0) return;

	ctx.save();
	ctx.textBaseline = 'middle';

	lines.forEach(line => {
		const style = line.style;
		const fontSizePx = Math.max(
			12,
			parseCssNumber(
				style.fontSize ?? DEFAULT_LYRIXA_LYRIC_STYLE.fontSize
			)
		);
		const fontWeight =
			style.fontWeight ?? DEFAULT_LYRIXA_LYRIC_STYLE.fontWeight;
		const fontFamily =
			style.fontFamily && style.fontFamily !== 'inherit'
				? style.fontFamily
				: '"Inter", "Segoe UI", Arial, sans-serif';
		const blurPx = Math.max(
			0,
			parseCssNumber(
				style.blurAmount ?? DEFAULT_LYRIXA_LYRIC_STYLE.blurAmount
			)
		);
		const glowIntensity = clamp(
			style.glowIntensity ?? DEFAULT_LYRIXA_LYRIC_STYLE.glowIntensity,
			0,
			4
		);
		const alpha = clamp(
			style.opacity ?? DEFAULT_LYRIXA_LYRIC_STYLE.opacity,
			0,
			1
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.textAlign = line.anchor.align;
		ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
		ctx.shadowColor =
			style.glowColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.glowColor;
		ctx.shadowBlur = glowIntensity * 16;
		ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';

		drawBackgroundPill(
			ctx,
			line.text,
			line.anchor,
			style,
			fontSizePx
		);
		strokeAndFillText(ctx, line.text, line.anchor, style);
		ctx.restore();
	});

	ctx.restore();
}
