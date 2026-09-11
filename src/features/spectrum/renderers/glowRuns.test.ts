import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/store/defaultState';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import {
	GLOW_COLOR_STEPS,
	drawLinearBars,
	drawLinearPixel,
	drawLinearCapsules,
	drawLinearDots,
	drawLinearSpikes
} from './linear/linearRenderer';
import {
	drawRadialBars,
	drawRadialBlocks,
	drawRadialDots,
	drawRadialPixel
} from './radial/radialRenderer';

/**
 * Counts blurred draw operations so shapes cannot regress into one blurred
 * fill per bar. All batch the halo; only `drawLinearBars` also batches core glow.
 */
function createRecordingContext() {
	const counts = { fill: 0, fillRect: 0, beginPath: 0, save: 0 };
	/** Fills that happened while a shadow blur was actually set. */
	const blurredFills: number[] = [];
	/** Colour each blurred / crisp fill was painted with. */
	const blurredColors: string[] = [];
	const crispColors: string[] = [];
	const stack: {
		shadowBlur: number;
		filter: string;
		globalAlpha: number;
	}[] = [];
	const ctx = {
		canvas: { width: 1920, height: 1080 },
		fillStyle: '' as unknown,
		strokeStyle: '' as unknown,
		shadowColor: '',
		shadowBlur: 0,
		globalAlpha: 1,
		globalCompositeOperation: 'source-over',
		filter: 'none',
		lineWidth: 1,
		beginPath: () => {
			counts.beginPath++;
		},
		closePath: () => {},
		moveTo: () => {},
		lineTo: () => {},
		arc: () => {},
		rect: () => {},
		roundRect: () => {},
		fill: () => {
			counts.fill++;
			// Sweeping glows paint under ctx.filter, not shadowColor — count both or
			// assertions go blind when a shape switches paths.
			if (ctx.shadowBlur > 0) {
				blurredFills.push(ctx.shadowBlur);
				blurredColors.push(String(ctx.shadowColor));
			} else if (ctx.filter && ctx.filter !== 'none') {
				blurredFills.push(0);
				blurredColors.push(String(ctx.fillStyle));
			} else {
				crispColors.push(String(ctx.fillStyle));
			}
		},
		stroke: () => {},
		fillRect: () => {
			counts.fillRect++;
			// fillRect lands in the same buckets — drawLinearBars paints its crisp pass with it.
			if (ctx.shadowBlur > 0) {
				blurredFills.push(ctx.shadowBlur);
				blurredColors.push(String(ctx.shadowColor));
			} else if (ctx.filter && ctx.filter !== 'none') {
				blurredFills.push(0);
				blurredColors.push(String(ctx.fillStyle));
			} else {
				crispColors.push(String(ctx.fillStyle));
			}
		},
		// A real save/restore stack; without it ctx.filter leaks and blur counts go meaningless.
		save: () => {
			counts.save++;
			stack.push({
				shadowBlur: ctx.shadowBlur,
				filter: ctx.filter,
				globalAlpha: ctx.globalAlpha
			});
		},
		restore: () => {
			const previous = stack.pop();
			if (!previous) return;
			ctx.shadowBlur = previous.shadowBlur;
			ctx.filter = previous.filter;
			ctx.globalAlpha = previous.globalAlpha;
		},
		translate: () => {},
		rotate: () => {},
		scale: () => {},
		setTransform: () => {},
		createLinearGradient: () => ({ addColorStop: () => {} }),
		createRadialGradient: () => ({ addColorStop: () => {} }),
		createConicGradient: () => ({ addColorStop: () => {} })
	};
	return {
		ctx: ctx as unknown as CanvasRenderingContext2D,
		counts,
		blurredFills,
		blurredColors,
		crispColors
	};
}

const CANVAS = { width: 1920, height: 1080 } as HTMLCanvasElement;

function settingsWith(patch: Partial<SpectrumSettings>): SpectrumSettings {
	return {
		...DEFAULT_STATE,
		performanceMode: 'high',
		spectrumMirror: false,
		spectrumNeonCore: false,
		spectrumPeakHold: false,
		spectrumManualGlow: false,
		spectrumGlowIntensity: 1.5,
		spectrumShadowBlur: 24,
		spectrumGlowReach: 1,
		spectrumBarWidth: 6,
		...patch
	} as unknown as SpectrumSettings;
}

