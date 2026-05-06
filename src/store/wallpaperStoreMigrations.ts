/**
 * PERSISTENCE MODEL — THREE LAYERS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Layer 1 — SCENE STATE  (persisted to localStorage, key: 'lwag-state')
 *   All visual settings: filters, spectrum, logo, particles, rain, slideshow,
 *   filters, layer z-indices, presets, editor theme, language.
 *   BackgroundImageItem.url and OverlayImageItem.url are set to null before
 *   saving — they are reconstructed from Layer 2 on load.
 *
 * Layer 2 — ASSET REFERENCES  (persisted to IndexedDB via imageDb.ts)
 *   Blob URLs for uploaded background images, overlay images, and logo.
 *   Keys: imageIds[], logoId, overlays[].assetId
 *   Reconstructed on load by useRestoreWallpaperAssets hook.
 *
 * Layer 3 — RUNTIME STATE  (never persisted, dropped by partialize)
 *   audioCaptureState, imageUrl, globalBackgroundUrl, logoUrl, imageUrls,
 *   isPresetDirty, editorPanelOpen, editorOverlayOpen, backgroundFallbackVisible,
 *   and all UI-only action setters.
 *
 * When adding a new state field:
 *   - Scene field: add to WallpaperState, include in DEFAULT_STATE, and add
 *     a ?? fallback in migrateWallpaperStore.
 *   - Asset field: store the id in Layer 1 and the blob URL in Layer 2.
 *   - Runtime field: add to the exclusion list in partializeWallpaperStore.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { DEFAULT_STATE } from '@/lib/constants';
import { getCurrentViewportResolution } from '@/features/layout/viewportMetrics';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import {
	createDefaultBackgroundProfileSlots,
	createDefaultLogoProfileSlots,
	createDefaultLooksProfileSlots,
	createDefaultMotionProfileSlots,
	createDefaultParticlesProfileSlots,
	createDefaultRainProfileSlots,
	createDefaultSpectrumProfileSlots,
	createDefaultTrackTitleProfileSlots,
	normalizeProfileSlots,
	BACKGROUND_PROFILE_SLOT_COUNT,
	MAX_LOGO_SLOT_COUNT,
	MAX_LOOKS_SLOT_COUNT,
	MAX_MOTION_SLOT_COUNT,
	MAX_PARTICLES_SLOT_COUNT,
	MAX_RAIN_SLOT_COUNT,
	MAX_SPECTRUM_SLOT_COUNT,
	MAX_TRACK_TITLE_SLOT_COUNT
} from '@/lib/featureProfiles';
import {
	buildBackgroundImageCollectionPatch,
	normalizePersistedBackgroundImages
} from '@/store/backgroundStoreUtils';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

function normalizeParticleColorMode(
	raw: unknown,
	fallback: WallpaperStore['particleColorMode']
): WallpaperStore['particleColorMode'] {
	if (raw === 'random') return 'rainbow';
	if (
		raw === 'solid' ||
		raw === 'gradient' ||
		raw === 'rainbow' ||
		raw === 'rotateRgb'
	) {
		return raw;
	}
	return fallback;
}

function normalizeAudioChannel(
	value: unknown,
	fallback: WallpaperStore['logoBandMode']
) {
	switch (value) {
		case 'auto':
		case 'full':
		case 'kick':
		case 'instrumental':
		case 'bass':
		case 'hihat':
		case 'vocal':
			return value;
		case 'peak':
			return 'kick';
		case 'mid':
			return 'instrumental';
		case 'treble':
			return 'hihat';
		case 'low-mid':
			return 'instrumental';
		case 'high-mid':
			return 'vocal';
		default:
			return fallback;
	}
}

function normalizeAudioSourceMode(
	value: unknown,
	fallback: WallpaperStore['audioSourceMode']
) {
	switch (value) {
		case 'none':
		case 'desktop':
		case 'microphone':
		case 'file':
			return value;
		default:
			return fallback;
	}
}

function normalizeThemeColorSource(
	value: unknown,
	fallback: WallpaperStore['editorThemeColorSource']
): WallpaperStore['editorThemeColorSource'] {
	switch (value) {
		case 'manual':
		case 'theme':
		case 'image':
			return value;
		case 'background':
			return 'image';
		case 'default':
			return 'theme';
		default:
			return fallback;
	}
}

function normalizeColorSourceMode(
	value: unknown,
	fallback: WallpaperStore['particleColorSource']
): WallpaperStore['particleColorSource'] {
	if (value === 'manual' || value === 'theme' || value === 'image')
		return value;
	if (value === 'background') return 'image';
	return fallback;
}

function migrateMotionProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.motionProfileSlots,
		createDefaultMotionProfileSlots,
		'Motion',
		MAX_MOTION_SLOT_COUNT
	);
}

function migrateParticlesProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.particlesProfileSlots,
		createDefaultParticlesProfileSlots,
		'Particles',
		MAX_PARTICLES_SLOT_COUNT
	);
}

function migrateRainProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.rainProfileSlots,
		createDefaultRainProfileSlots,
		'Rain',
		MAX_RAIN_SLOT_COUNT
	);
}

function migrateLooksProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.looksProfileSlots,
		createDefaultLooksProfileSlots,
		'Look',
		MAX_LOOKS_SLOT_COUNT
	);
}

function migrateTrackTitleProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.trackTitleProfileSlots,
		createDefaultTrackTitleProfileSlots,
		'Track Title',
		MAX_TRACK_TITLE_SLOT_COUNT
	);
}

function migrateSceneSlots(
	state: Partial<WallpaperStore>
): WallpaperStore['sceneSlots'] {
	const raw = (state as { sceneSlots?: unknown }).sceneSlots;
	if (!Array.isArray(raw)) return DEFAULT_STATE.sceneSlots;
	return raw
		.filter(
			(s): s is Record<string, unknown> =>
				!!s && typeof s === 'object' && typeof s.id === 'string'
		)
		.map(s => ({
			id: String(s.id),
			name: typeof s.name === 'string' ? s.name : 'Scene',
			spectrumSlotIndex:
				typeof s.spectrumSlotIndex === 'number'
					? s.spectrumSlotIndex
					: null,
			looksSlotIndex:
				typeof s.looksSlotIndex === 'number'
					? s.looksSlotIndex
					: null,
			particlesSlotIndex:
				typeof s.particlesSlotIndex === 'number'
					? s.particlesSlotIndex
					: null,
			rainSlotIndex:
				typeof s.rainSlotIndex === 'number' ? s.rainSlotIndex : null,
			logoSlotIndex:
				typeof s.logoSlotIndex === 'number' ? s.logoSlotIndex : null,
			trackTitleSlotIndex:
				typeof s.trackTitleSlotIndex === 'number'
					? s.trackTitleSlotIndex
					: null
		}));
}

function migrateLogoProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.logoProfileSlots,
		createDefaultLogoProfileSlots,
		'Logo',
		MAX_LOGO_SLOT_COUNT
	).map(slot => ({
		...slot,
		values: slot.values
			? {
					...slot.values,
					logoGlowColorSource: normalizeColorSourceMode(
						slot.values.logoGlowColorSource,
						DEFAULT_STATE.logoGlowColorSource
					),
					logoShadowColorSource: normalizeColorSourceMode(
						slot.values.logoShadowColorSource,
						DEFAULT_STATE.logoShadowColorSource
					),
					logoBackdropColorSource: normalizeColorSourceMode(
						slot.values.logoBackdropColorSource,
						DEFAULT_STATE.logoBackdropColorSource
					),
					logoBandMode: normalizeAudioChannel(
						slot.values.logoBandMode,
						DEFAULT_STATE.logoBandMode
					)
				}
			: null
	}));
}

function migrateBackgroundProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.backgroundProfileSlots,
		createDefaultBackgroundProfileSlots,
		'BG',
		BACKGROUND_PROFILE_SLOT_COUNT
	).map(slot => ({
		...slot,
		values: slot.values
			? {
					...slot.values,
					imageAudioChannel: normalizeAudioChannel(
						slot.values.imageAudioChannel,
						DEFAULT_STATE.imageAudioChannel
					)
				}
			: null
	}));
}

function migrateSpectrumProfileSlots(state: Partial<WallpaperStore>) {
	const hydrateSpectrumSlotValues = (
		values: NonNullable<
			NonNullable<WallpaperStore['spectrumProfileSlots'][number]['values']
		>
		>
	) => ({
		spectrumEnabled:
			values.spectrumEnabled ?? DEFAULT_STATE.spectrumEnabled,
		spectrumFamily: normalizeSpectrumFamily(
			values.spectrumFamily ?? DEFAULT_STATE.spectrumFamily
		),
		spectrumAfterglow:
			values.spectrumAfterglow ?? DEFAULT_STATE.spectrumAfterglow,
		spectrumMotionTrails:
			values.spectrumMotionTrails ?? DEFAULT_STATE.spectrumMotionTrails,
		spectrumGhostFrames:
			values.spectrumGhostFrames ?? DEFAULT_STATE.spectrumGhostFrames,
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwave:
			values.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			values.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveThickness:
			values.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			values.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			values.spectrumShockwaveBlur ??
			DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			values.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ?? DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumClonePeakRibbons:
			values.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			values.spectrumCloneAfterglow ?? DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			values.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			values.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneEnergyBloom:
			values.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			values.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			values.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
		spectrumCloneShockwaveThickness:
			values.spectrumCloneShockwaveThickness ??
			DEFAULT_STATE.spectrumCloneShockwaveThickness,
		spectrumCloneShockwaveOpacity:
			values.spectrumCloneShockwaveOpacity ??
			DEFAULT_STATE.spectrumCloneShockwaveOpacity,
		spectrumCloneShockwaveBlur:
			values.spectrumCloneShockwaveBlur ??
			DEFAULT_STATE.spectrumCloneShockwaveBlur,
		spectrumCloneShockwaveColorMode:
			values.spectrumCloneShockwaveColorMode ??
			DEFAULT_STATE.spectrumCloneShockwaveColorMode,
		spectrumClonePeakRibbonAngle:
			values.spectrumClonePeakRibbonAngle ??
			DEFAULT_STATE.spectrumClonePeakRibbonAngle,
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ??
			DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumCloneTunnelRingCount:
			values.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumSpectrogramDecay:
			values.spectrumSpectrogramDecay ??
			DEFAULT_STATE.spectrumSpectrogramDecay,
		spectrumMode: values.spectrumMode ?? DEFAULT_STATE.spectrumMode,
		spectrumLinearOrientation:
			values.spectrumLinearOrientation ??
			DEFAULT_STATE.spectrumLinearOrientation,
		spectrumLinearDirection:
			values.spectrumLinearDirection ??
			DEFAULT_STATE.spectrumLinearDirection,
		spectrumRadialShape:
			values.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
		spectrumRadialAngle:
			values.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
		spectrumRadialFitLogo:
			values.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
		spectrumFollowLogo:
			values.spectrumFollowLogo ?? DEFAULT_STATE.spectrumFollowLogo,
		spectrumLogoGap: values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
		spectrumCircularClone:
			values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
		spectrumSpan: values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumCloneOpacity:
			values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
		spectrumCloneScale:
			values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
		spectrumCloneGap:
			values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
		spectrumCloneFamily: normalizeSpectrumFamily(
			values.spectrumCloneFamily ?? DEFAULT_STATE.spectrumCloneFamily
		),
		spectrumCloneStyle: normalizeSpectrumShape(
			values.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle
		),
		spectrumCloneRadialShape:
			values.spectrumCloneRadialShape ??
			DEFAULT_STATE.spectrumCloneRadialShape,
		spectrumCloneRadialAngle:
			values.spectrumCloneRadialAngle ??
			DEFAULT_STATE.spectrumCloneRadialAngle,
		spectrumCloneBarCount:
			values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			values.spectrumCloneMinHeight ?? DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			values.spectrumCloneMaxHeight ?? DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			values.spectrumCloneSmoothing ?? DEFAULT_STATE.spectrumCloneSmoothing,
		spectrumCloneGlowIntensity:
			values.spectrumCloneGlowIntensity ??
			DEFAULT_STATE.spectrumCloneGlowIntensity,
		spectrumCloneShadowBlur:
			values.spectrumCloneShadowBlur ??
			DEFAULT_STATE.spectrumCloneShadowBlur,
		spectrumClonePrimaryColor:
			values.spectrumClonePrimaryColor ??
			DEFAULT_STATE.spectrumClonePrimaryColor,
		spectrumCloneSecondaryColor:
			values.spectrumCloneSecondaryColor ??
			DEFAULT_STATE.spectrumCloneSecondaryColor,
		spectrumCloneColorSource: normalizeColorSourceMode(
			values.spectrumCloneColorSource,
			DEFAULT_STATE.spectrumCloneColorSource
		),
		spectrumCloneColorMode:
			values.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
		spectrumCloneBandMode: normalizeAudioChannel(
			values.spectrumCloneBandMode,
			DEFAULT_STATE.spectrumCloneBandMode
		),
		spectrumCloneAudioSmoothingEnabled:
			values.spectrumCloneAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumCloneAudioSmoothingEnabled,
		spectrumCloneAudioSmoothing:
			values.spectrumCloneAudioSmoothing ??
			DEFAULT_STATE.spectrumCloneAudioSmoothing,
		spectrumCloneRotationSpeed:
			values.spectrumCloneRotationSpeed ??
			DEFAULT_STATE.spectrumCloneRotationSpeed,
		spectrumCloneMirror:
			values.spectrumCloneMirror ?? DEFAULT_STATE.spectrumCloneMirror,
		spectrumClonePeakHold:
			values.spectrumClonePeakHold ?? DEFAULT_STATE.spectrumClonePeakHold,
		spectrumClonePeakDecay:
			values.spectrumClonePeakDecay ?? DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumCloneFollowLogo:
			values.spectrumCloneFollowLogo ??
			DEFAULT_STATE.spectrumCloneFollowLogo,
		spectrumCloneRadialFitLogo:
			values.spectrumCloneRadialFitLogo ??
			DEFAULT_STATE.spectrumCloneRadialFitLogo,
		spectrumInnerRadius:
			values.spectrumInnerRadius ?? DEFAULT_STATE.spectrumInnerRadius,
		spectrumBarCount: values.spectrumBarCount ?? DEFAULT_STATE.spectrumBarCount,
		spectrumBarWidth: values.spectrumBarWidth ?? DEFAULT_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ?? DEFAULT_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ?? DEFAULT_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ?? DEFAULT_STATE.spectrumSmoothing,
		spectrumOpacity: values.spectrumOpacity ?? DEFAULT_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ?? DEFAULT_STATE.spectrumGlowIntensity,
		spectrumShadowBlur:
			values.spectrumShadowBlur ?? DEFAULT_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ?? DEFAULT_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ?? DEFAULT_STATE.spectrumSecondaryColor,
		spectrumColorSource: normalizeColorSourceMode(
			values.spectrumColorSource,
			DEFAULT_STATE.spectrumColorSource
		),
		spectrumColorMode:
			values.spectrumColorMode ?? DEFAULT_STATE.spectrumColorMode,
		spectrumBandMode: normalizeAudioChannel(
			values.spectrumBandMode,
			DEFAULT_STATE.spectrumBandMode
		),
		spectrumAudioSmoothingEnabled:
			values.spectrumAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumAudioSmoothingEnabled,
		spectrumAudioSmoothing:
			values.spectrumAudioSmoothing ?? DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ?? DEFAULT_STATE.spectrumWaveFillOpacity,
		spectrumRotationSpeed:
			values.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed,
		spectrumMirror: values.spectrumMirror ?? DEFAULT_STATE.spectrumMirror,
		spectrumPeakHold:
			values.spectrumPeakHold ?? DEFAULT_STATE.spectrumPeakHold,
		spectrumPeakDecay:
			values.spectrumPeakDecay ?? DEFAULT_STATE.spectrumPeakDecay,
		spectrumPositionX:
			values.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX,
		spectrumPositionY:
			values.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY,
		spectrumCloneWaveFillOpacity:
			values.spectrumCloneWaveFillOpacity ??
			DEFAULT_STATE.spectrumCloneWaveFillOpacity
	});

	return normalizeProfileSlots(
		state.spectrumProfileSlots,
		createDefaultSpectrumProfileSlots,
		'Spectrum',
		MAX_SPECTRUM_SLOT_COUNT
	).map(slot => ({
		...slot,
		values: slot.values ? hydrateSpectrumSlotValues(slot.values) : null
	}));
}

export function migrateWallpaperStore(persistedState: unknown): WallpaperStore {
	const state = persistedState as Partial<WallpaperStore> | undefined;
	if (!state) return persistedState as WallpaperStore;
	const currentViewportReference = getCurrentViewportResolution();
	const legacyState = state as Partial<WallpaperStore> & {
		filterTarget?: string;
		spectrumLayout?: string;
		spectrumDirection?: string;
	};
	const legacySpectrumLayout = legacyState.spectrumLayout;
	const legacySpectrumDirection = legacyState.spectrumDirection;
	const legacySpectrumMode =
		legacySpectrumLayout === 'circular' ? 'radial' : 'linear';
	const legacySpectrumLinearOrientation =
		legacySpectrumLayout === 'left' || legacySpectrumLayout === 'right'
			? 'vertical'
			: 'horizontal';
	const legacySpectrumLinearDirection =
		legacySpectrumLayout === 'top' || legacySpectrumLayout === 'left'
			? 'flipped'
			: 'normal';
	const legacySpectrumPositionX =
		legacySpectrumLayout === 'left'
			? -0.85
			: legacySpectrumLayout === 'right'
				? 0.85
				: (state.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX);
	const legacySpectrumPositionY =
		legacySpectrumLayout === 'top' ||
		legacySpectrumLayout === 'top-inverted'
			? 0.85
			: legacySpectrumLayout === 'bottom' ||
				  legacySpectrumLayout === 'horizontal'
				? -0.85
				: (state.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY);
	const sanitizedState = { ...state } as Partial<WallpaperStore> &
		Record<string, unknown>;
	delete sanitizedState.glitchIntensity;
	delete sanitizedState.glitchBarWidth;
	delete sanitizedState.glitchDirection;
	delete sanitizedState.glitchFrequency;
	delete sanitizedState.glitchStyle;
	delete sanitizedState.glitchAudioReactive;
	delete sanitizedState.glitchAudioSensitivity;
	delete sanitizedState.audioTrackTitleGlitchIntensity;
	delete sanitizedState.audioTrackTitleGlitchBarWidth;
	delete sanitizedState.spectrumLayout;
	delete sanitizedState.spectrumDirection;

	const persistedParticleColorMode = (state as { particleColorMode?: string })
		.particleColorMode;
	const legacyFilterTarget = legacyState.filterTarget;
	const normalizedFilterTargets = Array.isArray(state.filterTargets)
		? state.filterTargets.flatMap(target =>
				String(target) === 'all-images'
					? ['background', 'selected-overlay']
					: [target]
			)
		: [
				legacyFilterTarget === 'all-images'
					? 'background'
					: (legacyFilterTarget ?? 'background')
			];
	const normalizedBackgroundImages =
		normalizePersistedBackgroundImages(state);
	const backgroundState = buildBackgroundImageCollectionPatch(
		{
			...DEFAULT_STATE,
			...state,
			backgroundImages: normalizedBackgroundImages,
			activeImageId:
				state.activeImageId ??
				normalizedBackgroundImages[0]?.assetId ??
				null
		},
		normalizedBackgroundImages,
		state.activeImageId ?? normalizedBackgroundImages[0]?.assetId ?? null
	);
	const normalizedOverlays = (state.overlays ?? []).map(overlay => ({
		...overlay,
		zIndex: Math.max(overlay.zIndex ?? 90, 90),
		blendMode: overlay.blendMode ?? 'normal',
		cropShape: overlay.cropShape ?? 'rectangle',
		edgeFade: overlay.edgeFade ?? 0.08,
		edgeBlur: overlay.edgeBlur ?? 0,
		edgeGlow: overlay.edgeGlow ?? 0.12
	}));
	const migratedCustomPresets = Object.fromEntries(
		Object.entries(state.customPresets ?? {}).map(([id, preset]) => [
			id,
			{
				...preset,
				values: {
					...preset.values,
					filterTargets: Array.isArray(
						(preset.values as { filterTargets?: unknown })
							.filterTargets
					)
						? (
								preset.values as { filterTargets: string[] }
							).filterTargets.map(target =>
								target === 'all-images' ? 'background' : target
							)
						: [
								((preset.values as { filterTarget?: string })
									.filterTarget ??
									DEFAULT_STATE
										.filterTargets[0]) as WallpaperStore['filterTargets'][number]
							],
					filterOpacity:
						(preset.values as { filterOpacity?: number })
							.filterOpacity ?? DEFAULT_STATE.filterOpacity,
					logoBandMode: normalizeAudioChannel(
						preset.values.logoBandMode,
						DEFAULT_STATE.logoBandMode
					),
					spectrumBandMode: normalizeAudioChannel(
						preset.values.spectrumBandMode,
						DEFAULT_STATE.spectrumBandMode
					),
					imageAudioChannel: normalizeAudioChannel(
						preset.values.imageAudioChannel,
						DEFAULT_STATE.imageAudioChannel
					),
					rgbShiftAudioChannel: normalizeAudioChannel(
						preset.values.rgbShiftAudioChannel,
						DEFAULT_STATE.rgbShiftAudioChannel
					),
					particleAudioChannel: normalizeAudioChannel(
						preset.values.particleAudioChannel,
						DEFAULT_STATE.particleAudioChannel
					),
					slideshowTransitionAudioChannel: normalizeAudioChannel(
						preset.values.slideshowTransitionAudioChannel,
						DEFAULT_STATE.slideshowTransitionAudioChannel
					),
					spectrumColorSource:
						(preset.values as { spectrumColorSource?: WallpaperStore['spectrumColorSource'] })
							.spectrumColorSource ??
						DEFAULT_STATE.spectrumColorSource,
					spectrumCloneColorSource:
						(preset.values as { spectrumCloneColorSource?: WallpaperStore['spectrumCloneColorSource'] })
							.spectrumCloneColorSource ??
						DEFAULT_STATE.spectrumCloneColorSource,
					logoGlowColorSource:
						(preset.values as { logoGlowColorSource?: WallpaperStore['logoGlowColorSource'] })
							.logoGlowColorSource ??
						DEFAULT_STATE.logoGlowColorSource,
					logoShadowColorSource:
						(preset.values as { logoShadowColorSource?: WallpaperStore['logoShadowColorSource'] })
							.logoShadowColorSource ??
						DEFAULT_STATE.logoShadowColorSource,
					logoBackdropColorSource:
						(preset.values as { logoBackdropColorSource?: WallpaperStore['logoBackdropColorSource'] })
							.logoBackdropColorSource ??
						DEFAULT_STATE.logoBackdropColorSource,
					particleColorSource:
						(preset.values as { particleColorSource?: WallpaperStore['particleColorSource'] })
							.particleColorSource ??
						DEFAULT_STATE.particleColorSource,
					rainColorSource:
						(preset.values as { rainColorSource?: WallpaperStore['rainColorSource'] })
							.rainColorSource ??
						DEFAULT_STATE.rainColorSource,
					audioTrackTitleTextColorSource:
						(preset.values as { audioTrackTitleTextColorSource?: WallpaperStore['audioTrackTitleTextColorSource'] })
							.audioTrackTitleTextColorSource ??
						DEFAULT_STATE.audioTrackTitleTextColorSource,
					audioTrackTitleStrokeColorSource:
						(preset.values as { audioTrackTitleStrokeColorSource?: WallpaperStore['audioTrackTitleStrokeColorSource'] })
							.audioTrackTitleStrokeColorSource ??
						DEFAULT_STATE.audioTrackTitleStrokeColorSource,
					audioTrackTitleGlowColorSource:
						(preset.values as { audioTrackTitleGlowColorSource?: WallpaperStore['audioTrackTitleGlowColorSource'] })
							.audioTrackTitleGlowColorSource ??
						DEFAULT_STATE.audioTrackTitleGlowColorSource,
					audioTrackTitleBackdropColorSource:
						(preset.values as { audioTrackTitleBackdropColorSource?: WallpaperStore['audioTrackTitleBackdropColorSource'] })
							.audioTrackTitleBackdropColorSource ??
						DEFAULT_STATE.audioTrackTitleBackdropColorSource,
					audioTrackTimeTextColorSource:
						(preset.values as { audioTrackTimeTextColorSource?: WallpaperStore['audioTrackTimeTextColorSource'] })
							.audioTrackTimeTextColorSource ??
						DEFAULT_STATE.audioTrackTimeTextColorSource,
					audioTrackTimeStrokeColorSource:
						(preset.values as { audioTrackTimeStrokeColorSource?: WallpaperStore['audioTrackTimeStrokeColorSource'] })
							.audioTrackTimeStrokeColorSource ??
						DEFAULT_STATE.audioTrackTimeStrokeColorSource,
					audioTrackTimeGlowColorSource:
						(preset.values as { audioTrackTimeGlowColorSource?: WallpaperStore['audioTrackTimeGlowColorSource'] })
							.audioTrackTimeGlowColorSource ??
						DEFAULT_STATE.audioTrackTimeGlowColorSource
				}
			}
		])
	);

	const migratedState = {
		...sanitizedState,
		...backgroundState,
		overlays: normalizedOverlays,
		selectedOverlayId: state.selectedOverlayId ?? null,
		layoutResponsiveEnabled:
			state.layoutResponsiveEnabled ??
			DEFAULT_STATE.layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled:
			state.layoutBackgroundReframeEnabled ??
			DEFAULT_STATE.layoutBackgroundReframeEnabled,
		layoutReferenceWidth:
			typeof state.layoutReferenceWidth === 'number' &&
			Number.isFinite(state.layoutReferenceWidth) &&
			state.layoutReferenceWidth > 0
				? Math.round(state.layoutReferenceWidth)
				: currentViewportReference.width,
		layoutReferenceHeight:
			typeof state.layoutReferenceHeight === 'number' &&
			Number.isFinite(state.layoutReferenceHeight) &&
			state.layoutReferenceHeight > 0
				? Math.round(state.layoutReferenceHeight)
				: currentViewportReference.height,
		layerZIndices: state.layerZIndices ?? {},
		spectrumMode: state.spectrumMode ?? legacySpectrumMode,
		spectrumLinearOrientation:
			state.spectrumLinearOrientation ?? legacySpectrumLinearOrientation,
		spectrumLinearDirection:
			state.spectrumLinearDirection ?? legacySpectrumLinearDirection,
		spectrumRadialShape:
			state.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
		spectrumRadialAngle:
			state.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
		spectrumRadialFitLogo:
			state.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
		spectrumCircularClone:
			state.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
		spectrumLogoGap: state.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
		spectrumSpan: state.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumCloneOpacity:
			state.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
		spectrumCloneScale:
			state.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
		spectrumCloneGap:
			state.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
		spectrumCloneFamily: normalizeSpectrumFamily(
			state.spectrumCloneFamily ?? DEFAULT_STATE.spectrumCloneFamily
		),
		spectrumCloneStyle:
			normalizeSpectrumShape(
				state.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle
			),
		spectrumCloneRadialShape:
			state.spectrumCloneRadialShape ??
			DEFAULT_STATE.spectrumCloneRadialShape,
		spectrumCloneRadialAngle:
			state.spectrumCloneRadialAngle ??
			DEFAULT_STATE.spectrumCloneRadialAngle,
		spectrumCloneBarCount:
			state.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			state.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			state.spectrumCloneMinHeight ?? DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			state.spectrumCloneMaxHeight ?? DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			state.spectrumCloneSmoothing ?? DEFAULT_STATE.spectrumCloneSmoothing,
		spectrumCloneGlowIntensity:
			state.spectrumCloneGlowIntensity ??
			DEFAULT_STATE.spectrumCloneGlowIntensity,
		spectrumCloneShadowBlur:
			state.spectrumCloneShadowBlur ?? DEFAULT_STATE.spectrumCloneShadowBlur,
		spectrumClonePrimaryColor:
			state.spectrumClonePrimaryColor ??
			DEFAULT_STATE.spectrumClonePrimaryColor,
		spectrumCloneSecondaryColor:
			state.spectrumCloneSecondaryColor ??
			DEFAULT_STATE.spectrumCloneSecondaryColor,
		spectrumCloneColorSource: normalizeColorSourceMode(
			state.spectrumCloneColorSource,
			DEFAULT_STATE.spectrumCloneColorSource
		),
		spectrumCloneColorMode:
			state.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
		spectrumCloneBandMode: normalizeAudioChannel(
			state.spectrumCloneBandMode,
			DEFAULT_STATE.spectrumCloneBandMode
		),
		spectrumCloneAudioSmoothingEnabled:
			state.spectrumCloneAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumCloneAudioSmoothingEnabled,
		spectrumCloneAudioSmoothing:
			state.spectrumCloneAudioSmoothing ??
			DEFAULT_STATE.spectrumCloneAudioSmoothing,
		spectrumCloneRotationSpeed:
			state.spectrumCloneRotationSpeed ??
			DEFAULT_STATE.spectrumCloneRotationSpeed,
		spectrumCloneMirror:
			state.spectrumCloneMirror ?? DEFAULT_STATE.spectrumCloneMirror,
		spectrumClonePeakHold:
			state.spectrumClonePeakHold ?? DEFAULT_STATE.spectrumClonePeakHold,
		spectrumClonePeakDecay:
			state.spectrumClonePeakDecay ?? DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumCloneFollowLogo:
			state.spectrumCloneFollowLogo ??
			DEFAULT_STATE.spectrumCloneFollowLogo,
		spectrumCloneRadialFitLogo:
			state.spectrumCloneRadialFitLogo ??
			DEFAULT_STATE.spectrumCloneRadialFitLogo,
		spectrumCloneWaveFillOpacity:
			state.spectrumCloneWaveFillOpacity ??
			DEFAULT_STATE.spectrumCloneWaveFillOpacity,
		spectrumWaveFillOpacity:
			state.spectrumWaveFillOpacity ??
			DEFAULT_STATE.spectrumWaveFillOpacity,
		spectrumShape: normalizeSpectrumShape(
			state.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumRotationSpeed:
			legacySpectrumDirection === 'counterclockwise'
				? -Math.abs(
						state.spectrumRotationSpeed ??
							DEFAULT_STATE.spectrumRotationSpeed
					)
				: (state.spectrumRotationSpeed ??
					DEFAULT_STATE.spectrumRotationSpeed),
		showBackgroundScaleMeter:
			state.showBackgroundScaleMeter ??
			DEFAULT_STATE.showBackgroundScaleMeter,
		showSpectrumDiagnosticsHud:
			state.showSpectrumDiagnosticsHud ??
			DEFAULT_STATE.showSpectrumDiagnosticsHud,
		showLogoDiagnosticsHud:
			state.showLogoDiagnosticsHud ??
			DEFAULT_STATE.showLogoDiagnosticsHud,
		diagnosticsHudPositionX:
			typeof state.diagnosticsHudPositionX === 'number'
				? Math.min(1, Math.max(0, state.diagnosticsHudPositionX))
				: DEFAULT_STATE.diagnosticsHudPositionX,
		diagnosticsHudPositionY:
			typeof state.diagnosticsHudPositionY === 'number'
				? Math.min(1, Math.max(0, state.diagnosticsHudPositionY))
				: DEFAULT_STATE.diagnosticsHudPositionY,
		filterTargets: normalizedFilterTargets,
		filterOpacity: state.filterOpacity ?? DEFAULT_STATE.filterOpacity,
		filterBrightness: state.filterBrightness ?? 1,
		filterContrast: state.filterContrast ?? 1,
		filterSaturation: state.filterSaturation ?? 1,
		filterBlur: state.filterBlur ?? 0,
		filterHueRotate: state.filterHueRotate ?? 0,
		filterVignette: state.filterVignette ?? DEFAULT_STATE.filterVignette,
		filterBloom: state.filterBloom ?? DEFAULT_STATE.filterBloom,
		filterLumaThreshold:
			state.filterLumaThreshold ?? DEFAULT_STATE.filterLumaThreshold,
		filterLensWarp: state.filterLensWarp ?? DEFAULT_STATE.filterLensWarp,
		filterHeatDistortion:
			state.filterHeatDistortion ?? DEFAULT_STATE.filterHeatDistortion,
		activeFilterLookId:
			state.activeFilterLookId ?? DEFAULT_STATE.activeFilterLookId,
		backgroundImageEnabled:
			state.backgroundImageEnabled ??
			DEFAULT_STATE.backgroundImageEnabled,
		imageOpacity: state.imageOpacity ?? DEFAULT_STATE.imageOpacity,
		globalBackgroundEnabled:
			state.globalBackgroundEnabled ??
			DEFAULT_STATE.globalBackgroundEnabled,
		globalBackgroundId:
			state.globalBackgroundId ?? DEFAULT_STATE.globalBackgroundId,
		globalBackgroundUrl: null,
		globalBackgroundScale:
			state.globalBackgroundScale ?? DEFAULT_STATE.globalBackgroundScale,
		globalBackgroundPositionX:
			state.globalBackgroundPositionX ??
			DEFAULT_STATE.globalBackgroundPositionX,
		globalBackgroundPositionY:
			state.globalBackgroundPositionY ??
			DEFAULT_STATE.globalBackgroundPositionY,
		globalBackgroundFitMode:
			state.globalBackgroundFitMode ??
			DEFAULT_STATE.globalBackgroundFitMode,
		globalBackgroundOpacity:
			state.globalBackgroundOpacity ??
			DEFAULT_STATE.globalBackgroundOpacity,
		globalBackgroundBrightness:
			state.globalBackgroundBrightness ??
			DEFAULT_STATE.globalBackgroundBrightness,
		globalBackgroundContrast:
			state.globalBackgroundContrast ??
			DEFAULT_STATE.globalBackgroundContrast,
		globalBackgroundSaturation:
			state.globalBackgroundSaturation ??
			DEFAULT_STATE.globalBackgroundSaturation,
		globalBackgroundBlur:
			state.globalBackgroundBlur ?? DEFAULT_STATE.globalBackgroundBlur,
		globalBackgroundHueRotate:
			state.globalBackgroundHueRotate ??
			DEFAULT_STATE.globalBackgroundHueRotate,
		particleColorMode: normalizeParticleColorMode(
			persistedParticleColorMode === 'random'
				? 'rainbow'
				: state.particleColorMode,
			DEFAULT_STATE.particleColorMode
		),
		particleFilterBrightness:
			state.particleFilterBrightness ??
			DEFAULT_STATE.particleFilterBrightness,
		particleFilterContrast:
			state.particleFilterContrast ??
			DEFAULT_STATE.particleFilterContrast,
		particleFilterSaturation:
			state.particleFilterSaturation ??
			DEFAULT_STATE.particleFilterSaturation,
		particleFilterBlur:
			state.particleFilterBlur ?? DEFAULT_STATE.particleFilterBlur,
		particleFilterHueRotate:
			state.particleFilterHueRotate ??
			DEFAULT_STATE.particleFilterHueRotate,
		particleScanlineIntensity:
			state.particleScanlineIntensity ??
			DEFAULT_STATE.particleScanlineIntensity,
		particleScanlineSpacing:
			state.particleScanlineSpacing ??
			DEFAULT_STATE.particleScanlineSpacing,
		particleScanlineThickness:
			state.particleScanlineThickness ??
			DEFAULT_STATE.particleScanlineThickness,
		particleRotationIntensity:
			state.particleRotationIntensity ??
			DEFAULT_STATE.particleRotationIntensity,
		particleRotationDirection:
			state.particleRotationDirection ??
			DEFAULT_STATE.particleRotationDirection,
		logoBandMode: normalizeAudioChannel(
			state.logoBandMode,
			DEFAULT_STATE.logoBandMode
		),
		logoPositionX: state.logoPositionX ?? DEFAULT_STATE.logoPositionX,
		logoPositionY: state.logoPositionY ?? DEFAULT_STATE.logoPositionY,
		logoPeakWindow: state.logoPeakWindow ?? DEFAULT_STATE.logoPeakWindow,
		logoPeakFloor: state.logoPeakFloor ?? DEFAULT_STATE.logoPeakFloor,
		backgroundProfileSlots: migrateBackgroundProfileSlots(state),
		logoProfileSlots: migrateLogoProfileSlots(state),
		spectrumProfileSlots: migrateSpectrumProfileSlots(state),
		motionProfileSlots: migrateMotionProfileSlots(state),
		audioSourceMode: normalizeAudioSourceMode(
			state.audioSourceMode,
			DEFAULT_STATE.audioSourceMode
		),
		audioFileAssetId:
			state.audioFileAssetId ?? DEFAULT_STATE.audioFileAssetId,
		audioFileName: state.audioFileName ?? DEFAULT_STATE.audioFileName,
		audioFileVolume:
			state.audioFileVolume ?? DEFAULT_STATE.audioFileVolume,
		audioFileLoop: state.audioFileLoop ?? DEFAULT_STATE.audioFileLoop,
		audioPaused: state.audioPaused ?? DEFAULT_STATE.audioPaused,
		motionPaused: state.motionPaused ?? DEFAULT_STATE.motionPaused,
		audioChannelSmoothing:
			state.audioChannelSmoothing ?? DEFAULT_STATE.audioChannelSmoothing,
		audioSelectedChannelSmoothing:
			state.audioSelectedChannelSmoothing ??
			DEFAULT_STATE.audioSelectedChannelSmoothing,
		audioAutoKickThreshold:
			state.audioAutoKickThreshold ??
			DEFAULT_STATE.audioAutoKickThreshold,
		audioAutoSwitchHoldMs:
			state.audioAutoSwitchHoldMs ?? DEFAULT_STATE.audioAutoSwitchHoldMs,
		audioTracks: Array.isArray(state.audioTracks)
			? state.audioTracks
			: DEFAULT_STATE.audioTracks,
		activeAudioTrackId:
			state.activeAudioTrackId ?? DEFAULT_STATE.activeAudioTrackId,
		queuedAudioTrackId:
			state.queuedAudioTrackId ?? DEFAULT_STATE.queuedAudioTrackId,
		audioCrossfadeEnabled:
			state.audioCrossfadeEnabled ?? DEFAULT_STATE.audioCrossfadeEnabled,
		audioCrossfadeSeconds:
			state.audioCrossfadeSeconds ?? DEFAULT_STATE.audioCrossfadeSeconds,
		audioAutoAdvance:
			state.audioAutoAdvance ?? DEFAULT_STATE.audioAutoAdvance,
		audioMixMode:
			state.audioMixMode === 'manual' ||
			state.audioMixMode === 'sequential' ||
			state.audioMixMode === 'energy-match' ||
			state.audioMixMode === 'contrast'
				? state.audioMixMode
				: DEFAULT_STATE.audioMixMode,
		audioTransitionStyle:
			state.audioTransitionStyle === 'linear' ||
			state.audioTransitionStyle === 'smooth' ||
			state.audioTransitionStyle === 'quick' ||
			state.audioTransitionStyle === 'early-blend' ||
			state.audioTransitionStyle === 'late-blend'
				? state.audioTransitionStyle
				: DEFAULT_STATE.audioTransitionStyle,
		mediaSessionEnabled:
			state.mediaSessionEnabled ?? DEFAULT_STATE.mediaSessionEnabled,
		audioTrackTitleEnabled:
			state.audioTrackTitleEnabled ??
			DEFAULT_STATE.audioTrackTitleEnabled,
		audioTrackTitleLayoutMode:
			state.audioTrackTitleLayoutMode ??
			DEFAULT_STATE.audioTrackTitleLayoutMode,
		audioTrackTitleFontStyle:
			state.audioTrackTitleFontStyle ??
			DEFAULT_STATE.audioTrackTitleFontStyle,
		audioTrackTitleUppercase:
			state.audioTrackTitleUppercase ??
			DEFAULT_STATE.audioTrackTitleUppercase,
		audioTrackTitlePositionX:
			state.audioTrackTitlePositionX ??
			DEFAULT_STATE.audioTrackTitlePositionX,
		audioTrackTitlePositionY:
			state.audioTrackTitlePositionY ??
			DEFAULT_STATE.audioTrackTitlePositionY,
		audioTrackTitleFontSize:
			state.audioTrackTitleFontSize ??
			DEFAULT_STATE.audioTrackTitleFontSize,
		audioTrackTitleLetterSpacing:
			state.audioTrackTitleLetterSpacing ??
			DEFAULT_STATE.audioTrackTitleLetterSpacing,
		audioTrackTitleWidth:
			state.audioTrackTitleWidth ?? DEFAULT_STATE.audioTrackTitleWidth,
		audioTrackTitleOpacity:
			state.audioTrackTitleOpacity ??
			DEFAULT_STATE.audioTrackTitleOpacity,
		audioTrackTitleScrollSpeed:
			state.audioTrackTitleScrollSpeed ??
			DEFAULT_STATE.audioTrackTitleScrollSpeed,
		audioTrackTitleRgbShift:
			state.audioTrackTitleRgbShift ??
			DEFAULT_STATE.audioTrackTitleRgbShift,
		audioTrackTitleTextColor:
			state.audioTrackTitleTextColor ??
			DEFAULT_STATE.audioTrackTitleTextColor,
		audioTrackTitleTextColorSource: normalizeColorSourceMode(
			state.audioTrackTitleTextColorSource,
			DEFAULT_STATE.audioTrackTitleTextColorSource
		),
		audioTrackTitleStrokeColor:
			state.audioTrackTitleStrokeColor ??
			DEFAULT_STATE.audioTrackTitleStrokeColor,
		audioTrackTitleStrokeColorSource: normalizeColorSourceMode(
			state.audioTrackTitleStrokeColorSource,
			DEFAULT_STATE.audioTrackTitleStrokeColorSource
		),
		audioTrackTitleStrokeWidth:
			state.audioTrackTitleStrokeWidth ??
			DEFAULT_STATE.audioTrackTitleStrokeWidth,
		audioTrackTitleGlowColor:
			state.audioTrackTitleGlowColor ??
			DEFAULT_STATE.audioTrackTitleGlowColor,
		audioTrackTitleGlowColorSource: normalizeColorSourceMode(
			state.audioTrackTitleGlowColorSource,
			DEFAULT_STATE.audioTrackTitleGlowColorSource
		),
		audioTrackTitleGlowBlur:
			state.audioTrackTitleGlowBlur ??
			DEFAULT_STATE.audioTrackTitleGlowBlur,
		audioTrackTitleBackdropEnabled:
			state.audioTrackTitleBackdropEnabled ??
			DEFAULT_STATE.audioTrackTitleBackdropEnabled,
		audioTrackTitleBackdropColor:
			state.audioTrackTitleBackdropColor ??
			DEFAULT_STATE.audioTrackTitleBackdropColor,
		audioTrackTitleBackdropColorSource: normalizeColorSourceMode(
			state.audioTrackTitleBackdropColorSource,
			DEFAULT_STATE.audioTrackTitleBackdropColorSource
		),
		audioTrackTitleBackdropOpacity:
			state.audioTrackTitleBackdropOpacity ??
			DEFAULT_STATE.audioTrackTitleBackdropOpacity,
		audioTrackTitleBackdropPadding:
			state.audioTrackTitleBackdropPadding ??
			DEFAULT_STATE.audioTrackTitleBackdropPadding,
		audioTrackTitleFilterBrightness:
			state.audioTrackTitleFilterBrightness ??
			DEFAULT_STATE.audioTrackTitleFilterBrightness,
		audioTrackTitleFilterContrast:
			state.audioTrackTitleFilterContrast ??
			DEFAULT_STATE.audioTrackTitleFilterContrast,
		audioTrackTitleFilterSaturation:
			state.audioTrackTitleFilterSaturation ??
			DEFAULT_STATE.audioTrackTitleFilterSaturation,
		audioTrackTitleFilterBlur:
			state.audioTrackTitleFilterBlur ??
			DEFAULT_STATE.audioTrackTitleFilterBlur,
		audioTrackTitleFilterHueRotate:
			state.audioTrackTitleFilterHueRotate ??
			DEFAULT_STATE.audioTrackTitleFilterHueRotate,
		audioTrackTimeEnabled:
			state.audioTrackTimeEnabled ?? DEFAULT_STATE.audioTrackTimeEnabled,
		audioTrackTimeWidth:
			state.audioTrackTimeWidth ?? DEFAULT_STATE.audioTrackTimeWidth,
		audioTrackTimePositionX:
			state.audioTrackTimePositionX ??
			state.audioTrackTitlePositionX ??
			DEFAULT_STATE.audioTrackTimePositionX,
		audioTrackTimePositionY:
			state.audioTrackTimePositionY ??
			DEFAULT_STATE.audioTrackTimePositionY,
		audioTrackTimeFontStyle:
			state.audioTrackTimeFontStyle ??
			DEFAULT_STATE.audioTrackTimeFontStyle,
		audioTrackTimeFontSize:
			state.audioTrackTimeFontSize ??
			DEFAULT_STATE.audioTrackTimeFontSize,
		audioTrackTimeLetterSpacing:
			state.audioTrackTimeLetterSpacing ??
			DEFAULT_STATE.audioTrackTimeLetterSpacing,
		audioTrackTimeOpacity:
			state.audioTrackTimeOpacity ?? DEFAULT_STATE.audioTrackTimeOpacity,
		audioTrackTimeRgbShift:
			state.audioTrackTimeRgbShift ??
			DEFAULT_STATE.audioTrackTimeRgbShift,
		audioTrackTimeTextColor:
			state.audioTrackTimeTextColor ??
			DEFAULT_STATE.audioTrackTimeTextColor,
		audioTrackTimeTextColorSource: normalizeColorSourceMode(
			state.audioTrackTimeTextColorSource,
			DEFAULT_STATE.audioTrackTimeTextColorSource
		),
		audioTrackTimeStrokeColor:
			state.audioTrackTimeStrokeColor ??
			DEFAULT_STATE.audioTrackTimeStrokeColor,
		audioTrackTimeStrokeColorSource: normalizeColorSourceMode(
			state.audioTrackTimeStrokeColorSource,
			DEFAULT_STATE.audioTrackTimeStrokeColorSource
		),
		audioTrackTimeStrokeWidth:
			state.audioTrackTimeStrokeWidth ??
			DEFAULT_STATE.audioTrackTimeStrokeWidth,
		audioTrackTimeGlowColor:
			state.audioTrackTimeGlowColor ??
			DEFAULT_STATE.audioTrackTimeGlowColor,
		audioTrackTimeGlowColorSource: normalizeColorSourceMode(
			state.audioTrackTimeGlowColorSource,
			DEFAULT_STATE.audioTrackTimeGlowColorSource
		),
		audioTrackTimeGlowBlur:
			state.audioTrackTimeGlowBlur ??
			DEFAULT_STATE.audioTrackTimeGlowBlur,
		audioTrackTimeFilterBrightness:
			state.audioTrackTimeFilterBrightness ??
			DEFAULT_STATE.audioTrackTimeFilterBrightness,
		audioTrackTimeFilterContrast:
			state.audioTrackTimeFilterContrast ??
			DEFAULT_STATE.audioTrackTimeFilterContrast,
		audioTrackTimeFilterSaturation:
			state.audioTrackTimeFilterSaturation ??
			DEFAULT_STATE.audioTrackTimeFilterSaturation,
		audioTrackTimeFilterBlur:
			state.audioTrackTimeFilterBlur ??
			DEFAULT_STATE.audioTrackTimeFilterBlur,
		audioTrackTimeFilterHueRotate:
			state.audioTrackTimeFilterHueRotate ??
			DEFAULT_STATE.audioTrackTimeFilterHueRotate,
		slideshowTransitionIntensity:
			state.slideshowTransitionIntensity ??
			DEFAULT_STATE.slideshowTransitionIntensity,
		slideshowTransitionAudioDrive:
			state.slideshowTransitionAudioDrive ??
			DEFAULT_STATE.slideshowTransitionAudioDrive,
		slideshowTransitionAudioChannel: normalizeAudioChannel(
			state.slideshowTransitionAudioChannel,
			DEFAULT_STATE.slideshowTransitionAudioChannel
		),
		slideshowAudioCheckpointsEnabled:
			state.slideshowAudioCheckpointsEnabled ??
			DEFAULT_STATE.slideshowAudioCheckpointsEnabled,
		slideshowTrackChangeSyncEnabled:
			state.slideshowTrackChangeSyncEnabled ??
			DEFAULT_STATE.slideshowTrackChangeSyncEnabled,
		slideshowManualTimestampsEnabled:
			state.slideshowManualTimestampsEnabled ??
			DEFAULT_STATE.slideshowManualTimestampsEnabled,
		imageAudioReactiveDecay:
			state.imageAudioReactiveDecay ??
			DEFAULT_STATE.imageAudioReactiveDecay,
		imageAudioSmoothingEnabled:
			state.imageAudioSmoothingEnabled ??
			DEFAULT_STATE.imageAudioSmoothingEnabled,
		imageAudioSmoothing:
			state.imageAudioSmoothing ?? DEFAULT_STATE.imageAudioSmoothing,
		imageOpacityReactive:
			state.imageOpacityReactive ?? DEFAULT_STATE.imageOpacityReactive,
		imageOpacityReactiveAmount:
			state.imageOpacityReactiveAmount ??
			DEFAULT_STATE.imageOpacityReactiveAmount,
		imageOpacityReactiveInvert:
			state.imageOpacityReactiveInvert ??
			DEFAULT_STATE.imageOpacityReactiveInvert,
		imageOpacityReactiveThreshold:
			state.imageOpacityReactiveThreshold ??
			DEFAULT_STATE.imageOpacityReactiveThreshold,
		imageOpacityReactiveSoftness:
			state.imageOpacityReactiveSoftness ??
			DEFAULT_STATE.imageOpacityReactiveSoftness,
		imageBlurReactive:
			state.imageBlurReactive ?? DEFAULT_STATE.imageBlurReactive,
		imageBlurReactiveAmount:
			state.imageBlurReactiveAmount ??
			DEFAULT_STATE.imageBlurReactiveAmount,
		imageBlurReactiveInvert:
			state.imageBlurReactiveInvert ??
			DEFAULT_STATE.imageBlurReactiveInvert,
		imageBlurReactiveThreshold:
			state.imageBlurReactiveThreshold ??
			DEFAULT_STATE.imageBlurReactiveThreshold,
		imageBlurReactiveSoftness:
			state.imageBlurReactiveSoftness ??
			DEFAULT_STATE.imageBlurReactiveSoftness,
		imageBassAttack: state.imageBassAttack ?? DEFAULT_STATE.imageBassAttack,
		imageBassRelease:
			state.imageBassRelease ??
			0.02 +
				(1 -
					(state.imageAudioReactiveDecay ??
						DEFAULT_STATE.imageAudioReactiveDecay)) *
					0.2,
		imageBassReactivitySpeed:
			state.imageBassReactivitySpeed ??
			DEFAULT_STATE.imageBassReactivitySpeed,
		imageBassPeakWindow:
			state.imageBassPeakWindow ?? DEFAULT_STATE.imageBassPeakWindow,
		imageBassPeakFloor:
			state.imageBassPeakFloor ?? DEFAULT_STATE.imageBassPeakFloor,
		imageBassPunch: state.imageBassPunch ?? DEFAULT_STATE.imageBassPunch,
		imageBassReactiveScaleIntensity:
			state.imageBassReactiveScaleIntensity ??
			DEFAULT_STATE.imageBassReactiveScaleIntensity,
		imageBassZoomPresetId:
			state.imageBassZoomPresetId ?? DEFAULT_STATE.imageBassZoomPresetId,
		imageAudioChannel: normalizeAudioChannel(
			state.imageAudioChannel,
			DEFAULT_STATE.imageAudioChannel
		),
		rgbShiftAudioChannel: normalizeAudioChannel(
			state.rgbShiftAudioChannel,
			DEFAULT_STATE.rgbShiftAudioChannel
		),
		rgbShiftAudioSmoothingEnabled:
			state.rgbShiftAudioSmoothingEnabled ??
			DEFAULT_STATE.rgbShiftAudioSmoothingEnabled,
		rgbShiftAudioSmoothing:
			state.rgbShiftAudioSmoothing ??
			DEFAULT_STATE.rgbShiftAudioSmoothing,
		particleAudioChannel: normalizeAudioChannel(
			state.particleAudioChannel,
			DEFAULT_STATE.particleAudioChannel
		),
		particleColorSource: normalizeColorSourceMode(
			state.particleColorSource,
			DEFAULT_STATE.particleColorSource
		),
		spectrumBandMode: normalizeAudioChannel(
			state.spectrumBandMode,
			DEFAULT_STATE.spectrumBandMode
		),
		spectrumColorSource: normalizeColorSourceMode(
			state.spectrumColorSource,
			DEFAULT_STATE.spectrumColorSource
		),
		spectrumAudioSmoothingEnabled:
			state.spectrumAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumAudioSmoothingEnabled,
		spectrumAudioSmoothing:
			state.spectrumAudioSmoothing ??
			DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumPositionX: state.spectrumPositionX ?? legacySpectrumPositionX,
		spectrumPositionY: state.spectrumPositionY ?? legacySpectrumPositionY,
		logoAudioSmoothingEnabled:
			state.logoAudioSmoothingEnabled ??
			DEFAULT_STATE.logoAudioSmoothingEnabled,
		logoAudioSmoothing:
			state.logoAudioSmoothing ?? DEFAULT_STATE.logoAudioSmoothing,
		logoGlowColorSource: normalizeColorSourceMode(
			state.logoGlowColorSource,
			DEFAULT_STATE.logoGlowColorSource
		),
		logoShadowColorSource: normalizeColorSourceMode(
			state.logoShadowColorSource,
			DEFAULT_STATE.logoShadowColorSource
		),
		logoBackdropColorSource: normalizeColorSourceMode(
			state.logoBackdropColorSource,
			DEFAULT_STATE.logoBackdropColorSource
		),
		rainColorSource: normalizeColorSourceMode(
			state.rainColorSource,
			DEFAULT_STATE.rainColorSource
		),
		showFps: state.showFps ?? DEFAULT_STATE.showFps,
		controlPanelAnchor:
			state.controlPanelAnchor ?? DEFAULT_STATE.controlPanelAnchor,
		fpsOverlayAnchor:
			state.fpsOverlayAnchor ?? DEFAULT_STATE.fpsOverlayAnchor,
		editorTheme: state.editorTheme ?? DEFAULT_STATE.editorTheme,
		editorThemeColorSource: normalizeThemeColorSource(
			state.editorThemeColorSource,
			DEFAULT_STATE.editorThemeColorSource
		),
		editorCornerRadius:
			state.editorCornerRadius ?? DEFAULT_STATE.editorCornerRadius,
		editorControlCornerRadius:
			state.editorControlCornerRadius ??
			state.editorCornerRadius ??
			DEFAULT_STATE.editorControlCornerRadius,
		editorManualAccentColor:
			state.editorManualAccentColor ??
			DEFAULT_STATE.editorManualAccentColor,
		editorManualSecondaryColor:
			state.editorManualSecondaryColor ??
			DEFAULT_STATE.editorManualSecondaryColor,
		editorManualBackdropColor:
			state.editorManualBackdropColor ??
			DEFAULT_STATE.editorManualBackdropColor,
		editorManualTextPrimaryColor:
			state.editorManualTextPrimaryColor ??
			DEFAULT_STATE.editorManualTextPrimaryColor,
		editorManualTextSecondaryColor:
			state.editorManualTextSecondaryColor ??
			DEFAULT_STATE.editorManualTextSecondaryColor,
		editorManualBackdropOpacity:
			state.editorManualBackdropOpacity ??
			DEFAULT_STATE.editorManualBackdropOpacity,
		editorManualBlurPx:
			state.editorManualBlurPx ?? DEFAULT_STATE.editorManualBlurPx,
		editorManualSurfaceOpacity:
			state.editorManualSurfaceOpacity ??
			DEFAULT_STATE.editorManualSurfaceOpacity,
		editorManualItemOpacity:
			state.editorManualItemOpacity ??
			DEFAULT_STATE.editorManualItemOpacity,
		quickActionsEnabled:
			state.quickActionsEnabled ?? DEFAULT_STATE.quickActionsEnabled,
		// Migrate from old px-based offset (±1400) to normalized 0–1.
		// Values outside [−1.5, 1.5] are treated as legacy px values and reset.
		quickActionsPositionX:
			typeof state.quickActionsPositionX === 'number' &&
			Math.abs(state.quickActionsPositionX) <= 1.5
				? state.quickActionsPositionX
				: DEFAULT_STATE.quickActionsPositionX,
		quickActionsPositionY:
			typeof state.quickActionsPositionY === 'number' &&
			Math.abs(state.quickActionsPositionY) <= 1.5
				? state.quickActionsPositionY
				: DEFAULT_STATE.quickActionsPositionY,
		quickActionsLauncherPositionX:
			typeof state.quickActionsLauncherPositionX === 'number' &&
			Math.abs(state.quickActionsLauncherPositionX) <= 1.5
				? state.quickActionsLauncherPositionX
				: DEFAULT_STATE.quickActionsLauncherPositionX,
		quickActionsLauncherPositionY:
			typeof state.quickActionsLauncherPositionY === 'number' &&
			Math.abs(state.quickActionsLauncherPositionY) <= 1.5
				? state.quickActionsLauncherPositionY
				: DEFAULT_STATE.quickActionsLauncherPositionY,
		quickActionsBackdropOpacity:
			state.quickActionsBackdropOpacity ??
			DEFAULT_STATE.quickActionsBackdropOpacity,
		quickActionsBlurPx:
			state.quickActionsBlurPx ?? DEFAULT_STATE.quickActionsBlurPx,
		quickActionsScale:
			state.quickActionsScale ?? DEFAULT_STATE.quickActionsScale,
		quickActionsLauncherSize:
			state.quickActionsLauncherSize ?? DEFAULT_STATE.quickActionsLauncherSize,
		quickActionsColorSource: normalizeThemeColorSource(
			state.quickActionsColorSource,
			DEFAULT_STATE.quickActionsColorSource
		),
		quickActionsManualAccentColor:
			state.quickActionsManualAccentColor ??
			DEFAULT_STATE.quickActionsManualAccentColor,
		quickActionsManualSecondaryColor:
			state.quickActionsManualSecondaryColor ??
			DEFAULT_STATE.quickActionsManualSecondaryColor,
		quickActionsManualBackdropColor:
			state.quickActionsManualBackdropColor ??
			DEFAULT_STATE.quickActionsManualBackdropColor,
		quickActionsManualTextPrimaryColor:
			state.quickActionsManualTextPrimaryColor ??
			DEFAULT_STATE.quickActionsManualTextPrimaryColor,
		quickActionsManualTextSecondaryColor:
			state.quickActionsManualTextSecondaryColor ??
			DEFAULT_STATE.quickActionsManualTextSecondaryColor,
		quickActionsManualSurfaceOpacity:
			state.quickActionsManualSurfaceOpacity ??
			DEFAULT_STATE.quickActionsManualSurfaceOpacity,
		quickActionsManualItemOpacity:
			state.quickActionsManualItemOpacity ??
			DEFAULT_STATE.quickActionsManualItemOpacity,
		sleepModeEnabled:
			state.sleepModeEnabled ?? DEFAULT_STATE.sleepModeEnabled,
		sleepModeDelaySeconds:
			state.sleepModeDelaySeconds ??
			DEFAULT_STATE.sleepModeDelaySeconds,
		sleepModeActive: DEFAULT_STATE.sleepModeActive,
		virtualFoldersEnabled: state.virtualFoldersEnabled ?? DEFAULT_STATE.virtualFoldersEnabled,
		customPresets: migratedCustomPresets,
		// Slot refactor v46: legacy `userScenes` / `activeUserSceneId` were a
		// bundle-based scene system. The new `sceneSlots` model stores refs
		// only; saved bundles are intentionally discarded (the user chose the
		// clean-replace migration path). New arrays are initialized empty.
		sceneSlots: migrateSceneSlots(state),
		activeSceneSlotId:
			typeof (state as { activeSceneSlotId?: unknown })
				.activeSceneSlotId === 'string' ||
			(state as { activeSceneSlotId?: unknown }).activeSceneSlotId ===
				null
				? ((state as { activeSceneSlotId: string | null })
						.activeSceneSlotId ?? null)
				: DEFAULT_STATE.activeSceneSlotId,
		particlesProfileSlots: migrateParticlesProfileSlots(state),
		rainProfileSlots: migrateRainProfileSlots(state),
		looksProfileSlots: migrateLooksProfileSlots(state),
		trackTitleProfileSlots: migrateTrackTitleProfileSlots(state),
		imageRotation:
			typeof state.imageRotation === 'number'
				? state.imageRotation
				: DEFAULT_STATE.imageRotation,
		spectrumFamily: normalizeSpectrumFamily(
			state.spectrumFamily ?? DEFAULT_STATE.spectrumFamily
		),
		spectrumAfterglow:
			state.spectrumAfterglow ?? DEFAULT_STATE.spectrumAfterglow,
		spectrumMotionTrails:
			state.spectrumMotionTrails ?? DEFAULT_STATE.spectrumMotionTrails,
		spectrumGhostFrames:
			state.spectrumGhostFrames ?? DEFAULT_STATE.spectrumGhostFrames,
		spectrumPeakRibbons:
			state.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwave:
			state.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			state.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveThickness:
			state.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			state.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			state.spectrumShockwaveBlur ??
			DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			state.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloom:
			state.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			state.spectrumPeakRibbonAngle ?? DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumClonePeakRibbons:
			state.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			state.spectrumCloneAfterglow ?? DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			state.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			state.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneEnergyBloom:
			state.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			state.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			state.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
		spectrumCloneShockwaveThickness:
			state.spectrumCloneShockwaveThickness ??
			DEFAULT_STATE.spectrumCloneShockwaveThickness,
		spectrumCloneShockwaveOpacity:
			state.spectrumCloneShockwaveOpacity ??
			DEFAULT_STATE.spectrumCloneShockwaveOpacity,
		spectrumCloneShockwaveBlur:
			state.spectrumCloneShockwaveBlur ??
			DEFAULT_STATE.spectrumCloneShockwaveBlur,
		spectrumCloneShockwaveColorMode:
			state.spectrumCloneShockwaveColorMode ??
			DEFAULT_STATE.spectrumCloneShockwaveColorMode,
		spectrumClonePeakRibbonAngle:
			state.spectrumClonePeakRibbonAngle ??
			DEFAULT_STATE.spectrumClonePeakRibbonAngle,
		spectrumOscilloscopeLineWidth:
			state.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			state.spectrumTunnelRingCount ?? DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumCloneTunnelRingCount:
			state.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumSpectrogramDecay:
			state.spectrumSpectrogramDecay ?? DEFAULT_STATE.spectrumSpectrogramDecay,
		discoveryOnboardingDismissed:
			typeof state.discoveryOnboardingDismissed === 'boolean'
				? state.discoveryOnboardingDismissed
				: true,
		performanceSafeEnabled:
			typeof state.performanceSafeEnabled === 'boolean'
				? state.performanceSafeEnabled
				: DEFAULT_STATE.performanceSafeEnabled,
		performanceModeBeforeSafe:
			state.performanceModeBeforeSafe === 'low' ||
			state.performanceModeBeforeSafe === 'medium' ||
			state.performanceModeBeforeSafe === 'high'
				? state.performanceModeBeforeSafe
				: DEFAULT_STATE.performanceModeBeforeSafe,
		customFilterLookSettings:
			state.customFilterLookSettings ??
			DEFAULT_STATE.customFilterLookSettings,
	} as WallpaperStore;

	return normalizeSpectrumSettings(migratedState) as WallpaperStore;
}
