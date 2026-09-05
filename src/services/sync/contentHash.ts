/**
 * SHA-256 of a blob's bytes, hex-encoded. Used as the content hash for asset
 * dedupe + change detection (the same value the backend stores in
 * `project_assets.content_hash`). Falls back to a size+type marker where
 * `crypto.subtle` is unavailable (non-secure contexts) so callers still get a
 * stable-ish key rather than throwing.
 */
export async function computeContentHash(blob: Blob): Promise<string> {
	const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
	if (!subtle) {
		return `nohash-${blob.size}-${blob.type || 'bin'}`;
	}
	const buffer = await blob.arrayBuffer();
	const digest = await subtle.digest('SHA-256', buffer);
	const bytes = new Uint8Array(digest);
	let hex = '';
	for (let i = 0; i < bytes.length; i += 1) {
		hex += bytes[i]!.toString(16).padStart(2, '0');
	}
	return `sha256-${hex}`;
}
