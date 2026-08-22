import { getColor, createWaveGradient } from '../../color/spectrumColor';
import {
	createGlowGradient,
	glowUsesColorSweep,
	resolveManualGlow
} from '../../effects/manualGlow';
import { drawLinearRgbSplitPass } from '../../effects/rgbSplitPass';
import {
	drawNeonCorePass,
	resolveNeonCoreStrokeStyle
} from '../../effects/neonCorePass';
import { resolveGradientFlowPhase } from '../../effects/gradientFlow';
import { drawPeakSparksPass } from '../../effects/peakSparksPass';
import {
	drawEchoTracePasses,
	updateEchoTraceHistory
} from '../../effects/echoTrace';
import type {
	SpectrumLinearDirection,
	SpectrumLinearOrientation
} from '@/types/wallpaper';
import type {
	SpectrumRuntimeState,
	SpectrumSettings
} from '../../runtime/spectrumRuntime';

export {
	resolveManualGlow,
	type ResolvedManualGlow
} from '../../effects/manualGlow';

export type LinearWaveFrameContext = {
	runtime?: SpectrumRuntimeState;
	audioEnergy?: number;
	dt?: number;
};

/**
 * Shared glow-blur cap.
 *
 * Without this, `shadowBlur (max 60) × glowIntensity (max 3) = 180 px` blur
 * fires on every fillRect / arc, which torches FPS on any non-trivial bar
 * count. `drawLinearBlocks` already had its own cap with a bar-count-aware
 * floor; this helper lifts the pattern so bars / dots / wave behave the
 * same. The defaults (40 / 24) match the upper bound users actually hit in
 * practice — anything past that is purely a cost without visual gain.
 */
export function computeClassicGlowBlur(
	settings: SpectrumSettings,
	barCount: number,
	options: { lowDensityCap?: number; highDensityCap?: number } = {}
): number {
	const requested =
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings);
	const highCap = options.highDensityCap ?? 24;
	const lowCap = options.lowDensityCap ?? 40;
	const cap = barCount > 160 ? highCap : lowCap;
	return Math.min(requested, cap * resolveGlowPerfScale(settings));
}

/**
 * Performance-mode blur ceiling, shared by every family.
 *
 * Canvas2D `shadowBlur` cost grows roughly with the blur radius squared, so
 * shrinking the cap on medium/low modes is the single cheapest spectrum win —
 * and the doubled main+clone pass feels it twice. `high` is left untouched so
 * quality is identical there. Classic was the only family applying it; the
 * others capped a raw number, which made the same preset cost far more on a
 * weak machine when the family happened to be liquid / tunnel / orbital.
 */
