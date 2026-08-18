import { describe, it, expect } from 'vitest';
import {
	defaultSceneIntent,
	normalizeHexColor,
	parseSceneIntent
} from './sceneIntent';

describe('normalizeHexColor', () => {
	it('accepts 3- and 6-digit hex with or without #', () => {
		expect(normalizeHexColor('#ABC')).toBe('#aabbcc');
		expect(normalizeHexColor('abc')).toBe('#aabbcc');
		expect(normalizeHexColor('#A1B2C3')).toBe('#a1b2c3');
		expect(normalizeHexColor('  #fff  ')).toBe('#ffffff');
	});

	it('rejects every other notation', () => {
		// hsl()/rgb() are used elsewhere in the app but must not enter intents:
		// slot values compare as strings, so mixed notation breaks slot reuse.
		for (const bad of [
			'hsl(200, 80%, 50%)',
			'rgb(1,2,3)',
			'red',
			'#12345',
			'#gggggg',
			'',
			null,
			42,
			{}
		]) {
			expect(normalizeHexColor(bad)).toBeNull();
		}
	});
});

describe('parseSceneIntent', () => {
	it('accepts a well-formed intent unchanged', () => {
		const input = {
			energy: 0.8,
			weight: 0.2,
			motion: 0.6,
			palette: {
				primary: '#ff0000',
				secondary: '#00ff00',
				accent: '#0000ff'
			},
			spectrumMode: 'linear',
			spectrumFamily: 'liquid',
			spectrumShape: 'wave',
			particles: 'sparks',
			rain: 'heavy',
			looks: 'glitch',
			lights: 'concert',
			rationale: 'loud neon frame'
		};
		const { intent, rejected } = parseSceneIntent(input);

		expect(rejected).toEqual([]);
		expect(intent).toMatchObject(input);
	});

	it('never throws on hostile input', () => {
		for (const bad of [
			null,
			undefined,
			42,
			'nope',
			[],
			NaN,
			{ palette: 7 }
		]) {
			expect(() => parseSceneIntent(bad)).not.toThrow();
		}
	});

	it('falls back to the default and reports every rejected field', () => {
		const { intent, rejected } = parseSceneIntent({
			energy: 'hot',
			weight: NaN,
			motion: Infinity,
			palette: { primary: 'red', secondary: '#0f0', accent: null },
			spectrumFamily: 'plasma',
			particles: 'confetti',
			looks: 'clean'
		});

		const defaults = defaultSceneIntent();
		expect(intent.energy).toBe(defaults.energy);
		expect(intent.weight).toBe(defaults.weight);
		expect(intent.motion).toBe(defaults.motion);
		expect(intent.spectrumFamily).toBe(defaults.spectrumFamily);
		expect(intent.particles).toBe(defaults.particles);
		// The one valid field survives.
		expect(intent.looks).toBe('clean');
		expect(intent.palette.secondary).toBe('#00ff00');

		expect(rejected).toEqual(
			expect.arrayContaining([
				'energy',
				'weight',
				'motion',
				'palette.primary',
				'palette.accent',
				'spectrumFamily',
				'particles'
			])
		);
	});

	it('clamps out-of-band scalars instead of rejecting them', () => {
		const { intent, rejected } = parseSceneIntent({
			energy: 5,
			weight: -3,
			motion: 0.25
		});
		expect(intent.energy).toBe(1);
		expect(intent.weight).toBe(0);
		expect(intent.motion).toBe(0.25);
		expect(rejected).not.toContain('energy');
	});

	it('truncates a rambling rationale', () => {
		const { intent } = parseSceneIntent({ rationale: 'x'.repeat(5000) });
		expect(intent.rationale.length).toBeLessThanOrEqual(400);
	});
});
