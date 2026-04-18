import type { SliderControlProps } from '@/types/controls';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

function fmt(value: number, step: number): string {
	if (step >= 1) return String(Math.round(value));
	if (step >= 0.1) return value.toFixed(1);
	if (step >= 0.01) return value.toFixed(2);
	return value.toFixed(3);
}

export default function SliderControl({
	label,
	value,
	min,
	max,
	step,
	onChange,
	unit,
	tooltip,
	effectiveValue
}: SliderControlProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const displayValue = fmt(value, step);
	const isLimited = effectiveValue !== undefined && effectiveValue !== value;
	const pct = ((value - min) / (max - min)) * 100;

	return (
		<div className="flex items-center gap-2 min-w-0">
			{/* Label */}
			<span
				className={`shrink-0 w-24 text-[11px] truncate cursor-default select-none ${theme.sectionTitle}`}
				title={tooltip ?? label}
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{label}
				{tooltip && (
					<span
						className="ml-0.5 opacity-60"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						?
					</span>
				)}
			</span>

			{/* Track */}
			<div className="relative flex-1 flex items-center h-4 group/slider">
				<div
					className="absolute w-full h-[3px] rounded-full opacity-20 group-hover/slider:opacity-30 transition-opacity"
					style={{ background: 'var(--editor-accent-border, var(--editor-accent-soft))' }}
				/>
				<div
					className={`absolute h-[3px] rounded-full transition-[width] duration-75 ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''
					}`}
					style={{
						width: `${pct}%`,
						background: editorTheme !== 'rainbow' ? 'var(--editor-accent-color)' : undefined,
						boxShadow: editorTheme !== 'rainbow' ? '0 0 6px var(--editor-accent-color)' : undefined
					}}
				/>
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={e => onChange(parseFloat(e.target.value))}
					className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
				/>
				<div
					className={`absolute w-2.5 h-2.5 rounded-full border-2 transition-[left] duration-75 pointer-events-none z-20 shadow ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active border-transparent' : 'bg-white'
					}`}
					style={{
						left: `calc(${pct}% - 5px)`,
						borderColor: editorTheme !== 'rainbow' ? 'var(--editor-accent-color)' : undefined
					}}
				/>
			</div>

			{/* Value */}
			<span
				className={`shrink-0 w-12 text-right text-[11px] tabular-nums ${isLimited ? 'text-amber-400' : theme.panelSubtle}`}
				style={isLimited ? undefined : { color: 'var(--editor-accent-muted)' }}
				title={isLimited ? `set: ${displayValue}` : undefined}
			>
				{isLimited
					? `${fmt(effectiveValue!, step)}${unit ? unit : ''}`
					: `${displayValue}${unit ? unit : ''}`}
			</span>
		</div>
	);
}
