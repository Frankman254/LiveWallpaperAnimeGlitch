import { useEffect, useMemo, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';
import type { SliderRange } from '@/types/controls';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function quantize(
	value: number,
	step: number,
	min: number,
	max: number
): number {
	const rounded = Math.round((value - min) / step) * step + min;
	return clamp(Number(rounded.toFixed(4)), min, max);
}

function formatValue(value: number, step: number): string {
	if (step >= 1) return String(Math.round(value));
	if (step >= 0.1) return value.toFixed(1);
	if (step >= 0.01) return value.toFixed(2);
	return value.toFixed(3);
}

function toLinearRatio(value: number, min: number, max: number): number {
	if (max <= min) return 0;
	return (clamp(value, min, max) - min) / (max - min);
}

function fromLinearRatio(ratio: number, min: number, max: number): number {
	return min + clamp(ratio, 0, 1) * (max - min);
}

function toLogRatio(value: number, min: number, max: number): number {
	const safeValue = clamp(value, min, max);
	return (
		(Math.log(safeValue) - Math.log(min)) /
		(Math.log(max) - Math.log(min))
	);
}

function fromLogRatio(ratio: number, min: number, max: number): number {
	return Math.exp(
		Math.log(min) + clamp(ratio, 0, 1) * (Math.log(max) - Math.log(min))
	);
}

type BgPreciseSliderControlProps = {
	label: string;
	value: number;
	range: SliderRange;
	onChange: (value: number) => void;
	resetValue: number;
	unit?: string;
	mode?: 'linear' | 'log';
};

export default function BgPreciseSliderControl({
	label,
	value,
	range,
	onChange,
	resetValue,
	unit,
	mode = 'linear'
}: BgPreciseSliderControlProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const [draftValue, setDraftValue] = useState(formatValue(value, range.step));
	const ratio = useMemo(() => {
		if (mode === 'log') {
			return toLogRatio(value, range.min, range.max);
		}
		return toLinearRatio(value, range.min, range.max);
	}, [mode, range.max, range.min, value]);
	const pct = ratio * 100;

	useEffect(() => {
		setDraftValue(formatValue(value, range.step));
	}, [range.step, value]);

	function commitRawValue(nextRaw: string) {
		const next = Number(nextRaw);
		if (!Number.isFinite(next)) {
			setDraftValue(formatValue(value, range.step));
			return;
		}
		const quantized = quantize(next, range.step, range.min, range.max);
		setDraftValue(formatValue(quantized, range.step));
		onChange(quantized);
	}

	function handleSliderChange(nextRatio: number) {
		const raw =
			mode === 'log'
				? fromLogRatio(nextRatio, range.min, range.max)
				: fromLinearRatio(nextRatio, range.min, range.max);
		onChange(quantize(raw, range.step, range.min, range.max));
	}

	function nudge(direction: -1 | 1) {
		onChange(
			quantize(
				value + direction * range.step,
				range.step,
				range.min,
				range.max
			)
		);
	}

	return (
		<div className="flex w-full min-w-0 flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					onClick={() => onChange(resetValue)}
					className={`min-w-0 truncate text-left text-[11px] transition-opacity hover:opacity-100 ${theme.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)', opacity: 0.95 }}
					title={`Reset ${label}`}
				>
					{label}
				</button>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => nudge(-1)}
						className="min-h-8 min-w-8 rounded border px-3 py-1 text-xs font-semibold transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)',
							background: 'var(--editor-surface-bg)'
						}}
						title={`Decrease ${label}`}
					>
						-
					</button>
					<input
						type="number"
						min={range.min}
						max={range.max}
						step={range.step}
						value={draftValue}
						onChange={event => setDraftValue(event.target.value)}
						onBlur={event => commitRawValue(event.target.value)}
						onKeyDown={event => {
							if (event.key === 'Enter') {
								event.currentTarget.blur();
							}
						}}
						className="h-8 w-20 rounded border px-1.5 py-0.5 text-right text-[11px] tabular-nums outline-none"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-elevated)',
							color: 'var(--editor-text-primary)'
						}}
					/>
					{unit ? (
						<span
							className={`text-[10px] ${theme.panelSubtle}`}
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{unit}
						</span>
					) : null}
					<button
						type="button"
						onClick={() => nudge(1)}
						className="min-h-8 min-w-8 rounded border px-3 py-1 text-xs font-semibold transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)',
							background: 'var(--editor-surface-bg)'
						}}
						title={`Increase ${label}`}
					>
						+
					</button>
				</div>
			</div>

			<div className="relative flex h-5 items-center">
				<div
					className="absolute h-[4px] w-full rounded-full opacity-25"
					style={{
						background:
							'var(--editor-accent-border, var(--editor-accent-soft))'
					}}
				/>
				<div
					className={`absolute h-[4px] rounded-full ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''
					}`}
					style={{
						width: `${pct}%`,
						background:
							editorTheme !== 'rainbow'
								? 'var(--editor-accent-color)'
								: undefined,
						boxShadow:
							editorTheme !== 'rainbow'
								? '0 0 6px var(--editor-accent-color)'
								: undefined
					}}
				/>
				<input
					type="range"
					min={0}
					max={1}
					step={0.001}
					value={ratio}
					onChange={event => handleSliderChange(Number(event.target.value))}
					className="absolute z-10 h-5 w-full cursor-pointer opacity-0"
				/>
				<div
					className={`pointer-events-none absolute z-20 h-3 w-3 rounded-full border-2 shadow ${
						editorTheme === 'rainbow'
							? 'editor-rgb-theme-active border-transparent'
							: 'bg-white'
					}`}
					style={{
						left: `calc(${pct}% - 6px)`,
						borderColor:
							editorTheme !== 'rainbow'
								? 'var(--editor-accent-color)'
								: undefined
					}}
				/>
			</div>
		</div>
	);
}
