/**
 * Spectrum domain — React surface.
 *
 * Separate from `./index` so pure consumers (lib, store, the offline exporter)
 * can use the domain's logic without dragging the editor UI — and its whole
 * component tree — into their module graph. See the note in `./index`.
 */
export { default as SpectrumTab } from './controls/SpectrumTab';
export { default as SpectrumDiagnosticsHud } from './diagnostics/SpectrumDiagnosticsHud';
export { default as SpectrumManualHud } from './manual/SpectrumManualHud';
export { default as SpectrumManualKeyboardGate } from './manual/SpectrumManualKeyboardGate';
