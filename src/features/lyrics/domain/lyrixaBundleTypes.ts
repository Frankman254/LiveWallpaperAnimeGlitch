export type LyrixaClipPositionPreset =
	| 'center'
	| 'top'
	| 'bottom'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

export type LyrixaLayerType = 'lyrics' | 'backing' | 'fx' | 'annotation';

/**
 * What a layer carries, as declared by the authoring tool.
 *
 * `layerType` is the visual channel; two layers can share it and still mean
 * different things — a `backing` layer holds backing vocals in one bundle and
 * a Spanish translation in the next. The renderer needs that difference: the
 * translation is the line a viewer may want to switch off, and inferring it
 * from the layer's name would break the moment someone renames the layer.
 *
 * Absent on bundles produced before this field existed, so every consumer has
 * to behave sensibly without it.
 */
export type LyrixaLayerRole =
	| 'primary'
	| 'translation'
	| 'transliteration'
	| 'romanization'
	| 'backing'
	| 'fx'
	| 'annotation';

/**
 * Roles that mean "the same words, written in another script".
 *
 * Lyrixa has emitted both spellings: `transliteration` is the general term and
 * `romanization` the Latin-script special case that Japanese/Korean/Cyrillic
 * workflows actually produce. They are kept as distinct values rather than
 * collapsed, because a viewer choosing a secondary line cares which one they
 * are getting — but every consumer that only asks "is this the same words in
 * another script?" should use this set instead of comparing to one literal.
 */
export const LYRIXA_SCRIPT_ROLES: ReadonlySet<LyrixaLayerRole> = new Set([
	'transliteration',
	'romanization'
]);

/** Every role this build understands, in the order a UI should offer them. */
export const LYRIXA_LAYER_ROLES: readonly LyrixaLayerRole[] = [
	'primary',
	'translation',
	'transliteration',
	'romanization',
	'backing',
	'fx',
	'annotation'
];

/**
 * One word (or syllable) inside a clip, with its own timing.
 *
 * Lyrixa's transcription stage can produce these; this renderer does not draw
 * them yet. They are parsed and preserved anyway, because the alternative is
 * that a user imports a word-timed bundle, saves the project, and the timings
 * are silently gone — the import is lossy in a way nothing surfaces.
 *
 * Times are seconds from the start of the track, matching `LyrixaLyricClip`,
 * NOT offsets from the clip's own start. A word may carry `score` (the
 * transcriber's confidence, 0–1) which a future karaoke pass can use to decide
 * whether a word is trustworthy enough to highlight on its own.
 */
export interface LyrixaLyricWord {
	text: string;
	startTime: number;
	endTime: number;
	/** Transcriber confidence 0–1, when the producing tool reported one. */
	score?: number;
}

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
	/**
	 * The clip this one derives from. A translation clip points at the lyric
	 * line it translates, which is how the two layers stay paired even after
	 * one of them is re-timed or re-ordered in the editor.
	 */
	sourceId?: string;
	/**
	 * Pre-transliteration text, when `text` is a romanization. Keeping it means
	 * a renderer can offer the original script without a second bundle.
	 */
	originalText?: string;
	/**
	 * Word-level timings, when the authoring chain produced them. Nothing draws
	 * these yet — see `LyrixaLyricWord` for why they are carried anyway.
	 */
	words?: LyrixaLyricWord[];
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
	forceTextRender?: boolean;
}

export interface LyrixaLayerRenderSettings {
	positionPreset: LyrixaClipPositionPreset;
	textAlign?: 'left' | 'center' | 'right';
	zIndex?: number;
	suppressClipText?: boolean;
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
	/** What this layer carries. Absent on bundles authored before v1.1. */
	role?: LyrixaLayerRole;
	/**
	 * The role string exactly as the bundle spelled it, kept whenever it did
	 * not match a role this build knows.
	 *
	 * Dropping it would make the import lossy in the one direction that
	 * matters: Lyrixa is a separate, faster-moving project, so a role this
	 * renderer has never heard of is the *expected* case for a newer authoring
	 * tool — not corrupt data. Narrowed consumers keep reading `role`; a UI
	 * that wants to say "layer carries: karaoke (unknown to this version)"
	 * reads this.
	 */
	roleRaw?: string;
	/**
	 * BCP-47 code of the text on this layer, normalised (`ja`, `es-419`,
	 * `zh-Hant`), when the author declared one.
	 */
	language?: string;
	/** The language string exactly as written, when normalisation changed it. */
	languageRaw?: string;
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
