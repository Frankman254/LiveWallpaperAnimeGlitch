import { SPECTRUM_RANGES, type SliderRange } from '@/config/ranges';
import { clamp, lerp } from '@/lib/math';
import type {
	ColorSourceMode,
	ResolvedAudioReactiveChannel,
	SpectrumFamily,
	SpectrumInstance,
	SpectrumMode,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';
import { getSpectrumFamilyDefinition } from './spectrumFamilyRegistry';
import { RADIAL_SHAPE_IDS } from './geometry/radialGeometry';
import {
	DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
	SHOCKWAVE_THRESHOLD_CHANNELS
} from './shockwaveCalibration';

export type SpectrumMacroName = 'energy' | 'softness' | 'chaos';

type SpectrumMacroContext = Pick<
	WallpaperState,
	| 'spectrumMode'
	| 'spectrumFamily'
	| 'spectrumShape'
	| 'spectrumOpacity'
	| 'spectrumMaxHeight'
	| 'spectrumGlowIntensity'
	| 'spectrumGlowReach'
	| 'spectrumGlowAudioAmount'
	| 'spectrumSmoothing'
	| 'spectrumShadowBlur'
	| 'spectrumAfterglow'
	| 'spectrumRotationSpeed'
	| 'spectrumMotionTrails'
	| 'spectrumPeakRibbons'
>;

function clampToRange(value: number, range: SliderRange): number {
	return clamp(value, range.min, range.max);
}

function snapToRange(value: number, range: SliderRange): number {
	const clamped = clampToRange(value, range);
	if (range.step <= 0) return clamped;
	const stepped =
		Math.round((clamped - range.min) / range.step) * range.step + range.min;
	return Number(stepped.toFixed(6));
}

function normalizeShockwaveBandThresholds(
	value:
		| SpectrumProfileSettings['spectrumShockwaveBandThresholds']
		| undefined
): Record<ResolvedAudioReactiveChannel, number> {
	const next = { ...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS };
	for (const channel of SHOCKWAVE_THRESHOLD_CHANNELS) {
		const candidate = value?.[channel];
		if (typeof candidate === 'number' && Number.isFinite(candidate)) {
			next[channel] = snapToRange(
				candidate,
				SPECTRUM_RANGES.shockwaveBandThreshold
			);
		}
	}
	return next;
}

// Macro ranges live on the family registry (`macroTuning`) — adding a new
// family means filling in those numbers there, not editing this file.
function getEnergyHeightRange(
	spectrumMode: SpectrumMode,
	spectrumFamily: SpectrumFamily
): readonly [number, number] {
	const tuning = getSpectrumFamilyDefinition(spectrumFamily).macroTuning;
	return spectrumMode === 'linear'
		? tuning.energyHeightLinear
		: tuning.energyHeightRadial;
}

function getEnergyGlowRange(
	spectrumFamily: SpectrumFamily
): readonly [number, number] {
	return getSpectrumFamilyDefinition(spectrumFamily).macroTuning.energyGlow;
}

function getChaosRotationMax(
	spectrumMode: SpectrumMode,
	spectrumFamily: SpectrumFamily
): number {
	const tuning = getSpectrumFamilyDefinition(spectrumFamily).macroTuning;
	return spectrumMode === 'linear'
		? tuning.chaosRotationLinear
		: tuning.chaosRotationRadial;
}

function inverseLerp(value: number, min: number, max: number): number {
	if (max <= min) return 0;
	return clamp((value - min) / (max - min), 0, 1);
}

function inferEnergy(
	opacity: number,
	maxHeight: number,
	glowIntensity: number,
	spectrumMode: SpectrumMode,
	spectrumFamily: SpectrumFamily
): number {
	const [heightMin, heightMax] = getEnergyHeightRange(
		spectrumMode,
		spectrumFamily
	);
	const [glowMin, glowMax] = getEnergyGlowRange(spectrumFamily);
	const heightT = inverseLerp(maxHeight, heightMin, heightMax);
	const opacityT = inverseLerp(opacity, 0.5, 1);
	const glowT = inverseLerp(glowIntensity, glowMin, glowMax);
	return clamp(heightT * 0.55 + opacityT * 0.25 + glowT * 0.2, 0, 1);
}

function inferSoftness(
	smoothing: number,
	shadowBlur: number,
	afterglow: number
): number {
	const smoothingT = inverseLerp(smoothing, 0.18, 0.94);
	const blurT = inverseLerp(shadowBlur, 0, 26);
	const afterglowT = inverseLerp(afterglow, 0, 0.28);
	return clamp(smoothingT * 0.6 + blurT * 0.25 + afterglowT * 0.15, 0, 1);
}

function inferChaos(
	rotation: number,
	motionTrails: number,
	peakRibbons: number,
	spectrumMode: SpectrumMode,
	spectrumFamily: SpectrumFamily
): number {
	const rotationT = inverseLerp(
		Math.abs(rotation),
		0,
		getChaosRotationMax(spectrumMode, spectrumFamily)
	);
	const trailT = inverseLerp(motionTrails, 0, 0.32);
	const ribbonT = inverseLerp(peakRibbons, 0, 0.42);
	return clamp(rotationT * 0.45 + trailT * 0.3 + ribbonT * 0.25, 0, 1);
}

function supportsFillControl(
	spectrumShape: WallpaperState['spectrumShape'],
	spectrumFamily: SpectrumFamily
): boolean {
	return (
		spectrumShape === 'wave' ||
		spectrumFamily === 'liquid' ||
		spectrumFamily === 'oscilloscope'
	);
}

export function inferSpectrumMacroValues(
	settings: SpectrumMacroContext
): Record<SpectrumMacroName, number> {
	return {
		energy: inferEnergy(
			settings.spectrumOpacity,
			settings.spectrumMaxHeight,
			settings.spectrumGlowIntensity,
			settings.spectrumMode,
			settings.spectrumFamily
		),
		softness: inferSoftness(
			settings.spectrumSmoothing,
			settings.spectrumShadowBlur,
			settings.spectrumAfterglow
		),
		chaos: inferChaos(
			settings.spectrumRotationSpeed,
			settings.spectrumMotionTrails,
			settings.spectrumPeakRibbons,
			settings.spectrumMode,
			settings.spectrumFamily
		)
	};
}

export function buildSpectrumMacroPatch(
	settings: SpectrumMacroContext,
	macro: SpectrumMacroName,
	value: number
): Partial<SpectrumProfileSettings> {
	const v = clamp(value, 0, 1);
	const [energyHeightMin, energyHeightMax] = getEnergyHeightRange(
		settings.spectrumMode,
		settings.spectrumFamily
	);
	const [energyGlowMin, energyGlowMax] = getEnergyGlowRange(
		settings.spectrumFamily
	);
	const chaosRotationMax = getChaosRotationMax(
		settings.spectrumMode,
		settings.spectrumFamily
	);

	if (macro === 'energy') {
		return normalizeSpectrumSettings({
			spectrumOpacity: lerp(0.5, 1, v),
			spectrumGlowIntensity: lerp(energyGlowMin, energyGlowMax, v),
			spectrumMaxHeight: lerp(energyHeightMin, energyHeightMax, v),
			spectrumMinHeight: lerp(1, 4.5, v)
		});
	}

	if (macro === 'softness') {
		return normalizeSpectrumSettings({
			spectrumSmoothing: lerp(0.18, 0.94, v),
			spectrumShadowBlur: lerp(0, 26, v),
			spectrumPeakDecay: lerp(0.016, 0.002, v),
			spectrumAfterglow: lerp(
				0,
				getSpectrumFamilyDefinition(settings.spectrumFamily).macroTuning
					.afterglowMax,
				v
			),
			...(supportsFillControl(
				settings.spectrumShape,
				settings.spectrumFamily
			)
				? {
						spectrumWaveFillOpacity: lerp(0.05, 0.32, v)
					}
				: {})
		});
	}

	const sign = settings.spectrumRotationSpeed >= 0 ? 1 : -1;
	return normalizeSpectrumSettings({
		spectrumRotationSpeed: sign * lerp(0, chaosRotationMax, v),
		spectrumMotionTrails: lerp(
			0,
			getSpectrumFamilyDefinition(settings.spectrumFamily).macroTuning
				.motionTrailsMax,
			v
		),
		spectrumPeakRibbons: lerp(0, 0.42, v),
		spectrumGhostFrames: lerp(0, 0.18, v * 0.9)
	});
}

export function generateRandomSpectrumProfile(
	colorSource: ColorSourceMode
): Partial<SpectrumProfileSettings> {
	const mode = randomChoice(['radial', 'linear'] as const);
	const primaryColor = `hsl(${randomInt(0, 360)}, ${randomInt(60, 100)}%, ${randomInt(40, 60)}%)`;
	const secondaryColor = `hsl(${randomInt(0, 360)}, ${randomInt(60, 100)}%, ${randomInt(40, 60)}%)`;

	let positionX = 0;
	let positionY = 0;
	let orientation: SpectrumProfileSettings['spectrumLinearOrientation'] =
		'horizontal';
	let direction: SpectrumProfileSettings['spectrumLinearDirection'] =
		'normal';

	if (mode === 'linear') {
		const edge = randomChoice(['top', 'bottom', 'left', 'right'] as const);
		if (edge === 'top') {
			positionY = 0.72;
			orientation = 'horizontal';
			direction = 'flipped';
		} else if (edge === 'bottom') {
			positionY = -0.72;
			orientation = 'horizontal';
			direction = 'normal';
		} else if (edge === 'left') {
			positionX = -0.72;
			orientation = 'vertical';
			direction = 'normal';
		} else {
			positionX = 0.72;
			orientation = 'vertical';
			direction = 'flipped';
		}
	} else {
		positionX = randomFloat(-0.16, 0.16);
		positionY = randomFloat(-0.16, 0.16);
	}
	const rotationSpeed = randomFloat(-1.5, 1.5);

	// Pair bar count with a width that reads at that density — high counts get
	// thin bars, low counts get chunky ones. Avoids the dense 256@8px mush.
	const barCount = randomChoice([48, 64, 96, 128] as const);
	const barWidth =
		barCount >= 128
			? randomFloat(2, 4)
			: barCount >= 96
				? randomFloat(3, 6)
				: randomFloat(4, 9);

	// Always give a wide dynamic range: a small floor and a tall ceiling so the
	// bars visibly move with the audio. Keeping min tiny and max large prevents
	// the "inert / no height" rolls the old 1–10 vs 60–180 window produced.
	const minHeight = randomFloat(1, 5);
	const maxHeight = randomFloat(170, 340);

	const shapeOptions = ['bars', 'blocks', 'dots', 'capsules'] as const;

	return normalizeSpectrumSettings({
		spectrumEnabled: true,
		spectrumMode: mode,
		// Force the classic family: it's the one the rest of these fields
		// (bars / heights / radial shape) actually drive. Leaving the previous
		// family in place is what produced inert results when it was tunnel,
		// liquid, spiral, etc. (whose own params were never randomized here).
		spectrumFamily: 'classic',
		spectrumShape: randomChoice(shapeOptions),
		spectrumColorSource: colorSource,
		spectrumColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const),
		spectrumPrimaryColor: primaryColor,
		spectrumSecondaryColor: secondaryColor,
		spectrumBarCount: barCount,
		spectrumBarWidth: barWidth,
		spectrumMinHeight: minHeight,
		spectrumMaxHeight: maxHeight,
		// Responsive smoothing — the old 0.4–0.9 ceiling made bars sluggish to
		// the point of looking frozen on punchy tracks.
		spectrumSmoothing: randomFloat(0.12, 0.5),
		spectrumOpacity: randomFloat(0.65, 1),
		spectrumGlowIntensity: randomFloat(0.15, 1.4),
		spectrumGlowReach: 1,
		spectrumShadowBlur: randomInt(0, 28),
		// Reactivity envelope — guarantees the random spectrum actually moves
		// with the music regardless of the previous (possibly inert) settings.
		spectrumBandMode: 'auto',
		spectrumAudioSmoothing: randomFloat(0.08, 0.28),
		spectrumGainExpressiveness: randomFloat(0.7, 1.6),
		spectrumEnvelopeAttack: randomFloat(0.3, 0.7),
		spectrumEnvelopeRelease: randomFloat(0.08, 0.22),
		spectrumEnvelopeReactivitySpeed: randomFloat(1.3, 2.2),
		spectrumEnvelopePeakWindow: randomFloat(1.2, 2.2),
		spectrumEnvelopePeakFloor: randomFloat(0.04, 0.1),
		spectrumEnvelopePunch: randomFloat(0, 0.32),
		spectrumRotationSpeed: Math.abs(rotationSpeed),
		spectrumRotationDirection: rotationSpeed < 0 ? 'ccw' : 'cw',
		spectrumMirror: Math.random() > 0.5,
		spectrumPeakHold: Math.random() > 0.4,
		spectrumPeakDecay: randomFloat(0.005, 0.015),
		// Keep the radial ring compact enough that bars dominate the silhouette
		// — a huge inner radius with short bars looked like a flat inert ring.
		spectrumInnerRadius: randomFloat(40, 150),
		// Pull from the live shape registry so new entries (flowers, gears,
		// crescents, etc.) participate in randomization automatically. No
		// curated whitelist — every registered shape is fair game.
		spectrumRadialShape: randomChoice(RADIAL_SHAPE_IDS),
		spectrumRadialAngle: randomFloat(-180, 180),
		spectrumFollowLogo: mode === 'radial',
		spectrumRadialFitLogo: Math.random() > 0.5,
		spectrumLogoGap: randomInt(0, 32),
		spectrumLinearOrientation: orientation,
		spectrumLinearDirection: direction,
		spectrumPositionX: positionX,
		spectrumPositionY: positionY,
		spectrumSpan: randomFloat(0.78, 0.94)
	});
}

