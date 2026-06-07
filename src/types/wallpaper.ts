import type { CustomPresetsMap } from './presets';
import type { AudioLyricsTrackEntry } from '@/features/lyrics/types';

export type PerformanceMode = 'low' | 'medium' | 'high';
export type UIMode = 'simple' | 'advanced';
export type ActiveTool =
	| 'none'
	| 'logo'
	| 'spectrum'
	| 'hud'
	| 'track-title'
	| 'lyrics';
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
/** Editor shell + synced UI: manual picks, built-in theme palettes, or current image palette. */
export type ThemeColorSource = 'manual' | 'theme' | 'image';
export type AudioCaptureState =
	| 'idle'
	| 'requesting'
	| 'active'
	| 'denied'
	| 'error'
	| 'no-audio-track';
export type AudioSourceMode = 'none' | 'desktop' | 'microphone' | 'file';
export type AudioMixMode =
	| 'manual'
	| 'sequential'
	| 'energy-match'
	| 'contrast';
export type AudioTransitionStyle =
	| 'linear'
	| 'smooth'
	| 'quick'
	| 'early-blend'
	| 'late-blend';
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
export type LyricsLayoutMode = TrackTitleLayoutMode;
/** Per-layer color origin: manual hex, app theme palette, or extracted image palette. */
export type ColorSourceMode = 'manual' | 'theme' | 'image';
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
export type SpectrumShockwaveBandThresholds = Partial<
	Record<ResolvedAudioReactiveChannel, number>
>;
export type SpectrumBandMode = AudioReactiveChannel;
export type SpectrumShape =
	| 'bars'
	| 'blocks'
	| 'lines'
	| 'wave'
	| 'dots'
	| 'capsules';
export type SpectrumMode = 'radial' | 'linear';
export type SpectrumFamily =
	| 'classic'
	| 'oscilloscope'
	| 'tunnel'
	| 'liquid'
	| 'orbital'
	| 'spiral';
export type SpectrumLinearOrientation = 'horizontal' | 'vertical';
export type SpectrumLinearDirection = 'normal' | 'flipped';
export type SpectrumShockwaveColorMode = 'cycle' | 'primary' | 'secondary';
export type SpectrumRadialShape =
	| 'pentagon'
	| 'star6'
	| 'circle'
	| 'square'
	| 'triangle'
	| 'star'
	| 'diamond'
	| 'hexagon'
	| 'octagon'
	| 'oval'
	| 'lens'
	| 'squircle'
	| 'roundedSquare'
	| 'cardioid'
	| 'heart'
	| 'moon'
	| 'drop'
	| 'flower4'
	| 'flower5'
	| 'flower6'
	| 'flower8'
	| 'lobed3'
	| 'gear6'
	| 'gear12'
	| 'scalloped'
	| 'deltoid'
	| 'astroid'
	| 'bulgedTriangle'
	| 'bulgedSquare'
	| 'concaveTriangle'
	| 'catEars'
	| 'starburst10'
	| 'starburst12';
export type ParticleRotationDirection = 'clockwise' | 'counterclockwise';
export type LogoBandMode = AudioReactiveChannel;
export type ParticleColorMode = 'solid' | 'gradient' | 'rainbow' | 'rotateRgb';
export type ParticleLayerMode = 'background' | 'foreground' | 'both';
export type ParticleAudioDriftMode = 'velocity' | 'offset' | 'burst';
export type ParticleDepthFlowDirection = 'towardViewer' | 'awayFromViewer';
export type ParticleDepthFlowMode =
	| 'pullToCamera'
	| 'pushFromFocus'
	| 'tunnelBurst'
	| 'snowRush';
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
	| 'spectrum'
	| 'particles'
	| 'rain'
	| 'track-title'
	| 'lyrics';
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
	| 'lyrics'
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
	audioOpacityReactive: boolean;
	audioOpacityAmount: number;
	audioOpacityInvert: boolean;
	audioOpacityChannel: AudioReactiveChannel;
}

export interface BackgroundImageItem {
	assetId: string;
	url: string | null;
	thumbnailUrl: string | null;
	/** Original upload filename when known. Older/imported assets may not have it. */
	originalFileName: string | null;
	/**
	 * When false the image stays in the pool (and keeps its per-image config)
	 * but the slideshow and manual nav skip it. Lets the user temporarily
	 * exclude images per song without losing them.
	 */
	enabled: boolean;
	// Transform
	scale: number;
	positionX: number;
	positionY: number;
	focusX: number | null;
	focusY: number | null;
	rotation: number;
	fitMode: ImageFitMode;
	coverageLockEnabled: boolean;
	mirror: boolean;
	mirrorFill: boolean;
	mirrorFillInvert: boolean;
	mirrorFillCount: number;
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
	particlesProfileSlotIndex: number | null;
	rainProfileSlotIndex: number | null;
	looksProfileSlotIndex: number | null;
	/** Inline per-image logo config. When set, takes priority over logoProfileSlotIndex. */
	logoOverride: LogoProfileSettings | null;
	/** Inline per-image spectrum config. When set, takes priority over spectrumProfileSlotIndex. */
	spectrumOverride: SpectrumProfileSettings | null;
	/** Inline per-image particles config. When set, takes priority over particlesProfileSlotIndex. */
	particlesOverride:
		| import('@/lib/featureProfiles').ParticlesProfileSettings
		| null;
	/** Inline per-image rain config. When set, takes priority over rainProfileSlotIndex. */
	rainOverride: import('@/lib/featureProfiles').RainProfileSettings | null;
	/** Inline per-image looks config. When set, takes priority over looksProfileSlotIndex. */
	looksOverride: import('@/lib/featureProfiles').LooksProfileSettings | null;
	/** Seconds into the audio track at which this image becomes active (manual timestamps mode). */
	playbackSwitchAt: number | null;
	/**
	 * Scene slot applied when this image becomes active. A Scene slot is a
	 * composition of references to feature slots (spectrum, looks, particles,
	 * rain, logo, trackTitle). `null` means no scene-level orchestration is
	 * applied; per-image overrides / profile slot indices still take effect.
	 */
	sceneSlotId: string | null;
}

export interface ProfileSlot<T> {
	name: string;
	values: T | null;
}

/**
 * A Scene slot stores only REFERENCES to feature slots. It never flattens raw
 * feature configuration. `null` for a reference means "do not apply this
 * subsystem"; the feature's current state is preserved.
 *
 * Motion (combined particles+rain) is intentionally NOT referenced here — use
 * `particlesSlotIndex` + `rainSlotIndex` for granular composition.
 */
/**
 * A "Setlist" is a saved, named curation of the global pool: which images
 * (by `BackgroundImageItem.assetId`) and which audio tracks (by playlist
 * track id) belong to this mix / video / theme. The library itself is
 * GLOBAL — setlists are references, not copies. When `activeSetlistId`
 * names a setlist, the rest of the app shows ONLY the items it lists.
 */
export interface Setlist {
	id: string;
	name: string;
	imageAssetIds: string[];
	trackIds: string[];
	/** Epoch ms — used to sort the panel newest-first if the user prefers. */
	createdAt: number;
}

export interface SceneSlot {
	id: string;
	name: string;
	spectrumSlotIndex: number | null;
	looksSlotIndex: number | null;
	particlesSlotIndex: number | null;
	rainSlotIndex: number | null;
	logoSlotIndex: number | null;
	trackTitleSlotIndex: number | null;
}

