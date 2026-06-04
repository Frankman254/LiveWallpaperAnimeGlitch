import type { EdgeGlowSettings } from './edgeGlowTypes';

/** Hard ceilings applied in the renderer regardless of slider input. */
export const EDGE_GLOW_CAPS = {
	/** Canvas2D shadowBlur ceiling — single most expensive op. */
	maxBlurPx: 64,
	/** Stroke thickness ceiling. */
	maxThicknessPx: 24,
	/** Outward expansion ceiling. */
	maxExpansionPx: 80,
	/** Opacity ceiling. */
	maxOpacity: 1
} as const;

/**
 * Hardstyle-calibrated defaults for logo edge glow.
 * attack≈0 → instant snap on kick. release≈0.1 → ~100ms decay (one kick tail at 145 BPM).
 * lighter blend → additive, fully visible even on bright backgrounds.
 */
export const LOGO_EDGE_GLOW_DEFAULTS: EdgeGlowSettings = {
	enabled: false,
	intensity: 1.2,
	thickness: 3,
	radius: 28,
	expansionRadius: 20,
	opacity: 1.0,
	colorSource: 'theme',
	color: '#00eeff',
	blendMode: 'lighter',
	audioChannel: 'kick',
	threshold: 0.28,
	attack: 0.02,
	release: 0.1,
	sensitivity: 2.5
};

/** Hardstyle-calibrated defaults for background edge glow. */
export const BG_EDGE_GLOW_DEFAULTS: EdgeGlowSettings = {
	enabled: false,
	intensity: 1.0,
	thickness: 4,
	radius: 32,
	expansionRadius: 24,
	opacity: 0.9,
	colorSource: 'theme',
	color: '#ff00cc',
	blendMode: 'lighter',
	audioChannel: 'kick',
	threshold: 0.28,
	attack: 0.02,
	release: 0.1,
	sensitivity: 2.5
};
