/**
 * macOS-style "liquid glass" panel for canvas overlays.
 *
 * The panel CENTRE is left fully transparent — the wallpaper shows through
 * untouched. Only the interior RIM behaves like the edge of a glass lens: it
 * samples the wallpaper behind it and draws it magnified (and optionally
 * softened + tinted), so the background appears to bend/enlarge along the border
 * the way it does at the lip of real glass. A specular hairline and a rim-cast
 * drop shadow complete the look. This is the "lupa en los bordes" effect —
 * distinct from a full-panel frost, which would just grey out the content.
 *
 * Because overlays draw onto the SAME canvas as the already-rendered wallpaper
 * (background + spectrum + logo were painted earlier in the layer order), the
 * canvas itself is the backdrop source — no separate capture pass is needed.
 */

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Appends a rounded-rect subpath WITHOUT starting a new path — so several can
 *  be combined into one path for an even-odd (ring) clip. */
function appendRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
): void {
	if (w <= 0 || h <= 0) return;
	const radius = clamp(r, 0, Math.min(w, h) / 2);
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}

function roundedRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
): void {
	ctx.beginPath();
	appendRoundedRect(ctx, x, y, w, h, r);
}

// One reused scratch canvas across frames — the blur pass happens here so we
// never blur the whole wallpaper canvas onto itself.
let scratch: HTMLCanvasElement | null = null;
function getScratch(w: number, h: number): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null;
	if (!scratch) scratch = document.createElement('canvas');
	if (scratch.width !== w) scratch.width = w;
	if (scratch.height !== h) scratch.height = h;
	return scratch;
}

export type LiquidGlassOptions = {
	/** Softness (px) of the refractive rim — blurs the magnified edge sample. */
	blur?: number;
	/** Edge-lens magnification: how much the rim enlarges the background behind
	 *  it (1 = flat, 1.2 ≈ a visible glass lip). The centre stays transparent. */
	magnify?: number;
	/** Saturation boost applied to the rim sample (macOS "vibrancy"). */
	saturate?: number;
	/** Tint hue drawn over the rim, as `#rrggbb`. */
	tintColor?: string;
	/** Strength of the rim tint, 0 (clear glass) → 1 (opaque). */
	tintOpacity?: number;
	/** Rim specular-highlight strength, 0 → 1. */
	sheen?: number;
	/** Overall panel alpha multiplier (combines with ctx.globalAlpha). */
	alpha?: number;
	/** Draw the soft drop shadow around the panel. */
	shadow?: boolean;
	/** Controls the number of refraction bands and chromatic edge pass. */
	quality?: 'low' | 'medium' | 'high';
};

export type LiquidGlassBand = {
	outerInset: number;
	innerInset: number;
	magnify: number;
	fresnel: number;
};

export function resolveLiquidGlassBands(
	edge: number,
	magnify: number,
	quality: NonNullable<LiquidGlassOptions['quality']> = 'high'
): LiquidGlassBand[] {
	const bandCount = quality === 'low' ? 2 : quality === 'medium' ? 3 : 4;
	const safeEdge = Math.max(0, edge);
	const safeMagnify = clamp(magnify, 1, 1.6);
	return Array.from({ length: bandCount }, (_, index) => {
		const progress = index / (bandCount - 1);
		const lensWeight = Math.pow(1 - progress, 1.65);
		return {
			outerInset: (safeEdge * index) / bandCount,
			innerInset: (safeEdge * (index + 1)) / bandCount,
			magnify: 1 + (safeMagnify - 1) * lensWeight,
			fresnel: 0.18 + 0.82 * Math.pow(1 - progress, 1.35)
		};
	});
}

function clipRoundedRectRing(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	radius: number,
	outerInset: number,
	innerInset: number
): void {
	const outerW = w - outerInset * 2;
	const outerH = h - outerInset * 2;
	const innerW = w - innerInset * 2;
	const innerH = h - innerInset * 2;
	ctx.beginPath();
	appendRoundedRect(
		ctx,
		x + outerInset,
		y + outerInset,
		outerW,
		outerH,
		Math.max(0, radius - outerInset)
	);
	if (innerW > 1 && innerH > 1) {
		appendRoundedRect(
			ctx,
			x + innerInset,
			y + innerInset,
			innerW,
			innerH,
			Math.max(0, radius - innerInset)
		);
		ctx.clip('evenodd');
		return;
	}
	ctx.clip();
}

