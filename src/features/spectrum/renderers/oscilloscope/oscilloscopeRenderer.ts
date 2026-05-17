import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { createWaveGradient } from '@/features/spectrum/color/spectrumColor';
import {
	getShapedRadiusAtAngle,
	getSpectrumRadialAngleRad,
	RADIAL_SHAPE_SAMPLE_PHASE
} from '@/features/spectrum/geometry/radialGeometry';

/**
 * Map the user-facing `spectrumOscilloscopeScrollSpeed` (1..4 integer) to a
 * frame-to-frame lerp factor. Lower speed → smaller alpha → wave updates
 * slowly across frames (smoother visual). Speed 4 = 1.0 → snap, matches the
 * pre-reactivation behavior so anyone who liked the original brusque scope
 * can still get it by maxing the slider.
 */
function getScopeSmoothingAlpha(scrollSpeed: number): number {
	const clamped = Math.max(1, Math.min(4, scrollSpeed));
	return 0.15 + ((clamped - 1) / 3) * 0.85;
}

/**
 * Lerp the live PCM into a persistent runtime buffer so the displayed wave
 * can lag behind the raw signal. Allocates once and resizes on fftSize
 * changes; subsequent frames reuse the same Float32Array.
 */
function getSmoothedTimeDomain(
	runtime: SpectrumRuntimeState,
	live: Uint8Array,
	scrollSpeed: number
): Uint8Array {
	if (live.length === 0) return live;
	let buffer = runtime.oscilloscopeSmoothedSamples;
	if (!buffer || buffer.length !== live.length) {
		buffer = new Float32Array(live.length).fill(128);
		runtime.oscilloscopeSmoothedSamples = buffer;
	}
	const alpha = getScopeSmoothingAlpha(scrollSpeed);
	if (alpha >= 0.999) {
		// Fast path — when smoothing is effectively off, push live values
		// straight in so the buffer stays in sync if the user later lowers
		// the speed mid-playback.
		for (let i = 0; i < live.length; i++) buffer[i] = live[i];
		return live;
	}
	const out = new Uint8Array(live.length);
	for (let i = 0; i < live.length; i++) {
		const blended = buffer[i] + (live[i] - buffer[i]) * alpha;
		buffer[i] = blended;
		out[i] = Math.max(0, Math.min(255, Math.round(blended)));
	}
	return out;
}

/**
 * Draw a real time-domain oscilloscope.
 *
 * `timeDomain` is the raw PCM waveform from AnalyserNode (0–255 with 128 =
 * silence). When empty (paused / remote replica) we render a flat baseline
 * so the visual stays consistent instead of disappearing.
 */
export function drawOscilloscope(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	timeDomain: Uint8Array
): void {
	const isRadial = settings.spectrumMode === 'radial';
	const cx =
		canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const displayedTimeDomain = getSmoothedTimeDomain(
		runtime,
		timeDomain,
		settings.spectrumOscilloscopeScrollSpeed
	);

	// Phosphor afterglow — fade-trail buffer. We render onto an offscreen
	// canvas, blit it back to the main ctx, then darken the offscreen so the
	// old trace fades over the next few frames (CRT-style persistence).
	const usePhosphor = settings.spectrumOscilloscopePhosphor;
	const phosphor = usePhosphor
		? ensurePhosphorCanvas(runtime, canvas.width, canvas.height)
		: null;
	const renderCtx = phosphor ? phosphor.getContext('2d') : null;
	const drawCtx = phosphor && renderCtx ? renderCtx : ctx;

	if (phosphor && renderCtx) {
		// Decay: paint a transparent black over the phosphor at (1 - decay)
		// alpha so previous strokes get darker each frame instead of holding
		// forever. Higher `decay` → quicker fade. Clamped so a misconfigured
		// 0 doesn't freeze the trail on screen forever.
		const decay = Math.max(0.02, Math.min(0.6, settings.spectrumOscilloscopePhosphorDecay));
		renderCtx.save();
		renderCtx.globalCompositeOperation = 'destination-out';
		renderCtx.fillStyle = `rgba(0,0,0,${decay})`;
		renderCtx.fillRect(0, 0, canvas.width, canvas.height);
		renderCtx.restore();
	}

	drawCtx.save();
	drawCtx.lineCap = 'round';
	drawCtx.lineJoin = 'round';

	if (settings.spectrumOscilloscopeGrid) {
		drawScopeGrid(drawCtx, canvas, settings, cx, cy, isRadial);
	}

	if (isRadial) {
		drawRadialTrace(
			drawCtx,
			canvas,
			runtime,
			settings,
			displayedTimeDomain,
			cx,
			cy
		);
	} else {
		drawLinearTrace(drawCtx, canvas, settings, displayedTimeDomain, cx, cy);
	}

	drawCtx.restore();

	if (phosphor) {
		ctx.drawImage(phosphor, 0, 0);
	}
}

