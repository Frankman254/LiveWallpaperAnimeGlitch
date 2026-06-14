import type { NowPlayingTextTreatment } from '@/types/wallpaper';

export type TextTreatmentStroke = {
	color: string;
	width: number;
};

/**
 * Configures the canvas fill / shadow for a text line according to the chosen
 * treatment and returns an optional stroke to apply per glyph. The caller must
 * have the line's font set and should wrap the draw in save()/restore().
 *
 * Only vertical gradients are used so treatments stay correct while a line
 * scrolls (marquee) horizontally.
 */
export function applyTextTreatment(
	ctx: CanvasRenderingContext2D,
	treatment: NowPlayingTextTreatment,
	opts: {
		top: number;
		height: number;
		baseColor: string;
		secondaryColor: string;
		userStrokeColor: string;
		userStrokeWidth: number;
	}
): TextTreatmentStroke | undefined {
	const { top, height, baseColor, secondaryColor } = opts;
	const userStroke =
		opts.userStrokeWidth > 0
			? { color: opts.userStrokeColor, width: opts.userStrokeWidth }
			: undefined;

	switch (treatment) {
		case 'gradient': {
			const g = ctx.createLinearGradient(0, top, 0, top + height);
			g.addColorStop(0, baseColor);
			g.addColorStop(1, secondaryColor);
			ctx.fillStyle = g;
			return userStroke;
		}
		case 'metallic': {
			// Fixed chrome ramp; reads as brushed metal regardless of base.
			const g = ctx.createLinearGradient(0, top, 0, top + height);
			g.addColorStop(0, '#fdfdff');
			g.addColorStop(0.45, '#9aa3ad');
			g.addColorStop(0.5, '#6c757e');
			g.addColorStop(0.55, '#aeb7c0');
			g.addColorStop(1, '#eef2f6');
			ctx.fillStyle = g;
			return (
				userStroke ?? {
					color: 'rgba(20,24,30,0.55)',
					width: Math.max(1, height * 0.03)
				}
			);
		}
		case 'neon': {
			ctx.fillStyle = '#ffffff';
			ctx.shadowColor = baseColor;
			ctx.shadowBlur = Math.max(ctx.shadowBlur, height * 0.6);
			return { color: baseColor, width: Math.max(1.5, height * 0.06) };
		}
		case 'glass': {
			const g = ctx.createLinearGradient(0, top, 0, top + height);
			g.addColorStop(0, 'rgba(255,255,255,0.92)');
			g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
			g.addColorStop(1, 'rgba(255,255,255,0.18)');
			ctx.fillStyle = g;
			return (
				userStroke ?? {
					color: baseColor,
					width: Math.max(1, height * 0.025)
				}
			);
		}
		case 'shadow': {
			ctx.fillStyle = baseColor;
			ctx.shadowColor = 'rgba(0,0,0,0.55)';
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = height * 0.06;
			ctx.shadowOffsetY = height * 0.06;
			return userStroke;
		}
		case 'solid':
		default:
			ctx.fillStyle = baseColor;
			return userStroke;
	}
}
