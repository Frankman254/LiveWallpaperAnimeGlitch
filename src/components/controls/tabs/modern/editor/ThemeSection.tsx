import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { EditorTheme, ThemeColorSource } from '@/types/wallpaper';
import { SectionCard } from '@/ui';
import { OptionButtonGroup } from '../modernAdvancedControls';
import {
	ColorField,
	EDITOR_THEMES,
	THEME_COLOR_SOURCES
} from './editorTabHelpers';

export default function ThemeSection() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			editorTheme: s.editorTheme,
			editorThemeColorSource: s.editorThemeColorSource,
			editorManualAccentColor: s.editorManualAccentColor,
			editorManualSecondaryColor: s.editorManualSecondaryColor,
			editorManualBackdropColor: s.editorManualBackdropColor,
			editorManualTextPrimaryColor: s.editorManualTextPrimaryColor,
			editorManualTextSecondaryColor: s.editorManualTextSecondaryColor,
			setEditorTheme: s.setEditorTheme,
			setEditorThemeColorSource: s.setEditorThemeColorSource,
			setEditorManualAccentColor: s.setEditorManualAccentColor,
			setEditorManualSecondaryColor: s.setEditorManualSecondaryColor,
			setEditorManualBackdropColor: s.setEditorManualBackdropColor,
			setEditorManualTextPrimaryColor: s.setEditorManualTextPrimaryColor,
			setEditorManualTextSecondaryColor:
				s.setEditorManualTextSecondaryColor
		}))
	);

	const editorThemeLabels: Record<EditorTheme, string> = {
		cyber: 'Cyber',
		glass: 'Glass',
		sunset: 'Sunset',
		terminal: 'Terminal',
		midnight: 'Midnight',
		carbon: 'Carbon',
		aurora: 'Aurora',
		rose: 'Rose',
		ocean: 'Ocean',
		amber: 'Amber',
		rainbow: 'Rainbow'
	};
	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};

	return (
		<>
			<SectionCard title={t.label_editor_theme} density="compact">
				<OptionButtonGroup<EditorTheme>
					label={t.label_editor_theme}
					options={EDITOR_THEMES}
					value={store.editorTheme}
					onChange={store.setEditorTheme}
					labels={editorThemeLabels}
					columns={3}
				/>
				<OptionButtonGroup<ThemeColorSource>
					label={t.label_editor_theme_colors}
					options={THEME_COLOR_SOURCES}
					value={store.editorThemeColorSource}
					onChange={store.setEditorThemeColorSource}
					labels={themeColorSourceLabels}
					columns={3}
				/>
			</SectionCard>

			{store.editorThemeColorSource === 'manual' ? (
				<SectionCard title={t.label_manual_color} density="compact">
					<div className="grid gap-2 md:grid-cols-2">
						<ColorField
							label={t.label_primary_color}
							value={store.editorManualAccentColor}
							onChange={store.setEditorManualAccentColor}
						/>
						<ColorField
							label={t.label_secondary_color}
							value={store.editorManualSecondaryColor}
							onChange={store.setEditorManualSecondaryColor}
						/>
						<ColorField
							label={t.label_backdrop_color}
							value={store.editorManualBackdropColor}
							onChange={store.setEditorManualBackdropColor}
						/>
						<ColorField
							label={t.label_text_primary_color}
							value={store.editorManualTextPrimaryColor}
							onChange={store.setEditorManualTextPrimaryColor}
						/>
						<ColorField
							label={t.label_text_secondary_color}
							value={store.editorManualTextSecondaryColor}
							onChange={store.setEditorManualTextSecondaryColor}
						/>
					</div>
				</SectionCard>
			) : null}
		</>
	);
}
