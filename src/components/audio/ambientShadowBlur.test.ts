import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SpectrumSettings } from '@/features/spectrum';
import { resolveAmbientShadowBlur } from '@/features/spectrum/render';

/**
 * Guards the ceiling on the blur `drawSpectrum` leaves on the context before
 * dispatching to a family renderer.
 *
 * Renderers set their own `shadowBlur` for the passes they care about, so this
 * value only survives on draws that don't — most visibly the full-figure wave
 * fill in `drawLinearWave` / `drawRadialWave`. It used to be the raw
 * `shadowBlur × glowIntensity × glowReach`, the one glow path that skipped
 * `computeClassicGlowBlur`'s ceiling: 540px of blur under a halo capped at 40.
 */
function settings(patch: Partial<SpectrumSettings> = {}): SpectrumSettings {
	return {
		...DEFAULT_STATE,
		performanceMode: 'high',
		...patch
	} as unknown as SpectrumSettings;
}

const LOW_DENSITY_BARS = 96;
const HIGH_DENSITY_BARS = 200;

/** What the ambient blur used to be, before the cap. */
function uncapped(s: SpectrumSettings): number {
	return (
		s.spectrumShadowBlur *
		s.spectrumGlowIntensity *
		(s.spectrumGlowReach ?? 1)
	);
}

describe('resolveAmbientShadowBlur', () => {
	it('is unchanged at factory defaults', () => {
		// 16 × 0.7 × 1 = 11.2, far below the 40px ceiling — the cap must not
		// bind, or every existing preset shifts look for no reason.
		const s = settings();
		expect(uncapped(s)).toBeLessThan(40);
		expect(resolveAmbientShadowBlur(s, LOW_DENSITY_BARS, 1)).toBeCloseTo(
			uncapped(s)
		);
	});

	it('caps a maxed preset at the same ceiling the halo already obeys', () => {
		const s = settings({
			spectrumShadowBlur: 60,
			spectrumGlowIntensity: 3,
			spectrumGlowReach: 3
		});
		// 60 × 3 × 3 = 540 before the fix.
		expect(uncapped(s)).toBe(540);
		expect(
			resolveAmbientShadowBlur(s, LOW_DENSITY_BARS, 1)
		).toBeLessThanOrEqual(40);
	});

	it('uses the tighter ceiling at high bar counts', () => {
		const s = settings({
			spectrumShadowBlur: 60,
			spectrumGlowIntensity: 3,
			spectrumGlowReach: 3
		});
		expect(resolveAmbientShadowBlur(s, HIGH_DENSITY_BARS, 1)).toBeLessThan(
			resolveAmbientShadowBlur(s, LOW_DENSITY_BARS, 1)
		);
	});

	it('still scales with the render-quality tier', () => {
		const s = settings({
			spectrumShadowBlur: 60,
			spectrumGlowIntensity: 3
		});
		expect(
			resolveAmbientShadowBlur(s, LOW_DENSITY_BARS, 0.32)
		).toBeLessThan(resolveAmbientShadowBlur(s, LOW_DENSITY_BARS, 1));
	});

	it('shrinks further on low performance mode', () => {
		const maxed = (performanceMode: 'high' | 'low') =>
			resolveAmbientShadowBlur(
				settings({
					performanceMode,
					spectrumShadowBlur: 60,
					spectrumGlowIntensity: 3
				}),
				LOW_DENSITY_BARS,
				1
			);
		expect(maxed('low')).toBeLessThan(maxed('high'));
	});

	it('stays at zero when the user turns glow off', () => {
		expect(
			resolveAmbientShadowBlur(
				settings({ spectrumShadowBlur: 0 }),
				LOW_DENSITY_BARS,
				1
			)
		).toBe(0);
		expect(
			resolveAmbientShadowBlur(
				settings({ spectrumGlowIntensity: 0 }),
				LOW_DENSITY_BARS,
				1
			)
		).toBe(0);
	});
});
