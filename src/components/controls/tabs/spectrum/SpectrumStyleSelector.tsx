import type { SpectrumShape } from '@/types/wallpaper';
import EnumButtons from '../../ui/EnumButtons';

export function SpectrumStyleSelector({
	label,
	options,
	value,
	onChange
}: {
	label: string;
	options: SpectrumShape[];
	value: SpectrumShape;
	onChange: (value: SpectrumShape) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span
				className="text-xs"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{label}
			</span>
			<EnumButtons<SpectrumShape>
				options={options}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}
