export const POOL_THUMBNAIL_MAX_WIDTH = 72;
export const POOL_THUMBNAIL_MAX_HEIGHT = 45;
const POOL_THUMBNAIL_QUALITY = 0.24;

type BackgroundThumbnailCandidate = {
	assetId: string;
	url: string | null;
	thumbnailUrl: string | null;
};

function yieldToUi(): Promise<void> {
	return new Promise(resolve => {
		window.setTimeout(resolve, 0);
	});
}

export function hasLowQualityThumbnail(
	thumbnailUrl: string | null | undefined
): boolean {
	return (
		typeof thumbnailUrl === 'string' &&
		thumbnailUrl.startsWith('data:image/')
	);
}

/**
 * Generates a lightweight thumbnail (as data URL) from an image URL.
 * Defaults to 200px max dimension and 0.6 quality WebP.
 */
export async function generateThumbnail(
	url: string,
	maxWidth = 200,
	maxHeight = 120,
	quality = 0.6
): Promise<string> {
	if (!url) return '';

	// If it's already a very small data URL, return it.
	if (url.startsWith('data:') && url.length < 5000) return url;

	return new Promise(resolve => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const canvas = document.createElement('canvas');
			let width = img.width;
			let height = img.height;

			if (width > height) {
				if (width > maxWidth) {
					height *= maxWidth / width;
					width = maxWidth;
				}
			} else if (height > maxHeight) {
				width *= maxHeight / height;
				height = maxHeight;
			}

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(url);
				return;
			}

			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'medium';
			ctx.drawImage(img, 0, 0, width, height);

			resolve(canvas.toDataURL('image/webp', quality));
		};
		img.onerror = () => {
			resolve(url);
		};
		img.src = url;
	});
}

export async function generatePoolThumbnail(url: string): Promise<string> {
	return generateThumbnail(
		url,
		POOL_THUMBNAIL_MAX_WIDTH,
		POOL_THUMBNAIL_MAX_HEIGHT,
		POOL_THUMBNAIL_QUALITY
	);
}

export async function hydrateMissingPoolThumbnails(
	images: BackgroundThumbnailCandidate[],
	applyThumbnail: (assetId: string, thumbnailUrl: string) => void
): Promise<void> {
	for (const image of images) {
		if (!image.url || hasLowQualityThumbnail(image.thumbnailUrl)) continue;

		const thumbnailUrl = await generatePoolThumbnail(image.url);
		if (!hasLowQualityThumbnail(thumbnailUrl)) continue;

		applyThumbnail(image.assetId, thumbnailUrl);
		await yieldToUi();
	}
}
