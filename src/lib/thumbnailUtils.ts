/**
 * Generates a lightweight thumbnail (as data URL) from an image URL.
 * Defaults to 200px max dimension and 0.6 quality WebP.
 */
export async function generateThumbnail(
	url: string,
	maxWidth = 200,
	maxHeight = 120
): Promise<string> {
	if (!url) return '';
	
	// If it's already a very small data URL, return it
	if (url.startsWith('data:') && url.length < 5000) return url;

	return new Promise((resolve) => {
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
			} else {
				if (height > maxHeight) {
					width *= maxHeight / height;
					height = maxHeight;
				}
			}

			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				resolve(url);
				return;
			}

			// Better quality downscaling
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'medium';

			ctx.drawImage(img, 0, 0, width, height);
			
			// Use WebP for best compression/performance ratio
			resolve(canvas.toDataURL('image/webp', 0.6));
		};
		img.onerror = () => {
			resolve(url);
		};
		img.src = url;
	});
}
