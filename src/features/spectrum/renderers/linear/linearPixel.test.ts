import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/store/defaultState';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import { drawLinearPixel } from './linearRenderer';

/**
 * Counts draw operations so the LED equalizer cannot regress into filling once
 * per cell.
 *
 * That regression is what made this shape unusable: the bar's shadow is set
 * before the cells are drawn, and Canvas2D re-runs the blur on every fill under
 * it. A 96-bar column of ~100 cells meant ~19k blurred fills per frame instead
 * of 96.
 */
function createRecordingContext() {
	const counts = { fill: 0, fillRect: 0, beginPath: 0, save: 0 };
	/** Fills that happened while a shadow blur was actually set. */
	const blurredFills: number[] = [];
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
			// A glow that sweeps cannot go through `shadowColor` (canvas
			// shadows are one flat colour), so it is painted as a gradient
			// under `ctx.filter = blur(...)` instead. Both are the same
			// expensive Gaussian, so both count here — otherwise these
			// assertions would go blind the moment a shape switches paths.
			if (ctx.shadowBlur > 0) blurredFills.push(ctx.shadowBlur);
			else if (ctx.filter && ctx.filter !== 'none') blurredFills.push(0);
		},
		stroke: () => {},
		fillRect: () => {
			counts.fillRect++;
		},
		// A real `save`/`restore` stack. Without it `ctx.filter` set by a
		// blurred pass leaks into every later fill in the mock, and the
		// blurred-draw counts below silently become meaningless.
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
		createRadialGradient: () => ({ addColorStop: () => {} })
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
		spectrumMode: 'linear',
		spectrumShape: 'pixel',
		spectrumLinearOrientation: 'horizontal',
		spectrumColorMode: 'solid',
		spectrumMirror: false,
		spectrumNeonCore: false,
		spectrumBarWidth: 8,
		spectrumLedCellSize: 1,
		spectrumLedCellGap: 0.28,
		spectrumLedAngle: 0,
		spectrumLedShape: 'square',
		...patch
	} as unknown as SpectrumSettings;
}

/** Every bar tall enough to light many cells. */
function tallHeights(barCount: number, height: number) {
	return Float32Array.from({ length: barCount }, () => height);
}

describe('drawLinearPixel — one blurred fill per bar', () => {
	it('does not scale fills with the number of lit cells', () => {
		const barCount = 32;
		const settings = settingsWith({ spectrumBarCount: barCount });

		const short = createRecordingContext();
		drawLinearPixel(
			short.ctx,
			CANVAS,
			tallHeights(barCount, 40),
			barCount,
			settings
		);

		const tall = createRecordingContext();
		drawLinearPixel(
			tall.ctx,
			CANVAS,
			tallHeights(barCount, 400),
			barCount,
			settings
		);

		// 10x the cells must not mean 10x the fills.
		expect(tall.counts.fill).toBe(short.counts.fill);
		// And no cell may sneak out through the immediate-mode path either.
		expect(tall.counts.fillRect).toBe(0);
	});

	it('merges the whole spectrum into one fill when every bar shares a colour', () => {
		const barCount = 16;
		const { ctx, counts } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			tallHeights(barCount, 300),
			barCount,
			settingsWith({ spectrumBarCount: barCount })
		);
		expect(counts.fill).toBe(1);
	});

	it('caps blurred fills when only the glow sweeps', () => {
		// Manual glow defaults to a sweeping colour mode, which gave every bar
		// its own shadow colour and blocked all merging. The glow colour is
		// sampled on a coarse grid so the count stays bounded by bar count.
		const barCount = 96;
		const { ctx, counts } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			tallHeights(barCount, 300),
			barCount,
			settingsWith({
				spectrumBarCount: barCount,
				spectrumColorMode: 'solid',
				spectrumManualGlow: true,
				spectrumGlowColorMode: 'gradient'
			})
		);
		expect(counts.fill).toBeLessThanOrEqual(16);
	});

	it('splits the passes when colours sweep, so only the crisp fills scale', () => {
		// Sweeping modes give every bar its own colour, so the crisp fills
		// cannot merge — one per bar is the floor. What must NOT scale is the
		// blurred pass: it keys on the quantized glow colour, so it stays a
		// constant no matter how many bars there are. The total fill count goes
		// slightly UP in exchange, which is the trade that matters: an
		// unshadowed fill is orders of magnitude cheaper than a blurred one.
		const barCount = 16;
		const { ctx, counts, blurredFills } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			tallHeights(barCount, 300),
			barCount,
			settingsWith({
				spectrumBarCount: barCount,
				spectrumColorMode: 'rainbow'
			})
		);
		expect(counts.fill).toBeGreaterThan(0);
		expect(counts.fill - blurredFills.length).toBeLessThanOrEqual(barCount);
		expect(blurredFills.length).toBeLessThanOrEqual(16);
	});

	it('skips bars with no lit cells entirely', () => {
		const barCount = 16;
		const { ctx, counts } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			new Float32Array(barCount),
			barCount,
			settingsWith({ spectrumBarCount: barCount })
		);
		expect(counts.fill).toBe(0);
	});

	it('keeps the mirror inside the same fill', () => {
		const barCount = 16;
		const heights = tallHeights(barCount, 300);

		const single = createRecordingContext();
		drawLinearPixel(
			single.ctx,
			CANVAS,
			heights,
			barCount,
			settingsWith({ spectrumBarCount: barCount, spectrumMirror: false })
		);

		const mirrored = createRecordingContext();
		drawLinearPixel(
			mirrored.ctx,
			CANVAS,
			heights,
			barCount,
			settingsWith({ spectrumBarCount: barCount, spectrumMirror: true })
		);

		expect(mirrored.counts.fill).toBe(single.counts.fill);
	});

	it('adds exactly one fill for the neon core, whatever the bar count', () => {
		const barCount = 16;
		const heights = tallHeights(barCount, 300);

		const plain = createRecordingContext();
		drawLinearPixel(
			plain.ctx,
			CANVAS,
			heights,
			barCount,
			settingsWith({
				spectrumBarCount: barCount,
				spectrumNeonCore: false
			})
		);

		const cored = createRecordingContext();
		drawLinearPixel(
			cored.ctx,
			CANVAS,
			heights,
			barCount,
			settingsWith({ spectrumBarCount: barCount, spectrumNeonCore: true })
		);

		// The core colour is constant, so all cores are a single unshadowed fill.
		expect(cored.counts.fill).toBe(plain.counts.fill + 1);
	});

	it('never falls back to per-cell transforms for square cells', () => {
		// save/restore per cell was the other half of the cost; squares and
		// diamonds now emit rotated corners directly.
		const barCount = 8;
		const { ctx, counts } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			tallHeights(barCount, 400),
			barCount,
			settingsWith({
				spectrumBarCount: barCount,
				spectrumLedShape: 'diamond',
				spectrumLedAngle: 30
			})
		);
		expect(counts.save).toBe(0);
	});
});
