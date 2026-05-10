import { useEffect, useMemo, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';
import type { SliderRange } from '@/types/controls';

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function quantize(value: number, step: number, min: number, max: number): number {
	const rounded = Math.round((value - min) / step) * step + min;
	return clamp(Number(rounded.toFixed(4)), min, max);
}

function toRatio(value: number, min: number, max: number): number {
	const safeValue = clamp(value, min, max);
	return (
		(Math.log(safeValue) - Math.log(min)) /
		(Math.log(max) - Math.log(min))
	);
}

function fromRatio(ratio: number, min: number, max: number): number {
	return Math.exp(Math.log(min) + clamp(ratio, 0, 1) * (Math.log(max) - Math.log(min)));
}

type BgScaleControlProps = {
	label: string;
	value: number;
	range: SliderRange;
	onChange: (value: number) => void;
};

export default function BgScaleControl({
	label,
	value,
	range,
	onChange
}: BgScaleControlProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const [draftValue, setDraftValue] = useState(value.toFixed(2));
	const pct = useMemo(
		() => toRatio(value, range.min, range.max) * 100,
		[value, range.max, range.min]
	);

	useEffect(() => {
		setDraftValue(value.toFixed(2));
	}, [value]);

	function commitNumericValue(nextRaw: string) {
		const next = Number(nextRaw);
		if (!Number.isFinite(next)) {
			setDraftValue(value.toFixed(2));
			return;
		}
		const quantized = quantize(next, range.step, range.min, range.max);
		setDraftValue(quantized.toFixed(2));
		onChange(quantized);
	}

	function nudge(direction: -1 | 1) {
		const next = quantize(
			value + direction * range.step,
			range.step,
			range.min,
			range.max
		);
		onChange(next);
	}

	return (
		<div className="flex w-full min-w-0 flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<span
					className={`min-w-0 truncate text-[11px] ${theme.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{label}
				</span>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						onClick={() => nudge(-1)}
						className="rounded border px-2 py-0.5 text-[10px] transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)',
							background: 'var(--editor-surface-bg)'
						}}
						title="Decrease scale"
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
						onBlur={event => commitNumericValue(event.target.value)}
						onKeyDown={event => {
							if (event.key === 'Enter') {
								event.currentTarget.blur();
							}
						}}
						className="w-16 rounded border px-1.5 py-0.5 text-right text-[11px] tabular-nums outline-none"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-elevated)',
							color: 'var(--editor-text-primary)'
						}}
					/>
					<button
						type="button"
						onClick={() => nudge(1)}
						className="rounded border px-2 py-0.5 text-[10px] transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)',
							background: 'var(--editor-surface-bg)'
						}}
						title="Increase scale"
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
					value={toRatio(value, range.min, range.max)}
					onChange={event => {
						const next = quantize(
							fromRatio(Number(event.target.value), range.min, range.max),
							range.step,
							range.min,
							range.max
						);
						onChange(next);
					}}
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

			<div
				className={`flex justify-between text-[10px] ${theme.panelSubtle}`}
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				<span>{range.min.toFixed(2)}</span>
				<span>1.00</span>
				<span>{range.max.toFixed(2)}</span>
			</div>
		</div>
	);
}
