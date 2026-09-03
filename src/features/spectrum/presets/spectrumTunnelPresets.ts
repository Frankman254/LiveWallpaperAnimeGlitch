import type { SpectrumProfileSettings } from '@/types/wallpaper';
import type { SpectrumFrameMemoryPresetId } from './spectrumFrameMemoryPresets';

export type SpectrumTunnelPresetPatch = Pick<
	SpectrumProfileSettings,
	| 'spectrumTunnelRingCount'
	| 'spectrumTunnelDepthFalloff'
	| 'spectrumTunnelRingSpacing'
	| 'spectrumTunnelWallOpacity'
	| 'spectrumTunnelPulseStrength'
>;

const TUNNEL_PRESETS: Record<
	SpectrumFrameMemoryPresetId,
	SpectrumTunnelPresetPatch
> = {
	safe: {
		spectrumTunnelRingCount: 8,
		spectrumTunnelDepthFalloff: 0.75,
		spectrumTunnelRingSpacing: 0.35,
		spectrumTunnelWallOpacity: 0.18,
		spectrumTunnelPulseStrength: 0.35
	},
	balanced: {
		spectrumTunnelRingCount: 12,
		spectrumTunnelDepthFalloff: 0.62,
		spectrumTunnelRingSpacing: 0.5,
		spectrumTunnelWallOpacity: 0.32,
		spectrumTunnelPulseStrength: 0.55
	},
	heavy: {
		spectrumTunnelRingCount: 16,
		spectrumTunnelDepthFalloff: 0.48,
		spectrumTunnelRingSpacing: 0.68,
		spectrumTunnelWallOpacity: 0.42,
		spectrumTunnelPulseStrength: 0.78
	}
};

export function buildSpectrumTunnelPresetPatch(
	preset: SpectrumFrameMemoryPresetId
): SpectrumTunnelPresetPatch {
	return { ...TUNNEL_PRESETS[preset] };
}
