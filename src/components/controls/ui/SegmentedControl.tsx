import type { CSSProperties, ReactNode } from 'react';

type SegmentedSize = 'sm' | 'md' | 'lg';

export type SegmentedOption<T extends string> =
	| T
	| { value: T; label: ReactNode; icon?: ReactNode };

type SegmentedControlProps<T extends string> = {
	value: T;
	onChange: (v: T) => void;
	options: ReadonlyArray<SegmentedOption<T>>;
	size?: SegmentedSize;
	full?: boolean;
	className?: string;
	style?: CSSProperties;
};

const SIZE_STYLE: Record<SegmentedSize, { h: number; fs: number }> = {
	sm: { h: 28, fs: 11 },
	md: { h: 32, fs: 12 },
	lg: { h: 38, fs: 13 }
};

function normalize<T extends string>(opt: SegmentedOption<T>) {
	if (typeof opt === 'string') {
		return { value: opt as T, label: opt as ReactNode, icon: null };
	}
	return { value: opt.value, label: opt.label, icon: opt.icon ?? null };
}

export default function SegmentedControl<T extends string>({
	value,
	onChange,
	options,
	size = 'md',
	full = false,
	className = '',
	style
}: SegmentedControlProps<T>) {
	const s = SIZE_STYLE[size];
	return (
		<div
			className={`inline-flex items-center gap-0.5 ${className}`}
			style={{
				padding: 2,
				background: 'rgba(0, 0, 0, 0.32)',
				border: '1px solid var(--editor-tag-border)',
				borderRadius: 'var(--editor-radius-md)',
				width: full ? '100%' : undefined,
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
						onClick={() => onChange(opt.value)}
						className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
						style={{
							flex: full ? 1 : undefined,
							height: s.h - 4,
							padding: opt.icon ? '0 8px' : '0 12px',
							background: sel ? 'var(--lwag-accent)' : 'transparent',
							color: sel
								? 'var(--editor-active-fg)'
								: 'var(--editor-accent-muted)',
							border: 0,
							borderRadius: 'var(--editor-radius-sm)',
							fontSize: s.fs,
							fontWeight: sel ? 600 : 500,
							cursor: 'pointer'
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
