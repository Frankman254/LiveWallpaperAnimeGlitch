import { describe, expect, it } from 'vitest';
import { DEFAULT_RAINBOW_PALETTE } from '@/lib/backgroundPalette';
import { drawLyrixaLyricsBundle } from './lyrixaBundleRenderer';
import type { LyrixaLyricsBundleEnvelope } from './lyrixaBundleTypes';
import type { LyrixaLayerOverrideMap } from './types';

type GradientRecord = { stops: Array<[number, string]> };
type FillCall = { text: string; style: unknown; filter: string };

/**
 * Records what the renderer paints with. Only the handful of 2D-context
 * members the lyric path touches are implemented.
 */
function createRecordingCtx() {
	const gradients: GradientRecord[] = [];
	const fills: FillCall[] = [];
	const ctx = {
		filter: 'none',
		shadowColor: '',
		shadowBlur: 0,
		globalAlpha: 1,
		font: '',
		textAlign: 'center' as CanvasTextAlign,
		textBaseline: 'middle' as CanvasTextBaseline,
		fillStyle: '' as unknown,
		strokeStyle: '',
		lineWidth: 0,
		lineJoin: 'round' as CanvasLineJoin,
		save: () => {},
		restore: () => {},
		beginPath: () => {},
		closePath: () => {},
		moveTo: () => {},
		arcTo: () => {},
		fill: () => {},
		strokeText: () => {},
		measureText: (text: string) => ({ width: text.length * 10 }),
		createLinearGradient: () => {
			const record: GradientRecord = { stops: [] };
			gradients.push(record);
			return {
				addColorStop: (offset: number, color: string) => {
					record.stops.push([offset, color]);
				},
				__record: record
			};
		},
		fillText: (text: string) => {
			fills.push({
				text,
				style: ctx.fillStyle,
				filter: ctx.filter
			});
		}
	};
	return {
		ctx: ctx as unknown as CanvasRenderingContext2D,
		raw: ctx,
		gradients,
		fills
	};
}

const CANVAS = { width: 1920, height: 1080 } as HTMLCanvasElement;

function createEnvelope(): LyrixaLyricsBundleEnvelope {
	return {
		schemaVersion: 1,
		app: 'Lyrixa',
		exportKind: 'lyrics-bundle',
		exportedAt: '2026-08-24T00:00:00.000Z',
		projectName: 'test',
		sourceTrack: null,
		project: {
			rawLyricsText: 'HELLO',
			normalizedLyrics: ['HELLO'],
			layers: [
				{
					id: 'layer-1',
					name: 'Main',
					layerType: 'lyrics',
					color: '#ffffff',
					visible: true,
					locked: false,
					order: 0
				}
			],
			clips: [
				{
					id: 'clip-1',
					text: 'HELLO',
					startTime: 0,
					endTime: 10,
					layerId: 'layer-1'
				}
			],
			styleConfig: {
				textColor: '#ffffff',
				glowColor: '#00ffff',
				glowIntensity: 1
			},
			animationConfig: {},
			fxConfig: {},
			progressIndicatorConfig: {}
		}
	} as unknown as LyrixaLyricsBundleEnvelope;
}

function render(overrides: LyrixaLayerOverrideMap) {
	const recorder = createRecordingCtx();
	drawLyrixaLyricsBundle(recorder.ctx, CANVAS, createEnvelope(), 1, {
		layerOverrides: overrides
	});
	return recorder;
}

describe('drawLyrixaLyricsBundle — active line color', () => {
	it('solid keeps painting a plain color string', () => {
		const { fills } = render({
			'layer-1': { textColor: '#ff0000', textColorMode: 'solid' }
		});
		expect(fills).toHaveLength(1);
		expect(fills[0]!.style).toBe('#ff0000');
	});

	it('a legacy override with no mode behaves as solid', () => {
		const { fills, gradients } = render({
			'layer-1': { textColor: '#ff0000' }
		});
		expect(fills[0]!.style).toBe('#ff0000');
		expect(gradients).toHaveLength(0);
	});

	it('gradient paints a two-stop gradient from both colors', () => {
		const { gradients } = render({
			'layer-1': {
				textColor: '#ff0000',
				textColorMode: 'gradient',
				textColorSecondary: '#0000ff'
			}
		});
		expect(gradients).toHaveLength(1);
		expect(gradients[0]!.stops).toEqual([
			[0, '#ff0000'],
			[1, '#0000ff']
		]);
	});

	it('rainbow uses the shared Spectrum palette', () => {
		const { gradients } = render({
			'layer-1': { textColorMode: 'rainbow' }
		});
		expect(gradients[0]!.stops.map(([, color]) => color)).toEqual([
			...DEFAULT_RAINBOW_PALETTE
		]);
	});
});

describe('drawLyrixaLyricsBundle — glow color', () => {
	it('solid glow still goes through shadowColor and draws one pass', () => {
		const { fills, raw } = render({
			'layer-1': { glowColor: '#00ff00', glowColorMode: 'solid' }
		});
		expect(raw.shadowColor).toBe('#00ff00');
		expect(raw.shadowBlur).toBeGreaterThan(0);
		expect(fills).toHaveLength(1);
	});

	it('gradient glow paints a blurred multicolor pass and disables the shadow', () => {
		const { fills, gradients, raw } = render({
			'layer-1': {
				glowColor: '#ff0000',
				glowColorMode: 'gradient',
				glowColorSecondary: '#0000ff'
			}
		});
		// shadowColor cannot hold a gradient, so it must be turned off.
		expect(raw.shadowColor).toBe('transparent');
		expect(raw.shadowBlur).toBe(0);
		// One halo pass + the real text.
		expect(fills).toHaveLength(2);
		expect(fills[0]!.filter).toMatch(/^blur\(/);
		expect(gradients[0]!.stops).toEqual([
			[0, '#ff0000'],
			[1, '#0000ff']
		]);
		// The text itself stays solid — only the halo was asked to be gradient.
		expect(fills[1]!.style).toBe('#ffffff');
	});

	it('rainbow glow halo uses the shared palette', () => {
		const { fills, gradients } = render({
			'layer-1': { glowColorMode: 'rainbow' }
		});
		expect(fills).toHaveLength(2);
		expect(gradients[0]!.stops.map(([, color]) => color)).toEqual([
			...DEFAULT_RAINBOW_PALETTE
		]);
	});
});