function ensurePhosphorCanvas(
	runtime: SpectrumRuntimeState,
	width: number,
	height: number
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null;
	let canvas = runtime.oscilloscopePhosphorCanvas ?? null;
	if (!canvas) {
		canvas = document.createElement('canvas');
		runtime.oscilloscopePhosphorCanvas = canvas;
	}
	if (canvas.width !== width) canvas.width = width;
	if (canvas.height !== height) canvas.height = height;
	return canvas;
}

function getReactiveLineWidth(
	timeDomain: Uint8Array,
	settings: SpectrumSettings
): number {
	const baseLineWidth = settings.spectrumOscilloscopeLineWidth;
	if (!settings.spectrumOscilloscopeReactiveWidth || timeDomain.length === 0) {
		return baseLineWidth;
	}
	let peak = 0;
	for (let i = 0; i < timeDomain.length; i++) {
		const offset = Math.abs((timeDomain[i] ?? 128) - 128);
		if (offset > peak) peak = offset;
	}
	const peakNorm = Math.min(1, peak / 128);
	return baseLineWidth * (1 + peakNorm * 2);
}

function drawLinearTrace(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	timeDomain: Uint8Array,
	cx: number,
	cy: number
): void {
	const w = canvas.width;
	const h = canvas.height;
	const isVertical = settings.spectrumLinearOrientation === 'vertical';
	const span = settings.spectrumSpan ?? 1;
	const maxAmplitude = settings.spectrumMaxHeight;
	const fillOpacity = settings.spectrumWaveFillOpacity;

	const strokeGradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		isVertical ? 'vertical' : 'horizontal'
	);
	ctx.strokeStyle = strokeGradient;
	ctx.lineWidth = getReactiveLineWidth(timeDomain, settings);

	// When no audio is captured (paused/remote replica) draw a flat baseline
	// so the scope keeps a visual presence instead of disappearing.
	const N = timeDomain.length;
	if (N === 0) {
		ctx.beginPath();
		if (isVertical) {
			ctx.moveTo(cx, cy - (h * span) / 2);
			ctx.lineTo(cx, cy + (h * span) / 2);
		} else {
			ctx.moveTo(cx - (w * span) / 2, cy);
			ctx.lineTo(cx + (w * span) / 2, cy);
		}
		ctx.stroke();
		return;
	}

	if (!isVertical) {
		const spanW = w * span;
		const startX = cx - spanW / 2;
		const stepX = spanW / Math.max(N - 1, 1);

		if (fillOpacity > 0.01) {
			ctx.save();
			ctx.globalAlpha *= fillOpacity;
			ctx.fillStyle = strokeGradient;
			ctx.beginPath();
			ctx.moveTo(startX, cy);
			for (let i = 0; i < N; i++) {
				const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
				ctx.lineTo(startX + i * stepX, cy - amp);
			}
			ctx.lineTo(startX + (N - 1) * stepX, cy);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}

		ctx.beginPath();
		for (let i = 0; i < N; i++) {
			const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
			const x = startX + i * stepX;
			const y = cy - amp;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();

		if (settings.spectrumMirror) {
			ctx.beginPath();
			for (let i = 0; i < N; i++) {
				const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
				const x = startX + i * stepX;
				const y = cy + amp;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.stroke();
		}
		return;
	}

	const spanH = h * span;
	const startY = cy - spanH / 2;
	const stepY = spanH / Math.max(N - 1, 1);

	if (fillOpacity > 0.01) {
		ctx.save();
		ctx.globalAlpha *= fillOpacity;
		ctx.fillStyle = strokeGradient;
		ctx.beginPath();
		ctx.moveTo(cx, startY);
		for (let i = 0; i < N; i++) {
			const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
			ctx.lineTo(cx + amp, startY + i * stepY);
		}
		ctx.lineTo(cx, startY + (N - 1) * stepY);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	ctx.beginPath();
	for (let i = 0; i < N; i++) {
		const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
		const x = cx + amp;
		const y = startY + i * stepY;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	if (settings.spectrumMirror) {
		ctx.beginPath();
		for (let i = 0; i < N; i++) {
			const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
			const x = cx - amp;
			const y = startY + i * stepY;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
}

function drawRadialTrace(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	timeDomain: Uint8Array,
	cx: number,
	cy: number
): void {
	const maxAmplitude = settings.spectrumMaxHeight;
	const innerR = settings.spectrumInnerRadius;
	const rotOffset = runtime.rotation;
	const radialAngleRad = getSpectrumRadialAngleRad(settings.spectrumRadialAngle);

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
	ctx.lineWidth = getReactiveLineWidth(timeDomain, settings);

	const N = timeDomain.length;
	if (N === 0) {
		// Draw a base ring at innerR so the user still sees something when
		// audio is paused.
		ctx.beginPath();
		ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
		ctx.stroke();
		return;
	}

	ctx.beginPath();
	for (let i = 0; i < N; i++) {
		const t = i / N;
		const angle = RADIAL_SHAPE_SAMPLE_PHASE + t * Math.PI * 2 + rotOffset;
		const amp = ((timeDomain[i] - 128) / 128) * maxAmplitude;
		const r = getShapedRadiusAtAngle(
			settings.spectrumRadialShape,
			innerR + amp,
			angle,
			radialAngleRad
		);
		const x = cx + Math.cos(angle) * r;
		const y = cy + Math.sin(angle) * r;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.stroke();

	if (settings.spectrumWaveFillOpacity > 0.01) {
		ctx.save();
		ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
		ctx.fillStyle = createWaveGradient(
			ctx,
			canvas,
			settings,
			'radial',
			cx,
			cy,
			innerR + maxAmplitude,
			rotOffset
		);
		ctx.fill();
		ctx.restore();
	}
}

function drawScopeGrid(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	cx: number,
	cy: number,
	isRadial: boolean
): void {
	const divisions = Math.max(
		3,
		Math.min(16, settings.spectrumOscilloscopeGridDivisions)
	);
	ctx.save();
	ctx.strokeStyle = 'rgba(120, 140, 130, 0.18)';
	ctx.lineWidth = 1;

	if (isRadial) {
		const maxR = settings.spectrumInnerRadius + settings.spectrumMaxHeight;
		for (let i = 1; i <= divisions; i++) {
			const r = (i / divisions) * maxR;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.stroke();
		}
		for (let i = 0; i < divisions; i++) {
			const angle = (i / divisions) * Math.PI * 2;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
			ctx.stroke();
		}
		ctx.restore();
		return;
	}

	const w = canvas.width;
	const h = canvas.height;
	const span = settings.spectrumSpan ?? 1;
	const maxAmplitude = settings.spectrumMaxHeight;
	const isVertical = settings.spectrumLinearOrientation === 'vertical';

	if (!isVertical) {
		const spanW = w * span;
		const startX = cx - spanW / 2;
		for (let i = 0; i <= divisions; i++) {
			const x = startX + (i / divisions) * spanW;
			ctx.beginPath();
			ctx.moveTo(x, cy - maxAmplitude);
			ctx.lineTo(x, cy + maxAmplitude);
			ctx.stroke();
		}
		const halfDiv = Math.max(2, Math.round(divisions * 0.5));
		for (let i = -halfDiv; i <= halfDiv; i++) {
			const y = cy + (i / halfDiv) * maxAmplitude;
			ctx.beginPath();
			ctx.moveTo(startX, y);
			ctx.lineTo(startX + spanW, y);
			ctx.stroke();
		}
	} else {
		const spanH = h * span;
		const startY = cy - spanH / 2;
		for (let i = 0; i <= divisions; i++) {
			const y = startY + (i / divisions) * spanH;
			ctx.beginPath();
			ctx.moveTo(cx - maxAmplitude, y);
			ctx.lineTo(cx + maxAmplitude, y);
			ctx.stroke();
		}
		const halfDiv = Math.max(2, Math.round(divisions * 0.5));
		for (let i = -halfDiv; i <= halfDiv; i++) {
			const x = cx + (i / halfDiv) * maxAmplitude;
			ctx.beginPath();
			ctx.moveTo(x, startY);
			ctx.lineTo(x, startY + spanH);
			ctx.stroke();
		}
	}

	ctx.restore();
}
