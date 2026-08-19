/**
 * Adapt one cluster's intent to a single image.
 *
 * This is what keeps a 200-image pool from looking like eight repeated scenes.
 * The model authors one intent per cluster — the *character* of the group — and
 * this function re-grounds that character in each image's own colours and
 * measurements. No extra model call, and the variation is deterministic, so
 * re-running the batch reproduces the same scenes.
 *
 * The cluster owns the categorical choices (spectrum family, shape, which
 * effects are on); the image owns its palette and nudges the continuous axes.
 * Mixing those the other way round — letting each image pick its own family —
 * would defeat the point of clustering.
 */
import { heuristicIntent } from '../intent/heuristicIntent';
import type { SceneIntent } from '../intent/sceneIntent';
import type { ImageSignature } from '../analysis/imageSignature';

/**
 * How far an image may pull an axis away from its cluster's value.
 * Small on purpose: a member should read as a variation on the group, not as
 * its own scene.
 */
const AXIS_BLEND = 0.35;

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function blend(clusterValue: number, imageValue: number): number {
	return clamp01(clusterValue * (1 - AXIS_BLEND) + imageValue * AXIS_BLEND);
}

/**
 * Produce this image's intent from its cluster's intent plus its own signature.
 *
 * Pure and deterministic: same inputs, same intent.
 */
export function personalizeIntent(
	clusterIntent: SceneIntent,
	signature: ImageSignature
): SceneIntent {
	// The heuristic already knows how to read one image; reuse it as the source
	// of per-image palette and axis values rather than duplicating that logic.
	const own = heuristicIntent(signature);

	return {
		...clusterIntent,
		// Continuous axes drift toward this image's own reading.
		energy: blend(clusterIntent.energy, own.energy),
		weight: blend(clusterIntent.weight, own.weight),
		motion: blend(clusterIntent.motion, own.motion),
		// The palette comes wholly from the image: it is the single strongest
		// signal that two scenes are different, and it is the one thing that
		// must stay readable against *this* background rather than the
		// cluster's representative.
		palette: own.palette,
		// Categorical choices stay with the cluster — that is what the model was
		// asked to decide, and what makes the group cohere.
		spectrumFamily: clusterIntent.spectrumFamily,
		spectrumShape: clusterIntent.spectrumShape,
		spectrumMode: clusterIntent.spectrumMode,
		particles: clusterIntent.particles,
		rain: clusterIntent.rain,
		looks: clusterIntent.looks,
		lights: clusterIntent.lights,
		rationale: clusterIntent.rationale
	};
}
