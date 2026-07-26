import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperState } from '@/types/wallpaper';
import { isInsideHitArea, resolveDragHitArea } from './dragHitArea';

const VIEWPORT = { width: 1920, height: 1080 };

function stateWith(patch: Partial<WallpaperState>): WallpaperState {
	return { ...DEFAULT_STATE, ...patch } as WallpaperState;
}

/** Where the HUD lives — the region that must stay clickable. */
const HUD_POINT = { x: 960, y: 1010 };

describe('resolveDragHitArea — spectrum', () => {
	it('covers the spectrum and nothing else', () => {
		const state = stateWith({
			spectrumMode: 'radial',
			spectrumPositionX: 0,
			spectrumPositionY: 0,
			spectrumInnerRadius: 80,
			spectrumMaxHeight: 120,
			spectrumScale: 1,
			spectrumFollowLogo: false,
			spectrumRadialFitLogo: false
		});
		const area = resolveDragHitArea('spectrum', state, VIEWPORT);

		expect(isInsideHitArea(area, 960, 540)).toBe(true);
		expect(isInsideHitArea(area, 960, 540 - 150)).toBe(true);
		// Far corner is nowhere near a 224px radius around the centre.
		expect(isInsideHitArea(area, 40, 40)).toBe(false);
	});

	it('leaves the HUD strip alone when the spectrum is centred', () => {
		// The whole point of the feature: a centred spectrum must not put a
		// capture surface over HUD controls at the bottom of the screen.
		const state = stateWith({
			spectrumMode: 'radial',
			spectrumPositionX: 0,
			spectrumPositionY: 0,
			spectrumInnerRadius: 80,
			spectrumMaxHeight: 120,
			spectrumScale: 1,
			spectrumFollowLogo: false,
			spectrumRadialFitLogo: false
		});
		const area = resolveDragHitArea('spectrum', state, VIEWPORT);
		expect(isInsideHitArea(area, HUD_POINT.x, HUD_POINT.y)).toBe(false);
	});

	it('follows the spectrum when it is moved', () => {
		const state = stateWith({
			spectrumMode: 'radial',
			spectrumPositionX: -0.8,
			spectrumPositionY: 0.8,
			spectrumInnerRadius: 60,
			spectrumMaxHeight: 60,
			spectrumScale: 1,
			spectrumFollowLogo: false,
			spectrumRadialFitLogo: false
		});
		const area = resolveDragHitArea('spectrum', state, VIEWPORT);

		// posY is stored Y-up, so +0.8 is near the TOP of the screen.
		expect(isInsideHitArea(area, 192, 108)).toBe(true);
		expect(isInsideHitArea(area, 960, 540)).toBe(false);
	});

	it('grows the area when fit-around-logo can inflate the shape', () => {
		const base = {
			spectrumMode: 'radial' as const,
			spectrumPositionX: 0,
			spectrumPositionY: 0,
			spectrumInnerRadius: 100,
			spectrumMaxHeight: 40,
			spectrumScale: 1,
			spectrumFollowLogo: false
		};
		const loose = resolveDragHitArea(
			'spectrum',
			stateWith({ ...base, spectrumRadialFitLogo: false }),
			VIEWPORT
		);
		const fitted = resolveDragHitArea(
			'spectrum',
			stateWith({ ...base, spectrumRadialFitLogo: true }),
			VIEWPORT
		);

		// A point beyond the un-inflated ring is reachable only when the shape
		// may be scaled up to clear the logo.
		expect(isInsideHitArea(loose, 960, 540 - 300)).toBe(false);
		expect(isInsideHitArea(fitted, 960, 540 - 300)).toBe(true);
	});

	it('spans the canvas across the bar axis in linear mode', () => {
		const state = stateWith({
			spectrumMode: 'linear',
			spectrumLinearOrientation: 'horizontal',
			spectrumPositionX: 0,
			spectrumPositionY: 0,
			spectrumMaxHeight: 100,
			spectrumScale: 1
		});
		const area = resolveDragHitArea('spectrum', state, VIEWPORT);

		expect(isInsideHitArea(area, 20, 540)).toBe(true);
		expect(isInsideHitArea(area, 1900, 540)).toBe(true);
		expect(isInsideHitArea(area, 960, 20)).toBe(false);
	});
});

describe('resolveDragHitArea — logo', () => {
	it('tracks the logo box', () => {
		const state = stateWith({
			logoEnabled: true,
			logoBaseSize: 200,
			logoMinScale: 1,
			logoPositionX: 0,
			logoPositionY: 0
		});
		const area = resolveDragHitArea('logo', state, VIEWPORT);

		expect(isInsideHitArea(area, 960, 540)).toBe(true);
		expect(isInsideHitArea(area, HUD_POINT.x, HUD_POINT.y)).toBe(false);
	});

	it('has nothing to grab when the logo is off', () => {
		const state = stateWith({ logoEnabled: false });
		const area = resolveDragHitArea('logo', state, VIEWPORT);

		expect(area).toBeNull();
		expect(isInsideHitArea(area, 960, 540)).toBe(false);
	});
});

describe('isInsideHitArea', () => {
	it('treats a missing area as nothing to grab', () => {
		// Fail closed: an unresolvable target must not re-enable a
		// full-viewport capture surface.
		expect(isInsideHitArea(null, 0, 0)).toBe(false);
	});
});
