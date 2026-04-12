import type { CustomPresetsMap } from './presets';

export type PerformanceMode = 'low' | 'medium' | 'high';
export type ControlPanelAnchor =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';
export type EditorTheme =
	| 'cyber'
	| 'glass'
	| 'sunset'
	| 'terminal'
	| 'midnight'
	| 'carbon'
	| 'aurora'
	| 'rose'
	| 'ocean'
	| 'amber'
	| 'rainbow';
export type ThemeColorSource = 'manual' | 'theme' | 'background';
export type AudioCaptureState =
	| 'idle'
	| 'requesting'
	| 'active'
	| 'denied'
	| 'error'
	| 'no-audio-track';
export type AudioSourceMode = 'none' | 'desktop' | 'microphone' | 'file';
export type AudioMixMode = 'manual' | 'sequential' | 'energy-match' | 'contrast';
export type AudioTransitionStyle = 'linear' | 'smooth' | 'quick' | 'early-blend' | 'late-blend';
export type AudioPlaylistTrack = {
	id: string;
	assetId: string;
	name: string;
	mimeType: string;
	volume: number;
	loop: boolean;
	enabled: boolean;
	/** Duplicate-detection fingerprint: "<name>::<size>::<lastModified>" */
	fileKey?: string;
	energyScore?: number;
	bassScore?: number;
	densityScore?: number;
	// Silence/content detection (auto-computed)
	contentStartMs?: number;
	contentEndMs?: number;
	introTrimMs?: number;
	outroTrimMs?: number;
	// Mix points (auto-computed, manually overridable)
	/** Where the incoming track content starts — engine seeks here before fading in. */
	mixInStartMs?: number;
	/** Where crossfade out begins on this track. */
	mixOutStartMs?: number;
	// Musical metadata (lightweight heuristics)
	estimatedBpm?: number;
	beatStrength?: number;
	loudnessDb?: number;
	durationMs?: number;
};
export type TrackTitleLayoutMode =
	| 'free'
	| 'centered'
	| 'left-dock'
	| 'right-dock';
export type TrackTitleFontStyle =
	| 'clean'
	| 'condensed'
	| 'techno'
	| 'mono'
	| 'serif';
export type ColorSourceMode = 'manual' | 'background' | 'theme';
export type SpectrumColorMode =
	| 'solid'
	| 'gradient'
	| 'rainbow'
	| 'visible-rotate';
export type AudioReactiveChannel =
	| 'auto'
	| 'full'
	| 'kick'
	| 'instrumental'
	| 'bass'
	| 'hihat'
	| 'vocal';
export type ResolvedAudioReactiveChannel = Exclude<
	AudioReactiveChannel,
	'auto'
>;
export type SpectrumBandMode = AudioReactiveChannel;
export type SpectrumShape =
	| 'bars'
	| 'blocks'
	| 'lines'
	| 'wave'
	| 'dots'
	| 'capsules'
	| 'spikes';
export type SpectrumMode = 'radial' | 'linear';
export type SpectrumLinearOrientation = 'horizontal' | 'vertical';
export type SpectrumLinearDirection = 'normal' | 'flipped';
export type SpectrumRadialShape =
	| 'circle'
	| 'square'
	| 'triangle'
	| 'star'
	| 'diamond'
	| 'hexagon'
	| 'octagon';
export type ParticleRotationDirection = 'clockwise' | 'counterclockwise';
export type LogoBandMode = AudioReactiveChannel;
export type ParticleColorMode = 'solid' | 'gradient' | 'rainbow';
export type ParticleLayerMode = 'background' | 'foreground' | 'both';
export type ParticleShape =
	| 'circles'
	| 'squares'
	| 'triangles'
	| 'stars'
	| 'plus'
	| 'minus'
	| 'diamonds'
	| 'cross'
	| 'all';
export type RainParticleType = 'lines' | 'drops' | 'dots' | 'bars';
export type RainColorMode = 'solid' | 'rainbow';
export type ScanlineMode = 'always' | 'pulse' | 'burst' | 'beat';
export type Language = 'en' | 'es';
export type ImageFitMode =
	| 'stretch'
	| 'cover'
	| 'contain'
	| 'fit-width'
	| 'fit-height';
export type FilterTarget =
	| 'global-background'
	| 'background'
	| 'selected-overlay'
	| 'logo'
	| 'spectrum';
