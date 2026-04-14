import {
	createAudioChannelSelectionState,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import type { WallpaperState } from '@/types/wallpaper';
import { createAudioEnvelope, type AudioEnvelope } from '@/utils/audioEnvelope';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';

export type SpectrumSettings = Pick<
	WallpaperState,
	| 'spectrumMode'
	| 'spectrumLinearOrientation'
	| 'spectrumLinearDirection'
	| 'spectrumRadialShape'
	| 'spectrumRadialAngle'
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
	| 'spectrumAudioSmoothingEnabled'
	| 'spectrumAudioSmoothing'
	| 'audioAutoKickThreshold'
	| 'audioAutoSwitchHoldMs'
	| 'spectrumWaveFillOpacity'
	| 'spectrumFamily'
	| 'spectrumOscilloscopeLineWidth'
	| 'spectrumTunnelRingCount'
	| 'spectrumSpectrogramDecay'
> & {
	spectrumRainbowColors?: string[];
};

export type SpectrumRuntimeState = {
	smoothedHeights: Float32Array;
	peakHeights: Float32Array;
	pixelHeights: Float32Array;
	pixelPeaks: Float32Array;
	rotation: number;
	idleTime: number;
	lastModeSignature: string;
	modeTransitionElapsed: number;
	modeTransitionSnapshotCanvas: HTMLCanvasElement | null;
	previousFrameCanvas: HTMLCanvasElement | null;
	energyEnvelope: AudioEnvelope;
	channelSelection: ReturnType<typeof createAudioChannelSelectionState>;
	// Oscilloscope family state
	oscilloscopeHistory?: Float32Array;
	oscilloscopeWriteIndex?: number;
	// Spectrogram family state
	spectrogramCanvas?: HTMLCanvasElement | null;
	spectrogramCtx?: CanvasRenderingContext2D | null;
	// Orbital family state
	orbitalAngles?: Float32Array;
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
		idleTime: 0,
		lastModeSignature: '',
		modeTransitionElapsed: MODE_TRANSITION_DURATION,
		modeTransitionSnapshotCanvas: null,
		previousFrameCanvas: null,
		energyEnvelope: createAudioEnvelope(),
		channelSelection: createAudioChannelSelectionState('instrumental')
	};
}

export function getSpectrumRuntimeState(instanceKey: string): SpectrumRuntimeState {
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
		settings.spectrumRadialFitLogo ? 'fit-logo' : 'free-radial',
		resolvedShape,
		settings.spectrumMirror ? 'mirror' : 'single',
		settings.spectrumColorMode,
		settings.spectrumBandMode,
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
