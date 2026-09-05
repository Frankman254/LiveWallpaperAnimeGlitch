import { loadImageBlob } from '@/lib/db/imageDb';

/**
 * Resolves album-cover assets (stored in IndexedDB by `coverAssetId`) into
 * ready-to-draw <img> elements for the render loop. The loop can't await, so
 * this kicks off the async load once per asset and returns null until the
 * image is decoded; subsequent frames get the cached element.
 */
type CoverEntry = {
	image: HTMLImageElement | null;
	objectUrl: string | null;
	loading: boolean;
};

const cache = new Map<string, CoverEntry>();

export function getCoverImage(
	assetId: string | undefined | null
): HTMLImageElement | null {
	if (!assetId) return null;

	const existing = cache.get(assetId);
	if (existing) {
		return existing.image && existing.image.complete
			? existing.image
			: null;
	}

	const entry: CoverEntry = { image: null, objectUrl: null, loading: true };
	cache.set(assetId, entry);

	void loadImageBlob(assetId)
		.then(blob => {
			if (!blob) {
				entry.loading = false;
				return;
			}
			const url = URL.createObjectURL(blob);
			const image = new Image();
			image.onload = () => {
				entry.image = image;
			};
			image.src = url;
			entry.objectUrl = url;
			entry.loading = false;
		})
		.catch(() => {
			entry.loading = false;
		});

	return null;
}

/** Frees object URLs for assets no longer referenced. Call sparingly. */
export function clearCoverImageCache(): void {
	for (const entry of cache.values()) {
		if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
	}
	cache.clear();
}
