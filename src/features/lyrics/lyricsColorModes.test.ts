import { describe, expect, it, vi } from 'vitest';
import {
	COMPLETE_ROTATE_EXTREMES,
	DEFAULT_RAINBOW_PALETTE
} from '@/lib/backgroundPalette';
import {
	composeLyricsFilter,
	createLyricsHorizontalPaint,
	isMultiColorLyricsMode,
	resolveLyricsColorMode,
	resolveLyricsColorSlot,
	resolveLyricsColorSource,
	resolveLyricsColorStopOffsets,
	resolveLyricsColorStops,
	resolveLyricsRotateFilter
} from './lyricsColorModes';
import type { LyricsColorSlot, LyricsPalettes } from './lyricsColorModes';

/** Slots are resolved against the palettes before any paint is built. */
function stopsFor(slot: LyricsColorSlot, palettes?: LyricsPalettes) {
	return resolveLyricsColorStops(resolveLyricsColorSlot(slot, palettes));
}

const IMAGE_PALETTE: LyricsPalettes = {
	background: {
		sourceUrl: 'blob:image',
		colors: ['#101010', '#202020'],
		dominant: '#112233',
		secondary: '#445566',
		rainbow: ['#010101', '#020202', '#030303'],
		accent: '#778899',
		backdrop: '#000000'
	},
	theme: {
		sourceUrl: 'theme',
		colors: ['#aa0000'],
		dominant: '#aa0000',
		secondary: '#00aa00',
		rainbow: ['#aa0000', '#00aa00'],
		accent: '#0000aa',
		backdrop: '#111111'
	}
};

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

describe('resolveLyricsColorSlot', () => {
	it('solid yields only the primary color', () => {
		expect(stopsFor({ primary: '#ffffff', mode: 'solid' })).toEqual([
			'#ffffff'
		]);
	});

	it('a legacy config without mode or source behaves exactly like solid', () => {
		expect(stopsFor({ primary: '#00ffff' })).toEqual(['#00ffff']);
		expect(resolveLyricsColorSource(undefined)).toBe('manual');
	});

	it('gradient uses both colors', () => {
		expect(
			stopsFor({
				mode: 'gradient',
				primary: '#ff0000',
				secondary: '#0000ff'
			})
		).toEqual(['#ff0000', '#0000ff']);
	});

	it('gradient falls back to the primary when no second color is set yet', () => {
		expect(stopsFor({ mode: 'gradient', primary: '#ff0000' })).toEqual([
			'#ff0000',
			'#ff0000'
		]);
	});

	it('rainbow comes from the shared Spectrum palette, not a local one', () => {
		expect(stopsFor({ mode: 'rainbow', primary: '#ff0000' })).toEqual([
			...DEFAULT_RAINBOW_PALETTE
		]);
	});

	it('the image source takes both gradient stops from the wallpaper palette', () => {
		expect(
			stopsFor(
				{
					source: 'image',
					mode: 'gradient',
					primary: '#ff0000',
					secondary: '#0000ff'
				},
				IMAGE_PALETTE
			)
		).toEqual(['#112233', '#445566']);
	});

	it('the image source rainbow uses the wallpaper palette rainbow', () => {
		expect(
			stopsFor(
				{ source: 'image', mode: 'rainbow', primary: '#ff0000' },
				IMAGE_PALETTE
			)
		).toEqual(['#010101', '#020202', '#030303']);
	});

	it('the theme source samples the editor theme palette instead', () => {
		expect(
			stopsFor(
				{ source: 'theme', mode: 'gradient', primary: '#ff0000' },
				IMAGE_PALETTE
			)
		).toEqual(['#aa0000', '#00aa00']);
	});

	it('the image source drives a solid color too', () => {
		expect(
			stopsFor({ source: 'image', primary: '#ff0000' }, IMAGE_PALETTE)
		).toEqual(['#112233']);
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
			createLyricsHorizontalPaint(
				ctx,
				resolveLyricsColorSlot({ primary: '#abcdef' }),
				0,
				100
			)
		).toBe('#abcdef');
		expect(createLinearGradient).not.toHaveBeenCalled();
	});

	it('builds a horizontal gradient across the text run', () => {
		const { ctx, stops, createLinearGradient } = createStubCtx();
		createLyricsHorizontalPaint(
			ctx,
			resolveLyricsColorSlot({
				mode: 'gradient',
				primary: '#ff0000',
				secondary: '#0000ff'
			}),
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
			resolveLyricsColorSlot({ mode: 'rainbow', primary: '#ff0000' }),
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
				resolveLyricsColorSlot({
					mode: 'gradient',
					primary: '#ff0000',
					secondary: '#0000ff'
				}),
				50,
				50
			)
		).toBe('#ff0000');
		expect(createLinearGradient).not.toHaveBeenCalled();
	});
});

