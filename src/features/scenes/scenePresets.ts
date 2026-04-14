import { findPresetById } from '@/features/spectrum/presets/spectrumPresets';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { SPECTRUM_PROFILE_KEYS } from '@/lib/featureProfiles';
import type { SpectrumProfileSettings, WallpaperState } from '@/types/wallpaper';

function pickSpectrumFieldsFromPreset(
	settings: SpectrumProfileSettings
): Partial<SpectrumProfileSettings> {
	const picked: Partial<SpectrumProfileSettings> = {};
	for (const key of SPECTRUM_PROFILE_KEYS) {
		const k = key as keyof SpectrumProfileSettings;
		if (k in settings && settings[k] !== undefined) {
			(picked as Record<string, unknown>)[key] = settings[k];
		}
	}
	return picked;
}

export type ScenePreset = {
	id: string;
	name: string;
	description: string;
	spectrumPresetId: string;
	/** Optional extras (particles, etc.). Does not touch image filters. */
	patch?: Partial<WallpaperState>;
};

export const SCENE_PRESETS: ScenePreset[] = [
	{
		id: 'scene-neon-core',
		name: 'Neon Core',
		description: 'Radial companion spectrum + light motion.',
		spectrumPresetId: 'orbital-nova',
		patch: { particlesEnabled: true, particleLayerMode: 'background' }
	},
	{
		id: 'scene-stadium-edge',
		name: 'Stadium Edge',
		description: 'Dual edge spectrum + foreground motion.',
		spectrumPresetId: 'edge-duo',
		patch: { particlesEnabled: true, particleLayerMode: 'foreground' }
	},
	{
		id: 'scene-dream-haze',
		name: 'Dream Haze',
		description: 'Soft orbital spectrum + gentle motion.',
		spectrumPresetId: 'dream-static',
		patch: { particlesEnabled: true, particleLayerMode: 'background' }
	}
];

export function findScenePresetById(id: string | null | undefined): ScenePreset | null {
	if (!id) return null;
	return SCENE_PRESETS.find(scene => scene.id === id) ?? null;
}

export function buildScenePatch(scene: ScenePreset): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = {
		activeScenePresetId: scene.id
	};
	const spectrumPreset = findPresetById(scene.spectrumPresetId);
	if (spectrumPreset) {
		const picked = pickSpectrumFieldsFromPreset(spectrumPreset.settings);
		Object.assign(
			patch,
			hydrateSpectrumProfileValues(picked),
			{
				activeSpectrumPresetId: spectrumPreset.id
			}
		);
	}
	if (scene.patch) {
		Object.assign(patch, scene.patch);
	}
	return patch;
}
