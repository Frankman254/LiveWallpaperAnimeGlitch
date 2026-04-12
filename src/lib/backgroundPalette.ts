import type {
	ColorSourceMode,
	EditorTheme,
	WallpaperState
} from '@/types/wallpaper';
import { getLruEntry, setLruEntry } from '@/lib/lruCache';

export interface BackgroundPalette {
	sourceUrl: string | null;
	colors: string[];
	dominant: string;
	secondary: string;
	rainbow: string[];
	accent: string;
	backdrop: string;
}

const DEFAULT_RAINBOW_PALETTE = [
	'#ff004c',
	'#ff7a00',
	'#ffe600',
	'#2cff95',
	'#00d4ff',
	'#5566ff'
];

export const DEFAULT_BACKGROUND_PALETTE: BackgroundPalette = {
	sourceUrl: null,
	colors: ['#ff00ff', '#00ffff', '#7c3aed', '#f472b6', '#f59e0b', '#22d3ee'],
	dominant: '#ff00ff',
	secondary: '#00ffff',
	rainbow: DEFAULT_RAINBOW_PALETTE,
	accent: '#ff00ff',
	backdrop: '#140014'
};

type PaletteBucket = {
	r: number;
	g: number;
	b: number;
	weight: number;
};

const PALETTE_CACHE_LIMIT = 16;
const PALETTE_IMAGE_CACHE_LIMIT = 10;
const paletteCache = new Map<string, Promise<BackgroundPalette>>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();

const EDITOR_THEME_PALETTE_SEEDS: Record<EditorTheme, string[]> = {
	cyber: ['#22d3ee', '#67e8f9', '#0ea5e9', '#60a5fa', '#a78bfa', '#14b8a6'],
	glass: ['#ffffff', '#e2e8f0', '#cbd5e1', '#93c5fd', '#c4b5fd', '#94a3b8'],
	sunset: ['#fb923c', '#f472b6', '#f97316', '#f59e0b', '#ec4899', '#fca5a5'],
	terminal: ['#34d399', '#86efac', '#10b981', '#22c55e', '#a7f3d0', '#4ade80'],
	midnight: ['#818cf8', '#a5b4fc', '#60a5fa', '#c4b5fd', '#38bdf8', '#6366f1'],
	carbon: ['#f8fafc', '#cbd5e1', '#94a3b8', '#14b8a6', '#06b6d4', '#64748b'],
	aurora: ['#5eead4', '#a78bfa', '#22d3ee', '#f472b6', '#c084fc', '#2dd4bf'],
	rose: ['#fb7185', '#f9a8d4', '#f472b6', '#fecdd3', '#f43f5e', '#ffe4e6'],
	ocean: ['#38bdf8', '#0ea5e9', '#22d3ee', '#67e8f9', '#2563eb', '#dbeafe'],
	amber: ['#f59e0b', '#fbbf24', '#f97316', '#fde68a', '#fcd34d', '#fff7ed'],
	'rotate-rgb': ['#ff004c', '#ff7a00', '#ffe600', '#2cff95', '#00d4ff', '#5566ff']
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function clampChannel(value: number): number {
	return clamp(Math.round(value), 0, 255);
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g)
		.toString(16)
		.padStart(2, '0')}${clampChannel(b).toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16)
	];
}

