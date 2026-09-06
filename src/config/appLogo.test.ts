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
	spectrumLiquidLayer1Pixelate: false,
	spectrumLiquidLayer2Pixelate: false,
	spectrumLiquidLayer3Pixelate: false,
	spectrumInstances: []
};

describe('Vibrix app logo variant', () => {
	it('uses the pixel mark for a pixel-block main spectrum', () => {
		expect(
			shouldUsePixelAppLogo({ ...BASE_STATE, spectrumShape: 'pixel' })
		).toBe(true);
	});

	it('uses the pixel mark for global or liquid-layer pixel effects', () => {
		expect(
			shouldUsePixelAppLogo({ ...BASE_STATE, spectrumPixelate: true })
		).toBe(true);
		expect(
			shouldUsePixelAppLogo({
				...BASE_STATE,
				spectrumFamily: 'liquid',
				spectrumLiquidLayer2Pixelate: true
			})
		).toBe(true);
	});

	it('also follows an enabled pixelated Spectrum 2', () => {
		const second = {
			enabled: true,
			spectrumFamily: 'classic' as const,
			spectrumShape: 'pixel' as const,
			spectrumPixelate: false,
			spectrumLiquidLayer1Pixelate: false,
			spectrumLiquidLayer2Pixelate: false,
			spectrumLiquidLayer3Pixelate: false
		};
		expect(
			shouldUsePixelAppLogo({
				...BASE_STATE,
				spectrumMainVisible: false,
				spectrumInstances: [second]
			})
		).toBe(true);
	});

	it('never replaces a user logo', () => {
		expect(resolveAppLogoUrl(APP_LOGO_URL, true)).toBe(APP_LOGO_PIXEL_URL);
		expect(resolveAppLogoUrl('blob:user-logo', true)).toBe(
			'blob:user-logo'
		);
	});
});
