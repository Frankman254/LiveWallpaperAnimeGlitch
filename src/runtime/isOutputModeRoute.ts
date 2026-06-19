/** True when the hash route is a clean output shell (#/present or #/record). */
export function isOutputModeRoute(): boolean {
	if (typeof window === 'undefined') return false;
	const hash = window.location.hash;
	return hash.includes('/present') || hash.includes('/record');
}