function tallHeights(barCount: number, height = 120) {
	return Float32Array.from({ length: barCount }, () => height);
}

/** Every classic bar shape, driven through one uniform call signature. */
const SHAPES: {
	name: string;
	mode: 'linear' | 'radial';
	draw: (
		ctx: CanvasRenderingContext2D,
		heights: Float32Array,
		barCount: number,
		settings: SpectrumSettings
	) => void;
}[] = [
	{
		name: 'drawLinearBars',
		mode: 'linear',
		draw: (ctx, h, n, s) => drawLinearBars(ctx, CANVAS, h, h, n, s)
	},
	{
		name: 'drawLinearCapsules',
		mode: 'linear',
		draw: (ctx, h, n, s) => drawLinearCapsules(ctx, CANVAS, h, n, s)
	},
	{
		name: 'drawLinearSpikes',
		mode: 'linear',
		draw: (ctx, h, n, s) => drawLinearSpikes(ctx, CANVAS, h, n, s)
	},
	{
		name: 'drawLinearDots',
		mode: 'linear',
		draw: (ctx, h, n, s) => drawLinearDots(ctx, CANVAS, h, n, s)
	},
	{
		name: 'drawRadialBars',
		mode: 'radial',
		draw: (ctx, h, n, s) => drawRadialBars(ctx, 960, 540, h, h, n, s, 0, 0)
	},
	{
		name: 'drawRadialBlocks',
		mode: 'radial',
		draw: (ctx, h, n, s) => drawRadialBlocks(ctx, 960, 540, h, n, s, 0, 0)
	},
	{
		name: 'drawRadialDots',
		mode: 'radial',
		draw: (ctx, h, n, s) => drawRadialDots(ctx, 960, 540, h, n, s, 0, 0)
	}
];

describe.each(SHAPES)('$name — halo blurs stay bounded', ({ mode, draw }) => {
	const base = (patch: Partial<SpectrumSettings> = {}) =>
		settingsWith({ spectrumMode: mode, ...patch });

	it('does not scale blurred draws with the bar count in solid mode', () => {
		const run = (barCount: number) => {
			const rec = createRecordingContext();
			draw(
				rec.ctx,
				tallHeights(barCount),
				barCount,
				base({ spectrumColorMode: 'solid', spectrumBarCount: barCount })
			);
			return rec.blurredFills.length;
		};
		// Halo must stay flat: 4x bars ⇒ at most 4x + a constant, never 8x.
		const few = run(24);
		const many = run(96);
		expect(many).toBeLessThanOrEqual(few * 4 + GLOW_COLOR_STEPS);
	});

	it('collapses the halo to a single blurred fill in solid mode', () => {
		const barCount = 64;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount),
			barCount,
			base({ spectrumColorMode: 'solid', spectrumBarCount: barCount })
		);
		// One halo fill + at most one core draw per bar.
		expect(rec.blurredFills.length).toBeLessThanOrEqual(barCount + 1);
	});

	it('caps halo fills at GLOW_COLOR_STEPS when the colour sweeps', () => {
		const barCount = 96;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount),
			barCount,
			base({ spectrumColorMode: 'gradient', spectrumBarCount: barCount })
		);
		// Quantized halos add at most GLOW_COLOR_STEPS on top of the per-bar cores.
		expect(rec.blurredFills.length).toBeLessThanOrEqual(
			barCount + GLOW_COLOR_STEPS
		);
	});

	it('draws nothing blurred when glow is off', () => {
		const barCount = 32;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount),
			barCount,
			base({ spectrumGlowIntensity: 0, spectrumBarCount: barCount })
		);
		expect(rec.blurredFills.length).toBe(0);
	});

	it('still paints something', () => {
		const barCount = 16;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount),
			barCount,
			base({ spectrumBarCount: barCount })
		);
		expect(rec.counts.fill + rec.counts.fillRect).toBeGreaterThan(0);
	});
});

