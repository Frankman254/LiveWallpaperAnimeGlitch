import type { SliderControlProps } from '@/types/controls';
import { Slider, UI_COLORS } from '@/ui';
import { getFactoryNumericDefaultForSetter } from '@/components/controls/factoryControlDefaults';

function fmt(value: number, step: number): string {
	if (step >= 1) return String(Math.round(value));
	if (step >= 0.1) return value.toFixed(1);
	if (step >= 0.01) return value.toFixed(2);
	return value.toFixed(3);
}

export default function SliderControl({
	label,
	value,
	min,
	max,
	step,
	onChange,
	unit,
	tooltip,
	effectiveValue,
	variant = 'compact',
	defaultValue
}: SliderControlProps) {
	const displayValue = fmt(value, step);
	const resolvedDefaultValue =
		defaultValue ?? getFactoryNumericDefaultForSetter(onChange);
	const isLimited = effectiveValue !== undefined && effectiveValue !== value;
	const effectiveDisplay =
		effectiveValue !== undefined
			? `${fmt(effectiveValue, step)}${unit ? unit : ''}`
			: `${displayValue}${unit ? unit : ''}`;

	return (
		<Slider
			value={value}
			onChange={onChange}
			min={min}
			max={max}
			step={step}
			label={label}
			onReset={
				resolvedDefaultValue === undefined
					? undefined
					: () => onChange(resolvedDefaultValue)
			}
			hint={
				tooltip ? (
					<span title={tooltip} style={{ color: UI_COLORS.fgFaint }}>
						?
					</span>
				) : undefined
			}
			variant={variant}
			formatValue={v => `${fmt(v, step)}${unit ? unit : ''}`}
			valueDisplay={
				<span
					title={
						isLimited
							? `set: ${displayValue}${unit ? unit : ''}`
							: undefined
					}
					style={{ color: isLimited ? '#fbbf24' : undefined }}
				>
					{effectiveDisplay}
				</span>
			}
			className="w-full min-w-0"
		/>
	);
}
