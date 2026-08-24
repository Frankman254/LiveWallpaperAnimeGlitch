import type { LyrixaLyricClip, LyrixaLyricLayer } from './lyrixaBundleTypes';
import type { LyrixaLayerOverride, LyrixaLayerOverrideMap } from './types';
import type {
	LyrixaClipPositionPreset,
	LyrixaLyricsBundleEnvelope,
	LyrixaLyricVisualStyle
} from './lyrixaBundleTypes';
import { DEFAULT_LYRIXA_LYRIC_STYLE } from './lyrixaBundleTypes';
import { mergeLyrixaVisualStyle } from './lyrixaBundle';
import {
	createLyricsHorizontalPaint,
	isMultiColorLyricsMode
} from './lyricsColorModes';

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
	/** Kept alongside the merged style: the color MODES live on the override
	 *  only, they have no equivalent in the bundle's own style config. */
	override?: LyrixaLayerOverride;
};

type LyrixaLyricsBundleRenderOptions = {
	layerOverrides?: LyrixaLayerOverrideMap;
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
			: (layer.renderSettings?.positionPreset ?? 'center');
	const anchor = resolveAnchorFromPreset(preset, canvas);
	const textAlign = layer.renderSettings?.textAlign;
	const baselineOffset = indexInLayer * lineHeightPx;
	return {
		x: anchor.x,
		y: anchor.y + baselineOffset,
		align:
			textAlign === 'left' ||
			textAlign === 'right' ||
			textAlign === 'center'
				? textAlign
				: anchor.align
	};
}

function applyAnchorOverride(
	anchor: Anchor,
	override: LyrixaLayerOverride | undefined,
	canvas: HTMLCanvasElement
): Anchor {
	if (!override) return anchor;
	const offsetX = clamp(override.positionOffsetX ?? 0, -2, 2);
	const offsetY = clamp(override.positionOffsetY ?? 0, -2, 2);
	return {
		...anchor,
		x: anchor.x + offsetX * canvas.width,
		y: anchor.y - offsetY * canvas.height
	};
}

function applyLayerStyleOverride(
	style: LyrixaLyricVisualStyle,
	override: LyrixaLayerOverride | undefined
): LyrixaLyricVisualStyle {
	if (!override) return style;
	const next: LyrixaLyricVisualStyle = { ...style };
	if (override.textColor) {
		next.textColor = override.textColor;
		next.activeTextColor = override.textColor;
	}
	if (override.glowColor) next.glowColor = override.glowColor;
	if (override.glowIntensity !== undefined) {
		next.glowIntensity = clamp(override.glowIntensity, 0, 4);
	}
	if (override.blurAmount !== undefined) {
		next.blurAmount = clamp(override.blurAmount, 0, 80);
	}
	if (override.opacity !== undefined) {
		next.opacity = clamp(override.opacity, 0, 1);
	}
	if (override.scale !== undefined) {
		const baseFontSize = Math.max(
			12,
			parseCssNumber(next.fontSize ?? DEFAULT_LYRIXA_LYRIC_STYLE.fontSize)
		);
		next.fontSize = `${baseFontSize * clamp(override.scale, 0.2, 4)}px`;
	}
	return next;
}

/** Horizontal extent of the drawn text run, given the anchor's alignment. */
function resolveTextRunBounds(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor
): { left: number; right: number; width: number } {
	const width = Math.max(1, ctx.measureText(text).width);
	const left =
		anchor.align === 'left'
			? anchor.x
			: anchor.align === 'right'
				? anchor.x - width
				: anchor.x - width / 2;
	return { left, right: left + width, width };
}

function resolveCanvasFillStyle(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor,
	style: LyrixaLyricVisualStyle,
	fontSizePx: number,
	override?: LyrixaLayerOverride
): string | CanvasGradient {
	const fill = style.textFill;
	const solidFallback =
		fill?.solidColor ??
		style.textColor ??
		DEFAULT_LYRIXA_LYRIC_STYLE.textColor;
	// An explicit gradient/rainbow choice in the layer panel outranks the
	// bundle's own textFill; solid falls through to the untouched paths below.
	if (isMultiColorLyricsMode(override?.textColorMode)) {
		const bounds = resolveTextRunBounds(ctx, text, anchor);
		return createLyricsHorizontalPaint(
			ctx,
			{
				mode: override?.textColorMode,
				primary: override?.textColor ?? solidFallback,
				secondary: override?.textColorSecondary
			},
			bounds.left,
			bounds.right
		);
	}
	if (fill?.type === 'gradient' && fill.gradient) {
		const bounds = resolveTextRunBounds(ctx, text, anchor);
		const height = Math.max(1, fontSizePx);
		const cx = bounds.left + bounds.width / 2;
		const cy = anchor.y;
		const angleRad = ((fill.gradient.angle ?? 0) * Math.PI) / 180;
		const radius = Math.max(bounds.width, height) / 2;
		const dx = Math.cos(angleRad) * radius;
		const dy = Math.sin(angleRad) * radius;
		const gradient = ctx.createLinearGradient(
			cx - dx,
			cy - dy,
			cx + dx,
			cy + dy
		);
		gradient.addColorStop(0, fill.gradient.colorA);
		gradient.addColorStop(1, fill.gradient.colorB);
		return gradient;
	}
	// image-texture: requires loading the asset's objectUrl into an Image
	// and masking it against the text — out of scope for now. Fall back to solid.
	return solidFallback;
}