/** Random main profile + a matching random patch for the extra instance
 *  ("Spectrum 2"), sharing the same palette. The caller applies the patch to
 *  its instance immutably (this module never sees the instances array). */
export function generateRandomSpectrumSetup(colorSource: ColorSourceMode): {
	profile: Partial<SpectrumProfileSettings>;
	instancePatch: Partial<SpectrumInstance>;
} {
	const profile = generateRandomSpectrumProfile(colorSource);
	const heightScale = randomFloat(0.6, 1.5);
	const instancePatch = normalizeSpectrumSettings({
		enabled: Math.random() > 0.3,
		spectrumShape: randomChoice([
			'bars',
			'blocks',
			'dots',
			'capsules'
		] as const) as SpectrumProfileSettings['spectrumShape'],
		spectrumRadialShape: randomChoice(RADIAL_SHAPE_IDS),
		spectrumOpacity: randomFloat(0.4, 1),
		spectrumMinHeight: Math.max(1, 2 * Math.max(0.5, heightScale)),
		spectrumMaxHeight: Math.max(12, 96 * heightScale),
		spectrumColorSource: colorSource,
		spectrumColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const) as SpectrumProfileSettings['spectrumColorMode'],
		spectrumPrimaryColor: profile.spectrumPrimaryColor,
		spectrumSecondaryColor: profile.spectrumSecondaryColor
	});
	return { profile, instancePatch };
}