export interface SpectrumProfileSettings {
	spectrumEnabled: boolean;
	spectrumFamily: SpectrumFamily;
	/** Master switch for the Frame Memory effect (afterglow / motion trails /
	 *  ghost frames / history depth). When off the runtime skips the underlay
	 *  and the editor hides its controls. */
	spectrumFrameMemoryEnabled: boolean;
	spectrumAfterglow: number;
	spectrumMotionTrails: number;
	spectrumGhostFrames: number;
	/**
	 * Number of past frames blended into the ghost / motion-trail composite.
	 * Higher = longer visual memory (more cost). Capped per visual-quality
	 * tier in `historyDepthCapForTier()` so a `minimal` tier still tops out
	 * at 2 even if the user asks for 6.
	 */
	spectrumFrameHistoryDepth: number;
	/**
	 * How much the global energy envelope modulates bar height per frame.
	 * 0 = bars ignore the envelope entirely (only per-bin smoothed value
	 * drives height). 0.5 ≈ original behavior (subtle 8% peak pop). 1 =
	 * cinematic pop with 30% drop on silence + 20% surge on peaks. Used in
	 * `CircularSpectrum.ts` to compute `globalGain`.
	 */
	spectrumGainExpressiveness: number;
	/**
	 * Per-spectrum envelope shaping (mirrors logo/BG envelope params). These
	 * parameters drive `runtime.energyEnvelope.tick()` in CircularSpectrum.
	 * Defaults preserve the previously hardcoded values.
	 */
	spectrumEnvelopeAttack: number;
	spectrumEnvelopeRelease: number;
	spectrumEnvelopeReactivitySpeed: number;
	spectrumEnvelopePeakWindow: number;
	spectrumEnvelopePeakFloor: number;
	spectrumEnvelopePunch: number;
	spectrumPeakRibbonsEnabled: boolean;
	spectrumPeakRibbons: number;
	spectrumBassShockwaveEnabled: boolean;
	spectrumBassShockwave: number;
	spectrumShockwaveBandMode: SpectrumBandMode;
	/** Per-band trigger sensitivity. Lower values generate shockwaves more often. */
	spectrumShockwaveBandThresholds: SpectrumShockwaveBandThresholds;
	/** Main shockwave line thickness multiplier (0 = hairline, 1 = default). */
	spectrumShockwaveThickness: number;
	/** Main shockwave line opacity multiplier (0..1). */
	spectrumShockwaveOpacity: number;
	/** Main shockwave glow/blur multiplier (0 = no blur, 1 = default). */
	spectrumShockwaveBlur: number;
	/** Main shockwave color source. */
	spectrumShockwaveColorMode: SpectrumShockwaveColorMode;
	spectrumEnergyBloomEnabled: boolean;
	spectrumEnergyBloom: number;
	/** Main spectrum: rotates peak-ribbon polyline (deg). */
	spectrumPeakRibbonAngle: number;
	/** Main radial families: rotates the figure contour without rotating the bars. */
	spectrumFigureRotationSpeed: number;
	spectrumClonePeakRibbonsEnabled: boolean;
	spectrumClonePeakRibbons: number;
	/** Master switch for the Clone's Frame Memory effect. Independent from the
	 *  main spectrum's `spectrumFrameMemoryEnabled`. */
	spectrumCloneFrameMemoryEnabled: boolean;
	spectrumCloneAfterglow: number;
	spectrumCloneMotionTrails: number;
	spectrumCloneGhostFrames: number;
	spectrumCloneFrameHistoryDepth: number;
	spectrumCloneGainExpressiveness: number;
	spectrumCloneEnvelopeAttack: number;
	spectrumCloneEnvelopeRelease: number;
	spectrumCloneEnvelopeReactivitySpeed: number;
	spectrumCloneEnvelopePeakWindow: number;
	spectrumCloneEnvelopePeakFloor: number;
	spectrumCloneEnvelopePunch: number;
	spectrumCloneEnergyBloomEnabled: boolean;
	spectrumCloneEnergyBloom: number;
	spectrumCloneBassShockwaveEnabled: boolean;
	spectrumCloneBassShockwave: number;
	spectrumCloneShockwaveBandMode: SpectrumBandMode;
	spectrumCloneShockwaveBandThresholds: SpectrumShockwaveBandThresholds;
	spectrumCloneShockwaveThickness: number;
	spectrumCloneShockwaveOpacity: number;
	spectrumCloneShockwaveBlur: number;
	spectrumCloneShockwaveColorMode: SpectrumShockwaveColorMode;
	/** Circular clone: rotates peak-ribbon polyline (deg). */
	spectrumClonePeakRibbonAngle: number;
	/** Clone radial families: rotates the figure contour without rotating the bars. */
	spectrumCloneFigureRotationSpeed: number;
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
	spectrumCloneFamily: SpectrumFamily;
	spectrumCloneStyle: SpectrumShape;
	spectrumCloneRadialShape: SpectrumRadialShape;
	spectrumCloneRadialAngle: number;
	spectrumCloneBarCount: number;
	spectrumCloneBarWidth: number;
	spectrumCloneMinHeight: number;
	spectrumCloneMaxHeight: number;
	spectrumCloneSmoothing: number;
	spectrumCloneGlowIntensity: number;
	spectrumCloneGlowReach: number;
	spectrumCloneShadowBlur: number;
	spectrumClonePrimaryColor: string;
	spectrumCloneSecondaryColor: string;
	spectrumCloneColorSource: ColorSourceMode;
	spectrumCloneColorMode: SpectrumColorMode;
	spectrumCloneBandMode: SpectrumBandMode;
	spectrumCloneAudioSmoothing: number;
	spectrumCloneRotationSpeed: number;
	spectrumCloneRotationDrive: import('@/features/stageFx/stageFxConfig').SpectrumRotationDrive;
	spectrumCloneRotationAudioAmount: number;
	spectrumCloneRotationChannel: import('@/features/stageFx/stageFxConfig').SpectrumRotationChannel;
	spectrumCloneRotationDirection: import('@/features/stageFx/stageFxConfig').RotationDirection;
	spectrumCloneRotationSmoothing: number;
	spectrumCloneMirror: boolean;
	spectrumClonePeakHold: boolean;
	spectrumClonePeakDecay: number;
	spectrumCloneFollowLogo: boolean;
	spectrumCloneRadialFitLogo: boolean;
	spectrumClonePositionX: number;
	spectrumClonePositionY: number;
	spectrumInnerRadius: number;
	spectrumBarCount: number;
	spectrumBarWidth: number;
	spectrumMinHeight: number;
	spectrumMaxHeight: number;
	spectrumSmoothing: number;
	spectrumOpacity: number;
	spectrumGlowIntensity: number;
	spectrumGlowReach: number;
	spectrumShadowBlur: number;
	spectrumPrimaryColor: string;
	spectrumSecondaryColor: string;
	spectrumColorSource: ColorSourceMode;
	spectrumColorMode: SpectrumColorMode;
	spectrumBandMode: SpectrumBandMode;
	spectrumAudioSmoothing: number;
	spectrumShape: SpectrumShape;
	spectrumWaveFillOpacity: number;
	spectrumRotationSpeed: number;
	spectrumRotationDrive: import('@/features/stageFx/stageFxConfig').SpectrumRotationDrive;
	spectrumRotationAudioAmount: number;
	spectrumRotationChannel: import('@/features/stageFx/stageFxConfig').SpectrumRotationChannel;
	spectrumRotationDirection: import('@/features/stageFx/stageFxConfig').RotationDirection;
	spectrumRotationSmoothing: number;
	spectrumMirror: boolean;
	spectrumPeakHold: boolean;
	spectrumPeakDecay: number;
	spectrumPositionX: number;
	spectrumPositionY: number;
	spectrumCloneWaveFillOpacity: number;
	spectrumOscilloscopeLineWidth: number;
	spectrumTunnelRingCount: number;
	/** Far rings dimmer (0) vs uniform (1). */
	spectrumTunnelDepthFalloff: number;
	/** 0 = even ring spacing; 1 = pack rings toward the outer rim. */
	spectrumTunnelRingSpacing: number;
	/** Fill between rings for a tube wall (0 = outline only). */
	spectrumTunnelWallOpacity: number;
	/** How much audio pushes rings outward. */
	spectrumTunnelPulseStrength: number;
	/**
	 * When on, even-indexed rings rotate `+rotation` and odd-indexed rings
	 * rotate `-rotation` — produces a counter-rotating depth illusion that
	 * reads as a layered spinning corridor. Radial mode only (linear tunnel
	 * draws straight corridor lines, no rotation to invert).
	 */
	spectrumTunnelAlternateRotation: boolean;
	/** Liquid layer 1 (back) — opacity multiplier. */
	spectrumLiquidLayer1Opacity: number;
	spectrumLiquidLayer2Opacity: number;
	spectrumLiquidLayer3Opacity: number;
	/** Liquid per-layer audio amplitude multiplier. */
	spectrumLiquidLayer1Amp: number;
	spectrumLiquidLayer2Amp: number;
	spectrumLiquidLayer3Amp: number;
	/** Liquid per-layer fill multiplier (× wave fill). */
	spectrumLiquidLayer1Fill: number;
	spectrumLiquidLayer2Fill: number;
	spectrumLiquidLayer3Fill: number;
	/** Liquid per-layer wobble speed multiplier. */
	spectrumLiquidLayer1Speed: number;
	spectrumLiquidLayer2Speed: number;
	spectrumLiquidLayer3Speed: number;
	/** Liquid radial rigid shape: per-layer figure rotation speed. */
	spectrumLiquidLayer1RotationSpeed: number;
	spectrumLiquidLayer2RotationSpeed: number;
	spectrumLiquidLayer3RotationSpeed: number;
	spectrumLiquidLayer1Shape: SpectrumRadialShape;
	spectrumLiquidLayer2Shape: SpectrumRadialShape;
	spectrumLiquidLayer3Shape: SpectrumRadialShape;
	/**
	 * Liquid radial: per-layer "rigid shape" mode. When on for that layer,
	 * the layer keeps its contour stable and the whole figure scales with
	 * audio. When off, the contour wobbles with per-bin amplitude.
	 */
	spectrumLiquidLayer1RigidShape: boolean;
	spectrumLiquidLayer2RigidShape: boolean;
	spectrumLiquidLayer3RigidShape: boolean;
	/** Clone tunnel rings (independent of main). 0 = no tunnel rings (shockwave-only). */
	spectrumCloneTunnelRingCount: number;
	spectrumCloneTunnelDepthFalloff: number;
	spectrumCloneTunnelRingSpacing: number;
	spectrumCloneTunnelWallOpacity: number;
	spectrumCloneTunnelPulseStrength: number;
	spectrumCloneTunnelAlternateRotation: boolean;
	spectrumCloneLiquidLayer1Opacity: number;
	spectrumCloneLiquidLayer2Opacity: number;
	spectrumCloneLiquidLayer3Opacity: number;
	spectrumCloneLiquidLayer1Amp: number;
	spectrumCloneLiquidLayer2Amp: number;
	spectrumCloneLiquidLayer3Amp: number;
	spectrumCloneLiquidLayer1Fill: number;
	spectrumCloneLiquidLayer2Fill: number;
	spectrumCloneLiquidLayer3Fill: number;
	spectrumCloneLiquidLayer1Speed: number;
	spectrumCloneLiquidLayer2Speed: number;
	spectrumCloneLiquidLayer3Speed: number;
	spectrumCloneLiquidLayer1RotationSpeed: number;
	spectrumCloneLiquidLayer2RotationSpeed: number;
	spectrumCloneLiquidLayer3RotationSpeed: number;
	spectrumCloneLiquidLayer1Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer2Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer3Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer1RigidShape: boolean;
	spectrumCloneLiquidLayer2RigidShape: boolean;
	spectrumCloneLiquidLayer3RigidShape: boolean;
	/** Spiral family — total revolutions from inner to outer radius. */
	spectrumSpiralTurns: number;
	/** Spiral family — outer radius as a fraction of the short canvas side (0..1). */
	spectrumSpiralOuterRadius: number;
	/** Spiral family — radius growth ease (>1 = packed outer, <1 = packed inner). */
	spectrumSpiralTightness: number;
	/** Spiral family — outline shape modulating the radius per angle. */
	spectrumSpiralShape: SpectrumRadialShape;
	/** Spiral family — log radius mapping (galaxy-like vs Archimedean). */
	spectrumSpiralLogarithmic: boolean;
	/** Spiral family — paint each segment of the stroke with `getColor()` so the curve takes the gradient instead of staying primary-only. */
	spectrumSpiralGradientStroke: boolean;
	/** Spiral family — number of parallel arms (1..4) of the spiral, rotated evenly around the center. */
	spectrumSpiralArms: number;
	/** Spiral family — how much audio amplitude drives extra turn count on hits (0..1). */
	spectrumSpiralAudioTurns: number;
	/** Spiral family — dot shape variant. `'mix'` cycles through every shape per bin. */
	spectrumSpiralDotShape: SpectrumSpiralDotShape;
	/** Spiral family — multiplier on the connecting line width (0 hides the stroke). */
	spectrumSpiralStrokeWidth: number;
	spectrumCloneSpiralTurns: number;
	spectrumCloneSpiralOuterRadius: number;
	spectrumCloneSpiralTightness: number;
	spectrumCloneSpiralShape: SpectrumRadialShape;
	spectrumCloneSpiralLogarithmic: boolean;
	spectrumCloneSpiralGradientStroke: boolean;
	spectrumCloneSpiralArms: number;
	spectrumCloneSpiralAudioTurns: number;
	spectrumCloneSpiralDotShape: SpectrumSpiralDotShape;
	spectrumCloneSpiralStrokeWidth: number;
	/**
	 * Scope family — trace response factor. 1 = slow / persistent wave
	 * (heavy lerp with previous frame's PCM, the most "calm" visual), 4 =
	 * snap (raw PCM each frame, the most reactive visual). Despite the
	 * historic field name, this is not a spatial scroll or height amount. Drives the
	 * frame-to-frame lerp in `oscilloscopeRenderer.getScopeSmoothingAlpha`.
	 */
	spectrumOscilloscopeScrollSpeed: number;
	/** Scope family — line thickness modulates with amplitude when on. */
	spectrumOscilloscopeReactiveWidth: boolean;
	/** Scope family — CRT-style afterglow trail behind the live trace. */
	spectrumOscilloscopePhosphor: boolean;
	/** Scope family — phosphor decay rate (0.05 = slow fade, 0.4 = quick fade). */
	spectrumOscilloscopePhosphorDecay: number;
	/** Scope family — toggles a CRT reticle behind the trace. */
	spectrumOscilloscopeGrid: boolean;
	/** Scope family — number of major divisions in the reticle. */
	spectrumOscilloscopeGridDivisions: number;
	spectrumCloneOscilloscopeLineWidth: number;
	spectrumCloneOscilloscopeScrollSpeed: number;
	spectrumCloneOscilloscopeReactiveWidth: boolean;
	spectrumCloneOscilloscopePhosphor: boolean;
	spectrumCloneOscilloscopePhosphorDecay: number;
	spectrumCloneOscilloscopeGrid: boolean;
	spectrumCloneOscilloscopeGridDivisions: number;
	/**
	 * How audio + manual key input combine to drive the spectrum height:
	 *   - `audio`  : audio FFT only (legacy default)
	 *   - `max`    : per-section `max(audio, manual)` — manual lifts the
	 *                floor, audio still wins on peaks louder than the press
	 *   - `add`    : per-section `clamp(audio + manual * weight, 0, 1)` —
	 *                manual is additive, lets the user push past the natural
	 *                ceiling
	 *   - `manual` : audio ignored, only key presses drive the spectrum
	 */
	spectrumDriveMode: SpectrumDriveMode;
	/** How many sections the bar count is split into for manual key control (4..12). */
	spectrumManualSections: number;
	/** Weight of the manual signal when `spectrumDriveMode === 'add'`. */
	spectrumManualAddWeight: number;
	/** Time constant in seconds for a key press ramping the section to 1.0. */
	spectrumManualAttack: number;
	/** Time constant in seconds for a release dropping the section back to 0. */
	spectrumManualRelease: number;
}

