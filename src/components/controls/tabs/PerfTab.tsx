import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import type {
	ControlPanelAnchor,
	EditorTheme,
	PerformanceMode,
	ThemeColorSource
} from '@/types/wallpaper';
import { DEFAULT_STATE, PARTICLE_LIMITS } from '@/lib/constants';
import SectionDivider from '../ui/SectionDivider';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';
import SliderControl from '../SliderControl';
import CollapsibleSection from '../ui/CollapsibleSection';
import ColorInput from '../ui/ColorInput';
import TabSection from '../ui/TabSection';

const PERF_MODES: PerformanceMode[] = ['low', 'medium', 'high'];
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
	'aurora'
];
const THEME_COLOR_SOURCES: ThemeColorSource[] = [
	'manual',
	'theme',
	'background'
];

export default function PerfTab() {
	const t = useT();
	const store = useWallpaperStore();
	const {
		isFullscreen,
		fullscreenSupported,
		isMiniPlayerOpen,
		miniPlayerSupport,
		canExpandMiniPlayer,
		expandMiniPlayer,
		toggleFullscreen,
		toggleMiniPlayer
	} = useWindowPresentationControls();
	const limit = PARTICLE_LIMITS[store.performanceMode];
	const cappedCount = Math.min(store.particleCount, limit);
	const isCapped = store.particleCount > limit;
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
		aurora: 'Aurora'
	};
	const themeColorSourceLabels: Record<ThemeColorSource, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		background: t.label_current_image
	};
	const miniPlayerHint =
		miniPlayerSupport === 'document-pip'
			? t.hint_mini_player_document_pip
			: miniPlayerSupport === 'popup'
				? t.hint_mini_player_popup
				: t.hint_mini_player_unavailable;

	return (
		<>
			<div className="flex flex-col gap-2">
				<span
					className="text-xs uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_perf_mode}
				</span>
				<EnumButtons<PerformanceMode>
					options={PERF_MODES}
					value={store.performanceMode}
					onChange={store.setPerformanceMode}
				/>
				<div className="text-xs text-gray-500 space-y-0.5">
					<p>{t.hint_perf_low}</p>
					<p>{t.hint_perf_med}</p>
					<p>{t.hint_perf_high}</p>
				</div>
			</div>

			<SectionDivider label={t.section_editor_panel} />
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
			{store.editorThemeColorSource === 'manual' ? (
				<TabSection title={t.label_manual_color}>
					<span
						className="text-[10px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_global_color_shortcuts}
					</span>
					<div
						className="grid gap-2 rounded border p-2"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)'
						}}
					>
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
					</div>
				</TabSection>
			) : null}
			<div className="flex flex-col gap-1">
				<span
					className="text-xs uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_global_color_shortcuts}
				</span>
				<span
					className="text-[10px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.hint_global_color_shortcuts}
				</span>
				<EnumButtons<ThemeColorSource>
					options={THEME_COLOR_SOURCES}
					value={store.editorThemeColorSource}
					onChange={store.setAllUiColorSources}
					labels={themeColorSourceLabels}
				/>
			</div>

			<CollapsibleSection label={t.section_sleep_mode} defaultOpen={false}>
				<ToggleControl
					label={t.label_sleep_mode}
					value={store.sleepModeEnabled}
					onChange={store.setSleepModeEnabled}
				/>
				{store.sleepModeEnabled ? (
					<>
						<SliderControl
							label={t.label_sleep_delay}
							value={store.sleepModeDelaySeconds}
							min={10}
							max={180}
							step={5}
							unit="s"
							onChange={store.setSleepModeDelaySeconds}
						/>
						<p className="text-xs text-gray-500">{t.hint_sleep_mode}</p>
					</>
				) : null}
			</CollapsibleSection>

			<SectionDivider label={t.section_window_tools} />
			<div className="flex flex-col gap-1">
				<span
					className="text-xs uppercase tracking-widest"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_window_modes}
				</span>
				<span className="text-xs text-gray-500">{miniPlayerHint}</span>
			</div>
			<div className="flex gap-2">
				{fullscreenSupported ? (
					<button
						onClick={() => void toggleFullscreen()}
						className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
						style={{
							borderColor: 'var(--editor-button-border)',
							background: 'var(--editor-button-bg)',
							color: 'var(--editor-button-fg)'
						}}
					>
						{isFullscreen
							? t.label_exit_fullscreen
							: t.label_enter_fullscreen}
					</button>
				) : null}
				<button
					onClick={() => void toggleMiniPlayer()}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						borderColor: 'var(--editor-button-border)',
						background: 'var(--editor-button-bg)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{isMiniPlayerOpen
						? t.label_close_mini_player
						: t.label_open_mini_player}
				</button>
			</div>
			{isMiniPlayerOpen && canExpandMiniPlayer ? (
				<button
					onClick={() => void expandMiniPlayer()}
					className="w-full rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						borderColor: 'var(--editor-button-border)',
						background: 'var(--editor-button-bg)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_expand_mini_player}
				</button>
			) : null}

			{isCapped && (
				<div className="rounded border border-amber-800 bg-amber-950/30 px-3 py-2">
					<p className="text-xs text-amber-400">
						{t.label_count}: {store.particleCount} →{' '}
						{t.hint_effective} {cappedCount}
					</p>
				</div>
			)}

			<SectionDivider />
			<button
				onClick={store.reset}
				className="text-left text-xs text-red-400 transition-colors hover:text-red-300"
			>
				{t.reset_all}
			</button>
			<button
				onClick={() => {
					localStorage.removeItem('lwag-state');
					useWallpaperStore.setState({ ...DEFAULT_STATE });
				}}
				className="text-left text-xs text-orange-500 transition-colors hover:text-orange-400"
			>
				{t.clear_storage}
			</button>
		</>
	);
}
