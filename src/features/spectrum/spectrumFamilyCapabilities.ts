import type { SpectrumFamily } from '@/types/wallpaper';

export type SpectrumFamilyCapabilities = {
	/** bars / blocks / wave / dots — classic renderer only */
	supportsShape: boolean;
	/** Peak hold affects bar renderers; other families sample heights only */
	supportsPeakHold: boolean;
	/** Mirror symmetry in the family renderer */
	supportsMirror: boolean;
	/** Bar width slider (line thickness / dot size) */
	supportsBarWidth: boolean;
	/** Wave fill opacity control */
	supportsWaveFill: boolean;
	/** Rotation speed + direction (hidden for scope linear — no visible spin) */
	supportsRotation: boolean;
	/** Tunnel-only depth / wall controls */
	supportsTunnelFx: boolean;
	/** Per-layer liquid wave controls */
	supportsLiquidLayers: boolean;
	/** Dedicated line width (oscilloscope) */
	supportsOscilloscopeLineWidth: boolean;
	/** Bass shockwave pairs well with round / ring families */
	supportsShockwave: boolean;
	/** Circle / square / triangle outline in radial layout */
	supportsRadialShape: boolean;
};

const CAPABILITIES: Record<SpectrumFamily, SpectrumFamilyCapabilities> = {
	classic: {
		supportsShape: true,
		supportsPeakHold: true,
		supportsMirror: true,
		supportsBarWidth: true,
		supportsWaveFill: true,
		supportsRotation: true,
		supportsTunnelFx: false,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: true,
		supportsRadialShape: true
	},
	oscilloscope: {
		supportsShape: false,
		supportsPeakHold: false,
		supportsMirror: true,
		supportsBarWidth: false,
		supportsWaveFill: true,
		supportsRotation: false,
		supportsTunnelFx: false,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: true,
		supportsShockwave: false,
		supportsRadialShape: true
	},
	tunnel: {
		supportsShape: false,
		supportsPeakHold: false,
		supportsMirror: false,
		supportsBarWidth: true,
		supportsWaveFill: false,
		supportsRotation: true,
		supportsTunnelFx: true,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: true,
		supportsRadialShape: true
	},
	liquid: {
		supportsShape: false,
		supportsPeakHold: false,
		supportsMirror: true,
		supportsBarWidth: true,
		supportsWaveFill: true,
		supportsRotation: true,
		supportsTunnelFx: false,
		supportsLiquidLayers: true,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: false,
		supportsRadialShape: true
	},
	orbital: {
		supportsShape: false,
		supportsPeakHold: false,
		supportsMirror: false,
		supportsBarWidth: true,
		supportsWaveFill: false,
		supportsRotation: true,
		supportsTunnelFx: false,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: true,
		supportsRadialShape: true
	},
	spectrogram: {
		supportsShape: false,
		supportsPeakHold: false,
		supportsMirror: false,
		supportsBarWidth: true,
		supportsWaveFill: false,
		supportsRotation: false,
		supportsTunnelFx: false,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: false,
		supportsRadialShape: false
	},
	spiral: {
		supportsShape: false,
		supportsPeakHold: false,
		// Spiral is rotationally symmetric — mirroring is a no-op.
		supportsMirror: false,
		// `spectrumBarWidth` controls the spiral dot size.
		supportsBarWidth: true,
		supportsWaveFill: false,
		supportsRotation: true,
		supportsTunnelFx: false,
		supportsLiquidLayers: false,
		supportsOscilloscopeLineWidth: false,
		supportsShockwave: true,
		supportsRadialShape: false
	}
};

export function getSpectrumFamilyCapabilities(
	family: SpectrumFamily
): SpectrumFamilyCapabilities {
	return CAPABILITIES[family] ?? CAPABILITIES.classic;
}
