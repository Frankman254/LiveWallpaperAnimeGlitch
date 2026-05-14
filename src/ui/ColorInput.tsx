import FieldLabel from './FieldLabel';

type ColorInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
};

export default function ColorInput({
	label,
	value,
	onChange
}: ColorInputProps) {
	const handleColorChange = (nextValue: string) => onChange(nextValue);
	return (
		<div className="flex items-center justify-between gap-3">
			<FieldLabel>{label}</FieldLabel>
			<input
				type="color"
				value={value}
				onInput={event =>
					handleColorChange((event.target as HTMLInputElement).value)
				}
				onChange={event => handleColorChange(event.target.value)}
				className="h-6 w-8 cursor-pointer border-0 bg-transparent"
				style={{ borderRadius: 'var(--editor-radius-sm)' }}
			/>
		</div>
	);
}
