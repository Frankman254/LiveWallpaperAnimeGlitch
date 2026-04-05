export function formatTrackTitle(rawTitle: string): string {
	const trimmed = rawTitle.trim();
	if (!trimmed) return '';

	let decoded = trimmed;
	if (/%[0-9A-Fa-f]{2}/.test(decoded)) {
		try {
			decoded = decodeURIComponent(decoded);
		} catch {
			// Keep original when the filename is not valid URI-encoded text.
		}
	}

	return decoded
		.normalize('NFC')
		.replace(/\.[^.]+$/, '')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
