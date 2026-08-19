import { describe, it, expect } from 'vitest';
import { clusterSignatures, type SignatureEntry } from './clusterSignatures';
import type { ImageSignature } from './imageSignature';

function signature(partial: Partial<ImageSignature> = {}): ImageSignature {
	return {
		palette: [{ hex: '#3366cc', weight: 1 }],
		luma: 0.5,
		saturation: 0.5,
		contrast: 0.5,
		edgeDensity: 0.5,
		colorCount: 400,
		isPixelArt: false,
		aspect: 1.6,
		version: 1,
		...partial
	};
}

function entry(assetId: string, partial: Partial<ImageSignature> = {}) {
	return { assetId, signature: signature(partial) } satisfies SignatureEntry;
}

/** Three obviously distinct families, five images each. */
function threeFamilies(): SignatureEntry[] {
	const out: SignatureEntry[] = [];
	for (let i = 0; i < 5; i += 1) {
		out.push(
			entry(`calm-${i}`, {
				luma: 0.6 + i * 0.01,
				saturation: 0.05,
				contrast: 0.08,
				edgeDensity: 0.03,
				palette: [{ hex: '#9aa0ab', weight: 1 }]
			})
		);
		out.push(
			entry(`loud-${i}`, {
				luma: 0.35 + i * 0.01,
				saturation: 0.95,
				contrast: 0.9,
				edgeDensity: 0.85,
				palette: [{ hex: '#ff2f2f', weight: 1 }]
			})
		);
		out.push(
			entry(`sprite-${i}`, {
				luma: 0.5,
				saturation: 0.8,
				contrast: 0.7,
				edgeDensity: 0.6,
				isPixelArt: true,
				colorCount: 6,
				palette: [{ hex: '#2ff0ff', weight: 1 }]
			})
		);
	}
	return out;
}

describe('clusterSignatures', () => {
	it('returns nothing for an empty pool', () => {
		expect(clusterSignatures([])).toEqual([]);
	});

	it('is deterministic across runs', () => {
		const entries = threeFamilies();
		const a = clusterSignatures(entries, { k: 3 });
		const b = clusterSignatures(entries, { k: 3 });
		expect(a.map(c => c.members.map(m => m.assetId))).toEqual(
			b.map(c => c.members.map(m => m.assetId))
		);
	});

	it('never loses or duplicates an image', () => {
		const entries = threeFamilies();
		for (const k of [1, 2, 3, 5, 8]) {
			const clusters = clusterSignatures(entries, { k });
			const seen = clusters.flatMap(c => c.members.map(m => m.assetId));
			expect(seen.slice().sort()).toEqual(
				entries.map(e => e.assetId).sort()
			);
			expect(new Set(seen).size).toBe(entries.length);
		}
	});

	it('separates calm, loud and pixel-art families', () => {
		const clusters = clusterSignatures(threeFamilies(), { k: 3 });
		expect(clusters).toHaveLength(3);
		// Each cluster should be pure — one family per group.
		for (const cluster of clusters) {
			const families = new Set(
				cluster.members.map(m => m.assetId.split('-')[0])
			);
			expect(families.size).toBe(1);
		}
	});

	it('keeps pixel art out of photo clusters even when other axes match', () => {
		// Same luma/saturation/contrast/edges — only the pixel-art flag differs.
		const entries = [
			...Array.from({ length: 4 }, (_, i) =>
				entry(`photo-${i}`, { isPixelArt: false })
			),
			...Array.from({ length: 4 }, (_, i) =>
				entry(`sprite-${i}`, { isPixelArt: true, colorCount: 5 })
			)
		];
		const clusters = clusterSignatures(entries, { k: 2 });
		for (const cluster of clusters) {
			const kinds = new Set(
				cluster.members.map(m => m.assetId.split('-')[0])
			);
			expect(kinds.size).toBe(1);
		}
	});

	it('treats hues near the 0/360 wrap as neighbours', () => {
		// Reds at 358° and 4° must not land in different clusters just because
		// their raw hue numbers sit at opposite ends of the scale.
		const entries = [
			entry('red-a', {
				saturation: 0.9,
				palette: [{ hex: '#ff0311', weight: 1 }]
			}),
			entry('red-b', {
				saturation: 0.9,
				palette: [{ hex: '#ff1103', weight: 1 }]
			}),
			entry('cyan-a', {
				saturation: 0.9,
				palette: [{ hex: '#03fff0', weight: 1 }]
			}),
			entry('cyan-b', {
				saturation: 0.9,
				palette: [{ hex: '#03f0ff', weight: 1 }]
			})
		];
		const clusters = clusterSignatures(entries, { k: 2 });
		for (const cluster of clusters) {
			const kinds = new Set(
				cluster.members.map(m => m.assetId.split('-')[0])
			);
			expect(kinds.size).toBe(1);
		}
	});

	it('never returns an empty cluster', () => {
		// k far larger than the number of distinct looks.
		const clusters = clusterSignatures(threeFamilies(), { k: 12 });
		for (const cluster of clusters) {
			expect(cluster.members.length).toBeGreaterThan(0);
		}
	});

	it('collapses to one cluster when k is 1', () => {
		const entries = threeFamilies();
		const clusters = clusterSignatures(entries, { k: 1 });
		expect(clusters).toHaveLength(1);
		expect(clusters[0].members).toHaveLength(entries.length);
	});

	it('picks a representative that belongs to its own cluster', () => {
		for (const cluster of clusterSignatures(threeFamilies(), { k: 3 })) {
			expect(cluster.members.map(m => m.assetId)).toContain(
				cluster.representative.assetId
			);
		}
	});

	it('orders clusters loudest first', () => {
		const clusters = clusterSignatures(threeFamilies(), { k: 3 });
		const energies = clusters.map(c => c.centroid.energy);
		expect([...energies].sort((a, b) => b - a)).toEqual(energies);
		expect(clusters.map(c => c.index)).toEqual([0, 1, 2]);
	});

	it('reports a centroid that summarizes its members', () => {
		const clusters = clusterSignatures(
			[
				entry('a', { luma: 0.2 }),
				entry('b', { luma: 0.4 }),
				entry('c', { luma: 0.6 })
			],
			{ k: 1 }
		);
		expect(clusters[0].centroid.luma).toBeCloseTo(0.4, 5);
		expect(clusters[0].centroid.pixelArtShare).toBe(0);
	});

	it('scales to a 200-image pool', () => {
		const entries = Array.from({ length: 200 }, (_, i) =>
			entry(`img-${i}`, {
				luma: (i % 10) / 10,
				saturation: ((i * 7) % 10) / 10,
				contrast: ((i * 3) % 10) / 10,
				edgeDensity: ((i * 5) % 10) / 10,
				isPixelArt: i % 11 === 0
			})
		);
		const clusters = clusterSignatures(entries, { k: 8 });
		expect(clusters.length).toBeGreaterThan(1);
		expect(clusters.length).toBeLessThanOrEqual(8);
		expect(clusters.flatMap(c => c.members)).toHaveLength(200);
	});
});
