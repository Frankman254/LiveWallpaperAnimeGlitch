import type {
	SpectrumProfileSettings,
	SpectrumRadialShape
} from '@/types/wallpaper';

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
	pixelate: boolean;
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
	/**
	 * Retro pixelate for THIS layer only, rendered through a scratch canvas
	 * inside the liquid renderer. The spectrum-wide `spectrumPixelate` toggle
	 * still pixelates every layer at once; these let one layer read as chunky
	 * pixel art while the others stay smooth.
	 */
	spectrumLiquidLayer1Pixelate: boolean;
	spectrumLiquidLayer2Pixelate: boolean;
	spectrumLiquidLayer3Pixelate: boolean;
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
	spectrumLiquidLayer3RigidShape: false,
	spectrumLiquidLayer1Pixelate: false,
	spectrumLiquidLayer2Pixelate: false,
	spectrumLiquidLayer3Pixelate: false
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
		rigidShape: 'spectrumLiquidLayer1RigidShape',
		pixelate: 'spectrumLiquidLayer1Pixelate'
	},
	1: {
		opacity: 'spectrumLiquidLayer2Opacity',
		amp: 'spectrumLiquidLayer2Amp',
		fill: 'spectrumLiquidLayer2Fill',
		speed: 'spectrumLiquidLayer2Speed',
		rotationSpeed: 'spectrumLiquidLayer2RotationSpeed',
		shape: 'spectrumLiquidLayer2Shape',
		rigidShape: 'spectrumLiquidLayer2RigidShape',
		pixelate: 'spectrumLiquidLayer2Pixelate'
	},
	2: {
		opacity: 'spectrumLiquidLayer3Opacity',
		amp: 'spectrumLiquidLayer3Amp',
		fill: 'spectrumLiquidLayer3Fill',
		speed: 'spectrumLiquidLayer3Speed',
		rotationSpeed: 'spectrumLiquidLayer3RotationSpeed',
		shape: 'spectrumLiquidLayer3Shape',
		rigidShape: 'spectrumLiquidLayer3RigidShape',
		pixelate: 'spectrumLiquidLayer3Pixelate'
	}
};

export function getSpectrumLiquidLayerParams(
	settings: Pick<SpectrumProfileSettings, keyof SpectrumLiquidLayerFields>,
	layer: SpectrumLiquidLayerIndex
): SpectrumLiquidLayerParams {
	const keys = LAYER_KEYS[layer];
	return {
		opacity: Number(
			settings[keys.opacity] ??
				DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.opacity]
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
		rotationSpeed: Number(
			settings[keys.rotationSpeed] ??
				DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.rotationSpeed]
		),
		shape: (settings[keys.shape] ??
			DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.shape]) as SpectrumRadialShape,
		rigidShape:
			typeof settings[keys.rigidShape] === 'boolean'
				? (settings[keys.rigidShape] as boolean)
				: (DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.rigidShape] as boolean),
		pixelate:
			typeof settings[keys.pixelate] === 'boolean'
				? (settings[keys.pixelate] as boolean)
				: (DEFAULT_SPECTRUM_LIQUID_LAYERS[keys.pixelate] as boolean)
	};
}

export type SpectrumLiquidLayerParamKey = Exclude<
	keyof SpectrumLiquidLayerParams,
	'shape' | 'rigidShape' | 'pixelate'
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

export function getSpectrumLiquidLayerShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumLiquidLayerFields {
	return `spectrumLiquidLayer${layer}Shape` as keyof SpectrumLiquidLayerFields;
}

export function getSpectrumLiquidLayerRigidShapeFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumLiquidLayerFields {
	return `spectrumLiquidLayer${layer}RigidShape` as keyof SpectrumLiquidLayerFields;
}

export function getSpectrumLiquidLayerPixelateFieldKey(
	layer: 1 | 2 | 3
): keyof SpectrumLiquidLayerFields {
	return `spectrumLiquidLayer${layer}Pixelate` as keyof SpectrumLiquidLayerFields;
}

/** True when at least one layer asks for its own pixelate pass. */
export function anyLiquidLayerPixelated(
	settings: Pick<SpectrumProfileSettings, keyof SpectrumLiquidLayerFields>
): boolean {
	return (
		settings.spectrumLiquidLayer1Pixelate ||
		settings.spectrumLiquidLayer2Pixelate ||
		settings.spectrumLiquidLayer3Pixelate
	);
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