export type SpectrumDriveMode = 'audio' | 'max' | 'add' | 'manual';

/** Maximum sections the user can split the bar count into. Keybindings
 *  array is sized to this even if the active sections slider is lower. */
export const MAX_SPECTRUM_MANUAL_SECTIONS = 12;

/** Glyph used to draw each spiral dot. `'mix'` cycles every concrete shape. */
export type SpectrumSpiralDotShape =
	| 'circle'
	| 'square'
	| 'triangle'
	| 'diamond'
	| 'star'
	| 'plus'
	| 'mix';

export interface LogoProfileSettings {
	logoEnabled: boolean;
	logoBaseSize: number;
	logoPositionX: number;
	logoPositionY: number;
	logoCircularCrop: boolean;
	logoCropRadius: number;
	logoBandMode: LogoBandMode;
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
	/** Master toggle for the glow ring around the logo. Default true. */
	logoGlowEnabled: boolean;
	logoGlowColor: string;
	logoGlowColorSource: ColorSourceMode;
	logoGlowBlur: number;
	logoGlowReach: number;
	logoShadowEnabled: boolean;
	logoShadowColor: string;
	logoShadowColorSource: ColorSourceMode;
	logoShadowBlur: number;
	logoBackdropEnabled: boolean;
	logoBackdropColor: string;
	logoBackdropColorSource: ColorSourceMode;
	logoBackdropOpacity: number;
	logoBackdropPadding: number;
	/** Rotation speed in radians per second. 0 = static. */
	logoRotationSpeed: number;
}

