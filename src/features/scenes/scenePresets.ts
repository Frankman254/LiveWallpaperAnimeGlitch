import type { WallpaperState } from '@/types/wallpaper';

export type ScenePreset = {
	id: string;
	name: string;
	description: string;
	/** Optional extras (particles, etc.). Does not touch image filters. */
	patch?: Partial<WallpaperState>;
};

/** User-saved particle layer binding; appears as a selectable scene when set. */
export const CUSTOM_SCENE_ID = 'scene-custom' as const;

export type CustomSceneUserPatch = Pick<
	WallpaperState,
	'particlesEnabled' | 'particleLayerMode'
>;

export function extractCustomSceneUserPatch(
	state: WallpaperState
): CustomSceneUserPatch {
	return {
		particlesEnabled: state.particlesEnabled,
		particleLayerMode: state.particleLayerMode
	};
}

export type ScenePatchOptions = {
	customSceneUserPatch?: CustomSceneUserPatch | null;
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
	},
	{
		id: CUSTOM_SCENE_ID,
		name: 'Custom',
		description: 'Your saved particle layer settings (Save first).',
		patch: undefined
	}
];

export function findScenePresetById(id: string | null | undefined): ScenePreset | null {
	if (!id) return null;
	return SCENE_PRESETS.find(scene => scene.id === id) ?? null;
}

export function buildScenePatch(
	scene: ScenePreset,
	options?: ScenePatchOptions
): Partial<WallpaperState> {
	if (scene.id === CUSTOM_SCENE_ID) {
		const saved = options?.customSceneUserPatch;
		if (!saved) {
			return { activeScenePresetId: scene.id };
		}
		return {
			activeScenePresetId: scene.id,
			...saved
		};
	}
	const patch: Partial<WallpaperState> = { activeScenePresetId: scene.id };
	if (scene.patch) {
		Object.assign(patch, scene.patch);
	}
	return patch;
}
