import type { ReactNode } from 'react';
import { ToggleSwitch, UI_COLORS, FONT } from '@/ui';

export function SectionLabel({ children }: { children: ReactNode }) {
	return (
		<span
			className="uppercase"
			style={{
				color: UI_COLORS.fgMute,
				fontFamily: FONT.mono,
				fontSize: 10,
				fontWeight: 650,
				letterSpacing: '0.1em'
			}}
		>
			{children}
		</span>
	);
}

export function InfoText({ children }: { children: ReactNode }) {
	return (
		<span className="text-[11px] leading-snug" style={{ color: UI_COLORS.fgMute }}>
			{children}
		</span>
	);
}

export function MetricBar({
	label,
	value
}: {
	label: string;
	value: number | undefined;
}) {
	const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[10px]" style={{ color: UI_COLORS.fgMute }}>
					{label}
				</span>
				<span
					className="tabular-nums text-[10px]"
					style={{ color: UI_COLORS.fgFaint, fontFamily: FONT.mono }}
				>
					{pct}%
				</span>
			</div>
			<div
				className="h-1.5 overflow-hidden rounded-full"
				style={{ background: UI_COLORS.overlay }}
			>
				<div
					className="h-full rounded-full"
					style={{
						width: `${pct}%`,
						background: UI_COLORS.accent
					}}
				/>
			</div>
		</div>
	);
}

export function StatusPill({
	label,
	tone = 'default'
}: {
	label: string;
	tone?: 'default' | 'active' | 'warn' | 'danger';
}) {
	const color =
		tone === 'active'
			? UI_COLORS.ok
			: tone === 'warn'
				? UI_COLORS.warn
				: tone === 'danger'
					? UI_COLORS.danger
					: UI_COLORS.fgMute;
	return (
		<span
			className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
			style={{
				color,
				borderColor:
					tone === 'active'
						? UI_COLORS.accentBorder
						: tone === 'warn'
							? UI_COLORS.warnBorder
							: tone === 'danger'
								? UI_COLORS.dangerBorder
								: UI_COLORS.border,
				background:
					tone === 'active'
						? UI_COLORS.accentSoft
						: tone === 'warn'
							? UI_COLORS.warnSoft
							: tone === 'danger'
								? UI_COLORS.dangerSoft
								: UI_COLORS.overlay,
				fontFamily: FONT.mono
			}}
		>
			{label}
		</span>
	);
}

export function ToggleRow({
	label,
	hint,
	checked,
	onChange
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<div className="min-w-0">
				<div className="text-[12px] font-medium" style={{ color: UI_COLORS.fg }}>
					{label}
				</div>
				{hint ? <InfoText>{hint}</InfoText> : null}
			</div>
			<ToggleSwitch
				checked={checked}
				onChange={onChange}
				size="sm"
				ariaLabel={label}
			/>
		</div>
	);
}
