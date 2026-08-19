/**
 * Deterministic, local description of a background image.
 *
 * This runs with no model, no network and no cost, on every image in the pool.
 * Two things depend on it:
 *  - `heuristicIntent` turns a signature straight into a scene, so the AI
 *    Director works offline and stays useful when there is no API quota.
 *  - the batch flow clusters signatures so ~200 images need ~8 model calls
 *    instead of 200.
 *
 * The heavy lifting is a pure function over raw pixels (`computeImageSignature`)
 * so it is testable without a DOM. `analyzeImageUrl` is the thin canvas wrapper.
 */

/** Bumped whenever the maths change, so cached signatures are recomputed. */
export const IMAGE_SIGNATURE_VERSION = 2;

/** Analysis resolution. Small enough to be instant for a 200-image pool, big
 *  enough that edge/detail statistics still mean something. */
export const ANALYSIS_SIZE = 64;

export type PaletteEntry = {
	/** `#rrggbb`. */
	hex: string;
	/** Share of opaque pixels this colour cluster covers, 0..1. */
	weight: number;
};

export type ImageSignature = {
	/** Up to 5 dominant colours, most-covering first. */
	palette: PaletteEntry[];
	/** Mean relative luminance, 0 (black) .. 1 (white). */
	luma: number;
	/** Mean HSV saturation, 0 (greyscale) .. 1 (pure hue). */
	saturation: number;
	/** Luma spread. 0 = flat, 1 = maximum light/dark separation. */
	contrast: number;
	/** How busy the image is: 0 = smooth gradients, 1 = dense detail. */
	edgeDensity: number;
	/** Distinct colours at 5-bit-per-channel precision. */
	colorCount: number;
	/** Heuristic: few colours + hard edges. See `PIXEL_ART_*` below. */
	isPixelArt: boolean;
	/** Original image aspect (width / height), not the analysis buffer's. */
	aspect: number;
	version: number;
};

export type PixelSource = {
	/** RGBA, 4 bytes per pixel, length = width * height * 4. */
	pixels: Uint8ClampedArray;
	width: number;
	height: number;
	/** Original dimensions, for `aspect`. Defaults to the buffer's. */
	sourceWidth?: number;
	sourceHeight?: number;
};

// ─── Tuning constants ────────────────────────────────────────────────────────
// All empirical. They are named (rather than inlined) because re-tuning them
// changes every cached signature, which is exactly when IMAGE_SIGNATURE_VERSION
// must be bumped.

/** Pixels below this alpha are ignored entirely (transparent PNG margins). */
const MIN_ALPHA = 8;
/** Palette clustering precision: 4 bits/channel = 4096 buckets. */
const PALETTE_BITS = 4;
/** Colour-count precision: 5 bits/channel = 32768 buckets. */
const COLOR_COUNT_BITS = 5;
/** Two palette entries closer than this (0..1 RGB distance) are merged. */
const PALETTE_MERGE_DISTANCE = 0.18;
const PALETTE_SIZE = 5;
/** Luma stddev is bounded by 0.5, so double it to reach a 0..1 scale. */
const CONTRAST_SCALE = 2;
/** Mean neighbour luma delta of a busy image, used to normalize edgeDensity. */
const EDGE_DENSITY_REFERENCE = 0.18;
/** A neighbour delta this large counts as a "hard" (non-gradient) edge. */
const HARD_EDGE_THRESHOLD = 0.25;
/** Below this delta two neighbours count as the same flat region. */
const FLAT_PAIR_THRESHOLD = 0.02;
/** Pixel art: a limited palette … */
const PIXEL_ART_MAX_COLORS = 64;
/**
 * … drawn as flat blocks — most neighbours are identical …
 *
 * This is the test that separates pixel art from dense noise, and it is easy
 * to get wrong: a hard-edge *ratio* alone flags a fine checkerboard (nearly
 * every pair is an edge) while MISSING a real sprite (most pairs sit inside a
 * flat block). Large uniform regions are what actually characterises pixel art.
 */
const PIXEL_ART_MIN_FLAT_SHARE = 0.4;
/** … separated by hard edges rather than gradients. */
const PIXEL_ART_MIN_HARD_EDGE_RATIO = 0.02;

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function toHex(r: number, g: number, b: number): string {
	const part = (v: number) =>
		Math.max(0, Math.min(255, Math.round(v)))
			.toString(16)
			.padStart(2, '0');
	return `#${part(r)}${part(g)}${part(b)}`;
}

/** Straight RGB distance in 0..1 units. Good enough for merging near-dupes. */
function colorDistance(
	a: { r: number; g: number; b: number },
	b: { r: number; g: number; b: number }
): number {
	const dr = (a.r - b.r) / 255;
	const dg = (a.g - b.g) / 255;
	const db = (a.b - b.b) / 255;
	return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
}

type Bucket = { r: number; g: number; b: number; count: number };

/**
 * Bucket colours on a coarse grid, then greedily merge buckets that are
 * perceptually close. Without the merge step a photo of a sky returns five
 * indistinguishable blues and the resulting palette is useless.
 */
