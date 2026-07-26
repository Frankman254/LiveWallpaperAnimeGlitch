import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
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
	const ctx = {
		canvas: { width: 1920, height: 1080 },
		fillStyle: '' as unknown,
		strokeStyle: '' as unknown,
		shadowColor: '',
		shadowBlur: 0,
		globalAlpha: 1,
		globalCompositeOperation: 'source-over',
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
		},
		stroke: () => {},
		fillRect: () => {
			counts.fillRect++;
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
		createRadialGradient: () => ({ addColorStop: () => {} })
	};
	return { ctx: ctx as unknown as CanvasRenderingContext2D, counts };
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

	it('fills once per lit bar', () => {
		const barCount = 16;
		const { ctx, counts } = createRecordingContext();
		drawLinearPixel(
			ctx,
			CANVAS,
			tallHeights(barCount, 300),
			barCount,
			settingsWith({ spectrumBarCount: barCount })
		);
		expect(counts.fill).toBe(barCount);
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

	it('adds one more fill per bar for the neon core, not one per cell', () => {
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

		expect(cored.counts.fill).toBe(plain.counts.fill + barCount);
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