export interface BackgroundProfileSettings {
	imageBassReactive: boolean;
	imageCoverageLockEnabled: boolean;
	imageBassScaleIntensity: number;
	imageAudioReactiveDecay: number;
	imageAudioSmoothing: number;
	imageOpacityReactive: boolean;
	imageOpacityReactiveAmount: number;
	imageOpacityReactiveInvert: boolean;
	imageOpacityReactiveThreshold: number;
	imageOpacityReactiveSoftness: number;
	imageBlurReactive: boolean;
	imageBlurReactiveAmount: number;
	imageBlurReactiveInvert: boolean;
	imageBlurReactiveThreshold: number;
	imageBlurReactiveSoftness: number;
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
	/** Master switch for the Scanlines group (intensity + mode + spacing +
	 *  thickness). When off the runtime treats intensity as 0 and the editor
	 *  hides the group, preserving the stored values. */
	scanlinesEnabled: boolean;
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
	imageFocusX: number | null;
	imageFocusY: number | null;
	imageOpacity: number;
	imageBassReactive: boolean;
	imageCoverageLockEnabled: boolean;
	imageBassScaleIntensity: number;
	imageAudioReactiveDecay: number;
	imageAudioSmoothing: number;
	imageOpacityReactive: boolean;
	imageOpacityReactiveAmount: number;
	imageOpacityReactiveInvert: boolean;
	imageOpacityReactiveThreshold: number;
	imageOpacityReactiveSoftness: number;
	imageBlurReactive: boolean;
	imageBlurReactiveAmount: number;
	imageBlurReactiveInvert: boolean;
	imageBlurReactiveThreshold: number;
	imageBlurReactiveSoftness: number;
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
	imageMirrorFill: boolean;
	imageMirrorFillInvert: boolean;
	imageMirrorFillCount: number;
	/** Degrees; synced with active pool image `rotation`. */
	imageRotation: number;
	/** Debug HUD: live scale boost + audio drive (top-left) */
	showBackgroundScaleMeter: boolean;
	/** Debug HUD: spectrum channel, bins energy, gain, follow-logo placement */
	showSpectrumDiagnosticsHud: boolean;
	/** Debug HUD: logo drive, envelope, link to spectrum follow */
	showLogoDiagnosticsHud: boolean;
	/** Diagnostics HUD stack anchor (viewport fraction 0–1, top-left origin). */
	diagnosticsHudPositionX: number;
	diagnosticsHudPositionY: number;
	filterTargets: FilterTarget[];
	filterOpacity: number;
	filterBrightness: number;
	filterContrast: number;
	filterSaturation: number;
	filterBlur: number;
	filterHueRotate: number;
	filterVignette: number;
	filterBloom: number;
	filterLumaThreshold: number;
	filterLensWarp: number;
	filterHeatDistortion: number;
	activeFilterLookId: string | null;
	/** Saved tone / glitch / scanline bundle for the Custom look slot. */
	customFilterLookSettings:
		| import('@/features/filterLooks/filterLooks').FilterLookPreset['settings']
		| null;
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
	audioTrackTitleGlowReach: number;
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
	audioTrackTimeGlowReach: number;
	audioTrackTimeFilterBrightness: number;
	audioTrackTimeFilterContrast: number;
	audioTrackTimeFilterSaturation: number;
	audioTrackTimeFilterBlur: number;
	audioTrackTimeFilterHueRotate: number;
	audioLyricsEnabled: boolean;
	audioLyricsLayoutMode: LyricsLayoutMode;
	audioLyricsUppercase: boolean;
	audioLyricsPositionX: number;
	audioLyricsPositionY: number;
	audioLyricsWidth: number;
	audioLyricsFontStyle: TrackTitleFontStyle;
	audioLyricsFontSize: number;
	audioLyricsLetterSpacing: number;
	audioLyricsLineHeight: number;
	audioLyricsVisibleLineCount: number;
	audioLyricsOpacity: number;
	audioLyricsInactiveOpacity: number;
	audioLyricsTimeOffsetMs: number;
	audioLyricsActiveColor: string;
	audioLyricsActiveColorSource: ColorSourceMode;
	audioLyricsInactiveColor: string;
	audioLyricsInactiveColorSource: ColorSourceMode;
	audioLyricsGlowColor: string;
	audioLyricsGlowColorSource: ColorSourceMode;
	audioLyricsGlowBlur: number;
	audioLyricsGlowReach: number;
	audioLyricsBackdropEnabled: boolean;
	audioLyricsBackdropColor: string;
	audioLyricsBackdropColorSource: ColorSourceMode;
	audioLyricsBackdropOpacity: number;
	audioLyricsBackdropPadding: number;
	audioLyricsBackdropRadius: number;
	audioLyricsByTrackAssetId: Record<string, AudioLyricsTrackEntry>;

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
	spectrumCloneFamily: SpectrumFamily;
	spectrumCloneStyle: SpectrumShape;
	spectrumCloneRadialShape: SpectrumRadialShape;
	spectrumCloneRadialAngle: number;
	spectrumCloneBarCount: number;
	spectrumCloneBarWidth: number;
	spectrumCloneMinHeight: number;
	spectrumCloneMaxHeight: number;
	spectrumCloneSmoothing: number;
	spectrumCloneGlowIntensity: number;
	spectrumCloneGlowReach: number;
	spectrumCloneShadowBlur: number;
	spectrumClonePrimaryColor: string;
	spectrumCloneSecondaryColor: string;
	spectrumCloneColorSource: ColorSourceMode;
	spectrumCloneColorMode: SpectrumColorMode;
	spectrumCloneBandMode: SpectrumBandMode;
	spectrumCloneAudioSmoothing: number;
	spectrumCloneRotationSpeed: number;
	spectrumCloneRotationDrive: import('@/features/stageFx/stageFxConfig').SpectrumRotationDrive;
	spectrumCloneRotationAudioAmount: number;
	spectrumCloneRotationChannel: import('@/features/stageFx/stageFxConfig').SpectrumRotationChannel;
	spectrumCloneRotationDirection: import('@/features/stageFx/stageFxConfig').RotationDirection;
	spectrumCloneRotationSmoothing: number;
	spectrumCloneMirror: boolean;
	spectrumClonePeakHold: boolean;
	spectrumClonePeakDecay: number;
	spectrumCloneFollowLogo: boolean;
	spectrumCloneRadialFitLogo: boolean;
	spectrumClonePositionX: number;
	spectrumClonePositionY: number;
	spectrumInnerRadius: number;
	spectrumBarCount: number;
	spectrumBarWidth: number;
	spectrumMinHeight: number;
	spectrumMaxHeight: number;
	spectrumSmoothing: number;
	spectrumOpacity: number;
	spectrumGlowIntensity: number;
	spectrumGlowReach: number;
	spectrumShadowBlur: number;
	spectrumPrimaryColor: string;
	spectrumSecondaryColor: string;
	spectrumColorSource: ColorSourceMode;
	spectrumColorMode: SpectrumColorMode;
	spectrumBandMode: SpectrumBandMode;
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
	spectrumFamily: SpectrumFamily;
	/** Master switch for the Frame Memory effect (afterglow / motion trails /
	 *  ghost frames / history depth). When off the runtime skips the underlay
	 *  and the editor hides its controls. */
	spectrumFrameMemoryEnabled: boolean;
	spectrumAfterglow: number;
	spectrumMotionTrails: number;
	spectrumGhostFrames: number;
	spectrumFrameHistoryDepth: number;
	spectrumGainExpressiveness: number;
	/**
	 * Per-spectrum envelope shaping (mirrors logo/BG envelope params). These
	 * parameters drive `runtime.energyEnvelope.tick()` in CircularSpectrum.
	 * Defaults preserve the previously hardcoded values.
	 */
	spectrumEnvelopeAttack: number;
	spectrumEnvelopeRelease: number;
	spectrumEnvelopeReactivitySpeed: number;
	spectrumEnvelopePeakWindow: number;
	spectrumEnvelopePeakFloor: number;
	spectrumEnvelopePunch: number;
	spectrumPeakRibbonsEnabled: boolean;
	spectrumPeakRibbons: number;
	spectrumBassShockwaveEnabled: boolean;
	spectrumBassShockwave: number;
	spectrumShockwaveBandMode: SpectrumBandMode;
	spectrumShockwaveBandThresholds: SpectrumShockwaveBandThresholds;
	spectrumShockwaveThickness: number;
	spectrumShockwaveOpacity: number;
	spectrumShockwaveBlur: number;
	spectrumShockwaveColorMode: SpectrumShockwaveColorMode;
	spectrumEnergyBloomEnabled: boolean;
	spectrumEnergyBloom: number;
	spectrumPeakRibbonAngle: number;
	spectrumClonePeakRibbonsEnabled: boolean;
	spectrumClonePeakRibbons: number;
	/** Master switch for the Clone's Frame Memory effect. Independent from the
	 *  main spectrum's `spectrumFrameMemoryEnabled`. */
	spectrumCloneFrameMemoryEnabled: boolean;
	spectrumCloneAfterglow: number;
	spectrumCloneMotionTrails: number;
	spectrumCloneGhostFrames: number;
	spectrumCloneFrameHistoryDepth: number;
	spectrumCloneGainExpressiveness: number;
	spectrumCloneEnvelopeAttack: number;
	spectrumCloneEnvelopeRelease: number;
	spectrumCloneEnvelopeReactivitySpeed: number;
	spectrumCloneEnvelopePeakWindow: number;
	spectrumCloneEnvelopePeakFloor: number;
	spectrumCloneEnvelopePunch: number;
	spectrumCloneEnergyBloomEnabled: boolean;
	spectrumCloneEnergyBloom: number;
	spectrumCloneBassShockwaveEnabled: boolean;
	spectrumCloneBassShockwave: number;
	spectrumCloneShockwaveBandMode: SpectrumBandMode;
	spectrumCloneShockwaveBandThresholds: SpectrumShockwaveBandThresholds;
	spectrumCloneShockwaveThickness: number;
	spectrumCloneShockwaveOpacity: number;
	spectrumCloneShockwaveBlur: number;
	spectrumCloneShockwaveColorMode: SpectrumShockwaveColorMode;
	spectrumClonePeakRibbonAngle: number;
	spectrumFigureRotationSpeed: number;
	spectrumCloneFigureRotationSpeed: number;
	spectrumOscilloscopeLineWidth: number;
	spectrumTunnelRingCount: number;
	spectrumTunnelDepthFalloff: number;
	spectrumTunnelRingSpacing: number;
	spectrumTunnelWallOpacity: number;
	spectrumTunnelPulseStrength: number;
	spectrumTunnelAlternateRotation: boolean;
	spectrumLiquidLayer1Opacity: number;
	spectrumLiquidLayer2Opacity: number;
	spectrumLiquidLayer3Opacity: number;
	spectrumLiquidLayer1Amp: number;
	spectrumLiquidLayer2Amp: number;
	spectrumLiquidLayer3Amp: number;
	spectrumLiquidLayer1Fill: number;
	spectrumLiquidLayer2Fill: number;
	spectrumLiquidLayer3Fill: number;
	spectrumLiquidLayer1Speed: number;
	spectrumLiquidLayer2Speed: number;
	spectrumLiquidLayer3Speed: number;
	spectrumLiquidLayer1RotationSpeed: number;
	spectrumLiquidLayer2RotationSpeed: number;
	spectrumLiquidLayer3RotationSpeed: number;
	spectrumLiquidLayer1Shape: SpectrumRadialShape;
	spectrumLiquidLayer2Shape: SpectrumRadialShape;
	spectrumLiquidLayer3Shape: SpectrumRadialShape;
	spectrumLiquidLayer1RigidShape: boolean;
	spectrumLiquidLayer2RigidShape: boolean;
	spectrumLiquidLayer3RigidShape: boolean;
	spectrumCloneTunnelRingCount: number;
	spectrumCloneTunnelDepthFalloff: number;
	spectrumCloneTunnelRingSpacing: number;
	spectrumCloneTunnelWallOpacity: number;
	spectrumCloneTunnelPulseStrength: number;
	spectrumCloneTunnelAlternateRotation: boolean;
	spectrumCloneLiquidLayer1Opacity: number;
	spectrumCloneLiquidLayer2Opacity: number;
	spectrumCloneLiquidLayer3Opacity: number;
	spectrumCloneLiquidLayer1Amp: number;
	spectrumCloneLiquidLayer2Amp: number;
	spectrumCloneLiquidLayer3Amp: number;
	spectrumCloneLiquidLayer1Fill: number;
	spectrumCloneLiquidLayer2Fill: number;
	spectrumCloneLiquidLayer3Fill: number;
	spectrumCloneLiquidLayer1Speed: number;
	spectrumCloneLiquidLayer2Speed: number;
	spectrumCloneLiquidLayer3Speed: number;
	spectrumCloneLiquidLayer1RotationSpeed: number;
	spectrumCloneLiquidLayer2RotationSpeed: number;
	spectrumCloneLiquidLayer3RotationSpeed: number;
	spectrumCloneLiquidLayer1Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer2Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer3Shape: SpectrumRadialShape;
	spectrumCloneLiquidLayer1RigidShape: boolean;
	spectrumCloneLiquidLayer2RigidShape: boolean;
	spectrumCloneLiquidLayer3RigidShape: boolean;
	spectrumSpiralTurns: number;
	spectrumSpiralOuterRadius: number;
	spectrumSpiralTightness: number;
	spectrumSpiralShape: SpectrumRadialShape;
	spectrumSpiralLogarithmic: boolean;
	spectrumSpiralGradientStroke: boolean;
	spectrumSpiralArms: number;
	spectrumSpiralAudioTurns: number;
	spectrumSpiralDotShape: SpectrumSpiralDotShape;
	spectrumSpiralStrokeWidth: number;
	spectrumCloneSpiralTurns: number;
	spectrumCloneSpiralOuterRadius: number;
	spectrumCloneSpiralTightness: number;
	spectrumCloneSpiralShape: SpectrumRadialShape;
	spectrumCloneSpiralLogarithmic: boolean;
	spectrumCloneSpiralGradientStroke: boolean;
	spectrumCloneSpiralArms: number;
	spectrumCloneSpiralAudioTurns: number;
	spectrumCloneSpiralDotShape: SpectrumSpiralDotShape;
	spectrumCloneSpiralStrokeWidth: number;
	spectrumOscilloscopeScrollSpeed: number;
	spectrumOscilloscopeReactiveWidth: boolean;
	spectrumOscilloscopePhosphor: boolean;
	spectrumOscilloscopePhosphorDecay: number;
	spectrumOscilloscopeGrid: boolean;
	spectrumOscilloscopeGridDivisions: number;
	spectrumCloneOscilloscopeLineWidth: number;
	spectrumCloneOscilloscopeScrollSpeed: number;
	spectrumCloneOscilloscopeReactiveWidth: boolean;
	spectrumCloneOscilloscopePhosphor: boolean;
	spectrumCloneOscilloscopePhosphorDecay: number;
	spectrumCloneOscilloscopeGrid: boolean;
	spectrumCloneOscilloscopeGridDivisions: number;
	spectrumDriveMode: SpectrumDriveMode;
	spectrumManualSections: number;
	spectrumManualAddWeight: number;
	spectrumManualAttack: number;
	spectrumManualRelease: number;
	spectrumManualBindings: string[];
	showSpectrumManualHud: boolean;
	spectrumProfileSlots: ProfileSlot<SpectrumProfileSettings>[];

