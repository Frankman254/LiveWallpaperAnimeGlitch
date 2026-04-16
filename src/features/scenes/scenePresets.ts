import type { WallpaperState } from '@/types/wallpaper';

export type ScenePreset = {
	id: string;
	name: string;
	description: string;
	/** Optional extras (particles, etc.). Does not touch image filters. */
	patch?: Partial<WallpaperState>;
};

export const SCENE_PRESETS: ScenePreset[] = [
	{
		id: 'scene-neon-core',
		name: 'Neon Core',
		description: 'Light motion with a clean background particle bed.',
		patch: { particlesEnabled: true, particleLayerMode: 'background' }
	},
	{
		id: 'scene-stadium-edge',
		name: 'Stadium Edge',
		description: 'Foreground motion emphasis without touching your spectrum.',
		patch: { particlesEnabled: true, particleLayerMode: 'foreground' }
	},
	{
		id: 'scene-dream-haze',
		name: 'Dream Haze',
		description: 'Gentle atmospheric motion that keeps spectrum manual.',
		patch: { particlesEnabled: true, particleLayerMode: 'background' }
	}
];

export function findScenePresetById(id: string | null | undefined): ScenePreset | null {
	if (!id) return null;
	return SCENE_PRESETS.find(scene => scene.id === id) ?? null;
}

export function buildScenePatch(scene: ScenePreset): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = { activeScenePresetId: scene.id };
	if (scene.patch) {
		Object.assign(patch, scene.patch);
	}
	return patch;
}
