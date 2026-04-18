import { clamp, lerp } from '@/lib/math';
import { drawRgbShift, seededRandom } from './imageCanvasEffects';
import type { BackgroundImageSnapshot } from './imageCanvasShared';
import { getBackgroundRectFromSnapshot } from './imageCanvasShared';
import type { BgDrawContext, BgTransitionCtx } from './imageCanvasBackgroundRenderTypes';

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

export function runBackgroundTransitionPass({
	dc,
	tc,
	type,
	easedProgress,
	activeImage,
	activeSnapshot,
	previousBackgroundImage,
	previousBackgroundParams,
	colorFilter
}: {
	dc: BgDrawContext;
	tc: BgTransitionCtx;
	type: string;
	easedProgress: number;
	activeImage: HTMLImageElement | null;
	activeSnapshot: BackgroundImageSnapshot;
	previousBackgroundImage: HTMLImageElement;
	previousBackgroundParams: BackgroundImageSnapshot;
	colorFilter: string;
}) {
	const slideDistance = dc.canvasWidth;

	if (type === 'slide-left') {
		drawBgImage(
			dc,
			previousBackgroundImage,
			previousBackgroundParams,
			1,
			-easedProgress * slideDistance * lerp(0.92, 1.18, tc.transitionForceNorm)
		);
		if (activeImage) {
			drawBgImage(
				dc,
				activeImage,
				activeSnapshot,
				1,
				(1 - easedProgress) * slideDistance * lerp(0.92, 1.18, tc.transitionForceNorm)
			);
		}
		return;
	}

	if (type === 'slide-right') {
		drawBgImage(
			dc,
			previousBackgroundImage,
			previousBackgroundParams,
			1,
			easedProgress * slideDistance * lerp(0.92, 1.18, tc.transitionForceNorm)
		);
		if (activeImage) {
			drawBgImage(
				dc,
				activeImage,
				activeSnapshot,
				1,
				-(1 - easedProgress) * slideDistance * lerp(0.92, 1.18, tc.transitionForceNorm)
			);
		}
		return;
	}

	if (type === 'zoom-in') {
		drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress);
		if (activeImage) {
			drawBgImage(
				dc,
				activeImage,
				activeSnapshot,
				easedProgress,
				0,
				0,
				lerp(Math.max(0.2, 0.6 - tc.transitionForce * 0.14), 1, easedProgress)
			);
		}
		return;
	}

	if (type === 'blur-dissolve') {
		drawBgImage(
			dc,
			previousBackgroundImage,
			previousBackgroundParams,
			1,
			0,
			0,
			1,
			easedProgress * (4 + tc.transitionForce * 1.8)
		);
		if (activeImage) {
			drawDissolveTransition(tc, activeImage, activeSnapshot, easedProgress);
		}
		return;
	}

	if (type === 'bars-horizontal') {
		drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress * 0.45);
		if (activeImage) {
			drawBarsTransition(tc, 'horizontal', activeImage, activeSnapshot, easedProgress);
		}
		return;
	}

	if (type === 'bars-vertical') {
		drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress * 0.45);
		if (activeImage) {
			drawBarsTransition(tc, 'vertical', activeImage, activeSnapshot, easedProgress);
		}
		return;
	}

	if (type === 'rgb-shift') {
		drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress);
		if (activeImage) {
			const jitter =
				Math.sin(tc.time * 0.015) *
				dc.canvasWidth *
				0.035 *
				tc.transitionForce *
				(1 - easedProgress);
			drawBgImage(dc, activeImage, activeSnapshot, easedProgress, jitter);
			dc.ctx.save();
			const rgbBoost = Math.max(
				8,
				dc.canvasWidth * 0.02 * tc.transitionForce * (1 - easedProgress)
			);
			const rectForRgb = getBackgroundRectFromSnapshot(
				dc.canvasWidth,
				dc.canvasHeight,
				activeImage,
				activeSnapshot,
				dc.bassBoost,
				dc.parallaxX + jitter,
				-dc.parallaxY,
				{
					layoutResponsiveEnabled: dc.layoutResponsiveEnabled,
					layoutBackgroundReframeEnabled: dc.layoutBackgroundReframeEnabled,
					layoutReferenceWidth: dc.layoutReferenceWidth,
					layoutReferenceHeight: dc.layoutReferenceHeight
				}
			);
			dc.ctx.translate(rectForRgb.cx, rectForRgb.cy);
			drawRgbShift(
				dc.ctx,
				activeImage,
				rectForRgb.width,
				rectForRgb.height,
				rgbBoost,
				colorFilter,
				tc.time,
				easedProgress,
				activeSnapshot.mirror
			);
			dc.ctx.restore();
		}
		return;
	}

	if (type === 'distortion') {
		drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress * 0.6);
		if (activeImage) {
			const segments = Math.max(10, Math.floor(14 + tc.transitionForce * 5));
			const sliceHeight = dc.canvasHeight / segments;
			for (let index = 0; index < segments; index++) {
				const wave =
					Math.sin(tc.time * 0.01 + index * 0.85) *
					dc.canvasWidth *
					0.05 *
					tc.transitionForce *
					(1 - easedProgress);
				drawClippedBgImage(
					dc,
					activeImage,
					activeSnapshot,
					0,
					index * sliceHeight,
					dc.canvasWidth,
					Math.ceil(sliceHeight + 1),
					easedProgress,
					wave,
					0
				);
			}
		}
		return;
	}

	drawBgImage(dc, previousBackgroundImage, previousBackgroundParams, 1 - easedProgress);
	if (activeImage) {
		drawBgImage(dc, activeImage, activeSnapshot, easedProgress);
	}
}

export function drawBackgroundImageDirect(
	dc: BgDrawContext,
	image: HTMLImageElement,
	snapshot: BackgroundImageSnapshot,
	alpha: number
) {
	drawBgImage(dc, image, snapshot, alpha);
}

