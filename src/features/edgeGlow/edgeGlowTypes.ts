import type {
	FxAudioChannel,
	StageLightsBlendMode,
	StageLightsColorSource
} from '@/features/stageFx/stageFxConfig';

export type EdgeGlowColorSource = StageLightsColorSource;
export type EdgeGlowBlendMode = StageLightsBlendMode;
export type EdgeGlowAudioChannel = FxAudioChannel;

/** Shared settings shape for one edge-glow target (logo or background). */
export interface EdgeGlowSettings {
	enabled: boolean;
	/** 0–2: master drive multiplier */
	intensity: number;
	/** px: stroke width of the visible outline */
	thickness: number;
	/** px: canvas shadowBlur (soft bloom radius) */
	radius: number;
	/** px: how far the stroke expands outward at audio peaks */
	expansionRadius: number;
	/** 0–1: base opacity of the effect (before audio modulation) */
	opacity: number;
	colorSource: EdgeGlowColorSource;
	/** Hex color used when colorSource === 'manual' */
	color: string;
	blendMode: EdgeGlowBlendMode;
	audioChannel: EdgeGlowAudioChannel;
	/** 0–1: audio level must exceed this before the envelope reacts */
	threshold: number;
	/** 0–1.5: envelope rise speed */
	attack: number;
	/** 0.01–2: envelope fall speed */
	release: number;
	/** 0–8: additional amplitude multiplier before threshold */
	sensitivity: number;
}
