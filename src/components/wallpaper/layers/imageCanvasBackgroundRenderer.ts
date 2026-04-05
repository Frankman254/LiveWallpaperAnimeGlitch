import type { MutableRefObject } from 'react';
import { clamp, lerp } from '@/lib/math';
import type { ScanlineMode } from '@/types/wallpaper';
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

	const drawBackgroundImage = (
		sourceImage: HTMLImageElement,
		snapshot: BackgroundImageSnapshot,
		alpha: number,
		transitionOffsetX = 0,
		transitionOffsetY = 0,
		scaleMultiplier = 1,
		blurBoost = 0
	) => {
		const rect = getBackgroundRectFromSnapshot(
			canvasWidth,
			canvasHeight,
			sourceImage,
			{
				...snapshot,
				scale: snapshot.scale * scaleMultiplier
			},
			bassBoost,
			parallaxX + transitionOffsetX,
			-parallaxY + transitionOffsetY
		);

		ctx.save();
		ctx.globalAlpha = clamp(alpha * layerOpacity, 0, 1);
		ctx.filter =
			blurBoost > 0
				? `${baseFilter} blur(${blur + blurBoost}px)`
				: baseFilter;
		ctx.translate(rect.cx, rect.cy);
		if (snapshot.mirror) ctx.scale(-1, 1);
		ctx.drawImage(
			sourceImage,
			-rect.width / 2,
			-rect.height / 2,
			rect.width,
			rect.height
		);
		ctx.restore();
	};

	const drawClippedBackgroundImage = (
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
	) => {
		if (clipWidth <= 0 || clipHeight <= 0) return;
		ctx.save();
		ctx.beginPath();
		ctx.rect(clipX, clipY, clipWidth, clipHeight);
		ctx.clip();
		drawBackgroundImage(
			sourceImage,
			snapshot,
			alpha,
			transitionOffsetX,
			transitionOffsetY,
			scaleMultiplier,
			blurBoost
		);
		ctx.restore();
	};

	const drawBarRevealTransition = (
		axis: 'horizontal' | 'vertical',
		sourceImage: HTMLImageElement,
		sourceSnapshot: BackgroundImageSnapshot,
		revealProgress: number
	) => {
		const segments = Math.max(
			8,
			Math.floor(
				axis === 'horizontal'
					? 10 + transitionForceNorm * 5
					: 12 + transitionForceNorm * 6
			)
		);
		const bandLength =
			axis === 'horizontal'
				? canvasHeight / segments
				: canvasWidth / segments;

		for (let index = 0; index < segments; index++) {
			const delay = seededRandom(index * 17.3 + 9.1) * 0.48;
			const local = clamp(
				(revealProgress - delay) / Math.max(0.18, 1 - delay),
				0,
				1
			);
			if (local <= 0.001) continue;

			const offsetSeed =
				seededRandom(Math.floor(time * 0.03) * 23.1 + index * 7.7) -
				0.5;
			const jitter =
				offsetSeed *
				(axis === 'horizontal' ? canvasWidth : canvasHeight) *
				0.09 *
				transitionForce *
				(1 - local);

			if (axis === 'horizontal') {
				drawClippedBackgroundImage(
					sourceImage,
					sourceSnapshot,
					0,
					index * bandLength,
					canvasWidth,
					Math.ceil(bandLength + 1),
					local,
					jitter,
					0
				);
			} else {
				drawClippedBackgroundImage(
					sourceImage,
					sourceSnapshot,
					index * bandLength,
					0,
					Math.ceil(bandLength + 1),
					canvasHeight,
					local,
					0,
					jitter
				);
			}
		}
	};

	const drawDissolveTransition = (
		sourceImage: HTMLImageElement,
		sourceSnapshot: BackgroundImageSnapshot,
		revealProgress: number
	) => {
		const cols = Math.max(10, Math.floor(12 + transitionForceNorm * 5));
		const rows = Math.max(6, Math.floor(7 + transitionForceNorm * 4));
		const tileWidth = canvasWidth / cols;
		const tileHeight = canvasHeight / rows;

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
					(seededRandom(
						x * 3.7 + y * 11.3 + Math.floor(time * 0.01)
					) -
						0.5) *
					tileWidth *
					0.75 *
					transitionForce *
					(1 - local);
				const warpY =
					(seededRandom(
						x * 7.9 + y * 5.1 + Math.floor(time * 0.012)
					) -
						0.5) *
					tileHeight *
					0.5 *
					transitionForce *
					(1 - local);

				drawClippedBackgroundImage(
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
					(1 - local) * (4 + transitionForce * 2)
				);
			}
		}
	};

	if (!activeImage && previousBackgroundImageRef.current) {
		drawBackgroundImage(
			previousBackgroundImageRef.current,
			previousBackgroundParamsRef.current,
			1
		);
		return;
	}

	if (previousBackgroundImageRef.current && progress < 1) {
		const slideDistance = canvasWidth;
		const type = transitionSettings.transitionType;

		if (type === 'slide-left') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				-easedProgress *
					slideDistance *
					lerp(0.92, 1.18, transitionForceNorm)
			);
			if (activeImage) {
				drawBackgroundImage(
					activeImage,
					activeSnapshot,
					1,
					(1 - easedProgress) *
						slideDistance *
						lerp(0.92, 1.18, transitionForceNorm)
				);
			}
		} else if (type === 'slide-right') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				easedProgress *
					slideDistance *
					lerp(0.92, 1.18, transitionForceNorm)
			);
			if (activeImage) {
				drawBackgroundImage(
					activeImage,
					activeSnapshot,
					1,
					-(1 - easedProgress) *
						slideDistance *
						lerp(0.92, 1.18, transitionForceNorm)
				);
			}
		} else if (type === 'zoom-in') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress
			);
			if (activeImage) {
				drawBackgroundImage(
					activeImage,
					activeSnapshot,
					easedProgress,
					0,
					0,
					lerp(
						Math.max(0.2, 0.6 - transitionForce * 0.14),
						1,
						easedProgress
					)
				);
			}
		} else if (type === 'blur-dissolve') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1,
				0,
				0,
				1,
				easedProgress * (4 + transitionForce * 1.8)
			);
			if (activeImage) {
				drawDissolveTransition(
					activeImage,
					activeSnapshot,
					easedProgress
				);
			}
		} else if (type === 'bars-horizontal') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress * 0.45
			);
			if (activeImage) {
				drawBarRevealTransition(
					'horizontal',
					activeImage,
					activeSnapshot,
					easedProgress
				);
			}
		} else if (type === 'bars-vertical') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress * 0.45
			);
			if (activeImage) {
				drawBarRevealTransition(
					'vertical',
					activeImage,
					activeSnapshot,
					easedProgress
				);
			}
		} else if (type === 'rgb-shift') {
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress
			);
			if (activeImage) {
				const jitter =
					Math.sin(time * 0.015) *
					canvasWidth *
					0.035 *
					transitionForce *
					(1 - easedProgress);
				drawBackgroundImage(
					activeImage,
					activeSnapshot,
					easedProgress,
					jitter
				);
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
					-parallaxY
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
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress * 0.6
			);
			if (activeImage) {
				const segments = Math.max(
					10,
					Math.floor(14 + transitionForce * 5)
				);
				const sliceHeight = canvasHeight / segments;
				for (let index = 0; index < segments; index++) {
					const wave =
						Math.sin(time * 0.01 + index * 0.85) *
						canvasWidth *
						0.05 *
						transitionForce *
						(1 - easedProgress);
					drawClippedBackgroundImage(
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
			drawBackgroundImage(
				previousBackgroundImageRef.current,
				previousBackgroundParamsRef.current,
				1 - easedProgress
			);
			if (activeImage) {
				drawBackgroundImage(activeImage, activeSnapshot, easedProgress);
			}
		}

		if (progress >= 1 && activeImage) {
			previousBackgroundImageRef.current = null;
			transitionStartRef.current = null;
		}
	} else if (activeImage) {
		drawBackgroundImage(activeImage, activeSnapshot, 1);
	} else if (previousBackgroundImageRef.current) {
		drawBackgroundImage(
			previousBackgroundImageRef.current,
			previousBackgroundParamsRef.current,
			1
		);
	}

	const effectRect = activeImage
		? getBackgroundRectFromSnapshot(
				canvasWidth,
				canvasHeight,
				activeImage,
				activeSnapshot,
				bassBoost,
				parallaxX,
				-parallaxY
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
			mirror: activeSnapshot.mirror
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
			scanlineThickness
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
