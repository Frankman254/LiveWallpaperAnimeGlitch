import { describe, expect, it } from 'vitest';
import {
	MAX_LOGO_FIT_INFLATION,
	RADIAL_SHAPE_IDS,
	getRadialBaseRadius
} from '@/features/spectrum/geometry/radialGeometry';
import { resolveLogoSafeRadius } from './spectrumPlacement';

const FIT_ON = {
	spectrumFollowLogo: true,
	spectrumRadialFitLogo: true
};

describe('resolveLogoSafeRadius', () => {
	it('honours the requested clearance when it comfortably fits', () => {
		expect(
			resolveLogoSafeRadius(
				{ ...FIT_ON, spectrumInnerRadius: 60 },
				{ width: 1920, height: 1080, cx: 960, cy: 540 }
			)
		).toBe(60);
	});

	it('passes the request straight through with no viewport to measure', () => {
		expect(
			resolveLogoSafeRadius({ ...FIT_ON, spectrumInnerRadius: 400 })
		).toBe(400);
	});

	it('stays at zero when the toggle is off, viewport or not', () => {
		expect(
			resolveLogoSafeRadius(
				{
					spectrumFollowLogo: true,
					spectrumRadialFitLogo: false,
					spectrumInnerRadius: 260
				},
				{ width: 1920, height: 1080, cx: 960, cy: 540 }
			)
		).toBe(0);
	});

	it('keeps every shape on the canvas behind a large logo', () => {
		// A 400px logo asks for ~260px of clearance, which the deepest shape
		// would otherwise inflate into a ~900px peak on a 1080p screen.
		const viewport = { width: 1920, height: 1080, cx: 960, cy: 540 };
		const edge = Math.min(
			viewport.cx,
			viewport.cy,
			viewport.width - viewport.cx,
			viewport.height - viewport.cy
		);
		const safeRadius = resolveLogoSafeRadius(
			{ ...FIT_ON, spectrumInnerRadius: 260 },
			viewport
		);

		for (const shapeId of RADIAL_SHAPE_IDS) {
			for (let i = 0; i < 256; i++) {
				const angle = (i / 256) * Math.PI * 2;
				expect(
					getRadialBaseRadius(
						shapeId,
						safeRadius,
						angle,
						0,
						safeRadius
					),
					`${shapeId} leaves the canvas at ${angle.toFixed(3)}`
				).toBeLessThanOrEqual(edge + 1e-6);
			}
		}
	});

	it('caps clearance by the nearest edge, not the diagonal', () => {
		// An off-centre spectrum has less room on one side; the budget has to
		// follow the tight side or the shape spills past it.
		const offCentre = resolveLogoSafeRadius(
			{ ...FIT_ON, spectrumInnerRadius: 400 },
			{ width: 1920, height: 1080, cx: 200, cy: 540 }
		);
		expect(offCentre).toBeCloseTo(200 / MAX_LOGO_FIT_INFLATION, 6);
	});
});
