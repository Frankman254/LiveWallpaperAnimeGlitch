import type { MutableRefObject } from 'react';
import { clamp, lerp } from '@/lib/math';
import type { ScanlineMode } from '@/types/wallpaper';
import type { VisualQualityTier } from '@/lib/visual/performanceQuality';
import {
	applyImagePostProcessPasses,
	drawRgbShift,
	getScanlineAmount,
	seededRandom
} from './imageCanvasEffects';
import type { BackgroundImageLayer } from '@/types/layers';
import type {
	BackgroundImageSnapshot,
	BackgroundTransitionSnapshot
} from './imageCanvasShared';
import { getBackgroundRectFromSnapshot } from './imageCanvasShared';

// ─── shared draw-context types ────────────────────────────────────────────────

type BgDrawContext = {
	ctx: CanvasRenderingContext2D;
	canvasWidth: number;
	canvasHeight: number;
	layerOpacity: number;
	baseFilter: string;
	blur: number;
	parallaxX: number;
	parallaxY: number;
	bassBoost: number;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
};

type BgTransitionCtx = BgDrawContext & {
	transitionForce: number;
	transitionForceNorm: number;
	time: number;
};

// ─── extracted draw helpers ───────────────────────────────────────────────────

function drawBgImage(
	dc: BgDrawContext,
	sourceImage: HTMLImageElement,
	snapshot: BackgroundImageSnapshot,
	alpha: number,
	transitionOffsetX = 0,
	transitionOffsetY = 0,
	scaleMultiplier = 1,
	blurBoost = 0
): void {
	const rect = getBackgroundRectFromSnapshot(
		dc.canvasWidth,
		dc.canvasHeight,
		sourceImage,
		{ ...snapshot, scale: snapshot.scale * scaleMultiplier },
		dc.bassBoost,
		dc.parallaxX + transitionOffsetX,
		-dc.parallaxY + transitionOffsetY,
		{
			layoutResponsiveEnabled: dc.layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled: dc.layoutBackgroundReframeEnabled,
			layoutReferenceWidth: dc.layoutReferenceWidth,
			layoutReferenceHeight: dc.layoutReferenceHeight
		}
	);

	dc.ctx.save();
	dc.ctx.globalAlpha = clamp(alpha * dc.layerOpacity, 0, 1);
	dc.ctx.filter =
		blurBoost > 0
			? `${dc.baseFilter} blur(${dc.blur + blurBoost}px)`
			: dc.baseFilter;
	dc.ctx.translate(rect.cx, rect.cy);
	if (snapshot.mirror) dc.ctx.scale(-1, 1);
	dc.ctx.drawImage(
		sourceImage,
		-rect.width / 2,
		-rect.height / 2,
		rect.width,
		rect.height
	);
	dc.ctx.restore();
}

function drawClippedBgImage(
	dc: BgDrawContext,
	sourceImage: HTMLImageElement,
	snapshot: BackgroundImageSnapshot,
	clipX: number,
	clipY: number,
	clipWidth: number,
	clipHeight: number,
	alpha: number,
	transitionOffsetX = 0,
	transitionOffsetY = 0,
	scaleMultiplier = 1,
	blurBoost = 0
): void {
	if (clipWidth <= 0 || clipHeight <= 0) return;
	dc.ctx.save();
	dc.ctx.beginPath();
	dc.ctx.rect(clipX, clipY, clipWidth, clipHeight);
	dc.ctx.clip();
	drawBgImage(
		dc,
		sourceImage,
		snapshot,
		alpha,
		transitionOffsetX,
		transitionOffsetY,
		scaleMultiplier,
		blurBoost
	);
	dc.ctx.restore();
}

