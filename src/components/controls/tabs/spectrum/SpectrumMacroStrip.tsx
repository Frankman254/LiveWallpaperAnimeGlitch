import { inferSpectrumMacroValues } from '@/features/spectrum/spectrumStateTransforms';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { FONT, UI_COLORS } from '@/ui';
import SliderControl from '../../SliderControl';

export function SpectrumMacroStrip() {
	const store = useWallpaperStore();
	const macroValues = inferSpectrumMacroValues(store);

	return (
		<div className="flex min-w-0 flex-col gap-1">
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650,
					letterSpacing: '0.1em'
				}}
			>
				Macros
			</span>
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
		</div>
	);
}
