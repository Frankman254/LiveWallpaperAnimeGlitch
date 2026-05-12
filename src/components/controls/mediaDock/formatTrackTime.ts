/**
 * Formats seconds for track UI: under 1h -> `m:ss`; 1h+ -> `h:mm:ss`
 * (avoids ambiguous values like `61:43` meaning 61 minutes).
 */
export function formatTrackTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const t = Math.floor(seconds);
	const h = Math.floor(t / 3600);
	const m = Math.floor((t % 3600) / 60);
	const s = t % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}
