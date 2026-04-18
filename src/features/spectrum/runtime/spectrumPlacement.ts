import type { SpectrumMode, WallpaperState } from '@/types/wallpaper';

export type SpectrumPlacementVariant = 'main' | 'clone-circular';

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
	| 'spectrumCloneGap'
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

export function resolveSpectrumPlacement(
	state: SpectrumPlacementState,
	options?: {
		variant?: SpectrumPlacementVariant;
		logoScale?: number;
	}
): SpectrumPlacementResolution {
	const variant = options?.variant ?? 'main';
	const isClone = variant === 'clone-circular';
	const spectrumMode: SpectrumMode = isClone ? 'radial' : state.spectrumMode;
	const followLogoSetting = isClone ? true : state.spectrumFollowLogo;
	const followLogoEffective =
		spectrumMode === 'radial' && followLogoSetting && state.logoEnabled;
	const positionLockedToLogo = followLogoEffective;
	const radialFitLogo = isClone ? true : state.spectrumRadialFitLogo;
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
			(isClone ? state.spectrumCloneGap : state.spectrumLogoGap);
		spectrumPositionX = state.logoPositionX;
		spectrumPositionY = state.logoPositionY;
	}

	return {
		spectrumMode,
		spectrumFollowLogo: followLogoSetting,
		spectrumRadialFitLogo: radialFitLogo,
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
		variant?: SpectrumPlacementVariant;
		logoScale?: number;
	}
): T & SpectrumPlacementResolution {
	const placement = resolveSpectrumPlacement(state, options);
	return {
		...state,
		...placement
	};
}
