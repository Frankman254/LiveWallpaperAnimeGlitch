/**
 * Canvas wrapper around `computeImageSignature`. Kept apart from the pure core
 * so the maths stay testable without a DOM.
 */
import {
	ANALYSIS_SIZE,
	computeImageSignature,
	type ImageSignature
} from './imageSignature';

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		// Blob/object URLs are same-origin, but pool images restored from a
		// remote source would otherwise taint the canvas and make getImageData
		// throw. Asking for anonymous CORS is free when the server allows it.
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
		image.src = url;
	});
}

/**
 * Downscale an image to `ANALYSIS_SIZE` and describe it.
 *
 * Smoothing is disabled on purpose: bilinear downscaling invents intermediate
 * colours, which would erase exactly the signal the pixel-art detector and the
 * palette extractor look for. Nearest-neighbour keeps a 5-colour sprite
 * reading as 5 colours.
 */
export async function analyzeImageUrl(url: string): Promise<ImageSignature> {
	const image = await loadImage(url);
	const canvas = document.createElement('canvas');
	canvas.width = ANALYSIS_SIZE;
	canvas.height = ANALYSIS_SIZE;

	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('2D canvas context unavailable');
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(image, 0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);

	const data = ctx.getImageData(0, 0, ANALYSIS_SIZE, ANALYSIS_SIZE);
	return computeImageSignature({
		pixels: data.data,
		width: ANALYSIS_SIZE,
		height: ANALYSIS_SIZE,
		sourceWidth: image.naturalWidth || ANALYSIS_SIZE,
		sourceHeight: image.naturalHeight || ANALYSIS_SIZE
	});
}
