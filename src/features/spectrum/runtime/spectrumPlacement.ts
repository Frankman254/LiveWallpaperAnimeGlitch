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
