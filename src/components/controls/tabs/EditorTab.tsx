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
	'rainbow'
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
		rainbow: 'Rainbow'
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
				{store.showFps && (
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
				)}
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
				</TabSection>
			) : null}

			<TabSection title="Appearance">
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
					min={0.01}
					max={0.96}
					step={0.01}
					onChange={store.setEditorManualSurfaceOpacity}
				/>
				<SliderControl
					label="Item Opacity"
					value={store.editorManualItemOpacity}
					min={0.01}
					max={0.96}
					step={0.01}
					onChange={store.setEditorManualItemOpacity}
					tooltip="Opacity for buttons, tabs, and interactive elements"
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

			<TabSection title={t.label_global_color_shortcuts}>
				<span
					className="text-[11px] leading-snug"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.hint_global_color_shortcuts}
				</span>
				<div className="flex flex-wrap gap-1.5">
					{THEME_COLOR_SOURCES.map(source => {
						const isActive = source === globalShortcutSummary;
						return (
							<button
								key={source}
								type="button"
								onClick={() => store.setAllUiColorSources(source)}
								className={`relative border px-3 py-1 text-[11px] transition-all duration-300 hover:-translate-y-0.5 shadow-sm font-medium ${
									isActive ? 'scale-[1.05] editor-rgb-theme-active overflow-hidden' : ''
								}`}
								style={{
									borderRadius: 'var(--editor-radius-md)',
									background: isActive ? 'var(--editor-active-bg)' : 'var(--editor-tag-bg)',
									borderColor: isActive ? 'var(--editor-accent-color)' : 'var(--editor-tag-border)',
									color: isActive 
										? (store.editorTheme === 'rainbow' ? '#08080e' : 'var(--editor-active-fg)') 
										: 'var(--editor-tag-fg)',
									boxShadow: isActive ? '0 0 12px var(--editor-accent-color)' : 'none',
									zIndex: isActive ? 1 : 0
								}}
							>
								{isActive && (
									<div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
								)}
								<span className="relative z-10">{themeColorSourceLabels[source]}</span>
							</button>
						);
					})}
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

			<TabSection title={t.label_quick_actions_toggle}>
				<ToggleControl
					label={t.label_quick_actions_toggle}
					value={store.quickActionsEnabled}
					onChange={store.setQuickActionsEnabled}
					tooltip={t.hint_quick_actions}
				/>
			</TabSection>

			{store.quickActionsEnabled && (
				<>
					<TabSection
						title={t.section_quick_actions_layout}
						hint={t.hint_quick_actions}
					>
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
							max={0.99}
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

					<TabSection title={t.section_quick_actions_style}>
						<SliderControl
							label={t.label_quick_actions_opacity}
							value={store.quickActionsBackdropOpacity}
							min={0.08}
							max={0.96}
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
						<SliderControl
							label={t.label_surface_opacity}
							value={store.quickActionsManualSurfaceOpacity}
							min={0.01}
							max={0.96}
							step={0.01}
							onChange={store.setQuickActionsManualSurfaceOpacity}
						/>
						<SliderControl
							label="Item Opacity"
							value={store.quickActionsManualItemOpacity}
							min={0.01}
							max={0.96}
							step={0.01}
							onChange={store.setQuickActionsManualItemOpacity}
							tooltip="Opacity for buttons and interactive elements in Quick Actions"
						/>
						<SliderControl
							label={t.label_quick_actions_scale}
							value={store.quickActionsScale}
							min={0.5}
							max={1.5}
							step={0.05}
							onChange={store.setQuickActionsScale}
						/>
						<SliderControl
							label={t.label_quick_actions_launcher_size}
							value={store.quickActionsLauncherSize}
							min={32}
							max={96}
							step={4}
							unit="px"
							onChange={store.setQuickActionsLauncherSize}
						/>
					</TabSection>

					<TabSection title={t.section_quick_actions_colors}>
						<div
							className="text-[11px] leading-snug"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							HUD colors follow the editor color source and manual palette set above.
						</div>
					</TabSection>
				</>
			)}

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
