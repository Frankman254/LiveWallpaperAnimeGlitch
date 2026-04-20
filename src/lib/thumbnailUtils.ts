export const POOL_THUMBNAIL_MAX_WIDTH = 144;
export const POOL_THUMBNAIL_MAX_HEIGHT = 90;
const POOL_THUMBNAIL_QUALITY = 0.42;
const POOL_THUMBNAIL_UPGRADE_THRESHOLD = 0.75;

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

export function isGeneratedPoolThumbnail(
	thumbnailUrl: string | null | undefined
): boolean {
	return typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('data:image/');
}

async function loadThumbnailDimensions(
	thumbnailUrl: string
): Promise<{ width: number; height: number } | null> {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
		img.onerror = () => {
			resolve(null);
		};
		img.src = thumbnailUrl;
	});
}

export async function needsPoolThumbnailRefresh(
	thumbnailUrl: string | null | undefined
): Promise<boolean> {
	if (!thumbnailUrl) return true;
	if (!isGeneratedPoolThumbnail(thumbnailUrl)) return true;

	const dimensions = await loadThumbnailDimensions(thumbnailUrl);
	if (!dimensions) return true;

	return (
		dimensions.width <
			POOL_THUMBNAIL_MAX_WIDTH * POOL_THUMBNAIL_UPGRADE_THRESHOLD &&
		dimensions.height <
			POOL_THUMBNAIL_MAX_HEIGHT * POOL_THUMBNAIL_UPGRADE_THRESHOLD
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
			ctx.imageSmoothingQuality = 'high';
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
		if (!image.url) continue;
		if (!(await needsPoolThumbnailRefresh(image.thumbnailUrl))) continue;

		const thumbnailUrl = await generatePoolThumbnail(image.url);
		if (!isGeneratedPoolThumbnail(thumbnailUrl)) continue;

		applyThumbnail(image.assetId, thumbnailUrl);
		await yieldToUi();
	}
}
