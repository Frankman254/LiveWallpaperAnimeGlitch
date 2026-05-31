import type { ReactNode } from 'react';
import Button from './Button';
import { cn } from './lib/cn';

export type EnumButtonGroupProps<T extends string> = {
	options: readonly T[];
	value: T;
	onChange: (value: T) => void;
	labels?: Partial<Record<T, ReactNode>>;
	/**
	 * Per-option title attribute (tooltip). Useful when `labels` are icons
	 * and you still want the human-readable name on hover. Falls back to the
	 * option id if missing.
	 */
	tooltips?: Partial<Record<T, string>>;
	disabled?: boolean;
	className?: string;
};

export default function EnumButtonGroup<T extends string>({
	options,
	value,
	onChange,
	labels,
	tooltips,
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
					title={tooltips?.[opt] ?? opt}
				>
					{labels?.[opt] ?? opt}
				</Button>
			))}
		</div>
	);
}