function drawMagnifiedBackdrop(
	ctx: CanvasRenderingContext2D,
	source: HTMLCanvasElement,
	x: number,
	y: number,
	w: number,
	h: number,
	margin: number,
	magnify: number,
	offsetX = 0
): void {
	const invMagnify = 1 / magnify;
	const sourceWidth = w * invMagnify;
	const sourceHeight = h * invMagnify;
	const sourceX = margin + (w - sourceWidth) / 2 - offsetX;
	const sourceY = margin + (h - sourceHeight) / 2;
	ctx.drawImage(
		source,
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		x,
		y,
		w,
		h
	);
}

/** Parses `#rgb`/`#rrggbb` into an `{r,g,b}` triple; falls back to dark navy. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const value = hex.trim().replace('#', '');
	if (value.length === 3) {
		const r = parseInt(value[0] + value[0], 16);
		const g = parseInt(value[1] + value[1], 16);
		const b = parseInt(value[2] + value[2], 16);
		if ([r, g, b].every(Number.isFinite)) return { r, g, b };
	}
	if (value.length === 6) {
		const r = parseInt(value.slice(0, 2), 16);
		const g = parseInt(value.slice(2, 4), 16);
		const b = parseInt(value.slice(4, 6), 16);
		if ([r, g, b].every(Number.isFinite)) return { r, g, b };
	}
	return { r: 2, g: 6, b: 23 };
}

/**
 * Renders a liquid-glass panel filling the given rounded rectangle. `source` is
 * the canvas whose already-drawn pixels act as the backdrop (normally the same
 * canvas as `ctx`). Text/content should be drawn by the caller AFTER this call.
 */
