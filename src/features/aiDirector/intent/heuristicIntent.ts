/**
 * Turn an `ImageSignature` into a `SceneIntent` with no model involved.
 *
 * This exists for three reasons, in order of importance:
 *  1. The AI Director works offline, with no API key and no quota. The model is
 *     an upgrade to taste, never a dependency.
 *  2. It is the fallback when a request fails or returns junk, so the feature
 *     degrades to "decent" instead of "neutral grey".
 *  3. It is the seed a model refines, which makes prompts shorter and outputs
 *     more consistent than asking for a scene from nothing.
 *
 * Pure and deterministic: same signature in, same intent out.
 */
import type { ImageSignature, PaletteEntry } from '../analysis/imageSignature';
import { hexToHsl, hueDistance, makeReadable, rotateHue } from './colorMath';
import { defaultSceneIntent, type SceneIntent } from './sceneIntent';

/** Below this saturation a picture reads as monochrome and should not drive a
 *  colourful palette; we synthesize hues from the primary instead. */
const MONOCHROME_SATURATION = 0.12;
/** Minimum hue separation (degrees) for a colour to count as a distinct pick. */
const MIN_HUE_SEPARATION = 28;

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/**
 * Rank palette entries by how much they can carry a design, not by raw
 * coverage. A dark muddy background usually dominates an anime frame by area
 * while contributing nothing usable, so weight is dampened (sqrt) and
 * saturation counts for more.
 */
function vividness(entry: PaletteEntry): number {
	const { s, l } = hexToHsl(entry.hex);
	// Mid lightness scores best: near-black and near-white carry no hue.
	const lightnessScore = 1 - Math.abs(l - 0.55) * 1.6;
	return (0.35 + s) * Math.max(0.1, lightnessScore) * Math.sqrt(entry.weight);
}

/**
 * Choose primary / secondary / accent with real hue separation. Falls back to
 * harmonic rotations whenever the image cannot supply a distinct enough hue —
 * which is the common case for monochrome or two-tone pixel art.
 */
function derivePalette(signature: ImageSignature): SceneIntent['palette'] {
	const fallback = defaultSceneIntent().palette;
	const ranked = [...signature.palette].sort(
		(a, b) => vividness(b) - vividness(a)
	);
	if (ranked.length === 0) return fallback;

	const primary = makeReadable(ranked[0].hex);
	const primaryHue = hexToHsl(primary).h;

	if (signature.saturation < MONOCHROME_SATURATION) {
		// Monochrome source: invent a triad around the primary rather than
		// returning three greys that would render as one flat colour.
		return {
			primary,
			secondary: rotateHue(primary, 150),
			accent: rotateHue(primary, -60)
		};
	}

	const distinctFrom = (hues: number[]) =>
		ranked
			.map(entry => makeReadable(entry.hex))
			.find(hex =>
				hues.every(
					hue =>
						hueDistance(hexToHsl(hex).h, hue) >= MIN_HUE_SEPARATION
				)
			);

	const secondary = distinctFrom([primaryHue]) ?? rotateHue(primary, 150);
	const secondaryHue = hexToHsl(secondary).h;
	const accent =
		distinctFrom([primaryHue, secondaryHue]) ?? rotateHue(primary, -60);

	return { primary, secondary, accent };
}

/**
 * Pick a spectrum family/shape/mode from the image's character.
 *
 * The mapping is intentionally coarse and legible — it is a starting point the
 * user (or the model) overrides, not a claim about what the image "means".
 */
function deriveSpectrumLook(
	signature: ImageSignature,
	energy: number
): Pick<SceneIntent, 'spectrumFamily' | 'spectrumShape' | 'spectrumMode'> {
	if (signature.isPixelArt) {
		// Retro sources get the cell grid; anything smooth would fight the art.
		return {
			spectrumFamily: 'classic',
			spectrumShape: 'pixel',
			spectrumMode: energy > 0.55 ? 'linear' : 'radial'
		};
	}
	if (energy < 0.3) {
		return {
			spectrumFamily: 'liquid',
			spectrumShape: 'wave',
			spectrumMode: 'linear'
		};
	}
	if (energy > 0.75) {
		return {
			spectrumFamily: 'classic',
			spectrumShape: 'blocks',
			spectrumMode: 'radial'
		};
	}
	return {
		spectrumFamily: 'classic',
		spectrumShape: 'bars',
		spectrumMode: 'radial'
	};
}

/**
 * The calm ↔ aggressive axis the whole feature is organized around.
 *
 * Saturated, high-contrast, busy images read as loud; desaturated, low-contrast,
 * smooth ones read as calm. Weights are empirical and deliberately simple —
 * this is a heuristic, and pretending otherwise with a tuned model would make
 * it harder to reason about, not better.
 */
export function deriveEnergy(signature: ImageSignature): number {
	return clamp01(
		signature.saturation * 0.4 +
			signature.contrast * 0.35 +
			signature.edgeDensity * 0.25
	);
}

export function heuristicIntent(signature: ImageSignature): SceneIntent {
	const energy = deriveEnergy(signature);
	// Dark, high-contrast frames carry heavy shapes; bright airy ones don't.
	const weight = clamp01(
		(1 - signature.luma) * 0.6 + signature.contrast * 0.4
	);
	const motion = clamp01(
		signature.edgeDensity * 0.6 + signature.saturation * 0.4
	);

	const palette = derivePalette(signature);
	const look = deriveSpectrumLook(signature, energy);

	return {
		energy,
		weight,
		motion,
		palette,
		...look,
		particles: energy > 0.7 ? 'sparks' : energy < 0.3 ? 'snow' : 'dust',
		rain: 'off',
		// Pixel art asks for CRT; smooth, bright frames take bloom well; the
		// loud middle gets glitch.
		looks: signature.isPixelArt
			? 'crt'
			: energy > 0.75
				? 'glitch'
				: signature.luma > 0.5
					? 'bloom'
					: 'clean',
		lights: energy > 0.65 ? 'concert' : energy > 0.4 ? 'ambient' : 'off',
		rationale: ''
	};
}
