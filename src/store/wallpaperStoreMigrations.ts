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
				typeof s.looksSlotIndex === 'number' ? s.looksSlotIndex : null,
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
	spectrumCloneLiquidRigidShape?: unknown;
};

/**
 * Resolves the per-layer rigidShape field for both new (per-layer)
 * persisted state and legacy state where rigidShape was a single global
 * flag. The legacy single-flag value seeds all 3 layers so users who had
 * the rigid shape enabled before keep the same visual after migration.
 */
function resolveLegacyLiquidRigidShape(
	source: LegacyLiquidSource,
	layer: 1 | 2 | 3,
	target: 'main' | 'clone'
): boolean {
	const newKey =
		target === 'clone'
			? (`spectrumCloneLiquidLayer${layer}RigidShape` as const)
			: (`spectrumLiquidLayer${layer}RigidShape` as const);
	const direct = source[newKey];
	if (typeof direct === 'boolean') return direct;
	const legacy =
		target === 'clone'
			? source.spectrumCloneLiquidRigidShape
			: source.spectrumLiquidRigidShape;
	if (typeof legacy === 'boolean') return legacy;
	const fallback =
		target === 'clone'
			? DEFAULT_STATE[
					`spectrumCloneLiquidLayer${layer}RigidShape` as const
				]
			: DEFAULT_STATE[`spectrumLiquidLayer${layer}RigidShape` as const];
	return fallback as boolean;
}

