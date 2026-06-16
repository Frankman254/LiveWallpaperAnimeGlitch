import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	SPECTRUM_FRAME_MEMORY_PRESET_IDS,
	type SpectrumFrameMemoryPresetId,
	type SpectrumFrameMemoryTarget
} from '@/features/spectrum/spectrumFrameMemoryPresets';
import { SegmentedControl } from '@/ui';

export function SpectrumFrameMemoryPresets({
	target
}: {
	target: SpectrumFrameMemoryTarget;
}) {
	const t = useT();
	const applyPreset = useWallpaperStore(
		s => s.applySpectrumFrameMemoryPreset
	);

	const labels: Record<SpectrumFrameMemoryPresetId, string> = {
		safe: t.label_spectrum_frame_preset_safe,
		balanced: t.label_spectrum_frame_preset_balanced,
		heavy: t.label_spectrum_frame_preset_heavy
	};

	return (
		<SegmentedControl
			size="sm"
			ariaLabel={t.label_spectrum_frame_presets}
			value={null}
			options={SPECTRUM_FRAME_MEMORY_PRESET_IDS.map(id => ({
				value: id,
				label: labels[id]
			}))}
			onChange={id => applyPreset(id, target)}
		/>
	);
}
