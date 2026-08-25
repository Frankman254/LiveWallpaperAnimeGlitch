import { describe, expect, it, vi } from 'vitest';
import {
	COMPLETE_ROTATE_EXTREMES,
	completeRotatePalette,
	DEFAULT_RAINBOW_PALETTE
} from '@/lib/backgroundPalette';
import { addGradientStops, getColor } from './spectrumColor';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

function settings(
	mode: SpectrumSettings['spectrumColorMode'],
	rainbow?: string[]
): SpectrumSettings {
	return {
		spectrumColorMode: mode,
		spectrumPrimaryColor: '#ff0000',
		spectrumSecondaryColor: '#0000ff',
		spectrumMode: 'linear',
		spectrumRainbowColors: rainbow
	} as unknown as SpectrumSettings;
}

function collectStops(mode: SpectrumSettings['spectrumColorMode'], nowMs = 0) {
	const now = vi.spyOn(performance, 'now').mockReturnValue(nowMs);
	const stops: Array<[number, string]> = [];
	addGradientStops(
		{
			addColorStop: (offset: number, color: string) => {
				stops.push([offset, color]);
			}
		} as CanvasGradient,
		settings(mode, [...DEFAULT_RAINBOW_PALETTE])
	);
	now.mockRestore();
	return stops;
}

describe('completeRotatePalette', () => {
	it('appends pure black and pure white to the rainbow', () => {
		expect(completeRotatePalette([...DEFAULT_RAINBOW_PALETTE])).toEqual([
			...DEFAULT_RAINBOW_PALETTE,
			...COMPLETE_ROTATE_EXTREMES
		]);
		expect(COMPLETE_ROTATE_EXTREMES).toEqual(['#000000', '#ffffff']);
	});

	it('falls back to the default rainbow when the palette is empty', () => {
		expect(completeRotatePalette([])).toEqual([
			...DEFAULT_RAINBOW_PALETTE,
			...COMPLETE_ROTATE_EXTREMES
		]);
	});
});

describe('spectrum complete-rotate', () => {
	it('reaches pure black and pure white across the cycle, unlike rotate', () => {
		const now = vi.spyOn(performance, 'now').mockReturnValue(0);
		const complete = new Set<string>();
		const rotate = new Set<string>();
		// Sweep a whole cycle at both ends of the phase axis.
		for (let step = 0; step < 64; step += 1) {
			const t = step / 64;
			complete.add(
				getColor(
					settings('complete-rotate', [...DEFAULT_RAINBOW_PALETTE]),
					t
				)
			);
			rotate.add(
				getColor(
					settings('visible-rotate', [...DEFAULT_RAINBOW_PALETTE]),
					t
				)
			);
		}
		now.mockRestore();
		expect(complete).toContain('rgb(0, 0, 0)');
		expect(complete).toContain('rgb(255, 255, 255)');
		// The plain rotate palette has no achromatic members at all.
		expect(rotate).not.toContain('rgb(0, 0, 0)');
		expect(rotate).not.toContain('rgb(255, 255, 255)');
	});

	it('oversamples the gradient so black and white survive any phase', () => {
		// The rotation offsets every stop equally, so a coarse grid would land
		// between palette entries and average the extremes into grey. Sweep a
		// whole cycle rather than trusting one arbitrary moment.
		for (let ms = 0; ms < 4800; ms += 400) {
			const luminances = collectStops('complete-rotate', ms).map(
				([, color]) => {
					const [r, g, b] = color.match(/\d+/g)!.map(Number);
					return (r! + g! + b!) / 3;
				}
			);
			expect(Math.min(...luminances), `${ms}ms`).toBeLessThan(48);
			expect(Math.max(...luminances), `${ms}ms`).toBeGreaterThan(208);
		}
	});

	it('leaves the plain rotate ramp on its original 6-step layout', () => {
		expect(collectStops('visible-rotate')).toHaveLength(7);
	});
});
