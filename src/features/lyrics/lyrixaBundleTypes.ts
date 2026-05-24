export type LyrixaClipPositionPreset =
	| 'center'
	| 'top'
	| 'bottom'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

export type LyrixaLayerType = 'lyrics' | 'backing' | 'fx' | 'annotation';

export type LyrixaLyricTransitionPreset =
	| 'none'
	| 'fade'
	| 'fade-out'
	| 'slide-up'
	| 'slide-down'
	| 'scale-in'
	| 'scale-out'
	| 'blur-in'
	| 'blur-out'
	| 'glow-pop'
	| 'glitch-in'
	| 'glitch-out'
	| 'zoom-in'
	| 'zoom-out';

export type LyrixaLyricActiveAnimationPreset =
	| 'none'
	| 'pulse'
	| 'glow-pulse'
	| 'breathing'
	| 'shake-light'
	| 'wave'
	| 'flicker';

export type LyrixaLyricFxPreset =
	| 'none'
	| 'neon-glow'
	| 'rgb-shift'
	| 'glitch'
	| 'scanline'
	| 'chromatic-aberration'
	| 'blur-flicker'
	| 'wave-distort'
	| 'shadow-trail'
	| 'energy-pulse'
	| 'soft-bloom'
	| 'prism-shader'
	| 'liquid-shimmer'
	| 'heat-haze';

export type LyrixaLyricBlendMode =
	| 'normal'
	| 'screen'
	| 'multiply'
	| 'overlay'
	| 'plus-lighter';

export type LyrixaTextFillType = 'solid' | 'gradient' | 'image-texture';

export interface LyrixaTextGradientFill {
	colorA: string;
	colorB: string;
	angle: number;
}

export interface LyrixaTextImageTextureFill {
	id: string;
	objectUrl?: string;
	opacity: number;
	scale: number;
	offsetX: number;
	offsetY: number;
	fit: 'cover' | 'contain';
	missing?: boolean;
	fileName?: string;
}

export interface LyrixaTextFillConfig {
	type: LyrixaTextFillType;
	solidColor?: string;
	gradient?: LyrixaTextGradientFill;
	imageTexture?: LyrixaTextImageTextureFill;
}

export interface LyrixaLyricVisualStyle {
	textColor?: string;
	activeTextColor?: string;
	secondaryTextColor?: string;
	glowColor?: string;
	glowIntensity?: number;
	shadowIntensity?: number;
	blurAmount?: number;
	fontSize?: string;
	fontWeight?: string | number;
	fontFamily?: string;
	letterSpacing?: string;
	lineHeight?: string;
	lineSpacing?: string;
	alignment?: 'left' | 'center' | 'right';
	textTransform?: 'none' | 'uppercase' | 'lowercase';
	opacity?: number;
	strokeColor?: string;
	strokeWidth?: number;
	backgroundPill?: boolean;
	backgroundColor?: string;
	backgroundOpacity?: number;
	backgroundEmphasis?: boolean;
	textFill?: LyrixaTextFillConfig;
	textFillMode?: string;
	textGradient?: string;
	textTextureImage?: string;
	textTextureSize?: string;
	textTexturePosition?: string;
	textTextureRepeat?: 'repeat' | 'no-repeat';
	textTextureBrightness?: number;
	textTextureContrast?: number;
	textTextureSaturation?: number;
}

export interface LyrixaLyricAnimationConfig {
	transitionIn?: LyrixaLyricTransitionPreset;
	transitionOut?: LyrixaLyricTransitionPreset;
	activeAnimation?: LyrixaLyricActiveAnimationPreset;
	intensity?: number;
	durationMs?: number;
	exitLingerMs?: number;
	easing?: string;
	speed?: number;
}

export interface LyrixaLyricFxConfig {
	enabled?: boolean;
	preset?: LyrixaLyricFxPreset;
	intensity?: number;
	speed?: number;
	colorA?: string;
	colorB?: string;
	opacity?: number;
	blur?: number;
	blendMode?: LyrixaLyricBlendMode;
}

export interface LyrixaClipProgressIndicatorConfig {
	enabled?: boolean;
	color?: string;
	size?: number;
	glow?: number;
}

export interface LyrixaLyricCoordinates {
	x: number;
	y: number;
}

export interface LyrixaLyricClip {
	id: string;
	text: string;
	startTime: number;
	endTime: number;
	layerId: string;
	styleId?: string;
	styleOverride?: Partial<LyrixaLyricVisualStyle>;
	animationOverride?: Partial<LyrixaLyricAnimationConfig>;
	fxOverride?: Partial<LyrixaLyricFxConfig>;
	progressIndicatorOverride?: Partial<LyrixaClipProgressIndicatorConfig>;
	transitionIn?: LyrixaLyricTransitionPreset;
	transitionOut?: LyrixaLyricTransitionPreset;
	position?: LyrixaClipPositionPreset;
	coords?: LyrixaLyricCoordinates;
	locked?: boolean;
	muted?: boolean;
}

