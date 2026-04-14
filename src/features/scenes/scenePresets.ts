import { findFilterLookById } from '@/features/filterLooks/filterLooks';
import { findPresetById } from '@/features/spectrum/presets/spectrumPresets';
import type { WallpaperState } from '@/types/wallpaper';

export type ScenePreset = {
	id: string;
	name: string;
	description: string;
	spectrumPresetId: string;
	filterLookId: string;
	patch?: Partial<WallpaperState>;
};

export const SCENE_PRESETS: ScenePreset[] = [
	{
		id: 'scene-neon-core',
		name: 'Neon Core',
		description: 'Radial companion + cyber glow filter look.',
		spectrumPresetId: 'orbital-nova',
		filterLookId: 'cyber-neon',
		patch: { particlesEnabled: true, particleLayerMode: 'background' }
	},
	{
		id: 'scene-stadium-edge',
		name: 'Stadium Edge',
		description: 'Dual edge spectrum with aggressive contrast.',
		spectrumPresetId: 'edge-duo',
		filterLookId: 'infrared-pulse',
		patch: { particlesEnabled: true, particleLayerMode: 'foreground' }
	},
	{
		id: 'scene-dream-haze',
		name: 'Dream Haze',
		description: 'Soft orbital energy with chroma ambience.',
		spectrumPresetId: 'dream-static',
		filterLookId: 'dream-bloom',
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
		Object.assign(patch, spectrumPreset.settings, {
			activeSpectrumPresetId: spectrumPreset.id
		});
	}
	const look = findFilterLookById(scene.filterLookId);
	if (look) {
		Object.assign(patch, look.settings, { activeFilterLookId: look.id });
	}
	if (scene.patch) {
		Object.assign(patch, scene.patch);
	}
	return patch;
}
