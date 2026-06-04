/**
 * Reactive Edge Glow — shared render helpers.
 *
 * Two entry points:
 *   drawLogoEdgeGlow()  — arc/circle glow around the logo
 *   drawBgEdgeGlow()    — rect glow around the background image bounds
 *
 * Each target keeps its own AudioEnvelope instance (module-level singleton)
 * so state is preserved across frames without prop drilling.
 */

import {
	createAudioEnvelope,
	type AudioEnvelope
} from '@/utils/audioEnvelope';
import { readFxChannel } from '@/features/stageFx/stageFxConfig';
import {
	getEditorThemePalette,
	resolveThemeColor,
	type BackgroundPalette
} from '@/lib/backgroundPalette';
import { EDGE_GLOW_CAPS } from './edgeGlowDefaults';
import type { EdgeGlowSettings } from './edgeGlowTypes';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { EditorTheme } from '@/types/wallpaper';
import type { LayerRect } from '@/components/wallpaper/layers/imageCanvasShared';

// ── Persistent envelope instances (one per target) ───────────────────────────

const _logoEnv: AudioEnvelope = createAudioEnvelope();
const _bgEnv: AudioEnvelope = createAudioEnvelope();

// ── Internal helpers ──────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Read the audio level for the requested channel, apply sensitivity and
 * threshold, then tick the envelope. Returns a 0–1 drive value.
 */
function tickEnvelope(
	env: AudioEnvelope,
	snapshot: AudioSnapshot,
	settings: EdgeGlowSettings,
	dt: number
): number {
	const raw = readFxChannel(snapshot, settings.audioChannel);
	// Apply sensitivity before threshold so the user gets predictable control.
	const amplified = clamp(raw * Math.max(0.1, settings.sensitivity), 0, 1);
	const threshed = clamp(
		(amplified - settings.threshold) / Math.max(0.01, 1 - settings.threshold),
		0,
		1
	);
	const result = env.tick(threshed, dt, {
		attack: settings.attack,
		release: settings.release,
		responseSpeed: 2.0,
		peakWindow: 0.6,
		peakFloor: 0.1,
		punch: 0.3,
		scaleIntensity: clamp(settings.intensity, 0.01, 2.5),
		min: 0,
		max: 1
	});
	return result.value;
}

/**
 * Resolve the final glow color.
 * For the background target in the canvas runtime we don't have the
 * background palette, so 'image' falls back to theme.
 */
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

// ── Logo edge glow ────────────────────────────────────────────────────────────

/**
 * Draw an audio-reactive outline glow around the logo.
 *
 * Call this immediately AFTER drawLogo() in the overlay registry so it
 * renders on top with additive blending.
 */
export function drawLogoEdgeGlow(
	ctx: CanvasRenderingContext2D,
	cx: number,
	cy: number,
	/** Current rendered radius of the logo (logoBaseSize * scale / 2). */
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

	const drive = tickEnvelope(_logoEnv, snapshot, settings, dt);

	// Skip draw below epsilon to avoid a zero-alpha stroke every frame.
	if (drive < 0.004) return;

	const cappedBlur = clamp(
		settings.radius * drive,
		0,
		EDGE_GLOW_CAPS.maxBlurPx
	);
	const cappedThickness = clamp(settings.thickness, 1, EDGE_GLOW_CAPS.maxThicknessPx);
	const cappedExpansion = clamp(
		settings.expansionRadius * drive,
		0,
		EDGE_GLOW_CAPS.maxExpansionPx
	);
	const effectiveOpacity = clamp(
		settings.opacity * drive,
		0,
		EDGE_GLOW_CAPS.maxOpacity
	);

	const color = resolveEdgeGlowColor(settings, editorTheme, backgroundPalette);
	const strokeRadius = logoRadius + cappedExpansion + cappedThickness * 0.5;

	ctx.save();
	ctx.globalCompositeOperation = settings.blendMode;
	ctx.globalAlpha = effectiveOpacity;
	ctx.shadowBlur = cappedBlur;
	ctx.shadowColor = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = cappedThickness;
	ctx.beginPath();
	ctx.arc(cx, cy, Math.max(1, strokeRadius), 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}

// ── Background edge glow ──────────────────────────────────────────────────────

/**
 * Draw an audio-reactive outline glow around the background image bounds.
 *
 * Call this after renderBackgroundFrame() in imageCanvasRuntime.ts.
 * `rect` is the LayerRect returned by getLayerRect() — already includes
 * bassBoost, parallax, and all transforms.
 */
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

	const drive = tickEnvelope(_bgEnv, snapshot, settings, dt);
	if (drive < 0.004) return;

	const cappedBlur = clamp(
		settings.radius * drive,
		0,
		EDGE_GLOW_CAPS.maxBlurPx
	);
	const cappedThickness = clamp(settings.thickness, 1, EDGE_GLOW_CAPS.maxThicknessPx);
	const cappedExpansion = clamp(
		settings.expansionRadius * drive,
		0,
		EDGE_GLOW_CAPS.maxExpansionPx
	);
	const effectiveOpacity = clamp(
		settings.opacity * drive,
		0,
		EDGE_GLOW_CAPS.maxOpacity
	);

	const color = resolveEdgeGlowColor(settings, editorTheme);

	// Expand the rect by expansion + half stroke so the outline sits just
	// outside the image boundary.
	const half = cappedThickness * 0.5;
	const ex = cappedExpansion + half;
	const x = rect.cx - rect.width / 2 - ex;
	const y = rect.cy - rect.height / 2 - ex;
	const w = rect.width + ex * 2;
	const h = rect.height + ex * 2;

	ctx.save();
	ctx.globalCompositeOperation = settings.blendMode;
	ctx.globalAlpha = effectiveOpacity;
	ctx.shadowBlur = cappedBlur;
	ctx.shadowColor = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = cappedThickness;
	ctx.strokeRect(x, y, Math.max(1, w), Math.max(1, h));
	ctx.restore();
}

/** Reset both envelopes (e.g. on audio pause or effect disable). */
export function resetEdgeGlowEnvelopes(): void {
	_logoEnv.reset();
	_bgEnv.reset();
}
