import { LEGACY_TAB_KEYS } from '@/components/controls/controlPanelResetKeys';
import { MAX_SPECTRUM_SLOT_COUNT } from '@/lib/featureProfiles';
import { DEFAULT_STATE } from '@/lib/constants';
import type {
	ProfileSlot,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';

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

function mergeSpectrumProfileSlots(
	currentSlots: ProfileSlot<SpectrumProfileSettings>[],
	importedValue: unknown
): ProfileSlot<SpectrumProfileSettings>[] {
	if (!Array.isArray(importedValue)) return currentSlots;

	// Position-preserving restore. The previous implementation APPENDED imported
	// slots after the default empties, so a restored project's spectrum slots
	// landed at indices 8+ and looked "missing" in the first slots the user
	// checked. Here each imported slot wins at its ORIGINAL index; positions
	// where the import has no values keep the current slot. Never shrinks below
	// the current count, never exceeds the max.
	const length = Math.min(
		MAX_SPECTRUM_SLOT_COUNT,
		Math.max(currentSlots.length, importedValue.length)
	);
	const nextSlots: ProfileSlot<SpectrumProfileSettings>[] = [];
	for (let index = 0; index < length; index += 1) {
		const current = currentSlots[index];
		const imported = importedValue[index] as
			| { name?: unknown; values?: unknown }
			| undefined;
		const importedValues =
			imported && typeof imported === 'object' ? imported.values : null;
		if (importedValues) {
			const importedName =
				imported &&
				typeof imported.name === 'string' &&
				imported.name.trim()
					? imported.name
					: (current?.name ?? `Spectrum ${index + 1}`);
			nextSlots.push({
				name: importedName,
				values: cloneValue(importedValues as SpectrumProfileSettings)
			});
		} else if (current) {
			nextSlots.push(cloneValue(current));
		} else {
			nextSlots.push({ name: `Spectrum ${index + 1}`, values: null });
		}
	}

	return nextSlots;
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
			if (sectionId === 'spectrum' && key === 'spectrumProfileSlots') {
				nextState.spectrumProfileSlots = mergeSpectrumProfileSlots(
					nextState.spectrumProfileSlots,
					importedValue
				);
				continue;
			}
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
		nextState.backgroundImages = nextState.backgroundImages.map(image => ({
			...image,
			particlesProfileSlotIndex: null,
			particlesOverride: null,
			rainProfileSlotIndex: null,
			rainOverride: null
		}));
		nextState.sceneSlots = nextState.sceneSlots.map(scene => ({
			...scene,
			particlesSlotIndex: null,
			rainSlotIndex: null
		}));
	}

	if (!selection.looks) {
		nextState.backgroundImages = nextState.backgroundImages.map(image => ({
			...image,
			looksProfileSlotIndex: null,
			looksOverride: null
		}));
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
