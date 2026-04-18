import { clamp } from '@/lib/math';
import { applyImagePostProcessPasses, getScanlineAmount } from './imageCanvasEffects';
import { getBackgroundRectFromSnapshot } from './imageCanvasShared';
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
	const effectRect = activeImage
		? getBackgroundRectFromSnapshot(
				dc.canvasWidth,
				dc.canvasHeight,
				activeImage,
				activeSnapshot,
				dc.bassBoost,
				dc.parallaxX,
				-dc.parallaxY,
				{
					layoutResponsiveEnabled: dc.layoutResponsiveEnabled,
					layoutBackgroundReframeEnabled: dc.layoutBackgroundReframeEnabled,
					layoutReferenceWidth: dc.layoutReferenceWidth,
					layoutReferenceHeight: dc.layoutReferenceHeight
				}
			)
		: null;

	if (effectRect && activeImage && rgbShiftPixels > 0.25 && filterActive) {
		dc.ctx.save();
		dc.ctx.globalAlpha = clamp(dc.layerOpacity, 0, 1);
		dc.ctx.translate(effectRect.cx, effectRect.cy);
		applyImagePostProcessPasses({
			ctx: dc.ctx,
			source: activeImage,
			width: effectRect.width,
			height: effectRect.height,
			time,
			opacity: 1,
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
			mirror: activeSnapshot.mirror,
			postQualityTier: imagePostQuality
		});
		dc.ctx.restore();
	}

	if (filmNoiseAmount > 0.001 || (filterActive && scanlineIntensity > 0.001)) {
		dc.ctx.save();
		dc.ctx.globalAlpha = clamp(dc.layerOpacity, 0, 1);
		dc.ctx.translate(dc.canvasWidth / 2, dc.canvasHeight / 2);
		applyImagePostProcessPasses({
			ctx: dc.ctx,
			source: activeImage ?? previousBackgroundImage ?? dc.ctx.canvas,
			width: dc.canvasWidth,
			height: dc.canvasHeight,
			time,
			opacity: 1,
			colorFilter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
			rgbShiftPixels: 0,
			filmNoiseAmount,
			scanlineAmount: filterActive
				? getScanlineAmount(scanlineMode, scanlineIntensity, time, amplitude)
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