export function resolveGlowPerfScale(settings: SpectrumSettings): number {
	return settings.performanceMode === 'low'
		? 0.5
		: settings.performanceMode === 'medium'
			? 0.7
			: 1;
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/**
 * How many distinct glow colours a figure samples across the spectrum.
 *
 * Canvas2D shadows take a single flat colour per draw call, so a glow that
 * sweeps needs one blurred fill per distinct colour. Sampling the sweep at this
 * resolution caps that count regardless of bar count, while staying fine enough
 * that the (already blurred) glow reads as continuous.
 */
export const GLOW_COLOR_STEPS = 16;

/**
 * Snaps a bar's position to the glow colour grid so neighbouring bars resolve to
 * the same halo colour and can share one blurred fill.
 *
 * Only the glow is quantized — the crisp fill keeps its exact per-bar colour.
 * Stepping a colour that is about to be blurred by tens of pixels is far less
 * visible than stepping the fill, and it is what turns a sweeping glow from 96
 * blurred fills into at most `GLOW_COLOR_STEPS`.
 */
export function quantizeGlowPhase(t: number): number {
	const steps = GLOW_COLOR_STEPS - 1;
	return Math.round(t * steps) / steps;
}

export function resolveGlowReach(settings: SpectrumSettings): number {
	return Math.max(1, Math.min(3, settings.spectrumGlowReach ?? 1));
}

export type ClassicGlowHaloOptions = {
	blurMultiplier?: number;
	alphaBoost?: number;
	expansionMultiplier?: number;
	/**
	 * Core-pass blur this halo should sit around. Families with their own
	 * density model (liquid layers, scope traces) pass theirs so the halo
	 * stays proportional to what they actually draw; classic omits it and
	 * gets the bar-count cap.
	 */
	baseBlur?: number;
	/**
	 * Multiplier applied AFTER the halo alpha is resolved. Callers that draw
	 * inside an already-faded element (a liquid layer at 20% opacity) pass
	 * that opacity so the halo can never end up brighter than the thing it
	 * is supposed to be glowing around. Defaults to 1 (classic behaviour).
	 */
	alphaScale?: number;
	/**
	 * Paint style for the halo when the glow sweeps colors (gradient /
	 * rainbow / rotate). A CanvasGradient cannot be used as `shadowColor`
	 * — canvas shadows are single-color — so when one is passed the halo
	 * switches to a `filter: blur()` pass over the gradient itself, which
	 * is what makes the bloom carry the sweep instead of one flat tone.
	 */
	sweepStyle?: CanvasGradient | string | null;
};

export type ClassicGlowHaloParams = {
	/** Core-pass blur. Also the return value callers use for their own pass. */
	glowBlur: number;
	haloAlpha: number;
	expansion: number;
	haloBlur: number;
	/** False when the halo would be invisible and every pass can be skipped. */
	visible: boolean;
};

/**
 * The halo geometry/alpha recipe, with no canvas state touched.
 *
 * Shared by the one-shot `drawClassicGlowHaloPass` (wave, liquid layers, scope
 * traces) and by `createClassicGlowHaloRuns` (the bar shapes, which batch many
 * bars into one blurred fill). Keeping it in one place is what stops the two
 * from drifting into visibly different halos for the same slider values.
 */
export function resolveClassicGlowHaloParams(
	settings: SpectrumSettings,
	barCount: number,
	options: ClassicGlowHaloOptions = {}
): ClassicGlowHaloParams {
	const glowBlur =
		options.baseBlur ?? computeClassicGlowBlur(settings, barCount);
	if (glowBlur <= 0.001 || settings.spectrumGlowIntensity <= 0.001) {
		return {
			glowBlur,
			haloAlpha: 0,
			expansion: 0,
			haloBlur: 0,
			visible: false
		};
	}

	const glowT = clamp01(settings.spectrumGlowIntensity / 3);
	const glowReach = resolveGlowReach(settings);
	const haloAlpha = Math.min(
		0.95,
		(options.alphaBoost ?? 0.16) + glowT * 0.34 + (glowReach - 1) * 0.08
	);
	const expansion =
		(0.8 + glowBlur * 0.06 + settings.spectrumGlowIntensity * 0.9) *
		(0.72 + glowReach * 0.56) *
		(options.expansionMultiplier ?? 1);
	const haloBlur = Math.max(
		glowBlur * (options.blurMultiplier ?? 1.65) * (0.85 + glowReach * 0.3),
		glowBlur + 6
	);

	return { glowBlur, haloAlpha, expansion, haloBlur, visible: true };
}

export function drawClassicGlowHaloPass(
	ctx: CanvasRenderingContext2D,
	color: string,
	settings: SpectrumSettings,
	barCount: number,
	draw: (expansion: number) => void,
	options: ClassicGlowHaloOptions = {}
): number {
	const { glowBlur, haloAlpha, expansion, haloBlur, visible } =
		resolveClassicGlowHaloParams(settings, barCount, options);
	if (!visible) {
		return glowBlur;
	}

	const sweep = options.sweepStyle ?? null;
	const usesSweep = typeof sweep === 'object' && sweep !== null;

	ctx.save();
	ctx.fillStyle = usesSweep ? sweep : color;
	ctx.strokeStyle = usesSweep ? sweep : color;
	if (usesSweep) {
		// Blur the gradient itself — a shadow would flatten it to one color.
		ctx.filter = `blur(${(haloBlur * 0.5).toFixed(1)}px)`;
		ctx.shadowBlur = 0;
		ctx.shadowColor = 'rgba(0,0,0,0)';
	} else {
		ctx.shadowColor = color;
		ctx.shadowBlur = haloBlur;
	}
	ctx.globalAlpha =
		Math.max(ctx.globalAlpha, haloAlpha) * (options.alphaScale ?? 1);
	draw(expansion);
	ctx.restore();

	return glowBlur;
}

export type ClassicGlowHaloRuns = {
	/** Halo expansion in px — the same value the one-shot pass hands its callback. */
	expansion: number;
	/** Core-pass blur, for the caller's own (unbatched) core loop. */
	glowBlur: number;
	/** Queues one bar's halo shape under `haloColor`. */
	add(haloColor: string, addPath: (expansion: number) => void): void;
	/** Paints whatever run is still open. Must be called after the loop. */
	flush(): void;
};

/**
 * Batches the halos of a whole bar figure into one blurred fill per colour run.
 *
 * Canvas2D re-runs the (very expensive) blur on every fill under a shadow, so
 * calling `drawClassicGlowHaloPass` inside the bar loop costs one blur per bar:
 * 96 bars is 96 blurs per instance per frame, and that doubles exactly when the
 * user turns on the second spectrum. Measured on the real draw pattern, two
 * maxed instances went from ~52ms to ~14ms per frame by collapsing these.
 *
 * Same `flushRun` shape `drawLinearPixel` already uses: consecutive bars that
 * resolve to the same halo colour accumulate into one path and are filled once.
 * In `solid` that is a single blurred fill for the entire spectrum; in the
 * sweeping colour modes the caller quantizes the colour with
 * `quantizeGlowPhase` so neighbouring bars still merge — never worse than the
 * per-bar behaviour it replaces.
 *
 * Callers run this as its own pass BEFORE their core loop, so every halo sits
 * behind every core. That is what wave, liquid and pixel already do; the bar
 * shapes were the odd ones out, interleaving halo/core per bar.
 */
export function createClassicGlowHaloRuns(
	ctx: CanvasRenderingContext2D,
	settings: SpectrumSettings,
	barCount: number,
	options: ClassicGlowHaloOptions = {}
): ClassicGlowHaloRuns {
	const { glowBlur, haloAlpha, expansion, haloBlur, visible } =
		resolveClassicGlowHaloParams(settings, barCount, options);
	const alphaScale = options.alphaScale ?? 1;

	let runColor: string | null = null;
	let runOpen = false;

	const flush = () => {
		if (!runOpen) return;
		runOpen = false;
		ctx.save();
		ctx.fillStyle = runColor as string;
		ctx.shadowColor = runColor as string;
		ctx.shadowBlur = haloBlur;
		ctx.globalAlpha = Math.max(ctx.globalAlpha, haloAlpha) * alphaScale;
		ctx.fill();
		ctx.restore();
	};

	if (!visible) {
		// Nothing to paint: keep the shape of the API so callers stay branchless.
		return { expansion: 0, glowBlur, add: () => {}, flush: () => {} };
	}

	return {
		expansion,
		glowBlur,
		add(haloColor, addPath) {
			if (!runOpen || haloColor !== runColor) {
				flush();
				ctx.beginPath();
				runColor = haloColor;
				runOpen = true;
			}
			addPath(expansion);
		},
		flush
	};
}

/**
 * Batches the CORE glow of a bar figure into one blurred fill per colour run.
 *
 * The halo pass was collapsed into colour runs, but the cores kept one blurred
 * `fillRect` per bar — and Canvas2D re-runs the blur on every shadowed draw, so
 * a horizontal `bars` spectrum at 120 bars paid 120 blurs per instance per
 * frame. That is what dropped the app under 30fps with a high bar count (worse
 * with manual glow on, which adds up to `GLOW_COLOR_STEPS` sweeping halos on
 * top).
 *
 * The split: the shadow only ever needs the QUANTIZED colour (it is about to be
 * blurred by tens of pixels), so it batches exactly like the halo; the crisp
 * fill then paints on top per bar with `shadowBlur = 0`, keeping every bar's
 * exact colour. Cores also end up uniformly behind every fill instead of a
 * neighbour's shadow darkening the bar drawn before it.
 */
export function createClassicCoreGlowRuns(
	ctx: CanvasRenderingContext2D,
	glowBlur: number
): {
	add(glowColor: string, addPath: () => void): void;
	flush(): void;
} {
	if (glowBlur <= 0.001) {
		return { add: () => {}, flush: () => {} };
	}

	let runColor: string | null = null;
	let runOpen = false;

	const flush = () => {
		if (!runOpen) return;
		runOpen = false;
		ctx.save();
		ctx.fillStyle = runColor as string;
		ctx.shadowColor = runColor as string;
		ctx.shadowBlur = glowBlur;
		ctx.fill();
		ctx.restore();
	};

	return {
		add(glowColor, addPath) {
			if (!runOpen || glowColor !== runColor) {
				flush();
				ctx.beginPath();
				runColor = glowColor;
				runOpen = true;
			}
			addPath();
		},
		flush
	};
}

/**
 * Groups consecutive same-colour shapes into one UNSHADOWED fill.
 *
 * The other half of the core-glow split: once the blurred pass has run (see
 * `createClassicCoreGlowRuns`), the crisp shapes carry no shadow, so they can
 * be merged by exact colour with no visual change at all — in `solid` the whole
 * figure becomes a single `fill()`, and in the sweeping modes it degrades to one
 * cheap unblurred fill per bar.
 */
export function createCrispFillRuns(ctx: CanvasRenderingContext2D): {
	add(color: string, addPath: () => void): void;
	flush(): void;
} {
	let runColor: string | null = null;
	let runOpen = false;

	const flush = () => {
		if (!runOpen) return;
		runOpen = false;
		ctx.fillStyle = runColor as string;
		ctx.fill();
	};

	return {
		add(color, addPath) {
			if (!runOpen || color !== runColor) {
				flush();
				ctx.beginPath();
				runColor = color;
				runOpen = true;
			}
			addPath();
		},
		flush
	};
}

export function resolveLinearDirection(
	orientation: SpectrumLinearOrientation,
	direction: SpectrumLinearDirection
): 1 | -1 {
	if (orientation === 'vertical') {
		return direction === 'normal' ? 1 : -1;
	}
	return direction === 'normal' ? -1 : 1;
}

export function getLinearBase(
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings
): { baseX: number; baseY: number; direction: 1 | -1 } {
	const baseX =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const baseY =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	return {
		baseX,
		baseY,
		direction: resolveLinearDirection(
			settings.spectrumLinearOrientation,
			settings.spectrumLinearDirection
		)
	};
}

export function getLinearMetrics(
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	barCount: number
) {
	const totalSpan =
		(settings.spectrumLinearOrientation === 'vertical'
			? canvas.height
			: canvas.width) *
		Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const gap = Math.max(
		0,
		totalSpan / Math.max(barCount, 1) - settings.spectrumBarWidth
	);
	const stride = settings.spectrumBarWidth + gap;
	const totalLength = Math.max(0, barCount * stride - gap);
	return { totalSpan, gap, stride, totalLength };
}

function drawPeakMarker(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	color = '#ffffff'
) {
	ctx.fillStyle = color;
	ctx.shadowBlur = 0;
	ctx.fillRect(x, y, width, height);
}

export function drawLinearBars(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	peaks: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	frame: LinearWaveFrameContext = {}
) {
	const { audioEnergy = 0, dt = 1 / 60 } = frame;
	const gradientPhase = resolveGradientFlowPhase(settings, audioEnergy, dt);
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const showMirror = settings.spectrumMirror;
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	const fillPhase = (t: number) =>
		settings.spectrumGradientFlow ? t + gradientPhase : t;

	// Pass 1 — halos, batched into one blurred fill per colour run.
	const halo = createClassicGlowHaloRuns(ctx, settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const t = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		const haloColor = resolveManualGlow(
			settings,
			t,
			getColor(settings, fillPhase(t))
		).halo;
		const h = heights[i];
		halo.add(haloColor, expansion => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride - expansion / 2;
				ctx.rect(
					baseX,
					y,
					(h + expansion) * direction,
					settings.spectrumBarWidth + expansion
				);
				if (showMirror) {
					ctx.rect(
						baseX,
						y,
						(h + expansion) * -direction,
						settings.spectrumBarWidth + expansion
					);
				}
			} else {
				const x = start + i * stride - expansion / 2;
				ctx.rect(
					x,
					baseY,
					settings.spectrumBarWidth + expansion,
					(h + expansion) * direction
				);
				if (showMirror) {
					ctx.rect(
						x,
						baseY,
						settings.spectrumBarWidth + expansion,
						(h + expansion) * -direction
					);
				}
			}
		});
	}
	halo.flush();

	// Pass 2 — core glow, batched into one blurred fill per colour run. Only
	// the (about to be blurred) shadow colour is quantized; the crisp fill in
	// pass 3 keeps every bar's exact colour.
	const coreGlow = createClassicCoreGlowRuns(ctx, glowBlur);
	for (let i = 0; i < barCount; i++) {
		const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		const coreColor = resolveManualGlow(
			settings,
			qt,
			getColor(settings, fillPhase(qt))
		).core;
		const h = heights[i];
		coreGlow.add(coreColor, () => {
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride;
				ctx.rect(baseX, y, h * direction, settings.spectrumBarWidth);
				if (showMirror) {
					ctx.rect(
						baseX,
						y,
						h * -direction,
						settings.spectrumBarWidth
					);
				}
			} else {
				const x = start + i * stride;
				ctx.rect(x, baseY, settings.spectrumBarWidth, h * direction);
				if (showMirror) {
					ctx.rect(
						x,
						baseY,
						settings.spectrumBarWidth,
						h * -direction
					);
				}
			}
		});
	}
	coreGlow.flush();

	// Pass 3 — crisp fills, one per bar with its exact colour and no shadow.
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'rgba(0,0,0,0)';
	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, fillPhase(t));
		const peakColor =
			resolveManualGlow(settings, t, color).peak ?? '#ffffff';
		const h = heights[i];
		ctx.fillStyle = color;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride;
			ctx.fillRect(baseX, y, h * direction, settings.spectrumBarWidth);
			if (showMirror)
				ctx.fillRect(
					baseX,
					y,
					h * -direction,
					settings.spectrumBarWidth
				);
			if (
				settings.spectrumPeakHold &&
				peaks[i] > settings.spectrumMinHeight + 1
			) {
				drawPeakMarker(
					ctx,
					baseX + peaks[i] * direction,
					y,
					2 * direction,
					settings.spectrumBarWidth,
					peakColor
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						baseX - peaks[i] * direction,
						y,
						-2 * direction,
						settings.spectrumBarWidth,
						peakColor
					);
			}
		} else {
			const x = start + i * stride;
			ctx.fillRect(x, baseY, settings.spectrumBarWidth, h * direction);
			if (showMirror)
				ctx.fillRect(
					x,
					baseY,
					settings.spectrumBarWidth,
					h * -direction
				);
			if (
				settings.spectrumPeakHold &&
				peaks[i] > settings.spectrumMinHeight + 1
			) {
				drawPeakMarker(
					ctx,
					x,
					baseY + peaks[i] * direction,
					settings.spectrumBarWidth,
					2 * direction,
					peakColor
				);
				if (showMirror)
					drawPeakMarker(
						ctx,
						x,
						baseY - peaks[i] * direction,
						settings.spectrumBarWidth,
						-2 * direction,
						peakColor
					);
			}
		}
	}

	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + index * stride + settings.spectrumBarWidth / 2;
			const x = baseX + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
			if (showMirror) {
				ctx.beginPath();
				ctx.arc(
					baseX - heights[index] * direction,
					y,
					size * 0.5,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		} else {
			const x = start + index * stride + settings.spectrumBarWidth / 2;
			const y = baseY + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
			if (showMirror) {
				ctx.beginPath();
				ctx.arc(
					x,
					baseY - heights[index] * direction,
					size * 0.5,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		}
	});
}

