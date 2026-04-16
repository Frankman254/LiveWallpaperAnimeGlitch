import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import {
	createWaveGradient,
	getColor
} from '@/features/spectrum/color/spectrumColor';

const OSCILLOSCOPE_HISTORY_SIZE = 512;

function ensureOscilloscopeHistory(runtime: SpectrumRuntimeState): Float32Array {
	if (
		!runtime.oscilloscopeHistory ||
		runtime.oscilloscopeHistory.length !== OSCILLOSCOPE_HISTORY_SIZE
	) {
		runtime.oscilloscopeHistory = new Float32Array(OSCILLOSCOPE_HISTORY_SIZE);
		runtime.oscilloscopeWriteIndex = 0;
	}
	return runtime.oscilloscopeHistory;
}

/**
 * Push a new amplitude sample into the circular history buffer.
 */
export function pushOscilloscopeSample(
	runtime: SpectrumRuntimeState,
	amplitude: number
): void {
	const history = ensureOscilloscopeHistory(runtime);
	const idx = (runtime.oscilloscopeWriteIndex ?? 0) % OSCILLOSCOPE_HISTORY_SIZE;
	history[idx] = amplitude;
	runtime.oscilloscopeWriteIndex = idx + 1;
}

/**
 * Draw a waveform oscilloscope.
 * - Radial mode: maps frequency pixelHeights around a circle (frequency-domain ring).
 * - Linear mode: scrolling amplitude history (time-domain scroll).
 */
export function drawOscilloscope(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const lineWidth = settings.spectrumOscilloscopeLineWidth;
	const isRadial = settings.spectrumMode === 'radial';
	const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const maxAmplitude = settings.spectrumMaxHeight;
	const innerR = settings.spectrumInnerRadius;

	ctx.save();
	ctx.lineWidth = lineWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';

	if (isRadial) {
		// Use pixelHeights (frequency domain) as angular samples
		const barCount = runtime.pixelHeights.length;
		const freqSamples: number[] = new Array(barCount);
		for (let i = 0; i < barCount; i++) {
			freqSamples[i] = ((runtime.pixelHeights[i] ?? 0) / Math.max(maxAmplitude, 1)) * 255;
		}
		_drawRadialOscilloscope(
			ctx,
			canvas,
			cx,
			cy,
			innerR,
			maxAmplitude,
			freqSamples,
			settings,
			runtime
		);
	} else {
		// Use scrolling amplitude history (time domain)
		const history = ensureOscilloscopeHistory(runtime);
		const writeIdx = runtime.oscilloscopeWriteIndex ?? 0;
		const N = OSCILLOSCOPE_HISTORY_SIZE;
		const samples: number[] = new Array(N);
		for (let i = 0; i < N; i++) {
			const readIdx = (writeIdx + i) % N;
			samples[i] = history[readIdx] ?? 0;
		}
		_drawLinearOscilloscope(
			ctx,
			canvas,
			maxAmplitude,
			samples,
			settings,
			runtime
		);
	}

	ctx.restore();
}

function _drawRadialOscilloscope(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	cx: number,
	cy: number,
	innerR: number,
	maxAmplitude: number,
	samples: number[],
	settings: SpectrumSettings,
	runtime: SpectrumRuntimeState
): void {
	const N = samples.length;
	const rotOffset = runtime.rotation;
	ctx.strokeStyle = createWaveGradient(
		ctx,
		canvas,
		settings,
		'radial',
		cx,
		cy,
		innerR + maxAmplitude,
		rotOffset
	);

	ctx.beginPath();
	for (let i = 0; i < N; i++) {
		const t = i / N;
		const angle = t * Math.PI * 2 + rotOffset;
		const amp = samples[i] * (maxAmplitude / 255);
		const r = innerR + amp;
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.stroke();

	// Fill if wave fill opacity > 0
	if (settings.spectrumWaveFillOpacity > 0.01) {
		ctx.save();
		ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
		ctx.fillStyle = getColor(
			settings,
			rotOffset / (Math.PI * 2) + 0.08
		);
		ctx.fill();
		ctx.restore();
	}
}

function _drawLinearOscilloscope(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	maxAmplitude: number,
	samples: number[],
	settings: SpectrumSettings,
	_runtime: SpectrumRuntimeState
): void {
	const N = samples.length;
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const w = canvas.width;
	const h = canvas.height;
	const span = settings.spectrumSpan ?? 1;

	const posNormX = settings.spectrumPositionX ?? 0;
	const posNormY = settings.spectrumPositionY ?? 0;
	ctx.strokeStyle = createWaveGradient(
		ctx,
		canvas,
		settings,
		isVertical ? 'vertical' : 'horizontal'
	);

	const centerX = w / 2 + posNormX * w * 0.5;
	const centerY = h / 2 - posNormY * h * 0.5;

	if (!isVertical) {
		const spanW = w * span;
		const startX = centerX - spanW / 2;
		const stepX = spanW / N;
		ctx.beginPath();
		for (let i = 0; i < N; i++) {
			const amp = (samples[i] / 255) * (maxAmplitude / h) * h;
			const x = startX + i * stepX;
			const y = centerY - amp;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		if (settings.spectrumMirror) {
			ctx.beginPath();
			for (let i = 0; i < N; i++) {
				const amp = (samples[i] / 255) * (maxAmplitude / h) * h;
				const x = startX + i * stepX;
				const y = centerY + amp;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
	} else {
		const spanH = h * span;
		const startY = centerY - spanH / 2;
		const stepY = spanH / N;
		ctx.beginPath();
		for (let i = 0; i < N; i++) {
			const amp = (samples[i] / 255) * (maxAmplitude / w) * w;
			const x = centerX + amp;
			const y = startY + i * stepY;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		if (settings.spectrumMirror) {
			ctx.beginPath();
			for (let i = 0; i < N; i++) {
				const amp = (samples[i] / 255) * (maxAmplitude / w) * w;
				const x = centerX - amp;
				const y = startY + i * stepY;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
	}
}
