import type { ReactNode } from 'react';
import Button from './Button';
import { cn } from './lib/cn';

export type EnumButtonGroupProps<T extends string> = {
	options: readonly T[];
	value: T;
	onChange: (value: T) => void;
	labels?: Partial<Record<T, ReactNode>>;
	disabled?: boolean;
	className?: string;
};

export default function EnumButtonGroup<T extends string>({
	options,
	value,
	onChange,
	labels,
	disabled = false,
	className
}: EnumButtonGroupProps<T>) {
	return (
		<div
			className={cn(
				'flex flex-wrap gap-1.5',
				disabled && 'pointer-events-none opacity-45',
				className
			)}
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
