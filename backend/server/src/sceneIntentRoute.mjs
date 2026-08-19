/**
 * POST /api/ai/scene-intent — model-authored scene suggestion.
 *
 * The client sends an image signature (plus optionally a 256px rendition and a
 * free-text steer) and gets back a validated `SceneIntent`. The Anthropic key
 * lives here and nowhere else.
 *
 * Two properties make this endpoint cheap:
 *  - **The model authors ~15 fields, not ~190.** A deterministic compiler on
 *    the client expands the intent into store keys, so the prompt and the
 *    response both stay small.
 *  - **Responses are cached by signature.** Two near-identical images do not
 *    pay twice. The cache key includes the prompt version so a prompt change
 *    invalidates it without a manual flush.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { SCENE_INTENT_SCHEMA } from './sceneIntentSchema.mjs';

/** Bump when the system prompt changes, so cached answers are re-asked. */
const PROMPT_VERSION = 1;

/** Entries are small; this bounds memory on a long-running process. */
const CACHE_MAX_ENTRIES = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are the art director for an audio-reactive live wallpaper app.

Given a description of a background image, choose a visual scene that suits it: a spectrum analyzer style, a colour palette, and which effects to enable.

How to decide:
- Read the image's own character. A dark, low-saturation, low-detail frame wants a calm scene; a saturated, high-contrast, busy one wants an aggressive scene.
- Pixel art and other hard-edged, few-colour art suit the 'pixel' spectrum shape and the 'crt' look. Smooth photographic or painterly images do not.
- Build the palette from the image's own dominant colours, but pick colours that will still read ON TOP of that image. A spectrum tinted with the image's near-black is invisible against it. Prefer the image's vivid minority colours over a muddy dominant background, and keep the three palette entries clearly distinct in hue.
- energy, weight and motion are independent axes; do not set all three to the same value out of habit.
- Turn effects off when they would not improve the scene. 'off' is a real answer, not a failure.

Write the rationale for the person using the app: one or two plain sentences on what you saw in the image and what you chose because of it. Do not restate the field values.`;

function cacheKey(signature, guidance, hasImage) {
	return createHash('sha256')
		.update(
			JSON.stringify({
				v: PROMPT_VERSION,
				// Round the scalars so imperceptibly different images share a key.
				luma: Math.round((signature?.luma ?? 0) * 50),
				sat: Math.round((signature?.saturation ?? 0) * 50),
				con: Math.round((signature?.contrast ?? 0) * 50),
				edge: Math.round((signature?.edgeDensity ?? 0) * 50),
				pixel: Boolean(signature?.isPixelArt),
				palette: (signature?.palette ?? []).map(entry => entry?.hex),
				guidance: guidance ?? '',
				hasImage
			})
		)
		.digest('hex');
}

function describeSignature(signature) {
	const pct = value => `${Math.round((value ?? 0) * 100)}%`;
	const palette = (signature?.palette ?? [])
		.map(entry => `${entry.hex} (${pct(entry.weight)} of the image)`)
		.join(', ');
	return [
		`Dominant colours: ${palette || 'none detected'}`,
		`Brightness: ${pct(signature?.luma)}`,
		`Saturation: ${pct(signature?.saturation)}`,
		`Contrast: ${pct(signature?.contrast)}`,
		`Detail density: ${pct(signature?.edgeDensity)}`,
		`Distinct colours: ${signature?.colorCount ?? 0}`,
		`Detected as pixel art: ${signature?.isPixelArt ? 'yes' : 'no'}`,
		`Aspect ratio: ${(signature?.aspect ?? 1).toFixed(2)}`
	].join('\n');
}

export function createSceneIntentHandler({ apiKey, logger = console }) {
	const client = new Anthropic({ apiKey });
	const cache = new Map();

	function readCache(key) {
		const entry = cache.get(key);
		if (!entry) return null;
		if (Date.now() - entry.at > CACHE_TTL_MS) {
			cache.delete(key);
			return null;
		}
		return entry.intent;
	}

	function writeCache(key, intent) {
		if (cache.size >= CACHE_MAX_ENTRIES) {
			// Oldest insertion first — Map preserves insertion order.
			cache.delete(cache.keys().next().value);
		}
		cache.set(key, { intent, at: Date.now() });
	}

	return async function handleSceneIntent(req, res) {
		const { signature, seed, guidance, image } = req.body ?? {};
		if (!signature || typeof signature !== 'object') {
			res.status(400).json({ error: 'signature is required' });
			return;
		}

		const key = cacheKey(signature, guidance, Boolean(image));
		const cached = readCache(key);
		if (cached) {
			res.json({ intent: cached, cached: true });
			return;
		}

		const content = [];
		if (image?.base64 && image?.mediaType) {
			content.push({
				type: 'image',
				source: {
					type: 'base64',
					media_type: image.mediaType,
					data: image.base64
				}
			});
		}
		content.push({
			type: 'text',
			text: [
				'Measurements of the background image:',
				describeSignature(signature),
				seed
					? `\nA deterministic heuristic proposed this as a starting point. Improve on it where the image justifies it; keep what already fits:\n${JSON.stringify(seed, null, 1)}`
					: '',
				guidance ? `\nThe user also asked for: ${guidance}` : ''
			]
				.filter(Boolean)
				.join('\n')
		});

		try {
			const response = await client.beta.messages.create({
				model: 'claude-opus-5',
				max_tokens: 16000,
				// Cheap, well-scoped judgement — low effort is plenty and keeps
				// latency inside the client's 30s timeout.
				output_config: {
					effort: 'low',
					format: { type: 'json_schema', schema: SCENE_INTENT_SCHEMA }
				},
				// Claude Opus 5's safety classifiers can decline a request; routing
				// the refusal to a fallback model server-side recovers it instead of
				// surfacing an error to the user.
				betas: ['server-side-fallback-2026-07-01'],
				fallbacks: 'default',
				system: SYSTEM_PROMPT,
				messages: [{ role: 'user', content }]
			});

			// Always check stop_reason before reading content — on a refusal the
			// content array is empty or partial.
			if (response.stop_reason === 'refusal') {
				logger.warn(
					'[scene-intent] refused:',
					response.stop_details?.category ?? 'unknown'
				);
				res.status(422).json({ error: 'declined' });
				return;
			}

			const textBlock = response.content.find(
				block => block.type === 'text'
			);
			if (!textBlock) {
				res.status(502).json({ error: 'no text block in response' });
				return;
			}

			const intent = JSON.parse(textBlock.text);
			writeCache(key, intent);
			res.json({ intent, cached: false });
		} catch (error) {
			logger.error('[scene-intent] failed:', error?.message ?? error);
			// The client falls back to its offline heuristic on any non-2xx, so a
			// plain status is enough — no need to leak provider details.
			const status =
				error?.status === 429 || error?.status === 529 ? 503 : 502;
			res.status(status).json({ error: 'scene service unavailable' });
		}
	};
}
