import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { hexToRgb } from '@/features/spectrum/color/spectrumColor';

/**
 * Ensure the offscreen spectrogram canvas matches the target size.
 */
function ensureSpectrogramCanvas(
	runtime: SpectrumRuntimeState,
	width: number,
	height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
	if (typeof document === 'undefined') return null;

	const existing = runtime.spectrogramCanvas;
	if (!existing || existing.width !== width || existing.height !== height) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		runtime.spectrogramCanvas = canvas;
		runtime.spectrogramCtx = ctx;
	}

	const ctx = runtime.spectrogramCtx;
	if (!ctx) return null;
	return { canvas: runtime.spectrogramCanvas!, ctx };
}

/**
 * Draw a scrolling spectrogram (waterfall) visualization.
 * Each frame the image shifts down and a new frequency row is painted at the top.
 * `spectrumSpectrogramDecay` controls color intensity (higher = brighter longer).
 */
export function drawSpectrogram(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	bins: Uint8Array,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const w = canvas.width;
	const h = canvas.height;
	const decay = settings.spectrumSpectrogramDecay; // 0..1
	const [arR, arG, arB] = hexToRgb(settings.spectrumPrimaryColor) ?? [0, 255, 255];
	const [brR, brG, brB] = hexToRgb(settings.spectrumSecondaryColor) ?? [255, 0, 255];
	const colorA = { r: arR, g: arG, b: arB };
	const colorB = { r: brR, g: brG, b: brB };

	const sg = ensureSpectrogramCanvas(runtime, w, h);
	if (!sg) return;

	const { canvas: sgCanvas, ctx: sgCtx } = sg;

	// Shift existing image down by 1 pixel
	sgCtx.drawImage(sgCanvas, 0, 1, w, h - 1);

	// Draw new frequency row at the top
	const rowData = sgCtx.createImageData(w, 1);
	const rowPixels = rowData.data;
	const binCount = bins.length;

	for (let px = 0; px < w; px++) {
		// Map pixel x to bin index
		const binIdx = Math.floor((px / w) * binCount);
		const rawVal = (bins[binIdx] ?? 0) / 255;
		const boosted = Math.pow(rawVal, 1 - decay * 0.5); // decay brightens

		// Blend between background (black) and colorA→colorB
		let r: number, g: number, b: number;
		if (settings.spectrumColorMode === 'rainbow') {
			const hue = (px / w) * 360;
			const rgb = hslToRgb(hue, 1, 0.5 * boosted);
			r = rgb.r;
			g = rgb.g;
			b = rgb.b;
		} else if (settings.spectrumColorMode === 'solid') {
			r = Math.round(colorA.r * boosted);
			g = Math.round(colorA.g * boosted);
			b = Math.round(colorA.b * boosted);
		} else {
			// gradient: blend colorA → colorB based on bin energy
			r = Math.round((colorA.r * (1 - rawVal) + colorB.r * rawVal) * boosted);
			g = Math.round((colorA.g * (1 - rawVal) + colorB.g * rawVal) * boosted);
			b = Math.round((colorA.b * (1 - rawVal) + colorB.b * rawVal) * boosted);
		}

		const alpha = Math.round(boosted * 255 * settings.spectrumOpacity);
		const offset = px * 4;
		rowPixels[offset] = r;
		rowPixels[offset + 1] = g;
		rowPixels[offset + 2] = b;
		rowPixels[offset + 3] = alpha;
	}

	sgCtx.putImageData(rowData, 0, 0);

	// Blit the offscreen spectrogram onto the main canvas
	ctx.drawImage(sgCanvas, 0, 0, w, h);
}

function hslToRgb(
	h: number,
	s: number,
	l: number
): { r: number; g: number; b: number } {
	h = h % 360;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0, g = 0, b = 0;
	if (h < 60) { r = c; g = x; }
	else if (h < 120) { r = x; g = c; }
	else if (h < 180) { g = c; b = x; }
	else if (h < 240) { g = x; b = c; }
	else if (h < 300) { r = x; b = c; }
	else { r = c; b = x; }
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255)
	};
}
