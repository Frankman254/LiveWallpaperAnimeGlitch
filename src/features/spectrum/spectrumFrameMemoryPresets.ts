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
>;

const MAIN_PRESETS: Record<SpectrumFrameMemoryPresetId, FrameMemoryFields> = {
	safe: {
		spectrumAfterglow: 0,
		spectrumMotionTrails: 0,
		spectrumGhostFrames: 0,
		spectrumPeakRibbons: 0,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0
	},
	balanced: {
		spectrumAfterglow: 0.12,
		spectrumMotionTrails: 0.08,
		spectrumGhostFrames: 0.1,
		spectrumPeakRibbons: 0.15,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0.35
	},
	heavy: {
		spectrumAfterglow: 0.22,
		spectrumMotionTrails: 0.18,
		spectrumGhostFrames: 0.4,
		spectrumPeakRibbons: 0.55,
		spectrumPeakRibbonAngle: 0,
		spectrumEnergyBloom: 0.85
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
		spectrumEnergyBloom: preset.spectrumEnergyBloom * scale
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
		spectrumCloneEnergyBloom: scaled.spectrumEnergyBloom
	};
}

export const SPECTRUM_FRAME_MEMORY_PRESET_IDS: SpectrumFrameMemoryPresetId[] = [
	'safe',
	'balanced',
	'heavy'
];