	// Logo
	logoEnabled: boolean;
	logoUrl: string | null;
	logoBaseSize: number;
	logoPositionX: number;
	logoPositionY: number;
	logoCircularCrop: boolean;
	logoCropRadius: number;
	logoBandMode: LogoBandMode;
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
	logoGlowEnabled: boolean;
	logoGlowColor: string;
	logoGlowColorSource: ColorSourceMode;
	logoGlowBlur: number;
	logoGlowReach: number;
	logoShadowEnabled: boolean;
	logoShadowColor: string;
	logoShadowColorSource: ColorSourceMode;
	logoShadowBlur: number;
	logoBackdropEnabled: boolean;
	logoBackdropColor: string;
	logoBackdropColorSource: ColorSourceMode;
	logoBackdropOpacity: number;
	logoBackdropPadding: number;
	logoRotationSpeed: number;
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
	particleGlowReach: number;
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
	particleAudioSmoothing: number;
	particleAudioSizeBoost: number;
	particleAudioOpacityBoost: number;
	// Envelope params — same shape as logo/bgZoom/spectrum so partículas tienen
	// física propia (attack/release/peakWindow/peakFloor/punch/responseSpeed).
	particleAudioAttack: number;
	particleAudioRelease: number;
	particleAudioReactivitySpeed: number;
	particleAudioPeakWindow: number;
	particleAudioPeakFloor: number;
	particleAudioPunch: number;
	particleAudioDriftEnabled: boolean;
	particleAudioDriftAngle: number;
	particleAudioDriftAmount: number;
	particleAudioDriftBase: number;
	particleAudioDriftChannel: AudioReactiveChannel;
	particleAudioDriftThreshold: number;
	particleAudioDriftRelease: number;
	particleAudioDriftMode: ParticleAudioDriftMode;
	particleDepthFlowEnabled: boolean;
	particleDepthFlowAmount: number;
	particleDepthFlowDirection: ParticleDepthFlowDirection;
	particleDepthFlowChannel: AudioReactiveChannel;
	particleDepthFlowThreshold: number;
	particleDepthFlowSensitivity: number;
	particleDepthFlowAttack: number;
	particleDepthFlowRelease: number;
	particleDepthFlowSpeed: number;
	particleDepthFlowSpread: number;
	particleDepthFlowFocusX: number;
	particleDepthFlowFocusY: number;
	particleDepthFlowMode: ParticleDepthFlowMode;
	particleCount: number;
	particleSpeed: number;
	particleLifetime: number;