/**
 * Adds ONE capsule to the current path. Does not begin a path and does not
 * fill, so many capsules can share a single blurred fill.
 */
export function addCapsuleRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
) {
	const left = Math.min(x, x + width);
	const top = Math.min(y, y + height);
	const safeWidth = Math.abs(width);
	const safeHeight = Math.abs(height);
	const radius = Math.min(safeWidth, safeHeight) / 2;
	if (typeof ctx.roundRect === 'function') {
		ctx.roundRect(left, top, safeWidth, safeHeight, radius);
	} else {
		ctx.rect(left, top, safeWidth, safeHeight);
	}
}

export function fillCapsuleRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number
) {
	ctx.beginPath();
	addCapsuleRectPath(ctx, x, y, width, height);
	ctx.fill();
}

export function drawLinearCapsules(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	// One geometry for all three passes: `expansion = 0` reproduces the core
	// capsule exactly, so halo / glow / fill can never drift apart.
	const addPath = (index: number, expansion: number) => {
		const h = heights[index];
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + index * stride - expansion / 2;
			addCapsuleRectPath(
				ctx,
				baseX,
				y,
				(h + expansion) * direction,
				settings.spectrumBarWidth + expansion
			);
			if (settings.spectrumMirror) {
				addCapsuleRectPath(
					ctx,
					baseX - (h + expansion) * direction,
					y,
					(h + expansion) * direction,
					settings.spectrumBarWidth + expansion
				);
			}
		} else {
			const x = start + index * stride - expansion / 2;
			addCapsuleRectPath(
				ctx,
				x,
				baseY,
				settings.spectrumBarWidth + expansion,
				(h + expansion) * direction
			);
			if (settings.spectrumMirror) {
				addCapsuleRectPath(
					ctx,
					x,
					baseY - (h + expansion) * direction,
					settings.spectrumBarWidth + expansion,
					(h + expansion) * direction
				);
			}
		}
	};

	// Pass 1 — halos, batched into one blurred fill per colour run.
	const halo = createClassicGlowHaloRuns(ctx, settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		halo.add(getColor(settings, qt), expansion => addPath(i, expansion));
	}
	halo.flush();

	// Pass 2 — core glow, batched by quantized colour (was one blur per bar).
	const coreGlow = createClassicCoreGlowRuns(ctx, glowBlur);
	for (let i = 0; i < barCount; i++) {
		const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		coreGlow.add(getColor(settings, qt), () => addPath(i, 0));
	}
	coreGlow.flush();

	// Pass 3 — crisp fills, each keeping its exact colour, no shadow.
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'rgba(0,0,0,0)';
	const fills = createCrispFillRuns(ctx);
	for (let i = 0; i < barCount; i++) {
		const color = getColor(settings, i / Math.max(barCount - 1, 1));
		fills.add(color, () => addPath(i, 0));
	}
	fills.flush();
}

