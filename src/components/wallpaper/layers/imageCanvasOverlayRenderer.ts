import { clamp } from '@/lib/math';
import {
	applyOverlayShapeClip,
	applyImagePostProcessPasses,
	applySoftEdgeMask,
	drawOverlayGlow
} from './imageCanvasEffects';
import type { LayerRect } from './imageCanvasShared';
import type { OverlayImageLayer } from '@/types/layers';

type RenderOverlayImageLayerParams = {
	ctx: CanvasRenderingContext2D;
	layer: OverlayImageLayer;
	image: HTMLImageElement;
	rect: LayerRect;
	renderBaseImage: boolean;
	filterActive: boolean;
	filterOpacity: number;
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	hue: number;
	rgbShiftPixels: number;
	filmNoiseAmount: number;
	scanlineAmount: number;
	scanlineSpacing: number;
	scanlineThickness: number;
	time: number;
};

export function renderOverlayImageLayer({
	ctx,
	layer,
	image,
	rect,
	renderBaseImage,
	filterActive,
	filterOpacity,
	brightness,
	contrast,
	saturation,
	blur,
	hue,
	rgbShiftPixels,
	filmNoiseAmount,
	scanlineAmount,
	scanlineSpacing,
	scanlineThickness,
	time
}: RenderOverlayImageLayerParams) {
	const overlayBlur = layer.edgeBlur;
	const totalBlur = blur + overlayBlur;
	const baseFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${totalBlur}px) hue-rotate(${hue}deg)`;
	const colorFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`;

	ctx.save();
	ctx.translate(rect.cx, rect.cy);
	ctx.rotate((layer.rotation * Math.PI) / 180);
	ctx.globalAlpha = clamp(layer.opacity * filterOpacity, 0, 1);
	applyOverlayShapeClip(ctx, rect.width, rect.height, layer.cropShape);

	if (renderBaseImage) {
		drawOverlayGlow(
			ctx,
			image,
			rect.width,
			rect.height,
			layer.edgeGlow,
			ctx.globalAlpha
		);
		ctx.filter = baseFilter;
		ctx.drawImage(
			image,
			-rect.width / 2,
			-rect.height / 2,
			rect.width,
			rect.height
		);
		ctx.filter = 'none';
	}

	if (filterActive) {
		applyImagePostProcessPasses({
			ctx,
			source: image,
			width: rect.width,
			height: rect.height,
			time,
			opacity: ctx.globalAlpha,
			colorFilter: renderBaseImage
				? colorFilter
				: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
			rgbShiftPixels,
			filmNoiseAmount,
			scanlineAmount,
			scanlineSpacing,
			scanlineThickness
		});
	}

	applySoftEdgeMask(ctx, rect.width, rect.height, layer.edgeFade);
	ctx.restore();
}
