import { describe, it, expect } from 'vitest';
import {
	SPECTRUM_INSTANCE_SETTING_KEYS,
	createDefaultSpectrumInstance,
	createDefaultSpectrumInstanceSettings
} from './spectrumInstanceModel';

// Regression guard for the "Scale slider reads undefined → toFixed crash" bug:
// every declared spectrum setting key MUST have a default. If a new key is added
// to SPECTRUM_INSTANCE_SETTING_KEYS without a matching default (and migration),
// the editor panels feed `undefined` into controls and crash. These tests fail
// loudly in that case.
describe('spectrum instance defaults', () => {
	it('defines a value for every declared setting key (settings factory)', () => {
		const settings =
			createDefaultSpectrumInstanceSettings() as unknown as Record<
				string,
				unknown
			>;
		for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
			expect(settings[key], `missing default for "${key}"`).toBeDefined();
		}
	});

	it('defines a value for every declared setting key (instance factory)', () => {
		const instance = createDefaultSpectrumInstance() as unknown as Record<
			string,
			unknown
		>;
		for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
			expect(
				instance[key],
				`instance missing default for "${key}"`
			).toBeDefined();
		}
	});

	it('has a finite numeric spectrumScale default', () => {
		const settings = createDefaultSpectrumInstanceSettings();
		expect(typeof settings.spectrumScale).toBe('number');
		expect(Number.isFinite(settings.spectrumScale)).toBe(true);
	});
});
