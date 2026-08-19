import { describe, it, expect } from 'vitest';
import { personalizeIntent } from './personalizeIntent';
import { defaultSceneIntent, parseSceneIntent } from '../intent/sceneIntent';
import { compileIntent } from '../intent/compileIntent';
import type { ImageSignature } from '../analysis/imageSignature';

function signature(partial: Partial<ImageSignature> = {}): ImageSignature {
	return {
		palette: [{ hex: '#ff2fd0', weight: 0.7 }],
		luma: 0.4,
		saturation: 0.8,
		contrast: 0.7,
		edgeDensity: 0.6,
		colorCount: 40,
		isPixelArt: false,
		aspect: 1.6,
		version: 1,
		...partial
	};
}

const clusterIntent = {
	...defaultSceneIntent(),
	energy: 0.9,
	weight: 0.8,
	motion: 0.7,
	spectrumFamily: 'liquid' as const,
	spectrumShape: 'wave' as const,
	spectrumMode: 'linear' as const,
	particles: 'embers' as const,
	looks: 'glitch' as const,
	lights: 'concert' as const,
	rain: 'heavy' as const,
	rationale: 'loud neon set'
};

describe('personalizeIntent', () => {
	it('is deterministic', () => {
		const sig = signature();
		expect(personalizeIntent(clusterIntent, sig)).toEqual(
			personalizeIntent(clusterIntent, sig)
		);
	});

	it('keeps the cluster’s categorical choices', () => {
		const result = personalizeIntent(
			clusterIntent,
			// A signature the heuristic would read very differently on its own.
			signature({ saturation: 0.02, contrast: 0.05, edgeDensity: 0.02 })
		);
		expect(result.spectrumFamily).toBe('liquid');
		expect(result.spectrumShape).toBe('wave');
		expect(result.spectrumMode).toBe('linear');
		expect(result.particles).toBe('embers');
		expect(result.looks).toBe('glitch');
		expect(result.lights).toBe('concert');
		expect(result.rain).toBe('heavy');
		expect(result.rationale).toBe('loud neon set');
	});

	it('takes the palette entirely from the image', () => {
		// The palette must read against THIS background, not the cluster's
		// representative — so it is the one field the image fully owns.
		const magenta = personalizeIntent(clusterIntent, signature());
		const teal = personalizeIntent(
			clusterIntent,
			signature({ palette: [{ hex: '#0fa89b', weight: 0.7 }] })
		);
		expect(magenta.palette).not.toEqual(clusterIntent.palette);
		expect(magenta.palette.primary).not.toBe(teal.palette.primary);
	});

	it('pulls the axes toward the image but not all the way', () => {
		const calm = personalizeIntent(
			clusterIntent,
			signature({ saturation: 0, contrast: 0, edgeDensity: 0, luma: 0.9 })
		);
		// Moved down from the cluster's 0.9 …
		expect(calm.energy).toBeLessThan(clusterIntent.energy);
		// … but still recognisably part of a loud group.
		expect(calm.energy).toBeGreaterThan(0.4);
	});

	it('gives different images in one cluster different scenes', () => {
		const a = compileIntent(
			personalizeIntent(
				clusterIntent,
				signature({ luma: 0.2, saturation: 0.9 })
			)
		);
		const b = compileIntent(
			personalizeIntent(
				clusterIntent,
				signature({
					luma: 0.8,
					saturation: 0.2,
					palette: [{ hex: '#88bb44', weight: 0.7 }]
				})
			)
		);
		expect(a.spectrum.spectrumPrimaryColor).not.toBe(
			b.spectrum.spectrumPrimaryColor
		);
		expect(a).not.toEqual(b);
	});

	it('always produces a valid, compilable intent', () => {
		const cases = [
			signature(),
			signature({ palette: [] }),
			signature({ saturation: 0, luma: 0, contrast: 0, edgeDensity: 0 }),
			signature({ saturation: 1, luma: 1, contrast: 1, edgeDensity: 1 }),
			signature({ isPixelArt: true, colorCount: 4 })
		];
		for (const sig of cases) {
			const intent = personalizeIntent(clusterIntent, sig);
			expect(parseSceneIntent(intent).rejected).toEqual([]);
			expect(() => compileIntent(intent)).not.toThrow();
		}
	});
});
