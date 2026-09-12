import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/store/defaultState';
import type { SpectrumSettings } from '@/features/spectrum';
import { resolveScaledSpectrumSettings } from './CircularSpectrum';

/**
 * Guards what `spectrumScale` is allowed to multiply.
 *
 * Scale must grow the *figure*. For the scope family the radial figure is a
 * contour wrapped around `spectrumInnerRadius`, so Scale has to scale that
 * radius too — otherwise the ring stays fixed and Scale only fattens the
 * wave. Classic radial keeps its historical semantics (Scale lengthens bars,
 * hole unchanged) so existing presets don't shift. And when Follow Logo is
 * effective, `innerRadius` is derived from the logo (which has its own scale),
 * so multiplying it would drift the ring off the logo.
 */
function settings(patch: Partial<SpectrumSettings> = {}): SpectrumSettings {
	return {
		...DEFAULT_STATE,
		...patch
	} as unknown as SpectrumSettings;
}

describe('resolveScaledSpectrumSettings', () => {
	it('is the identity at scale 1', () => {
		const s = settings({ spectrumScale: 1 });
		expect(resolveScaledSpectrumSettings(s)).toBe(s);
	});

	it('grows the scope figure: innerRadius scales with Scale', () => {
		const s = settings({
			spectrumScale: 2,
			spectrumFamily: 'oscilloscope',
			spectrumMode: 'radial',
			spectrumInnerRadius: 120,
			spectrumFollowLogo: false,
			logoEnabled: true
		});
		const out = resolveScaledSpectrumSettings(s);
		expect(out.spectrumInnerRadius).toBe(240);
		expect(out.spectrumMaxHeight).toBe(
			s.spectrumMaxHeight * 2 // amplitude still scales
		);
	});

	it('leaves innerRadius alone when Follow Logo drives the ring', () => {
		const s = settings({
			spectrumScale: 2,
			spectrumFamily: 'oscilloscope',
			spectrumMode: 'radial',
			spectrumInnerRadius: 120,
			spectrumFollowLogo: true,
			logoEnabled: true
		});
		const out = resolveScaledSpectrumSettings(s);
		expect(out.spectrumInnerRadius).toBe(120);
	});

	it('leaves innerRadius alone when the logo is off', () => {
		// Follow Logo checked but logo disabled: innerRadius is the raw user
		// value again, so Scale owns it.
		const s = settings({
			spectrumScale: 2,
			spectrumFamily: 'oscilloscope',
			spectrumMode: 'radial',
			spectrumInnerRadius: 120,
			spectrumFollowLogo: true,
			logoEnabled: false
		});
		expect(resolveScaledSpectrumSettings(s).spectrumInnerRadius).toBe(240);
	});

	it('keeps classic radial semantics: hole unchanged, bars lengthen', () => {
		const s = settings({
			spectrumScale: 2,
			spectrumFamily: 'classic',
			spectrumMode: 'radial',
			spectrumInnerRadius: 120
		});
		const out = resolveScaledSpectrumSettings(s);
		expect(out.spectrumInnerRadius).toBe(120);
		expect(out.spectrumMaxHeight).toBe(s.spectrumMaxHeight * 2);
	});
});
