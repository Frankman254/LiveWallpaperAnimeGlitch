/**
 * Lyrics domain — React surface. Separate from `./index` so pure consumers do
 * not pull components into their module graph. See the note in
 * `features/spectrum/index.ts` for why that split is load-bearing.
 */
export { default as LyricsTab } from './controls/LyricsTab';