describe('visible-rotate (Rotate RGB)', () => {
	it('paints the same palette as static rainbow', () => {
		expect(
			stopsFor({ mode: 'visible-rotate', primary: '#ff0000' })
		).toEqual(stopsFor({ mode: 'rainbow', primary: '#ff0000' }));
	});

	it('follows the image source palette like every other mode', () => {
		expect(
			stopsFor(
				{ mode: 'visible-rotate', primary: '#ff0000', source: 'image' },
				IMAGE_PALETTE
			)
		).toEqual(['#010101', '#020202', '#030303']);
	});

	it('is the only mode that yields an animating filter', () => {
		for (const mode of ['solid', 'gradient', 'rainbow'] as const) {
			expect(
				resolveLyricsRotateFilter(
					resolveLyricsColorSlot({ mode, primary: '#ff0000' })
				),
				mode
			).toBeNull();
		}
		expect(
			resolveLyricsRotateFilter(
				resolveLyricsColorSlot({
					mode: 'visible-rotate',
					primary: '#ff0000'
				})
			)
		).toMatch(/^hue-rotate\(-?[\d.]+deg\)$/);
	});

	it("advances with Spectrum's rotation clock", () => {
		const slot = resolveLyricsColorSlot({
			mode: 'visible-rotate',
			primary: '#ff0000'
		});
		const now = vi.spyOn(performance, 'now');
		now.mockReturnValue(0);
		const first = resolveLyricsRotateFilter(slot);
		// A quarter of the 4800ms cycle ⇒ a quarter turn of the hue wheel.
		now.mockReturnValue(1200);
		const later = resolveLyricsRotateFilter(slot);
		now.mockRestore();
		expect(first).toBe('hue-rotate(0.0deg)');
		expect(later).toBe('hue-rotate(90.0deg)');
	});
});

describe('composeLyricsFilter', () => {
	it('drops empty parts and falls back to none', () => {
		expect(composeLyricsFilter(null, undefined)).toBe('none');
		expect(composeLyricsFilter('blur(4px)', null)).toBe('blur(4px)');
		expect(composeLyricsFilter('blur(4px)', 'hue-rotate(90deg)')).toBe(
			'blur(4px) hue-rotate(90deg)'
		);
	});
});

describe('complete-rotate (Complete RGB)', () => {
	it('is the rainbow plus pure black and pure white', () => {
		expect(
			stopsFor({ mode: 'complete-rotate', primary: '#ff0000' })
		).toEqual([...DEFAULT_RAINBOW_PALETTE, ...COMPLETE_ROTATE_EXTREMES]);
	});

	it('appends the extremes to an image-sourced palette too', () => {
		expect(
			stopsFor(
				{
					mode: 'complete-rotate',
					primary: '#ff0000',
					source: 'image'
				},
				IMAGE_PALETTE
			)
		).toEqual([
			'#010101',
			'#020202',
			'#030303',
			...COMPLETE_ROTATE_EXTREMES
		]);
	});

	it('animates like rotate does', () => {
		expect(
			resolveLyricsRotateFilter(
				resolveLyricsColorSlot({
					mode: 'complete-rotate',
					primary: '#ff0000'
				})
			)
		).toMatch(/^hue-rotate\(/);
	});
});
