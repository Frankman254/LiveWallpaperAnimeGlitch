import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';
import { FOCUS_RING } from './lib/focusRing';

export type SegmentedControlSize = 'sm' | 'md' | 'lg';
export type SegmentedControlDensity = 'default' | 'compact';

export type SegmentedOption<T extends string> =
	| T
	| { value: T; label: ReactNode; icon?: ReactNode; hint?: string };

type SegmentedControlProps<T extends string> = {
	value: T | null;
	onChange: (next: T) => void;
	options: ReadonlyArray<SegmentedOption<T>>;
	size?: SegmentedControlSize;
	density?: SegmentedControlDensity;
	full?: boolean;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

const SIZE_SPEC: Record<SegmentedControlSize, { h: number; fs: number }> = {
	sm: { h: 26, fs: 11 },
	md: { h: 32, fs: 12 },
	lg: { h: 38, fs: 13 }
};

const COMPACT_SIZE_SPEC: Record<
	SegmentedControlSize,
	{ h: number; fs: number }
> = {
	sm: { h: 22, fs: 10 },
	md: { h: 28, fs: 11 },
	lg: { h: 34, fs: 12 }
};

function normalize<T extends string>(opt: SegmentedOption<T>) {
	if (typeof opt === 'string') {
		return {
			value: opt as T,
			label: opt as ReactNode,
			icon: null as ReactNode
		};
	}
	return { value: opt.value, label: opt.label, icon: opt.icon ?? null };
}

export default function SegmentedControl<T extends string>({
	value,
	onChange,
	options,
	size = 'md',
	density = 'default',
	full = false,
	ariaLabel,
	className,
	style
}: SegmentedControlProps<T>) {
	const spec =
		density === 'compact' ? COMPACT_SIZE_SPEC[size] : SIZE_SPEC[size];
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className={cn(
				'inline-flex items-center',
				density === 'compact' ? 'gap-px p-px' : 'gap-[2px] p-[2px]',
				full && 'w-full',
				className
			)}
			style={{
				background: UI_COLORS.overlay,
				border: `1px solid ${UI_COLORS.border}`,
				borderRadius: 'var(--editor-radius-md)',
				...style
			}}
		>
			{options.map(raw => {
				const opt = normalize(raw);
				const sel = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={sel}
						onClick={() => onChange(opt.value)}
						className={cn(
							'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--editor-radius-sm)]',
						FOCUS_RING,
							full && 'flex-1'
						)}
						style={{
							height: spec.h - 4,
							padding:
								density === 'compact'
									? opt.icon
										? '0 6px'
										: '0 9px'
									: opt.icon
										? '0 8px'
										: '0 12px',
							background: sel ? UI_COLORS.accent : 'transparent',
							color: sel ? UI_COLORS.accentFg : UI_COLORS.fgMute,
							border: 0,
							borderRadius: 'var(--editor-radius-sm)',
							fontSize: spec.fs,
							fontWeight: sel ? 600 : 500,
							transition: transition('background, color')
						}}
					>
						{opt.icon}
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}
