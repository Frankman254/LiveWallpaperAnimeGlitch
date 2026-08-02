import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import {
	GLOW_COLOR_STEPS,
	drawLinearBars,
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
 * These assertions are on the HALO pass. Cores stay one per bar on purpose:
 * they keep each bar's exact colour, and they carry the much smaller blur.
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

	it('merges the whole spectrum into one fill when every bar shares a colour', () => {
		const barCount = 16;
		const rec = createRecordingContext();
		draw(
			rec.ctx,
			tallHeights(barCount, 400),
			barCount,
			pixelSettings({ spectrumBarCount: barCount })
		);
		expect(rec.counts.fill).toBe(1);
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
		expect(rec.counts.save).toBe(0);
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
		// One run for the columns + one for the peak markers.
		expect(rec.counts.fill).toBeLessThanOrEqual(2);
	});
});
