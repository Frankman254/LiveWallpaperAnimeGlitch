/**
 * Hosted provider (Anthropic). Same interface as the local one, so the route
 * does not know or care which is configured.
 */
import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicProvider({
	apiKey,
	model = process.env.ANTHROPIC_MODEL || 'claude-opus-5'
} = {}) {
	const client = new Anthropic({ apiKey });

	return {
		name: `anthropic:${model}`,

		async generateIntent({ system, userText, image, schema }) {
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
			content.push({ type: 'text', text: userText });

			const response = await client.beta.messages.create({
				model,
				max_tokens: 16000,
				// A small, well-scoped judgement — low effort keeps latency inside
				// the client's timeout.
				output_config: {
					effort: 'low',
					format: { type: 'json_schema', schema }
				},
				// Safety classifiers can decline; routing to a fallback recovers the
				// request server-side instead of surfacing an error.
				betas: ['server-side-fallback-2026-07-01'],
				fallbacks: 'default',
				system,
				messages: [{ role: 'user', content }]
			});

			// Always check stop_reason before reading content — on a refusal the
			// content array is empty or partial.
			if (response.stop_reason === 'refusal') {
				const error = new Error('declined');
				error.declined = true;
				error.category = response.stop_details?.category ?? 'unknown';
				throw error;
			}

			const textBlock = response.content.find(
				block => block.type === 'text'
			);
			if (!textBlock) throw new Error('no text block in response');
			return JSON.parse(textBlock.text);
		},

		async health() {
			return apiKey
				? { ok: true, model }
				: { ok: false, reason: 'ANTHROPIC_API_KEY not set' };
		}
	};
}
