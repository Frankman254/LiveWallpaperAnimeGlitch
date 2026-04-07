import type { AudioMixMode, AudioPlaylistTrack } from '@/types/wallpaper';

/**
 * Pure function — selects the next track from the playlist.
 *
 * Modes:
 *  - sequential   : next enabled track after currentId (wraps)
 *  - energy-match : next enabled track whose energyScore is closest to current,
 *                   with BPM proximity bonus when available
 *  - contrast     : next enabled track whose energyScore differs most from current,
 *                   with compatible-BPM preference when available
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

	const currentBpm = current.estimatedBpm ?? null;
	const currentBeat = current.beatStrength ?? null;

	if (mode === 'energy-match') {
		let best = scored[0]!;
		let bestScore = -Infinity;
		for (const t of scored) {
			// Base: inverse distance in energy (closer = better)
			const energyDist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			let score = 1 - energyDist; // 0–1, higher is more similar

			// BPM proximity bonus (±15% tolerance)
			if (currentBpm !== null && t.estimatedBpm !== undefined && t.estimatedBpm > 0) {
				const bpmRatio = t.estimatedBpm / currentBpm;
				// Consider double/half time matches too
				const ratios = [bpmRatio, bpmRatio * 2, bpmRatio / 2];
				const closestRatio = ratios.reduce((prev, r) =>
					Math.abs(r - 1) < Math.abs(prev - 1) ? r : prev
				);
				const bpmProximity = Math.max(0, 1 - Math.abs(closestRatio - 1) / 0.15);
				score += bpmProximity * 0.3; // 30% weight
			}

			// Beat strength similarity bonus
			if (currentBeat !== null && t.beatStrength !== undefined) {
				const beatDist = Math.abs(t.beatStrength - currentBeat);
				score += (1 - beatDist) * 0.15; // 15% weight
			}

			if (score > bestScore) {
				bestScore = score;
				best = t;
			}
		}
		return best;
	}

	if (mode === 'contrast') {
		let best = scored[0]!;
		let bestScore = -Infinity;
		for (const t of scored) {
			// Base: energy distance (farther = better for contrast)
			const energyDist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			let score = energyDist;

			// Prefer compatible BPM even in contrast mode (avoid jarring tempo shifts)
			if (currentBpm !== null && t.estimatedBpm !== undefined && t.estimatedBpm > 0) {
				const bpmRatio = t.estimatedBpm / currentBpm;
				const ratios = [bpmRatio, bpmRatio * 2, bpmRatio / 2];
				const closestRatio = ratios.reduce((prev, r) =>
					Math.abs(r - 1) < Math.abs(prev - 1) ? r : prev
				);
				const bpmCompat = Math.max(0, 1 - Math.abs(closestRatio - 1) / 0.25);
				score += bpmCompat * 0.2; // 20% weight
			}

			if (score > bestScore) {
				bestScore = score;
				best = t;
			}
		}
		return best;
	}

	return sequentialNext ?? null;
}
