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

	return (
		<div className="flex flex-col gap-0.5">
			<div className="flex items-center justify-between text-[11px]">
				<span
					className={`cursor-default ${theme.sectionTitle}`}
					title={tooltip}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{label}
					{tooltip && (
						<span
							className={`ml-0.5 ${theme.panelSubtle}`}
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							?
						</span>
					)}
				</span>
				<span
					className={isLimited ? 'text-amber-400' : theme.panelSubtle}
					style={
						isLimited
							? undefined
							: { color: 'var(--editor-accent-muted)' }
					}
				>
					{isLimited
						? `${fmt(effectiveValue!, step)}${unit ? ' ' + unit : ''} (set: ${displayValue})`
						: `${displayValue}${unit ? ' ' + unit : ''}`}
				</span>
			</div>
			<div className="relative flex items-center h-4 mt-2 group/slider">
				{/* Background track */}
				<div 
					className="absolute w-full h-1 rounded-full opacity-20 transition-opacity group-hover/slider:opacity-30" 
					style={{ background: 'var(--editor-accent-soft)' }}
				/>
				{/* Active progress track */}
				<div
					className={`absolute h-1 rounded-full transition-all duration-150 ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''
					}`}
					style={{
						width: `${((value - min) / (max - min)) * 100}%`,
						background: editorTheme !== 'rainbow' ? 'var(--editor-accent-color)' : undefined,
						boxShadow: editorTheme !== 'rainbow' ? '0 0 8px var(--editor-accent-color)' : undefined
					}}
				/>
				{/* Transparent native range for input handling */}
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={e => onChange(parseFloat(e.target.value))}
					className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
				/>
				{/* Custom handle */}
				<div
					className={`absolute w-3 h-3 rounded-full border-2 transition-all duration-150 pointer-events-none z-20 shadow-lg ${
						editorTheme === 'rainbow' ? 'editor-rgb-theme-active border-transparent' : 'bg-white'
					}`}
					style={{
						left: `calc(${((value - min) / (max - min)) * 100}% - 6px)`,
						borderColor: editorTheme !== 'rainbow' ? 'var(--editor-accent-color)' : undefined
					}}
				/>
			</div>
		</div>
	);
}