function migrateSpectrumProfileSlots(state: Partial<WallpaperStore>) {
	const hydrateSpectrumSlotValues = (
		values: NonNullable<
			NonNullable<
				WallpaperStore['spectrumProfileSlots'][number]['values']
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
		spectrumFrameHistoryDepth:
			values.spectrumFrameHistoryDepth ??
			DEFAULT_STATE.spectrumFrameHistoryDepth,
		spectrumGainExpressiveness:
			values.spectrumGainExpressiveness ??
			DEFAULT_STATE.spectrumGainExpressiveness,
		spectrumEnvelopeAttack:
			values.spectrumEnvelopeAttack ??
			DEFAULT_STATE.spectrumEnvelopeAttack,
		spectrumEnvelopeRelease:
			values.spectrumEnvelopeRelease ??
			DEFAULT_STATE.spectrumEnvelopeRelease,
		spectrumEnvelopeReactivitySpeed:
			values.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumEnvelopeReactivitySpeed,
		spectrumEnvelopePeakWindow:
			values.spectrumEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumEnvelopePeakWindow,
		spectrumEnvelopePeakFloor:
			values.spectrumEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumEnvelopePeakFloor,
		spectrumEnvelopePunch:
			values.spectrumEnvelopePunch ?? DEFAULT_STATE.spectrumEnvelopePunch,
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwave:
			values.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			values.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumShockwaveBandThresholds,
			...values.spectrumShockwaveBandThresholds
		},
		spectrumShockwaveThickness:
			values.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			values.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			values.spectrumShockwaveBlur ?? DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			values.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ??
			DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumFigureRotationSpeed:
			values.spectrumFigureRotationSpeed ??
			DEFAULT_STATE.spectrumFigureRotationSpeed,
		spectrumClonePeakRibbons:
			values.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			values.spectrumCloneAfterglow ??
			DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			values.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			values.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneFrameHistoryDepth:
			values.spectrumCloneFrameHistoryDepth ??
			values.spectrumFrameHistoryDepth ??
			DEFAULT_STATE.spectrumCloneFrameHistoryDepth,
		spectrumCloneGainExpressiveness:
			values.spectrumCloneGainExpressiveness ??
			values.spectrumGainExpressiveness ??
			DEFAULT_STATE.spectrumCloneGainExpressiveness,
		spectrumCloneEnvelopeAttack:
			values.spectrumCloneEnvelopeAttack ??
			values.spectrumEnvelopeAttack ??
			DEFAULT_STATE.spectrumCloneEnvelopeAttack,
		spectrumCloneEnvelopeRelease:
			values.spectrumCloneEnvelopeRelease ??
			values.spectrumEnvelopeRelease ??
			DEFAULT_STATE.spectrumCloneEnvelopeRelease,
		spectrumCloneEnvelopeReactivitySpeed:
			values.spectrumCloneEnvelopeReactivitySpeed ??
			values.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumCloneEnvelopeReactivitySpeed,
		spectrumCloneEnvelopePeakWindow:
			values.spectrumCloneEnvelopePeakWindow ??
			values.spectrumEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakWindow,
		spectrumCloneEnvelopePeakFloor:
			values.spectrumCloneEnvelopePeakFloor ??
			values.spectrumEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakFloor,
		spectrumCloneEnvelopePunch:
			values.spectrumCloneEnvelopePunch ??
			values.spectrumEnvelopePunch ??
			DEFAULT_STATE.spectrumCloneEnvelopePunch,
		spectrumCloneEnergyBloom:
			values.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			values.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			values.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
		spectrumCloneShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumCloneShockwaveBandThresholds,
			...values.spectrumCloneShockwaveBandThresholds
		},
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
		spectrumCloneFigureRotationSpeed:
			values.spectrumCloneFigureRotationSpeed ??
			DEFAULT_STATE.spectrumCloneFigureRotationSpeed,
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ??
			DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumTunnelDepthFalloff:
			values.spectrumTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumTunnelDepthFalloff,
		spectrumTunnelRingSpacing:
			values.spectrumTunnelRingSpacing ??
			DEFAULT_STATE.spectrumTunnelRingSpacing,
		spectrumTunnelWallOpacity:
			values.spectrumTunnelWallOpacity ??
			DEFAULT_STATE.spectrumTunnelWallOpacity,
		spectrumTunnelPulseStrength:
			values.spectrumTunnelPulseStrength ??
			DEFAULT_STATE.spectrumTunnelPulseStrength,
		spectrumTunnelAlternateRotation:
			values.spectrumTunnelAlternateRotation ??
			DEFAULT_STATE.spectrumTunnelAlternateRotation,
		spectrumLiquidLayer1Opacity:
			values.spectrumLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer1Opacity,
		spectrumLiquidLayer2Opacity:
			values.spectrumLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer2Opacity,
		spectrumLiquidLayer3Opacity:
			values.spectrumLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer3Opacity,
		spectrumLiquidLayer1Amp:
			values.spectrumLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumLiquidLayer1Amp,
		spectrumLiquidLayer2Amp:
			values.spectrumLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumLiquidLayer2Amp,
		spectrumLiquidLayer3Amp:
			values.spectrumLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumLiquidLayer3Amp,
		spectrumLiquidLayer1Fill:
			values.spectrumLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumLiquidLayer1Fill,
		spectrumLiquidLayer2Fill:
			values.spectrumLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumLiquidLayer2Fill,
		spectrumLiquidLayer3Fill:
			values.spectrumLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumLiquidLayer3Fill,
		spectrumLiquidLayer1Speed:
			values.spectrumLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumLiquidLayer1Speed,
		spectrumLiquidLayer2Speed:
			values.spectrumLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumLiquidLayer2Speed,
		spectrumLiquidLayer3Speed:
			values.spectrumLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumLiquidLayer3Speed,
		spectrumLiquidLayer1RotationSpeed:
			values.spectrumLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer1RotationSpeed,
		spectrumLiquidLayer2RotationSpeed:
			values.spectrumLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer2RotationSpeed,
		spectrumLiquidLayer3RotationSpeed:
			values.spectrumLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer3RotationSpeed,
		spectrumLiquidLayer1Shape:
			values.spectrumLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumLiquidLayer1Shape,
		spectrumLiquidLayer2Shape:
			values.spectrumLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumLiquidLayer2Shape,
		spectrumLiquidLayer3Shape:
			values.spectrumLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumLiquidLayer3Shape,
		spectrumLiquidLayer1RigidShape: resolveLegacyLiquidRigidShape(
			values,
			1,
			'main'
		),
		spectrumLiquidLayer2RigidShape: resolveLegacyLiquidRigidShape(
			values,
			2,
			'main'
		),
		spectrumLiquidLayer3RigidShape: resolveLegacyLiquidRigidShape(
			values,
			3,
			'main'
		),
		spectrumCloneTunnelRingCount:
			values.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumCloneTunnelDepthFalloff:
			values.spectrumCloneTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumCloneTunnelDepthFalloff,
		spectrumCloneTunnelRingSpacing:
			values.spectrumCloneTunnelRingSpacing ??
			DEFAULT_STATE.spectrumCloneTunnelRingSpacing,
		spectrumCloneTunnelWallOpacity:
			values.spectrumCloneTunnelWallOpacity ??
			DEFAULT_STATE.spectrumCloneTunnelWallOpacity,
		spectrumCloneTunnelPulseStrength:
			values.spectrumCloneTunnelPulseStrength ??
			DEFAULT_STATE.spectrumCloneTunnelPulseStrength,
		spectrumCloneTunnelAlternateRotation:
			typeof values.spectrumCloneTunnelAlternateRotation === 'boolean'
				? values.spectrumCloneTunnelAlternateRotation
				: DEFAULT_STATE.spectrumCloneTunnelAlternateRotation,
		spectrumCloneLiquidLayer1Opacity:
			values.spectrumCloneLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Opacity,
		spectrumCloneLiquidLayer2Opacity:
			values.spectrumCloneLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Opacity,
		spectrumCloneLiquidLayer3Opacity:
			values.spectrumCloneLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Opacity,
		spectrumCloneLiquidLayer1Amp:
			values.spectrumCloneLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Amp,
		spectrumCloneLiquidLayer2Amp:
			values.spectrumCloneLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Amp,
		spectrumCloneLiquidLayer3Amp:
			values.spectrumCloneLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Amp,
		spectrumCloneLiquidLayer1Fill:
			values.spectrumCloneLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Fill,
		spectrumCloneLiquidLayer2Fill:
			values.spectrumCloneLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Fill,
		spectrumCloneLiquidLayer3Fill:
			values.spectrumCloneLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Fill,
		spectrumCloneLiquidLayer1Speed:
			values.spectrumCloneLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Speed,
		spectrumCloneLiquidLayer2Speed:
			values.spectrumCloneLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Speed,
		spectrumCloneLiquidLayer3Speed:
			values.spectrumCloneLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Speed,
		spectrumCloneLiquidLayer1RotationSpeed:
			values.spectrumCloneLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1RotationSpeed,
		spectrumCloneLiquidLayer2RotationSpeed:
			values.spectrumCloneLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2RotationSpeed,
		spectrumCloneLiquidLayer3RotationSpeed:
			values.spectrumCloneLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3RotationSpeed,
		spectrumCloneLiquidLayer1Shape:
			values.spectrumCloneLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Shape,
		spectrumCloneLiquidLayer2Shape:
			values.spectrumCloneLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Shape,
		spectrumCloneLiquidLayer3Shape:
			values.spectrumCloneLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Shape,
		spectrumCloneLiquidLayer1RigidShape: resolveLegacyLiquidRigidShape(
			values,
			1,
			'clone'
		),
		spectrumCloneLiquidLayer2RigidShape: resolveLegacyLiquidRigidShape(
			values,
			2,
			'clone'
		),
		spectrumCloneLiquidLayer3RigidShape: resolveLegacyLiquidRigidShape(
			values,
			3,
			'clone'
		),
		spectrumSpiralTurns:
			values.spectrumSpiralTurns ?? DEFAULT_STATE.spectrumSpiralTurns,
		spectrumSpiralOuterRadius:
			values.spectrumSpiralOuterRadius ??
			DEFAULT_STATE.spectrumSpiralOuterRadius,
		spectrumSpiralTightness:
			values.spectrumSpiralTightness ??
			DEFAULT_STATE.spectrumSpiralTightness,
		spectrumSpiralShape:
			values.spectrumSpiralShape ?? DEFAULT_STATE.spectrumSpiralShape,
		spectrumSpiralLogarithmic:
			values.spectrumSpiralLogarithmic ??
			DEFAULT_STATE.spectrumSpiralLogarithmic,
		spectrumSpiralGradientStroke:
			values.spectrumSpiralGradientStroke ??
			DEFAULT_STATE.spectrumSpiralGradientStroke,
		spectrumSpiralArms:
			values.spectrumSpiralArms ?? DEFAULT_STATE.spectrumSpiralArms,
		spectrumSpiralAudioTurns:
			values.spectrumSpiralAudioTurns ??
			DEFAULT_STATE.spectrumSpiralAudioTurns,
		spectrumSpiralDotShape:
			values.spectrumSpiralDotShape ??
			DEFAULT_STATE.spectrumSpiralDotShape,
		spectrumSpiralStrokeWidth:
			values.spectrumSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumSpiralStrokeWidth,
		spectrumCloneSpiralTurns:
			values.spectrumCloneSpiralTurns ??
			DEFAULT_STATE.spectrumCloneSpiralTurns,
		spectrumCloneSpiralOuterRadius:
			values.spectrumCloneSpiralOuterRadius ??
			DEFAULT_STATE.spectrumCloneSpiralOuterRadius,
		spectrumCloneSpiralTightness:
			values.spectrumCloneSpiralTightness ??
			DEFAULT_STATE.spectrumCloneSpiralTightness,
		spectrumCloneSpiralShape:
			values.spectrumCloneSpiralShape ??
			DEFAULT_STATE.spectrumCloneSpiralShape,
		spectrumCloneSpiralLogarithmic:
			values.spectrumCloneSpiralLogarithmic ??
			DEFAULT_STATE.spectrumCloneSpiralLogarithmic,
		spectrumCloneSpiralGradientStroke:
			values.spectrumCloneSpiralGradientStroke ??
			DEFAULT_STATE.spectrumCloneSpiralGradientStroke,
		spectrumCloneSpiralArms:
			values.spectrumCloneSpiralArms ??
			DEFAULT_STATE.spectrumCloneSpiralArms,
		spectrumCloneSpiralAudioTurns:
			values.spectrumCloneSpiralAudioTurns ??
			DEFAULT_STATE.spectrumCloneSpiralAudioTurns,
		spectrumCloneSpiralDotShape:
			values.spectrumCloneSpiralDotShape ??
			DEFAULT_STATE.spectrumCloneSpiralDotShape,
		spectrumCloneSpiralStrokeWidth:
			values.spectrumCloneSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumCloneSpiralStrokeWidth,
		spectrumOscilloscopeScrollSpeed:
			values.spectrumOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumOscilloscopeScrollSpeed,
		spectrumOscilloscopeReactiveWidth:
			typeof values.spectrumOscilloscopeReactiveWidth === 'boolean'
				? values.spectrumOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumOscilloscopeReactiveWidth,
		spectrumOscilloscopePhosphor:
			typeof values.spectrumOscilloscopePhosphor === 'boolean'
				? values.spectrumOscilloscopePhosphor
				: DEFAULT_STATE.spectrumOscilloscopePhosphor,
		spectrumOscilloscopePhosphorDecay:
			values.spectrumOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumOscilloscopePhosphorDecay,
		spectrumOscilloscopeGrid:
			typeof values.spectrumOscilloscopeGrid === 'boolean'
				? values.spectrumOscilloscopeGrid
				: DEFAULT_STATE.spectrumOscilloscopeGrid,
		spectrumOscilloscopeGridDivisions:
			values.spectrumOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumOscilloscopeGridDivisions,
		spectrumCloneOscilloscopeLineWidth:
			values.spectrumCloneOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumCloneOscilloscopeLineWidth,
		spectrumCloneOscilloscopeScrollSpeed:
			values.spectrumCloneOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumCloneOscilloscopeScrollSpeed,
		spectrumCloneOscilloscopeReactiveWidth:
			typeof values.spectrumCloneOscilloscopeReactiveWidth === 'boolean'
				? values.spectrumCloneOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumCloneOscilloscopeReactiveWidth,
		spectrumCloneOscilloscopePhosphor:
			typeof values.spectrumCloneOscilloscopePhosphor === 'boolean'
				? values.spectrumCloneOscilloscopePhosphor
				: DEFAULT_STATE.spectrumCloneOscilloscopePhosphor,
		spectrumCloneOscilloscopePhosphorDecay:
			values.spectrumCloneOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumCloneOscilloscopePhosphorDecay,
		spectrumCloneOscilloscopeGrid:
			typeof values.spectrumCloneOscilloscopeGrid === 'boolean'
				? values.spectrumCloneOscilloscopeGrid
				: DEFAULT_STATE.spectrumCloneOscilloscopeGrid,
		spectrumCloneOscilloscopeGridDivisions:
			values.spectrumCloneOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumCloneOscilloscopeGridDivisions,
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
		spectrumLogoGap:
			values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
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
		spectrumClonePositionX:
			values.spectrumClonePositionX ??
			DEFAULT_STATE.spectrumClonePositionX,
		spectrumClonePositionY:
			values.spectrumClonePositionY ??
			DEFAULT_STATE.spectrumClonePositionY,
		spectrumCloneBarCount:
			values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			values.spectrumCloneMinHeight ??
			DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			values.spectrumCloneMaxHeight ??
			DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			values.spectrumCloneSmoothing ??
			DEFAULT_STATE.spectrumCloneSmoothing,
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
			values.spectrumCloneColorMode ??
			DEFAULT_STATE.spectrumCloneColorMode,
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
			values.spectrumClonePeakDecay ??
			DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumCloneFollowLogo:
			values.spectrumCloneFollowLogo ??
			DEFAULT_STATE.spectrumCloneFollowLogo,
		spectrumCloneRadialFitLogo:
			values.spectrumCloneRadialFitLogo ??
			DEFAULT_STATE.spectrumCloneRadialFitLogo,
		spectrumInnerRadius:
			values.spectrumInnerRadius ?? DEFAULT_STATE.spectrumInnerRadius,
		spectrumBarCount:
			values.spectrumBarCount ?? DEFAULT_STATE.spectrumBarCount,
		spectrumBarWidth:
			values.spectrumBarWidth ?? DEFAULT_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ?? DEFAULT_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ?? DEFAULT_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ?? DEFAULT_STATE.spectrumSmoothing,
		spectrumOpacity:
			values.spectrumOpacity ?? DEFAULT_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ?? DEFAULT_STATE.spectrumGlowIntensity,
		spectrumShadowBlur:
			values.spectrumShadowBlur ?? DEFAULT_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ?? DEFAULT_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ??
			DEFAULT_STATE.spectrumSecondaryColor,
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
			values.spectrumAudioSmoothing ??
			DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ??
			DEFAULT_STATE.spectrumWaveFillOpacity,
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
	delete sanitizedState.spectrumLiquidRigidShape;
	delete sanitizedState.spectrumCloneLiquidRigidShape;

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
					spectrumCloneColorSource:
						(
							preset.values as {
								spectrumCloneColorSource?: WallpaperStore['spectrumCloneColorSource'];
							}
						).spectrumCloneColorSource ??
						DEFAULT_STATE.spectrumCloneColorSource,
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
		spectrumCloneStyle: normalizeSpectrumShape(
			state.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle
		),
		spectrumCloneRadialShape:
			state.spectrumCloneRadialShape ??
			DEFAULT_STATE.spectrumCloneRadialShape,
		spectrumCloneRadialAngle:
			state.spectrumCloneRadialAngle ??
			DEFAULT_STATE.spectrumCloneRadialAngle,
		spectrumClonePositionX:
			state.spectrumClonePositionX ??
			DEFAULT_STATE.spectrumClonePositionX,
		spectrumClonePositionY:
			state.spectrumClonePositionY ??
			DEFAULT_STATE.spectrumClonePositionY,
		spectrumCloneBarCount:
			state.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			state.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			state.spectrumCloneMinHeight ??
			DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			state.spectrumCloneMaxHeight ??
			DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			state.spectrumCloneSmoothing ??
			DEFAULT_STATE.spectrumCloneSmoothing,
		spectrumCloneGlowIntensity:
			state.spectrumCloneGlowIntensity ??
			DEFAULT_STATE.spectrumCloneGlowIntensity,
		spectrumCloneShadowBlur:
			state.spectrumCloneShadowBlur ??
			DEFAULT_STATE.spectrumCloneShadowBlur,
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
			state.spectrumCloneColorMode ??
			DEFAULT_STATE.spectrumCloneColorMode,
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
			state.spectrumClonePeakDecay ??
			DEFAULT_STATE.spectrumClonePeakDecay,
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
		audioLyricsGlowColor:
			state.audioLyricsGlowColor ?? DEFAULT_STATE.audioLyricsGlowColor,
		audioLyricsGlowColorSource: normalizeColorSourceMode(
			state.audioLyricsGlowColorSource,
			DEFAULT_STATE.audioLyricsGlowColorSource
		),
		audioLyricsGlowBlur:
			state.audioLyricsGlowBlur ?? DEFAULT_STATE.audioLyricsGlowBlur,
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
		spectrumClonePeakRibbons:
			state.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			state.spectrumCloneAfterglow ??
			DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			state.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			state.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneFrameHistoryDepth:
			state.spectrumCloneFrameHistoryDepth ??
			state.spectrumFrameHistoryDepth ??
			DEFAULT_STATE.spectrumCloneFrameHistoryDepth,
		spectrumCloneGainExpressiveness:
			state.spectrumCloneGainExpressiveness ??
			state.spectrumGainExpressiveness ??
			DEFAULT_STATE.spectrumCloneGainExpressiveness,
		spectrumCloneEnvelopeAttack:
			state.spectrumCloneEnvelopeAttack ??
			state.spectrumEnvelopeAttack ??
			DEFAULT_STATE.spectrumCloneEnvelopeAttack,
		spectrumCloneEnvelopeRelease:
			state.spectrumCloneEnvelopeRelease ??
			state.spectrumEnvelopeRelease ??
			DEFAULT_STATE.spectrumCloneEnvelopeRelease,
		spectrumCloneEnvelopeReactivitySpeed:
			state.spectrumCloneEnvelopeReactivitySpeed ??
			state.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumCloneEnvelopeReactivitySpeed,
		spectrumCloneEnvelopePeakWindow:
			state.spectrumCloneEnvelopePeakWindow ??
			state.spectrumEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakWindow,
		spectrumCloneEnvelopePeakFloor:
			state.spectrumCloneEnvelopePeakFloor ??
			state.spectrumEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakFloor,
		spectrumCloneEnvelopePunch:
			state.spectrumCloneEnvelopePunch ??
			state.spectrumEnvelopePunch ??
			DEFAULT_STATE.spectrumCloneEnvelopePunch,
		spectrumCloneEnergyBloom:
			state.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			state.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			state.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
		spectrumCloneShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumCloneShockwaveBandThresholds,
			...state.spectrumCloneShockwaveBandThresholds
		},
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
		spectrumCloneFigureRotationSpeed:
			state.spectrumCloneFigureRotationSpeed ??
			DEFAULT_STATE.spectrumCloneFigureRotationSpeed,
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
		spectrumLiquidLayer1RigidShape: resolveLegacyLiquidRigidShape(
			state,
			1,
			'main'
		),
		spectrumLiquidLayer2RigidShape: resolveLegacyLiquidRigidShape(
			state,
			2,
			'main'
		),
		spectrumLiquidLayer3RigidShape: resolveLegacyLiquidRigidShape(
			state,
			3,
			'main'
		),
		spectrumCloneTunnelRingCount:
			state.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumCloneTunnelDepthFalloff:
			state.spectrumCloneTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumCloneTunnelDepthFalloff,
		spectrumCloneTunnelRingSpacing:
			state.spectrumCloneTunnelRingSpacing ??
			DEFAULT_STATE.spectrumCloneTunnelRingSpacing,
		spectrumCloneTunnelWallOpacity:
			state.spectrumCloneTunnelWallOpacity ??
			DEFAULT_STATE.spectrumCloneTunnelWallOpacity,
		spectrumCloneTunnelPulseStrength:
			state.spectrumCloneTunnelPulseStrength ??
			DEFAULT_STATE.spectrumCloneTunnelPulseStrength,
		spectrumCloneTunnelAlternateRotation:
			typeof state.spectrumCloneTunnelAlternateRotation === 'boolean'
				? state.spectrumCloneTunnelAlternateRotation
				: DEFAULT_STATE.spectrumCloneTunnelAlternateRotation,
		spectrumCloneLiquidLayer1Opacity:
			state.spectrumCloneLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Opacity,
		spectrumCloneLiquidLayer2Opacity:
			state.spectrumCloneLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Opacity,
		spectrumCloneLiquidLayer3Opacity:
			state.spectrumCloneLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Opacity,
		spectrumCloneLiquidLayer1Amp:
			state.spectrumCloneLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Amp,
		spectrumCloneLiquidLayer2Amp:
			state.spectrumCloneLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Amp,
		spectrumCloneLiquidLayer3Amp:
			state.spectrumCloneLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Amp,
		spectrumCloneLiquidLayer1Fill:
			state.spectrumCloneLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Fill,
		spectrumCloneLiquidLayer2Fill:
			state.spectrumCloneLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Fill,
		spectrumCloneLiquidLayer3Fill:
			state.spectrumCloneLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Fill,
		spectrumCloneLiquidLayer1Speed:
			state.spectrumCloneLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Speed,
		spectrumCloneLiquidLayer2Speed:
			state.spectrumCloneLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Speed,
		spectrumCloneLiquidLayer3Speed:
			state.spectrumCloneLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Speed,
		spectrumCloneLiquidLayer1RotationSpeed:
			state.spectrumCloneLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1RotationSpeed,
		spectrumCloneLiquidLayer2RotationSpeed:
			state.spectrumCloneLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2RotationSpeed,
		spectrumCloneLiquidLayer3RotationSpeed:
			state.spectrumCloneLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3RotationSpeed,
		spectrumCloneLiquidLayer1Shape:
			state.spectrumCloneLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Shape,
		spectrumCloneLiquidLayer2Shape:
			state.spectrumCloneLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Shape,
		spectrumCloneLiquidLayer3Shape:
			state.spectrumCloneLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Shape,
		spectrumCloneLiquidLayer1RigidShape: resolveLegacyLiquidRigidShape(
			state,
			1,
			'clone'
		),
		spectrumCloneLiquidLayer2RigidShape: resolveLegacyLiquidRigidShape(
			state,
			2,
			'clone'
		),
		spectrumCloneLiquidLayer3RigidShape: resolveLegacyLiquidRigidShape(
			state,
			3,
			'clone'
		),
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
		spectrumCloneSpiralTurns:
			state.spectrumCloneSpiralTurns ??
			DEFAULT_STATE.spectrumCloneSpiralTurns,
		spectrumCloneSpiralOuterRadius:
			state.spectrumCloneSpiralOuterRadius ??
			DEFAULT_STATE.spectrumCloneSpiralOuterRadius,
		spectrumCloneSpiralTightness:
			state.spectrumCloneSpiralTightness ??
			DEFAULT_STATE.spectrumCloneSpiralTightness,
		spectrumCloneSpiralShape:
			state.spectrumCloneSpiralShape ??
			DEFAULT_STATE.spectrumCloneSpiralShape,
		spectrumCloneSpiralLogarithmic:
			typeof state.spectrumCloneSpiralLogarithmic === 'boolean'
				? state.spectrumCloneSpiralLogarithmic
				: DEFAULT_STATE.spectrumCloneSpiralLogarithmic,
		spectrumCloneSpiralGradientStroke:
			typeof state.spectrumCloneSpiralGradientStroke === 'boolean'
				? state.spectrumCloneSpiralGradientStroke
				: DEFAULT_STATE.spectrumCloneSpiralGradientStroke,
		spectrumCloneSpiralArms:
			state.spectrumCloneSpiralArms ??
			DEFAULT_STATE.spectrumCloneSpiralArms,
		spectrumCloneSpiralAudioTurns:
			state.spectrumCloneSpiralAudioTurns ??
			DEFAULT_STATE.spectrumCloneSpiralAudioTurns,
		spectrumCloneSpiralDotShape:
			state.spectrumCloneSpiralDotShape ??
			DEFAULT_STATE.spectrumCloneSpiralDotShape,
		spectrumCloneSpiralStrokeWidth:
			state.spectrumCloneSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumCloneSpiralStrokeWidth,
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
		spectrumCloneOscilloscopeLineWidth:
			state.spectrumCloneOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumCloneOscilloscopeLineWidth,
		spectrumCloneOscilloscopeScrollSpeed:
			state.spectrumCloneOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumCloneOscilloscopeScrollSpeed,
		spectrumCloneOscilloscopeReactiveWidth:
			typeof state.spectrumCloneOscilloscopeReactiveWidth === 'boolean'
				? state.spectrumCloneOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumCloneOscilloscopeReactiveWidth,
		spectrumCloneOscilloscopePhosphor:
			typeof state.spectrumCloneOscilloscopePhosphor === 'boolean'
				? state.spectrumCloneOscilloscopePhosphor
				: DEFAULT_STATE.spectrumCloneOscilloscopePhosphor,
		spectrumCloneOscilloscopePhosphorDecay:
			state.spectrumCloneOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumCloneOscilloscopePhosphorDecay,
		spectrumCloneOscilloscopeGrid:
			typeof state.spectrumCloneOscilloscopeGrid === 'boolean'
				? state.spectrumCloneOscilloscopeGrid
				: DEFAULT_STATE.spectrumCloneOscilloscopeGrid,
		spectrumCloneOscilloscopeGridDivisions:
			state.spectrumCloneOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumCloneOscilloscopeGridDivisions,
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
			: DEFAULT_STATE.calibrationProfileSlots
	} as WallpaperStore;

	return normalizeSpectrumSettings(migratedState) as WallpaperStore;
}
