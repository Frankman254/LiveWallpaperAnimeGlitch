function extensionFromMime(type: string): string {
	if (type === 'image/jpeg') return 'jpg';
	if (type === 'image/png') return 'png';
	if (type === 'image/webp') return 'webp';
	if (type === 'image/gif') return 'gif';
	if (type === 'image/avif') return 'avif';
	return 'img';
}

function sanitizeDownloadFileName(value: string): string {
	return value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'wallpaper-image';
}

function safeDecodeURIComponent(value: string): string {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

export function resolveBackgroundDownloadFileName(
	image: { assetId: string; originalFileName?: string | null },
	blob: Blob
): string {
	const virtualPrefix = 'virtual://';
	const sourceName =
		image.originalFileName ??
		(image.assetId.startsWith(virtualPrefix)
			? safeDecodeURIComponent(
					image.assetId
						.slice(virtualPrefix.length)
						.split('/')
						.pop() ?? ''
				)
			: null);
	if (sourceName) return sanitizeDownloadFileName(sourceName);
	return `wallpaper-${image.assetId.slice(-8)}.${extensionFromMime(blob.type)}`;
}
