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
			'activeSceneSlotId',
			'setlists',
			'activeSetlistId'
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

function cloneSelection(
	selection: ProjectExportSelection
): ProjectExportSelection {
	return PROJECT_EXPORT_SECTION_ORDER.reduce<ProjectExportSelection>(
		(nextSelection, sectionId) => {
			nextSelection[sectionId] = Boolean(selection[sectionId]);
			return nextSelection;
		},
		{ ...DEFAULT_PROJECT_EXPORT_SELECTION }
	);
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

export function normalizeProjectExportSelection(
	value: unknown
): ProjectExportSelection {
	if (!value || typeof value !== 'object') {
		return cloneSelection(DEFAULT_PROJECT_EXPORT_SELECTION);
	}

	const record = value as Partial<Record<ProjectExportSectionId, unknown>>;
	return PROJECT_EXPORT_SECTION_ORDER.reduce<ProjectExportSelection>(
		(selection, sectionId) => {
			selection[sectionId] =
				typeof record[sectionId] === 'boolean'
					? record[sectionId]
					: DEFAULT_PROJECT_EXPORT_SELECTION[sectionId];
			return selection;
		},
		{ ...DEFAULT_PROJECT_EXPORT_SELECTION }
	);
}

export function isFullProjectExportSelection(
	selection: ProjectExportSelection
): boolean {
	return PROJECT_EXPORT_SECTION_ORDER.every(sectionId => selection[sectionId]);
}

export function shouldImportProjectAssetKind(
	selection: ProjectExportSelection,
	kind:
		| 'background'
		| 'global-background'
		| 'logo'
		| 'overlay'
		| 'audio'
): boolean {
	switch (kind) {
		case 'background':
		case 'global-background':
			return selection.backgrounds;
		case 'logo':
			return selection.logo;
		case 'overlay':
			return selection.overlays;
		case 'audio':
			return selection.audio;
	}
}

export function mergeWallpaperStateForProjectImport(
	currentState: WallpaperState,
	importedState: WallpaperState,
	selection: ProjectExportSelection
): WallpaperState {
	// Shallow copy — `currentState` is sourced from the Zustand store at the
	// call site, which carries setter functions alongside data. `structuredClone`
	// rejects functions and crashes the whole import, so we copy references and
	// only clone the values that get overwritten below.
	const nextState = { ...currentState } as WallpaperState;

	for (const sectionId of PROJECT_EXPORT_SECTION_ORDER) {
		if (!selection[sectionId]) continue;
		for (const key of PROJECT_EXPORT_SECTION_KEYS[sectionId]) {
			// Old export files (made before recent fields like
			// `spectrumManualBindings`, `logoRotationSpeed`, etc were
			// added) lack these keys entirely, which makes `importedState[key]`
			// undefined. Overwriting `nextState[key]` with `undefined` would
			// then crash downstream renderers that assume the field exists.
			// Keep the existing baseline value when the import has nothing.
			const importedValue = importedState[key];
			if (importedValue === undefined) continue;
			(
				nextState as Record<
					keyof WallpaperState,
					WallpaperState[keyof WallpaperState]
				>
			)[key] = cloneValue(importedValue);
		}
	}

	return nextState;
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