export function drawLinearSpikes(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	// One geometry for all three passes: `expansion = 0` reproduces the core
	// spike exactly, so halo / glow / fill can never drift apart.
	const addSpikePath = (index: number, expansion: number) => {
		const h = heights[index];
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + index * stride - expansion / 2;
			const width = settings.spectrumBarWidth + expansion;
			ctx.moveTo(baseX, y);
			ctx.lineTo(baseX + (h + expansion) * direction, y + width / 2);
			ctx.lineTo(baseX, y + width);
			ctx.closePath();
			if (settings.spectrumMirror) {
				ctx.moveTo(baseX, y);
				ctx.lineTo(baseX - (h + expansion) * direction, y + width / 2);
				ctx.lineTo(baseX, y + width);
				ctx.closePath();
			}
		} else {
			const x = start + index * stride - expansion / 2;
			const width = settings.spectrumBarWidth + expansion;
			ctx.moveTo(x, baseY);
			ctx.lineTo(x + width / 2, baseY + (h + expansion) * direction);
			ctx.lineTo(x + width, baseY);
			ctx.closePath();
			if (settings.spectrumMirror) {
				ctx.moveTo(x, baseY);
				ctx.lineTo(x + width / 2, baseY - (h + expansion) * direction);
				ctx.lineTo(x + width, baseY);
				ctx.closePath();
			}
		}
	};

	// Pass 1 — halos, batched into one blurred fill per colour run.
	const halo = createClassicGlowHaloRuns(ctx, settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		halo.add(getColor(settings, qt), expansion =>
			addSpikePath(i, expansion)
		);
	}
	halo.flush();

	// Pass 2 — core glow, batched by quantized colour (was one blur per bar).
	const coreGlow = createClassicCoreGlowRuns(ctx, glowBlur);
	for (let i = 0; i < barCount; i++) {
		const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		coreGlow.add(getColor(settings, qt), () => addSpikePath(i, 0));
	}
	coreGlow.flush();

	// Pass 3 — crisp fills, each keeping its exact colour, no shadow.
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'rgba(0,0,0,0)';
	const fills = createCrispFillRuns(ctx);
	for (let i = 0; i < barCount; i++) {
		const color = getColor(settings, i / Math.max(barCount - 1, 1));
		fills.add(color, () => addSpikePath(i, 0));
	}
	fills.flush();
}

