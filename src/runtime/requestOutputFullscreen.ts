/** Request fullscreen from a user-gesture handler; never throws. */
export async function requestOutputFullscreen(): Promise<boolean> {
	if (typeof document === 'undefined') return false;
	if (!document.documentElement.requestFullscreen) return false;
	if (document.fullscreenElement) return true;
	try {
		await document.documentElement.requestFullscreen();
		return Boolean(document.fullscreenElement);
	} catch (err) {
		if (import.meta.env.DEV) {
			console.warn('[output] fullscreen request rejected', err);
		}
		return false;
	}
}

export async function exitOutputFullscreen(): Promise<void> {
	if (typeof document === 'undefined') return;
	if (!document.fullscreenElement) return;
	try {
		await document.exitFullscreen();
	} catch {
		// Browser may reject if not in fullscreen.
	}
}
