import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_RAINBOW_PALETTE } from '@/lib/backgroundPalette';
import {
	createLyricsHorizontalPaint,
	isMultiColorLyricsMode,
	resolveLyricsColorMode,
	resolveLyricsColorStopOffsets,
	resolveLyricsColorStops
} from './lyricsColorModes';

/** Minimal 2D-context stand-in: only the gradient API is exercised. */
function createStubCtx() {
	const stops: Array<[number, string]> = [];
	const gradient = {
		addColorStop: (offset: number, color: string) => {
			stops.push([offset, color]);
		}
	};
	const createLinearGradient = vi.fn(() => gradient);
	return {
		ctx: { createLinearGradient } as unknown as CanvasRenderingContext2D,
		stops,
		createLinearGradient
	};
}

describe('resolveLyricsColorMode', () => {
	it('treats a missing mode (legacy config) as solid', () => {
		expect(resolveLyricsColorMode(undefined)).toBe('solid');
		expect(isMultiColorLyricsMode(undefined)).toBe(false);
	});

	it('keeps the explicit modes', () => {
		expect(resolveLyricsColorMode('gradient')).toBe('gradient');
		expect(resolveLyricsColorMode('rainbow')).toBe('rainbow');
		expect(isMultiColorLyricsMode('gradient')).toBe(true);
		expect(isMultiColorLyricsMode('rainbow')).toBe(true);
	});
});

describe('resolveLyricsColorStops', () => {
	it('solid yields only the primary color', () => {
		expect(
			resolveLyricsColorStops({ primary: '#ffffff', mode: 'solid' })
		).toEqual(['#ffffff']);
	});

	it('a legacy config without a mode behaves exactly like solid', () => {
		expect(resolveLyricsColorStops({ primary: '#00ffff' })).toEqual([
			'#00ffff'
		]);
	});

	it('gradient uses both colors', () => {
		expect(
			resolveLyricsColorStops({
				mode: 'gradient',
				primary: '#ff0000',
				secondary: '#0000ff'
			})
		).toEqual(['#ff0000', '#0000ff']);
	});

	it('gradient falls back to the primary when no second color is set yet', () => {
		expect(
			resolveLyricsColorStops({ mode: 'gradient', primary: '#ff0000' })
		).toEqual(['#ff0000', '#ff0000']);
	});

	it('rainbow comes from the shared Spectrum palette, not a local one', () => {
		expect(
			resolveLyricsColorStops({ mode: 'rainbow', primary: '#ff0000' })
		).toEqual([...DEFAULT_RAINBOW_PALETTE]);
	});
});

describe('resolveLyricsColorStopOffsets', () => {
	it('spreads stops evenly from 0 to 1', () => {
		const offsets = resolveLyricsColorStopOffsets(['a', 'b', 'c']);
		expect(offsets).toEqual([
			[0, 'a'],
			[0.5, 'b'],
			[1, 'c']
		]);
	});
});

describe('createLyricsHorizontalPaint', () => {
	it('returns a plain color string for solid (untouched fast path)', () => {
		const { ctx, createLinearGradient } = createStubCtx();
		expect(
			createLyricsHorizontalPaint(ctx, { primary: '#abcdef' }, 0, 100)
		).toBe('#abcdef');
		expect(createLinearGradient).not.toHaveBeenCalled();
	});

	it('builds a horizontal gradient across the text run', () => {
		const { ctx, stops, createLinearGradient } = createStubCtx();
		createLyricsHorizontalPaint(
			ctx,
			{ mode: 'gradient', primary: '#ff0000', secondary: '#0000ff' },
			20,
			120
		);
		expect(createLinearGradient).toHaveBeenCalledWith(20, 0, 120, 0);
		expect(stops).toEqual([
			[0, '#ff0000'],
			[1, '#0000ff']
		]);
	});

	it('lays the rainbow palette down as evenly spaced stops', () => {
		const { ctx, stops } = createStubCtx();
		createLyricsHorizontalPaint(
			ctx,
			{ mode: 'rainbow', primary: '#ff0000' },
			0,
			200
		);
		expect(stops.map(([, color]) => color)).toEqual([
			...DEFAULT_RAINBOW_PALETTE
		]);
		expect(stops[0]![0]).toBe(0);
		expect(stops[stops.length - 1]![0]).toBe(1);
	});

	it('degrades to a solid stop when the run has no width', () => {
		const { ctx, createLinearGradient } = createStubCtx();
		expect(
			createLyricsHorizontalPaint(
				ctx,
				{ mode: 'gradient', primary: '#ff0000', secondary: '#0000ff' },
				50,
				50
			)
		).toBe('#ff0000');
		expect(createLinearGradient).not.toHaveBeenCalled();
	});
});
