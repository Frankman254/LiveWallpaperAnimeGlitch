import {
	createAudioChannelSelectionState,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import type {
	ResolvedAudioReactiveChannel,
	WallpaperState
} from '@/types/wallpaper';
import { createAudioEnvelope, type AudioEnvelope } from '@/utils/audioEnvelope';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';

export type SpectrumSettings = Pick<
	WallpaperState,
	| 'spectrumMode'
	| 'logoEnabled'
	| 'spectrumLinearOrientation'
	| 'spectrumLinearDirection'
	| 'spectrumRadialShape'
	| 'spectrumRadialAngle'
	| 'spectrumFigureRotationSpeed'
	| 'spectrumRadialFitLogo'
	| 'spectrumFollowLogo'
	| 'spectrumLogoGap'
	| 'spectrumSpan'
	| 'spectrumInnerRadius'
	| 'spectrumBarCount'
	| 'spectrumBarWidth'
	| 'spectrumMinHeight'
	| 'spectrumMaxHeight'
	| 'spectrumOpacity'
	| 'spectrumGlowIntensity'
	| 'spectrumShadowBlur'
	| 'spectrumPrimaryColor'
	| 'spectrumSecondaryColor'
	| 'spectrumColorMode'
	| 'spectrumBandMode'
	| 'spectrumMirror'
	| 'spectrumPeakHold'
	| 'spectrumPeakDecay'
	| 'spectrumRotationSpeed'
	| 'spectrumSmoothing'
	| 'spectrumShape'
	| 'spectrumPositionX'
	| 'spectrumPositionY'
	| 'spectrumAudioSmoothing'
	| 'audioAutoKickThreshold'
	| 'audioAutoSwitchHoldMs'
	| 'spectrumWaveFillOpacity'
	| 'spectrumFamily'
	| 'spectrumAfterglow'
	| 'spectrumMotionTrails'
	| 'spectrumGhostFrames'
	| 'spectrumFrameHistoryDepth'
	| 'spectrumGainExpressiveness'
	| 'spectrumEnvelopeAttack'
	| 'spectrumEnvelopeRelease'
	| 'spectrumEnvelopeReactivitySpeed'
	| 'spectrumEnvelopePeakWindow'
	| 'spectrumEnvelopePeakFloor'
	| 'spectrumEnvelopePunch'
	| 'spectrumPeakRibbons'
	| 'spectrumPeakRibbonAngle'
	| 'spectrumBassShockwave'
	| 'spectrumShockwaveBandMode'
	| 'spectrumShockwaveBandThresholds'
	| 'spectrumShockwaveThickness'
	| 'spectrumShockwaveOpacity'
	| 'spectrumShockwaveBlur'
	| 'spectrumShockwaveColorMode'
	| 'spectrumEnergyBloom'
	| 'spectrumOscilloscopeLineWidth'
	| 'spectrumTunnelRingCount'
	| 'spectrumTunnelDepthFalloff'
	| 'spectrumTunnelRingSpacing'
	| 'spectrumTunnelWallOpacity'
	| 'spectrumTunnelPulseStrength'
	| 'spectrumTunnelAlternateRotation'
	| 'spectrumLiquidLayer1Opacity'
	| 'spectrumLiquidLayer2Opacity'
	| 'spectrumLiquidLayer3Opacity'
	| 'spectrumLiquidLayer1Amp'
	| 'spectrumLiquidLayer2Amp'
	| 'spectrumLiquidLayer3Amp'
	| 'spectrumLiquidLayer1Fill'
	| 'spectrumLiquidLayer2Fill'
	| 'spectrumLiquidLayer3Fill'
	| 'spectrumLiquidLayer1Speed'
	| 'spectrumLiquidLayer2Speed'
	| 'spectrumLiquidLayer3Speed'
	| 'spectrumLiquidLayer1RotationSpeed'
	| 'spectrumLiquidLayer2RotationSpeed'
	| 'spectrumLiquidLayer3RotationSpeed'
	| 'spectrumLiquidLayer1Shape'
	| 'spectrumLiquidLayer2Shape'
	| 'spectrumLiquidLayer3Shape'
	| 'spectrumLiquidLayer1RigidShape'
	| 'spectrumLiquidLayer2RigidShape'
	| 'spectrumLiquidLayer3RigidShape'
	| 'spectrumSpiralTurns'
	| 'spectrumSpiralOuterRadius'
	| 'spectrumSpiralTightness'
	| 'spectrumSpiralShape'
	| 'spectrumSpiralLogarithmic'
	| 'spectrumSpiralGradientStroke'
	| 'spectrumSpiralArms'
	| 'spectrumSpiralAudioTurns'
	| 'spectrumSpiralDotShape'
	| 'spectrumSpiralStrokeWidth'
	| 'spectrumOscilloscopeScrollSpeed'
	| 'spectrumOscilloscopeReactiveWidth'
	| 'spectrumOscilloscopePhosphor'
	| 'spectrumOscilloscopePhosphorDecay'
	| 'spectrumOscilloscopeGrid'
	| 'spectrumOscilloscopeGridDivisions'
	| 'spectrumDriveMode'
	| 'spectrumManualSections'
	| 'spectrumManualAddWeight'
	| 'spectrumManualAttack'
	| 'spectrumManualRelease'
> & {
	spectrumRainbowColors?: string[];
};

export type SpectrumShockwave = {
	radius: number;
	alpha: number;
	thickness: number;
	speed: number;
};

export type SpectrumShockwaveAdaptiveLevel = {
	floor: number;
	peak: number;
	lastNormalized: number;
};

export type SpectrumRuntimeState = {
	smoothedHeights: Float32Array;
	peakHeights: Float32Array;
	pixelHeights: Float32Array;
	pixelPeaks: Float32Array;
	rotation: number;
	figureRotation: number;
	idleTime: number;
	lastModeSignature: string;
	modeTransitionElapsed: number;
	modeTransitionSnapshotCanvas: HTMLCanvasElement | null;
	previousFrameCanvas: HTMLCanvasElement | null;
	energyEnvelope: AudioEnvelope;
	channelSelection: ReturnType<typeof createAudioChannelSelectionState>;
	/** Separate auto/kick routing for Bass Shockwave trigger (does not affect main spectrum bins). */
	shockwaveChannelSelection: ReturnType<
		typeof createAudioChannelSelectionState
	>;
	// Oscilloscope family state — phosphor afterglow canvas + temporal
	// smoothing buffer. `oscilloscopeSmoothedSamples` holds the lerped PCM
	// (initialized at 128 = silence baseline). Each frame the renderer
	// blends the live AnalyserNode samples into this buffer using a factor
	// derived from `spectrumOscilloscopeScrollSpeed`, then compensates
	// amplitude so response speed does not double as a hidden height control.
	oscilloscopePhosphorCanvas?: HTMLCanvasElement | null;
	oscilloscopeSmoothedSamples?: Float32Array;
	// Orbital family state
	orbitalAngles?: Float32Array;
	// Frame memory / feedback buffers
	feedbackCanvas?: HTMLCanvasElement | null;
	frameHistoryCanvases?: Array<HTMLCanvasElement | null>;
	frameHistoryIndex?: number;
	// Reactive accent FX
	shockwaves?: SpectrumShockwave[];
	shockwaveAdaptiveLevels?: Partial<
		Record<ResolvedAudioReactiveChannel, SpectrumShockwaveAdaptiveLevel>
	>;
	lastShockwaveLevel?: number;
	lastShockwaveResolvedChannel?: ResolvedAudioReactiveChannel;
	lastShockwaveTime?: number;
};

export { type AudioSnapshot };

export const MODE_TRANSITION_DURATION = 0.32;

const spectrumRuntimeMap = new Map<string, SpectrumRuntimeState>();

export function createSpectrumRuntimeState(): SpectrumRuntimeState {
	return {
		smoothedHeights: new Float32Array(0),
		peakHeights: new Float32Array(0),
		pixelHeights: new Float32Array(0),
		pixelPeaks: new Float32Array(0),
		rotation: 0,
		figureRotation: 0,
		idleTime: 0,
		lastModeSignature: '',
		modeTransitionElapsed: MODE_TRANSITION_DURATION,
		modeTransitionSnapshotCanvas: null,
		previousFrameCanvas: null,
		energyEnvelope: createAudioEnvelope(),
		channelSelection: createAudioChannelSelectionState('instrumental'),
		shockwaveChannelSelection: createAudioChannelSelectionState('bass'),
		feedbackCanvas: null,
		frameHistoryCanvases: [],
		frameHistoryIndex: 0,
		shockwaves: [],
		shockwaveAdaptiveLevels: {},
		lastShockwaveLevel: 0,
		lastShockwaveResolvedChannel: 'bass',
		lastShockwaveTime: Number.NEGATIVE_INFINITY
	};
}

export function getSpectrumRuntimeState(
	instanceKey: string
): SpectrumRuntimeState {
	const existing = spectrumRuntimeMap.get(instanceKey);
	if (existing) return existing;
	const created = createSpectrumRuntimeState();
	spectrumRuntimeMap.set(instanceKey, created);
	return created;
}

export function resizeFloatArrayPreserve(
	source: Float32Array,
	nextLength: number
): Float32Array {
	if (nextLength <= 0) return new Float32Array(0);
	if (source.length === 0) return new Float32Array(nextLength);
	if (source.length === nextLength) return source.slice();

	const next = new Float32Array(nextLength);
	for (let i = 0; i < nextLength; i++) {
		const t = nextLength === 1 ? 0 : i / Math.max(nextLength - 1, 1);
		const sourceIndex = t * Math.max(source.length - 1, 0);
		const lower = Math.floor(sourceIndex);
		const upper = Math.min(source.length - 1, Math.ceil(sourceIndex));
		const alpha = sourceIndex - lower;
		next[i] = source[lower] * (1 - alpha) + source[upper] * alpha;
	}
	return next;
}

export function ensureFloatArrayLength(
	source: Float32Array,
	nextLength: number
): Float32Array {
	return source.length === nextLength ? source : new Float32Array(nextLength);
}

export function buildModeSignature(settings: SpectrumSettings): string {
	const resolvedShape = normalizeSpectrumShape(settings.spectrumShape);
	return [
		settings.spectrumFamily,
		settings.spectrumMode,
		settings.spectrumLinearOrientation,
		settings.spectrumLinearDirection,
		settings.spectrumRadialShape,
		`liquid-rigid:${[
			settings.spectrumLiquidLayer1RigidShape ? '1' : '0',
			settings.spectrumLiquidLayer2RigidShape ? '1' : '0',
			settings.spectrumLiquidLayer3RigidShape ? '1' : '0'
		].join('')}`,
		settings.spectrumRadialFitLogo ? 'fit-logo' : 'free-radial',
		resolvedShape,
		settings.spectrumMirror ? 'mirror' : 'single',
		settings.spectrumColorMode,
		settings.spectrumBandMode,
		settings.spectrumShockwaveBandMode,
		settings.spectrumBarCount,
		settings.spectrumFollowLogo ? 'follow' : 'free'
	].join('|');
}

export function ensureSnapshotCanvas(
	existing: HTMLCanvasElement | null,
	width: number,
	height: number
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return existing;
	const canvas = existing ?? document.createElement('canvas');
	if (canvas.width !== width) canvas.width = width;
	if (canvas.height !== height) canvas.height = height;
	return canvas;
}

export function copyCanvas(
	source: HTMLCanvasElement,
	target: HTMLCanvasElement | null
): void {
	if (!target) return;
	const context = target.getContext('2d');
	if (!context) return;
	context.clearRect(0, 0, target.width, target.height);
	context.drawImage(source, 0, 0, target.width, target.height);
}

export function resetSpectrumRuntime(): void {
	spectrumRuntimeMap.clear();
}
