import { Select } from '@/ui';

export type ThemedSelectOption<TValue extends string | number> = {
	value: TValue;
	label: string;
};

type ThemedSelectProps<TValue extends string | number> = {
	value: TValue | null;
	onChange: (value: TValue | null) => void;
	options: ReadonlyArray<ThemedSelectOption<TValue>>;
	placeholder?: string;
	ariaLabel?: string;
	disabled?: boolean;
	className?: string;
};

const EMPTY_SENTINEL = '__LWAG_THEMED_SELECT_EMPTY__';

export default function ThemedSelect<TValue extends string | number>({
	value,
	onChange,
	options,
	placeholder = '— None —',
	ariaLabel,
	disabled = false,
	className = ''
}: ThemedSelectProps<TValue>) {
	return (
		<Select<string | number>
			value={value ?? EMPTY_SENTINEL}
			onChange={next =>
				onChange(
					next === EMPTY_SENTINEL ? null : (next as TValue)
				)
			}
			options={[
				{ value: EMPTY_SENTINEL, label: placeholder },
				...options
			]}
			placeholder={placeholder}
			size="sm"
			density="compact"
			full
			disabled={disabled}
			ariaLabel={ariaLabel}
			className={className}
		/>
	);
}
