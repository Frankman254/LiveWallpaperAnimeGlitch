import type { SpectrumProfileSettings } from '@/types/wallpaper';

export const SPECTRUM_LIQUID_LAYER_COUNT = 3;

export type SpectrumLiquidLayerIndex = 0 | 1 | 2;

export type SpectrumLiquidLayerParams = {
	opacity: number;
	amp: number;
	fill: number;
	speed: number;
};

export type SpectrumLiquidLayerFields = {
	spectrumLiquidLayer1Opacity: number;
	spectrumLiquidLayer2Opacity: number;
	spectrumLiquidLayer3Opacity: number;
	spectrumLiquidLayer1Amp: number;
	spectrumLiquidLayer2Amp: number;
	spectrumLiquidLayer3Amp: number;
	spectrumLiquidLayer1Fill: number;
	spectrumLiquidLayer2Fill: number;
	spectrumLiquidLayer3Fill: number;
	spectrumLiquidLayer1Speed: number;
	spectrumLiquidLayer2Speed: number;
	spectrumLiquidLayer3Speed: number;
};

export type SpectrumCloneLiquidLayerFields = {
	spectrumCloneLiquidLayer1Opacity: number;
	spectrumCloneLiquidLayer2Opacity: number;
	spectrumCloneLiquidLayer3Opacity: number;
	spectrumCloneLiquidLayer1Amp: number;
	spectrumCloneLiquidLayer2Amp: number;
	spectrumCloneLiquidLayer3Amp: number;
	spectrumCloneLiquidLayer1Fill: number;
	spectrumCloneLiquidLayer2Fill: number;
	spectrumCloneLiquidLayer3Fill: number;
	spectrumCloneLiquidLayer1Speed: number;
	spectrumCloneLiquidLayer2Speed: number;
	spectrumCloneLiquidLayer3Speed: number;
};

export const DEFAULT_SPECTRUM_LIQUID_LAYERS: SpectrumLiquidLayerFields = {
	spectrumLiquidLayer1Opacity: 0.55,
	spectrumLiquidLayer2Opacity: 0.78,
	spectrumLiquidLayer3Opacity: 1,
	spectrumLiquidLayer1Amp: 1,
	spectrumLiquidLayer2Amp: 0.65,
	spectrumLiquidLayer3Amp: 0.35,
	spectrumLiquidLayer1Fill: 0.85,
	spectrumLiquidLayer2Fill: 0.65,
	spectrumLiquidLayer3Fill: 0.45,
	spectrumLiquidLayer1Speed: 1,
	spectrumLiquidLayer2Speed: 0.75,
	spectrumLiquidLayer3Speed: 0.5
};

const LAYER_KEYS: Record<
	SpectrumLiquidLayerIndex,
	Record<keyof SpectrumLiquidLayerParams, keyof SpectrumLiquidLayerFields>
> = {
	0: {
		opacity: 'spectrumLiquidLayer1Opacity',
		amp: 'spectrumLiquidLayer1Amp',
		fill: 'spectrumLiquidLayer1Fill',
		speed: 'spectrumLiquidLayer1Speed'
	},
	1: {
		opacity: 'spectrumLiquidLayer2Opacity',
		amp: 'spectrumLiquidLayer2Amp',
		fill: 'spectrumLiquidLayer2Fill',
		speed: 'spectrumLiquidLayer2Speed'
	},
	2: {
		opacity: 'spectrumLiquidLayer3Opacity',
		amp: 'spectrumLiquidLayer3Amp',
		fill: 'spectrumLiquidLayer3Fill',
		speed: 'spectrumLiquidLayer3Speed'
	}
};

export function getSpectrumLiquidLayerParams(
	settings: Pick<SpectrumProfileSettings, keyof SpectrumLiquidLayerFields>,
	layer: SpectrumLiquidLayerIndex
): SpectrumLiquidLayerParams {
	const keys = LAYER_KEYS[layer];
	return {
		opacity: settings[keys.opacity] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.opacity],
		amp: settings[keys.amp] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.amp],
		fill: settings[keys.fill] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.fill],
		speed: settings[keys.speed] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.speed]
	};
}

export type SpectrumLiquidLayerParamKey = keyof SpectrumLiquidLayerParams;

export function getSpectrumLiquidLayerFieldKey(
	layer: 1 | 2 | 3,
	param: SpectrumLiquidLayerParamKey
): keyof SpectrumLiquidLayerFields {
	const suffix: Record<SpectrumLiquidLayerParamKey, string> = {
		opacity: 'Opacity',
		amp: 'Amp',
		fill: 'Fill',
		speed: 'Speed'
	};
	return `spectrumLiquidLayer${layer}${suffix[param]}` as keyof SpectrumLiquidLayerFields;
}

export function getSpectrumCloneLiquidLayerFieldKey(
	layer: 1 | 2 | 3,
	param: SpectrumLiquidLayerParamKey
): keyof SpectrumCloneLiquidLayerFields {
	const suffix: Record<SpectrumLiquidLayerParamKey, string> = {
		opacity: 'Opacity',
		amp: 'Amp',
		fill: 'Fill',
		speed: 'Speed'
	};
	return `spectrumCloneLiquidLayer${layer}${suffix[param]}` as keyof SpectrumCloneLiquidLayerFields;
}
