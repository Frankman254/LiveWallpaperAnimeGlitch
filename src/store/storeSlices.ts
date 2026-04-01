/**
 * Re-exports all store slice creators from their feature modules.
 *
 * Store slices live in src/store/slices/ — one file per domain.
 * This barrel keeps wallpaperStore.ts imports unchanged.
 */
export { createBackgroundSlice } from '@/store/slices/backgroundSlice'
export { createAudioSlice } from '@/store/slices/audioSlice'
export { createSpectrumSlice } from '@/store/slices/spectrumSlice'
export { createLogoSlice } from '@/store/slices/logoSlice'
export { createParticlesRainSlice } from '@/store/slices/particlesRainSlice'
export { createSystemSlice } from '@/store/slices/systemSlice'
