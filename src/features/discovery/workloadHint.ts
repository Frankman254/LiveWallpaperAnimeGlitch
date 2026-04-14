import type { WallpaperState } from '@/types/wallpaper';
import { PARTICLE_LIMITS } from '@/lib/constants';
import { findPresetById } from '@/features/spectrum/presets/spectrumPresets';

/**
 * Returns whether the current wallpaper settings are likely GPU-heavy
 * relative to the chosen performance mode (for dismissible UI hints).
 */
export function getVisualWorkloadHint(state: WallpaperState): 'heavy' | 'none' {
	const preset = state.activeSpectrumPresetId
		? findPresetById(state.activeSpectrumPresetId)
		: null;
	if (preset?.performanceTier === 'heavy' && state.performanceMode !== 'low') {
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
