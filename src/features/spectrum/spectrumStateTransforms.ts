import { SPECTRUM_RANGES, type SliderRange } from '@/config/ranges';
import { clamp, lerp } from '@/lib/math';
import type {
	ColorSourceMode,
	SpectrumFamily,
	SpectrumMode,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';
import { getSpectrumFamilyDefinition } from './spectrumFamilyRegistry';

export type SpectrumMacroName = 'energy' | 'softness' | 'chaos';

type SpectrumMacroContext = Pick<
	WallpaperState,
	| 'spectrumMode'
	| 'spectrumFamily'
	| 'spectrumShape'
	| 'spectrumOpacity'
	| 'spectrumMaxHeight'
	| 'spectrumGlowIntensity'
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
	const circularCloneEnabled = Math.random() > 0.3;

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

	return normalizeSpectrumSettings({
		spectrumEnabled: true,
		spectrumMode: mode,
		spectrumShape: randomChoice([
			'bars',
			'blocks',
			'wave',
			'dots'
		] as const),
		spectrumColorSource: colorSource,
		spectrumColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const),
		spectrumPrimaryColor: primaryColor,
		spectrumSecondaryColor: secondaryColor,
		spectrumBarCount: randomChoice([32, 64, 128, 256]),
		spectrumBarWidth: randomFloat(2, 8),
		spectrumMinHeight: randomFloat(1, 10),
		spectrumMaxHeight: randomFloat(60, 180),
		spectrumSmoothing: randomFloat(0.4, 0.9),
		spectrumOpacity: randomFloat(0.4, 0.95),
		spectrumGlowIntensity: randomFloat(0, 1.5),
		spectrumShadowBlur: randomInt(0, 40),
		spectrumRotationSpeed: randomFloat(-1.5, 1.5),
		spectrumMirror: Math.random() > 0.5,
		spectrumPeakHold: Math.random() > 0.4,
		spectrumPeakDecay: randomFloat(0.005, 0.015),
		spectrumInnerRadius: randomFloat(40, 240),
		spectrumRadialShape: randomChoice([
			'circle',
			'square',
			'triangle',
			'star',
			'hexagon'
		] as const),
		spectrumRadialAngle: randomFloat(-180, 180),
		spectrumFollowLogo: mode === 'radial',
		spectrumRadialFitLogo: Math.random() > 0.5,
		spectrumLogoGap: randomInt(0, 32),
		spectrumLinearOrientation: orientation,
		spectrumLinearDirection: direction,
		spectrumPositionX: positionX,
		spectrumPositionY: positionY,
		spectrumSpan: randomFloat(0.78, 0.94),
		spectrumCircularClone: circularCloneEnabled,
		spectrumCloneStyle: randomChoice([
			'bars',
			'blocks',
			'wave',
			'dots'
		] as const),
		spectrumCloneRadialShape: randomChoice([
			'circle',
			'square',
			'triangle',
			'star',
			'hexagon'
		] as const),
		spectrumCloneScale: randomFloat(0.6, 1.5),
		spectrumCloneOpacity: randomFloat(0.4, 1),
		spectrumCloneColorSource: colorSource,
		spectrumCloneColorMode: randomChoice([
			'solid',
			'gradient',
			'rainbow',
			'visible-rotate'
		] as const),
		spectrumClonePrimaryColor: primaryColor,
		spectrumCloneSecondaryColor: secondaryColor
	});
}

export function normalizeSpectrumSettings<
	T extends Partial<SpectrumProfileSettings>
