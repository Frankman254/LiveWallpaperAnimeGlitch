import type { AudioCaptureState } from '@/types/wallpaper';

export type AnalyserDiagnosis =
	| 'idle' // no active capture
	| 'paused' // capture active, intentionally paused
	| 'playing-active' // capture active, not paused, analyser producing signal
	| 'playing-inactive'; // capture active, not paused, but analyser is silent

const ANALYSER_SILENCE_EPSILON = 0.0001;

/**
 * Classifies the live relationship between playback state and analyser output.
 * `playing-inactive` is the diagnostic signature of the "audio audible but
 * canvas frozen" bug — the app believes audio is playing, yet the analyser
 * produces no signal (the snapshot is being forced empty by stale paused flags
 * or a disconnected/suspended graph).
 */
export function classifyAnalyserState(input: {
	captureState: AudioCaptureState;
	audioPaused: boolean;
	peakAmplitude: number;
}): AnalyserDiagnosis {
	if (input.captureState !== 'active') return 'idle';
	if (input.audioPaused) return 'paused';
	return input.peakAmplitude > ANALYSER_SILENCE_EPSILON
		? 'playing-active'
		: 'playing-inactive';
}