export function drawLinearBlocks(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const baseSegmentLength = Math.max(10, settings.spectrumBarWidth * 3.6);
	const baseSegmentGap = Math.max(2, settings.spectrumBarWidth * 0.75);
	const maxSegmentsPerBar = barCount > 180 ? 4 : barCount > 120 ? 5 : 6;
	// Blocks accumulates more fillRect calls than other shapes (1 per
	// segment per bar), so it uses a stricter cap than the default helper.
	const shadowBlur = computeClassicGlowBlur(settings, barCount, {
		lowDensityCap: 10,
		highDensityCap: 6
	});

	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = shadowBlur;
		const estimatedSegments = Math.max(
			1,
			Math.round(
				(heights[i] + baseSegmentGap) /
					(baseSegmentLength + baseSegmentGap)
			)
		);
		const segments = Math.min(maxSegmentsPerBar, estimatedSegments);
		const segmentGap = Math.min(baseSegmentGap, heights[i] * 0.18);
		const segmentLength = Math.max(
			baseSegmentLength,
			(heights[i] - Math.max(0, segments - 1) * segmentGap) / segments
		);

		// Accumulate every segment (and its mirror) for this bar into a single
		// path and fill once. shadowBlur is computed per draw call, so batching
		// the bar's N segments into one fill() collapses N shadowed passes into
		// one — the dominant cost of this shape at high bar/segment counts.
		// Segments never overlap, so a nonzero-winding fill is pixel-identical
		// to the previous per-segment fillRect calls.
		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const width = Math.min(segmentLength, heights[i] - offset);
				ctx.rect(
					baseX + offset * direction,
					y - settings.spectrumBarWidth / 2,
					width * direction,
					settings.spectrumBarWidth
				);
				if (settings.spectrumMirror) {
					ctx.rect(
						baseX - offset * direction,
						y - settings.spectrumBarWidth / 2,
						-width * direction,
						settings.spectrumBarWidth
					);
				}
			}
			ctx.fill();
		} else {
			const x = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			for (let segment = 0; segment < segments; segment++) {
				const offset = segment * (segmentLength + segmentGap);
				if (offset > heights[i]) break;
				const height = Math.min(segmentLength, heights[i] - offset);
				ctx.rect(
					x - settings.spectrumBarWidth / 2,
					baseY + offset * direction,
					settings.spectrumBarWidth,
					height * direction
				);
				if (settings.spectrumMirror) {
					ctx.rect(
						x - settings.spectrumBarWidth / 2,
						baseY - offset * direction,
						settings.spectrumBarWidth,
						-height * direction
					);
				}
			}
			ctx.fill();
		}
	}
}

/**
 * Retro LED equalizer. Each bar is a stacked column of hard square cells
 * snapped to a fixed grid — no anti-aliasing, no glow — for a chunky pixel-art
 * / VU-meter look. The cell side equals the bar width so cells are square; the
 * number of lit cells is the bar height quantized to the cell pitch.
 */
