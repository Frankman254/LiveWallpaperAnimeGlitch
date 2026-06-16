import { describe, it, expect } from 'vitest';
import { createAudioEnvelope, type AudioEnvelopeConfig } from './audioEnvelope';

const baseConfig: AudioEnvelopeConfig = {
	attack: 0.5,
	release: 0.5,
	responseSpeed: 1,
	peakWindow: 1,
	peakFloor: 0.25,
	punch: 0,
	scaleIntensity: 1,
	min: 0,
	max: 1
};

describe('createAudioEnvelope', () => {
	it('starts at a resting state with zero output', () => {
		const env = createAudioEnvelope();
		const state = env.getState();
		expect(state.value).toBe(0);
		expect(state.smoothedAmplitude).toBe(0);
	});

	it('keeps output within [min, max] across a noisy signal', () => {
		const env = createAudioEnvelope();
		const cfg = { ...baseConfig, min: 0.2, max: 0.9 };
		for (let i = 0; i < 200; i++) {
			const amp = Math.abs(Math.sin(i * 0.7)) * 1.5; // can exceed 1
			const { value } = env.tick(amp, 1 / 60, cfg);
			expect(value).toBeGreaterThanOrEqual(cfg.min);
			expect(value).toBeLessThanOrEqual(cfg.max);
		}
	});

	it('keeps normalizedAmplitude within [0, 1]', () => {
		const env = createAudioEnvelope();
		for (let i = 0; i < 200; i++) {
			const { normalizedAmplitude } = env.tick(
				Math.random() * 2,
				1 / 60,
				baseConfig
			);
			expect(normalizedAmplitude).toBeGreaterThanOrEqual(0);
			expect(normalizedAmplitude).toBeLessThanOrEqual(1);
		}
	});

	it('decays toward min when the signal goes silent', () => {
		const env = createAudioEnvelope();
		// Excite it first.
		for (let i = 0; i < 60; i++) env.tick(1, 1 / 60, baseConfig);
		const excited = env.getState().value;
		expect(excited).toBeGreaterThan(0);
		// Then feed silence.
		for (let i = 0; i < 600; i++) env.tick(0, 1 / 60, baseConfig);
		expect(env.getState().value).toBeLessThan(excited);
		expect(env.getState().value).toBeCloseTo(baseConfig.min, 2);
	});

	it('rises when a louder signal arrives', () => {
		const env = createAudioEnvelope();
		const quiet = env.tick(0.1, 1 / 60, baseConfig).value;
		let loud = quiet;
		for (let i = 0; i < 30; i++)
			loud = env.tick(1, 1 / 60, baseConfig).value;
		expect(loud).toBeGreaterThan(quiet);
	});

	it('reset() returns to the initial resting state', () => {
		const env = createAudioEnvelope();
		for (let i = 0; i < 60; i++) env.tick(1, 1 / 60, baseConfig);
		expect(env.getState().value).toBeGreaterThan(0);
		env.reset();
		const state = env.getState();
		expect(state.value).toBe(0);
		expect(state.smoothedAmplitude).toBe(0);
	});

	it('maps a sustained full signal toward the max bound', () => {
		const env = createAudioEnvelope();
		const cfg = { ...baseConfig, min: 0, max: 2 };
		let value = 0;
		for (let i = 0; i < 300; i++) value = env.tick(1, 1 / 60, cfg).value;
		// Sustained loudness should push the rendered value high in its range.
		expect(value).toBeGreaterThan(1);
		expect(value).toBeLessThanOrEqual(2);
	});
});
