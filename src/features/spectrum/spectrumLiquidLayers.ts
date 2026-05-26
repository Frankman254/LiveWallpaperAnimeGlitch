import type { SpectrumProfileSettings, SpectrumRadialShape } from '@/types/wallpaper';

export const SPECTRUM_LIQUID_LAYER_COUNT = 3;

export type SpectrumLiquidLayerIndex = 0 | 1 | 2;

export type SpectrumLiquidLayerParams = {
	opacity: number;
	amp: number;
	fill: number;
	speed: number;
	rotationSpeed: number;
	shape: SpectrumRadialShape;
	rigidShape: boolean;
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
	spectrumLiquidLayer1RotationSpeed: number;
	spectrumLiquidLayer2RotationSpeed: number;
	spectrumLiquidLayer3RotationSpeed: number;
	spectrumLiquidLayer1Shape: SpectrumRadialShape;
	spectrumLiquidLayer2Shape: SpectrumRadialShape;
	spectrumLiquidLayer3Shape: SpectrumRadialShape;
	spectrumLiquidLayer1RigidShape: boolean;
	spectrumLiquidLayer2RigidShape: boolean;
	spectrumLiquidLayer3RigidShape: boolean;
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
	spectrumCloneLiquidLayer1RotationSpeed: number;
	spectrumCloneLiquidLayer2RotationSpeed: number;
	spectrumCloneLiquidLayer3RotationSpeed: number;
	spectrumCloneLiquidLayer1Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer2Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer3Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer1RigidShape: boolean;
	spectrumCloneLiquidLayer2RigidShape: boolean;
	spectrumCloneLiquidLayer3RigidShape: boolean;
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
	spectrumLiquidLayer3Speed: 0.5,
	spectrumLiquidLayer1RotationSpeed: 0,
	spectrumLiquidLayer2RotationSpeed: 0,
	spectrumLiquidLayer3RotationSpeed: 0,
	spectrumLiquidLayer1Shape: 'circle',
	spectrumLiquidLayer2Shape: 'circle',
	spectrumLiquidLayer3Shape: 'circle',
	spectrumLiquidLayer1RigidShape: false,
	spectrumLiquidLayer2RigidShape: false,
	spectrumLiquidLayer3RigidShape: false
};

const LAYER_KEYS: Record<
	SpectrumLiquidLayerIndex,
	Record<keyof SpectrumLiquidLayerParams, keyof SpectrumLiquidLayerFields>
> = {
	0: {
		opacity: 'spectrumLiquidLayer1Opacity',
		amp: 'spectrumLiquidLayer1Amp',
		fill: 'spectrumLiquidLayer1Fill',
		speed: 'spectrumLiquidLayer1Speed',
		rotationSpeed: 'spectrumLiquidLayer1RotationSpeed',
		shape: 'spectrumLiquidLayer1Shape',
		rigidShape: 'spectrumLiquidLayer1RigidShape'
	},
	1: {
		opacity: 'spectrumLiquidLayer2Opacity',
		amp: 'spectrumLiquidLayer2Amp',
		fill: 'spectrumLiquidLayer2Fill',
		speed: 'spectrumLiquidLayer2Speed',
		rotationSpeed: 'spectrumLiquidLayer2RotationSpeed',
		shape: 'spectrumLiquidLayer2Shape',
		rigidShape: 'spectrumLiquidLayer2RigidShape'
	},
	2: {
		opacity: 'spectrumLiquidLayer3Opacity',
		amp: 'spectrumLiquidLayer3Amp',
		fill: 'spectrumLiquidLayer3Fill',
		speed: 'spectrumLiquidLayer3Speed',
		rotationSpeed: 'spectrumLiquidLayer3RotationSpeed',
		shape: 'spectrumLiquidLayer3Shape',
		rigidShape: 'spectrumLiquidLayer3RigidShape'
	}
};

export function getSpectrumLiquidLayerParams(
	settings: Pick<SpectrumProfileSettings, keyof SpectrumLiquidLayerFields>,
	layer: SpectrumLiquidLayerIndex
): SpectrumLiquidLayerParams {
	const keys = LAYER_KEYS[layer];
	return {
		opacity: Number(
			settings[keys.opacity] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.opacity]
		),
		amp: Number(
			settings[keys.amp] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.amp]
		),
		fill: Number(
			settings[keys.fill] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.fill]
		),
		speed: Number(
			settings[keys.speed] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.speed]
		),
		rotationSpeed:
			Number(
				settings[keys.rotationSpeed] ??
					DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.rotationSpeed]
			),
		shape: (
			settings[keys.shape] ?? DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.shape]
		) as SpectrumRadialShape,
		rigidShape:
			typeof settings[keys.rigidShape] === 'boolean'
				? (settings[keys.rigidShape] as boolean)
				: (DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.rigidShape] as boolean)
	};
}

export type SpectrumLiquidLayerParamKey = Exclude<
	keyof SpectrumLiquidLayerParams,
	'shape' | 'rigidShape'
>;

export function getSpectrumLiquidLayerFieldKey(
	layer: 1 | 2 | 3,
	param: SpectrumLiquidLayerParamKey
): keyof SpectrumLiquidLayerFields {
	const suffix: Record<SpectrumLiquidLayerParamKey, string> = {
		opacity: 'Opacity',
		amp: 'Amp',
		fill: 'Fill',
		speed: 'Speed',
		rotationSpeed: 'RotationSpeed'
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
		speed: 'Speed',
		rotationSpeed: 'RotationSpeed'
	};
	return `spectrumCloneLiquidLayer${layer}${suffix[param]}` as keyof SpectrumCloneLiquidLayerFields;
}

export function getSpectrumLiquidLayerShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumLiquidLayerFields {
	return `spectrumLiquidLayer${layer}Shape` as keyof SpectrumLiquidLayerFields;
}

export function getSpectrumCloneLiquidLayerShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumCloneLiquidLayerFields {
	return `spectrumCloneLiquidLayer${layer}Shape` as keyof SpectrumCloneLiquidLayerFields;
}

export function getSpectrumLiquidLayerRigidShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumLiquidLayerFields {
	return `spectrumLiquidLayer${layer}RigidShape` as keyof SpectrumLiquidLayerFields;
}

export function getSpectrumCloneLiquidLayerRigidShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumCloneLiquidLayerFields {
	return `spectrumCloneLiquidLayer${layer}RigidShape` as keyof SpectrumCloneLiquidLayerFields;
}

/**
 * Returns true if any of the three layers is set to rigid shape.
 * Used by the renderer to compute the shared mean-energy normalization
 * once per frame instead of for every potentially-rigid layer.
 */
export function anyLiquidLayerRigid(
	settings: Pick<SpectrumProfileSettings, keyof SpectrumLiquidLayerFields>
): boolean {
	return (
		settings.spectrumLiquidLayer1RigidShape ||
		settings.spectrumLiquidLayer2RigidShape ||
		settings.spectrumLiquidLayer3RigidShape
	);
}
