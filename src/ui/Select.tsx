import { useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { UI_COLORS, ICON_SIZE, TYPE } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';
import { FOCUS_RING } from './lib/focusRing';
import FloatingPanel from './FloatingPanel';

export type SelectOption<T extends string | number> = {
	value: T;
	label: ReactNode;
	icon?: ReactNode;
	hint?: ReactNode;
	disabled?: boolean;
};

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectDensity = 'default' | 'compact';

type SelectProps<T extends string | number> = {
	value: T | null;
	onChange: (next: T) => void;
	options: ReadonlyArray<SelectOption<T>>;
	placeholder?: string;
	size?: SelectSize;
	density?: SelectDensity;
	full?: boolean;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

const SIZE_SPEC: Record<SelectSize, { h: number; fs: number }> = {
	sm: { h: 28, fs: 12 },
	md: { h: 32, fs: 13 },
	lg: { h: 38, fs: 14 }
};

const COMPACT_SIZE_SPEC: Record<SelectSize, { h: number; fs: number }> = {
	sm: { h: 24, fs: 11 },
	md: { h: 28, fs: 12 },
	lg: { h: 34, fs: 13 }
};

export default function Select<T extends string | number>({
	value,
	onChange,
	options,
	placeholder = 'Select…',
	size = 'md',
	density = 'default',
	full = false,
	disabled = false,
	ariaLabel,
	className,
	style
}: SelectProps<T>) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const spec =
		density === 'compact' ? COMPACT_SIZE_SPEC[size] : SIZE_SPEC[size];
	const current = options.find(o => o.value === value);

	return (
		<div
			ref={rootRef}
			className={cn('relative', full && 'w-full', className)}
			style={style}
		>
			<button
				type="button"
				role="combobox"
				aria-expanded={open}
				aria-label={ariaLabel}
				disabled={disabled}
				onClick={() => setOpen(v => !v)}
				className={cn(
					'inline-flex items-center justify-between gap-2 rounded-[var(--editor-radius-md)] text-left disabled:cursor-not-allowed disabled:opacity-40',
					FOCUS_RING,
					full && 'w-full'
				)}
				style={{
					height: spec.h,
					padding:
						density === 'compact' ? '0 4px 0 8px' : '0 6px 0 12px',
					background: open
						? UI_COLORS.accentSoft
						: UI_COLORS.raisedGradient,
					color: UI_COLORS.fg,
					border: `1px solid ${open ? UI_COLORS.accent : UI_COLORS.border}`,
					borderRadius: 'var(--editor-radius-md)',
					fontSize: spec.fs,
					boxShadow: open
						? UI_COLORS.focusRing
						: 'inset 0 1px 0 rgba(255,255,255,0.025)',
					transition: transition(
						'background, border-color, box-shadow'
					)
				}}
			>
				<span
					className="inline-flex items-center gap-2 min-w-0 truncate"
					style={{
						color: current ? UI_COLORS.fg : UI_COLORS.fgFaint
					}}
				>
					{current?.icon}
					{current?.label ?? placeholder}
				</span>
				<span
					className="inline-flex items-center justify-center shrink-0"
					style={{
						width: density === 'compact' ? 18 : 22,
						height: density === 'compact' ? 18 : 22,
						borderRadius: 'var(--editor-radius-sm)',
						background: open ? UI_COLORS.accent : UI_COLORS.overlay,
						color: open ? UI_COLORS.accentFg : UI_COLORS.fgMute,
						transition: transition('background, color')
					}}
				>
					<ChevronDown
						size={ICON_SIZE.sm}
						style={{
							transform: open ? 'rotate(180deg)' : 'none',
							transition: transition('transform')
						}}
					/>
				</span>
			</button>
			<FloatingPanel
				open={open}
				onClose={() => setOpen(false)}
				anchor="bottom"
				offset={6}
				style={{
					padding: density === 'compact' ? 3 : 4,
					maxHeight: 280,
					overflowY: 'auto'
				}}
			>
				<div role="listbox" className="flex flex-col">
					{options.map(opt => {
						const sel = opt.value === value;
						const optDisabled = opt.disabled === true;
						return (
							<button
								key={String(opt.value)}
								type="button"
								role="option"
								aria-selected={sel}
								aria-disabled={optDisabled}
								disabled={optDisabled}
								onClick={() => {
									if (optDisabled) return;
									onChange(opt.value);
									setOpen(false);
								}}
								className="flex items-center gap-2.5 text-left disabled:cursor-not-allowed"
								style={{
									width: '100%',
									height: density === 'compact' ? 28 : 34,
									padding:
										density === 'compact'
											? '0 8px'
											: '0 10px',
									background: sel
										? UI_COLORS.accentSoft
										: 'transparent',
									color: optDisabled
										? UI_COLORS.fgFaint
										: sel
											? UI_COLORS.accent
											: UI_COLORS.fg,
									border: 0,
									borderRadius: 'var(--editor-radius-sm)',
									fontSize: spec.fs,
									opacity: optDisabled ? 0.55 : 1
								}}
							>
								<span
									aria-hidden
									style={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										background: sel
											? UI_COLORS.accent
											: 'transparent',
										flexShrink: 0
									}}
								/>
								{opt.icon}
								<span className="flex-1 truncate">
									{opt.label}
								</span>
								{opt.hint ? (
									<span
										style={{
											color: UI_COLORS.fgFaint,
											fontSize: TYPE.caption
										}}
									>
										{opt.hint}
									</span>
								) : null}
							</button>
						);
					})}
				</div>
			</FloatingPanel>
		</div>
	);
}