export type SlideshowTransitionType =
	| 'fade'
	| 'slide-left'
	| 'slide-right'
	| 'zoom-in'
	| 'blur-dissolve'
	| 'bars-horizontal'
	| 'bars-vertical'
	| 'rgb-shift'
	| 'distortion';
export type OverlayBlendMode = 'normal' | 'screen' | 'lighten' | 'multiply';
export type OverlayCropShape = 'rectangle' | 'rounded' | 'circle' | 'diamond';
export type BuiltInLayerId =
	| 'background-image'
	| 'slideshow'
	| 'logo'
	| 'track-title'
	| 'spectrum'
	| 'particle-background'
	| 'particle-foreground'
	| 'rain';

export interface OverlayImageItem {
	id: string;
	assetId: string;
	name: string;
	url: string | null;
	enabled: boolean;
	zIndex: number;
	positionX: number;
	positionY: number;
	scale: number;
	rotation: number;
	opacity: number;
	blendMode: OverlayBlendMode;
	cropShape: OverlayCropShape;
	edgeFade: number;
	edgeBlur: number;
	edgeGlow: number;
	width: number;
	height: number;
}

export interface BackgroundImageItem {
	assetId: string;
	url: string | null;
	thumbnailUrl: string | null;
	// Transform
	scale: number;
	positionX: number;
	positionY: number;
	rotation: number;
	fitMode: ImageFitMode;
	mirror: boolean;
	opacity: number;
	// Per-image audio reactivity (overrides global imageBassReactive when set)
	bassReactive: boolean;
	bassIntensity: number;
	audioReactiveDecay: number;
	audioChannel: AudioReactiveChannel;
	// Transition (slideshow)
	transitionType: SlideshowTransitionType;
	transitionDuration: number;
	transitionIntensity: number;
	transitionAudioDrive: number;
	transitionAudioChannel: AudioReactiveChannel;
	logoProfileSlotIndex: number | null;
	spectrumProfileSlotIndex: number | null;
	/** Inline per-image logo config. When set, takes priority over logoProfileSlotIndex. */
	logoOverride: LogoProfileSettings | null;
	/** Inline per-image spectrum config. When set, takes priority over spectrumProfileSlotIndex. */
	spectrumOverride: SpectrumProfileSettings | null;
}

export interface ProfileSlot<T> {
	name: string;
	values: T | null;
}

export interface SpectrumProfileSettings {
	spectrumEnabled: boolean;
	spectrumMode: SpectrumMode;
	spectrumLinearOrientation: SpectrumLinearOrientation;
	spectrumLinearDirection: SpectrumLinearDirection;
	spectrumRadialShape: SpectrumRadialShape;
	spectrumRadialAngle: number;
	spectrumRadialFitLogo: boolean;
	spectrumFollowLogo: boolean;
	spectrumLogoGap: number;
	spectrumCircularClone: boolean;
	spectrumSpan: number;
	spectrumCloneOpacity: number;
	spectrumCloneScale: number;
	spectrumCloneGap: number;
	spectrumCloneStyle: SpectrumShape;
	spectrumCloneRadialShape: SpectrumRadialShape;
	spectrumCloneRadialAngle: number;
	spectrumCloneBarCount: number;
	spectrumCloneBarWidth: number;
	spectrumCloneMinHeight: number;
	spectrumCloneMaxHeight: number;
	spectrumCloneSmoothing: number;
	spectrumCloneGlowIntensity: number;
	spectrumCloneShadowBlur: number;
	spectrumClonePrimaryColor: string;
	spectrumCloneSecondaryColor: string;
	spectrumCloneColorSource: ColorSourceMode;
	spectrumCloneColorMode: SpectrumColorMode;
	spectrumCloneBandMode: SpectrumBandMode;
	spectrumCloneAudioSmoothingEnabled: boolean;
	spectrumCloneAudioSmoothing: number;
	spectrumCloneRotationSpeed: number;
	spectrumCloneMirror: boolean;
	spectrumClonePeakHold: boolean;
	spectrumClonePeakDecay: number;
	spectrumInnerRadius: number;
	spectrumBarCount: number;
	spectrumBarWidth: number;
	spectrumMinHeight: number;
	spectrumMaxHeight: number;
	spectrumSmoothing: number;
	spectrumOpacity: number;
	spectrumGlowIntensity: number;
	spectrumShadowBlur: number;
	spectrumPrimaryColor: string;
	spectrumSecondaryColor: string;
	spectrumColorSource: ColorSourceMode;
	spectrumColorMode: SpectrumColorMode;
	spectrumBandMode: SpectrumBandMode;
	spectrumAudioSmoothingEnabled: boolean;
	spectrumAudioSmoothing: number;
	spectrumShape: SpectrumShape;
	spectrumWaveFillOpacity: number;
	spectrumRotationSpeed: number;
	spectrumMirror: boolean;
	spectrumPeakHold: boolean;
	spectrumPeakDecay: number;
	spectrumPositionX: number;
	spectrumPositionY: number;
	spectrumCloneWaveFillOpacity: number;
}

