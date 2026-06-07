/**
 * Reactive Edge Glow — hardstyle-calibrated renderer.
 *
 * Audio path: raw FFT bins → no EMA smoothing → fast envelope → double-pass draw.
 * Double pass: sharp crisp edge (no blur) + wide bloom (shadowBlur).
 * This produces the neon outline + glow burst characteristic of hardstyle VJ visuals.
 */

import {
	createAudioEnvelope,
	type AudioEnvelope
} from '@/utils/audioEnvelope';
import {
	getEditorThemePalette,
	resolveThemeColor,
	type BackgroundPalette
} from '@/lib/backgroundPalette';
import { EDGE_GLOW_CAPS } from './edgeGlowDefaults';
import type { EdgeGlowSettings } from './edgeGlowTypes';
import type { FxAudioChannel } from '@/features/stageFx/stageFxConfig';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { EditorTheme } from '@/types/wallpaper';
import type { LayerRect } from '@/components/wallpaper/layers/imageCanvasShared';

// ── Persistent envelope instances ────────────────────────────────────────────

const _logoEnv: AudioEnvelope = createAudioEnvelope();
const _bgEnv: AudioEnvelope = createAudioEnvelope();

// ── Raw FFT reading — zero EMA smoothing ─────────────────────────────────────

const NYQUIST_HZ = 22050;

function hzToBin(hz: number, len: number): number {
	return Math.max(0, Math.min(len - 1, Math.floor((hz / NYQUIST_HZ) * len)));
}

function peakBins(bins: Uint8Array, loHz: number, hiHz: number): number {
	if (bins.length === 0) return 0;
	const start = hzToBin(loHz, bins.length);
	const end = hzToBin(hiHz, bins.length);
	let peak = 0;
	for (let i = start; i <= end && i < bins.length; i++) {
		const v = bins[i];
		if (v !== undefined && v > peak) peak = v;
	}
	return peak / 255;
}

/**
 * Read the raw per-frame FFT level for the requested channel with NO
 * prior EMA smoothing. The envelope is the only smoothing applied.
 * Kick range uses a wider window (35–150 Hz) to catch the body as well
 * as the transient, which helps the detector fire on every hit even on
 * sub-heavy tracks.
 */
function readRawFromBins(bins: Uint8Array, channel: FxAudioChannel): number {
	if (bins.length === 0) return 0;
	switch (channel) {
		case 'kick': return peakBins(bins, 35, 150);
		case 'bass': return peakBins(bins, 50, 220);
		case 'full': return peakBins(bins, 35, 16000);
	}
}