describe('drawRadialPixel — one blurred fill per colour run, not per cell', () => {
	const pixelSettings = (patch: Partial<SpectrumSettings> = {}) =>
		settingsWith({
			spectrumMode: 'radial',
			spectrumShape: 'pixel',
			spectrumLedShape: 'square',
			spectrumLedCellSize: 1,
			spectrumLedCellGap: 0.28,
			spectrumLedAngle: 0,
			spectrumColorMode: 'solid',
			...patch
		});

	const draw = (
		ctx: CanvasRenderingContext2D,
		heights: Float32Array,
		barCount: number,
		settings: SpectrumSettings
	) => drawRadialPixel(ctx, 960, 540, heights, barCount, settings, 0, 0);

	it('does not scale fills with the number of lit cells', () => {
		const barCount = 32;
		const settings = pixelSettings({ spectrumBarCount: barCount });

		const short = createRecordingContext();
		draw(short.ctx, tallHeights(barCount, 60), barCount, settings);

		const tall = createRecordingContext();
		draw(tall.ctx, tallHeights(barCount, 600), barCount, settings);

		// 10x the cells must not mean 10x the fills.
		expect(tall.counts.fill).toBe(short.counts.fill);
		// And no cell may sneak out through the immediate-mode path either.
		expect(tall.counts.fillRect).toBe(0);
	});

	it('merges the whole spectrum into at most one fill per pass when every bar shares a colour', () => {
		const barCount = 16;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount, 400),
			barCount,
			pixelSettings({ spectrumBarCount: barCount })
		);
		// Blurred hull + crisp pass when the blur bridges the cell gap; one fill otherwise.
		expect(rec.counts.fill).toBeLessThanOrEqual(2);
	});

	it('caps blurred fills when only the glow sweeps', () => {
		const barCount = 96;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount, 400),
			barCount,
			pixelSettings({
				spectrumBarCount: barCount,
				spectrumManualGlow: true,
				spectrumGlowColorMode: 'gradient'
			})
		);
		expect(rec.counts.fill).toBeLessThanOrEqual(GLOW_COLOR_STEPS);
	});

	it('never falls back to per-cell transforms for square cells', () => {
		const barCount = 8;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount, 400),
			barCount,
			pixelSettings({
				spectrumBarCount: barCount,
				spectrumLedShape: 'diamond',
				spectrumLedAngle: 30
			})
		);
		// One save/restore per bar for the rotated hull; never one per cell.
		expect(rec.counts.save).toBeLessThanOrEqual(barCount + 2);
	});

	it('adds exactly one fill for the neon core, whatever the bar count', () => {
		const barCount = 16;
		const heights = tallHeights(barCount, 400);

		const plain = createRecordingContext();
		draw(
			plain.ctx,
			heights,
			barCount,
			pixelSettings({ spectrumBarCount: barCount })
		);

		const cored = createRecordingContext();
		draw(
			cored.ctx,
			heights,
			barCount,
			pixelSettings({
				spectrumBarCount: barCount,
				spectrumNeonCore: true
			})
		);

		expect(cored.counts.fill).toBe(plain.counts.fill + 1);
	});

	it('keeps peak markers to one fill instead of one per bar', () => {
		const barCount = 48;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount, 400),
			barCount,
			pixelSettings({
				spectrumBarCount: barCount,
				spectrumManualGlow: true,
				spectrumManualGlowMode: 'peaks',
				spectrumGlowColorMode: 'solid'
			})
		);
		// Hull + crisp (or one fill) + peak-marker run — never one fill per bar.
		expect(rec.counts.fill).toBeLessThanOrEqual(3);
	});
});

describe('drawLinearBars — blurred draws do not scale with the bar count', () => {
	// Halo and core are both batched by colour run; crisp per-bar fills carry no shadow.
	const bars = (patch: Partial<SpectrumSettings> = {}) =>
		settingsWith({ spectrumMode: 'linear', ...patch });

	const blurredAt = (barCount: number, patch: Partial<SpectrumSettings>) => {
		const rec = createRecordingContext();
		drawLinearBars(
			rec.ctx,
			CANVAS,
			tallHeights(barCount),
			tallHeights(barCount),
			barCount,
			bars({ ...patch, spectrumBarCount: barCount })
		);
		return rec.blurredFills.length;
	};

	it('stays constant in solid mode as bars grow', () => {
		const patch = {
			spectrumColorMode: 'solid' as const,
			spectrumManualGlow: false
		};
		expect(blurredAt(24, patch)).toBe(blurredAt(240, patch));
	});

	it('stays bounded by the colour steps with manual glow sweeping', () => {
		const patch = {
			spectrumColorMode: 'gradient' as const,
			spectrumManualGlow: true,
			spectrumGlowColorMode: 'gradient' as const
		};
		// Halo runs + core runs, both quantized — never one per bar.
		expect(blurredAt(240, patch)).toBeLessThanOrEqual(GLOW_COLOR_STEPS * 2);
	});

	it('keeps one crisp fill per bar', () => {
		const barCount = 40;
		const rec = createRecordingContext();
		drawLinearBars(
			rec.ctx,
			CANVAS,
			tallHeights(barCount),
			tallHeights(barCount),
			barCount,
			bars({
				spectrumColorMode: 'gradient',
				spectrumBarCount: barCount
			})
		);
		expect(rec.counts.fillRect).toBe(barCount);
	});
});