export interface LyrixaLayerRenderSettings {
	positionPreset: LyrixaClipPositionPreset;
	textAlign?: 'left' | 'center' | 'right';
	zIndex?: number;
}

export type LyrixaLayerAudioReactiveSource =
	| 'master'
	| 'vocals-stem'
	| 'estimated';

export type LyrixaLayerAudioReactiveBandMode =
	| 'full-mix'
	| 'vocals'
	| 'instrumental'
	| 'kick'
	| 'bass'
	| 'hihat';

export type LyrixaLayerAudioReactiveResponseMode = 'envelope' | 'peak';

export interface LyrixaLayerAudioReactiveTarget {
	amount: number;
	min: number;
	max: number;
}

export interface LyrixaLayerAudioReactiveTargets {
	opacity?: LyrixaLayerAudioReactiveTarget;
	blur?: LyrixaLayerAudioReactiveTarget;
	glowIntensity?: LyrixaLayerAudioReactiveTarget;
	scale?: LyrixaLayerAudioReactiveTarget;
	offsetY?: LyrixaLayerAudioReactiveTarget;
}

export interface LyrixaLayerAudioReactive {
	enabled: boolean;
	source: LyrixaLayerAudioReactiveSource;
	bandMode: LyrixaLayerAudioReactiveBandMode;
	responseMode: LyrixaLayerAudioReactiveResponseMode;
	attackMs: number;
	releaseMs: number;
	threshold: number;
	softness: number;
	invert: boolean;
	targets: LyrixaLayerAudioReactiveTargets;
}

export interface LyrixaLyricLayer {
	id: string;
	name: string;
	layerType: LyrixaLayerType;
	color: string;
	visible: boolean;
	locked: boolean;
	order: number;
	renderSettings?: LyrixaLayerRenderSettings;
	styleDefaults?: Partial<LyrixaLyricVisualStyle>;
	animationDefaults?: Partial<LyrixaLyricAnimationConfig>;
	fxDefaults?: Partial<LyrixaLyricFxConfig>;
	progressIndicatorDefaults?: Partial<LyrixaClipProgressIndicatorConfig>;
	audioReactive?: LyrixaLayerAudioReactive;
}

export interface LyrixaLyricsBundleSourceTrack {
	fileName: string;
	durationMs: number;
	fileKey?: string;
	sizeBytes?: number;
	lastModified?: number;
}

export interface LyrixaLyricsBundleProject {
	rawLyricsText: string;
	normalizedLyrics: string[];
	layers: LyrixaLyricLayer[];
	clips: LyrixaLyricClip[];
	styleConfig: LyrixaLyricVisualStyle;
	animationConfig: LyrixaLyricAnimationConfig;
	fxConfig: LyrixaLyricFxConfig;
	progressIndicatorConfig: LyrixaClipProgressIndicatorConfig;
}

export interface LyrixaLyricsBundleEnvelope {
	schemaVersion: 1;
	app: 'Lyrixa';
	exportKind: 'lyrics-bundle';
	exportedAt: string;
	projectName: string;
	sourceTrack: LyrixaLyricsBundleSourceTrack | null;
	project: LyrixaLyricsBundleProject;
}

export const LYRIXA_LYRICS_BUNDLE_APP = 'Lyrixa';
export const LYRIXA_LYRICS_BUNDLE_KIND = 'lyrics-bundle';
export const LYRIXA_LYRICS_BUNDLE_SCHEMA_VERSION = 1;

export const DEFAULT_LYRIXA_LYRIC_STYLE: Required<
	Pick<
		LyrixaLyricVisualStyle,
		| 'textColor'
		| 'activeTextColor'
		| 'secondaryTextColor'
		| 'glowColor'
		| 'glowIntensity'
		| 'shadowIntensity'
		| 'blurAmount'
		| 'fontSize'
		| 'fontWeight'
		| 'fontFamily'
		| 'letterSpacing'
		| 'lineHeight'
		| 'lineSpacing'
		| 'alignment'
		| 'textTransform'
		| 'opacity'
		| 'strokeColor'
		| 'strokeWidth'
		| 'backgroundPill'
		| 'backgroundColor'
		| 'backgroundOpacity'
		| 'backgroundEmphasis'
	>
> = {
	textColor: '#ffffff',
	activeTextColor: '#ffffff',
	secondaryTextColor: 'rgba(255, 255, 255, 0.2)',
	glowColor: 'rgba(255, 255, 255, 0.5)',
	glowIntensity: 0.7,
	shadowIntensity: 0.5,
	blurAmount: 2,
	fontSize: '2.5rem',
	fontWeight: '800',
	fontFamily: 'inherit',
	letterSpacing: '0px',
	lineHeight: '1.2',
	lineSpacing: '1.2',
	alignment: 'center',
	textTransform: 'none',
	opacity: 1,
	strokeColor: 'rgba(0, 0, 0, 0.65)',
	strokeWidth: 0,
	backgroundPill: false,
	backgroundColor: '#000000',
	backgroundOpacity: 0.28,
	backgroundEmphasis: false
};
