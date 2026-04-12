import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type {
	ControlPanelAnchor,
	EditorTheme,
	ThemeColorSource
} from '@/types/wallpaper';
import EnumButtons from '../ui/EnumButtons';
import SliderControl from '../SliderControl';
import ColorInput from '../ui/ColorInput';
import TabSection from '../ui/TabSection';
import ToggleControl from '../ToggleControl';

const PANEL_ANCHORS: ControlPanelAnchor[] = [
	'top-left',
	'top-right',
	'bottom-left',
	'bottom-right'
];
const EDITOR_THEMES: EditorTheme[] = [
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
	'rotate-rgb'
];
const THEME_COLOR_SOURCES: ThemeColorSource[] = [
	'manual',
	'theme',
	'background'
];

export default function EditorTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const panelAnchorLabels: Record<ControlPanelAnchor, string> = {
		'top-left': t.corner_top_left,
		'top-right': t.corner_top_right,
		'bottom-left': t.corner_bottom_left,
		'bottom-right': t.corner_bottom_right
	};
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
		'rotate-rgb': 'Rotate RGB'
	};
	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		background: t.label_current_image
	};
	const sharedUiColorSources: ThemeColorSource[] = [
		store.editorThemeColorSource,
		store.quickActionsColorSource,
		store.spectrumColorSource,
		store.spectrumCloneColorSource,
		store.logoGlowColorSource,
		store.logoShadowColorSource,
		store.logoBackdropColorSource,
		store.particleColorSource,
		store.rainColorSource,
		store.audioTrackTitleTextColorSource,
		store.audioTrackTitleStrokeColorSource,
		store.audioTrackTitleGlowColorSource,
		store.audioTrackTitleBackdropColorSource,
		store.audioTrackTimeTextColorSource,
		store.audioTrackTimeStrokeColorSource,
		store.audioTrackTimeGlowColorSource
	];
	const globalShortcutSummary = THEME_COLOR_SOURCES.find(source =>
		sharedUiColorSources.every(candidate => candidate === source)
	);

	return (
		<div className="flex flex-col gap-2.5">
			<TabSection title={t.section_editor_panel}>
				<ToggleControl
					label={t.label_show_fps}
					value={store.showFps}
					onChange={store.setShowFps}
				/>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_fps_corner}
					</span>
					<EnumButtons<ControlPanelAnchor>
						options={PANEL_ANCHORS}
						value={store.fpsOverlayAnchor}
						onChange={store.setFpsOverlayAnchor}
						labels={panelAnchorLabels}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_panel_corner}
					</span>
					<EnumButtons<ControlPanelAnchor>
						options={PANEL_ANCHORS}
						value={store.controlPanelAnchor}
						onChange={store.setControlPanelAnchor}
						labels={panelAnchorLabels}
					/>
				</div>
				<SliderControl
					label={t.label_editor_corner_radius}
					value={store.editorCornerRadius}
					min={2}
					max={24}
					step={1}
					unit="px"
					tooltip={t.hint_editor_corner_radius}
					onChange={store.setEditorCornerRadius}
				/>
			</TabSection>

			<TabSection title={t.label_editor_theme}>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_editor_theme}
					</span>
					<EnumButtons<EditorTheme>
						options={EDITOR_THEMES}
						value={store.editorTheme}
						onChange={store.setEditorTheme}
						labels={editorThemeLabels}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs uppercase tracking-widest"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_editor_theme_colors}
					</span>
					<EnumButtons<ThemeColorSource>
						options={THEME_COLOR_SOURCES}
						value={store.editorThemeColorSource}
						onChange={store.setEditorThemeColorSource}
						labels={themeColorSourceLabels}
					/>
				</div>
			</TabSection>

			{store.editorThemeColorSource === 'manual' ? (
				<TabSection title={t.label_manual_color}>
					<ColorInput
						label={t.label_primary_color}
						value={store.editorManualAccentColor}
						onChange={store.setEditorManualAccentColor}
					/>
					<ColorInput
						label={t.label_secondary_color}
						value={store.editorManualSecondaryColor}
						onChange={store.setEditorManualSecondaryColor}
					/>
					<ColorInput
						label={t.label_backdrop_color}
						value={store.editorManualBackdropColor}
						onChange={store.setEditorManualBackdropColor}
					/>
					<ColorInput
						label={t.label_text_primary_color}
						value={store.editorManualTextPrimaryColor}
						onChange={store.setEditorManualTextPrimaryColor}
					/>
					<ColorInput
						label={t.label_text_secondary_color}
						value={store.editorManualTextSecondaryColor}
						onChange={store.setEditorManualTextSecondaryColor}
					/>
					<SliderControl
						label={t.label_backdrop_opacity}
						value={store.editorManualBackdropOpacity}
						min={0.08}
						max={0.98}
						step={0.01}
						onChange={store.setEditorManualBackdropOpacity}
					/>
					<SliderControl
						label={t.label_surface_opacity}
						value={store.editorManualSurfaceOpacity}
						min={0.08}
						max={0.96}
						step={0.01}
						onChange={store.setEditorManualSurfaceOpacity}
					/>
					<SliderControl
						label={t.label_blur}
						value={store.editorManualBlurPx}
						min={0}
						max={42}
						step={1}
						unit="px"
						onChange={store.setEditorManualBlurPx}
					/>
				</TabSection>
			) : null}

			<TabSection title={t.label_global_color_shortcuts}>
				<span
					className="text-[11px] leading-snug"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.hint_global_color_shortcuts}
				</span>
				<div className="flex flex-wrap gap-1.5">
					{THEME_COLOR_SOURCES.map(source => (
						<button
							key={source}
							type="button"
							onClick={() => store.setAllUiColorSources(source)}
							className="border px-2.5 py-1 text-[11px] transition-all duration-200 hover:-translate-y-0.5"
							style={{
								borderRadius: 'var(--editor-radius-md)',
								background: 'var(--editor-tag-bg)',
								borderColor: 'var(--editor-tag-border)',
								color: 'var(--editor-tag-fg)'
							}}
						>
							{themeColorSourceLabels[source]}
						</button>
					))}
				</div>
				<div
					className="text-[10px] uppercase tracking-[0.18em]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.label_current_state}:{' '}
					<span style={{ color: 'var(--editor-accent-soft)' }}>
						{globalShortcutSummary
							? themeColorSourceLabels[globalShortcutSummary]
							: t.label_mixed}
					</span>
				</div>
			</TabSection>

			<button
				type="button"
				onClick={onReset}
				className="text-left text-xs transition-colors"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{t.reset_tab}
			</button>
		</div>
	);
}
