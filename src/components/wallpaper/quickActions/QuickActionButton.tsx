import { memo, type ReactNode } from 'react';

export type QuickActionButtonProps = {
	label: string;
	title: string;
	icon?: ReactNode;
	active?: boolean;
	emphasis?: boolean;
	disabled?: boolean;
	small?: boolean;
	isRainbow?: boolean;
	onClick: () => void;
};

function QuickActionButton({
	label,
	title,
	icon,
	active = false,
	emphasis = false,
	disabled = false,
	small = false,
	isRainbow = false,
	onClick
}: QuickActionButtonProps) {
	const rainbowLit = isRainbow && (active || emphasis);
	const isActive = active || emphasis;

	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			aria-label={title}
			disabled={disabled}
			className={`inline-flex items-center justify-center gap-1.5 border font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-150 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${
				small
					? 'h-7 px-2 text-[10px]'
					: 'h-8 px-2.5 text-[11px]'
			} ${rainbowLit ? 'editor-rgb-theme-active' : ''}`}
			style={{
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: rainbowLit
					? 'transparent'
					: isActive
						? 'var(--editor-accent-color)'
						: 'color-mix(in srgb, var(--editor-tag-border) 70%, transparent)',
				background: rainbowLit
					? undefined
					: isActive
						? 'color-mix(in srgb, var(--editor-active-bg) 70%, transparent)'
						: 'color-mix(in srgb, var(--editor-tag-bg) 55%, transparent)',
				color: rainbowLit
					? '#08080e'
					: isActive
						? 'var(--editor-active-fg)'
						: 'var(--editor-tag-fg)',
				backdropFilter: rainbowLit ? undefined : 'blur(6px)',
				WebkitBackdropFilter: rainbowLit ? undefined : 'blur(6px)',
				boxShadow:
					emphasis && !rainbowLit
						? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent)'
						: 'none'
			}}
		>
			{icon ? (
				<span className="inline-flex shrink-0 items-center justify-center">
					{icon}
				</span>
			) : null}
			<span>{label}</span>
		</button>
	);
}

export default memo(QuickActionButton);