function strokeAndFillText(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor,
	style: LyrixaLyricVisualStyle,
	fontSizePx: number,
	override?: LyrixaLayerOverride
) {
	if ((style.strokeWidth ?? 0) > 0) {
		ctx.lineJoin = 'round';
		ctx.lineWidth = Math.max(0, style.strokeWidth ?? 0);
		ctx.strokeStyle =
			style.strokeColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.strokeColor;
		ctx.strokeText(text, anchor.x, anchor.y);
	}
	ctx.fillStyle = resolveCanvasFillStyle(
		ctx,
		text,
		anchor,
		style,
		fontSizePx,
		override
	);
	ctx.fillText(text, anchor.x, anchor.y);
}

/**
 * Multicolor halo.
 *
 * `ctx.shadowColor` only accepts a CSS color, never a CanvasGradient, so a
 * gradient/rainbow glow cannot go through the shadow path at all. Instead the
 * text is painted once with the gradient and blurred via `ctx.filter`, under
 * the real text — the halo itself is genuinely multicolor, not a rainbow
 * letter wearing a single-color shadow.
 */
function drawMultiColorGlowPass(
	ctx: CanvasRenderingContext2D,
	text: string,
	anchor: Anchor,
	style: LyrixaLyricVisualStyle,
	override: LyrixaLayerOverride,
	glowIntensity: number,
	blurPx: number
) {
	if (glowIntensity <= 0.01) return;
	const bounds = resolveTextRunBounds(ctx, text, anchor);
	const paint = createLyricsHorizontalPaint(
		ctx,
		{
			mode: override.glowColorMode,
			primary:
				override.glowColor ??
				style.glowColor ??
				DEFAULT_LYRIXA_LYRIC_STYLE.glowColor,
			secondary: override.glowColorSecondary
		},
		bounds.left,
		bounds.right
	);
	ctx.save();
	// Half the shadow radius: a filter blur spreads symmetrically around the
	// glyph, so it reads about as wide as shadowBlur at twice the value.
	ctx.filter = `blur(${glowIntensity * 8 + blurPx}px)`;
	ctx.fillStyle = paint;
	// A second pass approximates the shadow's additive brightening at high
	// intensities, matching how the solid halo gains presence.
	const passes = glowIntensity > 1.5 ? 2 : 1;
	for (let pass = 0; pass < passes; pass += 1) {
		ctx.fillText(text, anchor.x, anchor.y);
	}
	ctx.restore();
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
	currentTimeSec: number,
	options: LyrixaLyricsBundleRenderOptions = {}
): RenderableBundleLine[] {
	const layerOverrides = options.layerOverrides ?? {};
	const layers = [...envelope.project.layers]
		.filter(
			layer =>
				layer.visible !== false ||
				layerOverrides[layer.id]?.visible === true
		)
		.sort((a, b) => a.order - b.order);
	const lines: RenderableBundleLine[] = [];

	layers.forEach(layer => {
		const layerOverride = layerOverrides[layer.id];
		if (layerOverride?.visible === false) return;
		const layerClips = envelope.project.clips
			.filter(
				clip =>
					clip.layerId === layer.id &&
					!clip.muted &&
					(!layer.renderSettings?.suppressClipText ||
						clip.forceTextRender) &&
					currentTimeSec >= clip.startTime &&
					currentTimeSec <= clip.endTime
			)
			.sort((a, b) => a.startTime - b.startTime);
		layerClips.forEach((clip, index) => {
			const style = applyLayerStyleOverride(
				mergeLyrixaVisualStyle(
					envelope.project.styleConfig,
					layer.styleDefaults,
					clip.styleOverride
				),
				layerOverride
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
			const anchor = applyAnchorOverride(
				resolveLineAnchor(
					layer,
					clip,
					canvas,
					index,
					fontSizePx * lineHeightMultiplier
				),
				layerOverride,
				canvas
			);
			lines.push({
				text: resolveTextTransform(
					clip.text,
					style.textTransform ??
						DEFAULT_LYRIXA_LYRIC_STYLE.textTransform
				),
				style,
				anchor,
				zIndex: layer.renderSettings?.zIndex ?? layer.order,
				override: layerOverride
			});
		});
	});

	return lines.sort((a, b) => a.zIndex - b.zIndex);
}

export function drawLyrixaLyricsBundle(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	envelope: LyrixaLyricsBundleEnvelope,
	currentTimeSec: number,
	options: LyrixaLyricsBundleRenderOptions = {}
) {
	const lines = collectRenderableLines(
		envelope,
		canvas,
		currentTimeSec,
		options
	);
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

		const glowIsMultiColor = isMultiColorLyricsMode(
			line.override?.glowColorMode
		);

		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.textAlign = line.anchor.align;
		ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;
		if (glowIsMultiColor) {
			// The shadow would otherwise stack a single-color halo on top of
			// the gradient one drawn below.
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
		} else {
			ctx.shadowColor =
				style.glowColor ?? DEFAULT_LYRIXA_LYRIC_STYLE.glowColor;
			ctx.shadowBlur = glowIntensity * 16;
		}
		ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';

		drawBackgroundPill(ctx, line.text, line.anchor, style, fontSizePx);
		// Between pill and text, mirroring where the solid halo lands.
		if (glowIsMultiColor && line.override) {
			drawMultiColorGlowPass(
				ctx,
				line.text,
				line.anchor,
				style,
				line.override,
				glowIntensity,
				blurPx
			);
		}
		strokeAndFillText(
			ctx,
			line.text,
			line.anchor,
			style,
			fontSizePx,
			line.override
		);
		ctx.restore();
	});

	ctx.restore();
}