function rgbToHsl(
	r: number,
	g: number,
	b: number
): { h: number; s: number; l: number } {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return { h: 0, s: 0, l };
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	switch (max) {
		case rn:
			h = (gn - bn) / d + (gn < bn ? 6 : 0);
			break;
		case gn:
			h = (bn - rn) / d + 2;
			break;
		default:
			h = (rn - gn) / d + 4;
			break;
	}
	return { h: h / 6, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
	const m = l - c / 2;
	let r = 0, g = 0, b = 0;
	const sector = Math.floor(h * 6);
	switch (sector % 6) {
		case 0: r = c; g = x; b = 0; break;
		case 1: r = x; g = c; b = 0; break;
		case 2: r = 0; g = c; b = x; break;
		case 3: r = 0; g = x; b = c; break;
		case 4: r = x; g = 0; b = c; break;
		default: r = c; g = 0; b = x; break;
	}
	return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** If a color is saturated but too dark, lift its lightness so it looks vibrant. */
function ensureVibrancy(hex: string, minL = 0.42): string {
	const [r, g, b] = hexToRgb(hex);
	const { h, s, l } = rgbToHsl(r, g, b);
	if (s < 0.15 || l >= minL) return hex;
	return hslToHex(h, s, minL);
}

function mixHexColors(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	return rgbToHex(
		r1 + (r2 - r1) * t,
		g1 + (g2 - g1) * t,
		b1 + (b2 - b1) * t
	);
}

function shadeColor(hex: string, factor: number): string {
	const [r, g, b] = hexToRgb(hex);
	return rgbToHex(r * factor, g * factor, b * factor);
}

function quantizeChannel(value: number): number {
	return clampChannel(Math.round(value / 24) * 24);
}

function colorDistance(a: [number, number, number], b: [number, number, number]) {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

function getPaletteBuckets(imageData: Uint8ClampedArray): PaletteBucket[] {
	const buckets = new Map<string, PaletteBucket>();
	for (let i = 0; i < imageData.length; i += 4) {
		const alpha = imageData[i + 3] / 255;
		if (alpha < 0.2) continue;

		const r = imageData[i];
		const g = imageData[i + 1];
		const b = imageData[i + 2];
		const { s, l } = rgbToHsl(r, g, b);

		// Base weight — saturated colors are strongly preferred
		let weight = 1 + s * 3;

		// Penalise near-black and near-white heavily
		if (l < 0.05 || l > 0.97) weight *= 0.05;
		else if (l < 0.15 || l > 0.93) weight *= 0.18;
		else if (l < 0.25 || l > 0.88) weight *= 0.45;

		// Penalise greys — they compete unfairly just by pixel count
		if (s < 0.08) weight *= 0.15;
		else if (s < 0.18) weight *= 0.45;

		// Reward vivid colours
		if (s > 0.5) weight *= 1.6;
		else if (s > 0.35) weight *= 1.25;

		weight *= 0.4 + alpha * 0.6;

		const qr = quantizeChannel(r);
		const qg = quantizeChannel(g);
		const qb = quantizeChannel(b);
		const key = `${qr}-${qg}-${qb}`;
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.r += r * weight;
			bucket.g += g * weight;
			bucket.b += b * weight;
			bucket.weight += weight;
		} else {
			buckets.set(key, {
				r: r * weight,
				g: g * weight,
				b: b * weight,
				weight
			});
		}
	}

	return [...buckets.values()].sort((a, b) => b.weight - a.weight);
}

function selectDistinctColors(buckets: PaletteBucket[], count: number): string[] {
	const selected: Array<[number, number, number]> = [];
	const colors: string[] = [];
	for (const bucket of buckets) {
		if (colors.length >= count) break;
		const avg: [number, number, number] = [
			bucket.r / bucket.weight,
			bucket.g / bucket.weight,
			bucket.b / bucket.weight
		];
		if (selected.some(color => colorDistance(color, avg) < 44)) continue;
		selected.push(avg);
		colors.push(rgbToHex(avg[0], avg[1], avg[2]));
	}
	return colors;
}

function normalizePalette(sourceUrl: string, colors: string[]): BackgroundPalette {
	// Lift any dark-but-saturated extracted colors before using them
	const vibrant = colors.map(c => ensureVibrancy(c, 0.42));
	const dominant = ensureVibrancy(vibrant[0] ?? DEFAULT_BACKGROUND_PALETTE.dominant, 0.45);
	const secondary = ensureVibrancy(vibrant[1] ?? mixHexColors(dominant, '#ffffff', 0.2), 0.42);

	const normalized = [...vibrant];

	// Fill missing slots with hue-rotated variants (not dark shades)
	const [dr, dg, db] = hexToRgb(dominant);
	const { h: dh, s: ds, l: dl } = rgbToHsl(dr, dg, db);
	const fillL = Math.max(dl, 0.44);
	const fillS = Math.max(ds, 0.5);
	const hueSteps = [0.15, 0.3, 0.5, 0.65, 0.8];
	let stepIdx = 0;
	while (normalized.length < 6) {
		const hueShift = hueSteps[stepIdx % hueSteps.length] ?? 0.15;
		normalized.push(hslToHex((dh + hueShift) % 1, fillS, fillL));
		stepIdx++;
	}

	return {
		sourceUrl,
		colors: normalized,
		dominant,
		secondary,
		rainbow: normalized.slice(0, 6),
		accent: dominant,
		backdrop: shadeColor(dominant, 0.22)
	};
}

async function loadImage(url: string): Promise<HTMLImageElement> {
	const cached = getLruEntry(imageCache, url);
	if (cached) return cached;
	const promise = new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () =>
			reject(new Error(`Unable to load palette source image: ${url}`));
		image.src = url;
	});
	setLruEntry(imageCache, url, promise, PALETTE_IMAGE_CACHE_LIMIT);
	return promise;
}

async function buildPalette(url: string): Promise<BackgroundPalette> {
	if (typeof document === 'undefined') {
		return { ...DEFAULT_BACKGROUND_PALETTE, sourceUrl: url };
	}

	const image = await loadImage(url);
	const sampleWidth = 96;
	const sampleHeight = Math.max(
		32,
		Math.round(
			sampleWidth /
				Math.max((image.naturalWidth || 1) / Math.max(image.naturalHeight || 1, 1), 0.1)
		)
	);
	const canvas = document.createElement('canvas');
	canvas.width = sampleWidth;
	canvas.height = sampleHeight;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return { ...DEFAULT_BACKGROUND_PALETTE, sourceUrl: url };

	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const buckets = getPaletteBuckets(data);
	const colors = selectDistinctColors(buckets, 6);
	if (colors.length === 0) {
		return { ...DEFAULT_BACKGROUND_PALETTE, sourceUrl: url };
	}
	return normalizePalette(url, colors);
}

