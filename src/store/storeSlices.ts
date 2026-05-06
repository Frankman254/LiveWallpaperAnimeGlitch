/**
 * Re-exports all store slice creators from their feature modules.
 *
 * Store slices live in src/store/slices/ — one file per domain.
 * This barrel keeps wallpaperStore.ts imports unchanged.
 */
export { createBackgroundSlice } from '@/store/slices/backgroundSlice';
export { createAudioSlice } from '@/store/slices/audioSlice';
export { createAudioLyricsSlice } from '@/store/slices/audioLyricsSlice';
export { createSpectrumSlice } from '@/store/slices/spectrumSlice';
export { createLogoSlice } from '@/store/slices/logoSlice';
export { createParticlesRainSlice } from '@/store/slices/particlesRainSlice';
export { createLayoutSlice } from '@/store/slices/layoutSlice';
export { createSystemSlice } from '@/store/slices/systemSlice';
export { createAudioPlaylistSlice } from '@/store/slices/audioPlaylistSlice';
