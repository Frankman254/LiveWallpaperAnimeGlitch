/**
 * JSON Schema for `SceneIntent`, used as a structured-output constraint so the
 * model cannot return a shape the client has to guess at.
 *
 * This mirrors `src/features/aiDirector/intent/sceneIntent.ts`. The duplication
 * is deliberate: the client re-validates every response with its own parser
 * regardless of what the server claims, so the two copies are a convenience and
 * a cost saver, never a trust boundary. If they drift, the client's parser wins
 * and the offending field falls back to its default.
 *
 * Note the scalars carry no `minimum`/`maximum` — numeric constraints are not
 * supported by structured outputs. The client clamps them instead.
 */

export const SPECTRUM_FAMILIES = [
	'classic',
	'oscilloscope',
	'tunnel',
	'liquid',
	'orbital',
	'spiral'
];
export const SPECTRUM_SHAPES = [
	'bars',
	'blocks',
	'lines',
	'wave',
	'dots',
	'capsules',
	'pixel'
];
export const SPECTRUM_MODES = ['radial', 'linear'];
export const PARTICLES_PRESETS = ['off', 'dust', 'embers', 'snow', 'sparks'];
export const RAIN_PRESETS = ['off', 'light', 'heavy'];
export const LOOKS_PRESETS = ['clean', 'crt', 'bloom', 'glitch'];
export const LIGHTS_PRESETS = ['off', 'ambient', 'concert'];

const hexColor = {
	type: 'string',
	description: 'Colour as #rrggbb. Any other notation is rejected.'
};

export const SCENE_INTENT_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	required: [
		'energy',
		'weight',
		'motion',
		'palette',
		'spectrumMode',
		'spectrumFamily',
		'spectrumShape',
		'particles',
		'rain',
		'looks',
		'lights',
		'rationale'
	],
	properties: {
		energy: {
			type: 'number',
			description:
				'0 = calm/ambient, 1 = aggressive. Drives reactivity, glow and shake.'
		},
		weight: {
			type: 'number',
			description:
				'0 = thin/delicate, 1 = massive. Drives bar width, sizes and counts.'
		},
		motion: {
			type: 'number',
			description:
				'0 = static, 1 = chaotic. Drives rotation, drift and camera motion.'
		},
		palette: {
			type: 'object',
			additionalProperties: false,
			required: ['primary', 'secondary', 'accent'],
			properties: {
				primary: hexColor,
				secondary: hexColor,
				accent: hexColor
			}
		},
		spectrumMode: { type: 'string', enum: SPECTRUM_MODES },
		spectrumFamily: { type: 'string', enum: SPECTRUM_FAMILIES },
		spectrumShape: { type: 'string', enum: SPECTRUM_SHAPES },
		particles: { type: 'string', enum: PARTICLES_PRESETS },
		rain: { type: 'string', enum: RAIN_PRESETS },
		looks: { type: 'string', enum: LOOKS_PRESETS },
		lights: { type: 'string', enum: LIGHTS_PRESETS },
		rationale: {
			type: 'string',
			description:
				'One or two sentences for the user explaining why this look fits the image.'
		}
	}
};
