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

const SPECTRUM_PROFILE_KEYS = [
	'spectrumEnabled',
	'spectrumFamily',
	'spectrumAfterglow',
	'spectrumMotionTrails',
	'spectrumGhostFrames',
	'spectrumPeakRibbons',
	'spectrumBassShockwave',
	'spectrumEnergyBloom',
	'spectrumOscilloscopeLineWidth',
	'spectrumTunnelRingCount',
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
