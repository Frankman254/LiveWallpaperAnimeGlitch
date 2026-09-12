import { describe, expect, it } from 'vitest';
import { DEFAULT_RAINBOW_PALETTE } from '@/lib/backgroundPalette';
import { DEFAULT_STATE } from '@/store/defaultState';
import { resolveLyricStyleSlots } from './lyricsColorModes';
import type { LyricsPalettes } from './lyricsColorModes';
import type { WallpaperState } from '@/types/wallpaper';

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

/** Global Lyrics Style set to image-source rainbow, no per-layer override. */
function globalImageState(
	patches: Partial<WallpaperState> = {}
): WallpaperState {
	return {
		...DEFAULT_STATE,
		audioLyricsActiveColorSource: 'image',
		audioLyricsActiveColorMode: 'rainbow',
		audioLyricsStrokeColorSource: 'image',
		audioLyricsStrokeColorMode: 'rainbow',
		audioLyricsGlowColorSource: 'image',
		audioLyricsGlowColorMode: 'rainbow',
		...patches
	};
}

describe('resolveLyricStyleSlots source fallback', () => {
	it('paints the image palette, not the stock rainbow, when only the global source is set', () => {
		// Regression: the editor path read `source` solely from the per-layer
		// override, so a global image/theme pick silently dropped to 'manual'
		// and the whole spectrum painted DEFAULT_RAINBOW_PALETTE.
		const slots = resolveLyricStyleSlots(
			globalImageState(),
			undefined,
			'#f8fafc',
			IMAGE_PALETTE
		);
		expect(slots.fillSlot.rainbow).toEqual(
			IMAGE_PALETTE.background.rainbow
		);
		expect(slots.fillSlot.rainbow).not.toEqual(DEFAULT_RAINBOW_PALETTE);
		expect(slots.strokeSlot.rainbow).toEqual(
			IMAGE_PALETTE.background.rainbow
		);
		expect(slots.glowSlot.rainbow).toEqual(
			IMAGE_PALETTE.background.rainbow
		);
	});

	it('honours a per-layer source over the global one', () => {
		const slots = resolveLyricStyleSlots(
			globalImageState(),
			{ textColorSource: 'manual', textColorMode: 'solid' },
			'#ff0000',
			IMAGE_PALETTE
		);
		// Manual solid: the layer's own color passes through untouched.
		expect(slots.fillSlot.primary).toBe('#ff0000');
		// Stroke/glow still follow the global image source.
		expect(slots.strokeSlot.rainbow).toEqual(
			IMAGE_PALETTE.background.rainbow
		);
	});

	it('manual global source keeps the line color as the solid paint', () => {
		const slots = resolveLyricStyleSlots(
			{ ...DEFAULT_STATE },
			undefined,
			'#123456',
			IMAGE_PALETTE
		);
		expect(slots.fillSlot.mode).toBe('solid');
		expect(slots.fillSlot.primary).toBe('#123456');
	});

	it('theme source samples the theme palette', () => {
		const slots = resolveLyricStyleSlots(
			globalImageState({ audioLyricsActiveColorSource: 'theme' }),
			undefined,
			'#f8fafc',
			IMAGE_PALETTE
		);
		expect(slots.fillSlot.rainbow).toEqual(IMAGE_PALETTE.theme.rainbow);
	});
});
