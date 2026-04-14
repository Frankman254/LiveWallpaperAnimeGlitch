import { samplePaletteColor } from '@/lib/backgroundPalette';
import type { SpectrumLinearOrientation } from '@/types/wallpaper';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

export function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16)
	];
}

export function mixHexColors(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(
		g1 + (g2 - g1) * t
	)}, ${Math.round(b1 + (b2 - b1) * t)})`;
}

export function sampleWrappedPaletteColor(colors: string[], t: number): string {
	const palette =
		colors.length > 0
			? colors
			: ['#ff004c', '#ff7a00', '#ffe600', '#2cff95', '#00d4ff', '#5566ff'];
	if (palette.length === 1) return palette[0];
	const wrapped = ((t % 1) + 1) % 1;
	const scaled = wrapped * palette.length;
	const lowerIndex = Math.floor(scaled) % palette.length;
	const upperIndex = (lowerIndex + 1) % palette.length;
	const alpha = scaled - Math.floor(scaled);
	return mixHexColors(palette[lowerIndex], palette[upperIndex], alpha);
}

export function visibleSpectrumColor(t: number): string {
	const wrapped = ((t % 1) + 1) % 1;
	const h = wrapped * 360;
	return `hsl(${h} 100% 58%)`;
}

export function getRotateRgbPhase(): number {
	if (typeof performance === 'undefined') return 0;
	return (performance.now() / 4800) % 1;
}

export function getLoopGradientColor(
	primaryColor: string,
	secondaryColor: string,
	t: number
): string {
	const wrapped = ((t % 1) + 1) % 1;
	const mirroredT =
		wrapped <= 0.5 ? wrapped * 2 : 1 - (wrapped - 0.5) * 2;
	const [r1, g1, b1] = hexToRgb(primaryColor);
	const [r2, g2, b2] = hexToRgb(secondaryColor);
	return `rgb(${Math.round(r1 + (r2 - r1) * mirroredT)}, ${Math.round(g1 + (g2 - g1) * mirroredT)}, ${Math.round(b1 + (b2 - b1) * mirroredT)})`;
}

export function getColor(settings: SpectrumSettings, t: number): string {
	const { spectrumColorMode, spectrumPrimaryColor, spectrumSecondaryColor } =
		settings;
	if (spectrumColorMode === 'solid') return spectrumPrimaryColor;
	if (spectrumColorMode === 'visible-rotate') {
		const palette = settings.spectrumRainbowColors ?? [];
		return palette.length > 0
			? sampleWrappedPaletteColor(palette, t + getRotateRgbPhase())
			: visibleSpectrumColor(t + getRotateRgbPhase());
	}
	if (spectrumColorMode === 'rainbow') {
		return settings.spectrumMode === 'radial'
			? sampleWrappedPaletteColor(settings.spectrumRainbowColors ?? [], t)
			: samplePaletteColor(settings.spectrumRainbowColors ?? [], t);
	}
	if (settings.spectrumMode === 'radial') {
		return getLoopGradientColor(
			spectrumPrimaryColor,
			spectrumSecondaryColor,
			t
		);
	}
	const [r1, g1, b1] = hexToRgb(spectrumPrimaryColor);
	const [r2, g2, b2] = hexToRgb(spectrumSecondaryColor);
	return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)})`;
}

export function addGradientStops(
	gradient: CanvasGradient,
	settings: SpectrumSettings
): void {
	if (settings.spectrumColorMode === 'solid') {
		gradient.addColorStop(0, settings.spectrumPrimaryColor);
		gradient.addColorStop(1, settings.spectrumPrimaryColor);
		return;
	}

	if (settings.spectrumColorMode === 'gradient') {
		gradient.addColorStop(0, settings.spectrumPrimaryColor);
		gradient.addColorStop(1, settings.spectrumSecondaryColor);
		return;
	}
	if (settings.spectrumColorMode === 'visible-rotate') {
		const phase = getRotateRgbPhase();
		const palette = settings.spectrumRainbowColors ?? [];
		for (let index = 0; index <= 6; index += 1) {
			const stop = index / 6;
			gradient.addColorStop(
				stop,
				palette.length > 0
					? sampleWrappedPaletteColor(palette, stop + phase)
					: visibleSpectrumColor(stop + phase)
			);
		}
		return;
	}

	const rainbowColors =
		settings.spectrumRainbowColors && settings.spectrumRainbowColors.length > 0
			? settings.spectrumRainbowColors
			: ['#ff004c', '#ff7a00', '#ffe600', '#2cff95', '#00d4ff', '#5566ff'];
	const rainbowStops = rainbowColors.map((color, index) => [
		rainbowColors.length === 1
			? 1
			: index / Math.max(rainbowColors.length - 1, 1),
		color
	] as const);
	for (const [stop, color] of rainbowStops) {
		gradient.addColorStop(stop, color);
	}
}

export function addRadialLoopGradientStops(
	gradient: CanvasGradient,
	settings: SpectrumSettings
): void {
	if (settings.spectrumColorMode === 'solid') {
		gradient.addColorStop(0, settings.spectrumPrimaryColor);
		gradient.addColorStop(1, settings.spectrumPrimaryColor);
		return;
	}

	if (settings.spectrumColorMode === 'gradient') {
		gradient.addColorStop(0, settings.spectrumPrimaryColor);
		gradient.addColorStop(0.5, settings.spectrumSecondaryColor);
		gradient.addColorStop(1, settings.spectrumPrimaryColor);
		return;
	}
	if (settings.spectrumColorMode === 'visible-rotate') {
		const phase = getRotateRgbPhase();
		const palette = settings.spectrumRainbowColors ?? [];
		for (let index = 0; index <= 6; index += 1) {
			const stop = index / 6;
			gradient.addColorStop(
				stop,
				palette.length > 0
					? sampleWrappedPaletteColor(palette, stop + phase)
					: visibleSpectrumColor(stop + phase)
			);
		}
		return;
	}

	const rainbowColors =
		settings.spectrumRainbowColors && settings.spectrumRainbowColors.length > 0
			? settings.spectrumRainbowColors
			: ['#ff004c', '#ff7a00', '#ffe600', '#2cff95', '#00d4ff', '#5566ff'];
	for (let index = 0; index < rainbowColors.length; index += 1) {
		gradient.addColorStop(index / rainbowColors.length, rainbowColors[index]);
	}
	gradient.addColorStop(1, rainbowColors[0]);
}

export function createWaveGradient(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	orientation: SpectrumLinearOrientation | 'radial',
	cx = canvas.width / 2,
	cy = canvas.height / 2,
	radius = Math.max(canvas.width, canvas.height) * 0.5,
	angleOffset = 0
): CanvasGradient | string {
	if (settings.spectrumColorMode === 'solid')
		return settings.spectrumPrimaryColor;

	if (orientation === 'vertical') {
		const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
		addGradientStops(gradient, settings);
		return gradient;
	}

	if (orientation === 'radial') {
		if (typeof ctx.createConicGradient === 'function') {
			const gradient = ctx.createConicGradient(
				angleOffset - Math.PI / 2,
				cx,
				cy
			);
			addRadialLoopGradientStops(gradient, settings);
			return gradient;
		}

		const gradient = ctx.createRadialGradient(
			cx,
			cy,
			Math.max(4, radius * 0.25),
			cx,
			cy,
			radius
		);
		addRadialLoopGradientStops(gradient, settings);
		return gradient;
	}

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
	addGradientStops(gradient, settings);
	return gradient;
}
