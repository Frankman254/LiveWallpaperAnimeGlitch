import { MAX_LOGO_FIT_INFLATION } from '@/features/spectrum/geometry/radialGeometry';
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
export function resolveLogoSafeRadius(
	settings: {
		spectrumFollowLogo: boolean;
		spectrumRadialFitLogo: boolean;
		spectrumInnerRadius: number;
	},
	viewport?: SpectrumViewport
): number {
	if (!(settings.spectrumFollowLogo && settings.spectrumRadialFitLogo)) {
		return 0;
	}
	const requested = settings.spectrumInnerRadius;
	if (!viewport) return requested;
	// Clearing the logo scales the whole shape by up to MAX_LOGO_FIT_INFLATION,
	// so a big logo could push the outline clean off the canvas — a 400px logo
	// asks for ~260px of clearance, which `bowtie` turns into a 900px peak on a
	// 1080p screen. Capping the clearance caps the product. Only ever binds with
	// a logo large enough that the alternative is drawing off-screen.
	const budget = resolveAvailableRadius(viewport) / MAX_LOGO_FIT_INFLATION;
	return Math.min(requested, budget);
}

/** Canvas box plus where this spectrum sits inside it, in device pixels. */
export type SpectrumViewport = {
	width: number;
	height: number;
	cx: number;
	cy: number;
};

/** Builds the viewport a renderer needs from what it already has in hand. */
export function spectrumViewportFrom(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number
): SpectrumViewport {
	return { width: ctx.canvas.width, height: ctx.canvas.height, cx, cy };
}

/** Distance from the spectrum's centre to the nearest canvas edge. */
function resolveAvailableRadius(viewport: SpectrumViewport): number {
	return Math.max(
		1,
		Math.min(
			viewport.cx,
			viewport.cy,
			viewport.width - viewport.cx,
			viewport.height - viewport.cy
		)
	);
}

/**
 * How much the "sharp points" control narrows the selected shape's lobes.
 *
 * Lives next to `resolveLogoSafeRadius` for the same reason: every radial family
 * has to read it the same way, and a per-family copy is how the fit-logo toggle
 * ended up silently doing nothing outside the classic renderer.
 */
export function resolveRadialSharpness(settings: {
	spectrumRadialSharpness?: number;
}): number {
	const value = settings.spectrumRadialSharpness;
	if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(1, value));
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