function drawBarsTransition(
	tc: BgTransitionCtx,
	axis: 'horizontal' | 'vertical',
	sourceImage: HTMLImageElement,
	sourceSnapshot: BackgroundImageSnapshot,
	revealProgress: number
): void {
	const segments = Math.max(
		8,
		Math.floor(
			axis === 'horizontal'
				? 10 + tc.transitionForceNorm * 5
				: 12 + tc.transitionForceNorm * 6
		)
	);
	const bandLength =
		axis === 'horizontal'
			? tc.canvasHeight / segments
			: tc.canvasWidth / segments;

	for (let index = 0; index < segments; index++) {
		const delay = seededRandom(index * 17.3 + 9.1) * 0.48;
		const local = clamp(
			(revealProgress - delay) / Math.max(0.18, 1 - delay),
			0,
			1
		);
		if (local <= 0.001) continue;

		const offsetSeed =
			seededRandom(Math.floor(tc.time * 0.03) * 23.1 + index * 7.7) - 0.5;
		const jitter =
			offsetSeed *
			(axis === 'horizontal' ? tc.canvasWidth : tc.canvasHeight) *
			0.09 *
			tc.transitionForce *
			(1 - local);

		if (axis === 'horizontal') {
			drawClippedBgImage(
				tc,
				sourceImage,
				sourceSnapshot,
				0,
				index * bandLength,
				tc.canvasWidth,
				Math.ceil(bandLength + 1),
				local,
				jitter,
				0
			);
		} else {
			drawClippedBgImage(
				tc,
				sourceImage,
				sourceSnapshot,
				index * bandLength,
				0,
				Math.ceil(bandLength + 1),
				tc.canvasHeight,
				local,
				0,
				jitter
			);
		}
	}
}

function drawDissolveTransition(
	tc: BgTransitionCtx,
	sourceImage: HTMLImageElement,
	sourceSnapshot: BackgroundImageSnapshot,
	revealProgress: number
): void {
	const cols = Math.max(10, Math.floor(12 + tc.transitionForceNorm * 5));
	const rows = Math.max(6, Math.floor(7 + tc.transitionForceNorm * 4));
	const tileWidth = tc.canvasWidth / cols;
	const tileHeight = tc.canvasHeight / rows;

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const delay = seededRandom(x * 13.1 + y * 17.7 + 4.3) * 0.52;
			const local = clamp(
				(revealProgress - delay) / Math.max(0.18, 1 - delay),
				0,
				1
			);
			if (local <= 0.001) continue;

			const warpX =
				(seededRandom(x * 3.7 + y * 11.3 + Math.floor(tc.time * 0.01)) -
					0.5) *
				tileWidth *
				0.75 *
				tc.transitionForce *
				(1 - local);
			const warpY =
				(seededRandom(x * 7.9 + y * 5.1 + Math.floor(tc.time * 0.012)) -
					0.5) *
				tileHeight *
				0.5 *
				tc.transitionForce *
				(1 - local);

			drawClippedBgImage(
				tc,
				sourceImage,
				sourceSnapshot,
				x * tileWidth,
				y * tileHeight,
				Math.ceil(tileWidth + 1),
				Math.ceil(tileHeight + 1),
				local,
				warpX,
				warpY,
				1,
				(1 - local) * (4 + tc.transitionForce * 2)
			);
		}
	}
}

type RenderBackgroundFrameParams = {
	ctx: CanvasRenderingContext2D;
	layer: BackgroundImageLayer;
	canvasWidth: number;
	canvasHeight: number;
	loadedImage: HTMLImageElement | null;
	time: number;
	transitionLevel: number;
	bassBoost: number;
	amplitude: number;
	parallaxX: number;
	parallaxY: number;
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	hue: number;
	colorFilter: string;
	filterActive: boolean;
	layerOpacity: number;
	rgbShiftPixels: number;
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
	/** Tier for scaling image postprocess cost (RGB split, noise, bloom, etc.). */
	imagePostQuality: VisualQualityTier;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	previousBackgroundImageRef: MutableRefObject<HTMLImageElement | null>;
	previousBackgroundParamsRef: MutableRefObject<BackgroundImageSnapshot>;
	previousBackgroundTransitionRef: MutableRefObject<BackgroundTransitionSnapshot>;
	renderedBackgroundParamsRef: MutableRefObject<BackgroundImageSnapshot>;
	renderedBackgroundTransitionRef: MutableRefObject<BackgroundTransitionSnapshot>;
	transitionStartRef: MutableRefObject<number | null>;
};

