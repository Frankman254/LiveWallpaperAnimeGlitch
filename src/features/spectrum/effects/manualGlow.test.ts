import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/store/defaultState';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import { asGlowColorSettings, resolveManualGlow } from './manualGlow';

/**
 * Non-colour fields report reads; a spread means the object was cloned whole.
 */
function probedSettings(patch: Partial<SpectrumSettings> = {}) {
	const reads: string[] = [];
	const base = {
		...DEFAULT_STATE,
		spectrumManualGlow: true,
		spectrumManualGlowMode: 'core-halo',
		spectrumGlowColorMode: 'gradient',
		spectrumGlowPrimaryColor: '#ff0000',
		spectrumGlowSecondaryColor: '#0000ff',
		...patch
	} as unknown as SpectrumSettings;

	for (const key of [
		'spectrumBarWidth',
		'spectrumShadowBlur',
		'spectrumBarCount',
		'spectrumMinHeight'
	] as const) {
		const value = base[key];
		Object.defineProperty(base, key, {
			enumerable: true,
			configurable: true,
			get() {
				reads.push(key);
				return value;
			}
		});
	}
	return { settings: base, reads };
}

describe('resolveManualGlow — per-bar cost', () => {
	it('does not walk the whole settings object', () => {
		const { settings, reads } = probedSettings();
		resolveManualGlow(settings, 0.5, '#00ff00');
		expect(reads).toEqual([]);
	});

	it('does not walk it in any glow layout', () => {
		for (const mode of ['gradient', 'peaks', 'core-halo'] as const) {
			const { settings, reads } = probedSettings({
				spectrumManualGlowMode: mode
			} as Partial<SpectrumSettings>);
			resolveManualGlow(settings, 0.25, '#00ff00');
			expect(reads, `walked the object in ${mode}`).toEqual([]);
		}
	});

	it('still follows the fill colour when the toggle is off', () => {
		const { settings } = probedSettings({ spectrumManualGlow: false });
		expect(resolveManualGlow(settings, 0.5, '#123456')).toEqual({
			core: '#123456',
			halo: '#123456',
			peak: null
		});
	});

	it('resolves the glow colours from the glow palette, not the fill', () => {
		const { settings } = probedSettings({
			spectrumGlowColorMode: 'solid'
		} as Partial<SpectrumSettings>);
		const glow = resolveManualGlow(settings, 0.5, '#00ff00');
		expect(glow.core).toBe('#ff0000');
		expect(glow.halo).toBe('#ff0000');
	});
});

describe('asGlowColorSettings — the once-per-figure view', () => {
	// Gradient builders need a full object; this runs once per figure, not per bar.
	it('keeps every field and remaps the colour ones', () => {
		const { settings } = probedSettings();
		const view = asGlowColorSettings(settings);
		expect(view.spectrumColorMode).toBe('gradient');
		expect(view.spectrumPrimaryColor).toBe('#ff0000');
		expect(view.spectrumSecondaryColor).toBe('#0000ff');
		expect(view.spectrumBarCount).toBe(settings.spectrumBarCount);
		expect(view.spectrumMinHeight).toBe(settings.spectrumMinHeight);
	});
});
