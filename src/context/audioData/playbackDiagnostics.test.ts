import { describe, expect, it } from 'vitest';
import { classifyAnalyserState } from './playbackDiagnostics';

describe('classifyAnalyserState', () => {
	it('is idle when capture is not active', () => {
		expect(
			classifyAnalyserState({
				captureState: 'idle',
				audioPaused: false,
				peakAmplitude: 0.5
			})
		).toBe('idle');
	});

	it('is paused when active but paused (analyser inactive expected)', () => {
		expect(
			classifyAnalyserState({
				captureState: 'active',
				audioPaused: true,
				peakAmplitude: 0
			})
		).toBe('paused');
	});

	it('is playing-active when audio plays and analyser has signal', () => {
		expect(
			classifyAnalyserState({
				captureState: 'active',
				audioPaused: false,
				peakAmplitude: 0.2
			})
		).toBe('playing-active');
	});

	it('flags playing-inactive: the audible-but-frozen-canvas signature', () => {
		expect(
			classifyAnalyserState({
				captureState: 'active',
				audioPaused: false,
				peakAmplitude: 0
			})
		).toBe('playing-inactive');
	});

	it('treats sub-epsilon amplitude as inactive (no shimmer false-positive)', () => {
		expect(
			classifyAnalyserState({
				captureState: 'active',
				audioPaused: false,
				peakAmplitude: 0.00005
			})
		).toBe('playing-inactive');
	});
});