export function drawLiquidGlassPanel(
	ctx: CanvasRenderingContext2D,
	source: HTMLCanvasElement,
	x: number,
	y: number,
	w: number,
	h: number,
	radius: number,
	opts: LiquidGlassOptions = {}
): void {
	if (w <= 1 || h <= 1) return;

	const blur = Math.max(0, opts.blur ?? 10);
	const magnify = clamp(opts.magnify ?? 1.2, 1, 1.6);
	const saturate = clamp(opts.saturate ?? 1.25, 1, 3);
	const tintRgb = hexToRgb(opts.tintColor ?? '#96a0be');
	const tintOpacity = clamp(opts.tintOpacity ?? 0.1, 0, 1);
	const sheen = clamp(opts.sheen ?? 0.5, 0, 1);
	const alpha = clamp(opts.alpha ?? 1, 0, 1);
	const drawShadow = opts.shadow ?? true;
	const quality = opts.quality ?? 'high';
	const r = clamp(radius, 0, Math.min(w, h) / 2);

	// The refractive rim band. The panel centre is left fully transparent — the
	// wallpaper shows through untouched — so only this rim bends/enlarges the
	// background, the way the edge of a real glass lens does.
	const edge = clamp(Math.min(w, h) * 0.2, 10, Math.min(w, h) * 0.5);
	const innerR = Math.max(0, r - edge);

	ctx.save();
	ctx.globalAlpha *= alpha;

	// ── Soft drop shadow (rim-cast, never fills the centre) ───────────────
	if (drawShadow) {
		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
		ctx.shadowBlur = 18;
		ctx.shadowOffsetY = 8;
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
		roundedRectPath(ctx, x + 1, y + 1, w - 2, h - 2, r);
		ctx.stroke();
		ctx.restore();
	}

	// ── Refractive edge lens ─────────────────────────────────────────────
	// Sample a margin around the panel so the blur doesn't darken toward the
	// transparent edges. Clamp the sample rect to the source bounds.
	const margin = Math.ceil(blur * 1.5 + 4);
	const ex = x - margin;
	const ey = y - margin;
	const ew = w + margin * 2;
	const eh = h + margin * 2;

	const off = getScratch(Math.ceil(ew), Math.ceil(eh));
	if (off) {
		const octx = off.getContext('2d');
		if (octx) {
			octx.clearRect(0, 0, off.width, off.height);
			const csx = Math.max(0, ex);
			const csy = Math.max(0, ey);
			const cex = Math.min(source.width, ex + ew);
			const cey = Math.min(source.height, ey + eh);
			const csw = cex - csx;
			const csh = cey - csy;
			if (csw > 0 && csh > 0) {
				octx.filter =
					blur > 0
						? `blur(${blur}px) saturate(${saturate})`
						: `saturate(${saturate})`;
				octx.drawImage(
					source,
					csx,
					csy,
					csw,
					csh,
					csx - ex,
					csy - ey,
					csw,
					csh
				);
				octx.filter = 'none';
			}

			// Progressive bands approximate a curved lens: the outer lip bends
			// hardest while the innermost band settles to 1×, avoiding the old
			// hard jump from uniformly magnified rim to transparent centre.
			const bands = resolveLiquidGlassBands(edge, magnify, quality);
			for (const band of bands) {
				ctx.save();
				clipRoundedRectRing(
					ctx,
					x,
					y,
					w,
					h,
					r,
					band.outerInset,
					band.innerInset
				);
				drawMagnifiedBackdrop(
					ctx,
					off,
					x,
					y,
					w,
					h,
					margin,
					band.magnify
				);
				if (tintOpacity > 0) {
					ctx.fillStyle = `rgba(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b}, ${tintOpacity * band.fresnel})`;
					ctx.fillRect(x, y, w, h);
				}
				ctx.restore();
			}

			// High quality adds a restrained red/cyan split only at the outer
			// half of the lip. It reads as dispersion, not a glitch effect.
			if (quality === 'high' && magnify > 1.01) {
				ctx.save();
				clipRoundedRectRing(ctx, x, y, w, h, r, 0, edge * 0.52);
				ctx.globalCompositeOperation = 'screen';
				ctx.globalAlpha *= 0.045;
				ctx.filter = 'sepia(1) saturate(7) hue-rotate(315deg)';
				drawMagnifiedBackdrop(
					ctx,
					off,
					x - 0.75,
					y,
					w,
					h,
					margin,
					magnify,
					-0.75
				);
				ctx.filter = 'sepia(1) saturate(7) hue-rotate(145deg)';
				drawMagnifiedBackdrop(
					ctx,
					off,
					x + 0.75,
					y,
					w,
					h,
					margin,
					magnify,
					0.75
				);
				ctx.restore();
			}
		}
	}

	// ── Specular rim highlights ──────────────────────────────────────────
	// Directional gradients make highlights follow an implied top-left light
	// source instead of outlining the whole card with two uniform white lines.
	if (sheen > 0) {
		ctx.save();
		ctx.lineWidth = 1.25;
		const outerSpecular = ctx.createLinearGradient(x, y, x + w, y + h);
		outerSpecular.addColorStop(
			0,
			`rgba(255, 255, 255, ${clamp(sheen * 0.95, 0, 1)})`
		);
		outerSpecular.addColorStop(
			0.32,
			`rgba(255, 255, 255, ${clamp(sheen * 0.42, 0, 1)})`
		);
		outerSpecular.addColorStop(0.62, 'rgba(255, 255, 255, 0.035)');
		outerSpecular.addColorStop(
			1,
			`rgba(255, 255, 255, ${clamp(sheen * 0.14, 0, 1)})`
		);
		ctx.strokeStyle = outerSpecular;
		roundedRectPath(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
		ctx.stroke();

		ctx.lineWidth = 1;
		const innerSpecular = ctx.createLinearGradient(x + w, y + h, x, y);
		innerSpecular.addColorStop(
			0,
			`rgba(255, 255, 255, ${clamp(sheen * 0.2, 0, 1)})`
		);
		innerSpecular.addColorStop(0.45, 'rgba(255, 255, 255, 0.025)');
		innerSpecular.addColorStop(
			1,
			`rgba(255, 255, 255, ${clamp(sheen * 0.48, 0, 1)})`
		);
		ctx.strokeStyle = innerSpecular;
		roundedRectPath(
			ctx,
			x + edge,
			y + edge,
			w - edge * 2,
			h - edge * 2,
			innerR
		);
		ctx.stroke();
		ctx.restore();
	}

	ctx.restore();
}