export function drawLinearPixel(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const vertical = settings.spectrumLinearOrientation === 'vertical';
	const start = vertical
		? (canvas.height - totalLength) / 2
		: (canvas.width - totalLength) / 2;

	const cellSize = Math.max(
		2,
		settings.spectrumBarWidth *
			Math.max(0.35, Math.min(4, settings.spectrumLedCellSize ?? 1))
	);
	const cellGap = Math.max(
		0,
		cellSize * Math.max(0, Math.min(2, settings.spectrumLedCellGap ?? 0.28))
	);
	const cellPitch = cellSize + cellGap;
	const maxCells = 256; // hard safety cap on the per-bar loop
	const ledAngle = ((settings.spectrumLedAngle ?? 0) * Math.PI) / 180;
	const glowBlur = computeClassicGlowBlur(settings, barCount, {
		lowDensityCap: 12,
		highDensityCap: 8
	});

	// Glow and fill are painted in two passes.
	//
	// The blurred pass does NOT trace every cell. A LED column is dozens of
	// small squares a few px apart, and a blur wide enough to be visible fuses
	// those gaps anyway — so the glow traces ONE rect spanning the column and
	// the crisp pass below draws the real cells. That matters because this
	// shape's cost is geometry, not draw calls: at 240 bars with the smallest
	// cell size a frame builds ~40k cell subpaths, and making the blur chew
	// through all of them was the whole expense. The simplification only kicks
	// in when the blur is actually wider than the gap it would be filling in;
	// otherwise the real cells are traced, exactly as before.
	const columnPath = (index: number, litCells: number, size: number) => {
		addLedColumnPath(ctx, settings, {
			litCells,
			cellPitch,
			cellSize: size,
			spacingSize: cellSize,
			lineCenter: start + index * stride + settings.spectrumBarWidth / 2,
			baseX,
			baseY,
			direction,
			vertical,
			ledAngle
		});
	};
	const litCellsAt = (index: number) =>
		Math.min(maxCells, Math.floor(heights[index] / cellPitch));
	// The hull below replaces a column of cells with one rect for the BLURRED
	// pass only. It is only indistinguishable when the blur is far wider than
	// the gap it bridges — at `6x` the glow of adjacent cells has fully merged
	// anyway. Above that gap size the real cells are traced (original path), so
	// a chunky LED look with visible spacing keeps its per-cell glow.
	const glowUsesColumnHull = glowBlur >= cellGap * 6 && ledAngle === 0;
	// The hull is a SHADOW-ONLY pass: filling it would paint over the gaps
	// between cells and turn the LED column into a solid bar. Canvas has no
	// "shadow without the shape", so the path is built far off-canvas and the
	// shadow is offset back into place — the shape itself never lands on a
	// visible pixel, only its blur does.
	const HULL_SHADOW_OFFSET = 1e5;
	const addGlowPath = (index: number, litCells: number) => {
		if (!glowUsesColumnHull) {
			columnPath(index, litCells, cellSize);
			return;
		}
		const span = (litCells - 1) * cellPitch + cellSize;
		const lineCenter =
			start +
			index * stride +
			settings.spectrumBarWidth / 2 -
			(vertical ? 0 : HULL_SHADOW_OFFSET);
		const from = -cellSize / 2;
		if (vertical) {
			ctx.rect(
				baseX + from * direction - HULL_SHADOW_OFFSET,
				lineCenter - cellSize / 2,
				span * direction,
				cellSize
			);
			if (settings.spectrumMirror) {
				ctx.rect(
					baseX - from * direction - HULL_SHADOW_OFFSET,
					lineCenter - cellSize / 2,
					-span * direction,
					cellSize
				);
			}
		} else {
			ctx.rect(
				lineCenter - cellSize / 2,
				baseY + from * direction,
				cellSize,
				span * direction
			);
			if (settings.spectrumMirror) {
				ctx.rect(
					lineCenter - cellSize / 2,
					baseY - from * direction,
					cellSize,
					-span * direction
				);
			}
		}
	};

	if (!glowUsesColumnHull) {
		// Original single pass: consecutive bars sharing a fill AND a glow
		// colour merge into one shadowed fill. Splitting glow from fill only
		// pays off when the hull can shrink the blurred geometry — measured,
		// tracing every cell twice costs more than the blurs it saves.
		let runColor: string | null = null;
		let runGlow: string | null = null;
		let runOpen = false;
		const flushRun = () => {
			if (!runOpen) return;
			ctx.fillStyle = runColor as string;
			ctx.shadowColor = runGlow as string;
			ctx.shadowBlur = glowBlur;
			ctx.fill();
			runOpen = false;
		};
		for (let i = 0; i < barCount; i++) {
			const litCells = litCellsAt(i);
			if (litCells <= 0) continue;
			const t = i / Math.max(barCount - 1, 1);
			const color = getColor(settings, t);
			const glow = resolveManualGlow(
				settings,
				quantizeGlowPhase(t),
				color
			).core;
			if (!runOpen || color !== runColor || glow !== runGlow) {
				flushRun();
				ctx.beginPath();
				runColor = color;
				runGlow = glow;
				runOpen = true;
			}
			columnPath(i, litCells, cellSize);
		}
		flushRun();
	} else {
		ctx.shadowOffsetX = HULL_SHADOW_OFFSET;
		const coreGlow = createClassicCoreGlowRuns(ctx, glowBlur);
		for (let i = 0; i < barCount; i++) {
			const litCells = litCellsAt(i);
			if (litCells <= 0) continue;
			const qt = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
			// `getColor` at the quantized phase stays the fallback, so with manual
			// glow OFF the glow is still the fill colour, just snapped to the glow
			// grid like every other family already does.
			const glow = resolveManualGlow(
				settings,
				qt,
				getColor(settings, qt)
			).core;
			coreGlow.add(glow, () => addGlowPath(i, litCells));
		}
		coreGlow.flush();
		ctx.shadowOffsetX = 0;

		ctx.shadowBlur = 0;
		ctx.shadowColor = 'rgba(0,0,0,0)';
		const fills = createCrispFillRuns(ctx);
		for (let i = 0; i < barCount; i++) {
			const litCells = litCellsAt(i);
			if (litCells <= 0) continue;
			const color = getColor(settings, i / Math.max(barCount - 1, 1));
			fills.add(color, () => columnPath(i, litCells, cellSize));
		}
		fills.flush();
	}

	// The core colour does not vary per bar, so the whole spectrum's cores are
	// a single unshadowed fill.
	if (settings.spectrumNeonCore) {
		const coreSize =
			cellSize *
			Math.max(0.15, Math.min(0.8, settings.spectrumNeonCoreWidth));
		ctx.save();
		ctx.fillStyle = resolveNeonCoreStrokeStyle(
			settings,
			settings.spectrumNeonCoreIntensity
		);
		ctx.shadowBlur = 0;
		ctx.globalAlpha *=
			0.55 + Math.max(0, settings.spectrumNeonCoreIntensity) * 0.25;
		ctx.beginPath();
		let anyCore = false;
		for (let i = 0; i < barCount; i++) {
			const litCells = Math.min(
				maxCells,
				Math.floor(heights[i] / cellPitch)
			);
			if (litCells <= 0) continue;
			anyCore = true;
			addLedColumnPath(ctx, settings, {
				litCells,
				cellPitch,
				// Cores are smaller dots but sit on the same cell centres.
				cellSize: coreSize,
				spacingSize: cellSize,
				lineCenter: start + i * stride + settings.spectrumBarWidth / 2,
				baseX,
				baseY,
				direction,
				vertical,
				ledAngle
			});
		}
		if (anyCore) ctx.fill();
		ctx.restore();
	}

	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		const lineCenter =
			start + index * stride + settings.spectrumBarWidth / 2;
		if (vertical) {
			const x = baseX + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, lineCenter, size * 0.45, 0, Math.PI * 2);
			ctx.fill();
		} else {
			const y = baseY + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(lineCenter, y, size * 0.45, 0, Math.PI * 2);
			ctx.fill();
		}
	});
}