function extractPalette(
	pixels: Uint8ClampedArray,
	opaqueCount: number
): PaletteEntry[] {
	if (opaqueCount === 0) return [];

	const shift = 8 - PALETTE_BITS;
	const buckets = new Map<number, Bucket>();
	for (let i = 0; i < pixels.length; i += 4) {
		if (pixels[i + 3] < MIN_ALPHA) continue;
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const key =
			((r >> shift) << (PALETTE_BITS * 2)) |
			((g >> shift) << PALETTE_BITS) |
			(b >> shift);
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.r += r;
			bucket.g += g;
			bucket.b += b;
			bucket.count += 1;
		} else {
			buckets.set(key, { r, g, b, count: 1 });
		}
	}

	const sorted = [...buckets.values()]
		.map(bucket => ({
			r: bucket.r / bucket.count,
			g: bucket.g / bucket.count,
			b: bucket.b / bucket.count,
			count: bucket.count
		}))
		.sort((a, b) => b.count - a.count);

	const merged: Bucket[] = [];
	for (const candidate of sorted) {
		const near = merged.find(
			entry => colorDistance(entry, candidate) < PALETTE_MERGE_DISTANCE
		);
		if (near) {
			// Weighted mean keeps the dominant member's hue rather than drifting
			// halfway toward a rare neighbour.
			const total = near.count + candidate.count;
			near.r =
				(near.r * near.count + candidate.r * candidate.count) / total;
			near.g =
				(near.g * near.count + candidate.g * candidate.count) / total;
			near.b =
				(near.b * near.count + candidate.b * candidate.count) / total;
			near.count = total;
		} else {
			merged.push({ ...candidate });
		}
		if (merged.length >= PALETTE_SIZE * 4) break;
	}

	return merged
		.sort((a, b) => b.count - a.count)
		.slice(0, PALETTE_SIZE)
		.map(entry => ({
			hex: toHex(entry.r, entry.g, entry.b),
			weight: entry.count / opaqueCount
		}));
}

/**
 * Compute a signature from raw RGBA pixels. Pure — no DOM, no globals, no
 * randomness. Same pixels always produce the same signature.
 */
export function computeImageSignature(source: PixelSource): ImageSignature {
	const { pixels, width, height } = source;
	const empty: ImageSignature = {
		palette: [],
		luma: 0,
		saturation: 0,
		contrast: 0,
		edgeDensity: 0,
		colorCount: 0,
		isPixelArt: false,
		aspect: 1,
		version: IMAGE_SIGNATURE_VERSION
	};
	if (width <= 0 || height <= 0 || pixels.length < 4) return empty;

	const lumaGrid = new Float32Array(width * height);
	const opaque = new Uint8Array(width * height);
	const colorKeys = new Set<number>();
	const countShift = 8 - COLOR_COUNT_BITS;

	let opaqueCount = 0;
	let lumaSum = 0;
	let lumaSquareSum = 0;
	let saturationSum = 0;

	for (let p = 0; p < width * height; p += 1) {
		const i = p * 4;
		if (pixels[i + 3] < MIN_ALPHA) continue;
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];

		const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
		lumaGrid[p] = luma;
		opaque[p] = 1;
		opaqueCount += 1;
		lumaSum += luma;
		lumaSquareSum += luma * luma;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		saturationSum += max === 0 ? 0 : (max - min) / max;

		colorKeys.add(
			((r >> countShift) << (COLOR_COUNT_BITS * 2)) |
				((g >> countShift) << COLOR_COUNT_BITS) |
				(b >> countShift)
		);
	}

	if (opaqueCount === 0) return empty;

	const luma = lumaSum / opaqueCount;
	const variance = Math.max(0, lumaSquareSum / opaqueCount - luma * luma);
	const contrast = clamp01(Math.sqrt(variance) * CONTRAST_SCALE);
	const saturation = clamp01(saturationSum / opaqueCount);

	// Neighbour deltas in both axes. Only pairs where BOTH pixels are opaque
	// count, so a transparent border doesn't register as a giant edge.
	let edgeSum = 0;
	let edgePairs = 0;
	let hardEdges = 0;
	let flatPairs = 0;
	const addPair = (a: number, b: number) => {
		if (!opaque[a] || !opaque[b]) return;
		const delta = Math.abs(lumaGrid[a] - lumaGrid[b]);
		edgeSum += delta;
		edgePairs += 1;
		if (delta >= HARD_EDGE_THRESHOLD) hardEdges += 1;
		if (delta <= FLAT_PAIR_THRESHOLD) flatPairs += 1;
	};
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const p = y * width + x;
			if (x + 1 < width) addPair(p, p + 1);
			if (y + 1 < height) addPair(p, p + width);
		}
	}

	const meanDelta = edgePairs > 0 ? edgeSum / edgePairs : 0;
	const edgeDensity = clamp01(meanDelta / EDGE_DENSITY_REFERENCE);
	const hardEdgeRatio = edgePairs > 0 ? hardEdges / edgePairs : 0;
	const flatShare = edgePairs > 0 ? flatPairs / edgePairs : 0;
	const colorCount = colorKeys.size;

	const sourceWidth = source.sourceWidth ?? width;
	const sourceHeight = source.sourceHeight ?? height;

	return {
		palette: extractPalette(pixels, opaqueCount),
		luma,
		saturation,
		contrast,
		edgeDensity,
		colorCount,
		isPixelArt:
			colorCount <= PIXEL_ART_MAX_COLORS &&
			flatShare >= PIXEL_ART_MIN_FLAT_SHARE &&
			hardEdgeRatio >= PIXEL_ART_MIN_HARD_EDGE_RATIO,
		aspect: sourceHeight > 0 ? sourceWidth / sourceHeight : 1,
		version: IMAGE_SIGNATURE_VERSION
	};
}
