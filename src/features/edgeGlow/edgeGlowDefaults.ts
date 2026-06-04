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

/** Safe default settings for logo edge glow (off by default). */
export const LOGO_EDGE_GLOW_DEFAULTS: EdgeGlowSettings = {
	enabled: false,
	intensity: 0.8,
	thickness: 3,
	radius: 18,
	expansionRadius: 12,
	opacity: 0.85,
	colorSource: 'theme',
	color: '#00eeff',
	blendMode: 'screen',
	audioChannel: 'kick',
	threshold: 0.45,
	attack: 0.15,
	release: 0.55,
	sensitivity: 1.2
};

/** Safe default settings for background edge glow (off by default). */
export const BG_EDGE_GLOW_DEFAULTS: EdgeGlowSettings = {
	enabled: false,
	intensity: 0.6,
	thickness: 4,
	radius: 24,
	expansionRadius: 16,
	opacity: 0.75,
	colorSource: 'theme',
	color: '#ff00cc',
	blendMode: 'screen',
	audioChannel: 'kick',
	threshold: 0.5,
	attack: 0.12,
	release: 0.6,
	sensitivity: 1.0
};