	noiseIntensity: number;
	rgbShiftAudioReactive: boolean;
	rgbShiftAudioSensitivity: number;
	rgbShiftAudioChannel: AudioReactiveChannel;
	rgbShiftAudioSmoothing: number;
	// Envelope params para que el rgb shift respire en lugar de seguir el
	// canal raw multiplicado por la sensitivity.
	rgbShiftAudioAttack: number;
	rgbShiftAudioRelease: number;
	rgbShiftAudioReactivitySpeed: number;
	rgbShiftAudioPeakWindow: number;
	rgbShiftAudioPeakFloor: number;
	rgbShiftAudioPunch: number;

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
	/**
	 * @deprecated Kept for backward-compatible persistence only. Combined
	 * particles+rain bundle. New composition flow uses separate
	 * `particlesProfileSlots` + `rainProfileSlots` referenced from Scene slots.
	 */
	motionProfileSlots: ProfileSlot<
		import('@/lib/featureProfiles').MotionProfileSettings
	>[];
	/** User-saveable particles-only slots referenced by Scene slots. */
	particlesProfileSlots: ProfileSlot<
		import('@/lib/featureProfiles').ParticlesProfileSettings
	>[];
	/** User-saveable rain-only slots referenced by Scene slots. */
	rainProfileSlots: ProfileSlot<
		import('@/lib/featureProfiles').RainProfileSettings
	>[];
	/** User-saveable Looks (filter + post-fx) slots referenced by Scene slots. */
	looksProfileSlots: ProfileSlot<
		import('@/lib/featureProfiles').LooksProfileSettings
	>[];
	/** User-saveable Track Title slots referenced by Scene slots. */
	trackTitleProfileSlots: ProfileSlot<
		import('@/lib/featureProfiles').TrackTitleProfileSettings
	>[];
	/** Composition-only scene slots (references to feature slots). */
	sceneSlots: SceneSlot[];
	/** Last applied scene slot id (manual apply or slide binding). */
	activeSceneSlotId: string | null;

