/**
 * The marks that ship with the app.
 *
 * `APP_LOGO_URL` is the default value of `logoUrl`, so it is both the browser
 * favicon and the logo drawn on the wallpaper until the user replaces it.
 * `APP_LOGO_PIXEL_URL` is the same mark sampled on a 24×24 grid — the same
 * radii, stroke widths and ±3 RGB split, one cell wide.
 */
import type { WallpaperState } from '@/types/wallpaper';

export const LEGACY_APP_LOGO_URL = '/favicon.svg';
export const APP_LOGO_URL = '/vibrix-logo.svg';
export const APP_LOGO_PIXEL_URL = '/logo-pixel.svg';

type PixelLogoSpectrumSettings = Pick<
	WallpaperState,
	| 'spectrumFamily'
	| 'spectrumShape'
	| 'spectrumPixelate'
	| 'spectrumLiquidLayer1Pixelate'
	| 'spectrumLiquidLayer2Pixelate'
	| 'spectrumLiquidLayer3Pixelate'
> & { enabled: boolean };

type PixelLogoWallpaperSettings = Pick<
	WallpaperState,
	| 'spectrumEnabled'
	| 'spectrumMainVisible'
	| 'spectrumFamily'
	| 'spectrumShape'
	| 'spectrumPixelate'
	| 'spectrumLiquidLayer1Pixelate'
	| 'spectrumLiquidLayer2Pixelate'
	| 'spectrumLiquidLayer3Pixelate'
> & {
	spectrumInstances: PixelLogoSpectrumSettings[];
};

function usesPixelSurface(
	settings: Omit<PixelLogoSpectrumSettings, 'enabled'>
): boolean {
	return (
		settings.spectrumPixelate ||
		(settings.spectrumFamily === 'classic' &&
			settings.spectrumShape === 'pixel') ||
		(settings.spectrumFamily === 'liquid' &&
			(settings.spectrumLiquidLayer1Pixelate ||
				settings.spectrumLiquidLayer2Pixelate ||
				settings.spectrumLiquidLayer3Pixelate))
	);
}

export function shouldUsePixelAppLogo(
	state: PixelLogoWallpaperSettings
): boolean {
	if (!state.spectrumEnabled) return false;
	if (state.spectrumMainVisible && usesPixelSurface(state)) return true;
	return state.spectrumInstances.some(
		instance => instance.enabled && usesPixelSurface(instance)
	);
}

/**
 * Swap in the pixel mark while the spectrum is pixelated, so the logo reads as
 * part of the same picture instead of a smooth object floating over blocks.
 *
 * Only ever applies to the mark that ships with the app: a logo the user
 * uploaded is theirs, and silently replacing it with ours would be a bug, not
 * a feature.
 */
export function resolveAppLogoUrl(
	logoUrl: string | null,
	pixelated: boolean
): string | null {
	if (!pixelated) return logoUrl;
	return logoUrl === APP_LOGO_URL || logoUrl === LEGACY_APP_LOGO_URL
		? APP_LOGO_PIXEL_URL
		: logoUrl;
}
