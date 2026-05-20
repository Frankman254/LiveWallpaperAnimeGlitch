import type { ImageFitMode } from '@/types/wallpaper';

export type AutoFitResult = {
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
};

const MAX_AUTO_FIT_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function getBaseSize(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode
): { width: number; height: number } {
	const imageAspect = imageWidth / Math.max(imageHeight, 1);
	const viewportAspect = viewportWidth / Math.max(viewportHeight, 1);

	if (fitMode === 'stretch') {
		return { width: viewportWidth, height: viewportHeight };
	}

	if (fitMode === 'fit-width') {
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}

	if (fitMode === 'fit-height') {
		return { width: viewportHeight * imageAspect, height: viewportHeight };
	}

	if (fitMode === 'contain') {
		if (viewportAspect > imageAspect) {
			return {
				width: viewportHeight * imageAspect,
				height: viewportHeight
			};
		}
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}

	if (viewportAspect > imageAspect) {
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}
	return { width: viewportHeight * imageAspect, height: viewportHeight };
}

export function resolveMinimumCoverScale(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode = 'cover',
	rotation = 0
): number {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);
	const base = getBaseSize(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode
	);
	const radians = ((rotation % 180) * Math.PI) / 180;
	const cos = Math.abs(Math.cos(radians));
	const sin = Math.abs(Math.sin(radians));
	const requiredImageAxisWidth =
		safeViewportWidth * cos + safeViewportHeight * sin;
	const requiredImageAxisHeight =
		safeViewportWidth * sin + safeViewportHeight * cos;

	return clamp(
		Math.max(
			requiredImageAxisWidth / Math.max(1, base.width),
			requiredImageAxisHeight / Math.max(1, base.height),
			1
		),
		0.01,
		MAX_AUTO_FIT_SCALE
	);
}

export function suggestBackgroundAutoFit(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	rotation = 0
): AutoFitResult {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);
	const fitMode: ImageFitMode = 'cover';
	const scale = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation
	);

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