	/**
	 * Named bookmarks that curate which images and audio tracks are active
	 * for a given mix / video / theme. The global pool stays whole; each
	 * setlist just stores ID references. When `activeSetlistId` is set the
	 * pool, playlist, slideshow cycling, and audio auto-advance all FILTER
	 * to the setlist's members — non-members aren't shown at all.
	 * `activeSetlistId = null` means "show the whole pool" (default).
	 */
	setlists: Setlist[];
	/** Currently active setlist id, or null for "no filter". */
	activeSetlistId: string | null;
	/** Whether the on-screen Setlist HUD chip is visible when a setlist
	 *  is active. The HUD is the always-on indicator + quick deactivate.
	 *  When false the user relies on the in-panel switcher only. Default
	 *  true so newly-activated setlists give visible feedback. */
	showSetlistHud: boolean;

	/**
	 * Per-parameter slider range overrides used by the Calibration tab.
	 * Keys match field names on WallpaperState; missing keys fall back to
	 * the defaults declared in `src/features/calibration/calibrationConfig.ts`.
	 */
	calibrationRangeOverrides: import('@/features/calibration/calibrationConfig').CalibrationRangeOverrides;
	/** User-saveable slots that snapshot the reactivity calibration values. */
	calibrationProfileSlots: import('@/features/calibration/calibrationConfig').CalibrationProfileSlot[];
	/**
	 * Per-group "Sintético" toggle for the Calibration tab. When a group is
	 * `true`, the element it calibrates (e.g. logo, BG zoom) is driven by a
	 * synthetic 120 BPM test pulse instead of the live audio channel, so it
	 * can be calibrated in silence. Ephemeral — excluded from persistence.
	 */
	calibrationSyntheticGroups: import('@/features/calibration/calibrationConfig').CalibrationSyntheticGroups;

	// ── Radial spectrum rotation drive (Task 1) ──────────────────────────────
	/** off=no rotation, fixed=base speed, audio=energy-driven, fixed-audio=both. */
	spectrumRotationDrive: import('@/features/stageFx/stageFxConfig').SpectrumRotationDrive;
	/** Extra rotation speed (rad/s at full energy) added by audio. */
	spectrumRotationAudioAmount: number;
	spectrumRotationChannel: import('@/features/stageFx/stageFxConfig').SpectrumRotationChannel;
	spectrumRotationDirection: import('@/features/stageFx/stageFxConfig').RotationDirection;
	/** 0..1 EMA smoothing for the audio-driven rotation speed. */
	spectrumRotationSmoothing: number;

	// ── Stage Lights FX (Task 2) ─────────────────────────────────────────────
	stageLightsEnabled: boolean;
	stageLightsIntensity: number;
	/** @deprecated Compatibility source for pre-split Stage Lights settings. */
	stageLightsBeamCount: number;
	stageLightsMinBeamCount: number;
	stageLightsMaxBeamCount: number;
	stageLightsBeamWidth: number;
	stageLightsBeamLength: number;
	stageLightsSoftness: number;
	stageLightsSpeed: number;
	stageLightsFixedMotion: boolean;
	stageLightsColorSource: import('@/features/stageFx/stageFxConfig').StageLightsColorSource;
	stageLightsColor: string;
	stageLightsAudioReactive: boolean;
	stageLightsAudioChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	stageLightsAudioAmount: number;
	stageLightsAudioOscillationAmount: number;
	stageLightsAudioHoldMs: number;
	stageLightsAudioDecay: number;
	stageLightsAudioGateEnabled: boolean;
	/** @deprecated Migrated into the independent Flash Light layer. */
	stageLightsPeakFlash: boolean;
	stageLightsPeakThreshold: number;
	stageLightsBandThresholds: import('@/features/stageFx/stageFxConfig').FxBandThresholds;
	stageLightsOpacity: number;
	stageLightsBlendMode: import('@/features/stageFx/stageFxConfig').StageLightsBlendMode;
	stageLightsOrigin: import('@/features/stageFx/stageFxConfig').StageLightsOrigin;
	stageLightsMovementMode: import('@/features/stageFx/stageFxConfig').StageLightsMovementMode;
	stageLightsInvertDirection: boolean;
	stageLightsMirrorDirections: boolean;

	// ── Flash Light FX ──────────────────────────────────────────────────────
	flashLightEnabled: boolean;
	flashLightIntensity: number;
	flashLightColorSource: import('@/features/stageFx/stageFxConfig').StageLightsColorSource;
	flashLightColor: string;
	flashLightSoftness: number;
	flashLightBrightness: number;
	flashLightDecay: number;
	flashLightAudioChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	flashLightThreshold: number;
	flashLightBandThresholds: import('@/features/stageFx/stageFxConfig').FxBandThresholds;
	flashLightSensitivity: number;
	flashLightRetriggerMs: number;
	flashLightShape: import('@/features/stageFx/stageFxConfig').FlashLightShape;
	flashLightBlendMode: import('@/features/stageFx/stageFxConfig').StageLightsBlendMode;

	// ── Logo Edge Glow ───────────────────────────────────────────────────────
	logoEdgeGlowEnabled: boolean;
	logoEdgeGlowIntensity: number;
	logoEdgeGlowThickness: number;
	logoEdgeGlowRadius: number;
	logoEdgeGlowExpansionRadius: number;
	logoEdgeGlowOpacity: number;
	logoEdgeGlowColorSource: import('@/features/stageFx/stageFxConfig').StageLightsColorSource;
	logoEdgeGlowColor: string;
	logoEdgeGlowBlendMode: import('@/features/stageFx/stageFxConfig').StageLightsBlendMode;
	logoEdgeGlowAudioChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	logoEdgeGlowThreshold: number;
	logoEdgeGlowAttack: number;
	logoEdgeGlowRelease: number;
	logoEdgeGlowSensitivity: number;

	// ── Background Edge Glow ─────────────────────────────────────────────────
	bgEdgeGlowEnabled: boolean;
	bgEdgeGlowIntensity: number;
	bgEdgeGlowThickness: number;
	bgEdgeGlowRadius: number;
	bgEdgeGlowExpansionRadius: number;
	bgEdgeGlowOpacity: number;
	bgEdgeGlowColorSource: import('@/features/stageFx/stageFxConfig').StageLightsColorSource;
	bgEdgeGlowColor: string;
	bgEdgeGlowBlendMode: import('@/features/stageFx/stageFxConfig').StageLightsBlendMode;
	bgEdgeGlowAudioChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	bgEdgeGlowThreshold: number;
	bgEdgeGlowAttack: number;
	bgEdgeGlowRelease: number;
	bgEdgeGlowSensitivity: number;