export interface LogoProfileSettings {
	logoEnabled: boolean;
	logoBaseSize: number;
	logoPositionX: number;
	logoPositionY: number;
	logoBandMode: LogoBandMode;
	logoAudioSmoothingEnabled: boolean;
	logoAudioSmoothing: number;
	logoAudioSensitivity: number;
	logoReactiveScaleIntensity: number;
	logoReactivitySpeed: number;
	logoAttack: number;
	logoRelease: number;
	logoMinScale: number;
	logoMaxScale: number;
	logoPunch: number;
	logoPeakWindow: number;
	logoPeakFloor: number;
	logoGlowColor: string;
	logoGlowColorSource: ColorSourceMode;
	logoGlowBlur: number;
	logoShadowEnabled: boolean;
	logoShadowColor: string;
	logoShadowColorSource: ColorSourceMode;
	logoShadowBlur: number;
	logoBackdropEnabled: boolean;
	logoBackdropColor: string;
	logoBackdropColorSource: ColorSourceMode;
	logoBackdropOpacity: number;
	logoBackdropPadding: number;
}

export interface BackgroundProfileSettings {
	imageBassReactive: boolean;
	imageBassScaleIntensity: number;
	imageAudioReactiveDecay: number;
	imageAudioSmoothingEnabled: boolean;
	imageAudioSmoothing: number;
	imageOpacityReactive: boolean;
	imageOpacityReactiveAmount: number;
	imageBassAttack: number;
	imageBassRelease: number;
	imageBassReactivitySpeed: number;
	imageBassPeakWindow: number;
	imageBassPeakFloor: number;
	imageBassPunch: number;
	imageBassReactiveScaleIntensity: number;
	imageAudioChannel: AudioReactiveChannel;
	parallaxStrength: number;
}

