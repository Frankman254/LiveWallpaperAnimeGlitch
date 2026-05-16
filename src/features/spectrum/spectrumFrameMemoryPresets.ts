import type { SpectrumProfileSettings } from '@/types/wallpaper';

export type SpectrumFrameMemoryPresetId = 'safe' | 'balanced' | 'heavy';
export type SpectrumFrameMemoryTarget = 'main' | 'clone';

type FrameMemoryFields = Pick<
	SpectrumProfileSettings,
	| 'spectrumAfterglow'
	| 'spectrumMotionTrails'
	| 'spectrumGhostFrames'
	| 'spectrumPeakRibbons'
	| 'spectrumPeakRibbonAngle'
	| 'spectrumEnergyBloom'
	| 'spectrumBassShockwave'
	| 'spectrumShockwaveThickness'
	| 'spectrumShockwaveOpacity'
	| 'spectrumShockwaveBlur'
>;

const MAIN_PRESETS: Record<SpectrumFrameMemoryPresetId, FrameMemoryFields> = {
	safe: {
		spectrumAfterglow: 0,
		spectrumMotionTrails: 0,
		spectrumGhostFrames: 0,
		spectrumPeakRibbons: 0,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0,
		spectrumBassShockwave: 0,
		spectrumShockwaveThickness: 1,
		spectrumShockwaveOpacity: 0.7,
		spectrumShockwaveBlur: 0.8
	},
	balanced: {
		spectrumAfterglow: 0.12,
		spectrumMotionTrails: 0.08,
		spectrumGhostFrames: 0.1,
		spectrumPeakRibbons: 0.15,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0.35,
		spectrumBassShockwave: 0.28,
		spectrumShockwaveThickness: 1,
		spectrumShockwaveOpacity: 0.72,
		spectrumShockwaveBlur: 0.85
	},
	heavy: {
		spectrumAfterglow: 0.22,
		spectrumMotionTrails: 0.18,
		spectrumGhostFrames: 0.4,
		spectrumPeakRibbons: 0.55,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0.85,
		spectrumBassShockwave: 0.7,
		spectrumShockwaveThickness: 1.35,
		spectrumShockwaveOpacity: 0.88,
		spectrumShockwaveBlur: 1.15
	}
};

/** Clone ring: same curve, slightly lower caps to avoid double blowout with main. */
const CLONE_SCALE: Record<SpectrumFrameMemoryPresetId, number> = {
	safe: 0,
	balanced: 0.82,
	heavy: 0.72
};

function scaleClonePreset(
	preset: FrameMemoryFields,
	scale: number
): FrameMemoryFields {
	if (scale <= 0) return { ...preset };
	return {
		spectrumAfterglow: preset.spectrumAfterglow * scale,
		spectrumMotionTrails: preset.spectrumMotionTrails * scale,
		spectrumGhostFrames: preset.spectrumGhostFrames * scale,
		spectrumPeakRibbons: preset.spectrumPeakRibbons * scale,
		spectrumPeakRibbonAngle: preset.spectrumPeakRibbonAngle,
		spectrumEnergyBloom: preset.spectrumEnergyBloom * scale,
		spectrumBassShockwave: preset.spectrumBassShockwave * scale,
		spectrumShockwaveThickness: preset.spectrumShockwaveThickness,
		spectrumShockwaveOpacity: preset.spectrumShockwaveOpacity,
		spectrumShockwaveBlur: preset.spectrumShockwaveBlur
	};
}

export function buildSpectrumFrameMemoryPresetPatch(
	preset: SpectrumFrameMemoryPresetId,
	target: SpectrumFrameMemoryTarget
): Partial<SpectrumProfileSettings> {
	const main = MAIN_PRESETS[preset];
	if (target === 'main') {
		return { ...main };
	}

	const scaled = scaleClonePreset(main, CLONE_SCALE[preset]);
	return {
		spectrumCloneAfterglow: scaled.spectrumAfterglow,
		spectrumCloneMotionTrails: scaled.spectrumMotionTrails,
		spectrumCloneGhostFrames: scaled.spectrumGhostFrames,
		spectrumClonePeakRibbons: scaled.spectrumPeakRibbons,
		spectrumClonePeakRibbonAngle: scaled.spectrumPeakRibbonAngle,
		spectrumCloneEnergyBloom: scaled.spectrumEnergyBloom,
		spectrumCloneBassShockwave: scaled.spectrumBassShockwave,
		spectrumCloneShockwaveThickness: scaled.spectrumShockwaveThickness,
		spectrumCloneShockwaveOpacity: scaled.spectrumShockwaveOpacity,
		spectrumCloneShockwaveBlur: scaled.spectrumShockwaveBlur
	};
}

export const SPECTRUM_FRAME_MEMORY_PRESET_IDS: SpectrumFrameMemoryPresetId[] = [
	'safe',
	'balanced',
	'heavy'
];
