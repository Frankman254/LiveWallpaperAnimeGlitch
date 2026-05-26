import type { SpectrumFrameMemoryPresetId } from './spectrumFrameMemoryPresets';
import {
	DEFAULT_SPECTRUM_LIQUID_LAYERS,
	type SpectrumLiquidLayerFields
} from './spectrumLiquidLayers';

const LIQUID_PRESETS: Record<SpectrumFrameMemoryPresetId, SpectrumLiquidLayerFields> =
	{
		safe: {
			spectrumLiquidLayer1Opacity: 0.45,
			spectrumLiquidLayer2Opacity: 0.62,
			spectrumLiquidLayer3Opacity: 0.78,
			spectrumLiquidLayer1Amp: 0.75,
			spectrumLiquidLayer2Amp: 0.5,
			spectrumLiquidLayer3Amp: 0.28,
			spectrumLiquidLayer1Fill: 0.5,
			spectrumLiquidLayer2Fill: 0.35,
			spectrumLiquidLayer3Fill: 0.2,
			spectrumLiquidLayer1Speed: 0.7,
			spectrumLiquidLayer2Speed: 0.55,
			spectrumLiquidLayer3Speed: 0.4,
			spectrumLiquidLayer1RotationSpeed: 0,
			spectrumLiquidLayer2RotationSpeed: 0,
			spectrumLiquidLayer3RotationSpeed: 0,
			spectrumLiquidLayer1Shape: 'circle',
			spectrumLiquidLayer2Shape: 'circle',
			spectrumLiquidLayer3Shape: 'circle'
		},
		balanced: { ...DEFAULT_SPECTRUM_LIQUID_LAYERS },
		heavy: {
			spectrumLiquidLayer1Opacity: 0.65,
			spectrumLiquidLayer2Opacity: 0.88,
			spectrumLiquidLayer3Opacity: 1,
			spectrumLiquidLayer1Amp: 1.15,
			spectrumLiquidLayer2Amp: 0.85,
			spectrumLiquidLayer3Amp: 0.55,
			spectrumLiquidLayer1Fill: 1,
			spectrumLiquidLayer2Fill: 0.82,
			spectrumLiquidLayer3Fill: 0.62,
			spectrumLiquidLayer1Speed: 1.2,
			spectrumLiquidLayer2Speed: 0.95,
			spectrumLiquidLayer3Speed: 0.72,
			spectrumLiquidLayer1RotationSpeed: 0,
			spectrumLiquidLayer2RotationSpeed: 0,
			spectrumLiquidLayer3RotationSpeed: 0,
			spectrumLiquidLayer1Shape: 'circle',
			spectrumLiquidLayer2Shape: 'circle',
			spectrumLiquidLayer3Shape: 'circle'
		}
	};

export function buildSpectrumLiquidPresetPatch(
	preset: SpectrumFrameMemoryPresetId
): SpectrumLiquidLayerFields {
	return { ...LIQUID_PRESETS[preset] };
}