export function renderBackgroundFrame({
	ctx,
	layer,
	canvasWidth,
	canvasHeight,
	loadedImage,
	time,
	transitionLevel,
	bassBoost,
	amplitude,
	parallaxX,
	parallaxY,
	brightness,
	contrast,
	saturation,
	blur,
	hue,
	colorFilter,
	filterActive,
	layerOpacity,
	rgbShiftPixels,
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
	imagePostQuality,
	layoutResponsiveEnabled,
	layoutBackgroundReframeEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	previousBackgroundImageRef,
	previousBackgroundParamsRef,
	previousBackgroundTransitionRef,
	renderedBackgroundParamsRef,
	renderedBackgroundTransitionRef,
	transitionStartRef
}: RenderBackgroundFrameParams): void {
	const activeImage = loadedImage ? loadedImage : null;
	const transitionSettings = previousBackgroundTransitionRef.current;
	const transitionDurationMs = Math.max(
		100,
		transitionSettings.transitionDuration * 1000
	);
	const progress =
		activeImage &&
		previousBackgroundImageRef.current &&
		transitionStartRef.current !== null
			? clamp(
					(time - transitionStartRef.current) / transitionDurationMs,
					0,
					1
				)
			: 1;
	const easedProgress = progress * progress * (3 - 2 * progress);
	const transitionForce = clamp(
		transitionSettings.transitionIntensity +
			transitionLevel * transitionSettings.transitionAudioDrive,
		0.2,
		3.5
	);
	const transitionForceNorm = Math.min(1, transitionForce / 2.5);
	const baseFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px) hue-rotate(${hue}deg)`;
	const activeSnapshot: BackgroundImageSnapshot = {
		scale: layer.scale,
		positionX: layer.positionX,
		positionY: layer.positionY,
		fitMode: layer.fitMode,
		mirror: layer.mirror
	};

	// Build the shared draw contexts once per frame call.
	const dc: BgDrawContext = {
		ctx,
		canvasWidth,
		canvasHeight,
		layerOpacity,
		baseFilter,
		blur,
		parallaxX,
		parallaxY,
		bassBoost,
		layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled,
		layoutReferenceWidth,
		layoutReferenceHeight
	};
	const tc: BgTransitionCtx = { ...dc, transitionForce, transitionForceNorm, time };

	if (!activeImage && previousBackgroundImageRef.current) {
		drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1);
		return;
	}

	if (previousBackgroundImageRef.current && progress < 1) {
		const slideDistance = canvasWidth;
		const type = transitionSettings.transitionType;

		if (type === 'slide-left') {
			drawBgImage(
				dc,
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				-easedProgress * slideDistance * lerp(0.92, 1.18, transitionForceNorm)
			);
			if (activeImage) {
				drawBgImage(
					dc,
					activeImage,
					activeSnapshot,
					1,
					(1 - easedProgress) * slideDistance * lerp(0.92, 1.18, transitionForceNorm)
				);
			}
		} else if (type === 'slide-right') {
			drawBgImage(
				dc,
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				easedProgress * slideDistance * lerp(0.92, 1.18, transitionForceNorm)
			);
			if (activeImage) {
				drawBgImage(
					dc,
					activeImage,
					activeSnapshot,
					1,
					-(1 - easedProgress) * slideDistance * lerp(0.92, 1.18, transitionForceNorm)
				);
			}
		} else if (type === 'zoom-in') {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress);
			if (activeImage) {
				drawBgImage(
					dc,
					activeImage,
					activeSnapshot,
					easedProgress,
					0,
					0,
					lerp(Math.max(0.2, 0.6 - transitionForce * 0.14), 1, easedProgress)
				);
			}
		} else if (type === 'blur-dissolve') {
			drawBgImage(
				dc,
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				0,
				0,
				1,
				easedProgress * (4 + transitionForce * 1.8)
			);
			if (activeImage) {
				drawDissolveTransition(tc, activeImage, activeSnapshot, easedProgress);
			}
		} else if (type === 'bars-horizontal') {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.45);
			if (activeImage) {
				drawBarsTransition(tc, 'horizontal', activeImage, activeSnapshot, easedProgress);
			}
		} else if (type === 'bars-vertical') {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.45);
			if (activeImage) {
				drawBarsTransition(tc, 'vertical', activeImage, activeSnapshot, easedProgress);
			}
		} else if (type === 'rgb-shift') {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress);
			if (activeImage) {
				const jitter =
					Math.sin(time * 0.015) *
					canvasWidth *
					0.035 *
					transitionForce *
					(1 - easedProgress);
				drawBgImage(dc, activeImage, activeSnapshot, easedProgress, jitter);
				ctx.save();
				const rgbBoost = Math.max(
					8,
					canvasWidth * 0.02 * transitionForce * (1 - easedProgress)
				);
				const rectForRgb = getBackgroundRectFromSnapshot(
					canvasWidth,
					canvasHeight,
					activeImage,
					activeSnapshot,
					bassBoost,
					parallaxX + jitter,
					-parallaxY,
					{
						layoutResponsiveEnabled,
						layoutBackgroundReframeEnabled,
						layoutReferenceWidth,
						layoutReferenceHeight
					}
				);
				ctx.translate(rectForRgb.cx, rectForRgb.cy);
				drawRgbShift(
					ctx,
					activeImage,
					rectForRgb.width,
					rectForRgb.height,
					rgbBoost,
					colorFilter,
					time,
					easedProgress,
					activeSnapshot.mirror
				);
				ctx.restore();
			}
		} else if (type === 'distortion') {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.6);
			if (activeImage) {
				const segments = Math.max(10, Math.floor(14 + transitionForce * 5));
				const sliceHeight = canvasHeight / segments;
				for (let index = 0; index < segments; index++) {
					const wave =
						Math.sin(time * 0.01 + index * 0.85) *
						canvasWidth *
						0.05 *
						transitionForce *
						(1 - easedProgress);
					drawClippedBgImage(
						dc,
						activeImage,
						activeSnapshot,
						0,
						index * sliceHeight,
						canvasWidth,
						Math.ceil(sliceHeight + 1),
						easedProgress,
						wave,
						0
					);
				}
			}
		} else {
			drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress);
			if (activeImage) {
				drawBgImage(dc, activeImage, activeSnapshot, easedProgress);
			}
		}

		if (progress >= 1 && activeImage) {
			previousBackgroundImageRef.current = null;
			transitionStartRef.current = null;
		}
	} else if (activeImage) {
		drawBgImage(dc, activeImage, activeSnapshot, 1);
	} else if (previousBackgroundImageRef.current) {
		drawBgImage(dc, previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1);
	}

	const effectRect = activeImage
		? getBackgroundRectFromSnapshot(
				canvasWidth,
				canvasHeight,
				activeImage,
				activeSnapshot,
				bassBoost,
				parallaxX,
				-parallaxY,
				{
					layoutResponsiveEnabled,
					layoutBackgroundReframeEnabled,
					layoutReferenceWidth,
					layoutReferenceHeight
				}
			)
		: null;

	if (effectRect && activeImage && rgbShiftPixels > 0.25 && filterActive) {
		ctx.save();
		ctx.globalAlpha = clamp(layerOpacity, 0, 1);
		ctx.translate(effectRect.cx, effectRect.cy);
		applyImagePostProcessPasses({
			ctx,
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
		ctx.restore();
	}

	if (
		filmNoiseAmount > 0.001 ||
		(filterActive && scanlineIntensity > 0.001)
	) {
		ctx.save();
		ctx.globalAlpha = clamp(layerOpacity, 0, 1);
		ctx.translate(canvasWidth / 2, canvasHeight / 2);
		applyImagePostProcessPasses({
			ctx,
			source: activeImage ?? previousBackgroundImageRef.current ?? ctx.canvas,
			width: canvasWidth,
			height: canvasHeight,
			time,
			opacity: 1,
			colorFilter: 'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
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
		ctx.restore();
	}

	renderedBackgroundParamsRef.current = {
		scale: layer.scale,
		positionX: layer.positionX,
		positionY: layer.positionY,
		fitMode: layer.fitMode,
		mirror: layer.mirror
	};
	renderedBackgroundTransitionRef.current = {
		transitionType: layer.transitionType,
		transitionDuration: layer.transitionDuration,
		transitionIntensity: layer.transitionIntensity,
		transitionAudioDrive: layer.transitionAudioDrive
	};
}
