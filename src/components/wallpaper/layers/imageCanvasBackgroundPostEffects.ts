import { clamp } from '@/lib/math';
import {
	applyImagePostProcessPasses,
	getScanlineAmount
} from './imageCanvasEffects';
import { getBackgroundDrawRectsFromSnapshot } from './imageCanvasShared';
import type { BgDrawContext } from './imageCanvasBackgroundRenderTypes';
import type { BackgroundImageSnapshot } from './imageCanvasShared';
import type { ScanlineMode } from '@/types/wallpaper';
import type { VisualQualityTier } from '@/lib/visual/performanceQuality';

export function runBackgroundPostEffectsPass({
	dc,
	activeImage,
	previousBackgroundImage,
	activeSnapshot,
	rgbShiftPixels,
	filterActive,
	scanlineMode,
	scanlineIntensity,
	scanlineSpacing,
	scanlineThickness,
	filmNoiseAmount,
	vignetteAmount,
	bloomAmount,
	lumaThreshold,
	lensWarpAmount,
	heatDistortionAmount,
	colorFilter,
	time,
	amplitude,
	imagePostQuality
}: {
	dc: BgDrawContext;
	activeImage: HTMLImageElement | null;
	previousBackgroundImage: HTMLImageElement | null;
	activeSnapshot: BackgroundImageSnapshot;
	rgbShiftPixels: number;
	filterActive: boolean;
	scanlineMode: ScanlineMode;
	scanlineIntensity: number;
	scanlineSpacing: number;
	scanlineThickness: number;
	filmNoiseAmount: number;
	vignetteAmount: number;
	bloomAmount: number;
	lumaThreshold: number;
	lensWarpAmount: number;
	heatDistortionAmount: number;
	colorFilter: string;
	time: number;
	amplitude: number;
	imagePostQuality: VisualQualityTier;
}) {
	// Post passes must cover EVERY mirror-fill tile, not just the primary.
	// Drawing them on the primary alone made that tile visibly denser than its
	// clones once the Looks opacity slider went low.
	const effectRects = activeImage
		? getBackgroundDrawRectsFromSnapshot(
				dc.canvasWidth,
				dc.canvasHeight,
				activeImage,
				activeSnapshot,
				dc.bassBoost,
				dc.parallaxX,
				-dc.parallaxY,
				{
					layoutResponsiveEnabled: dc.layoutResponsiveEnabled,
					layoutBackgroundReframeEnabled:
						dc.layoutBackgroundReframeEnabled,
					layoutReferenceWidth: dc.layoutReferenceWidth,
					layoutReferenceHeight: dc.layoutReferenceHeight
				}
			)
		: [];
	// `drawRgbShift` & co. ASSIGN ctx.globalAlpha instead of multiplying it, so
	// the layer opacity has to travel through the `opacity` param (same
	// convention as the overlay renderer) or the pass renders at full strength
	// over a nearly transparent image.
	const passOpacity = clamp(dc.layerOpacity, 0, 1);

	if (activeImage && rgbShiftPixels > 0.25 && filterActive) {
		for (const rect of effectRects) {
			dc.ctx.save();
			dc.ctx.translate(rect.cx, rect.cy);
			if (rect.rotation) {
				dc.ctx.rotate((rect.rotation * Math.PI) / 180);
			}
			const scaleX = rect.mirror ? -1 : 1;
			const scaleY = rect.mirrorY ? -1 : 1;
			if (scaleX !== 1 || scaleY !== 1) dc.ctx.scale(scaleX, scaleY);
			applyImagePostProcessPasses({
				ctx: dc.ctx,
				source: activeImage,
				width: rect.width,
				height: rect.height,
				time,
				opacity: passOpacity,
				colorFilter,
				rgbShiftPixels,
				filmNoiseAmount: 0,
				scanlineAmount: 0,
				scanlineSpacing,
				scanlineThickness,
				vignetteAmount: 0,
				bloomAmount: 0,
				lumaThreshold,
				lensWarpAmount: 0,
				heatDistortionAmount: 0,
				mirror: false,
				postQualityTier: imagePostQuality
			});
			dc.ctx.restore();
		}
	}

	if (
		filmNoiseAmount > 0.001 ||
		(filterActive && scanlineIntensity > 0.001)
	) {
		dc.ctx.save();
		dc.ctx.translate(dc.canvasWidth / 2, dc.canvasHeight / 2);
		applyImagePostProcessPasses({
			ctx: dc.ctx,
			source: activeImage ?? previousBackgroundImage ?? dc.ctx.canvas,
			width: dc.canvasWidth,
			height: dc.canvasHeight,
			time,
			opacity: passOpacity,
			colorFilter:
				'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
			rgbShiftPixels: 0,
			filmNoiseAmount,
			scanlineAmount: filterActive
				? getScanlineAmount(
						scanlineMode,
						scanlineIntensity,
						time,
						amplitude
					)
				: 0,
			scanlineSpacing,
			scanlineThickness,
			vignetteAmount,
			bloomAmount,
			lumaThreshold,
			lensWarpAmount,
			heatDistortionAmount,
			postQualityTier: imagePostQuality
		});
		dc.ctx.restore();
	}
}
