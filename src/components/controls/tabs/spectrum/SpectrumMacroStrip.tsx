import { inferSpectrumMacroValues } from '@/features/spectrum/spectrumStateTransforms';
import { useWallpaperStore } from '@/store/wallpaperStore';
import SliderControl from '../../SliderControl';
import { SECTION_HEADER_CLASS } from '../../ui/designTokens';

export function SpectrumMacroStrip() {
	const store = useWallpaperStore();
	const macroValues = inferSpectrumMacroValues(store);

	return (
		<div
			className="mb-3 rounded-lg border p-2"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-tag-bg)'
			}}
		>
			<div
				className={`mb-2 ${SECTION_HEADER_CLASS}`}
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				Macros
			</div>
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
