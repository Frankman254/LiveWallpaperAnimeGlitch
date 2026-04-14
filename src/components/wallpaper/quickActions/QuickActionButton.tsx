import { memo } from 'react';

export type QuickActionButtonProps = {
	label: string;
	title: string;
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
	active = false,
	emphasis = false,
	disabled = false,
	small = false,
	isRainbow = false,
	onClick
}: QuickActionButtonProps) {
	const rainbowLit = isRainbow && (active || emphasis);

	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			aria-label={title}
			disabled={disabled}
			className={`flex items-center justify-center border font-semibold uppercase tracking-[0.14em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${
				small
					? 'h-8 min-w-[52px] px-2 text-[10px]'
					: 'h-11 min-w-[60px] px-3 text-[11px]'
			} ${rainbowLit ? 'editor-rgb-theme-active' : ''}`}
			style={{
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: active
					? 'var(--editor-button-border)'
					: 'color-mix(in srgb, var(--editor-shell-border) 72%, transparent)',
				background: rainbowLit
					? undefined
					: emphasis
						? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, white 5%), color-mix(in srgb, var(--editor-shell-bg) 84%, transparent))'
						: active
							? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 84%, white 3%), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
							: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
				color: rainbowLit
					? '#08080e'
					: emphasis
						? 'var(--editor-active-fg)'
						: active
							? 'var(--editor-accent-soft)'
							: 'color-mix(in srgb, var(--editor-accent-soft) 82%, white)',
				boxShadow:
					emphasis && !rainbowLit
						? '0 10px 26px color-mix(in srgb, var(--editor-accent-color) 24%, transparent)'
						: 'none'
			}}
		>
			{label}
		</button>
	);
}

export default memo(QuickActionButton);
