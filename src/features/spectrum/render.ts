/**
 * Spectrum domain — canvas draw path.
 *
 * A third entry point alongside `./index` (pure model) and `./ui` (React),
 * and it exists for a concrete reason rather than tidiness:
 * `runtime/CircularSpectrum` reads render policy (`performanceMode`,
 * `showSpectrumDiagnosticsHud`) straight off the global store. That makes it
 * the one non-UI module in the domain that depends on `store/` — so exporting
 * it from `./index` put the store into a cycle with itself
 * (store → slice → spectrum barrel → CircularSpectrum → store).
 *
 * Consumers of the draw path (the live canvas layers and the offline exporter)
 * import from here. Consumers of the model (store slices, migrations, lib)
 * import from `./index` and never pull the renderer in.
 *
 * The deeper fix is to stop reading the store here and pass render policy into
 * `drawSpectrum` like every other input; then this file can fold back into
 * `./index`. See ARCHITECTURE.md §6.3.
 */
export {
	drawSpectrum,
	resetSpectrum,
	resolveAmbientShadowBlur
} from './runtime/CircularSpectrum';
export {
	drawLinearBars,
	drawLinearWave
} from './renderers/linear/linearRenderer';
export {
	drawRadialBars,
	drawRadialWave
} from './renderers/radial/radialRenderer';
export { drawOscilloscope } from './renderers/oscilloscope/oscilloscopeRenderer';
