import type { SpectrumMode, WallpaperState } from '@/types/wallpaper';

export type SpectrumPlacementState = Pick<
	WallpaperState,
	| 'logoEnabled'
	| 'logoBaseSize'
	| 'logoMinScale'
	| 'logoPositionX'
	| 'logoPositionY'
	| 'logoBackdropEnabled'
	| 'logoBackdropPadding'
	| 'spectrumMode'
	| 'spectrumFollowLogo'
	| 'spectrumRadialFitLogo'
	| 'spectrumLogoGap'
	| 'spectrumInnerRadius'
	| 'spectrumPositionX'
	| 'spectrumPositionY'
>;

export type SpectrumPlacementResolution = {
	spectrumMode: SpectrumMode;
	spectrumFollowLogo: boolean;
	spectrumRadialFitLogo: boolean;
	spectrumInnerRadius: number;
	spectrumPositionX: number;
	spectrumPositionY: number;
	followLogoSetting: boolean;
	followLogoEffective: boolean;
	positionLockedToLogo: boolean;
};

/**
 * Minimum radius a radial contour may dip to when "Fit around logo" is on.
 *
 * Shapes with inward vertices (star, polygons) would otherwise cut through the
 * logo even though the nominal inner radius clears it. Classic was the only
 * family passing this into the shape math, so the toggle did nothing on
 * liquid / scope / tunnel / orbital — one helper keeps every family honest.
 */
export function resolveLogoSafeRadius(settings: {
	spectrumFollowLogo: boolean;
	spectrumRadialFitLogo: boolean;
	spectrumInnerRadius: number;
}): number {
	return settings.spectrumFollowLogo && settings.spectrumRadialFitLogo
		? settings.spectrumInnerRadius
		: 0;
}

/**
 * Resolves where one spectrum sits. Works for the main spectrum and for any
 * extra instance alike: instances carry the same main-named keys, so callers
 * merge `{ ...state, ...instanceSettings }` before resolving.
 */
export function resolveSpectrumPlacement(
	state: SpectrumPlacementState,
	options?: {
		logoScale?: number;
	}
): SpectrumPlacementResolution {
	const spectrumMode = state.spectrumMode;
	const followLogoSetting = state.spectrumFollowLogo;
	const followLogoEffective =
		spectrumMode === 'radial' && followLogoSetting && state.logoEnabled;
	const positionLockedToLogo = followLogoEffective;
	let spectrumInnerRadius = state.spectrumInnerRadius;
	let spectrumPositionX = state.spectrumPositionX;
	let spectrumPositionY = state.spectrumPositionY;

	if (followLogoEffective) {
		const effectiveLogoScale = Math.max(
			options?.logoScale ?? 1,
			state.logoMinScale,
			0.75
		);
		const logoRadius = (state.logoBaseSize * effectiveLogoScale) / 2;
		spectrumInnerRadius =
			logoRadius +
			(state.logoBackdropEnabled ? state.logoBackdropPadding : 4) +
			state.spectrumLogoGap;
		spectrumPositionX = state.logoPositionX;
		spectrumPositionY = state.logoPositionY;
	}

	return {
		spectrumMode,
		spectrumFollowLogo: followLogoSetting,
		spectrumRadialFitLogo: state.spectrumRadialFitLogo,
		spectrumInnerRadius,
		spectrumPositionX,
		spectrumPositionY,
		followLogoSetting,
		followLogoEffective,
		positionLockedToLogo
	};
}

export function applySpectrumPlacementToState<T extends SpectrumPlacementState>(
	state: T,
	options?: {
		logoScale?: number;
	}
): T & SpectrumPlacementResolution {
	const placement = resolveSpectrumPlacement(state, options);
	return {
		...state,
		...placement
	};
}
