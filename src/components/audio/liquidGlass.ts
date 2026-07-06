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
};

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
	const tint = `rgba(${tintRgb.r}, ${tintRgb.g}, ${tintRgb.b}, ${tintOpacity})`;
	const sheen = clamp(opts.sheen ?? 0.5, 0, 1);
	const alpha = clamp(opts.alpha ?? 1, 0, 1);
	const drawShadow = opts.shadow ?? true;
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

			// Clip to the RING only (outer rounded rect minus the inner one), so
			// the magnified backdrop shows solely along the rim — the lens lip.
			ctx.save();
			ctx.beginPath();
			appendRoundedRect(ctx, x, y, w, h, r);
			appendRoundedRect(
				ctx,
				x + edge,
				y + edge,
				w - edge * 2,
				h - edge * 2,
				innerR
			);
			ctx.clip('evenodd');

			// Enlarge the sampled backdrop about the panel centre; the rim then
			// reveals content pushed outward — the tell-tale glass magnification.
			const invMag = 1 / magnify;
			const srcW = w * invMag;
			const srcH = h * invMag;
			const srcX = margin + (w - srcW) / 2;
			const srcY = margin + (h - srcH) / 2;
			ctx.drawImage(off, srcX, srcY, srcW, srcH, x, y, w, h);

			// Optional rim tint (hue only — kept light so the glass stays clear).
			if (tintOpacity > 0) {
				ctx.fillStyle = tint;
				ctx.fillRect(x, y, w, h);
			}
			ctx.restore();
		}
	}

	// ── Specular rim highlights ──────────────────────────────────────────
	// A bright outer hairline and a softer inner one give the rim its wet,
	// beveled glass look without touching the transparent centre.
	if (sheen > 0) {
		ctx.save();
		ctx.lineWidth = 1.25;
		ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(sheen * 0.9, 0, 1)})`;
		roundedRectPath(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
		ctx.stroke();

		ctx.lineWidth = 1;
		ctx.strokeStyle = `rgba(255, 255, 255, ${clamp(sheen * 0.35, 0, 1)})`;
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
