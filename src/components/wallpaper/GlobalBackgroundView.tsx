import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { setLruEntry, getLruEntry } from '@/lib/lruCache';
import { getBackgroundBaseSize } from '@/components/wallpaper/layers/imageCanvasShared';
import {
	getLayoutReferenceResolution,
	resolveResponsiveBackgroundTransform
} from '@/features/layout/responsiveLayout';
import {
	drawBloom,
	drawFilmNoise,
	drawRgbShift,
	drawScanlines,
	drawVignette,
	getScanlineAmount
} from '@/components/wallpaper/layers/imageCanvasEffects';

const GLOBAL_BACKGROUND_CACHE_LIMIT = 6;
const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(
	url: string,
	onReady: (image: HTMLImageElement) => void
): HTMLImageElement {
	const cached = getLruEntry(imageCache, url);
	if (cached) {
		if (cached.complete && cached.naturalWidth > 0) onReady(cached);
		else cached.onload = () => onReady(cached);
		return cached;
	}

	const image = new Image();
	image.decoding = 'async';
	image.onload = () => onReady(image);
	image.src = url;
	setLruEntry(imageCache, url, image, GLOBAL_BACKGROUND_CACHE_LIMIT);
	return image;
}

export default function GlobalBackgroundView() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const { getAudioSnapshot } = useAudioData();
	const store = useWallpaperStore(
		useShallow(state => ({
			globalBackgroundEnabled: state.globalBackgroundEnabled,
			globalBackgroundUrl: state.globalBackgroundUrl,
			globalBackgroundFitMode: state.globalBackgroundFitMode,
			globalBackgroundScale: state.globalBackgroundScale,
			globalBackgroundPositionX: state.globalBackgroundPositionX,
			globalBackgroundPositionY: state.globalBackgroundPositionY,
			globalBackgroundOpacity: state.globalBackgroundOpacity,
			globalBackgroundBrightness: state.globalBackgroundBrightness,
			globalBackgroundContrast: state.globalBackgroundContrast,
			globalBackgroundSaturation: state.globalBackgroundSaturation,
			globalBackgroundBlur: state.globalBackgroundBlur,
			globalBackgroundHueRotate: state.globalBackgroundHueRotate,
			layoutResponsiveEnabled: state.layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled:
				state.layoutBackgroundReframeEnabled,
			layoutReferenceWidth: state.layoutReferenceWidth,
			layoutReferenceHeight: state.layoutReferenceHeight,
			filterTargets: state.filterTargets,
			filterBrightness: state.filterBrightness,
			filterContrast: state.filterContrast,
			filterSaturation: state.filterSaturation,
			filterBlur: state.filterBlur,
			filterHueRotate: state.filterHueRotate,
			filterOpacity: state.filterOpacity,
			filterVignette: state.filterVignette,
			filterBloom: state.filterBloom,
			filterLumaThreshold: state.filterLumaThreshold,
			rgbShift: state.rgbShift,
			noiseIntensity: state.noiseIntensity,
			scanlineMode: state.scanlineMode,
			scanlineIntensity: state.scanlineIntensity,
			scanlineSpacing: state.scanlineSpacing,
			scanlineThickness: state.scanlineThickness,
			motionPaused: state.motionPaused,
			sleepModeActive: state.sleepModeActive
		}))
	);

	useEffect(() => {
		if (!store.globalBackgroundEnabled || !store.globalBackgroundUrl) {
			setImage(null);
			return;
		}

		const nextImage = getCachedImage(store.globalBackgroundUrl, setImage);
		if (nextImage.complete && nextImage.naturalWidth > 0) {
			setImage(nextImage);
		}
	}, [store.globalBackgroundEnabled, store.globalBackgroundUrl]);

	const filterActive = store.filterTargets.includes('global-background');
	const hasAnimatedFilter = useMemo(
		() =>
			filterActive &&
			(store.rgbShift > 0.0001 ||
				store.noiseIntensity > 0.001 ||
				store.scanlineIntensity > 0.001),
		[
			filterActive,
			store.noiseIntensity,
			store.rgbShift,
			store.scanlineIntensity
		]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (
			!canvas ||
			!image ||
			!store.globalBackgroundUrl ||
			!store.globalBackgroundEnabled
		) {
			return;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const draw = (time: number) => {
			if (!canvasRef.current) return;
			const currentCanvas = canvasRef.current;
			if (
				currentCanvas.width !== window.innerWidth ||
				currentCanvas.height !== window.innerHeight
			) {
				resize();
			}

			const brightness =
				store.globalBackgroundBrightness *
				(filterActive ? store.filterBrightness : 1);
			const contrast =
				store.globalBackgroundContrast *
				(filterActive ? store.filterContrast : 1);
			const saturation =
				store.globalBackgroundSaturation *
				(filterActive ? store.filterSaturation : 1);
			const blur =
				store.globalBackgroundBlur +
				(filterActive ? store.filterBlur : 0);
			const hue =
				store.globalBackgroundHueRotate +
				(filterActive ? store.filterHueRotate : 0);
			const opacity =
				store.globalBackgroundOpacity *
				(filterActive ? store.filterOpacity : 1);
			const rgbShiftPixels = filterActive
				? store.rgbShift *
					Math.min(currentCanvas.width, currentCanvas.height) *
					0.65
				: 0;
			const filmNoiseAmount = filterActive ? store.noiseIntensity : 0;
			const audio = hasAnimatedFilter ? getAudioSnapshot() : null;
			const scanlineAmount = filterActive
				? getScanlineAmount(
						store.scanlineMode,
						store.scanlineIntensity,
						time,
						audio?.amplitude ?? 0
					)
				: 0;

			const base = getBackgroundBaseSize(
				currentCanvas.width,
				currentCanvas.height,
				image.naturalWidth || currentCanvas.width,
				image.naturalHeight || currentCanvas.height,
				store.globalBackgroundFitMode
			);
			const authoredScale = Math.max(
				0.01,
				store.globalBackgroundScale
			);
			let effectiveScale = authoredScale;
			let effectivePositionX = store.globalBackgroundPositionX;
			let effectivePositionY = store.globalBackgroundPositionY;
			if (
				store.layoutResponsiveEnabled &&
				store.layoutBackgroundReframeEnabled
			) {
				const reference = getLayoutReferenceResolution(store);
				const referenceBase = getBackgroundBaseSize(
					reference.width,
					reference.height,
					image.naturalWidth || reference.width,
					image.naturalHeight || reference.height,
					store.globalBackgroundFitMode
				);
				const responsiveTransform = resolveResponsiveBackgroundTransform({
					...store,
					authoredScale,
					authoredPositionX: store.globalBackgroundPositionX,
					authoredPositionY: store.globalBackgroundPositionY,
					currentViewport: {
						width: currentCanvas.width,
						height: currentCanvas.height
					},
					currentBaseWidth: base.width,
					currentBaseHeight: base.height,
					referenceBaseWidth: referenceBase.width,
					referenceBaseHeight: referenceBase.height
				});
				effectiveScale = responsiveTransform.scale;
				effectivePositionX = responsiveTransform.positionX;
				effectivePositionY = responsiveTransform.positionY;
			}

			const width =
				base.width * effectiveScale;
			const height =
				base.height * effectiveScale;
			const cx =
				currentCanvas.width / 2 +
				effectivePositionX * currentCanvas.width * 0.5;
			const cy =
				currentCanvas.height / 2 -
				effectivePositionY * currentCanvas.height * 0.5;

			ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
			ctx.save();
			ctx.translate(cx, cy);
			ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
			ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px) hue-rotate(${hue}deg)`;
			ctx.drawImage(image, -width / 2, -height / 2, width, height);
			ctx.filter = 'none';
			if (filterActive) {
				drawRgbShift(
					ctx,
					image,
					width,
					height,
					rgbShiftPixels,
					'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
					time,
					ctx.globalAlpha
				);
				drawFilmNoise(
					ctx,
					width,
					height,
					filmNoiseAmount,
					time,
					ctx.globalAlpha
				);
				drawScanlines(
					ctx,
					width,
					height,
					scanlineAmount,
					store.scanlineSpacing,
					store.scanlineThickness,
					ctx.globalAlpha
				);
				drawBloom(
					ctx,
					image,
					width,
					height,
					store.filterBloom,
					store.filterLumaThreshold,
					ctx.globalAlpha
				);
				drawVignette(
					ctx,
					width,
					height,
					store.filterVignette,
					ctx.globalAlpha
				);
			}
			ctx.restore();
		};

		const shouldAnimate =
			!store.motionPaused &&
			!store.sleepModeActive &&
			hasAnimatedFilter;

		function frame(time: number) {
			draw(time);
			if (shouldAnimate) {
				rafRef.current = requestAnimationFrame(frame);
			}
		}

		resize();
		draw(performance.now());
		if (shouldAnimate) {
			rafRef.current = requestAnimationFrame(frame);
		}

		window.addEventListener('resize', resize);
		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, [getAudioSnapshot, hasAnimatedFilter, image, store, filterActive]);

	if (!store.globalBackgroundEnabled || !store.globalBackgroundUrl || !image)
		return null;

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: -10
			}}
		/>
	);
}
