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
import {
	convertLegacySpectrumCloneState,
	createDefaultSpectrumInstance
} from '@/features/spectrum/spectrumInstanceModel';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { getCurrentViewportResolution } from '@/features/layout/viewportMetrics';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import {
	createDefaultBackgroundProfileSlots,
	createDefaultCameraFxProfileSlots,
	createDefaultLightsProfileSlots,
	createDefaultLogoProfileSlots,
	createDefaultLooksProfileSlots,
	createDefaultMotionProfileSlots,
	createDefaultParticlesProfileSlots,
	createDefaultRainProfileSlots,
	createDefaultSpectrumProfileSlots,
	createDefaultTrackTitleProfileSlots,
	normalizeProfileSlots,
	BACKGROUND_PROFILE_SLOT_COUNT,
	MAX_CAMERA_FX_SLOT_COUNT,
	MAX_LIGHTS_SLOT_COUNT,
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

function normalizeParticleAudioDriftMode(
	value: unknown,
	fallback: WallpaperStore['particleAudioDriftMode']
): WallpaperStore['particleAudioDriftMode'] {
	switch (value) {
		case 'velocity':
		case 'offset':
		case 'burst':
			return value;
		default:
			return fallback;
	}
}

function normalizeNowPlayingTextTreatment(
	value: unknown,
	fallback: WallpaperStore['nowPlayingTextTreatment']
): WallpaperStore['nowPlayingTextTreatment'] {
	switch (value) {
		case 'solid':
		case 'gradient':
		case 'metallic':
		case 'neon':
		case 'glass':
		case 'shadow':
			return value;
		default:
			return fallback;
	}
}

function normalizeLyricsTextTransition(
	value: unknown,
	fallback: WallpaperStore['audioLyricsTransitionIn']
): WallpaperStore['audioLyricsTransitionIn'] {
	switch (value) {
		case 'none':
		case 'fade':
		case 'slide-up':
		case 'slide-down':
		case 'scale':
		case 'blur':
		case 'pop':
			return value;
		default:
			return fallback;
	}
}

function normalizeLyricsActiveAnimation(
	value: unknown,
	fallback: WallpaperStore['audioLyricsActiveAnimation']
): WallpaperStore['audioLyricsActiveAnimation'] {
	switch (value) {
		case 'none':
		case 'pulse':
		case 'glow-pulse':
		case 'breathing':
		case 'shake-light':
		case 'wave':
		case 'flicker':
			return value;
		default:
			return fallback;
	}
}

function normalizeParticleDepthFlowDirection(
	value: unknown,
	fallback: WallpaperStore['particleDepthFlowDirection']
): WallpaperStore['particleDepthFlowDirection'] {
	switch (value) {
		case 'towardViewer':
		case 'awayFromViewer':
			return value;
		default:
			return fallback;
	}
}

function normalizeParticleDepthFlowMode(
	value: unknown,
	fallback: WallpaperStore['particleDepthFlowMode']
): WallpaperStore['particleDepthFlowMode'] {
	switch (value) {
		case 'pullToCamera':
		case 'pushFromFocus':
		case 'tunnelBurst':
		case 'snowRush':
			return value;
		default:
			return fallback;
	}
}

function normalizeParticleDepthFlowSpawnOrigin(
	value: unknown,
	fallback: WallpaperStore['particleDepthFlowSpawnOrigin']
): WallpaperStore['particleDepthFlowSpawnOrigin'] {
	switch (value) {
		case 'randomScreen':
		case 'fromFocus':
		case 'fromEdges':
		case 'fromCenter':
		case 'fromTop':
		case 'fromBottom':
			return value;
		default:
			return fallback;
	}
}

function normalizeParticleDepthFlowLowEnergyAxis(
	value: unknown,
	fallback: WallpaperStore['particleDepthFlowInvertFocusAxis']
): WallpaperStore['particleDepthFlowInvertFocusAxis'] {
	switch (value) {
		case 'x':
		case 'y':
		case 'both':
			return value;
		default:
			return fallback;
	}
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

function normalizeSpectrumRotationDrive(
	value: unknown
): WallpaperStore['spectrumRotationDrive'] {
	if (
		value === 'off' ||
		value === 'fixed' ||
		value === 'audio' ||
		value === 'fixed-audio'
	) {
		return value;
	}
	return DEFAULT_STATE.spectrumRotationDrive;
}

function normalizeSpectrumRotationChannel(
	value: unknown
): WallpaperStore['spectrumRotationChannel'] {
	if (
		value === 'kick' ||
		value === 'bass' ||
		value === 'full' ||
		value === 'selected'
	) {
		return value;
	}
	return DEFAULT_STATE.spectrumRotationChannel;
}

function normalizeRotationDirection(
	value: unknown,
	legacySpeed: number
): WallpaperStore['spectrumRotationDirection'] {
	if (value === 'cw' || value === 'ccw') return value;
	return legacySpeed < 0 ? 'ccw' : 'cw';
}

function normalizeFxAudioChannel(
	value: unknown,
	fallback: WallpaperStore['stageLightsAudioChannel']
): WallpaperStore['stageLightsAudioChannel'] {
	if (value === 'kick' || value === 'bass' || value === 'full') return value;
	return fallback;
}

function normalizeFxBandThresholds(
	value: unknown,
	fallback: WallpaperStore['stageLightsBandThresholds']
): WallpaperStore['stageLightsBandThresholds'] {
	const record =
		value && typeof value === 'object' && !Array.isArray(value)
			? (value as Record<string, unknown>)
			: {};
	return {
		kick: finiteOrDefault(record.kick, fallback.kick),
		bass: finiteOrDefault(record.bass, fallback.bass),
		full: finiteOrDefault(record.full, fallback.full)
	};
}

function normalizeStageLightsBlendMode(
	value: unknown
): WallpaperStore['stageLightsBlendMode'] {
	if (value === 'lighter' || value === 'screen' || value === 'source-over') {
		return value;
	}
	return DEFAULT_STATE.stageLightsBlendMode;
}

function normalizeStageLightsOrigin(
	value: unknown
): WallpaperStore['stageLightsOrigin'] {
	if (
		value === 'top' ||
		value === 'bottom' ||
		value === 'left' ||
		value === 'right' ||
		value === 'top-bottom' ||
		value === 'sides' ||
		value === 'all'
	) {
		return value;
	}
	return DEFAULT_STATE.stageLightsOrigin;
}

function normalizeStageLightsMovementMode(
	value: unknown
): WallpaperStore['stageLightsMovementMode'] {
	if (
		value === 'top-down' ||
		value === 'bottom-up' ||
		value === 'left-right' ||
		value === 'right-left' ||
		value === 'cross-sweep' ||
		value === 'radial-sweep' ||
		value === 'circular-sweep'
	) {
		return value;
	}
	return DEFAULT_STATE.stageLightsMovementMode;
}

function normalizeFlashLightShape(
	value: unknown
): WallpaperStore['flashLightShape'] {
	if (
		value === 'full-screen' ||
		value === 'circular-burst' ||
		value === 'horizontal-blast' ||
		value === 'vertical-blast' ||
		value === 'center-bloom' ||
		value === 'edge-flash' ||
		value === 'vignette-invert'
	) {
		return value;
	}
	return DEFAULT_STATE.flashLightShape;
}

function normalizeCameraMotionMode(
	value: unknown
): WallpaperStore['cameraMotionMode'] {
	if (
		value === 'none' ||
		value === 'drift' ||
		value === 'circle' ||
		value === 'semicircle' ||
		value === 'figure-eight' ||
		value === 'orbit' ||
		value === 'pendulum'
	) {
		return value;
	}
	return DEFAULT_STATE.cameraMotionMode;
}

function normalizeCameraMotionDirection(
	value: unknown
): WallpaperStore['cameraMotionDirection'] {
	return value === 'ccw' ? 'ccw' : 'cw';
}

function normalizeCameraMotionDrive(
	value: unknown
): WallpaperStore['cameraMotionDrive'] {
	if (value === 'fixed' || value === 'audio' || value === 'fixed-audio') {
		return value;
	}
	return DEFAULT_STATE.cameraMotionDrive;
}

function normalizeCameraMotionTarget(
	value: unknown
): WallpaperStore['cameraMotionTarget'] {
	if (
		value === 'global-background' ||
		value === 'background' ||
		value === 'selected-overlay' ||
		value === 'logo' ||
		value === 'spectrum' ||
		value === 'particles' ||
		value === 'rain' ||
		value === 'track-title' ||
		value === 'lyrics' ||
		value === 'stage-lights' ||
		value === 'flash-light'
	) {
		return value;
	}
	return DEFAULT_STATE.cameraMotionTarget;
}

function normalizeCameraMotionTargets(
	value: unknown,
	legacyValue: unknown
): WallpaperStore['cameraMotionTargets'] {
	const normalizeOne = (
		target: unknown
	): WallpaperStore['cameraMotionTargets'][number] | null => {
		if (target === 'all') return null;
		if (target === 'background-spectrum') return null;
		const normalized = normalizeCameraMotionTarget(target);
		return normalized === DEFAULT_STATE.cameraMotionTarget &&
			target !== DEFAULT_STATE.cameraMotionTarget
			? null
			: normalized;
	};

	const source = Array.isArray(value) ? value : [legacyValue];
	const next = new Set<WallpaperStore['cameraMotionTargets'][number]>();
	for (const target of source) {
		if (target === 'all') {
			next.add('global-background');
			next.add('background');
			next.add('selected-overlay');
			next.add('logo');
			next.add('spectrum');
			next.add('particles');
			next.add('rain');
			next.add('track-title');
			next.add('lyrics');
			next.add('stage-lights');
			next.add('flash-light');
			continue;
		}
		if (target === 'background-spectrum') {
			next.add('background');
			next.add('spectrum');
			continue;
		}
		const normalized = normalizeOne(target);
		if (normalized) next.add(normalized);
	}

	return next.size > 0 ? [...next] : DEFAULT_STATE.cameraMotionTargets;
}

function normalizeCameraShakeMode(
	value: unknown
): WallpaperStore['cameraShakeMode'] {
	if (
		value === 'horizontal' ||
		value === 'vertical' ||
		value === 'free' ||
		value === 'punch' ||
		value === 'jitter' ||
		value === 'kick-snap'
	) {
		return value;
	}
	return DEFAULT_STATE.cameraShakeMode;
}

function finiteOrDefault(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? value
		: fallback;
}

function normalizeAudioLyricsTrackEntries(
	value: unknown
): WallpaperStore['audioLyricsByTrackAssetId'] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return DEFAULT_STATE.audioLyricsByTrackAssetId;
	}
	const next: WallpaperStore['audioLyricsByTrackAssetId'] = {};
	for (const [assetId, rawEntry] of Object.entries(value)) {
		if (
			!rawEntry ||
			typeof rawEntry !== 'object' ||
			Array.isArray(rawEntry)
		) {
			continue;
		}
		const entry = rawEntry as Record<string, unknown>;
		const lyrixaLayerOverrides = normalizeLyrixaLayerOverrides(
			entry.lyrixaLayerOverrides
		);
		next[assetId] = {
			mode:
				entry.mode === 'lrc' ||
				entry.mode === 'plain' ||
				entry.mode === 'auto'
					? entry.mode
					: 'auto',
			rawText: typeof entry.rawText === 'string' ? entry.rawText : '',
			lyrixaBundle:
				entry.lyrixaBundle &&
				typeof entry.lyrixaBundle === 'object' &&
				!Array.isArray(entry.lyrixaBundle)
					? (entry.lyrixaBundle as WallpaperStore['audioLyricsByTrackAssetId'][string]['lyrixaBundle'])
					: null,
			lyrixaRenderMode:
				entry.lyrixaRenderMode === 'bundle' ? 'bundle' : 'editor',
			...(lyrixaLayerOverrides ? { lyrixaLayerOverrides } : {})
		};
	}
	return next;
}

function finiteNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value)
		? value
		: undefined;
}

function normalizeLyrixaLayerOverrides(
	value: unknown
): WallpaperStore['audioLyricsByTrackAssetId'][string]['lyrixaLayerOverrides'] {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}
	const next: NonNullable<
		WallpaperStore['audioLyricsByTrackAssetId'][string]['lyrixaLayerOverrides']
	> = {};
	for (const [layerId, rawOverride] of Object.entries(value)) {
		if (
			!layerId ||
			!rawOverride ||
			typeof rawOverride !== 'object' ||
			Array.isArray(rawOverride)
		) {
			continue;
		}
		const override = rawOverride as Record<string, unknown>;
		const normalized = {
			...(typeof override.visible === 'boolean'
				? { visible: override.visible }
				: {}),
			...(finiteNumber(override.positionOffsetX) !== undefined
				? { positionOffsetX: finiteNumber(override.positionOffsetX) }
				: {}),
			...(finiteNumber(override.positionOffsetY) !== undefined
				? { positionOffsetY: finiteNumber(override.positionOffsetY) }
				: {}),
			...(finiteNumber(override.scale) !== undefined
				? { scale: finiteNumber(override.scale) }
				: {}),
			...(finiteNumber(override.opacity) !== undefined
				? { opacity: finiteNumber(override.opacity) }
				: {}),
			...(typeof override.textColor === 'string'
				? { textColor: override.textColor }
				: {}),
			...(typeof override.glowColor === 'string'
				? { glowColor: override.glowColor }
				: {}),
			...(finiteNumber(override.glowIntensity) !== undefined
				? { glowIntensity: finiteNumber(override.glowIntensity) }
				: {}),
			...(finiteNumber(override.blurAmount) !== undefined
				? { blurAmount: finiteNumber(override.blurAmount) }
				: {})
		};
		if (Object.keys(normalized).length > 0) {
			next[layerId] = normalized;
		}
	}
	return Object.keys(next).length > 0 ? next : undefined;
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

function migrateLightsProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.lightsProfileSlots,
		createDefaultLightsProfileSlots,
		'Lights',
		MAX_LIGHTS_SLOT_COUNT
	);
}

function migrateCameraFxProfileSlots(state: Partial<WallpaperStore>) {
	return normalizeProfileSlots(
		state.cameraFxProfileSlots,
		createDefaultCameraFxProfileSlots,
		'Camera',
		MAX_CAMERA_FX_SLOT_COUNT
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
	// A scene binding ref is 3-state: number (slot index) | 'off' | null.
	const ref = (value: unknown): import('@/types/wallpaper').SceneSlotRef =>
		typeof value === 'number' ? value : value === 'off' ? 'off' : null;
	return raw
		.filter(
			(s): s is Record<string, unknown> =>
				!!s && typeof s === 'object' && typeof s.id === 'string'
		)
		.map(s => ({
			id: String(s.id),
			name: typeof s.name === 'string' ? s.name : 'Scene',
			spectrumSlotIndex: ref(s.spectrumSlotIndex),
			looksSlotIndex: ref(s.looksSlotIndex),
			particlesSlotIndex: ref(s.particlesSlotIndex),
			rainSlotIndex: ref(s.rainSlotIndex),
			lightsSlotIndex: ref(s.lightsSlotIndex),
			cameraFxSlotIndex: ref(s.cameraFxSlotIndex),
			logoSlotIndex: ref(s.logoSlotIndex),
			trackTitleSlotIndex: ref(s.trackTitleSlotIndex)
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
					),
					logoCircularCrop:
						slot.values.logoCircularCrop ??
						DEFAULT_STATE.logoCircularCrop,
					logoCropRadius:
						slot.values.logoCropRadius ??
						DEFAULT_STATE.logoCropRadius
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
					imageCoverageLockEnabled:
						typeof slot.values.imageCoverageLockEnabled ===
						'boolean'
							? slot.values.imageCoverageLockEnabled
							: DEFAULT_STATE.imageCoverageLockEnabled,
					imageAudioChannel: normalizeAudioChannel(
						slot.values.imageAudioChannel,
						DEFAULT_STATE.imageAudioChannel
					)
				}
			: null
	}));
}

type LegacyLiquidSource = Partial<WallpaperStore> & {
	spectrumLiquidRigidShape?: unknown;
};

/**
 * Resolves the per-layer rigidShape field for both new (per-layer)
 * persisted state and legacy state where rigidShape was a single global
 * flag. The legacy single-flag value seeds all 3 layers so users who had
 * the rigid shape enabled before keep the same visual after migration.
 */
function resolveLegacyLiquidRigidShape(
	source: LegacyLiquidSource,
	layer: 1 | 2 | 3
): boolean {
	const newKey = `spectrumLiquidLayer${layer}RigidShape` as const;
	const direct = source[newKey];
	if (typeof direct === 'boolean') return direct;
	if (typeof source.spectrumLiquidRigidShape === 'boolean') {
		return source.spectrumLiquidRigidShape;
	}
	return DEFAULT_STATE[newKey] as boolean;
}

/**
 * v86: the flat `spectrumClone*` key space became `spectrumInstances`. A
 * pre-v86 store carries no instances array, so the legacy clone keys (still
 * present on the raw persisted object) are converted wholesale — same math
 * the old getCloneSpectrumState remap applied at render time.
 */
function migrateSpectrumInstances(
	state: Partial<WallpaperStore>
): WallpaperStore['spectrumInstances'] {
	if (Array.isArray(state.spectrumInstances)) {
		return state.spectrumInstances.map(instance => ({
			...createDefaultSpectrumInstance(),
			...instance
		}));
	}
	return [convertLegacySpectrumCloneState(state as Record<string, unknown>)];
}

