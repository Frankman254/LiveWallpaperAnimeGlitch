import { inferSpectrumMacroValues } from '@/features/spectrum/spectrumStateTransforms';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { SectionCard } from '@/ui';
import SliderControl from '../../SliderControl';

export function SpectrumMacroStrip() {
	const store = useWallpaperStore();
	const macroValues = inferSpectrumMacroValues(store);

	return (
		<SectionCard title="Macros" level={2} density="compact">
			<SliderControl
				label="Energy"
				value={macroValues.energy}
				min={0}
				max={1}
				step={0.02}
				onChange={value => store.applySpectrumMacro('energy', value)}
			/>
			<SliderControl
				label="Softness"
				value={macroValues.softness}
				min={0}
				max={1}
				step={0.02}
				onChange={value => store.applySpectrumMacro('softness', value)}
			/>
			<SliderControl
				label="Chaos"
				value={macroValues.chaos}
				min={0}
				max={1}
				step={0.02}
				onChange={value => store.applySpectrumMacro('chaos', value)}
			/>
		</SectionCard>
	);
}
