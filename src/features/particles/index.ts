/**
 * Particles domain — public surface.
 *
 * The drifting particle field: how many, what shape, how they react to audio.
 *
 * See docs/architecture/ARCHITECTURE.md §3 (Ownership).
 *
 * Layout:
 *   presets/   the "randomize motion" generator
 *   controls/  the particle sections of the Motion tab
 *
 * `./index` is React-free (the store's randomize action uses it); the editor
 * sections live in `./ui`.
 *
 * NOT here, on purpose: `components/wallpaper/{ParticleField,ParticlesBackground,
 * ParticlesForeground}` draw the particles, but they are registered scene layers
 * — plugins into the wallpaper layer engine, same as the background renderers.
 * See `features/background/index.ts` for the reasoning.
 */

// ── presets ─────────────────────────────────────────────────────────────────
// NOTE: named `generateRandomMotionProfile` and filed under `features/motion/`
// until now, but its own header says Rain and Stage FX are left untouched — it
// only ever rolled particles. The folder now matches what it does; the exported
// name is unchanged so the store action keeps reading the same.
export { generateRandomMotionProfile } from './presets/particlesRandomizer';