export function normalizeSpectrumSettings<
	T extends Partial<SpectrumProfileSettings>
>(values: T): T {
	const next = { ...values };
	if (next.spectrumShockwaveBandThresholds) {
		next.spectrumShockwaveBandThresholds = normalizeShockwaveBandThresholds(
			next.spectrumShockwaveBandThresholds
		) as T['spectrumShockwaveBandThresholds'];
	}

	const normalize = <K extends keyof SpectrumProfileSettings>(
		key: K,
		range: SliderRange,
		options?: {
			snap?: boolean;
		}
	) => {
		const current = next[key];
		if (typeof current !== 'number') return;
		next[key] = (
			options?.snap === false
				? clampToRange(current, range)
				: snapToRange(current, range)
		) as T[K];
	};

	normalize('spectrumBarCount', SPECTRUM_RANGES.barCount);
	normalize('spectrumBarWidth', SPECTRUM_RANGES.barWidth, { snap: false });
	normalize('spectrumMinHeight', SPECTRUM_RANGES.minHeight, { snap: false });
	normalize('spectrumMaxHeight', SPECTRUM_RANGES.maxHeight, { snap: false });
	normalize('spectrumWaveFillOpacity', SPECTRUM_RANGES.waveFillOpacity, {
		snap: false
	});
	normalize('spectrumInnerRadius', SPECTRUM_RANGES.innerRadius, {
		snap: false
	});
	normalize('spectrumRadialAngle', SPECTRUM_RANGES.radialAngle, {
		snap: false
	});
	normalize('spectrumRotationSpeed', SPECTRUM_RANGES.rotationSpeed, {
		snap: false
	});
	if (typeof next.spectrumRotationSpeed === 'number') {
		next.spectrumRotationSpeed = Math.abs(
			next.spectrumRotationSpeed
		) as T['spectrumRotationSpeed'];
	}
	if (typeof next.spectrumRotationAudioAmount === 'number') {
		next.spectrumRotationAudioAmount = clamp(
			next.spectrumRotationAudioAmount,
			0,
			4
		) as T['spectrumRotationAudioAmount'];
	}
	if (typeof next.spectrumRotationSmoothing === 'number') {
		next.spectrumRotationSmoothing = clamp(
			next.spectrumRotationSmoothing,
			0,
			0.98
		) as T['spectrumRotationSmoothing'];
	}
	if (typeof next.spectrumRotationInvertThreshold === 'number') {
		next.spectrumRotationInvertThreshold = clamp(
			next.spectrumRotationInvertThreshold,
			SPECTRUM_RANGES.rotationInvertThreshold.min,
			SPECTRUM_RANGES.rotationInvertThreshold.max
		) as T['spectrumRotationInvertThreshold'];
	}
	normalize('spectrumFigureRotationSpeed', SPECTRUM_RANGES.rotationSpeed, {
		snap: false
	});
	normalize('spectrumSmoothing', SPECTRUM_RANGES.smoothing, { snap: false });
	normalize('spectrumOpacity', SPECTRUM_RANGES.opacity, { snap: false });
	normalize('spectrumGlowIntensity', SPECTRUM_RANGES.glowIntensity, {
		snap: false
	});
	normalize('spectrumGlowReach', SPECTRUM_RANGES.glowReach, {
		snap: false
	});
	normalize('spectrumGlowAudioAmount', SPECTRUM_RANGES.glowAudioAmount, {
		snap: false
	});
	normalize('spectrumShadowBlur', SPECTRUM_RANGES.shadowBlur, {
		snap: false
	});
	normalize('spectrumPeakDecay', SPECTRUM_RANGES.peakDecay, { snap: false });
	normalize('spectrumPositionX', SPECTRUM_RANGES.positionX, {
		snap: false
	});
	normalize('spectrumPositionY', SPECTRUM_RANGES.positionY, {
		snap: false
	});
	normalize('spectrumLogoGap', SPECTRUM_RANGES.logoGap, { snap: false });
	normalize('spectrumSpan', SPECTRUM_RANGES.span, { snap: false });
	normalize('spectrumAfterglow', SPECTRUM_RANGES.afterglow, { snap: false });
	normalize('spectrumMotionTrails', SPECTRUM_RANGES.motionTrails, {
		snap: false
	});
	normalize('spectrumGhostFrames', SPECTRUM_RANGES.ghostFrames, {
		snap: false
	});
	normalize('spectrumPeakRibbons', SPECTRUM_RANGES.peakRibbons, {
		snap: false
	});
	normalize('spectrumBassShockwave', SPECTRUM_RANGES.bassShockwave, {
		snap: false
	});
	normalize(
		'spectrumShockwaveThickness',
		SPECTRUM_RANGES.shockwaveThickness,
		{
			snap: false
		}
	);
	normalize('spectrumShockwaveOpacity', SPECTRUM_RANGES.shockwaveOpacity, {
		snap: false
	});
	normalize('spectrumShockwaveBlur', SPECTRUM_RANGES.shockwaveBlur, {
		snap: false
	});
	normalize('spectrumEnergyBloom', SPECTRUM_RANGES.energyBloom, {
		snap: false
	});
	normalize('spectrumPeakRibbonAngle', SPECTRUM_RANGES.peakRibbonAngle, {
		snap: false
	});
	normalize('spectrumTunnelRingCount', SPECTRUM_RANGES.tunnelRingCount);
	normalize('spectrumTunnelDepthFalloff', SPECTRUM_RANGES.tunnelDepthFalloff);
	normalize('spectrumTunnelRingSpacing', SPECTRUM_RANGES.tunnelRingSpacing);
	normalize('spectrumTunnelWallOpacity', SPECTRUM_RANGES.tunnelWallOpacity);
	normalize(
		'spectrumTunnelPulseStrength',
		SPECTRUM_RANGES.tunnelPulseStrength
	);
	normalize(
		'spectrumLiquidLayer1Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize(
		'spectrumLiquidLayer2Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize(
		'spectrumLiquidLayer3Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize('spectrumLiquidLayer1Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumLiquidLayer2Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumLiquidLayer3Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumLiquidLayer1Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize('spectrumLiquidLayer2Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize('spectrumLiquidLayer3Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize('spectrumLiquidLayer1Speed', SPECTRUM_RANGES.liquidLayerSpeed);
	normalize('spectrumLiquidLayer2Speed', SPECTRUM_RANGES.liquidLayerSpeed);
	normalize('spectrumLiquidLayer3Speed', SPECTRUM_RANGES.liquidLayerSpeed);
	normalize(
		'spectrumLiquidLayer1RotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumLiquidLayer2RotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumLiquidLayer3RotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize('spectrumSpiralTurns', SPECTRUM_RANGES.spiralTurns);
	normalize('spectrumSpiralOuterRadius', SPECTRUM_RANGES.spiralOuterRadius, {
		snap: false
	});
	normalize('spectrumSpiralTightness', SPECTRUM_RANGES.spiralTightness, {
		snap: false
	});
	normalize('spectrumSpiralArms', SPECTRUM_RANGES.spiralArms);
	normalize('spectrumSpiralAudioTurns', SPECTRUM_RANGES.spiralAudioTurns, {
		snap: false
	});
	normalize('spectrumSpiralStrokeWidth', SPECTRUM_RANGES.spiralStrokeWidth, {
		snap: false
	});
	normalize('spectrumOscilloscopeLineWidth', SPECTRUM_RANGES.barWidth, {
		snap: false
	});
	normalize(
		'spectrumOscilloscopeScrollSpeed',
		SPECTRUM_RANGES.oscilloscopeScrollSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumOscilloscopePhosphorDecay',
		SPECTRUM_RANGES.oscilloscopePhosphorDecay,
		{
			snap: false
		}
	);
	normalize(
		'spectrumOscilloscopeGridDivisions',
		SPECTRUM_RANGES.oscilloscopeGridDivisions
	);

	if (
		typeof next.spectrumMinHeight === 'number' &&
		typeof next.spectrumMaxHeight === 'number' &&
		next.spectrumMaxHeight < next.spectrumMinHeight
	) {
		next.spectrumMaxHeight =
			next.spectrumMinHeight as T['spectrumMaxHeight'];
	}

	// Extra instances share the main key names, so each one re-enters this
	// same normalizer (instances carry no nested spectrumInstances).
	if (Array.isArray(next.spectrumInstances)) {
		next.spectrumInstances = next.spectrumInstances.map(instance =>
			normalizeSpectrumSettings(instance)
		) as T['spectrumInstances'];
	}

	return next;
}

function randomChoice<T>(options: readonly T[]): T {
	return options[Math.floor(Math.random() * options.length)];
}

function randomFloat(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
	return Math.floor(randomFloat(min, max + 1));
}