describe('core glow batching — blurred draws stay flat as bars grow', () => {
	// Shapes with a quantized blurred core pass + crisp pass; unlisted shapes still blur per bar.
	const blurredFor = (
		draw: (
			ctx: CanvasRenderingContext2D,
			heights: Float32Array,
			barCount: number,
			settings: SpectrumSettings
		) => void,
		mode: 'linear' | 'radial',
		barCount: number
	) => {
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount),
			barCount,
			settingsWith({
				spectrumMode: mode,
				spectrumBarCount: barCount,
				spectrumColorMode: 'solid',
				spectrumManualGlow: false
			})
		);
		return rec.blurredFills.length;
	};

	it.each([
		[
			'linear/capsules',
			'linear' as const,
			(
				c: CanvasRenderingContext2D,
				h: Float32Array,
				n: number,
				s: SpectrumSettings
			) => drawLinearCapsules(c, CANVAS, h, n, s)
		],
		[
			'linear/spikes',
			'linear' as const,
			(
				c: CanvasRenderingContext2D,
				h: Float32Array,
				n: number,
				s: SpectrumSettings
			) => drawLinearSpikes(c, CANVAS, h, n, s)
		],
		[
			'radial/bars',
			'radial' as const,
			(
				c: CanvasRenderingContext2D,
				h: Float32Array,
				n: number,
				s: SpectrumSettings
			) => drawRadialBars(c, 960, 540, h, h, n, s, 0, 0)
		],
		[
			'radial/blocks',
			'radial' as const,
			(
				c: CanvasRenderingContext2D,
				h: Float32Array,
				n: number,
				s: SpectrumSettings
			) => drawRadialBlocks(c, 960, 540, h, n, s, 0, 0)
		]
	])('%s costs the same blurs at 24 and 240 bars', (_name, mode, draw) => {
		expect(blurredFor(draw, mode, 240)).toBe(blurredFor(draw, mode, 24));
	});

	it('linear pixel keeps its blurred pass off the per-cell path when the blur bridges the gap', () => {
		// Wide blur bridges the tiny cells: one hull per colour run, no cell tracing.
		const barCount = 64;
		const rec = createRecordingContext();
		drawLinearPixel(
			rec.ctx,
			CANVAS,
			tallHeights(barCount, 400),
			barCount,
			settingsWith({
				spectrumMode: 'linear',
				spectrumBarCount: barCount,
				spectrumColorMode: 'solid',
				spectrumLedCellSize: 0.5,
				spectrumLedCellGap: 0.2,
				spectrumLedAngle: 0,
				spectrumShadowBlur: 60,
				spectrumGlowIntensity: 3
			})
		);
		// One blurred hull pass + one crisp pass — never one per bar or cell.
		expect(rec.blurredFills.length).toBe(1);
		expect(rec.counts.fill).toBe(2);
	});
});

