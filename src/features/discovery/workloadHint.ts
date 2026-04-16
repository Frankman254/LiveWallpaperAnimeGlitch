import type { WallpaperState } from '@/types/wallpaper';
import { PARTICLE_LIMITS } from '@/lib/constants';

/**
 * Returns whether the current wallpaper settings are likely GPU-heavy
 * relative to the chosen performance mode (for dismissible UI hints).
 */
export function getVisualWorkloadHint(state: WallpaperState): 'heavy' | 'none' {
	const spectrumLooksHeavy =
		state.spectrumEnabled &&
		(state.spectrumFamily === 'tunnel' ||
			state.spectrumFamily === 'liquid' ||
			state.spectrumFamily === 'orbital' ||
			state.spectrumMotionTrails > 0.45 ||
			state.spectrumGhostFrames > 0.45 ||
			state.spectrumAfterglow > 0.45);
	if (spectrumLooksHeavy && state.performanceMode !== 'low') {
		return 'heavy';
	}
	const limit = PARTICLE_LIMITS[state.performanceMode] ?? 80;
	if (
		state.particlesEnabled &&
		state.particleCount >= limit * 0.92 &&
		state.performanceMode !== 'low'
	) {
		return 'heavy';
	}
	if (
		state.rainEnabled &&
		state.rainDropCount >= 1100 &&
		state.performanceMode === 'high'
	) {
		return 'heavy';
	}
	return 'none';
}
