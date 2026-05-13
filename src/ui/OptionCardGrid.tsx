import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS, FONT, GLOW } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type OptionCardItem<T extends string | number> = {
	value: T;
	label: ReactNode;
	icon?: ReactNode;
	description?: ReactNode;
	preview?: ReactNode;
	disabled?: boolean;
};

type OptionCardGridProps<T extends string | number> = {
	items: ReadonlyArray<OptionCardItem<T>>;
	value: T;
	onChange: (next: T) => void;
	columns?: number | 'auto';
	density?: 'default' | 'compact';
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

export default function OptionCardGrid<T extends string | number>({
	items,
	value,
	onChange,
	columns = 'auto',
	density = 'default',
	disabled = false,
	ariaLabel,
	className,
	style
}: OptionCardGridProps<T>) {
	const isDense = density === 'compact';

	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			className={cn('grid min-w-0', className)}
			style={{
				gap: isDense ? 6 : 10,
				gridTemplateColumns:
					columns === 'auto'
						? `repeat(auto-fit, minmax(${isDense ? 98 : 132}px, 1fr))`
						: `repeat(${columns}, minmax(0, 1fr))`,
				...style
			}}
		>
			{items.map(item => {
				const active = item.value === value;
				const itemDisabled = disabled || item.disabled;

				return (
					<button
						key={String(item.value)}
						type="button"
						role="radio"
						aria-checked={active}
						disabled={itemDisabled}
						onClick={() => onChange(item.value)}
						className="group flex min-w-0 flex-col overflow-hidden text-left disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							minHeight: isDense ? 70 : 96,
							borderRadius: 'var(--editor-radius-lg)',
							border: `1px solid ${
								active ? UI_COLORS.accentBorder : UI_COLORS.border
							}`,
							background: active
								? `linear-gradient(180deg, ${UI_COLORS.accentSoft}, ${UI_COLORS.raised})`
								: UI_COLORS.raised,
							color: active ? UI_COLORS.fg : UI_COLORS.fgMute,
							boxShadow: active
								? GLOW.sm
								: `inset 0 1px 0 ${UI_COLORS.sheen}`,
							transition: transition('background, border-color, color, box-shadow, transform')
						}}
					>
						<div
							className="grid place-items-center"
							style={{
								minHeight: isDense ? 40 : 58,
								margin: isDense ? 6 : 10,
								marginBottom: isDense ? 5 : 8,
								borderRadius: 'var(--editor-radius-md)',
								background: active
									? `linear-gradient(135deg, ${UI_COLORS.accentSoft}, ${UI_COLORS.sheen})`
									: UI_COLORS.sheenSoft,
								color: active ? UI_COLORS.accent : UI_COLORS.fg,
								border: `1px solid ${active ? UI_COLORS.accentBorder : UI_COLORS.hairline}`
							}}
						>
							{item.preview ?? item.icon ?? null}
						</div>
						<div
							className="min-w-0"
							style={{
								padding: isDense ? '0 8px 8px' : '0 12px 12px'
							}}
						>
							<div
								className="truncate"
								style={{
									fontSize: isDense ? 12 : 13,
									fontWeight: 650,
									lineHeight: 1.1,
									color: active ? UI_COLORS.accent : UI_COLORS.fg
								}}
							>
								{item.label}
							</div>
							{item.description ? (
								<div
									className="mt-1 line-clamp-2"
									style={{
										fontFamily: FONT.ui,
										fontSize: isDense ? 10 : 11,
										lineHeight: 1.2,
										color: UI_COLORS.fgMute
									}}
								>
									{item.description}
								</div>
							) : null}
						</div>
					</button>
				);
			})}
		</div>
	);
}
