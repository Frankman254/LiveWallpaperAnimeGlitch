import { describe, expect, it } from 'vitest';
import {
	APP_LOGO_PIXEL_URL,
	APP_LOGO_URL,
	resolveAppLogoUrl,
	shouldUsePixelAppLogo
} from './appLogo';

const BASE_STATE = {
	spectrumEnabled: true,
	spectrumMainVisible: true,
	spectrumFamily: 'classic' as const,
	spectrumShape: 'bars' as const,
	spectrumPixelate: false,
	spectrumInstances: []
};

describe('Vibrix app logo variant', () => {
	it('uses the pixel mark for a pixel-block main spectrum', () => {
		expect(
			shouldUsePixelAppLogo({ ...BASE_STATE, spectrumShape: 'pixel' })
		).toBe(true);
	});

	it('uses the pixel mark for the spectrum-wide retro pixel effect', () => {
		expect(
			shouldUsePixelAppLogo({ ...BASE_STATE, spectrumPixelate: true })
		).toBe(true);
	});

	it('ignores pixelated liquid sublayers until the spectrum-wide effect is enabled', () => {
		expect(
			shouldUsePixelAppLogo({
				...BASE_STATE,
				spectrumFamily: 'liquid',
				spectrumShape: 'bars'
			})
		).toBe(false);
	});

	it('also follows an enabled pixelated Spectrum 2', () => {
		const second = {
			enabled: true,
			spectrumFamily: 'classic' as const,
			spectrumShape: 'pixel' as const,
			spectrumPixelate: false
		};
		expect(
			shouldUsePixelAppLogo({
				...BASE_STATE,
				spectrumMainVisible: false,
				spectrumInstances: [second]
			})
		).toBe(true);
	});

	it('supports vector, pixel, and automatic built-in variants', () => {
		expect(resolveAppLogoUrl(APP_LOGO_URL, 'vector', true)).toBe(
			APP_LOGO_URL
		);
		expect(resolveAppLogoUrl(APP_LOGO_URL, 'pixel', false)).toBe(
			APP_LOGO_PIXEL_URL
		);
		expect(resolveAppLogoUrl(APP_LOGO_URL, 'auto', true)).toBe(
			APP_LOGO_PIXEL_URL
		);
	});

	it('never replaces a user logo', () => {
		expect(resolveAppLogoUrl('blob:user-logo', 'pixel', true)).toBe(
			'blob:user-logo'
		);
	});
});
