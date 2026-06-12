import {
	buildSpectrumMacroPatch,
	inferSpectrumMacroValues,
	type SpectrumMacroName
} from '@/features/spectrum/spectrumStateTransforms';
import { useSpectrumTargetSettings } from './useSpectrumTargetSettings';
import { FONT, UI_COLORS } from '@/ui';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import SliderControl from '../../SliderControl';
import { useIsSimple } from '../../UIMode';

const FACTORY_MACRO_VALUES = inferSpectrumMacroValues(FACTORY_DEFAULT_STATE);

export function SpectrumMacroStrip() {
	const { settings, update } = useSpectrumTargetSettings();
	const isSimple = useIsSimple();
	const macroValues = inferSpectrumMacroValues(settings);
	const sliderVariant = isSimple ? 'macro' : 'compact';
	const applyMacro = (macro: SpectrumMacroName, value: number) =>
		update(buildSpectrumMacroPatch(settings, macro, value));

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
				onChange={value => applyMacro('energy', value)}
				defaultValue={FACTORY_MACRO_VALUES.energy}
				variant={sliderVariant}
			/>
			<SliderControl
				label="Softness"
				value={macroValues.softness}
				min={0}
				max={1}
				step={0.02}
				onChange={value => applyMacro('softness', value)}
				defaultValue={FACTORY_MACRO_VALUES.softness}
				variant={sliderVariant}
			/>
			<SliderControl
				label="Chaos"
				value={macroValues.chaos}
				min={0}
				max={1}
				step={0.02}
				onChange={value => applyMacro('chaos', value)}
				defaultValue={FACTORY_MACRO_VALUES.chaos}
				variant={sliderVariant}
			/>
		</div>
	);
}
