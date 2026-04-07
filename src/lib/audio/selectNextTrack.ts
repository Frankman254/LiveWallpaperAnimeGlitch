import type { AudioMixMode, AudioPlaylistTrack } from '@/types/wallpaper';

/**
 * Pure function — selects the next track from the playlist.
 *
 * Modes:
 *  - sequential   : next enabled track after currentId (wraps)
 *  - energy-match : next enabled track whose energyScore is closest to current
 *  - contrast     : next enabled track whose energyScore differs most from current
 *
 * Falls back to sequential if scores are unavailable.
 * Returns null when the playlist has fewer than 2 enabled tracks.
 */
export function selectNextTrack(
	tracks: AudioPlaylistTrack[],
	currentId: string,
	mode: AudioMixMode
): AudioPlaylistTrack | null {
	const enabled = tracks.filter(t => t.enabled);
	if (enabled.length < 2) return null;

	const currentIdx = enabled.findIndex(t => t.id === currentId);
	// Sequential (default + fallback)
	const sequentialNext = enabled[(currentIdx + 1) % enabled.length];

	if (mode === 'sequential' || mode === 'manual') return sequentialNext ?? null;

	const current = enabled[currentIdx];
	if (!current) return sequentialNext ?? null;

	const currentEnergy = current.energyScore ?? null;
	if (currentEnergy === null) return sequentialNext ?? null;

	// Filter out the current track for scoring
	const candidates = enabled.filter(t => t.id !== currentId);
	if (candidates.length === 0) return null;

	// Require at least one candidate to have a score
	const scored = candidates.filter(t => t.energyScore !== undefined);
	if (scored.length === 0) return sequentialNext ?? null;

	if (mode === 'energy-match') {
		// Closest energy to current
		let best = scored[0]!;
		let bestDist = Math.abs((best.energyScore ?? 0) - currentEnergy);
		for (const t of scored) {
			const dist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			if (dist < bestDist) {
				bestDist = dist;
				best = t;
			}
		}
		return best;
	}

	if (mode === 'contrast') {
		// Farthest energy from current
		let best = scored[0]!;
		let bestDist = Math.abs((best.energyScore ?? 0) - currentEnergy);
		for (const t of scored) {
			const dist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			if (dist > bestDist) {
				bestDist = dist;
				best = t;
			}
		}
		return best;
	}

	return sequentialNext ?? null;
}
