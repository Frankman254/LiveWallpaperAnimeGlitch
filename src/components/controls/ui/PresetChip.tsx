import type { CSSProperties, ReactNode } from 'react';

type PresetChipProps = {
	label: ReactNode;
	active?: boolean;
	onClick?: () => void;
	color?: string;
	icon?: ReactNode;
	title?: string;
	disabled?: boolean;
	className?: string;
	style?: CSSProperties;
};

export default function PresetChip({
	label,
	active = false,
	onClick,
	color,
	icon,
	title,
	disabled = false,
	className = '',
	style
}: PresetChipProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			disabled={disabled}
			className={`flex min-w-[88px] flex-col items-start gap-1.5 p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
			style={{
				background: active
					? 'var(--editor-active-bg)'
					: 'var(--editor-tag-bg)',
				border: `1px solid ${active ? 'var(--editor-accent-color)' : 'var(--editor-tag-border)'}`,
				borderRadius: 'var(--editor-radius-md)',
				...style
			}}
		>
			<div
				className="flex w-full items-center justify-center"
				style={{
					aspectRatio: '16 / 9',
					background:
						color ??
						'linear-gradient(135deg, color-mix(in srgb, var(--lwag-accent) 22%, transparent), color-mix(in srgb, var(--lwag-accent) 10%, transparent))',
					borderRadius: 'var(--editor-radius-sm)',
					color: 'var(--editor-accent-fg)'
				}}
			>
				{icon}
			</div>
			<span
				className="text-[11px] font-medium"
				style={{
					color: active ? 'var(--editor-active-fg)' : 'var(--editor-accent-fg)'
				}}
			>
				{label}
			</span>
		</button>
	);
}
