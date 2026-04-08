import EnumButtons from '@/components/controls/ui/EnumButtons';
import type { ImageFitMode } from '@/types/wallpaper';
import { FIT_MODES } from './constants';

export default function BgFitModeSelector({
	label,
	value,
	onChange
}: {
	label: string;
	value: ImageFitMode;
	onChange: (value: ImageFitMode) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span
				className="text-xs"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{label}
			</span>
			<EnumButtons<ImageFitMode>
				options={FIT_MODES}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}
