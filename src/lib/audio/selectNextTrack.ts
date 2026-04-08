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
	const currentDensity = current.densityScore ?? null;

	/** BPM proximity 0–1: considers exact, double-time, and half-time matches. */
	function bpmScore(candidateBpm: number | undefined, tolerance: number): number {
		if (!currentBpm || !candidateBpm || candidateBpm <= 0) return 0;
		const bpmRatio = candidateBpm / currentBpm;
		const ratios = [bpmRatio, bpmRatio * 2, bpmRatio / 2];
		const closest = ratios.reduce((prev, r) =>
			Math.abs(r - 1) < Math.abs(prev - 1) ? r : prev
		);
		return Math.max(0, 1 - Math.abs(closest - 1) / tolerance);
	}

	if (mode === 'energy-match') {
		let best = scored[0]!;
		let bestScore = -Infinity;
		for (const t of scored) {
			// Base: inverse energy distance (closer = better), weight 1.0
			const energyDist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			let score = 1 - energyDist;

			// Density similarity bonus (weight 0.2)
			if (currentDensity !== null && t.densityScore !== undefined) {
				score += (1 - Math.abs(t.densityScore - currentDensity)) * 0.2;
			}

			// BPM proximity bonus ±15% tolerance (weight 0.3)
			score += bpmScore(t.estimatedBpm, 0.15) * 0.3;

			// Beat strength similarity (weight 0.15)
			if (currentBeat !== null && t.beatStrength !== undefined) {
				score += (1 - Math.abs(t.beatStrength - currentBeat)) * 0.15;
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
			// Base: energy distance (farther = better), weight 1.0
			const energyDist = Math.abs((t.energyScore ?? 0) - currentEnergy);
			let score = energyDist;

			// Density contrast bonus (weight 0.2)
			if (currentDensity !== null && t.densityScore !== undefined) {
				score += Math.abs(t.densityScore - currentDensity) * 0.2;
			}

			// Prefer BPM-compatible tracks even in contrast (avoid jarring shifts)
			// ±25% tolerance (weight 0.2)
			score += bpmScore(t.estimatedBpm, 0.25) * 0.2;

			if (score > bestScore) {
				bestScore = score;
				best = t;
			}
		}
		return best;
	}

	return sequentialNext ?? null;
}
