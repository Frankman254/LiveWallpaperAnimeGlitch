import type {
	BackgroundProfileSettings,
	LogoProfileSettings,
	ProfileSlot,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';

export const BACKGROUND_PROFILE_SLOT_COUNT = 3;
export const LOGO_PROFILE_SLOT_COUNT = 3;
export const SPECTRUM_PROFILE_SLOT_COUNT = 8;
export const MAX_PROFILE_SLOT_COUNT = 10;
export const MAX_SPECTRUM_SLOT_COUNT = 20;
export const MAX_LOGO_SLOT_COUNT = 20;
/** @deprecated Saved Motion tab bundles (particles + rain). New flow uses
 *  separate particlesProfileSlots + rainProfileSlots referenced from Scene
 *  slots; `motionProfileSlots` is kept only for backward-compatible load. */
export const MOTION_PROFILE_SLOT_INITIAL = 3;
export const MAX_MOTION_SLOT_COUNT = 20;

export const PARTICLES_PROFILE_SLOT_COUNT = 3;
export const MAX_PARTICLES_SLOT_COUNT = 20;
export const RAIN_PROFILE_SLOT_COUNT = 3;
export const MAX_RAIN_SLOT_COUNT = 20;
export const LOOKS_PROFILE_SLOT_COUNT = 3;
export const MAX_LOOKS_SLOT_COUNT = 20;
export const TRACK_TITLE_PROFILE_SLOT_COUNT = 3;
export const MAX_TRACK_TITLE_SLOT_COUNT = 20;

export const PARTICLES_PROFILE_KEYS = [
	'particlesEnabled',
	'particleLayerMode',
	'particleShape',
	'particleColor1',
	'particleColor2',
	'particleColorSource',
	'particleColorMode',
	'particleSizeMin',
	'particleSizeMax',
	'particleOpacity',
	'particleGlow',
	'particleGlowStrength',
	'particleFilterBrightness',
	'particleFilterContrast',
	'particleFilterSaturation',
	'particleFilterBlur',
	'particleFilterHueRotate',
	'particleScanlineIntensity',
	'particleScanlineSpacing',
	'particleScanlineThickness',
	'particleRotationIntensity',
	'particleRotationDirection',
	'particleFadeInOut',
	'particleAudioReactive',
	'particleAudioChannel',
	'particleAudioSizeBoost',
	'particleAudioOpacityBoost',
	'particleCount',
	'particleSpeed'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type ParticlesProfileSettings = Pick<
	WallpaperState,
	(typeof PARTICLES_PROFILE_KEYS)[number]
>;

export const RAIN_PROFILE_KEYS = [
	'rainEnabled',
	'rainIntensity',
	'rainDropCount',
	'rainAngle',
	'rainMeshRotationZ',
	'rainColor',
	'rainColorSource',
	'rainColorMode',
	'rainParticleType',
	'rainLength',
	'rainWidth',
	'rainBlur',
	'rainSpeed',
	'rainVariation'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type RainProfileSettings = Pick<
	WallpaperState,
	(typeof RAIN_PROFILE_KEYS)[number]
>;

/**
 * Looks (filter + post-fx) snapshot. Includes filter stack + RGB / scanline /
 * noise so that a Looks slot captures the full visual-tone pipeline without
 * leaking into other subsystems (spectrum/logo/audio remain untouched).
 */
export const LOOKS_PROFILE_KEYS = [
	'filterTargets',
	'filterOpacity',
	'filterBrightness',
	'filterContrast',
	'filterSaturation',
	'filterBlur',
	'filterHueRotate',
	'filterVignette',
	'filterBloom',
	'filterLumaThreshold',
	'filterLensWarp',
	'filterHeatDistortion',
	'rgbShift',
	'noiseIntensity',
	'scanlineIntensity',
	'scanlineMode',
	'scanlineSpacing',
	'scanlineThickness',
	'activeFilterLookId'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type LooksProfileSettings = Pick<
	WallpaperState,
	(typeof LOOKS_PROFILE_KEYS)[number]
>;

export const TRACK_TITLE_PROFILE_KEYS = [
	'audioTrackTitleEnabled',
	'audioTrackTitleLayoutMode',
	'audioTrackTitleFontStyle',
	'audioTrackTitleUppercase',
	'audioTrackTitlePositionX',
	'audioTrackTitlePositionY',
	'audioTrackTitleFontSize',
	'audioTrackTitleLetterSpacing',
	'audioTrackTitleWidth',
	'audioTrackTitleOpacity',
	'audioTrackTitleScrollSpeed',
	'audioTrackTitleRgbShift',
	'audioTrackTitleTextColor',
	'audioTrackTitleTextColorSource',
	'audioTrackTitleStrokeColor',
	'audioTrackTitleStrokeColorSource',
	'audioTrackTitleStrokeWidth',
	'audioTrackTitleGlowColor',
	'audioTrackTitleGlowColorSource',
	'audioTrackTitleGlowBlur',
	'audioTrackTitleBackdropEnabled',
	'audioTrackTitleBackdropColor',
	'audioTrackTitleBackdropColorSource',
	'audioTrackTitleBackdropOpacity',
	'audioTrackTitleBackdropPadding',
	'audioTrackTitleFilterBrightness',
	'audioTrackTitleFilterContrast',
	'audioTrackTitleFilterSaturation',
	'audioTrackTitleFilterBlur',
	'audioTrackTitleFilterHueRotate',
	'audioTrackTimeEnabled',
	'audioTrackTimePositionX',
	'audioTrackTimePositionY',
	'audioTrackTimeWidth',
	'audioTrackTimeFontStyle',
	'audioTrackTimeFontSize',
	'audioTrackTimeLetterSpacing',
	'audioTrackTimeOpacity',
	'audioTrackTimeRgbShift',
	'audioTrackTimeTextColor',
	'audioTrackTimeTextColorSource',
	'audioTrackTimeStrokeColor',
	'audioTrackTimeStrokeColorSource',
	'audioTrackTimeStrokeWidth',
	'audioTrackTimeGlowColor',
	'audioTrackTimeGlowColorSource',
	'audioTrackTimeGlowBlur',
	'audioTrackTimeFilterBrightness',
	'audioTrackTimeFilterContrast',
	'audioTrackTimeFilterSaturation',
	'audioTrackTimeFilterBlur',
	'audioTrackTimeFilterHueRotate'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type TrackTitleProfileSettings = Pick<
	WallpaperState,
	(typeof TRACK_TITLE_PROFILE_KEYS)[number]
>;

/**
 * Combined particles + rain keys (derived). Kept exported so that the
 * deprecated motion profile pipeline continues to read/extract a bundle.
 */
export const MOTION_PROFILE_KEYS = [
	'particlesEnabled',
	'particleLayerMode',
	'particleShape',
	'particleColor1',
	'particleColor2',
	'particleColorSource',
	'particleColorMode',
	'particleSizeMin',
	'particleSizeMax',
	'particleOpacity',
	'particleGlow',
	'particleGlowStrength',
	'particleFilterBrightness',
	'particleFilterContrast',
	'particleFilterSaturation',
	'particleFilterBlur',
	'particleFilterHueRotate',
	'particleScanlineIntensity',
	'particleScanlineSpacing',
	'particleScanlineThickness',
	'particleRotationIntensity',
	'particleRotationDirection',
	'particleFadeInOut',
	'particleAudioReactive',
	'particleAudioChannel',
	'particleAudioSizeBoost',
	'particleAudioOpacityBoost',
	'particleCount',
	'particleSpeed',
	'rainEnabled',
	'rainIntensity',
	'rainDropCount',
	'rainAngle',
	'rainMeshRotationZ',
	'rainColor',
	'rainColorSource',
	'rainColorMode',
	'rainParticleType',
	'rainLength',
	'rainWidth',
	'rainBlur',
	'rainSpeed',
	'rainVariation'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type MotionProfileSettings = Pick<
	WallpaperState,
	(typeof MOTION_PROFILE_KEYS)[number]
>;

const BACKGROUND_PROFILE_KEYS = [
	'imageBassReactive',
	'imageBassScaleIntensity',
	'imageAudioReactiveDecay',
	'imageAudioSmoothingEnabled',
	'imageAudioSmoothing',
	'imageOpacityReactive',
	'imageOpacityReactiveAmount',
	'imageBassAttack',
	'imageBassRelease',
	'imageBassReactivitySpeed',
	'imageBassPeakWindow',
	'imageBassPeakFloor',
	'imageBassPunch',
	'imageBassReactiveScaleIntensity',
	'imageAudioChannel',
	'parallaxStrength'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export const SPECTRUM_PROFILE_KEYS = [
	'spectrumEnabled',
	'spectrumFamily',
	'spectrumAfterglow',
	'spectrumMotionTrails',
	'spectrumGhostFrames',
	'spectrumPeakRibbons',
	'spectrumBassShockwave',
	'spectrumShockwaveBandMode',
	'spectrumShockwaveThickness',
	'spectrumShockwaveOpacity',
	'spectrumShockwaveBlur',
	'spectrumShockwaveColorMode',
	'spectrumEnergyBloom',
	'spectrumPeakRibbonAngle',
	'spectrumClonePeakRibbons',
	'spectrumCloneAfterglow',
	'spectrumCloneMotionTrails',
	'spectrumCloneGhostFrames',
	'spectrumCloneEnergyBloom',
	'spectrumCloneBassShockwave',
	'spectrumCloneShockwaveBandMode',
	'spectrumCloneShockwaveThickness',
	'spectrumCloneShockwaveOpacity',
	'spectrumCloneShockwaveBlur',
	'spectrumCloneShockwaveColorMode',
	'spectrumClonePeakRibbonAngle',
	'spectrumOscilloscopeLineWidth',
	'spectrumTunnelRingCount',
	'spectrumCloneTunnelRingCount',
	'spectrumSpectrogramDecay',
	'spectrumMode',
	'spectrumLinearOrientation',
	'spectrumLinearDirection',
	'spectrumRadialShape',
	'spectrumRadialAngle',
	'spectrumRadialFitLogo',
	'spectrumFollowLogo',
	'spectrumLogoGap',
	'spectrumCircularClone',
	'spectrumSpan',
	'spectrumCloneOpacity',
	'spectrumCloneScale',
	'spectrumCloneGap',
	'spectrumCloneFamily',
	'spectrumCloneStyle',
	'spectrumCloneRadialShape',
	'spectrumCloneRadialAngle',
	'spectrumCloneBarCount',
	'spectrumCloneBarWidth',
	'spectrumCloneMinHeight',
	'spectrumCloneMaxHeight',
	'spectrumCloneSmoothing',
	'spectrumCloneGlowIntensity',
	'spectrumCloneShadowBlur',
	'spectrumClonePrimaryColor',
	'spectrumCloneSecondaryColor',
	'spectrumCloneColorSource',
	'spectrumCloneColorMode',
	'spectrumCloneBandMode',
	'spectrumCloneAudioSmoothingEnabled',
	'spectrumCloneAudioSmoothing',
	'spectrumCloneRotationSpeed',
	'spectrumCloneMirror',
	'spectrumClonePeakHold',
	'spectrumClonePeakDecay',
	'spectrumCloneFollowLogo',
	'spectrumCloneRadialFitLogo',
	'spectrumInnerRadius',
	'spectrumBarCount',
	'spectrumBarWidth',
	'spectrumMinHeight',
	'spectrumMaxHeight',
	'spectrumSmoothing',
	'spectrumOpacity',
	'spectrumGlowIntensity',
	'spectrumShadowBlur',
	'spectrumPrimaryColor',
	'spectrumSecondaryColor',
	'spectrumColorSource',
	'spectrumColorMode',
	'spectrumBandMode',
	'spectrumAudioSmoothingEnabled',
	'spectrumAudioSmoothing',
	'spectrumShape',
	'spectrumWaveFillOpacity',
	'spectrumRotationSpeed',
	'spectrumMirror',
	'spectrumPeakHold',
	'spectrumPeakDecay',
	'spectrumPositionX',
	'spectrumPositionY',
	'spectrumCloneWaveFillOpacity'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

const LOGO_PROFILE_KEYS = [
	'logoEnabled',
	'logoBaseSize',
	'logoPositionX',
	'logoPositionY',
	'logoBandMode',
	'logoAudioSmoothingEnabled',
	'logoAudioSmoothing',
	'logoAudioSensitivity',
	'logoReactiveScaleIntensity',
	'logoReactivitySpeed',
	'logoAttack',
	'logoRelease',
	'logoMinScale',
	'logoMaxScale',
	'logoPunch',
	'logoPeakWindow',
	'logoPeakFloor',
	'logoGlowColor',
	'logoGlowColorSource',
	'logoGlowBlur',
	'logoShadowEnabled',
	'logoShadowColor',
	'logoShadowColorSource',
	'logoShadowBlur',
	'logoBackdropEnabled',
	'logoBackdropColor',
	'logoBackdropColorSource',
	'logoBackdropOpacity',
	'logoBackdropPadding'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

function pickState<K extends keyof WallpaperState>(
	state: WallpaperState,
	keys: readonly K[]
): Pick<WallpaperState, K> {
	const next = {} as Pick<WallpaperState, K>;
	for (const key of keys) {
		next[key] = state[key] as Pick<WallpaperState, K>[K];
	}
	return next;
}

function createEmptySlots<T>(
	prefix: string,
	count: number
): Array<ProfileSlot<T>> {
	return Array.from({ length: count }, (_, index) => ({
		name: `${prefix} ${index + 1}`,
		values: null
	}));
}

export function createDefaultSpectrumProfileSlots(): Array<
	ProfileSlot<SpectrumProfileSettings>
> {
	return createEmptySlots<SpectrumProfileSettings>(
		'Spectrum',
		SPECTRUM_PROFILE_SLOT_COUNT
	);
}

export function createDefaultBackgroundProfileSlots(): Array<
	ProfileSlot<BackgroundProfileSettings>
> {
	return createEmptySlots<BackgroundProfileSettings>(
		'BG',
		BACKGROUND_PROFILE_SLOT_COUNT
	);
}

export function createDefaultLogoProfileSlots(): Array<
	ProfileSlot<LogoProfileSettings>
> {
	return createEmptySlots<LogoProfileSettings>(
		'Logo',
		LOGO_PROFILE_SLOT_COUNT
	);
}

export function createDefaultMotionProfileSlots(): Array<
	ProfileSlot<MotionProfileSettings>
> {
	return createEmptySlots<MotionProfileSettings>(
		'Motion',
		MOTION_PROFILE_SLOT_INITIAL
	);
}

export function createDefaultParticlesProfileSlots(): Array<
	ProfileSlot<ParticlesProfileSettings>
> {
	return createEmptySlots<ParticlesProfileSettings>(
		'Particles',
		PARTICLES_PROFILE_SLOT_COUNT
	);
}

export function createDefaultRainProfileSlots(): Array<
	ProfileSlot<RainProfileSettings>
> {
	return createEmptySlots<RainProfileSettings>(
		'Rain',
		RAIN_PROFILE_SLOT_COUNT
	);
}

export function createDefaultLooksProfileSlots(): Array<
	ProfileSlot<LooksProfileSettings>
> {
	return createEmptySlots<LooksProfileSettings>(
		'Look',
		LOOKS_PROFILE_SLOT_COUNT
	);
}

export function createDefaultTrackTitleProfileSlots(): Array<
	ProfileSlot<TrackTitleProfileSettings>
> {
	return createEmptySlots<TrackTitleProfileSettings>(
		'Track Title',
		TRACK_TITLE_PROFILE_SLOT_COUNT
	);
}

export function extractBackgroundProfileSettings(
	state: WallpaperState
): BackgroundProfileSettings {
	return pickState(state, BACKGROUND_PROFILE_KEYS);
}

export function extractSpectrumProfileSettings(
	state: WallpaperState
): SpectrumProfileSettings {
	return pickState(state, SPECTRUM_PROFILE_KEYS);
}

export function extractLogoProfileSettings(
	state: WallpaperState
): LogoProfileSettings {
	return pickState(state, LOGO_PROFILE_KEYS);
}

export function extractMotionProfileSettings(
	state: WallpaperState
): MotionProfileSettings {
	return pickState(state, MOTION_PROFILE_KEYS);
}

export function extractParticlesProfileSettings(
	state: WallpaperState
): ParticlesProfileSettings {
	return pickState(state, PARTICLES_PROFILE_KEYS);
}

export function extractRainProfileSettings(
	state: WallpaperState
): RainProfileSettings {
	return pickState(state, RAIN_PROFILE_KEYS);
}

export function extractLooksProfileSettings(
	state: WallpaperState
): LooksProfileSettings {
	return pickState(state, LOOKS_PROFILE_KEYS);
}

export function extractTrackTitleProfileSettings(
	state: WallpaperState
): TrackTitleProfileSettings {
	return pickState(state, TRACK_TITLE_PROFILE_KEYS);
}

export function buildMotionProfileName(state: WallpaperState): string {
	const p = state.particlesEnabled ? 'P' : 'p';
	const r = state.rainEnabled ? 'R' : 'r';
	return `${p}${r} · ${state.particleCount} · ${state.rainDropCount}`;
}

export function buildParticlesProfileName(state: WallpaperState): string {
	const on = state.particlesEnabled ? 'on' : 'off';
	return `${state.particleShape} · ${state.particleCount} (${on})`;
}

export function buildRainProfileName(state: WallpaperState): string {
	const on = state.rainEnabled ? 'on' : 'off';
	return `${state.rainParticleType} · ${state.rainDropCount} (${on})`;
}

export function buildLooksProfileName(state: WallpaperState): string {
	if (state.activeFilterLookId) return state.activeFilterLookId;
	return `Look b${state.filterBrightness.toFixed(2)} s${state.filterSaturation.toFixed(2)}`;
}

export function buildTrackTitleProfileName(state: WallpaperState): string {
	const tt = state.audioTrackTitleEnabled ? 'T' : 't';
	const tm = state.audioTrackTimeEnabled ? 'M' : 'm';
	return `${tt}${tm} · ${state.audioTrackTitleFontStyle}`;
}

export function doProfileSettingsMatch<T extends object>(
	current: T,
	values: T | null
): boolean {
	if (!values) return false;
	return Object.entries(values as Record<string, unknown>).every(
		([key, value]) => (current as Record<string, unknown>)[key] === value
	);
}

export function normalizeProfileSlots<T>(
	slots: Array<ProfileSlot<T>> | undefined,
	fallbackFactory: () => Array<ProfileSlot<T>>,
	prefix: string,
	maxLimit = MAX_PROFILE_SLOT_COUNT
): Array<ProfileSlot<T>> {
	const fallback = fallbackFactory();
	const targetLength = Math.max(
		fallback.length,
		Math.min(slots?.length ?? fallback.length, maxLimit)
	);

	return Array.from({ length: targetLength }, (_, index) => {
		const candidate = slots?.[index];
		const fallbackSlot = fallback[index] ?? {
			name: `${prefix} ${index + 1}`,
			values: null
		};
		return {
			name: candidate?.name?.trim() || fallbackSlot.name,
			values: candidate?.values ?? null
		};
	});
}

export function buildSpectrumProfileName(state: WallpaperState): string {
	const modeLabel =
		state.spectrumMode === 'radial'
			? state.spectrumRadialShape.charAt(0).toUpperCase() +
				state.spectrumRadialShape.slice(1)
			: state.spectrumLinearOrientation === 'horizontal'
				? 'Horizontal'
				: 'Vertical';
	const styleShape = normalizeSpectrumShape(state.spectrumShape);
	const style = styleShape.charAt(0).toUpperCase() + styleShape.slice(1);
	return `${modeLabel} ${style}`;
}

export function buildBackgroundProfileName(state: WallpaperState): string {
	const channel =
		state.imageAudioChannel.charAt(0).toUpperCase() +
		state.imageAudioChannel.slice(1);
	return `${channel} ${state.imageBassScaleIntensity.toFixed(2)}x`;
}

export function buildLogoProfileName(state: WallpaperState): string {
	const band =
		state.logoBandMode.charAt(0).toUpperCase() +
		state.logoBandMode.slice(1);
	return `${band} ${state.logoMaxScale.toFixed(2)}x`;
}
