import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	createCustomPresetId,
	extractPresetValues,
	resolvePreset
} from '@/lib/presets';
import { buildScenePatch, SCENE_PRESETS } from '@/features/scenes/scenePresets';
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
			if (SCENE_PRESETS.length === 0) return;
			const scene =
				SCENE_PRESETS[
					Math.floor(Math.random() * SCENE_PRESETS.length)
				] ?? SCENE_PRESETS[0];
			if (!scene) return;
			set(state =>
				syncStateWithActiveBackgroundImage(state, {
					...buildScenePatch(scene),
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
		setAllUiColorSources: v =>
			set(() => {
				const nextSharedSource = v === 'background' ? 'background' : v;
				return {
					editorThemeColorSource: v,
					quickActionsColorSource: v,
					spectrumColorSource: nextSharedSource,
					spectrumCloneColorSource: nextSharedSource,
					logoGlowColorSource: nextSharedSource,
					logoShadowColorSource: nextSharedSource,
					logoBackdropColorSource: nextSharedSource,
					particleColorSource: nextSharedSource,
					rainColorSource: nextSharedSource,
					audioTrackTitleTextColorSource: nextSharedSource,
					audioTrackTitleStrokeColorSource: nextSharedSource,
					audioTrackTitleGlowColorSource: nextSharedSource,
					audioTrackTitleBackdropColorSource: nextSharedSource,
					audioTrackTimeTextColorSource: nextSharedSource,
					audioTrackTimeStrokeColorSource: nextSharedSource,
					audioTrackTimeGlowColorSource: nextSharedSource
				};
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
		applyScenePreset: scene =>
			set(state => {
				invalidateSpectrumPresetMorph();
				return syncStateWithActiveBackgroundImage(state, {
					...buildScenePatch(scene),
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
