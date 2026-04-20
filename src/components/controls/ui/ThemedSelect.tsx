import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ICON_SIZE } from './designTokens';

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

/**
 * Lightweight themed select with a popover list that uses the editor
 * scrollbar styling (`editor-scroll`). Native <select> popups cannot be
 * styled, so we render our own list to stay in sync with the theme.
 */
export default function ThemedSelect<TValue extends string | number>({
	value,
	onChange,
	options,
	placeholder = '— None —',
	ariaLabel,
	disabled = false,
	className = ''
}: ThemedSelectProps<TValue>) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const listRef = useRef<HTMLUListElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const handlePointer = (event: PointerEvent) => {
			if (!rootRef.current) return;
			if (rootRef.current.contains(event.target as Node)) return;
			setOpen(false);
		};
		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setOpen(false);
		};
		window.addEventListener('pointerdown', handlePointer);
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener('pointerdown', handlePointer);
			window.removeEventListener('keydown', handleKey);
		};
	}, [open]);

	useEffect(() => {
		if (!open || !listRef.current) return;
		const active = listRef.current.querySelector<HTMLElement>(
			'[data-active="true"]'
		);
		active?.scrollIntoView({ block: 'nearest' });
	}, [open]);

	const selected = options.find(o => o.value === value) ?? null;

	return (
		<div
			ref={rootRef}
			className={`relative ${className}`}
			aria-label={ariaLabel}
		>
			<button
				type="button"
				disabled={disabled}
				onClick={() => setOpen(prev => !prev)}
				className="flex w-full items-center justify-between gap-1 truncate rounded border px-1.5 py-0.5 text-left text-[10px] outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-40"
				style={{
					borderColor: open
						? 'var(--editor-accent-color)'
						: 'var(--editor-accent-border)',
					background: 'var(--editor-bg)',
					color: selected
						? 'var(--editor-accent-fg)'
						: 'var(--editor-accent-muted)'
				}}
			>
				<span className="min-w-0 flex-1 truncate">
					{selected ? selected.label : placeholder}
				</span>
				<ChevronDown
					aria-hidden
					size={ICON_SIZE.xs}
					className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
					style={{ color: 'var(--editor-accent-muted)' }}
				/>
			</button>
			{open ? (
				<ul
					ref={listRef}
					className="editor-scroll absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded border py-0.5 shadow-lg"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-bg)'
					}}
					role="listbox"
				>
					<li
						role="option"
						aria-selected={value === null}
						data-active={value === null}
						onClick={() => {
							onChange(null);
							setOpen(false);
						}}
						className="cursor-pointer truncate px-2 py-1 text-[10px] transition-colors"
						style={{
							color:
								value === null
									? 'var(--editor-accent-fg)'
									: 'var(--editor-accent-muted)',
							background:
								value === null
									? 'var(--editor-tag-bg)'
									: 'transparent'
						}}
						onMouseEnter={e => {
							if (value !== null)
								e.currentTarget.style.background =
									'var(--editor-tag-bg)';
						}}
						onMouseLeave={e => {
							if (value !== null)
								e.currentTarget.style.background = 'transparent';
						}}
					>
						{placeholder}
					</li>
					{options.map(option => {
						const isActive = option.value === value;
						return (
							<li
								key={String(option.value)}
								role="option"
								aria-selected={isActive}
								data-active={isActive}
								onClick={() => {
									onChange(option.value);
									setOpen(false);
								}}
								className="cursor-pointer truncate px-2 py-1 text-[10px] transition-colors"
								style={{
									color: isActive
										? 'var(--editor-accent-fg)'
										: 'var(--editor-accent-soft)',
									background: isActive
										? 'var(--editor-tag-bg)'
										: 'transparent'
								}}
								onMouseEnter={e => {
									if (!isActive)
										e.currentTarget.style.background =
											'var(--editor-tag-bg)';
								}}
								onMouseLeave={e => {
									if (!isActive)
										e.currentTarget.style.background =
											'transparent';
								}}
							>
								{option.label}
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
}