function migrateSpectrumProfileSlots(state: Partial<WallpaperStore>) {
	// Field-by-field hydration lives in hydrateSpectrumProfileValues (shared
	// with profile loading); it also converts pre-v86 slots that still carry
	// flat legacy `spectrumClone*` keys into `spectrumInstances`.
	return normalizeProfileSlots(
		state.spectrumProfileSlots,
		createDefaultSpectrumProfileSlots,
		'Spectrum',
		MAX_SPECTRUM_SLOT_COUNT
	).map(slot => ({
		...slot,
		values: slot.values ? hydrateSpectrumProfileValues(slot.values) : null
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
	delete sanitizedState.spectrumLiquidRigidShape;
	delete sanitizedState.spectrumCloneLiquidRigidShape;
	// v86: drop every legacy flat clone key after conversion to instances.
	for (const key of Object.keys(sanitizedState)) {
		if (
			key.startsWith('spectrumClone') ||
			key === 'spectrumCircularClone'
		) {
			delete sanitizedState[key];
		}
	}
	// Dropped: every subsystem owns its own smoothing slider now. The toggles
	// previously gated a hidden value↔instantLevel branch; consumers always
	// read the smoothed value and the slider at 0 means raw.
	delete sanitizedState.spectrumAudioSmoothingEnabled;
	delete sanitizedState.spectrumCloneAudioSmoothingEnabled;
	delete sanitizedState.logoAudioSmoothingEnabled;
	delete sanitizedState.imageAudioSmoothingEnabled;
	delete sanitizedState.rgbShiftAudioSmoothingEnabled;

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
		edgeGlow: overlay.edgeGlow ?? 0.12,
		audioOpacityReactive: overlay.audioOpacityReactive ?? true,
		audioOpacityAmount: overlay.audioOpacityAmount ?? 0.35,
		audioOpacityInvert: overlay.audioOpacityInvert ?? false,
		audioOpacityChannel: normalizeAudioChannel(
			overlay.audioOpacityChannel,
			'kick'
		)
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
						(
							preset.values as {
								spectrumColorSource?: WallpaperStore['spectrumColorSource'];
							}
						).spectrumColorSource ??
						DEFAULT_STATE.spectrumColorSource,
					logoGlowColorSource:
						(
							preset.values as {
								logoGlowColorSource?: WallpaperStore['logoGlowColorSource'];
							}
						).logoGlowColorSource ??
						DEFAULT_STATE.logoGlowColorSource,
					logoShadowColorSource:
						(
							preset.values as {
								logoShadowColorSource?: WallpaperStore['logoShadowColorSource'];
							}
						).logoShadowColorSource ??
						DEFAULT_STATE.logoShadowColorSource,
					logoBackdropColorSource:
						(
							preset.values as {
								logoBackdropColorSource?: WallpaperStore['logoBackdropColorSource'];
							}
						).logoBackdropColorSource ??
						DEFAULT_STATE.logoBackdropColorSource,
					particleColorSource:
						(
							preset.values as {
								particleColorSource?: WallpaperStore['particleColorSource'];
							}
						).particleColorSource ??
						DEFAULT_STATE.particleColorSource,
					rainColorSource:
						(
							preset.values as {
								rainColorSource?: WallpaperStore['rainColorSource'];
							}
						).rainColorSource ?? DEFAULT_STATE.rainColorSource,
					audioTrackTitleTextColorSource:
						(
							preset.values as {
								audioTrackTitleTextColorSource?: WallpaperStore['audioTrackTitleTextColorSource'];
							}
						).audioTrackTitleTextColorSource ??
						DEFAULT_STATE.audioTrackTitleTextColorSource,
					audioTrackTitleStrokeColorSource:
						(
							preset.values as {
								audioTrackTitleStrokeColorSource?: WallpaperStore['audioTrackTitleStrokeColorSource'];
							}
						).audioTrackTitleStrokeColorSource ??
						DEFAULT_STATE.audioTrackTitleStrokeColorSource,
					audioTrackTitleGlowColorSource:
						(
							preset.values as {
								audioTrackTitleGlowColorSource?: WallpaperStore['audioTrackTitleGlowColorSource'];
							}
						).audioTrackTitleGlowColorSource ??
						DEFAULT_STATE.audioTrackTitleGlowColorSource,
					audioTrackTitleBackdropColorSource:
						(
							preset.values as {
								audioTrackTitleBackdropColorSource?: WallpaperStore['audioTrackTitleBackdropColorSource'];
							}
						).audioTrackTitleBackdropColorSource ??
						DEFAULT_STATE.audioTrackTitleBackdropColorSource,
					audioTrackTimeTextColorSource:
						(
							preset.values as {
								audioTrackTimeTextColorSource?: WallpaperStore['audioTrackTimeTextColorSource'];
							}
						).audioTrackTimeTextColorSource ??
						DEFAULT_STATE.audioTrackTimeTextColorSource,
					audioTrackTimeStrokeColorSource:
						(
							preset.values as {
								audioTrackTimeStrokeColorSource?: WallpaperStore['audioTrackTimeStrokeColorSource'];
							}
						).audioTrackTimeStrokeColorSource ??
						DEFAULT_STATE.audioTrackTimeStrokeColorSource,
					audioTrackTimeGlowColorSource:
						(
							preset.values as {
								audioTrackTimeGlowColorSource?: WallpaperStore['audioTrackTimeGlowColorSource'];
							}
						).audioTrackTimeGlowColorSource ??
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
		editorSidebarCollapsed:
			typeof state.editorSidebarCollapsed === 'boolean'
				? state.editorSidebarCollapsed
				: DEFAULT_STATE.editorSidebarCollapsed,
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
		imageCoverageLockEnabled:
			typeof state.imageCoverageLockEnabled === 'boolean'
				? state.imageCoverageLockEnabled
				: DEFAULT_STATE.imageCoverageLockEnabled,
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
		spectrumInstances: migrateSpectrumInstances(state),
		spectrumLogoGap: state.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
		spectrumSpan: state.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumWaveFillOpacity:
			state.spectrumWaveFillOpacity ??
			DEFAULT_STATE.spectrumWaveFillOpacity,
		spectrumShape: normalizeSpectrumShape(
			state.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumRotationSpeed: Math.abs(
			state.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed
		),
		spectrumRotationDrive: normalizeSpectrumRotationDrive(
			state.spectrumRotationDrive
		),
		spectrumRotationAudioAmount: finiteOrDefault(
			state.spectrumRotationAudioAmount,
			DEFAULT_STATE.spectrumRotationAudioAmount
		),
		spectrumRotationChannel: normalizeSpectrumRotationChannel(
			state.spectrumRotationChannel
		),
		spectrumRotationDirection:
			legacySpectrumDirection === 'counterclockwise'
				? 'ccw'
				: normalizeRotationDirection(
						state.spectrumRotationDirection,
						state.spectrumRotationSpeed ??
							DEFAULT_STATE.spectrumRotationSpeed
					),
		spectrumRotationSmoothing: finiteOrDefault(
			state.spectrumRotationSmoothing,
			DEFAULT_STATE.spectrumRotationSmoothing
		),
		spectrumRotationInvertOnLowEnergy:
			typeof state.spectrumRotationInvertOnLowEnergy === 'boolean'
				? state.spectrumRotationInvertOnLowEnergy
				: DEFAULT_STATE.spectrumRotationInvertOnLowEnergy,
		spectrumRotationInvertThreshold: finiteOrDefault(
			state.spectrumRotationInvertThreshold,
			DEFAULT_STATE.spectrumRotationInvertThreshold
		),
		spectrumRotationInvertHoldMs: finiteOrDefault(
			state.spectrumRotationInvertHoldMs,
			DEFAULT_STATE.spectrumRotationInvertHoldMs
		),
		stageLightsEnabled:
			typeof state.stageLightsEnabled === 'boolean'
				? state.stageLightsEnabled
				: DEFAULT_STATE.stageLightsEnabled,
		stageLightsIntensity: finiteOrDefault(
			state.stageLightsIntensity,
			DEFAULT_STATE.stageLightsIntensity
		),
		stageLightsBeamCount: finiteOrDefault(
			state.stageLightsBeamCount,
			DEFAULT_STATE.stageLightsBeamCount
		),
		stageLightsMinBeamCount: finiteOrDefault(
			state.stageLightsMinBeamCount,
			Math.min(
				DEFAULT_STATE.stageLightsMinBeamCount,
				finiteOrDefault(
					state.stageLightsBeamCount,
					DEFAULT_STATE.stageLightsBeamCount
				)
			)
		),
		stageLightsMaxBeamCount: finiteOrDefault(
			state.stageLightsMaxBeamCount,
			finiteOrDefault(
				state.stageLightsBeamCount,
				DEFAULT_STATE.stageLightsMaxBeamCount
			)
		),
		stageLightsBeamWidth: finiteOrDefault(
			state.stageLightsBeamWidth,
			DEFAULT_STATE.stageLightsBeamWidth
		),
		stageLightsBeamLength: finiteOrDefault(
			state.stageLightsBeamLength,
			DEFAULT_STATE.stageLightsBeamLength
		),
		stageLightsSoftness: finiteOrDefault(
			state.stageLightsSoftness,
			DEFAULT_STATE.stageLightsSoftness
		),
		stageLightsSpeed: finiteOrDefault(
			state.stageLightsSpeed,
			DEFAULT_STATE.stageLightsSpeed
		),
		stageLightsFixedMotion:
			typeof state.stageLightsFixedMotion === 'boolean'
				? state.stageLightsFixedMotion
				: DEFAULT_STATE.stageLightsFixedMotion,
		stageLightsColorSource: normalizeColorSourceMode(
			state.stageLightsColorSource,
			DEFAULT_STATE.stageLightsColorSource
		),
		stageLightsColor:
			typeof state.stageLightsColor === 'string'
				? state.stageLightsColor
				: DEFAULT_STATE.stageLightsColor,
		stageLightsAudioReactive:
			typeof state.stageLightsAudioReactive === 'boolean'
				? state.stageLightsAudioReactive
				: DEFAULT_STATE.stageLightsAudioReactive,
		stageLightsAudioChannel: normalizeFxAudioChannel(
			state.stageLightsAudioChannel,
			DEFAULT_STATE.stageLightsAudioChannel
		),
		stageLightsAudioAmount: finiteOrDefault(
			state.stageLightsAudioAmount,
			DEFAULT_STATE.stageLightsAudioAmount
		),
		stageLightsAudioOscillationAmount: finiteOrDefault(
			state.stageLightsAudioOscillationAmount,
			DEFAULT_STATE.stageLightsAudioOscillationAmount
		),
		stageLightsAudioHoldMs: finiteOrDefault(
			state.stageLightsAudioHoldMs,
			DEFAULT_STATE.stageLightsAudioHoldMs
		),
		stageLightsAudioDecay: finiteOrDefault(
			state.stageLightsAudioDecay,
			DEFAULT_STATE.stageLightsAudioDecay
		),
		stageLightsAudioGateEnabled:
			typeof state.stageLightsAudioGateEnabled === 'boolean'
				? state.stageLightsAudioGateEnabled
				: DEFAULT_STATE.stageLightsAudioGateEnabled,
		stageLightsPeakFlash:
			typeof state.stageLightsPeakFlash === 'boolean'
				? state.stageLightsPeakFlash
				: DEFAULT_STATE.stageLightsPeakFlash,
		stageLightsPeakThreshold: finiteOrDefault(
			state.stageLightsPeakThreshold,
			DEFAULT_STATE.stageLightsPeakThreshold
		),
		stageLightsBandThresholds: normalizeFxBandThresholds(
			state.stageLightsBandThresholds,
			DEFAULT_STATE.stageLightsBandThresholds
		),
		stageLightsOpacity: finiteOrDefault(
			state.stageLightsOpacity,
			DEFAULT_STATE.stageLightsOpacity
		),
		stageLightsBlendMode: normalizeStageLightsBlendMode(
			state.stageLightsBlendMode
		),
		stageLightsOrigin: normalizeStageLightsOrigin(state.stageLightsOrigin),
		stageLightsMovementMode: normalizeStageLightsMovementMode(
			state.stageLightsMovementMode
		),
		stageLightsInvertDirection:
			typeof state.stageLightsInvertDirection === 'boolean'
				? state.stageLightsInvertDirection
				: DEFAULT_STATE.stageLightsInvertDirection,
		stageLightsMirrorDirections:
			typeof state.stageLightsMirrorDirections === 'boolean'
				? state.stageLightsMirrorDirections
				: DEFAULT_STATE.stageLightsMirrorDirections,
		flashLightEnabled:
			typeof state.flashLightEnabled === 'boolean'
				? state.flashLightEnabled
				: state.stageLightsEnabled === true &&
					state.stageLightsPeakFlash === true,
		flashLightIntensity: finiteOrDefault(
			state.flashLightIntensity,
			DEFAULT_STATE.flashLightIntensity
		),
		flashLightColorSource: normalizeColorSourceMode(
			state.flashLightColorSource,
			DEFAULT_STATE.flashLightColorSource
		),
		flashLightColor:
			typeof state.flashLightColor === 'string'
				? state.flashLightColor
				: DEFAULT_STATE.flashLightColor,
		flashLightSoftness: finiteOrDefault(
			state.flashLightSoftness,
			DEFAULT_STATE.flashLightSoftness
		),
		flashLightBrightness: finiteOrDefault(
			state.flashLightBrightness,
			DEFAULT_STATE.flashLightBrightness
		),
		flashLightDecay: finiteOrDefault(
			state.flashLightDecay,
			DEFAULT_STATE.flashLightDecay
		),
		flashLightAudioChannel: normalizeFxAudioChannel(
			state.flashLightAudioChannel ?? state.stageLightsAudioChannel,
			DEFAULT_STATE.flashLightAudioChannel
		),
		flashLightThreshold: finiteOrDefault(
			state.flashLightThreshold,
			finiteOrDefault(
				state.stageLightsPeakThreshold,
				DEFAULT_STATE.flashLightThreshold
			)
		),
		flashLightBandThresholds: normalizeFxBandThresholds(
			state.flashLightBandThresholds,
			DEFAULT_STATE.flashLightBandThresholds
		),
		flashLightSensitivity: finiteOrDefault(
			state.flashLightSensitivity,
			DEFAULT_STATE.flashLightSensitivity
		),
		flashLightRetriggerMs: finiteOrDefault(
			state.flashLightRetriggerMs,
			DEFAULT_STATE.flashLightRetriggerMs
		),
		flashLightShape: normalizeFlashLightShape(state.flashLightShape),
		flashLightBlendMode: normalizeStageLightsBlendMode(
			state.flashLightBlendMode
		),
		cameraFxEnabled:
			typeof state.cameraFxEnabled === 'boolean'
				? state.cameraFxEnabled
				: DEFAULT_STATE.cameraFxEnabled,
		cameraMotionEnabled:
			typeof state.cameraMotionEnabled === 'boolean'
				? state.cameraMotionEnabled
				: typeof state.cameraFxEnabled === 'boolean'
					? state.cameraFxEnabled
					: DEFAULT_STATE.cameraMotionEnabled,
		cameraMotionMode: normalizeCameraMotionMode(state.cameraMotionMode),
		cameraMotionAmount: finiteOrDefault(
			state.cameraMotionAmount,
			DEFAULT_STATE.cameraMotionAmount
		),
		cameraMotionSpeed: finiteOrDefault(
			state.cameraMotionSpeed,
			DEFAULT_STATE.cameraMotionSpeed
		),
		cameraMotionDrive: normalizeCameraMotionDrive(state.cameraMotionDrive),
		cameraMotionAudioInfluence: finiteOrDefault(
			state.cameraMotionAudioInfluence,
			DEFAULT_STATE.cameraMotionAudioInfluence
		),
		cameraMotionAudioChannel: normalizeFxAudioChannel(
			state.cameraMotionAudioChannel,
			DEFAULT_STATE.cameraMotionAudioChannel
		),
		cameraMotionDirection: normalizeCameraMotionDirection(
			state.cameraMotionDirection
		),
		cameraMotionTarget: normalizeCameraMotionTarget(
			state.cameraMotionTarget
		),
		cameraMotionTargets: normalizeCameraMotionTargets(
			state.cameraMotionTargets,
			state.cameraMotionTarget
		),
		cameraShakeEnabled:
			typeof state.cameraShakeEnabled === 'boolean'
				? state.cameraShakeEnabled
				: DEFAULT_STATE.cameraShakeEnabled,
		cameraShakeAmount: finiteOrDefault(
			state.cameraShakeAmount,
			DEFAULT_STATE.cameraShakeAmount
		),
		cameraShakeDecay: finiteOrDefault(
			state.cameraShakeDecay,
			DEFAULT_STATE.cameraShakeDecay
		),
		cameraShakeThreshold: finiteOrDefault(
			state.cameraShakeThreshold,
			DEFAULT_STATE.cameraShakeThreshold
		),
		cameraShakeBandThresholds: normalizeFxBandThresholds(
			state.cameraShakeBandThresholds,
			DEFAULT_STATE.cameraShakeBandThresholds
		),
		cameraShakeTargets: normalizeCameraMotionTargets(
			state.cameraShakeTargets,
			'all'
		),
		cameraShakeSensitivity: finiteOrDefault(
			state.cameraShakeSensitivity,
			DEFAULT_STATE.cameraShakeSensitivity
		),
		cameraShakeRetriggerMs: finiteOrDefault(
			state.cameraShakeRetriggerMs,
			DEFAULT_STATE.cameraShakeRetriggerMs
		),
		cameraShakeChannel: normalizeFxAudioChannel(
			state.cameraShakeChannel,
			DEFAULT_STATE.cameraShakeChannel
		),
		cameraShakeMode: normalizeCameraShakeMode(state.cameraShakeMode),
		cameraShakeFrequency: finiteOrDefault(
			state.cameraShakeFrequency,
			DEFAULT_STATE.cameraShakeFrequency
		),
		cameraShakeRoughness: finiteOrDefault(
			state.cameraShakeRoughness,
			DEFAULT_STATE.cameraShakeRoughness
		),
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
		logoCircularCrop:
			state.logoCircularCrop ?? DEFAULT_STATE.logoCircularCrop,
		logoCropRadius: state.logoCropRadius ?? DEFAULT_STATE.logoCropRadius,
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
		audioFileVolume: state.audioFileVolume ?? DEFAULT_STATE.audioFileVolume,
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
		trackMetadataMode:
			state.trackMetadataMode ?? DEFAULT_STATE.trackMetadataMode,
		trackMetadataAutoSource:
			state.trackMetadataAutoSource ??
			DEFAULT_STATE.trackMetadataAutoSource,
		// Existing configs keep the legacy two-loose-lines layout; only fresh
		// installs (DEFAULT_STATE) default to the cohesive widget.
		nowPlayingMode:
			state.nowPlayingMode ??
			(state.audioTrackTitleEnabled !== undefined
				? 'free'
				: DEFAULT_STATE.nowPlayingMode),
		nowPlayingCoverEnabled:
			state.nowPlayingCoverEnabled ??
			DEFAULT_STATE.nowPlayingCoverEnabled,
		nowPlayingArtistEnabled:
			state.nowPlayingArtistEnabled ??
			DEFAULT_STATE.nowPlayingArtistEnabled,
		nowPlayingProgressEnabled:
			state.nowPlayingProgressEnabled ??
			DEFAULT_STATE.nowPlayingProgressEnabled,
		nowPlayingScale: state.nowPlayingScale ?? DEFAULT_STATE.nowPlayingScale,
		nowPlayingAccentColor:
			state.nowPlayingAccentColor ?? DEFAULT_STATE.nowPlayingAccentColor,
		nowPlayingAccentColorSource:
			state.nowPlayingAccentColorSource ??
			DEFAULT_STATE.nowPlayingAccentColorSource,
		nowPlayingTextTreatment: normalizeNowPlayingTextTreatment(
			state.nowPlayingTextTreatment,
			DEFAULT_STATE.nowPlayingTextTreatment
		),
		trackManualArtist:
			state.trackManualArtist ?? DEFAULT_STATE.trackManualArtist,
		trackManualTitle:
			state.trackManualTitle ?? DEFAULT_STATE.trackManualTitle,
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
		audioTrackTitleGlowReach:
			state.audioTrackTitleGlowReach ??
			DEFAULT_STATE.audioTrackTitleGlowReach,
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
		audioTrackTimeGlowReach:
			state.audioTrackTimeGlowReach ??
			DEFAULT_STATE.audioTrackTimeGlowReach,
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
		audioLyricsEnabled:
			state.audioLyricsEnabled ?? DEFAULT_STATE.audioLyricsEnabled,
		audioLyricsLayoutMode:
			state.audioLyricsLayoutMode ?? DEFAULT_STATE.audioLyricsLayoutMode,
		audioLyricsUppercase:
			state.audioLyricsUppercase ?? DEFAULT_STATE.audioLyricsUppercase,
		audioLyricsPositionX:
			state.audioLyricsPositionX ?? DEFAULT_STATE.audioLyricsPositionX,
		audioLyricsPositionY:
			state.audioLyricsPositionY ?? DEFAULT_STATE.audioLyricsPositionY,
		audioLyricsWidth:
			state.audioLyricsWidth ?? DEFAULT_STATE.audioLyricsWidth,
		audioLyricsFontStyle:
			state.audioLyricsFontStyle ?? DEFAULT_STATE.audioLyricsFontStyle,
		audioLyricsFontSize:
			state.audioLyricsFontSize ?? DEFAULT_STATE.audioLyricsFontSize,
		audioLyricsLetterSpacing:
			state.audioLyricsLetterSpacing ??
			DEFAULT_STATE.audioLyricsLetterSpacing,
		audioLyricsLineHeight:
			state.audioLyricsLineHeight ?? DEFAULT_STATE.audioLyricsLineHeight,
		audioLyricsVisibleLineCount:
			state.audioLyricsVisibleLineCount ??
			DEFAULT_STATE.audioLyricsVisibleLineCount,
		audioLyricsOpacity:
			state.audioLyricsOpacity ?? DEFAULT_STATE.audioLyricsOpacity,
		audioLyricsInactiveOpacity:
			state.audioLyricsInactiveOpacity ??
			DEFAULT_STATE.audioLyricsInactiveOpacity,
		audioLyricsTimeOffsetMs:
			state.audioLyricsTimeOffsetMs ??
			DEFAULT_STATE.audioLyricsTimeOffsetMs,
		audioLyricsActiveColor:
			state.audioLyricsActiveColor ??
			DEFAULT_STATE.audioLyricsActiveColor,
		audioLyricsActiveColorSource: normalizeColorSourceMode(
			state.audioLyricsActiveColorSource,
			DEFAULT_STATE.audioLyricsActiveColorSource
		),
		audioLyricsInactiveColor:
			state.audioLyricsInactiveColor ??
			DEFAULT_STATE.audioLyricsInactiveColor,
		audioLyricsInactiveColorSource: normalizeColorSourceMode(
			state.audioLyricsInactiveColorSource,
			DEFAULT_STATE.audioLyricsInactiveColorSource
		),
		audioLyricsTextTreatment: normalizeNowPlayingTextTreatment(
			state.audioLyricsTextTreatment,
			DEFAULT_STATE.audioLyricsTextTreatment
		),
		audioLyricsStrokeColor:
			state.audioLyricsStrokeColor ??
			DEFAULT_STATE.audioLyricsStrokeColor,
		audioLyricsStrokeColorSource: normalizeColorSourceMode(
			state.audioLyricsStrokeColorSource,
			DEFAULT_STATE.audioLyricsStrokeColorSource
		),
		audioLyricsStrokeWidth:
			state.audioLyricsStrokeWidth ??
			DEFAULT_STATE.audioLyricsStrokeWidth,
		audioLyricsGlowColor:
			state.audioLyricsGlowColor ?? DEFAULT_STATE.audioLyricsGlowColor,
		audioLyricsGlowColorSource: normalizeColorSourceMode(
			state.audioLyricsGlowColorSource,
			DEFAULT_STATE.audioLyricsGlowColorSource
		),
		audioLyricsGlowBlur:
			state.audioLyricsGlowBlur ?? DEFAULT_STATE.audioLyricsGlowBlur,
		audioLyricsGlowReach:
			state.audioLyricsGlowReach ?? DEFAULT_STATE.audioLyricsGlowReach,
		audioLyricsTransitionIn: normalizeLyricsTextTransition(
			state.audioLyricsTransitionIn,
			DEFAULT_STATE.audioLyricsTransitionIn
		),
		audioLyricsTransitionOut: normalizeLyricsTextTransition(
			state.audioLyricsTransitionOut,
			DEFAULT_STATE.audioLyricsTransitionOut
		),
		audioLyricsActiveAnimation: normalizeLyricsActiveAnimation(
			state.audioLyricsActiveAnimation,
			DEFAULT_STATE.audioLyricsActiveAnimation
		),
		audioLyricsAnimationDurationMs:
			state.audioLyricsAnimationDurationMs ??
			DEFAULT_STATE.audioLyricsAnimationDurationMs,
		audioLyricsBackdropEnabled:
			state.audioLyricsBackdropEnabled ??
			DEFAULT_STATE.audioLyricsBackdropEnabled,
		audioLyricsBackdropColor:
			state.audioLyricsBackdropColor ??
			DEFAULT_STATE.audioLyricsBackdropColor,
		audioLyricsBackdropColorSource: normalizeColorSourceMode(
			state.audioLyricsBackdropColorSource,
			DEFAULT_STATE.audioLyricsBackdropColorSource
		),
		audioLyricsBackdropOpacity:
			state.audioLyricsBackdropOpacity ??
			DEFAULT_STATE.audioLyricsBackdropOpacity,
		audioLyricsBackdropPadding:
			state.audioLyricsBackdropPadding ??
			DEFAULT_STATE.audioLyricsBackdropPadding,
		audioLyricsBackdropRadius:
			state.audioLyricsBackdropRadius ??
			DEFAULT_STATE.audioLyricsBackdropRadius,
		audioLyricsByTrackAssetId: normalizeAudioLyricsTrackEntries(
			state.audioLyricsByTrackAssetId
		),
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
		rgbShiftAudioSmoothing:
			state.rgbShiftAudioSmoothing ??
			DEFAULT_STATE.rgbShiftAudioSmoothing,
		rgbShiftAudioAttack:
			state.rgbShiftAudioAttack ?? DEFAULT_STATE.rgbShiftAudioAttack,
		rgbShiftAudioRelease:
			state.rgbShiftAudioRelease ?? DEFAULT_STATE.rgbShiftAudioRelease,
		rgbShiftAudioReactivitySpeed:
			state.rgbShiftAudioReactivitySpeed ??
			DEFAULT_STATE.rgbShiftAudioReactivitySpeed,
		rgbShiftAudioPeakWindow:
			state.rgbShiftAudioPeakWindow ??
			DEFAULT_STATE.rgbShiftAudioPeakWindow,
		rgbShiftAudioPeakFloor:
			state.rgbShiftAudioPeakFloor ??
			DEFAULT_STATE.rgbShiftAudioPeakFloor,
		rgbShiftAudioPunch:
			state.rgbShiftAudioPunch ?? DEFAULT_STATE.rgbShiftAudioPunch,
		slideshowTransitionAudioSmoothing:
			state.slideshowTransitionAudioSmoothing ??
			DEFAULT_STATE.slideshowTransitionAudioSmoothing,
		particleGlowAudioAmount:
			state.particleGlowAudioAmount ??
			DEFAULT_STATE.particleGlowAudioAmount,
		particleAudioChannel: normalizeAudioChannel(
			state.particleAudioChannel,
			DEFAULT_STATE.particleAudioChannel
		),
		particleAudioSmoothing:
			state.particleAudioSmoothing ??
			DEFAULT_STATE.particleAudioSmoothing,
		particleAudioAttack:
			state.particleAudioAttack ?? DEFAULT_STATE.particleAudioAttack,
		particleAudioRelease:
			state.particleAudioRelease ?? DEFAULT_STATE.particleAudioRelease,
		particleAudioReactivitySpeed:
			state.particleAudioReactivitySpeed ??
			DEFAULT_STATE.particleAudioReactivitySpeed,
		particleAudioPeakWindow:
			state.particleAudioPeakWindow ??
			DEFAULT_STATE.particleAudioPeakWindow,
		particleAudioPeakFloor:
			state.particleAudioPeakFloor ??
			DEFAULT_STATE.particleAudioPeakFloor,
		particleAudioPunch:
			state.particleAudioPunch ?? DEFAULT_STATE.particleAudioPunch,
		particleAudioDriftEnabled:
			typeof state.particleAudioDriftEnabled === 'boolean'
				? state.particleAudioDriftEnabled
				: DEFAULT_STATE.particleAudioDriftEnabled,
		particleAudioDriftAngle:
			state.particleAudioDriftAngle ??
			DEFAULT_STATE.particleAudioDriftAngle,
		particleAudioDriftAmount:
			state.particleAudioDriftAmount ??
			DEFAULT_STATE.particleAudioDriftAmount,
		particleAudioDriftBase:
			state.particleAudioDriftBase ??
			DEFAULT_STATE.particleAudioDriftBase,
		particleAudioDriftChannel: normalizeAudioChannel(
			state.particleAudioDriftChannel,
			DEFAULT_STATE.particleAudioDriftChannel
		),
		particleAudioDriftThreshold:
			state.particleAudioDriftThreshold ??
			DEFAULT_STATE.particleAudioDriftThreshold,
		particleAudioDriftRelease:
			state.particleAudioDriftRelease ??
			DEFAULT_STATE.particleAudioDriftRelease,
		particleAudioDriftMode: normalizeParticleAudioDriftMode(
			state.particleAudioDriftMode,
			DEFAULT_STATE.particleAudioDriftMode
		),
		particleDepthFlowEnabled:
			typeof state.particleDepthFlowEnabled === 'boolean'
				? state.particleDepthFlowEnabled
				: DEFAULT_STATE.particleDepthFlowEnabled,
		particleDepthFlowAmount:
			state.particleDepthFlowAmount ??
			DEFAULT_STATE.particleDepthFlowAmount,
		particleDepthFlowDirection: normalizeParticleDepthFlowDirection(
			state.particleDepthFlowDirection,
			DEFAULT_STATE.particleDepthFlowDirection
		),
		particleDepthFlowChannel: normalizeAudioChannel(
			state.particleDepthFlowChannel,
			DEFAULT_STATE.particleDepthFlowChannel
		),
		particleDepthFlowThreshold:
			state.particleDepthFlowThreshold ??
			DEFAULT_STATE.particleDepthFlowThreshold,
		particleDepthFlowSensitivity:
			state.particleDepthFlowSensitivity ??
			DEFAULT_STATE.particleDepthFlowSensitivity,
		particleDepthFlowAttack:
			state.particleDepthFlowAttack ??
			DEFAULT_STATE.particleDepthFlowAttack,
		particleDepthFlowRelease:
			state.particleDepthFlowRelease ??
			DEFAULT_STATE.particleDepthFlowRelease,
		particleDepthFlowSpeed:
			state.particleDepthFlowSpeed ??
			DEFAULT_STATE.particleDepthFlowSpeed,
		particleDepthFlowSpread:
			state.particleDepthFlowSpread ??
			DEFAULT_STATE.particleDepthFlowSpread,
		particleDepthFlowFocusX:
			state.particleDepthFlowFocusX ??
			DEFAULT_STATE.particleDepthFlowFocusX,
		particleDepthFlowFocusY:
			state.particleDepthFlowFocusY ??
			DEFAULT_STATE.particleDepthFlowFocusY,
		particleDepthFlowMode: normalizeParticleDepthFlowMode(
			state.particleDepthFlowMode,
			DEFAULT_STATE.particleDepthFlowMode
		),
		particleDepthFlowSpawnOrigin: normalizeParticleDepthFlowSpawnOrigin(
			state.particleDepthFlowSpawnOrigin,
			DEFAULT_STATE.particleDepthFlowSpawnOrigin
		),
		particleDepthFlowInvertFocusOnLowEnergy:
			typeof state.particleDepthFlowInvertFocusOnLowEnergy === 'boolean'
				? state.particleDepthFlowInvertFocusOnLowEnergy
				: typeof state.particleAudioDriftInvertOnLowEnergy === 'boolean'
					? state.particleAudioDriftInvertOnLowEnergy
					: DEFAULT_STATE.particleDepthFlowInvertFocusOnLowEnergy,
		particleDepthFlowInvertFocusAxis:
			normalizeParticleDepthFlowLowEnergyAxis(
				state.particleDepthFlowInvertFocusAxis,
				DEFAULT_STATE.particleDepthFlowInvertFocusAxis
			),
		particleDepthFlowWindInfluence:
			state.particleDepthFlowWindInfluence ??
			DEFAULT_STATE.particleDepthFlowWindInfluence,
		particleLifetime:
			state.particleLifetime ?? DEFAULT_STATE.particleLifetime,
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
		spectrumAudioSmoothing:
			state.spectrumAudioSmoothing ??
			DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumGlowAudioAmount:
			state.spectrumGlowAudioAmount ??
			DEFAULT_STATE.spectrumGlowAudioAmount,
		spectrumPositionX: state.spectrumPositionX ?? legacySpectrumPositionX,
		spectrumPositionY: state.spectrumPositionY ?? legacySpectrumPositionY,
		logoAudioSmoothing:
			state.logoAudioSmoothing ?? DEFAULT_STATE.logoAudioSmoothing,
		logoGlowAudioAmount:
			state.logoGlowAudioAmount ?? DEFAULT_STATE.logoGlowAudioAmount,
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
		controlPanelOffsetX:
			state.controlPanelOffsetX ?? DEFAULT_STATE.controlPanelOffsetX,
		controlPanelOffsetY:
			state.controlPanelOffsetY ?? DEFAULT_STATE.controlPanelOffsetY,
		quickEditHudEnabled:
			typeof state.quickEditHudEnabled === 'boolean'
				? state.quickEditHudEnabled
				: DEFAULT_STATE.quickEditHudEnabled,
		quickEditCaptureMode:
			state.quickEditCaptureMode === 'total' ||
			state.quickEditCaptureMode === 'selection'
				? state.quickEditCaptureMode
				: DEFAULT_STATE.quickEditCaptureMode,
		colorFavorites: (() => {
			const stored = Array.isArray(state.colorFavorites)
				? state.colorFavorites.filter(
						(entry): entry is string => typeof entry === 'string'
					)
				: [];
			// Seed the curated starter palette for fresh/legacy installs whose
			// favourites strip is still empty; keep any user-curated list as-is.
			return stored.length > 0 ? stored : DEFAULT_STATE.colorFavorites;
		})(),
		fpsOverlayAnchor:
			state.fpsOverlayAnchor ?? DEFAULT_STATE.fpsOverlayAnchor,
		editorTheme: state.editorTheme ?? DEFAULT_STATE.editorTheme,
		editorImagePreviewQuality:
			state.editorImagePreviewQuality === 'original' ||
			state.editorImagePreviewQuality === 'optimized'
				? state.editorImagePreviewQuality
				: DEFAULT_STATE.editorImagePreviewQuality,
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
		editorShowPreciseNumericControls:
			typeof state.editorShowPreciseNumericControls === 'boolean'
				? state.editorShowPreciseNumericControls
				: DEFAULT_STATE.editorShowPreciseNumericControls,
		editorCompactSlotIcons:
			typeof state.editorCompactSlotIcons === 'boolean'
				? state.editorCompactSlotIcons
				: DEFAULT_STATE.editorCompactSlotIcons,
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
			state.quickActionsLauncherSize ??
			DEFAULT_STATE.quickActionsLauncherSize,
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
			state.sleepModeDelaySeconds ?? DEFAULT_STATE.sleepModeDelaySeconds,
		sleepModeActive: DEFAULT_STATE.sleepModeActive,
		virtualFoldersEnabled:
			state.virtualFoldersEnabled ?? DEFAULT_STATE.virtualFoldersEnabled,
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
		lightsProfileSlots: migrateLightsProfileSlots(state),
		cameraFxProfileSlots: migrateCameraFxProfileSlots(state),
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
		spectrumFrameHistoryDepth:
			state.spectrumFrameHistoryDepth ??
			DEFAULT_STATE.spectrumFrameHistoryDepth,
		spectrumGainExpressiveness:
			state.spectrumGainExpressiveness ??
			DEFAULT_STATE.spectrumGainExpressiveness,
		spectrumEnvelopeAttack:
			state.spectrumEnvelopeAttack ??
			DEFAULT_STATE.spectrumEnvelopeAttack,
		spectrumEnvelopeRelease:
			state.spectrumEnvelopeRelease ??
			DEFAULT_STATE.spectrumEnvelopeRelease,
		spectrumEnvelopeReactivitySpeed:
			state.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumEnvelopeReactivitySpeed,
		spectrumEnvelopePeakWindow:
			state.spectrumEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumEnvelopePeakWindow,
		spectrumEnvelopePeakFloor:
			state.spectrumEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumEnvelopePeakFloor,
		spectrumEnvelopePunch:
			state.spectrumEnvelopePunch ?? DEFAULT_STATE.spectrumEnvelopePunch,
		spectrumPeakRibbons:
			state.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwave:
			state.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			state.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumShockwaveBandThresholds,
			...state.spectrumShockwaveBandThresholds
		},
		spectrumShockwaveThickness:
			state.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			state.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			state.spectrumShockwaveBlur ?? DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			state.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloom:
			state.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			state.spectrumPeakRibbonAngle ??
			DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumFigureRotationSpeed:
			state.spectrumFigureRotationSpeed ??
			DEFAULT_STATE.spectrumFigureRotationSpeed,
		spectrumOscilloscopeLineWidth:
			state.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			state.spectrumTunnelRingCount ??
			DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumTunnelDepthFalloff:
			state.spectrumTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumTunnelDepthFalloff,
		spectrumTunnelRingSpacing:
			state.spectrumTunnelRingSpacing ??
			DEFAULT_STATE.spectrumTunnelRingSpacing,
		spectrumTunnelWallOpacity:
			state.spectrumTunnelWallOpacity ??
			DEFAULT_STATE.spectrumTunnelWallOpacity,
		spectrumTunnelPulseStrength:
			state.spectrumTunnelPulseStrength ??
			DEFAULT_STATE.spectrumTunnelPulseStrength,
		spectrumTunnelAlternateRotation:
			state.spectrumTunnelAlternateRotation ??
			DEFAULT_STATE.spectrumTunnelAlternateRotation,
		spectrumLiquidLayer1Opacity:
			state.spectrumLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer1Opacity,
		spectrumLiquidLayer2Opacity:
			state.spectrumLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer2Opacity,
		spectrumLiquidLayer3Opacity:
			state.spectrumLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer3Opacity,
		spectrumLiquidLayer1Amp:
			state.spectrumLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumLiquidLayer1Amp,
		spectrumLiquidLayer2Amp:
			state.spectrumLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumLiquidLayer2Amp,
		spectrumLiquidLayer3Amp:
			state.spectrumLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumLiquidLayer3Amp,
		spectrumLiquidLayer1Fill:
			state.spectrumLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumLiquidLayer1Fill,
		spectrumLiquidLayer2Fill:
			state.spectrumLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumLiquidLayer2Fill,
		spectrumLiquidLayer3Fill:
			state.spectrumLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumLiquidLayer3Fill,
		spectrumLiquidLayer1Speed:
			state.spectrumLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumLiquidLayer1Speed,
		spectrumLiquidLayer2Speed:
			state.spectrumLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumLiquidLayer2Speed,
		spectrumLiquidLayer3Speed:
			state.spectrumLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumLiquidLayer3Speed,
		spectrumLiquidLayer1RotationSpeed:
			state.spectrumLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer1RotationSpeed,
		spectrumLiquidLayer2RotationSpeed:
			state.spectrumLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer2RotationSpeed,
		spectrumLiquidLayer3RotationSpeed:
			state.spectrumLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer3RotationSpeed,
		spectrumLiquidLayer1Shape:
			state.spectrumLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumLiquidLayer1Shape,
		spectrumLiquidLayer2Shape:
			state.spectrumLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumLiquidLayer2Shape,
		spectrumLiquidLayer3Shape:
			state.spectrumLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumLiquidLayer3Shape,
		spectrumLiquidLayer1RigidShape: resolveLegacyLiquidRigidShape(state, 1),
		spectrumLiquidLayer2RigidShape: resolveLegacyLiquidRigidShape(state, 2),
		spectrumLiquidLayer3RigidShape: resolveLegacyLiquidRigidShape(state, 3),
		spectrumSpiralTurns:
			state.spectrumSpiralTurns ?? DEFAULT_STATE.spectrumSpiralTurns,
		spectrumSpiralOuterRadius:
			state.spectrumSpiralOuterRadius ??
			DEFAULT_STATE.spectrumSpiralOuterRadius,
		spectrumSpiralTightness:
			state.spectrumSpiralTightness ??
			DEFAULT_STATE.spectrumSpiralTightness,
		spectrumSpiralShape:
			state.spectrumSpiralShape ?? DEFAULT_STATE.spectrumSpiralShape,
		spectrumSpiralLogarithmic:
			typeof state.spectrumSpiralLogarithmic === 'boolean'
				? state.spectrumSpiralLogarithmic
				: DEFAULT_STATE.spectrumSpiralLogarithmic,
		spectrumSpiralGradientStroke:
			typeof state.spectrumSpiralGradientStroke === 'boolean'
				? state.spectrumSpiralGradientStroke
				: DEFAULT_STATE.spectrumSpiralGradientStroke,
		spectrumSpiralArms:
			state.spectrumSpiralArms ?? DEFAULT_STATE.spectrumSpiralArms,
		spectrumSpiralAudioTurns:
			state.spectrumSpiralAudioTurns ??
			DEFAULT_STATE.spectrumSpiralAudioTurns,
		spectrumSpiralDotShape:
			state.spectrumSpiralDotShape ??
			DEFAULT_STATE.spectrumSpiralDotShape,
		spectrumSpiralStrokeWidth:
			state.spectrumSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumSpiralStrokeWidth,
		spectrumOscilloscopeScrollSpeed:
			state.spectrumOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumOscilloscopeScrollSpeed,
		spectrumOscilloscopeReactiveWidth:
			typeof state.spectrumOscilloscopeReactiveWidth === 'boolean'
				? state.spectrumOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumOscilloscopeReactiveWidth,
		spectrumOscilloscopePhosphor:
			typeof state.spectrumOscilloscopePhosphor === 'boolean'
				? state.spectrumOscilloscopePhosphor
				: DEFAULT_STATE.spectrumOscilloscopePhosphor,
		spectrumOscilloscopePhosphorDecay:
			state.spectrumOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumOscilloscopePhosphorDecay,
		spectrumOscilloscopeGrid:
			typeof state.spectrumOscilloscopeGrid === 'boolean'
				? state.spectrumOscilloscopeGrid
				: DEFAULT_STATE.spectrumOscilloscopeGrid,
		spectrumOscilloscopeGridDivisions:
			state.spectrumOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumOscilloscopeGridDivisions,
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
		calibrationRangeOverrides:
			state.calibrationRangeOverrides &&
			typeof state.calibrationRangeOverrides === 'object'
				? state.calibrationRangeOverrides
				: DEFAULT_STATE.calibrationRangeOverrides,
		calibrationProfileSlots: Array.isArray(state.calibrationProfileSlots)
			? state.calibrationProfileSlots
			: DEFAULT_STATE.calibrationProfileSlots,

		// Logo Edge Glow
		logoEdgeGlowEnabled:
			state.logoEdgeGlowEnabled ?? DEFAULT_STATE.logoEdgeGlowEnabled,
		logoEdgeGlowIntensity: finiteOrDefault(
			state.logoEdgeGlowIntensity,
			DEFAULT_STATE.logoEdgeGlowIntensity
		),
		logoEdgeGlowThickness: finiteOrDefault(
			state.logoEdgeGlowThickness,
			DEFAULT_STATE.logoEdgeGlowThickness
		),
		logoEdgeGlowRadius: finiteOrDefault(
			state.logoEdgeGlowRadius,
			DEFAULT_STATE.logoEdgeGlowRadius
		),
		logoEdgeGlowExpansionRadius: finiteOrDefault(
			state.logoEdgeGlowExpansionRadius,
			DEFAULT_STATE.logoEdgeGlowExpansionRadius
		),
		logoEdgeGlowOpacity: finiteOrDefault(
			state.logoEdgeGlowOpacity,
			DEFAULT_STATE.logoEdgeGlowOpacity
		),
		logoEdgeGlowColorSource: normalizeColorSourceMode(
			state.logoEdgeGlowColorSource,
			DEFAULT_STATE.logoEdgeGlowColorSource
		),
		logoEdgeGlowColor:
			typeof state.logoEdgeGlowColor === 'string'
				? state.logoEdgeGlowColor
				: DEFAULT_STATE.logoEdgeGlowColor,
		logoEdgeGlowBlendMode:
			state.logoEdgeGlowBlendMode === 'lighter' ||
			state.logoEdgeGlowBlendMode === 'screen' ||
			state.logoEdgeGlowBlendMode === 'source-over'
				? state.logoEdgeGlowBlendMode
				: DEFAULT_STATE.logoEdgeGlowBlendMode,
		logoEdgeGlowAudioChannel: normalizeFxAudioChannel(
			state.logoEdgeGlowAudioChannel,
			DEFAULT_STATE.logoEdgeGlowAudioChannel
		),
		logoEdgeGlowThreshold: finiteOrDefault(
			state.logoEdgeGlowThreshold,
			DEFAULT_STATE.logoEdgeGlowThreshold
		),
		logoEdgeGlowAttack: finiteOrDefault(
			state.logoEdgeGlowAttack,
			DEFAULT_STATE.logoEdgeGlowAttack
		),
		logoEdgeGlowRelease: finiteOrDefault(
			state.logoEdgeGlowRelease,
			DEFAULT_STATE.logoEdgeGlowRelease
		),
		logoEdgeGlowSensitivity: finiteOrDefault(
			state.logoEdgeGlowSensitivity,
			DEFAULT_STATE.logoEdgeGlowSensitivity
		),

		// Background Edge Glow
		bgEdgeGlowEnabled:
			state.bgEdgeGlowEnabled ?? DEFAULT_STATE.bgEdgeGlowEnabled,
		bgEdgeGlowIntensity: finiteOrDefault(
			state.bgEdgeGlowIntensity,
			DEFAULT_STATE.bgEdgeGlowIntensity
		),
		bgEdgeGlowThickness: finiteOrDefault(
			state.bgEdgeGlowThickness,
			DEFAULT_STATE.bgEdgeGlowThickness
		),
		bgEdgeGlowRadius: finiteOrDefault(
			state.bgEdgeGlowRadius,
			DEFAULT_STATE.bgEdgeGlowRadius
		),
		bgEdgeGlowExpansionRadius: finiteOrDefault(
			state.bgEdgeGlowExpansionRadius,
			DEFAULT_STATE.bgEdgeGlowExpansionRadius
		),
		bgEdgeGlowOpacity: finiteOrDefault(
			state.bgEdgeGlowOpacity,
			DEFAULT_STATE.bgEdgeGlowOpacity
		),
		bgEdgeGlowColorSource: normalizeColorSourceMode(
			state.bgEdgeGlowColorSource,
			DEFAULT_STATE.bgEdgeGlowColorSource
		),
		bgEdgeGlowColor:
			typeof state.bgEdgeGlowColor === 'string'
				? state.bgEdgeGlowColor
				: DEFAULT_STATE.bgEdgeGlowColor,
		bgEdgeGlowBlendMode:
			state.bgEdgeGlowBlendMode === 'lighter' ||
			state.bgEdgeGlowBlendMode === 'screen' ||
			state.bgEdgeGlowBlendMode === 'source-over'
				? state.bgEdgeGlowBlendMode
				: DEFAULT_STATE.bgEdgeGlowBlendMode,
		bgEdgeGlowAudioChannel: normalizeFxAudioChannel(
			state.bgEdgeGlowAudioChannel,
			DEFAULT_STATE.bgEdgeGlowAudioChannel
		),
		bgEdgeGlowThreshold: finiteOrDefault(
			state.bgEdgeGlowThreshold,
			DEFAULT_STATE.bgEdgeGlowThreshold
		),
		bgEdgeGlowAttack: finiteOrDefault(
			state.bgEdgeGlowAttack,
			DEFAULT_STATE.bgEdgeGlowAttack
		),
		bgEdgeGlowRelease: finiteOrDefault(
			state.bgEdgeGlowRelease,
			DEFAULT_STATE.bgEdgeGlowRelease
		),
		bgEdgeGlowSensitivity: finiteOrDefault(
			state.bgEdgeGlowSensitivity,
			DEFAULT_STATE.bgEdgeGlowSensitivity
		),

		// Logo Flash Edge
		logoFlashEdgeEnabled:
			state.logoFlashEdgeEnabled ?? DEFAULT_STATE.logoFlashEdgeEnabled,
		logoFlashEdgeIntensityMult: finiteOrDefault(
			state.logoFlashEdgeIntensityMult,
			DEFAULT_STATE.logoFlashEdgeIntensityMult
		),
		logoFlashEdgeThickness: finiteOrDefault(
			state.logoFlashEdgeThickness,
			DEFAULT_STATE.logoFlashEdgeThickness
		),
		logoFlashEdgeRadius: finiteOrDefault(
			state.logoFlashEdgeRadius,
			DEFAULT_STATE.logoFlashEdgeRadius
		),
		logoFlashEdgeColorMode:
			state.logoFlashEdgeColorMode === 'flash' ||
			state.logoFlashEdgeColorMode === 'manual'
				? state.logoFlashEdgeColorMode
				: DEFAULT_STATE.logoFlashEdgeColorMode,
		logoFlashEdgeColor:
			typeof state.logoFlashEdgeColor === 'string'
				? state.logoFlashEdgeColor
				: DEFAULT_STATE.logoFlashEdgeColor,

		// Background Flash Edge
		bgFlashEdgeEnabled:
			state.bgFlashEdgeEnabled ?? DEFAULT_STATE.bgFlashEdgeEnabled,
		bgFlashEdgeIntensityMult: finiteOrDefault(
			state.bgFlashEdgeIntensityMult,
			DEFAULT_STATE.bgFlashEdgeIntensityMult
		),
		bgFlashEdgeThickness: finiteOrDefault(
			state.bgFlashEdgeThickness,
			DEFAULT_STATE.bgFlashEdgeThickness
		),
		bgFlashEdgeRadius: finiteOrDefault(
			state.bgFlashEdgeRadius,
			DEFAULT_STATE.bgFlashEdgeRadius
		),
		bgFlashEdgeColorMode:
			state.bgFlashEdgeColorMode === 'flash' ||
			state.bgFlashEdgeColorMode === 'manual'
				? state.bgFlashEdgeColorMode
				: DEFAULT_STATE.bgFlashEdgeColorMode,
		bgFlashEdgeColor:
			typeof state.bgFlashEdgeColor === 'string'
				? state.bgFlashEdgeColor
				: DEFAULT_STATE.bgFlashEdgeColor
	} as WallpaperStore;

	return normalizeSpectrumSettings(migratedState) as WallpaperStore;
}
