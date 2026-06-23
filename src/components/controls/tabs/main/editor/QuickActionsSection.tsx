import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { ThemeColorSource } from '@/types/wallpaper';
import { SectionCard, Slider } from '@/ui';
import { HintText, OptionButtonGroup, SwitchRow } from '../advancedControls';
import {
	ColorField,
	THEME_COLOR_SOURCES,
	formatDecimal,
	formatPx
} from './editorTabHelpers';

export default function QuickActionsSection() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			quickActionsEnabled: s.quickActionsEnabled,
			quickActionsLauncherPositionX: s.quickActionsLauncherPositionX,
			quickActionsLauncherPositionY: s.quickActionsLauncherPositionY,
			quickActionsPositionX: s.quickActionsPositionX,
			quickActionsPositionY: s.quickActionsPositionY,
			quickActionsBackdropOpacity: s.quickActionsBackdropOpacity,
			quickActionsBlurPx: s.quickActionsBlurPx,
			quickActionsManualSurfaceOpacity:
				s.quickActionsManualSurfaceOpacity,
			quickActionsManualItemOpacity: s.quickActionsManualItemOpacity,
			quickActionsScale: s.quickActionsScale,
			quickActionsLauncherSize: s.quickActionsLauncherSize,
			quickActionsColorSource: s.quickActionsColorSource,
			quickActionsManualAccentColor: s.quickActionsManualAccentColor,
			quickActionsManualSecondaryColor:
				s.quickActionsManualSecondaryColor,
			quickActionsManualBackdropColor: s.quickActionsManualBackdropColor,
			quickActionsManualTextPrimaryColor:
				s.quickActionsManualTextPrimaryColor,
			quickActionsManualTextSecondaryColor:
				s.quickActionsManualTextSecondaryColor,
			setQuickActionsEnabled: s.setQuickActionsEnabled,
			setQuickActionsLauncherPositionX:
				s.setQuickActionsLauncherPositionX,
			setQuickActionsLauncherPositionY:
				s.setQuickActionsLauncherPositionY,
			setQuickActionsPositionX: s.setQuickActionsPositionX,
			setQuickActionsPositionY: s.setQuickActionsPositionY,
			setQuickActionsBackdropOpacity: s.setQuickActionsBackdropOpacity,
			setQuickActionsBlurPx: s.setQuickActionsBlurPx,
			setQuickActionsManualSurfaceOpacity:
				s.setQuickActionsManualSurfaceOpacity,
			setQuickActionsManualItemOpacity:
				s.setQuickActionsManualItemOpacity,
			setQuickActionsScale: s.setQuickActionsScale,
			setQuickActionsLauncherSize: s.setQuickActionsLauncherSize,
			setQuickActionsColorSource: s.setQuickActionsColorSource,
			setQuickActionsManualAccentColor:
				s.setQuickActionsManualAccentColor,
			setQuickActionsManualSecondaryColor:
				s.setQuickActionsManualSecondaryColor,
			setQuickActionsManualBackdropColor:
				s.setQuickActionsManualBackdropColor,
			setQuickActionsManualTextPrimaryColor:
				s.setQuickActionsManualTextPrimaryColor,
			setQuickActionsManualTextSecondaryColor:
				s.setQuickActionsManualTextSecondaryColor
		}))
	);

	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};

	return (
		<>
			<SectionCard
				title={t.editor_section_quick_actions}
				density="compact"
			>
				<SwitchRow
					label={t.label_quick_actions_toggle}
					checked={store.quickActionsEnabled}
					onChange={store.setQuickActionsEnabled}
					hint={t.hint_quick_actions}
				/>
			</SectionCard>

			{store.quickActionsEnabled ? (
				<>
					<SectionCard
						title={t.section_quick_actions_layout}
						subtitle={t.hint_quick_actions}
						density="compact"
					>
						<Slider
							label={t.label_quick_actions_launcher_position_x}
							value={store.quickActionsLauncherPositionX}
							min={0}
							max={1}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsLauncherPositionX}
						/>
						<Slider
							label={t.label_quick_actions_launcher_position_y}
							value={store.quickActionsLauncherPositionY}
							min={0}
							max={0.99}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsLauncherPositionY}
						/>
						<Slider
							label={t.label_quick_actions_panel_position_x}
							value={store.quickActionsPositionX}
							min={0}
							max={1}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsPositionX}
						/>
						<Slider
							label={t.label_quick_actions_panel_position_y}
							value={store.quickActionsPositionY}
							min={0}
							max={1}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsPositionY}
						/>
					</SectionCard>

					<SectionCard
						title={t.section_quick_actions_style}
						density="compact"
					>
						<Slider
							label={t.label_quick_actions_opacity}
							value={store.quickActionsBackdropOpacity}
							min={0.08}
							max={0.96}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsBackdropOpacity}
						/>
						<Slider
							label={t.label_quick_actions_blur}
							value={store.quickActionsBlurPx}
							min={0}
							max={48}
							step={1}
							unit="px"
							variant="compact"
							formatValue={formatPx}
							onChange={store.setQuickActionsBlurPx}
						/>
						<Slider
							label={t.label_surface_opacity}
							value={store.quickActionsManualSurfaceOpacity}
							min={0.01}
							max={0.96}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsManualSurfaceOpacity}
						/>
						<Slider
							label="Item Opacity"
							value={store.quickActionsManualItemOpacity}
							min={0.01}
							max={0.96}
							step={0.01}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsManualItemOpacity}
						/>
						<Slider
							label={t.label_quick_actions_scale}
							value={store.quickActionsScale}
							min={0.5}
							max={1.5}
							step={0.05}
							variant="compact"
							formatValue={value => formatDecimal(value, 2)}
							onChange={store.setQuickActionsScale}
						/>
						<Slider
							label={t.label_quick_actions_launcher_size}
							value={store.quickActionsLauncherSize}
							min={32}
							max={96}
							step={4}
							unit="px"
							variant="compact"
							formatValue={formatPx}
							onChange={store.setQuickActionsLauncherSize}
						/>
					</SectionCard>

					<SectionCard
						title={t.section_quick_actions_colors}
						density="compact"
					>
						<OptionButtonGroup<ThemeColorSource>
							label={t.label_quick_actions_color_source}
							options={THEME_COLOR_SOURCES}
							value={store.quickActionsColorSource}
							onChange={store.setQuickActionsColorSource}
							labels={themeColorSourceLabels}
							columns={3}
						/>
						{store.quickActionsColorSource !== 'manual' ? (
							<HintText>
								Manual Quick HUD colors stay saved while Theme
								or Current Image is active.
							</HintText>
						) : null}
						<div className="grid gap-2 md:grid-cols-2">
							<ColorField
								label={t.label_primary_color}
								value={store.quickActionsManualAccentColor}
								onChange={
									store.setQuickActionsManualAccentColor
								}
							/>
							<ColorField
								label={t.label_secondary_color}
								value={store.quickActionsManualSecondaryColor}
								onChange={
									store.setQuickActionsManualSecondaryColor
								}
							/>
							<ColorField
								label={t.label_backdrop_color}
								value={store.quickActionsManualBackdropColor}
								onChange={
									store.setQuickActionsManualBackdropColor
								}
							/>
							<ColorField
								label={t.label_text_primary_color}
								value={store.quickActionsManualTextPrimaryColor}
								onChange={
									store.setQuickActionsManualTextPrimaryColor
								}
							/>
							<ColorField
								label={t.label_text_secondary_color}
								value={
									store.quickActionsManualTextSecondaryColor
								}
								onChange={
									store.setQuickActionsManualTextSecondaryColor
								}
							/>
						</div>
					</SectionCard>
				</>
			) : null}
		</>
	);
}
