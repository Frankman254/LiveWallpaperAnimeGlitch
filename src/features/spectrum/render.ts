/**
 * Spectrum domain — canvas draw path.
 *
 * A third entry point alongside `./index` (pure model) and `./ui` (React).
 *
 * It originally existed because `runtime/CircularSpectrum` read render policy
 * (`performanceMode`, `showSpectrumDiagnosticsHud`) straight off the global
 * store, which put the store in a cycle with itself
 * (store → slice → spectrum barrel → CircularSpectrum → store). That is fixed:
 * policy is now passed in as `SpectrumRenderPolicy`, and nothing under the draw
 * path imports `store/` any more.
 *
 * This file stays anyway, for the reason that outlived the cycle: weight.
 * `renderers/`, `geometry/` and `effects/` are ~6.8k LOC of canvas code across
 * 17 modules that only 7 call sites need, while `./index` is imported by 21 —
 * `lib/constants.ts` among them, which in turn is imported by nearly the whole
 * app. Folding the two would make every consumer of DEFAULT_STATE load the
 * renderer. A fat barrel is exactly what crashed 18 test suites here before.
 *
 * So the split is by consumer, not by accident: model consumers (store slices,
 * migrations, `lib/`) import `./index`; the live canvas layers and the offline
 * exporter import this.
 */
export {
	drawSpectrum,
	resetSpectrum,
	resolveAmbientShadowBlur
} from './runtime/CircularSpectrum';
export type { SpectrumRenderPolicy } from './runtime/CircularSpectrum';
export {
	drawLinearBars,
	drawLinearWave
} from './renderers/linear/linearRenderer';
export {
	drawRadialBars,
	drawRadialWave
} from './renderers/radial/radialRenderer';
export { drawOscilloscope } from './renderers/oscilloscope/oscilloscopeRenderer';