export type WallpaperState = {
	// Background FX
	rgbShift: number;
	scanlineIntensity: number;
	scanlineMode: ScanlineMode;
	scanlineSpacing: number;
	scanlineThickness: number;
	parallaxStrength: number;
	backgroundImageEnabled: boolean;
	imageUrl: string | null;
	imageScale: number;
	imagePositionX: number;
	imagePositionY: number;
	imageOpacity: number;
	imageBassReactive: boolean;
	imageBassScaleIntensity: number;
	imageAudioReactiveDecay: number;
	imageAudioSmoothingEnabled: boolean;
	imageAudioSmoothing: number;
	imageOpacityReactive: boolean;
	imageOpacityReactiveAmount: number;
	/** Logo-style envelope for background zoom (attack/release/peak/punch); release syncs legacy `imageAudioReactiveDecay`. */
	imageBassAttack: number;
	imageBassRelease: number;
	imageBassReactivitySpeed: number;
	imageBassPeakWindow: number;
	imageBassPeakFloor: number;
	imageBassPunch: number;
	imageBassReactiveScaleIntensity: number;
	/** Last applied built-in BG zoom envelope preset; `null` after manual edits. */
	imageBassZoomPresetId: 'classic' | 'smooth' | 'punchy' | null;
	imageAudioChannel: AudioReactiveChannel;
	backgroundProfileSlots: ProfileSlot<BackgroundProfileSettings>[];
	imageFitMode: ImageFitMode;
	imageMirror: boolean;
	/** Debug HUD: live scale boost + audio drive (top-left) */
	showBackgroundScaleMeter: boolean;
	/** Debug HUD: spectrum channel, bins energy, gain, follow-logo placement */
	showSpectrumDiagnosticsHud: boolean;
	/** Debug HUD: logo drive, envelope, link to spectrum follow */
	showLogoDiagnosticsHud: boolean;
	filterTargets: FilterTarget[];
	filterOpacity: number;
	filterBrightness: number;
	filterContrast: number;
	filterSaturation: number;
	filterBlur: number;
	filterHueRotate: number;
	globalBackgroundEnabled: boolean;
	globalBackgroundId: string | null;
	globalBackgroundUrl: string | null;
	globalBackgroundScale: number;
	globalBackgroundPositionX: number;
	globalBackgroundPositionY: number;
	globalBackgroundFitMode: ImageFitMode;
	globalBackgroundOpacity: number;
	globalBackgroundBrightness: number;
	globalBackgroundContrast: number;
	globalBackgroundSaturation: number;
	globalBackgroundBlur: number;
	globalBackgroundHueRotate: number;

	// Audio
	audioReactive: boolean;
	audioSensitivity: number;
	audioCaptureState: AudioCaptureState;
	audioSourceMode: AudioSourceMode;
	audioFileAssetId: string | null;
	audioFileName: string;
	audioFileVolume: number;
	audioFileLoop: boolean;
	audioPaused: boolean;
	motionPaused: boolean;
	fftSize: number;
	audioSmoothing: number;
	audioChannelSmoothing: number;
	audioSelectedChannelSmoothing: number;
	audioAutoKickThreshold: number;
	audioAutoSwitchHoldMs: number;
	// Playlist
	audioTracks: AudioPlaylistTrack[];
	activeAudioTrackId: string | null;
	queuedAudioTrackId: string | null;
	audioCrossfadeEnabled: boolean;
	audioCrossfadeSeconds: number;
	audioAutoAdvance: boolean;
	audioMixMode: AudioMixMode;
	audioTransitionStyle: AudioTransitionStyle;
	/** Enable Media Session API (lock screen / notification controls). */
	mediaSessionEnabled: boolean;
	audioTrackTitleEnabled: boolean;
	audioTrackTitleLayoutMode: TrackTitleLayoutMode;
	audioTrackTitleFontStyle: TrackTitleFontStyle;
	audioTrackTitleUppercase: boolean;
	audioTrackTitlePositionX: number;
	audioTrackTitlePositionY: number;
	audioTrackTitleFontSize: number;
	audioTrackTitleLetterSpacing: number;
	audioTrackTitleWidth: number;
	audioTrackTitleOpacity: number;
	audioTrackTitleScrollSpeed: number;
	audioTrackTitleRgbShift: number;
	audioTrackTitleTextColor: string;
	audioTrackTitleTextColorSource: ColorSourceMode;
	audioTrackTitleStrokeColor: string;
	audioTrackTitleStrokeColorSource: ColorSourceMode;
	audioTrackTitleStrokeWidth: number;
	audioTrackTitleGlowColor: string;
	audioTrackTitleGlowColorSource: ColorSourceMode;
	audioTrackTitleGlowBlur: number;
	audioTrackTitleBackdropEnabled: boolean;
	audioTrackTitleBackdropColor: string;
	audioTrackTitleBackdropColorSource: ColorSourceMode;
	audioTrackTitleBackdropOpacity: number;
	audioTrackTitleBackdropPadding: number;
	audioTrackTitleFilterBrightness: number;
	audioTrackTitleFilterContrast: number;
	audioTrackTitleFilterSaturation: number;
	audioTrackTitleFilterBlur: number;
	audioTrackTitleFilterHueRotate: number;
	audioTrackTimeEnabled: boolean;
	audioTrackTimePositionX: number;
	audioTrackTimePositionY: number;
	audioTrackTimeWidth: number;
	audioTrackTimeFontStyle: TrackTitleFontStyle;
	audioTrackTimeFontSize: number;
	audioTrackTimeLetterSpacing: number;
	audioTrackTimeOpacity: number;
	audioTrackTimeRgbShift: number;
	audioTrackTimeTextColor: string;
	audioTrackTimeTextColorSource: ColorSourceMode;
	audioTrackTimeStrokeColor: string;
	audioTrackTimeStrokeColorSource: ColorSourceMode;
	audioTrackTimeStrokeWidth: number;
	audioTrackTimeGlowColor: string;
	audioTrackTimeGlowColorSource: ColorSourceMode;
	audioTrackTimeGlowBlur: number;
	audioTrackTimeFilterBrightness: number;
	audioTrackTimeFilterContrast: number;
	audioTrackTimeFilterSaturation: number;
	audioTrackTimeFilterBlur: number;
	audioTrackTimeFilterHueRotate: number;

	// Spectrum
	spectrumEnabled: boolean;
	spectrumMode: SpectrumMode;
	spectrumLinearOrientation: SpectrumLinearOrientation;
	spectrumLinearDirection: SpectrumLinearDirection;
	spectrumRadialShape: SpectrumRadialShape;
	spectrumRadialAngle: number;
	spectrumRadialFitLogo: boolean;
	spectrumFollowLogo: boolean;
	spectrumLogoGap: number;
	spectrumCircularClone: boolean;
	spectrumSpan: number;
	spectrumCloneOpacity: number;
	spectrumCloneScale: number;
	spectrumCloneGap: number;
	spectrumCloneStyle: SpectrumShape;
	spectrumCloneRadialShape: SpectrumRadialShape;
	spectrumCloneRadialAngle: number;
	spectrumCloneBarCount: number;
	spectrumCloneBarWidth: number;
	spectrumCloneMinHeight: number;
	spectrumCloneMaxHeight: number;
	spectrumCloneSmoothing: number;
	spectrumCloneGlowIntensity: number;
	spectrumCloneShadowBlur: number;
	spectrumClonePrimaryColor: string;
	spectrumCloneSecondaryColor: string;
	spectrumCloneColorSource: ColorSourceMode;
	spectrumCloneColorMode: SpectrumColorMode;
	spectrumCloneBandMode: SpectrumBandMode;
	spectrumCloneAudioSmoothingEnabled: boolean;
	spectrumCloneAudioSmoothing: number;
	spectrumCloneRotationSpeed: number;
	spectrumCloneMirror: boolean;
	spectrumClonePeakHold: boolean;
	spectrumClonePeakDecay: number;
	spectrumInnerRadius: number;
	spectrumBarCount: number;
	spectrumBarWidth: number;
	spectrumMinHeight: number;
	spectrumMaxHeight: number;
	spectrumSmoothing: number;
	spectrumOpacity: number;
	spectrumGlowIntensity: number;
	spectrumShadowBlur: number;
	spectrumPrimaryColor: string;
	spectrumSecondaryColor: string;
	spectrumColorSource: ColorSourceMode;
	spectrumColorMode: SpectrumColorMode;
	spectrumBandMode: SpectrumBandMode;
	spectrumAudioSmoothingEnabled: boolean;
	spectrumAudioSmoothing: number;
	spectrumShape: SpectrumShape;
	spectrumWaveFillOpacity: number;
	spectrumRotationSpeed: number;
	spectrumMirror: boolean;
	spectrumPeakHold: boolean;
	spectrumPeakDecay: number;
	spectrumPositionX: number;
	spectrumPositionY: number;
	spectrumCloneWaveFillOpacity: number;
	spectrumProfileSlots: ProfileSlot<SpectrumProfileSettings>[];

	// Logo
	logoEnabled: boolean;
	logoUrl: string | null;
	logoBaseSize: number;
	logoPositionX: number;
	logoPositionY: number;
	logoBandMode: LogoBandMode;
	logoAudioSmoothingEnabled: boolean;
	logoAudioSmoothing: number;
	logoAudioSensitivity: number;
	logoReactiveScaleIntensity: number;
	logoReactivitySpeed: number;
	logoAttack: number;
	logoRelease: number;
	logoMinScale: number;
	logoMaxScale: number;
	logoPunch: number;
	logoPeakWindow: number;
	logoPeakFloor: number;
	logoGlowColor: string;
	logoGlowColorSource: ColorSourceMode;
	logoGlowBlur: number;
	logoShadowEnabled: boolean;
	logoShadowColor: string;
	logoShadowColorSource: ColorSourceMode;
	logoShadowBlur: number;
	logoBackdropEnabled: boolean;
	logoBackdropColor: string;
	logoBackdropColorSource: ColorSourceMode;
	logoBackdropOpacity: number;
	logoBackdropPadding: number;
	logoProfileSlots: ProfileSlot<LogoProfileSettings>[];

	// Particles
	particlesEnabled: boolean;
	particleLayerMode: ParticleLayerMode;
	particleShape: ParticleShape;
	particleColor1: string;
	particleColor2: string;
	particleColorSource: ColorSourceMode;
	particleColorMode: ParticleColorMode;
	particleSizeMin: number;
	particleSizeMax: number;
	particleOpacity: number;
	particleGlow: boolean;
	particleGlowStrength: number;
	particleFilterBrightness: number;
	particleFilterContrast: number;
	particleFilterSaturation: number;
	particleFilterBlur: number;
	particleFilterHueRotate: number;
	particleScanlineIntensity: number;
	particleScanlineSpacing: number;
	particleScanlineThickness: number;
	particleRotationIntensity: number;
	particleRotationDirection: ParticleRotationDirection;
	particleFadeInOut: boolean;
	particleAudioReactive: boolean;
	particleAudioChannel: AudioReactiveChannel;
	particleAudioSizeBoost: number;
	particleAudioOpacityBoost: number;
	particleCount: number;
	particleSpeed: number;

	noiseIntensity: number;
	rgbShiftAudioReactive: boolean;
	rgbShiftAudioSensitivity: number;
	rgbShiftAudioChannel: AudioReactiveChannel;
	rgbShiftAudioSmoothingEnabled: boolean;
	rgbShiftAudioSmoothing: number;

	// Rain
	rainEnabled: boolean;
	rainIntensity: number;
	rainDropCount: number;
	rainAngle: number;
	rainMeshRotationZ: number;
	rainColor: string;
	rainColorSource: ColorSourceMode;
	rainColorMode: RainColorMode;
	rainParticleType: RainParticleType;
	rainLength: number;
	rainWidth: number;
	rainBlur: number;
	rainSpeed: number;
	rainVariation: number;

	// Slideshow
	slideshowEnabled: boolean;
	slideshowInterval: number;
	slideshowTransitionDuration: number;
	slideshowTransitionType: SlideshowTransitionType;
	slideshowTransitionIntensity: number;
	slideshowTransitionAudioDrive: number;
	slideshowTransitionAudioChannel: AudioReactiveChannel;
	slideshowResetPosition: boolean;
	slideshowAudioCheckpointsEnabled: boolean;
	slideshowTrackChangeSyncEnabled: boolean;
	activeImageId: string | null;
	backgroundImages: BackgroundImageItem[];
	imageUrls: string[];

	// Persistence (IndexedDB refs — blob URLs are reconstructed on load)
	imageIds: string[];
	logoId: string | null;
	overlays: OverlayImageItem[];
	selectedOverlayId: string | null;

	// System
	performanceMode: PerformanceMode;
	customPresets: CustomPresetsMap;
	activePreset: string;
	language: Language;
	isPresetDirty: boolean;
	showFps: boolean;
	controlPanelAnchor: ControlPanelAnchor;
	controlPanelActiveTab: string | null;
	fpsOverlayAnchor: ControlPanelAnchor;
	editorTheme: EditorTheme;
	editorThemeColorSource: ThemeColorSource;
	editorCornerRadius: number;
	editorManualAccentColor: string;
	editorManualSecondaryColor: string;
	editorManualBackdropColor: string;
	editorManualTextPrimaryColor: string;
	editorManualTextSecondaryColor: string;
	editorManualBackdropOpacity: number;
	editorManualBlurPx: number;
	editorManualSurfaceOpacity: number;
	quickActionsEnabled: boolean;
	quickActionsPositionX: number;
	quickActionsPositionY: number;
	quickActionsLauncherPositionX: number;
	quickActionsLauncherPositionY: number;
	quickActionsBackdropOpacity: number;
	quickActionsBlurPx: number;
	quickActionsScale: number;
	quickActionsLauncherSize: number;
	quickActionsColorSource: ThemeColorSource;
	quickActionsManualAccentColor: string;
	quickActionsManualSecondaryColor: string;
	quickActionsManualBackdropColor: string;
	quickActionsManualTextPrimaryColor: string;
	quickActionsManualTextSecondaryColor: string;
	quickActionsManualSurfaceOpacity: number;
	layerZIndices: Partial<Record<BuiltInLayerId, number>>;
	sleepModeEnabled: boolean;
	sleepModeDelaySeconds: number;
	sleepModeActive: boolean;
	/** Whether to scan and show local "Virtual Folders" in BG/Audio tabs. */
	virtualFoldersEnabled: boolean;
};