describe('drawLinearPixel — a sweeping fill must not cost one blur per bar', () => {
	// Below the hull threshold the shape traces real cells; blurred runs must key on
	// the quantized colour, never the exact fill colour.
	const chunkyLed = (patch: Partial<SpectrumSettings> = {}) =>
		settingsWith({
			spectrumMode: 'linear',
			spectrumLedCellSize: 2,
			spectrumLedCellGap: 1.2,
			spectrumLedAngle: 0,
			spectrumShadowBlur: 8,
			spectrumGlowIntensity: 1,
			...patch
		});

	const blurredAt = (barCount: number, patch: Partial<SpectrumSettings>) => {
		const rec = createRecordingContext();
		drawLinearPixel(
			rec.ctx,
			CANVAS,
			tallHeights(barCount, 400),
			barCount,
			chunkyLed({ spectrumBarCount: barCount, ...patch })
		);
		return rec.blurredFills.length;
	};

	it('stays bounded by the colour steps when the fill sweeps', () => {
		expect(
			blurredAt(240, { spectrumColorMode: 'gradient' })
		).toBeLessThanOrEqual(GLOW_COLOR_STEPS);
	});

	it('costs the same at 24 and 240 bars with a sweeping fill', () => {
		expect(blurredAt(240, { spectrumColorMode: 'rainbow' })).toBe(
			blurredAt(24, { spectrumColorMode: 'rainbow' })
		);
	});

	it('keeps the single-pass merge when the fill is solid', () => {
		// Solid stays a single pass; splitting would trace every cell twice.
		expect(blurredAt(240, { spectrumColorMode: 'solid' })).toBe(1);
	});

	it('still paints a crisp fill per colour once the passes split', () => {
		const rec = createRecordingContext();
		const barCount = 48;
		drawLinearPixel(
			rec.ctx,
			CANVAS,
			tallHeights(barCount, 400),
			barCount,
			chunkyLed({
				spectrumBarCount: barCount,
				spectrumColorMode: 'gradient'
			})
		);
		// Blurred runs are quantized; the crisp pass keeps every bar's exact colour.
		expect(rec.counts.fill).toBeGreaterThan(rec.blurredFills.length);
	});
});

// Manual Glow is a colour override: the glow reads its own palette, not the fill.
describe.each(SHAPES)(
	'$name — Manual Glow drives the glow colour',
	({ mode, draw }) => {
		it('paints the glow from the glow palette, not the fill', () => {
			const barCount = 32;
			const rec = createRecordingContext();
			draw(
				rec.ctx,
				tallHeights(barCount),
				barCount,
				settingsWith({
					spectrumMode: mode,
					spectrumBarCount: barCount,
					// Fill green, glow red; both solid so exactly one colour per pass.
					spectrumColorMode: 'solid',
					spectrumPrimaryColor: '#00ff00',
					spectrumManualGlow: true,
					spectrumManualGlowMode: 'gradient',
					spectrumGlowColorMode: 'solid',
					spectrumGlowPrimaryColor: '#ff0000'
				})
			);
			expect(rec.blurredColors.length).toBeGreaterThan(0);
			expect(new Set(rec.blurredColors)).toEqual(new Set(['#ff0000']));
			expect(new Set(rec.crispColors)).toEqual(new Set(['#00ff00']));
		});
	}
);

describe('sweeping glow collapses to a single blurred pass', () => {
	// A sweeping glow is painted as the gradient itself under ctx.filter: one pass, every colour.
	const LINEAR_SHAPES = SHAPES.filter(shape => shape.mode === 'linear');

	it.each(LINEAR_SHAPES.map(shape => [shape.name, shape.draw] as const))(
		'%s stays at a small constant, well under GLOW_COLOR_STEPS',
		(_name, draw) => {
			const blurredAt = (barCount: number) => {
				const rec = createRecordingContext();
				draw(
					rec.ctx,
					tallHeights(barCount),
					barCount,
					settingsWith({
						spectrumMode: 'linear',
						spectrumBarCount: barCount,
						spectrumColorMode: 'gradient'
					})
				);
				return rec.blurredFills.length;
			};
			expect(blurredAt(240)).toBeLessThan(GLOW_COLOR_STEPS);
			expect(blurredAt(240)).toBe(blurredAt(24));
		}
	);

	it('keeps the quantized runs when the glow is a flat colour', () => {
		// Solid needs no gradient; one run already covers the whole figure.
		const barCount = 96;
		const rec = createRecordingContext();
		drawLinearBars(
			rec.ctx,
			CANVAS,
			tallHeights(barCount),
			tallHeights(barCount),
			barCount,
			settingsWith({
				spectrumMode: 'linear',
				spectrumBarCount: barCount,
				spectrumColorMode: 'solid'
			})
		);
		expect(rec.blurredFills.every(blur => blur > 0)).toBe(true);
	});
});