type LedColumnSpec = {
	litCells: number;
	cellPitch: number;
	/** Side of the drawn cell. */
	cellSize: number;
	/** Side used for centring, when the drawn cell is smaller (neon cores). */
	spacingSize?: number;
	lineCenter: number;
	baseX: number;
	baseY: number;
	direction: number;
	vertical: boolean;
	ledAngle: number;
};

/** Accumulates every lit cell of one bar (plus its mirror) into the path. */
function addLedColumnPath(
	ctx: CanvasRenderingContext2D,
	settings: SpectrumSettings,
	spec: LedColumnSpec
) {
	const {
		litCells,
		cellPitch,
		cellSize,
		lineCenter,
		baseX,
		baseY,
		direction,
		vertical,
		ledAngle
	} = spec;
	const shape = settings.spectrumLedShape;
	const spacing = spec.spacingSize ?? cellSize;
	const mirrored = settings.spectrumMirror;

	for (let cell = 0; cell < litCells; cell++) {
		const offset = cell * cellPitch;
		const forward = offset * direction + (spacing * direction) / 2;
		const backward = -offset * direction - (spacing * direction) / 2;
		if (vertical) {
			addLedCellPath(
				ctx,
				shape,
				baseX + forward,
				lineCenter,
				cellSize,
				ledAngle
			);
			if (mirrored) {
				addLedCellPath(
					ctx,
					shape,
					baseX + backward,
					lineCenter,
					cellSize,
					ledAngle
				);
			}
		} else {
			addLedCellPath(
				ctx,
				shape,
				lineCenter,
				baseY + forward,
				cellSize,
				ledAngle
			);
			if (mirrored) {
				addLedCellPath(
					ctx,
					shape,
					lineCenter,
					baseY + backward,
					cellSize,
					ledAngle
				);
			}
		}
	}
}

/**
 * Adds ONE LED cell to the current path. Does not fill.
 *
 * Filling per cell is what made this shape crawl: the caller sets a shadow for
 * the bar, and Canvas2D re-runs the (very expensive) blur for every fill under
 * it. A 96-bar column of up to 256 cells meant tens of thousands of blurred
 * fills per frame. Accumulating the whole bar into one path and filling once
 * collapses that to one blur per bar and draws the same pixels — the cells do
 * not overlap, so a single shadow over the union is what per-cell shadows were
 * already producing.
 *
 * Path geometry is captured in the CTM at the time it is added, so the
 * save/rotate/restore below still bakes rotation into the accumulated path.
 */
export function addLedCellPath(
	ctx: CanvasRenderingContext2D,
	shape: SpectrumSettings['spectrumLedShape'],
	x: number,
	y: number,
	size: number,
	rotation: number
) {
	const half = size / 2;
	if (shape === 'circle') {
		// `moveTo` first so this arc starts its own subpath instead of being
		// joined to the previous cell by a stray line.
		ctx.moveTo(x + half, y);
		ctx.arc(x, y, half, 0, Math.PI * 2);
		return;
	}
	if (shape === 'rounded') {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(rotation);
		if (typeof ctx.roundRect === 'function') {
			ctx.roundRect(-half, -half, size, size, size * 0.22);
		} else {
			ctx.rect(-half, -half, size, size);
		}
		ctx.restore();
		return;
	}
	// Square / diamond: emit the four rotated corners directly, no transform.
	const angle = rotation + (shape === 'diamond' ? Math.PI / 4 : 0);
	if (angle === 0) {
		ctx.rect(x - half, y - half, size, size);
		return;
	}
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const dx = half * cos;
	const dy = half * sin;
	ctx.moveTo(x - dx + dy, y - dy - dx);
	ctx.lineTo(x + dx + dy, y + dy - dx);
	ctx.lineTo(x + dx - dy, y + dy + dx);
	ctx.lineTo(x - dx - dy, y - dy + dx);
	ctx.closePath();
}

