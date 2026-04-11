import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { ThemeColorSource } from '@/types/wallpaper';
import ToggleControl from '../ToggleControl';
import SliderControl from '../SliderControl';
import EnumButtons from '../ui/EnumButtons';
import ResetButton from '../ui/ResetButton';
import TabSection from '../ui/TabSection';
import ColorInput from '../ui/ColorInput';

const THEME_COLOR_SOURCES: ThemeColorSource[] = [
	'manual',
	'theme',
	'background'
];

export default function QuickHudTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		background: t.label_current_image
	};

	return (
		<>
			<ToggleControl
				label={t.label_quick_actions_toggle}
				value={store.quickActionsEnabled}
				onChange={store.setQuickActionsEnabled}
				tooltip={t.hint_quick_actions}
			/>

			<TabSection
				title={t.section_quick_actions_layout}
				hint={t.hint_quick_actions}
			>
				{/* Normalized 0–1: 0 = left/top edge, 1 = right/bottom edge */}
				<SliderControl
					label={t.label_quick_actions_launcher_position_x}
					value={store.quickActionsLauncherPositionX}
					min={0}
					max={1}
					step={0.01}
					onChange={store.setQuickActionsLauncherPositionX}
				/>
				<SliderControl
					label={t.label_quick_actions_launcher_position_y}
					value={store.quickActionsLauncherPositionY}
					min={0}
					max={1}
					step={0.01}
					onChange={store.setQuickActionsLauncherPositionY}
				/>
				<SliderControl
					label={t.label_quick_actions_panel_position_x}
					value={store.quickActionsPositionX}
					min={0}
					max={1}
					step={0.01}
					onChange={store.setQuickActionsPositionX}
				/>
				<SliderControl
					label={t.label_quick_actions_panel_position_y}
					value={store.quickActionsPositionY}
					min={0}
					max={1}
					step={0.01}
					onChange={store.setQuickActionsPositionY}
				/>
			</TabSection>

			{/* Opacity and blur apply in all color-source modes — single source of truth */}
			<TabSection title={t.section_quick_actions_style}>
				<SliderControl
					label={t.label_quick_actions_opacity}
					value={store.quickActionsBackdropOpacity}
					min={0.06}
					max={0.9}
					step={0.01}
					onChange={store.setQuickActionsBackdropOpacity}
				/>
				<SliderControl
					label={t.label_quick_actions_blur}
					value={store.quickActionsBlurPx}
					min={0}
					max={48}
					step={1}
					unit="px"
					onChange={store.setQuickActionsBlurPx}
				/>
			</TabSection>

			<TabSection title={t.section_quick_actions_colors}>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_quick_actions_color_source}
					</span>
					<EnumButtons<ThemeColorSource>
						options={THEME_COLOR_SOURCES}
						value={store.quickActionsColorSource}
						onChange={store.setQuickActionsColorSource}
						labels={themeColorSourceLabels}
					/>
				</div>

				{store.quickActionsColorSource === 'manual' ? (
					<div
						className="grid gap-2 border p-2.5"
						style={{
							borderRadius: 'var(--editor-radius-md)',
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)'
						}}
					>
						<ColorInput
							label={t.label_primary_color}
							value={store.quickActionsManualAccentColor}
							onChange={store.setQuickActionsManualAccentColor}
						/>
						<ColorInput
							label={t.label_secondary_color}
							value={store.quickActionsManualSecondaryColor}
							onChange={store.setQuickActionsManualSecondaryColor}
						/>
						<ColorInput
							label={t.label_backdrop_color}
							value={store.quickActionsManualBackdropColor}
							onChange={store.setQuickActionsManualBackdropColor}
						/>
					</div>
				) : (
					<div
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{store.quickActionsColorSource === 'theme'
							? t.hint_theme_palette_auto
							: t.hint_background_palette_auto}
					</div>
				)}
			</TabSection>

			<ResetButton label={t.reset_tab} onClick={onReset} />
		</>
	);
}
