/**
 * Group image signatures so a large pool needs a handful of model calls
 * instead of one per image.
 *
 * This is the piece that makes the AI Director viable for a 200-image pool.
 * Analysis is local and free, so every image gets a signature; clustering then
 * collapses those into ~8 groups, one model call each. Per-image variety is
 * recovered at compile time by mixing each image's own palette back in — so
 * images in a cluster share a character without looking identical.
 *
 * Deterministic by construction: the PRNG is seeded, so the same pool always
 * produces the same clusters. A clustering that reshuffled between runs would
 * make "re-generate scenes for my pool" unrepeatable.
 */
import { hexToHsl } from '../intent/colorMath';
import { deriveEnergy } from '../intent/heuristicIntent';
import type { ImageSignature } from './imageSignature';

export type SignatureEntry = {
	assetId: string;
	signature: ImageSignature;
};

export type SignatureCluster = {
	/** Stable index, 0-based. */
	index: number;
	members: SignatureEntry[];
	/** Member closest to the centroid — the one to send to the model. */
	representative: SignatureEntry;
	/** Mean signature values for the group, for prompting. */
	centroid: {
		luma: number;
		saturation: number;
		contrast: number;
		edgeDensity: number;
		energy: number;
		pixelArtShare: number;
	};
};

/**
 * Feature weights. Hue is split into sin/cos so that red at 350° and red at
 * 10° land next to each other instead of at opposite ends of the axis — a
 * linear hue would put them maximally far apart and split an obviously
 * coherent group.
 */
const FEATURE_WEIGHTS = {
	luma: 1,
	saturation: 1.2,
	contrast: 1.2,
	edgeDensity: 1,
	// Pixel art is a hard style boundary, not a shade of one — weight it high
	// enough that a sprite never clusters with a photo.
	pixelArt: 2.5,
	hue: 0.9
} as const;

function toVector(signature: ImageSignature): number[] {
	const dominant = signature.palette[0]?.hex ?? '#808080';
	const { h } = hexToHsl(dominant);
	const radians = (h * Math.PI) / 180;
	// A greyscale image has no meaningful hue; damp its hue axis so it doesn't
	// get pulled toward whatever arbitrary hue the quantizer produced.
	const hueWeight = FEATURE_WEIGHTS.hue * signature.saturation;

	return [
		signature.luma * FEATURE_WEIGHTS.luma,
		signature.saturation * FEATURE_WEIGHTS.saturation,
		signature.contrast * FEATURE_WEIGHTS.contrast,
		signature.edgeDensity * FEATURE_WEIGHTS.edgeDensity,
		(signature.isPixelArt ? 1 : 0) * FEATURE_WEIGHTS.pixelArt,
		Math.cos(radians) * hueWeight,
		Math.sin(radians) * hueWeight
	];
}

function distanceSquared(a: number[], b: number[]): number {
	let total = 0;
	for (let i = 0; i < a.length; i += 1) {
		const delta = a[i] - b[i];
		total += delta * delta;
	}
	return total;
}

/** Seeded PRNG (mulberry32) so clustering is reproducible across runs. */
function createRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** k-means++ seeding: spread the initial centroids out instead of picking at
 *  random, which converges faster and avoids collapsed clusters. */
function seedCentroids(
	vectors: number[][],
	k: number,
	random: () => number
): number[][] {
	const centroids: number[][] = [
		vectors[Math.floor(random() * vectors.length)]
	];

	while (centroids.length < k) {
		const distances = vectors.map(vector =>
			Math.min(
				...centroids.map(centroid => distanceSquared(vector, centroid))
			)
		);
		const total = distances.reduce((sum, value) => sum + value, 0);
		if (total === 0) {
			// Every remaining point coincides with a centroid; nothing left to
			// spread out. Duplicate rather than loop forever.
			centroids.push(vectors[Math.floor(random() * vectors.length)]);
			continue;
		}
		let threshold = random() * total;
		let picked = vectors.length - 1;
		for (let i = 0; i < distances.length; i += 1) {
			threshold -= distances[i];
			if (threshold <= 0) {
				picked = i;
				break;
			}
		}
		centroids.push(vectors[picked]);
	}
	return centroids;
}

export type ClusterOptions = {
	/** Desired group count. Clamped to 1..entries.length. */
	k?: number;
	maxIterations?: number;
	seed?: number;
};

/**
 * Partition signatures into at most `k` clusters.
 *
 * Empty clusters are dropped rather than padded, so the result can be smaller
 * than `k` — the caller wants "groups worth one model call each", and an empty
 * group is not one.
 */
export function clusterSignatures(
	entries: SignatureEntry[],
	options: ClusterOptions = {}
): SignatureCluster[] {
	if (entries.length === 0) return [];

	const k = Math.max(1, Math.min(options.k ?? 8, entries.length));
	const maxIterations = options.maxIterations ?? 40;
	const random = createRandom(options.seed ?? 0x5eed);

	const vectors = entries.map(entry => toVector(entry.signature));
	let centroids = seedCentroids(vectors, k, random);
	const assignments = new Array<number>(entries.length).fill(0);

	for (let iteration = 0; iteration < maxIterations; iteration += 1) {
		let moved = false;

		for (let i = 0; i < vectors.length; i += 1) {
			let best = 0;
			let bestDistance = Infinity;
			for (let c = 0; c < centroids.length; c += 1) {
				const distance = distanceSquared(vectors[i], centroids[c]);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = c;
				}
			}
			if (assignments[i] !== best) {
				assignments[i] = best;
				moved = true;
			}
		}

		const sums = centroids.map(() =>
			new Array<number>(vectors[0].length).fill(0)
		);
		const counts = centroids.map(() => 0);
		for (let i = 0; i < vectors.length; i += 1) {
			const cluster = assignments[i];
			counts[cluster] += 1;
			for (let d = 0; d < vectors[i].length; d += 1) {
				sums[cluster][d] += vectors[i][d];
			}
		}
		centroids = centroids.map((centroid, c) =>
			counts[c] === 0 ? centroid : sums[c].map(value => value / counts[c])
		);

		if (!moved) break;
	}

	const groups: SignatureCluster[] = [];
	for (let c = 0; c < centroids.length; c += 1) {
		const memberIndices = assignments
			.map((cluster, i) => (cluster === c ? i : -1))
			.filter(i => i >= 0);
		if (memberIndices.length === 0) continue;

		let representativeIndex = memberIndices[0];
		let bestDistance = Infinity;
		for (const i of memberIndices) {
			const distance = distanceSquared(vectors[i], centroids[c]);
			if (distance < bestDistance) {
				bestDistance = distance;
				representativeIndex = i;
			}
		}

		const members = memberIndices.map(i => entries[i]);
		const mean = (pick: (signature: ImageSignature) => number) =>
			members.reduce((sum, member) => sum + pick(member.signature), 0) /
			members.length;

		groups.push({
			index: groups.length,
			members,
			representative: entries[representativeIndex],
			centroid: {
				luma: mean(s => s.luma),
				saturation: mean(s => s.saturation),
				contrast: mean(s => s.contrast),
				edgeDensity: mean(s => s.edgeDensity),
				energy: mean(deriveEnergy),
				pixelArtShare: mean(s => (s.isPixelArt ? 1 : 0))
			}
		});
	}

	// Loudest first: the user reviews the groups that will change most.
	groups.sort((a, b) => b.centroid.energy - a.centroid.energy);
	return groups.map((group, index) => ({ ...group, index }));
}
