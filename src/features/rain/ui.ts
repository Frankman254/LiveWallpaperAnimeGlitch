/**
 * Rain domain — React surface.
 *
 * Small enough that it has no model half yet: everything rain-shaped outside
 * the editor is either store state or `components/wallpaper/RainLayer`, which
 * is a registered scene layer and stays with the layer engine (see
 * `features/background/index.ts`). If pure rain logic ever appears, add an
 * `index.ts` beside this and keep React out of it.
 */
export { RainSection } from './controls/RainSection';
export { RainProfilesSection } from './controls/RainProfilesSection';
