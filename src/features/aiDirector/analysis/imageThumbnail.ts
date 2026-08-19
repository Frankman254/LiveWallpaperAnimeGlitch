/**
 * Small JPEG rendition of an image, for sending to a vision model.
 *
 * Separate from `analyzeImageUrl` because the two want opposite things: the
 * analyzer needs nearest-neighbour at 64px to preserve the pixel-art signal,
 * while a model reads a smooth 256px JPEG far better than a blocky one. Doing
 * both from one canvas would compromise whichever came second.
 */

/** Long edge of the rendition sent to the model. Big enough to read style from,
 *  small enough that the request stays cheap. */
export const MODEL_IMAGE_SIZE = 256;

/** JPEG quality — style survives compression; file size matters more. */
const JPEG_QUALITY = 0.82;

export type ModelImage = {
	/** Base64 payload WITHOUT the data: URL prefix, as the API expects. */
	base64: string;
	mediaType: 'image/jpeg';
};

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
		image.src = url;
	});
}

/**
 * Downscale to `MODEL_IMAGE_SIZE` on the long edge, preserving aspect ratio,
 * and encode as JPEG. Smoothing stays ON here — unlike the analyzer.
 */
export async function buildModelImage(url: string): Promise<ModelImage> {
	const image = await loadImage(url);
	const width = image.naturalWidth || MODEL_IMAGE_SIZE;
	const height = image.naturalHeight || MODEL_IMAGE_SIZE;
	const scale = Math.min(1, MODEL_IMAGE_SIZE / Math.max(width, height));

	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(width * scale));
	canvas.height = Math.max(1, Math.round(height * scale));

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('2D canvas context unavailable');
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	// JPEG has no alpha; without a matte, transparent regions encode as black.
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

	const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
	return {
		base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
		mediaType: 'image/jpeg'
	};
}
