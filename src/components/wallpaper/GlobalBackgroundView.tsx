import { useEffect, useRef, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { ImageFitMode } from '@/types/wallpaper';
import { useAudioData } from '@/hooks/useAudioData';
import {
	drawFilmNoise,
	drawRgbShift,
	drawScanlines,
	getScanlineAmount
} from '@/components/wallpaper/layers/imageCanvasEffects';

const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(
	url: string,
	onReady: (image: HTMLImageElement) => void
): HTMLImageElement {
	const cached = imageCache.get(url);
	if (cached) {
		if (cached.complete && cached.naturalWidth > 0) onReady(cached);
		else cached.onload = () => onReady(cached);
		return cached;
	}

	const image = new Image();
	image.decoding = 'async';
	image.onload = () => onReady(image);
	image.src = url;
	imageCache.set(url, image);
	return image;
}

function getBaseSize(
	canvasWidth: number,
	canvasHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode
) {
	const imageAspect = imageWidth / Math.max(imageHeight, 1);
	const canvasAspect = canvasWidth / Math.max(canvasHeight, 1);

	if (fitMode === 'stretch')
		return { width: canvasWidth, height: canvasHeight };
	if (fitMode === 'fit-width')
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	if (fitMode === 'fit-height')
		return { width: canvasHeight * imageAspect, height: canvasHeight };

	if (fitMode === 'contain') {
		if (canvasAspect > imageAspect) {
			return { width: canvasHeight * imageAspect, height: canvasHeight };
		}
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	}

	if (canvasAspect > imageAspect) {
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	}

	return { width: canvasHeight * imageAspect, height: canvasHeight };
}

export default function GlobalBackgroundView() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const { getAudioSnapshot } = useAudioData();
	const store = useWallpaperStore();

	useEffect(() => {
		if (!store.globalBackgroundEnabled || !store.globalBackgroundUrl) {
			setImage(null);
			return;
		}

		const nextImage = getCachedImage(store.globalBackgroundUrl, setImage);
		if (nextImage.complete && nextImage.naturalWidth > 0)
			setImage(nextImage);
	}, [store.globalBackgroundEnabled, store.globalBackgroundUrl]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (
			!canvas ||
			!image ||
			!store.globalBackgroundUrl ||
			!store.globalBackgroundEnabled
		)
			return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};

		const frame = (time: number) => {
			if (!canvasRef.current) return;
			const currentCanvas = canvasRef.current;
			if (
				currentCanvas.width !== window.innerWidth ||
				currentCanvas.height !== window.innerHeight
			) {
				resize();
			}

			const state = useWallpaperStore.getState();
			const filterActive =
				state.filterTargets.includes('global-background');
			const brightness =
				state.globalBackgroundBrightness *
				(filterActive ? state.filterBrightness : 1);
			const contrast =
				state.globalBackgroundContrast *
				(filterActive ? state.filterContrast : 1);
			const saturation =
				state.globalBackgroundSaturation *
				(filterActive ? state.filterSaturation : 1);
			const blur =
				state.globalBackgroundBlur +
				(filterActive ? state.filterBlur : 0);
			const hue =
				state.globalBackgroundHueRotate +
				(filterActive ? state.filterHueRotate : 0);
			const opacity =
				state.globalBackgroundOpacity *
				(filterActive ? state.filterOpacity : 1);
			const rgbShiftPixels = filterActive
				? state.rgbShift *
					Math.min(currentCanvas.width, currentCanvas.height) *
					0.65
				: 0;
			const filmNoiseAmount = filterActive ? state.noiseIntensity : 0;
			const audio = getAudioSnapshot();
			const scanlineAmount = filterActive
				? getScanlineAmount(
						state.scanlineMode,
						state.scanlineIntensity,
						time,
						audio.amplitude
					)
				: 0;

			const base = getBaseSize(
				currentCanvas.width,
				currentCanvas.height,
				image.naturalWidth || currentCanvas.width,
				image.naturalHeight || currentCanvas.height,
				state.globalBackgroundFitMode
			);

			const width =
				base.width * Math.max(0.01, state.globalBackgroundScale);
			const height =
				base.height * Math.max(0.01, state.globalBackgroundScale);
			const cx =
				currentCanvas.width / 2 +
				state.globalBackgroundPositionX * currentCanvas.width * 0.5;
			const cy =
				currentCanvas.height / 2 -
				state.globalBackgroundPositionY * currentCanvas.height * 0.5;

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
					state.scanlineSpacing,
					state.scanlineThickness,
					ctx.globalAlpha
				);
			}
			ctx.restore();

			rafRef.current = requestAnimationFrame(frame);
		};

		resize();
		rafRef.current = requestAnimationFrame(frame);
		window.addEventListener('resize', resize);
		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, [
		getAudioSnapshot,
		image,
		store.globalBackgroundEnabled,
		store.globalBackgroundUrl
	]);

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
