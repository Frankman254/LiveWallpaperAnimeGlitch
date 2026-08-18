/**
 * Small hex/HSL helpers for intent work. Deliberately local to the AI Director:
 * the rest of the app stores colours as opaque strings and has no need for
 * colour maths, and a shared utility would invite drift in the notation the
 * slot comparison depends on. Everything here round-trips `#rrggbb`.
 */

export type Hsl = { h: number; s: number; l: number };

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const raw = hex.replace(/^#/, '');
	const full =
		raw.length === 3
			? raw
					.split('')
					.map(c => c + c)
					.join('')
			: raw.padEnd(6, '0').slice(0, 6);
	return {
		r: parseInt(full.slice(0, 2), 16) || 0,
		g: parseInt(full.slice(2, 4), 16) || 0,
		b: parseInt(full.slice(4, 6), 16) || 0
	};
}

export function rgbToHex(r: number, g: number, b: number): string {
	const part = (v: number) =>
		Math.max(0, Math.min(255, Math.round(v)))
			.toString(16)
			.padStart(2, '0');
	return `#${part(r)}${part(g)}${part(b)}`;
}

export function hexToHsl(hex: string): Hsl {
	const { r, g, b } = hexToRgb(hex);
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const delta = max - min;
	const l = (max + min) / 2;

	if (delta === 0) return { h: 0, s: 0, l };

	const s = delta / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === rn) h = ((gn - bn) / delta) % 6;
	else if (max === gn) h = (bn - rn) / delta + 2;
	else h = (rn - gn) / delta + 4;
	h = h * 60;
	if (h < 0) h += 360;
	return { h, s: Math.max(0, Math.min(1, s)), l };
}

export function hslToHex({ h, s, l }: Hsl): string {
	const hue = ((h % 360) + 360) % 360;
	const sat = Math.max(0, Math.min(1, s));
	const lum = Math.max(0, Math.min(1, l));
	const c = (1 - Math.abs(2 * lum - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = lum - c / 2;
	let rgb: [number, number, number];
	if (hue < 60) rgb = [c, x, 0];
	else if (hue < 120) rgb = [x, c, 0];
	else if (hue < 180) rgb = [0, c, x];
	else if (hue < 240) rgb = [0, x, c];
	else if (hue < 300) rgb = [x, 0, c];
	else rgb = [c, 0, x];
	return rgbToHex((rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255);
}

/** Shortest angular distance between two hues, 0..180. */
export function hueDistance(a: number, b: number): number {
	const diff = Math.abs(((a - b) % 360) + 360) % 360;
	return diff > 180 ? 360 - diff : diff;
}

/** Rotate a colour's hue, keeping saturation and lightness. */
export function rotateHue(hex: string, degrees: number): string {
	const hsl = hexToHsl(hex);
	return hslToHex({ ...hsl, h: hsl.h + degrees });
}

/**
 * Force a colour into a band where it actually reads on screen.
 *
 * A spectrum tinted with an image's own near-black or washed-out colours is
 * invisible against that same image — the most common way an
 * "image-derived palette" ends up looking broken. Clamping lightness and
 * lifting flat greys costs nothing and makes derived palettes safe by default.
 */
export function makeReadable(
	hex: string,
	options: {
		minLightness?: number;
		maxLightness?: number;
		minSaturation?: number;
	} = {}
): string {
	const {
		minLightness = 0.45,
		maxLightness = 0.7,
		minSaturation = 0.45
	} = options;
	const hsl = hexToHsl(hex);
	return hslToHex({
		h: hsl.h,
		s: Math.max(minSaturation, hsl.s),
		l: Math.max(minLightness, Math.min(maxLightness, hsl.l))
	});
}
