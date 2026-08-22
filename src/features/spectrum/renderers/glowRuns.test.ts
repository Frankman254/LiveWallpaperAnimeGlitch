import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
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
 * Counts blurred draw operations so the classic bar shapes cannot regress into
 * one blurred fill per bar.
 *
 * That regression is the whole reason two spectrums with glow melted the frame:
 * Canvas2D re-runs the (very expensive) blur on every fill under a shadow, so a
 * halo drawn inside the bar loop costs one blur per bar — 96 per instance, and
 * exactly double with the second spectrum on. Measured on the real draw
 * pattern, two maxed instances went from ~52ms to ~14ms per frame once the
 * halos were batched into one fill per colour run.
 *
 * These assertions are on the HALO pass, which every classic bar shape batches.
 * `drawLinearBars` additionally batches its CORE glow (see the block at the
 * bottom of this file): its crisp fills stay one per bar, but they carry no
 * shadow at all, so nothing blurred scales with the bar count. The other shapes
 * still pay one blurred core per bar.
 */
function createRecordingContext() {
	const counts = { fill: 0, fillRect: 0, beginPath: 0, save: 0 };
	/** Fills that happened while a shadow blur was actually set. */
	const blurredFills: number[] = [];
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
			if (ctx.shadowBlur > 0) blurredFills.push(ctx.shadowBlur);
		},
		stroke: () => {},
		fillRect: () => {
			counts.fillRect++;
			if (ctx.shadowBlur > 0) blurredFills.push(ctx.shadowBlur);
		},
		save: () => {
			counts.save++;
		},
		restore: () => {},
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
		blurredFills
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
		// Cores are still per bar, so the total grows — but the halo must not
		// contribute more than a constant. 4x the bars, at most ~4x + a
		// constant, never 8x.
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
		// Halos are quantized, so they add at most GLOW_COLOR_STEPS on top of
		// the per-bar cores — never the 2x-per-bar of the old interleaved loop.
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
		// One blurred hull pass + one crisp cell pass when the blur is wide
		// enough to bridge the cell gap; a single combined fill otherwise.
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
		// save/restore per cell was the other half of the cost; squares and
		// diamonds emit rotated corners directly.
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
		// The hull pass wraps each bar in one save/restore to place its rotated
		// rect; what must never come back is a save PER CELL.
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
		// Columns (blurred hull + crisp cells, or one combined fill) plus one
		// run for the peak markers — never one fill per bar.
		expect(rec.counts.fill).toBeLessThanOrEqual(3);
	});
});

describe('drawLinearBars — blurred draws do not scale with the bar count', () => {
	// The reported symptom: horizontal `bars` + manual glow + a high bar count
	// fell under 30fps. Every blurred draw re-runs the (quadratic in radius)
	// Canvas2D blur, so 120 bars meant 120 blurs per instance per frame on the
	// core pass alone. Halo and core are both batched by colour run now, and
	// the crisp per-bar fills carry no shadow.
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
	// The shapes whose CORE glow was split into a quantized blurred pass plus a
	// crisp unshadowed pass. Measured on a real canvas, this took a 120-bar
	// spectrum from ~24ms to ~12ms (linear capsules/spikes) and ~61ms to ~26ms
	// (radial bars). Shapes NOT listed here were measured too and left alone:
	// batching dots or linear blocks made them SLOWER, because merging shapes
	// that sit far apart grows the area each blur has to cover.
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
		// Dense LED (tiny cells, tight gap) + a wide blur: the glow collapses
		// to one hull per colour run instead of tracing every cell.
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
