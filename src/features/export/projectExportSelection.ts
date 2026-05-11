import { LEGACY_TAB_KEYS } from '@/components/controls/controlPanelResetKeys';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperState } from '@/types/wallpaper';

export type ProjectExportSectionId =
	| 'backgrounds'
	| 'spectrum'
	| 'logo'
	| 'overlays'
	| 'motion'
	| 'looks'
	| 'track'
	| 'lyrics'
	| 'audio'
	| 'editor';

export type ProjectExportSelection = Record<ProjectExportSectionId, boolean>;

export const PROJECT_EXPORT_SECTION_ORDER: ProjectExportSectionId[] = [
	'backgrounds',
	'spectrum',
	'logo',
	'overlays',
	'motion',
	'looks',
	'track',
	'lyrics',
	'audio',
	'editor'
];

export const PROJECT_EXPORT_SECTION_LABELS: Record<
	ProjectExportSectionId,
	string
> = {
	backgrounds: 'Images / Scene',
	spectrum: 'Spectrum',
	logo: 'Logo',
	overlays: 'Overlays',
	motion: 'Particles / Rain',
	looks: 'Looks / Filters',
	track: 'Track Info',
	lyrics: 'Lyrics',
	audio: 'Audio / Playlist',
	editor: 'HUD / Editor UI'
};

export const DEFAULT_PROJECT_EXPORT_SELECTION: ProjectExportSelection = {
	backgrounds: true,
	spectrum: true,
	logo: true,
	overlays: true,
	motion: true,
	looks: true,
	track: true,
	lyrics: true,
	audio: true,
	editor: true
};

const PROJECT_EXPORT_SECTION_KEYS: Record<
	ProjectExportSectionId,
	(keyof WallpaperState)[]
> = {
	backgrounds: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.presets ?? []),
			'backgroundImages',
			'imageIds',
			'imageUrls',
			'activeImageId',
			'slideshowResetPosition',
			'slideshowManualTimestampsEnabled',
			'backgroundProfileSlots',
			'sceneSlots',
			'activeSceneSlotId'
		])
	),
	spectrum: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.spectrum ?? []),
			'spectrumProfileSlots'
		])
	),
	logo: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.logo ?? []),
			'logoId',
			'logoUrl',
			'logoProfileSlots'
		])
	),
	overlays: ['overlays', 'selectedOverlayId'],
	motion: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.particles ?? []),
			...(LEGACY_TAB_KEYS.rain ?? []),
			'motionProfileSlots',
			'particlesProfileSlots',
			'rainProfileSlots'
		])
	),
	looks: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.filters ?? []),
			'looksProfileSlots'
		])
	),
	track: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.track ?? []),
			'trackTitleProfileSlots'
		])
	),
	lyrics: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.lyrics ?? []),
			'audioLyricsByTrackAssetId'
		])
	),
	audio: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.audio ?? []),
			'audioReactive',
			'audioSensitivity',
			'audioSourceMode',
			'audioFileAssetId',
			'audioFileName',
			'audioFileVolume',
			'audioFileLoop',
			'audioTracks',
			'activeAudioTrackId',
			'queuedAudioTrackId',
			'audioCrossfadeEnabled',
			'audioCrossfadeSeconds',
			'audioAutoAdvance',
			'audioMixMode',
			'audioTransitionStyle',
			'mediaSessionEnabled'
		])
	),
	editor: Array.from(
		new Set<keyof WallpaperState>([
			...(LEGACY_TAB_KEYS.editor ?? []),
			...(LEGACY_TAB_KEYS.diagnostics ?? []),
			...(LEGACY_TAB_KEYS.perf ?? [])
		])
	)
};

function cloneValue<T>(value: T): T {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value)) as T;
}

function resetKeySet(
	state: WallpaperState,
	keys: (keyof WallpaperState)[]
): WallpaperState {
	for (const key of keys) {
		(
			state as Record<keyof WallpaperState, WallpaperState[keyof WallpaperState]>
		)[key] = cloneValue(DEFAULT_STATE[key]);
	}
	return state;
}

export function getEnabledProjectExportSectionCount(
	selection: ProjectExportSelection
): number {
	return PROJECT_EXPORT_SECTION_ORDER.reduce(
		(count, sectionId) => count + (selection[sectionId] ? 1 : 0),
		0
	);
}

export function filterWallpaperStateForProjectExport(
	sourceState: WallpaperState,
	selection: ProjectExportSelection
): WallpaperState {
	const nextState = cloneValue(sourceState);

	for (const sectionId of PROJECT_EXPORT_SECTION_ORDER) {
		if (selection[sectionId]) continue;
		resetKeySet(nextState, PROJECT_EXPORT_SECTION_KEYS[sectionId]);
	}

	if (!selection.logo) {
		nextState.backgroundImages = nextState.backgroundImages.map(image => ({
			...image,
			logoProfileSlotIndex: null,
			logoOverride: null
		}));
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			logoSlotIndex: null
		}));
	}

	if (!selection.spectrum) {
		nextState.backgroundImages = nextState.backgroundImages.map(image => ({
			...image,
			spectrumProfileSlotIndex: null,
			spectrumOverride: null
		}));
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			spectrumSlotIndex: null
		}));
	}

	if (!selection.motion) {
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			particlesSlotIndex: null,
			rainSlotIndex: null
		}));
	}

	if (!selection.looks) {
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			looksSlotIndex: null
		}));
	}

	if (!selection.track) {
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			trackTitleSlotIndex: null
		}));
	}

	return nextState;
}
