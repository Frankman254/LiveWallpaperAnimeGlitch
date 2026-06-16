/**
 * Shared field renderers + constants reused across the ModernEditorTab
 * sub-panels (`EditorPanelSection`, `ThemeSection`, `AppearanceSection`,
 * `ResponsiveLayoutSection`, `QuickActionsSection`).
 *
 * Extracted from the original monolith so each sub-panel can stay focused
 * on its own store slice + presentation, while keeping the field primitives
 * consistent.
 */
import { UI_COLORS } from '@/ui';
import { SectionLabel } from '../modernAdvancedControls';
import type {
	ControlPanelAnchor,
	EditorImagePreviewQuality,
	EditorTheme,
	ThemeColorSource
} from '@/types/wallpaper';

export const PANEL_ANCHORS: ControlPanelAnchor[] = [
	'top-left',
	'top-right',
	'bottom-left',
	'bottom-right'
];

export const EDITOR_THEMES: EditorTheme[] = [
	'cyber',
	'glass',
	'sunset',
	'terminal',
	'midnight',
	'carbon',
	'aurora',
	'rose',
	'ocean',
	'amber',
	'rainbow'
];

export const THEME_COLOR_SOURCES: ThemeColorSource[] = [
	'manual',
	'theme',
	'image'
];

export const EDITOR_IMAGE_PREVIEW_QUALITIES: EditorImagePreviewQuality[] = [
	'optimized',
	'original'
];

export const UI_SCALE_PRESETS = [
	['Compact', 0.85],
	['Normal', 1],
	['Comfort', 1.15],
	['Large', 1.4],
	['XL', 1.7]
] as const;

export function formatDecimal(value: number, digits = 2) {
	return value.toFixed(digits);
}

export function formatPx(value: number) {
	return `${Math.round(value)}px`;
}

export function ColorField({
	label,
	value,
	onChange
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<label
			className="flex items-center gap-2 rounded-[var(--editor-radius-md)] border px-2 py-1.5"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<input
				type="color"
				value={value}
				onChange={event => onChange(event.target.value)}
				className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
			/>
			<div className="min-w-0 flex-1">
				<SectionLabel>{label}</SectionLabel>
				<input
					value={value}
					onChange={event => onChange(event.target.value)}
					className="w-full bg-transparent text-[12px] outline-none"
					style={{ color: UI_COLORS.fg }}
				/>
			</div>
		</label>
	);
}

export function ResolutionField({
	label,
	value,
	onChange,
	onCommit
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	onCommit: () => void;
}) {
	return (
		<label className="flex flex-col gap-1">
			<SectionLabel>{label}</SectionLabel>
			<input
				type="number"
				min={1}
				step={1}
				value={value}
				onChange={event => onChange(event.target.value)}
				onBlur={onCommit}
				onKeyDown={event => {
					if (event.key === 'Enter') event.currentTarget.blur();
				}}
				className="rounded border px-2 py-1 text-xs outline-none"
				style={{
					borderRadius: 'var(--editor-radius-md)',
					borderColor: UI_COLORS.border,
					background: UI_COLORS.raised,
					color: UI_COLORS.fg
				}}
			/>
		</label>
	);
}

export function MetricTile({ label, value }: { label: string; value: string }) {
	return (
		<div
			className="rounded-[var(--editor-radius-md)] border px-2.5 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<SectionLabel>{label}</SectionLabel>
			<div
				className="mt-1 text-xs font-medium"
				style={{ color: UI_COLORS.fg }}
			>
				{value}
			</div>
		</div>
	);
}
