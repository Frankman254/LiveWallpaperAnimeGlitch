import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { hexToRgb } from '@/features/spectrum/color/spectrumColor';
import { getLinearBase, getLinearMetrics, resolveLinearDirection } from '@/features/spectrum/renderers/linear/linearRenderer';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Ensure the offscreen spectrogram canvas matches the target strip size.
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
 * Draw a scrolling spectrogram strip aligned to linear spectrum placement.
 * This keeps "Gram" consistent with edge-aligned linear layouts.
 */
export function drawSpectrogram(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	bins: Uint8Array,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const decay = clamp(settings.spectrumSpectrogramDecay, 0.5, 1);
	const [arR, arG, arB] = hexToRgb(settings.spectrumPrimaryColor) ?? [0, 255, 255];
	const [brR, brG, brB] = hexToRgb(settings.spectrumSecondaryColor) ?? [255, 0, 255];
	const colorA = { r: arR, g: arG, b: arB };
	const colorB = { r: brR, g: brG, b: brB };
	const barCount = Math.max(16, settings.spectrumBarCount);
	const orientation = settings.spectrumLinearOrientation;
	const direction = resolveLinearDirection(
		orientation,
		settings.spectrumLinearDirection
	);
	const { baseX, baseY } = getLinearBase(canvas, settings);
	const { totalLength } = getLinearMetrics(canvas, settings, barCount);
	const stripDepth = clamp(
		Math.round(settings.spectrumMaxHeight * 0.28),
		24,
		Math.round(
			Math.min(canvas.width, canvas.height) *
				(orientation === 'vertical' ? 0.32 : 0.22)
		)
	);

	const stripWidth = Math.max(
		1,
		Math.round(orientation === 'vertical' ? stripDepth : totalLength)
	);
	const stripHeight = Math.max(
		1,
		Math.round(orientation === 'vertical' ? totalLength : stripDepth)
	);

	let stripX = 0;
	let stripY = 0;
	if (orientation === 'horizontal') {
		stripX = Math.round((canvas.width - totalLength) / 2);
		stripY = Math.round(direction < 0 ? baseY - stripDepth : baseY);
	} else {
		stripX = Math.round(direction < 0 ? baseX - stripDepth : baseX);
		stripY = Math.round((canvas.height - totalLength) / 2);
	}

	stripX = Math.round(clamp(stripX, 0, canvas.width - stripWidth));
	stripY = Math.round(clamp(stripY, 0, canvas.height - stripHeight));

	const sg = ensureSpectrogramCanvas(runtime, stripWidth, stripHeight);
	if (!sg) return;

	const { canvas: sgCanvas, ctx: sgCtx } = sg;
	const rowLength = orientation === 'horizontal' ? stripWidth : stripHeight;
	const scrollPositive = direction > 0;

	if (orientation === 'horizontal') {
		if (scrollPositive) {
			sgCtx.drawImage(sgCanvas, 0, 0, stripWidth, stripHeight - 1, 0, 1, stripWidth, stripHeight - 1);
		} else {
			sgCtx.drawImage(sgCanvas, 0, 1, stripWidth, stripHeight - 1, 0, 0, stripWidth, stripHeight - 1);
		}
	} else if (scrollPositive) {
		sgCtx.drawImage(sgCanvas, 0, 0, stripWidth - 1, stripHeight, 1, 0, stripWidth - 1, stripHeight);
	} else {
		sgCtx.drawImage(sgCanvas, 1, 0, stripWidth - 1, stripHeight, 0, 0, stripWidth - 1, stripHeight);
	}

	// Draw new frequency row/column on the edge touching the base.
	const rowData = sgCtx.createImageData(rowLength, 1);
	const rowPixels = rowData.data;
	const binCount = bins.length;

	for (let px = 0; px < rowLength; px++) {
		const binIdx = Math.floor((px / rowLength) * binCount);
		const rawVal = (bins[binIdx] ?? 0) / 255;
		const boosted = Math.pow(rawVal, 1 - decay * 0.5); // decay brightens

		// Blend between background (black) and colorA→colorB
		let r: number, g: number, b: number;
		if (settings.spectrumColorMode === 'rainbow') {
			const hue = (px / rowLength) * 360;
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

	if (orientation === 'horizontal') {
		sgCtx.putImageData(rowData, 0, scrollPositive ? 0 : stripHeight - 1);
	} else {
		sgCtx.save();
		sgCtx.translate(scrollPositive ? 0 : stripWidth - 1, 0);
		sgCtx.rotate(scrollPositive ? Math.PI / 2 : -Math.PI / 2);
		sgCtx.putImageData(rowData, 0, 0);
		sgCtx.restore();
	}

	ctx.drawImage(sgCanvas, stripX, stripY, stripWidth, stripHeight);
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