export async function getBackgroundPalette(url: string | null): Promise<BackgroundPalette> {
	if (!url) return DEFAULT_BACKGROUND_PALETTE;
	const cached = getLruEntry(paletteCache, url);
	if (cached) return cached;
	const promise = buildPalette(url).catch(() => ({
		...DEFAULT_BACKGROUND_PALETTE,
		sourceUrl: url
	}));
	setLruEntry(paletteCache, url, promise, PALETTE_CACHE_LIMIT);
	return promise;
}

export function clearPaletteCache(url?: string): void {
	if (url) {
		paletteCache.delete(url);
		imageCache.delete(url);
	} else {
		paletteCache.clear();
		imageCache.clear();
	}
}

export function getEditorThemePalette(theme: EditorTheme): BackgroundPalette {
	const colors =
		EDITOR_THEME_PALETTE_SEEDS[theme] ??
		EDITOR_THEME_PALETTE_SEEDS.glass;
	return normalizePalette(`theme:${theme}`, colors);
}

export function resolvePaletteSourceUrl(
	state: Pick<
		WallpaperState,
		| 'backgroundImageEnabled'
		| 'imageUrl'
		| 'globalBackgroundEnabled'
		| 'globalBackgroundUrl'
	>
): string | null {
	if (state.backgroundImageEnabled && state.imageUrl) return state.imageUrl;
	if (state.globalBackgroundEnabled && state.globalBackgroundUrl)
		return state.globalBackgroundUrl;
	return state.imageUrl ?? state.globalBackgroundUrl ?? null;
}

export function resolveThemeColor(
	source: ColorSourceMode,
	manualColor: string,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette,
	role: 'dominant' | 'secondary' | 'accent' | 'backdrop' | 'text' = 'dominant'
): string {
	if (source === 'theme') {
		return resolveThemeColor('background', manualColor, themePalette, themePalette, role);
	}
	if (source === 'background' && !backgroundPalette.sourceUrl) return manualColor;
	if (source === 'manual') return manualColor;
	const palette = backgroundPalette;
	switch (role) {
		case 'text':
			return mixHexColors(palette.dominant, '#ffffff', 0.82);
		case 'secondary':
			return palette.secondary;
		case 'backdrop':
			return palette.backdrop;
		case 'accent':
			return palette.accent;
		case 'dominant':
		default:
			return palette.dominant;
	}
}

export function resolveModeDrivenColors(
	source: ColorSourceMode,
	primaryColor: string,
	secondaryColor: string,
	backgroundPalette: BackgroundPalette,
	themePalette: BackgroundPalette
): {
	primaryColor: string;
	secondaryColor: string;
	rainbowColors: string[];
} {
	if (source === 'theme') {
		return resolveModeDrivenColors(
			'background',
			primaryColor,
			secondaryColor,
			themePalette,
			themePalette
		);
	}
	if (source === 'background' && !backgroundPalette.sourceUrl) {
		return {
			primaryColor,
			secondaryColor,
			rainbowColors: DEFAULT_RAINBOW_PALETTE
		};
	}
	if (source === 'manual') {
		const manualRainbow = [
			primaryColor,
			mixHexColors(primaryColor, secondaryColor, 0.25),
			mixHexColors(primaryColor, secondaryColor, 0.5),
			secondaryColor,
			mixHexColors(secondaryColor, '#ffffff', 0.18),
			mixHexColors(primaryColor, '#ffffff', 0.12)
		];
		return {
			primaryColor,
			secondaryColor,
			rainbowColors: manualRainbow
		};
	}
	return {
		primaryColor: backgroundPalette.dominant,
		secondaryColor: backgroundPalette.secondary,
		rainbowColors: backgroundPalette.rainbow
	};
}

export function samplePaletteColor(colors: string[], t: number): string {
	const palette = colors.length > 0 ? colors : DEFAULT_RAINBOW_PALETTE;
	if (palette.length === 1) return palette[0];
	const clamped = clamp(t, 0, 1) * (palette.length - 1);
	const lowerIndex = Math.floor(clamped);
	const upperIndex = Math.min(palette.length - 1, Math.ceil(clamped));
	if (lowerIndex === upperIndex) return palette[lowerIndex];
	const alpha = clamped - lowerIndex;
	return mixHexColors(palette[lowerIndex], palette[upperIndex], alpha);
}