export function drawLinearDots(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
) {
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const { stride, totalLength } = getLinearMetrics(
		canvas,
		settings,
		barCount
	);
	const start =
		settings.spectrumLinearOrientation === 'vertical'
			? (canvas.height - totalLength) / 2
			: (canvas.width - totalLength) / 2;
	const dotRadius = Math.max(settings.spectrumBarWidth * 0.7, 1.5);
	const glowBlur = computeClassicGlowBlur(settings, barCount);

	// Pass 1 — halos, batched into one blurred fill per colour run. Each arc
	// needs its own `moveTo` or it joins the previous dot with a stray line.
	const halo = createClassicGlowHaloRuns(ctx, settings, barCount);
	for (let i = 0; i < barCount; i++) {
		const t = quantizeGlowPhase(i / Math.max(barCount - 1, 1));
		halo.add(getColor(settings, t), expansion => {
			const r = dotRadius + expansion * 0.45;
			if (settings.spectrumLinearOrientation === 'vertical') {
				const y = start + i * stride + settings.spectrumBarWidth / 2;
				const x = baseX + heights[i] * direction;
				ctx.moveTo(x + r, y);
				ctx.arc(x, y, r, 0, Math.PI * 2);
				if (settings.spectrumMirror) {
					const mx = baseX - heights[i] * direction;
					ctx.moveTo(mx + r, y);
					ctx.arc(mx, y, r, 0, Math.PI * 2);
				}
			} else {
				const x = start + i * stride + settings.spectrumBarWidth / 2;
				const y = baseY + heights[i] * direction;
				ctx.moveTo(x + r, y);
				ctx.arc(x, y, r, 0, Math.PI * 2);
				if (settings.spectrumMirror) {
					const my = baseY - heights[i] * direction;
					ctx.moveTo(x + r, my);
					ctx.arc(x, my, r, 0, Math.PI * 2);
				}
			}
		});
	}
	halo.flush();

	// Pass 2 — cores, one per bar, each keeping its exact colour.
	for (let i = 0; i < barCount; i++) {
		const t = i / Math.max(barCount - 1, 1);
		const color = getColor(settings, t);
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = glowBlur;

		if (settings.spectrumLinearOrientation === 'vertical') {
			const y = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			ctx.arc(
				baseX + heights[i] * direction,
				y,
				dotRadius,
				0,
				Math.PI * 2
			);
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.arc(
					baseX - heights[i] * direction,
					y,
					dotRadius,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		} else {
			const x = start + i * stride + settings.spectrumBarWidth / 2;
			ctx.beginPath();
			ctx.arc(
				x,
				baseY + heights[i] * direction,
				dotRadius,
				0,
				Math.PI * 2
			);
			ctx.fill();
			if (settings.spectrumMirror) {
				ctx.beginPath();
				ctx.arc(
					x,
					baseY - heights[i] * direction,
					dotRadius,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}
		}
	}
}

export function drawLinearWave(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	frame: LinearWaveFrameContext = {}
) {
	const { runtime, audioEnergy = 0, dt = 1 / 60 } = frame;
	const { baseX, baseY, direction } = getLinearBase(canvas, settings);
	const orientation = settings.spectrumLinearOrientation;
	const totalSpan =
		(orientation === 'vertical' ? canvas.height : canvas.width) *
		Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1));
	const start =
		orientation === 'vertical'
			? (canvas.height - totalSpan) / 2
			: (canvas.width - totalSpan) / 2;
	const step = totalSpan / Math.max(barCount - 1, 1);
	const referencePx = Math.min(canvas.width, canvas.height);
	const gradientPhase = resolveGradientFlowPhase(settings, audioEnergy, dt);
	const gradient = createWaveGradient(
		ctx,
		canvas,
		settings,
		orientation,
		undefined,
		undefined,
		undefined,
		undefined,
		gradientPhase
	);

	const traceOpenWave = (
		source: Float32Array,
		perpOffset = 0,
		alongOffset = 0
	) => {
		ctx.beginPath();
		for (let i = 0; i < barCount; i++) {
			if (orientation === 'vertical') {
				const y = start + i * step + alongOffset;
				const x = baseX + source[i] * direction + perpOffset;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			} else {
				const x = start + i * step + alongOffset;
				const y = baseY + source[i] * direction + perpOffset;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
		}
	};

	if (runtime) {
		drawEchoTracePasses(runtime, {
			ctx,
			settings,
			traceHeights: (echoHeights, alpha, offset) => {
				ctx.save();
				ctx.globalAlpha *= alpha;
				traceOpenWave(echoHeights, offset, 0);
				ctx.strokeStyle = gradient;
				ctx.lineWidth = Math.max(
					0.75,
					settings.spectrumBarWidth * 0.82
				);
				ctx.shadowBlur = 0;
				ctx.stroke();
				ctx.restore();
			}
		});
	}

	ctx.beginPath();
	for (let i = 0; i < barCount; i++) {
		if (orientation === 'vertical') {
			const y = start + i * step;
			const x = baseX + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		} else {
			const x = start + i * step;
			const y = baseY + heights[i] * direction;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
	}

	if (settings.spectrumMirror) {
		for (let i = barCount - 1; i >= 0; i--) {
			if (orientation === 'vertical') {
				ctx.lineTo(baseX - heights[i] * direction, start + i * step);
			} else {
				ctx.lineTo(start + i * step, baseY - heights[i] * direction);
			}
		}
	} else if (orientation === 'vertical') {
		ctx.lineTo(baseX, start + totalSpan);
		ctx.lineTo(baseX, start);
	} else {
		ctx.lineTo(start + totalSpan, baseY);
		ctx.lineTo(start, baseY);
	}

	ctx.closePath();
	ctx.fillStyle = gradient;
	ctx.save();
	ctx.globalAlpha *= settings.spectrumWaveFillOpacity;
	ctx.fill();
	ctx.restore();

	traceOpenWave(heights);
	const waveGlow = resolveManualGlow(
		settings,
		0.5,
		settings.spectrumPrimaryColor
	);

	// 3. Glow halo (expanded stroke, no main trace yet)
	drawClassicGlowHaloPass(
		ctx,
		waveGlow.halo,
		settings,
		barCount,
		expansion => {
			traceOpenWave(heights);
			ctx.lineWidth = settings.spectrumBarWidth + expansion * 1.2;
			ctx.stroke();
		},
		{
			alphaBoost: 0.22,
			expansionMultiplier: 1.25,
			// Sweeping glow modes paint the halo with an axis gradient so the
			// first color runs into the second along the whole trace.
			sweepStyle: glowUsesColorSweep(settings)
				? createGlowGradient(
						ctx,
						canvas,
						settings,
						settings.spectrumLinearOrientation
					)
				: null
		}
	);

	// 4. RGB split fringes (before main trace — draw-order contract)
	drawLinearRgbSplitPass(
		ctx,
		settings,
		referencePx,
		barCount,
		settings.spectrumBarWidth,
		orientation,
		() => traceOpenWave(heights)
	);

	// 5. Main trace
	traceOpenWave(heights);
	ctx.strokeStyle = gradient;
	ctx.lineWidth = settings.spectrumBarWidth;
	ctx.shadowColor = waveGlow.core;
	const waveGlowBlur = computeClassicGlowBlur(settings, barCount);
	ctx.shadowBlur = waveGlowBlur;
	ctx.save();
	ctx.stroke();
	ctx.restore();
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';

	// 6. Neon core
	if (settings.spectrumNeonCore) {
		traceOpenWave(heights);
		drawNeonCorePass(
			ctx,
			settings.spectrumBarWidth,
			settings.spectrumNeonCoreIntensity,
			settings.spectrumNeonCoreWidth,
			resolveNeonCoreStrokeStyle(
				settings,
				settings.spectrumNeonCoreIntensity
			)
		);
	}

	// 7. Peak sparks
	drawPeakSparksPass(ctx, heights, barCount, settings, (index, size) => {
		if (orientation === 'vertical') {
			const y = start + index * step;
			const x = baseX + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
		} else {
			const x = start + index * step;
			const y = baseY + heights[index] * direction;
			ctx.beginPath();
			ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
			ctx.fill();
		}
	});

	if (runtime) {
		updateEchoTraceHistory(runtime, settings, heights, barCount);
	}
}
