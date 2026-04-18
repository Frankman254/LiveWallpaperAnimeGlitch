import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	createCustomPresetId,
	extractPresetValues,
	resolvePreset
} from '@/lib/presets';
import {
	buildScenePatch,
	CUSTOM_SCENE_ID,
	extractCustomSceneUserPatch,
	SCENE_PRESETS
} from '@/features/scenes/scenePresets';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import { pushRecentUnique } from '@/features/discovery/recentIds';
import { DISCOVERY_RECENT_MAX } from '@/features/discovery/constants';
import { syncStateWithActiveBackgroundImage } from '@/store/backgroundStoreUtils';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createSystemSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
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
		toggleFavoriteSceneId: id =>
			set(state => ({
				favoriteSceneIds: state.favoriteSceneIds.includes(id)
					? state.favoriteSceneIds.filter(x => x !== id)
					: [...state.favoriteSceneIds, id]
			})),
		surpriseMe: () => {
			invalidateSpectrumPresetMorph();
			const pool = SCENE_PRESETS.filter(s => s.id !== CUSTOM_SCENE_ID);
			if (pool.length === 0) return;
			const scene =
				pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
			if (!scene) return;
			set(state =>
				syncStateWithActiveBackgroundImage(state, {
					...buildScenePatch(scene, {
						customSceneUserPatch: state.customSceneUserPatch
					}),
					logoEnabled: state.logoEnabled,
					recentSceneIds: pushRecentUnique(
						state.recentSceneIds,
						scene.id,
						DISCOVERY_RECENT_MAX
					)
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
		setActiveScenePresetId: id => set({ activeScenePresetId: id }),
		saveCustomSceneUserPatchFromCurrent: () =>
			set(state => ({
				customSceneUserPatch: extractCustomSceneUserPatch(state)
			})),
		applyScenePreset: scene =>
			set(state => {
				if (scene.id === CUSTOM_SCENE_ID && !state.customSceneUserPatch) {
					return {};
				}
				invalidateSpectrumPresetMorph();
				return syncStateWithActiveBackgroundImage(state, {
					...buildScenePatch(scene, {
						customSceneUserPatch: state.customSceneUserPatch
					}),
					logoEnabled: state.logoEnabled,
					recentSceneIds: pushRecentUnique(
						state.recentSceneIds,
						scene.id,
						DISCOVERY_RECENT_MAX
					)
				});
			}),
		reset: () =>
			set(state => ({
				...DEFAULT_STATE,
				customPresets: state.customPresets,
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