>(values: T): T {
	const next = { ...values };

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
	normalize('spectrumFigureRotationSpeed', SPECTRUM_RANGES.rotationSpeed, {
		snap: false
	});
	normalize('spectrumSmoothing', SPECTRUM_RANGES.smoothing, { snap: false });
	normalize('spectrumOpacity', SPECTRUM_RANGES.opacity, { snap: false });
	normalize('spectrumGlowIntensity', SPECTRUM_RANGES.glowIntensity, {
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
	normalize('spectrumCloneOpacity', SPECTRUM_RANGES.cloneOpacity, {
		snap: false
	});
	normalize('spectrumCloneScale', SPECTRUM_RANGES.cloneScale, {
		snap: false
	});
	normalize('spectrumCloneGap', SPECTRUM_RANGES.cloneGap, { snap: false });
	normalize('spectrumClonePositionX', SPECTRUM_RANGES.positionX, {
		snap: false
	});
	normalize('spectrumClonePositionY', SPECTRUM_RANGES.positionY, {
		snap: false
	});
	normalize('spectrumCloneRadialAngle', SPECTRUM_RANGES.cloneRadialAngle, {
		snap: false
	});
	normalize('spectrumCloneBarCount', SPECTRUM_RANGES.cloneBarCount);
	normalize('spectrumCloneBarWidth', SPECTRUM_RANGES.cloneBarWidth, {
		snap: false
	});
	normalize('spectrumCloneMinHeight', SPECTRUM_RANGES.minHeight, {
		snap: false
	});
	normalize('spectrumCloneMaxHeight', SPECTRUM_RANGES.maxHeight, {
		snap: false
	});
	normalize('spectrumCloneSmoothing', SPECTRUM_RANGES.smoothing, {
		snap: false
	});
	normalize('spectrumCloneGlowIntensity', SPECTRUM_RANGES.glowIntensity, {
		snap: false
	});
	normalize('spectrumCloneShadowBlur', SPECTRUM_RANGES.shadowBlur, {
		snap: false
	});
	normalize('spectrumCloneRotationSpeed', SPECTRUM_RANGES.rotationSpeed, {
		snap: false
	});
	normalize(
		'spectrumCloneFigureRotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize('spectrumClonePeakDecay', SPECTRUM_RANGES.peakDecay, {
		snap: false
	});
	normalize(
		'spectrumCloneWaveFillOpacity',
		SPECTRUM_RANGES.cloneWaveFillOpacity,
		{ snap: false }
	);
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
	normalize('spectrumClonePeakRibbons', SPECTRUM_RANGES.peakRibbons, {
		snap: false
	});
	normalize('spectrumCloneAfterglow', SPECTRUM_RANGES.afterglow, {
		snap: false
	});
	normalize('spectrumCloneMotionTrails', SPECTRUM_RANGES.motionTrails, {
		snap: false
	});
	normalize('spectrumCloneGhostFrames', SPECTRUM_RANGES.ghostFrames, {
		snap: false
	});
	normalize('spectrumCloneEnergyBloom', SPECTRUM_RANGES.energyBloom, {
		snap: false
	});
	normalize('spectrumCloneBassShockwave', SPECTRUM_RANGES.bassShockwave, {
		snap: false
	});
	normalize(
		'spectrumCloneShockwaveThickness',
		SPECTRUM_RANGES.shockwaveThickness,
		{ snap: false }
	);
	normalize(
		'spectrumCloneShockwaveOpacity',
		SPECTRUM_RANGES.shockwaveOpacity,
		{ snap: false }
	);
	normalize('spectrumCloneShockwaveBlur', SPECTRUM_RANGES.shockwaveBlur, {
		snap: false
	});
	normalize('spectrumClonePeakRibbonAngle', SPECTRUM_RANGES.peakRibbonAngle, {
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
	normalize('spectrumCloneTunnelRingCount', SPECTRUM_RANGES.tunnelRingCount);
	normalize(
		'spectrumCloneTunnelDepthFalloff',
		SPECTRUM_RANGES.tunnelDepthFalloff
	);
	normalize(
		'spectrumCloneTunnelRingSpacing',
		SPECTRUM_RANGES.tunnelRingSpacing
	);
	normalize(
		'spectrumCloneTunnelWallOpacity',
		SPECTRUM_RANGES.tunnelWallOpacity
	);
	normalize(
		'spectrumCloneTunnelPulseStrength',
		SPECTRUM_RANGES.tunnelPulseStrength
	);
	normalize(
		'spectrumCloneLiquidLayer1Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize(
		'spectrumCloneLiquidLayer2Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize(
		'spectrumCloneLiquidLayer3Opacity',
		SPECTRUM_RANGES.liquidLayerOpacity
	);
	normalize('spectrumCloneLiquidLayer1Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumCloneLiquidLayer2Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumCloneLiquidLayer3Amp', SPECTRUM_RANGES.liquidLayerAmp);
	normalize('spectrumCloneLiquidLayer1Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize('spectrumCloneLiquidLayer2Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize('spectrumCloneLiquidLayer3Fill', SPECTRUM_RANGES.liquidLayerFill);
	normalize(
		'spectrumCloneLiquidLayer1Speed',
		SPECTRUM_RANGES.liquidLayerSpeed
	);
	normalize(
		'spectrumCloneLiquidLayer2Speed',
		SPECTRUM_RANGES.liquidLayerSpeed
	);
	normalize(
		'spectrumCloneLiquidLayer3Speed',
		SPECTRUM_RANGES.liquidLayerSpeed
	);
	normalize(
		'spectrumCloneLiquidLayer1RotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumCloneLiquidLayer2RotationSpeed',
		SPECTRUM_RANGES.rotationSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumCloneLiquidLayer3RotationSpeed',
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
	normalize('spectrumCloneSpiralTurns', SPECTRUM_RANGES.spiralTurns);
	normalize(
		'spectrumCloneSpiralOuterRadius',
		SPECTRUM_RANGES.spiralOuterRadius,
		{
			snap: false
		}
	);
	normalize('spectrumCloneSpiralTightness', SPECTRUM_RANGES.spiralTightness, {
		snap: false
	});
	normalize('spectrumCloneSpiralArms', SPECTRUM_RANGES.spiralArms);
	normalize(
		'spectrumCloneSpiralAudioTurns',
		SPECTRUM_RANGES.spiralAudioTurns,
		{
			snap: false
		}
	);
	normalize(
		'spectrumCloneSpiralStrokeWidth',
		SPECTRUM_RANGES.spiralStrokeWidth,
		{
			snap: false
		}
	);
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
	normalize('spectrumCloneOscilloscopeLineWidth', SPECTRUM_RANGES.barWidth, {
		snap: false
	});
	normalize(
		'spectrumCloneOscilloscopeScrollSpeed',
		SPECTRUM_RANGES.oscilloscopeScrollSpeed,
		{
			snap: false
		}
	);
	normalize(
		'spectrumCloneOscilloscopePhosphorDecay',
		SPECTRUM_RANGES.oscilloscopePhosphorDecay,
		{
			snap: false
		}
	);
	normalize(
		'spectrumCloneOscilloscopeGridDivisions',
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

	if (
		typeof next.spectrumCloneMinHeight === 'number' &&
		typeof next.spectrumCloneMaxHeight === 'number' &&
		next.spectrumCloneMaxHeight < next.spectrumCloneMinHeight
	) {
		next.spectrumCloneMaxHeight =
			next.spectrumCloneMinHeight as T['spectrumCloneMaxHeight'];
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
