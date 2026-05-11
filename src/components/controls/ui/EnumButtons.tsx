import { Button } from '@/ui';

interface Props<T extends string> {
	options: T[];
	value: T;
	onChange: (v: T) => void;
	labels?: Partial<Record<T, string>>;
	disabled?: boolean;
}

export default function EnumButtons<T extends string>({
	options,
	value,
	onChange,
	labels,
	disabled = false
}: Props<T>) {
	return (
		<div
			className={`flex flex-wrap gap-1.5 ${disabled ? 'pointer-events-none opacity-45' : ''}`}
		>
			{options.map(opt => (
				<Button
					key={opt}
					type="button"
					disabled={disabled}
					onClick={() => onChange(opt)}
					variant={value === opt ? 'primary' : 'secondary'}
					size="sm"
					density="compact"
					active={value === opt}
					className="capitalize"
				>
					{labels?.[opt] ?? opt}
				</Button>
			))}
		</div>
	);
}
