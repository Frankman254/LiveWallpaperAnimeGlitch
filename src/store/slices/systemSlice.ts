import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	createCustomPresetId,
	extractPresetValues,
	resolvePreset
} from '@/lib/presets';
import {
	buildSceneSlotActivationPatch,
	createEmptySceneSlot,
	defaultSceneSlotName,
	normalizeSceneSlotAgainstState
} from '@/features/scenes/sceneSlot';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import { syncStateWithActiveBackgroundImage } from '@/store/backgroundStoreUtils';
import type { SceneSlot } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

const MAX_SCENE_SLOTS = 40;

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createSystemSlice(
	set: WallpaperSet,
	get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setPerformanceMode: v =>
			set(state => {
				if (state.performanceSafeEnabled) {
					return {
						performanceSafeEnabled: false,
						performanceModeBeforeSafe: null,
						performanceMode: v
					};
				}
				return { performanceMode: v };
			}),
		setPerformanceSafeEnabled: enabled =>
			set(state => {
				if (enabled) {
					if (state.performanceSafeEnabled) return {};
					return {
						performanceSafeEnabled: true,
						performanceModeBeforeSafe: state.performanceMode,
						performanceMode: 'low'
					};
				}
				if (!state.performanceSafeEnabled) return {};
				return {
					performanceSafeEnabled: false,
					performanceMode:
						state.performanceModeBeforeSafe ?? state.performanceMode,
					performanceModeBeforeSafe: null
				};
			}),
		dismissDiscoveryOnboarding: () =>
			set({ discoveryOnboardingDismissed: true }),
		surpriseMe: () => {
			invalidateSpectrumPresetMorph();
			const pool = get().sceneSlots;
			if (pool.length === 0) return;
			const slot = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
			if (!slot) return;
			set(state =>
				syncStateWithActiveBackgroundImage(state, {
					...buildSceneSlotActivationPatch(state, slot),
					activeSceneSlotId: slot.id
				})
			);
		},
		setLanguage: v => set({ language: v }),
		setShowFps: v => set({ showFps: v }),
		setControlPanelAnchor: v => set({ controlPanelAnchor: v }),
		setControlPanelActiveTab: v => set({ controlPanelActiveTab: v }),
		setFpsOverlayAnchor: v => set({ fpsOverlayAnchor: v }),
		setEditorTheme: v => set({ editorTheme: v }),
		setEditorThemeColorSource: v => set({ editorThemeColorSource: v }),
		setEditorCornerRadius: v => set({ editorCornerRadius: v }),
		// Color source ownership contract:
		// - editorThemeColorSource + quickActionsColorSource => UI shell owner
		// - spectrum/logo/particles/rain/track-* color sources => canvas owners
		// Use the focused setters below for owner-scoped updates.
		// Sets only the UI-shell color source (editor panel + HUD).
		setEditorShellColorSource: v =>
			set({
				editorThemeColorSource: v,
				quickActionsColorSource: v
			}),
		// Sets only the canvas/content color sources (spectrum, logo, rain,
		// particles, audio track overlays).
		setCanvasColorSources: v =>
			set({
				spectrumColorSource: v,
				spectrumCloneColorSource: v,
				logoGlowColorSource: v,
				logoShadowColorSource: v,
				logoBackdropColorSource: v,
				particleColorSource: v,
				rainColorSource: v,
				audioTrackTitleTextColorSource: v,
				audioTrackTitleStrokeColorSource: v,
				audioTrackTitleGlowColorSource: v,
				audioTrackTitleBackdropColorSource: v,
				audioTrackTimeTextColorSource: v,
				audioTrackTimeStrokeColorSource: v,
				audioTrackTimeGlowColorSource: v
			}),
		// Convenience action only: sync every color source to the same value.
		// This is an explicit batch update for UX shortcuts ("sync all"), not a
		// single source of truth. Domain owners still remain per-feature.
		syncAllColorSources: v =>
			set({
				editorThemeColorSource: v,
				quickActionsColorSource: v,
				spectrumColorSource: v,
				spectrumCloneColorSource: v,
				logoGlowColorSource: v,
				logoShadowColorSource: v,
				logoBackdropColorSource: v,
				particleColorSource: v,
				rainColorSource: v,
				audioTrackTitleTextColorSource: v,
				audioTrackTitleStrokeColorSource: v,
				audioTrackTitleGlowColorSource: v,
				audioTrackTitleBackdropColorSource: v,
				audioTrackTimeTextColorSource: v,
				audioTrackTimeStrokeColorSource: v,
				audioTrackTimeGlowColorSource: v
			}),
		setEditorManualAccentColor: v => set({ editorManualAccentColor: v }),
		setEditorManualSecondaryColor: v =>
			set({ editorManualSecondaryColor: v }),
		setEditorManualBackdropColor: v =>
			set({ editorManualBackdropColor: v }),
		setEditorManualTextPrimaryColor: v =>
			set({ editorManualTextPrimaryColor: v }),
		setEditorManualTextSecondaryColor: v =>
			set({ editorManualTextSecondaryColor: v }),
		setEditorManualBackdropOpacity: v =>
			set({ editorManualBackdropOpacity: v }),
		setEditorManualBlurPx: v => set({ editorManualBlurPx: v }),
		setEditorManualSurfaceOpacity: v =>
			set({ editorManualSurfaceOpacity: v }),
		setEditorManualItemOpacity: v =>
			set({ editorManualItemOpacity: v }),
		setQuickActionsEnabled: v => set({ quickActionsEnabled: v }),
		setQuickActionsPositionX: v => set({ quickActionsPositionX: v }),
		setQuickActionsPositionY: v => set({ quickActionsPositionY: v }),
		setQuickActionsLauncherPositionX: v =>
			set({ quickActionsLauncherPositionX: v }),
		setQuickActionsLauncherPositionY: v =>
			set({ quickActionsLauncherPositionY: v }),
		setQuickActionsBackdropOpacity: v =>
			set({ quickActionsBackdropOpacity: v }),
		setQuickActionsBlurPx: v => set({ quickActionsBlurPx: v }),
		setQuickActionsScale: v => set({ quickActionsScale: v }),
		setQuickActionsLauncherSize: v => set({ quickActionsLauncherSize: v }),
		setQuickActionsColorSource: v => set({ quickActionsColorSource: v }),
		setQuickActionsManualAccentColor: v =>
			set({ quickActionsManualAccentColor: v }),
		setQuickActionsManualSecondaryColor: v =>
			set({ quickActionsManualSecondaryColor: v }),
		setQuickActionsManualBackdropColor: v =>
			set({ quickActionsManualBackdropColor: v }),
		setQuickActionsManualTextPrimaryColor: v =>
			set({ quickActionsManualTextPrimaryColor: v }),
		setQuickActionsManualTextSecondaryColor: v =>
			set({ quickActionsManualTextSecondaryColor: v }),
		setQuickActionsManualSurfaceOpacity: v =>
			set({ quickActionsManualSurfaceOpacity: v }),
		setQuickActionsManualItemOpacity: v =>
			set({ quickActionsManualItemOpacity: v }),
		setSleepModeEnabled: v => set({ sleepModeEnabled: v }),
		setSleepModeDelaySeconds: v => set({ sleepModeDelaySeconds: v }),
		setSleepModeActive: v => set({ sleepModeActive: v }),
		setVirtualFoldersEnabled: v => set({ virtualFoldersEnabled: v }),
		setUIMode: v => set({ uiMode: v }),
		setEnableDragMode: v => set({ enableDragMode: v }),
		setActiveTool: v => set({ activeTool: v }),
		setLayerZIndex: (id, zIndex) =>
			set(state => ({
				layerZIndices: {
					...state.layerZIndices,
					[id]: zIndex
				}
			})),
		resetLayerZIndices: () => set({ layerZIndices: {} }),
		backgroundFallbackVisible: false,
		setBackgroundFallbackVisible: v =>
			set({ backgroundFallbackVisible: v }),
		applyPreset: id =>
			set(state => {
				const preset = resolvePreset(id, state.customPresets);
				if (!preset) return state;
				return syncStateWithActiveBackgroundImage(state, {
					...preset.values,
					activePreset: preset.id,
					isPresetDirty: false
				});
			}),
		saveCustomPreset: name =>
			set(state => {
				const currentCustom = state.customPresets[state.activePreset];
				const nextName =
					name?.trim() || currentCustom?.name || 'Custom Preset';
				const id = currentCustom?.id ?? createCustomPresetId();

				return {
					customPresets: {
						...state.customPresets,
						[id]: {
							id,
							name: nextName,
							values: extractPresetValues(state)
						}
					},
					activePreset: id,
					isPresetDirty: false
				};
			}),
		duplicatePreset: name =>
			set(state => {
				const source = resolvePreset(
					state.activePreset,
					state.customPresets
				);
				const nextName =
					name?.trim() || `${source?.name ?? 'Preset'} Copy`;
				const id = createCustomPresetId();

				return {
					customPresets: {
						...state.customPresets,
						[id]: {
							id,
							name: nextName,
							values: extractPresetValues(state)
						}
					},
					activePreset: id,
					isPresetDirty: false
				};
			}),
		revertToActivePreset: () =>
			set(state => {
				const preset = resolvePreset(
					state.activePreset,
					state.customPresets
				);
				if (!preset) return state;
				return syncStateWithActiveBackgroundImage(state, {
					...preset.values,
					isPresetDirty: false
				});
			}),
		addSceneSlot: name =>
			set(state => {
				if (state.sceneSlots.length >= MAX_SCENE_SLOTS) return state;
				const slot = createEmptySceneSlot(
					name?.trim() || defaultSceneSlotName(state.sceneSlots.length)
				);
				return { sceneSlots: [...state.sceneSlots, slot] };
			}),
		updateSceneSlot: (id, patch) =>
			set(state => ({
				sceneSlots: state.sceneSlots.map(slot =>
					slot.id === id
						? normalizeSceneSlotAgainstState(
								{ ...slot, ...patch },
								state
							)
						: slot
				)
			})),
		renameSceneSlot: (id, nextName) =>
			set(state => ({
				sceneSlots: state.sceneSlots.map(slot =>
					slot.id === id
						? {
								...slot,
								name: nextName.trim() || slot.name
							}
						: slot
				)
			})),
		removeSceneSlot: id =>
			set(state => ({
				sceneSlots: state.sceneSlots.filter(s => s.id !== id),
				backgroundImages: state.backgroundImages.map(img =>
					img.sceneSlotId === id
						? { ...img, sceneSlotId: null }
						: img
				),
				activeSceneSlotId:
					state.activeSceneSlotId === id
						? null
						: state.activeSceneSlotId
			})),
		applySceneSlotById: id =>
			set(state => {
				const slot = state.sceneSlots.find(s => s.id === id);
				if (!slot) return {};
				invalidateSpectrumPresetMorph();
				const normalized = normalizeSceneSlotAgainstState(slot, state);
				return syncStateWithActiveBackgroundImage(state, {
					...buildSceneSlotActivationPatch(state, normalized),
					activeSceneSlotId: slot.id
				} satisfies Partial<WallpaperStore>);
			}),
		setActiveSceneSlotId: id => set({ activeSceneSlotId: id }),
		captureSceneSlotFromCurrent: (name, matchKinds) =>
			set(state => {
				/**
				 * Build a scene slot by snapshotting each referenced subsystem
				 * into a new feature slot and linking the scene slot to it.
				 * `matchKinds` controls which subsystems get a fresh slot vs
				 * remain null (skip). Every new slot appears at the end of
				 * its feature's slot array.
				 */
				const nextSlots: Partial<WallpaperStore> = {};
				const scene: SceneSlot = createEmptySceneSlot(name);
				// For now we just create an empty slot and let the UI fill in
				// references. The extra snapshotting path can be implemented
				// once per-feature capture flows are wired.
				void matchKinds;
				return {
					sceneSlots: [...state.sceneSlots, scene],
					...nextSlots
				};
			}),
		reset: () =>
			set(state => ({
				...DEFAULT_STATE,
				customPresets: state.customPresets,
				sceneSlots: state.sceneSlots,
				motionProfileSlots: state.motionProfileSlots,
				particlesProfileSlots: state.particlesProfileSlots,
				rainProfileSlots: state.rainProfileSlots,
				looksProfileSlots: state.looksProfileSlots,
				trackTitleProfileSlots: state.trackTitleProfileSlots,
				language: state.language
			})),
		resetSection: keys =>
			set(state =>
				syncStateWithActiveBackgroundImage(
					state,
					Object.fromEntries(keys.map(k => [k, DEFAULT_STATE[k]]))
				)
			)
	} satisfies Partial<WallpaperStore>;
}