// ── Envelope tick ─────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Tick the envelope using the raw FFT level for the selected channel.
 * Internal params are fixed for an aggressive, punchy hardstyle character:
 * - responseSpeed 8 → snaps to peaks almost instantly
 * - peakWindow 0.25 → short adaptive memory (doesn't suppress transients)
 * - peakFloor 0 → no noise floor masking, reacts to every kick
 * - punch 1.5 → large transient boost on sharp amplitude jumps
 * The user's attack/release settings still shape the envelope's rise and fall.
 */
function tickEnvelope(
	env: AudioEnvelope,
	bins: Uint8Array,
	settings: EdgeGlowSettings,
	dt: number
): number {
	const raw = readRawFromBins(bins, settings.audioChannel);
	const amplified = clamp(raw * Math.max(0.1, settings.sensitivity), 0, 1);
	const threshed = clamp(
		(amplified - settings.threshold) / Math.max(0.01, 1 - settings.threshold),
		0,
		1
	);
	const result = env.tick(threshed, dt, {
		attack: settings.attack,
		release: settings.release,
		responseSpeed: 8.0,
		peakWindow: 0.25,
		peakFloor: 0,
		punch: 1.5,
		scaleIntensity: clamp(settings.intensity, 0.01, 2.5),
		min: 0,
		max: 1
	});
	return result.value;
}

// ── Color resolver ────────────────────────────────────────────────────────────

export function resolveEdgeGlowColor(
	settings: EdgeGlowSettings,
	editorTheme: EditorTheme,
	backgroundPalette?: BackgroundPalette
): string {
	const themePalette = getEditorThemePalette(editorTheme);
	const bgPalette = backgroundPalette ?? themePalette;
	return resolveThemeColor(
		settings.colorSource,
		settings.color,
		bgPalette,
		themePalette,
		'accent'
	);
}

// ── Double-pass draw helpers ──────────────────────────────────────────────────

/**
 * Draw two passes:
 * 1. Crisp neon edge — thin stroke, very low blur (the hard outline).
 * 2. Bloom halo    — thicker stroke, heavy shadowBlur (the glow burst).
 *
 * The drive² power-curve makes expansion snap hard on peaks and retract fast,
 * giving the aggressive hardstyle "flash" character instead of a soft pulse.
 */
function drawDoublePassArc(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	baseRadius: number,
	drive: number,
	settings: EdgeGlowSettings,
	color: string
): void {
	const driveSq = drive * drive;
	const cappedBlur = clamp(settings.radius * driveSq, 0, EDGE_GLOW_CAPS.maxBlurPx);
	const cappedThickness = clamp(settings.thickness, 1, EDGE_GLOW_CAPS.maxThicknessPx);
	const cappedExpansion = clamp(
		settings.expansionRadius * driveSq,
		0,
		EDGE_GLOW_CAPS.maxExpansionPx
	);
	const baseOpacity = clamp(settings.opacity * drive, 0, EDGE_GLOW_CAPS.maxOpacity);
	const arcRadius = Math.max(1, baseRadius + cappedExpansion);

	// Pass 1 — sharp neon edge (crisp outline, tight shadow for core brightness)
	ctx.save();
	ctx.globalCompositeOperation = settings.blendMode;
	ctx.globalAlpha = baseOpacity;
	ctx.shadowBlur = Math.min(cappedBlur * 0.25, 8);
	ctx.shadowColor = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, cappedThickness * 0.35);
	ctx.beginPath();
	ctx.arc(cx, cy, arcRadius, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();

	// Pass 2 — outer bloom (skip when blur is negligible; saves a full stroke + shadowBlur pass)
	if (cappedBlur > 0.5) {
		ctx.save();
		ctx.globalCompositeOperation = settings.blendMode;
		ctx.globalAlpha = clamp(baseOpacity * 0.8, 0, 1);
		ctx.shadowBlur = cappedBlur;
		ctx.shadowColor = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = cappedThickness;
		ctx.beginPath();
		ctx.arc(cx, cy, arcRadius + cappedThickness * 0.5, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}
}

function drawDoublePassRect(
	ctx: CanvasRenderingContext2D,
	rect: LayerRect,
	drive: number,
	settings: EdgeGlowSettings,
	color: string
): void {
	const driveSq = drive * drive;
	const cappedBlur = clamp(settings.radius * driveSq, 0, EDGE_GLOW_CAPS.maxBlurPx);
	const cappedThickness = clamp(settings.thickness, 1, EDGE_GLOW_CAPS.maxThicknessPx);
	const cappedExpansion = clamp(
		settings.expansionRadius * driveSq,
		0,
		EDGE_GLOW_CAPS.maxExpansionPx
	);
	const baseOpacity = clamp(settings.opacity * drive, 0, EDGE_GLOW_CAPS.maxOpacity);

	const half = cappedThickness * 0.5;
	const ex1 = cappedExpansion + half * 0.35;
	const x1 = rect.cx - rect.width / 2 - ex1;
	const y1 = rect.cy - rect.height / 2 - ex1;
	const w1 = Math.max(1, rect.width + ex1 * 2);
	const h1 = Math.max(1, rect.height + ex1 * 2);

	// Pass 1 — sharp edge
	ctx.save();
	ctx.globalCompositeOperation = settings.blendMode;
	ctx.globalAlpha = baseOpacity;
	ctx.shadowBlur = Math.min(cappedBlur * 0.25, 8);
	ctx.shadowColor = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, cappedThickness * 0.35);
	ctx.strokeRect(x1, y1, w1, h1);
	ctx.restore();

	// Pass 2 — bloom (skip when blur is negligible)
	if (cappedBlur > 0.5) {
		const ex2 = cappedExpansion + half;
		const x2 = rect.cx - rect.width / 2 - ex2;
		const y2 = rect.cy - rect.height / 2 - ex2;
		const w2 = Math.max(1, rect.width + ex2 * 2);
		const h2 = Math.max(1, rect.height + ex2 * 2);

		ctx.save();
		ctx.globalCompositeOperation = settings.blendMode;
		ctx.globalAlpha = clamp(baseOpacity * 0.8, 0, 1);
		ctx.shadowBlur = cappedBlur;
		ctx.shadowColor = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = cappedThickness;
		ctx.strokeRect(x2, y2, w2, h2);
		ctx.restore();
	}
}

// ── Public draw functions ─────────────────────────────────────────────────────

export function drawLogoEdgeGlow(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	logoRadius: number,
	settings: EdgeGlowSettings,
	snapshot: AudioSnapshot,
	dt: number,
	editorTheme: EditorTheme,
	backgroundPalette?: BackgroundPalette
): void {
	if (!settings.enabled) {
		_logoEnv.reset();
		return;
	}

	const drive = tickEnvelope(_logoEnv, snapshot.bins, settings, dt);
	if (drive < 0.004) return;

	const color = resolveEdgeGlowColor(settings, editorTheme, backgroundPalette);
	drawDoublePassArc(ctx, cx, cy, logoRadius, drive, settings, color);
}

export function drawBgEdgeGlow(
	ctx: CanvasRenderingContext2D,
	rect: LayerRect,
	settings: EdgeGlowSettings,
	snapshot: AudioSnapshot,
	dt: number,
	editorTheme: EditorTheme
): void {
	if (!settings.enabled) {
		_bgEnv.reset();
		return;
	}

	const drive = tickEnvelope(_bgEnv, snapshot.bins, settings, dt);
	if (drive < 0.004) return;

	const color = resolveEdgeGlowColor(settings, editorTheme);
	drawDoublePassRect(ctx, rect, drive, settings, color);
}

export function resetEdgeGlowEnvelopes(): void {
	_logoEnv.reset();
	_bgEnv.reset();
}