	// ── Logo Flash Edge (Reactive Neon Edge — usa driver de Flash Light) ─────
	logoFlashEdgeEnabled: boolean;
	/** 0.1–3: multiplicador sobre el drive del Flash Light. */
	logoFlashEdgeIntensityMult: number;
	/** 1–16 px: grosor del trazo neon interior. */
	logoFlashEdgeThickness: number;
	/** 0–40 px: radio del bloom exterior. */
	logoFlashEdgeRadius: number;
	/** 'flash' = heredar color del Flash Light, 'manual' = override. */
	logoFlashEdgeColorMode: 'flash' | 'manual';
	logoFlashEdgeColor: string;

	// ── Background Flash Edge ────────────────────────────────────────────────
	bgFlashEdgeEnabled: boolean;
	bgFlashEdgeIntensityMult: number;
	bgFlashEdgeThickness: number;
	bgFlashEdgeRadius: number;
	bgFlashEdgeColorMode: 'flash' | 'manual';
	bgFlashEdgeColor: string;

	// ── Camera FX (Task 3) ───────────────────────────────────────────────────
	/** @deprecated Compatibility source for pre-split Camera FX settings. */
	cameraFxEnabled: boolean;
	cameraMotionEnabled: boolean;
	cameraMotionMode: import('@/features/stageFx/stageFxConfig').CameraMotionMode;
	cameraMotionAmount: number;
	cameraMotionSpeed: number;
	cameraMotionDrive: import('@/features/stageFx/stageFxConfig').CameraMotionDrive;
	cameraMotionAudioInfluence: number;
	cameraMotionAudioChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	cameraMotionDirection: import('@/features/stageFx/stageFxConfig').CameraMotionDirection;
	/** @deprecated Use `cameraMotionTargets` for multi-layer targeting. */
	cameraMotionTarget: import('@/features/stageFx/stageFxConfig').CameraMotionTarget;
	cameraMotionTargets: import('@/features/stageFx/stageFxConfig').CameraMotionTarget[];
	cameraShakeEnabled: boolean;
	cameraShakeAmount: number;
	cameraShakeDecay: number;
	cameraShakeThreshold: number;
	cameraShakeBandThresholds: import('@/features/stageFx/stageFxConfig').FxBandThresholds;
	cameraShakeTargets: import('@/features/stageFx/stageFxConfig').CameraMotionTarget[];
	cameraShakeSensitivity: number;
	cameraShakeRetriggerMs: number;
	cameraShakeChannel: import('@/features/stageFx/stageFxConfig').FxAudioChannel;
	cameraShakeMode: import('@/features/stageFx/stageFxConfig').ScreenShakeMode;
	cameraShakeFrequency: number;
	cameraShakeRoughness: number;

	// Slideshow
	slideshowEnabled: boolean;
	slideshowInterval: number;
	slideshowTransitionDuration: number;
	slideshowTransitionType: SlideshowTransitionType;
	slideshowTransitionIntensity: number;
	slideshowTransitionAudioDrive: number;
	slideshowTransitionAudioChannel: AudioReactiveChannel;
	slideshowTransitionAudioSmoothing: number;
	slideshowResetPosition: boolean;
	slideshowAudioCheckpointsEnabled: boolean;
	slideshowTrackChangeSyncEnabled: boolean;
	slideshowManualTimestampsEnabled: boolean;
	activeImageId: string | null;
	backgroundImages: BackgroundImageItem[];
	imageUrls: string[];

	// Persistence (IndexedDB refs — blob URLs are reconstructed on load)
	imageIds: string[];
	logoId: string | null;
	overlays: OverlayImageItem[];
	selectedOverlayId: string | null;

	// Responsive Layout
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	/** Persisted collapsed state for the editor shell sidebar. */
	editorSidebarCollapsed: boolean;

	// System
	performanceMode: PerformanceMode;
	customPresets: CustomPresetsMap;
	activePreset: string;
	language: Language;
	isPresetDirty: boolean;
	showFps: boolean;
	controlPanelAnchor: ControlPanelAnchor;
	/** Pixel offset applied on top of the anchor — set by dragging the panel
	 *  header. Reset to 0 via the anchor selector or a context menu. */
	controlPanelOffsetX: number;
	controlPanelOffsetY: number;
	/** Whether the floating Quick Edit per-image pill is visible on the canvas. */
	quickEditHudEnabled: boolean;
	/**
	 * Quick Edit capture flow:
	 *  - 'selection': per-row Capture/Clear (default, fine-grained).
	 *  - 'total':     one button captures all 5 subsystems at once.
	 */
	quickEditCaptureMode: 'total' | 'selection';
	/**
	 * Global color palette shared across every subsystem that exposes a
	 * color picker (spectrum, logo, BG, particles, etc.). Hex strings only;
	 * order is the visual order in the picker's favourites strip. Capped at
	 * ~32 entries to keep the strip readable — older entries roll off the
	 * end when the user pins a new one.
	 */
	colorFavorites: string[];
	controlPanelActiveTab: string | null;
	fpsOverlayAnchor: ControlPanelAnchor;
	editorTheme: EditorTheme;
	editorThemeColorSource: ThemeColorSource;
	editorCornerRadius: number;
	editorControlCornerRadius: number;
	/**
	 * Multiplier applied to the entire ControlPanel via CSS transform. Default
	 * `1`. Useful on very large displays where the editor would otherwise feel
	 * tiny in fullscreen. Range chosen for usefulness, not for symmetry: 0.7
	 * still fits in narrow tablets, 1.8 covers a 4K 34" without dwarfing the
	 * canvas.
	 */
	editorUiScale: number;
	editorShowPreciseNumericControls: boolean;
	/** Compact "icon mode" for preset/save slots: numbered pills instead of
	 *  named pills. Global editor UI preference. */
	editorCompactSlotIcons: boolean;
	editorManualAccentColor: string;
	editorManualSecondaryColor: string;
	editorManualBackdropColor: string;
	editorManualTextPrimaryColor: string;
	editorManualTextSecondaryColor: string;
	editorManualBackdropOpacity: number;
	editorManualBlurPx: number;
	editorManualSurfaceOpacity: number;
	editorManualItemOpacity: number;
	editorImagePreviewQuality: EditorImagePreviewQuality;
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
	quickActionsManualItemOpacity: number;
	layerZIndices: Partial<Record<BuiltInLayerId, number>>;
	sleepModeEnabled: boolean;
	sleepModeDelaySeconds: number;
	sleepModeActive: boolean;
	/** Whether to scan and show local "Virtual Folders" in BG/Audio tabs. */
	virtualFoldersEnabled: boolean;

	// Discovery UX (Phase 8)
	/** When true, the compact onboarding card in Scene is hidden. */
	discoveryOnboardingDismissed: boolean;
	/**
	 * Locks rendering to low cost: saves the previous `performanceMode` in
	 * `performanceModeBeforeSafe` so it can be restored when disabled.
	 */
	performanceSafeEnabled: boolean;
	performanceModeBeforeSafe: PerformanceMode | null;

	// Design mode
	uiMode: UIMode;
	enableDragMode: boolean;
	activeTool: ActiveTool;
};

export type EditorImagePreviewQuality = 'optimized' | 'original';
