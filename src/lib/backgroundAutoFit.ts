import type { ImageFitMode } from '@/types/wallpaper';

export type AutoFitResult = {
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function suggestBackgroundAutoFit(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	bassReactive: boolean,
	bassIntensity: number
): AutoFitResult {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);

	const viewportAspect = safeViewportWidth / safeViewportHeight;
	const imageAspect = safeImageWidth / safeImageHeight;
	const aspectDelta = Math.abs(Math.log(imageAspect / viewportAspect));

	let fitMode: ImageFitMode = 'cover';
	if (aspectDelta >= 0.12) {
		fitMode = imageAspect > viewportAspect ? 'fit-height' : 'fit-width';
	}

	const bassReserve = bassReactive
		? clamp(0.08 + bassIntensity * 0.28, 0.08, 0.4)
		: 0;
	const aspectReserve = clamp(aspectDelta * 0.08, 0, 0.16);
	const scale = clamp(1 + bassReserve + aspectReserve, 1, 1.56);

	return {
		fitMode,
		scale,
		positionX: 0,
		positionY: 0
	};
}

export function loadImageDimensions(
	url: string
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => {
			resolve({
				width: image.naturalWidth || image.width,
				height: image.naturalHeight || image.height
			});
		};
		image.onerror = () => reject(new Error('image-dimensions-failed'));
		image.src = url;
	});
}
