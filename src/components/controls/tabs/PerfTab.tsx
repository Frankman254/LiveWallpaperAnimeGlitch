import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import type {
	ControlPanelAnchor,
	EditorTheme,
	PerformanceMode
} from '@/types/wallpaper';
import { DEFAULT_STATE, PARTICLE_LIMITS } from '@/lib/constants';
import SectionDivider from '../ui/SectionDivider';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';

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

export default function PerfTab() {
	const t = useT();
	const store = useWallpaperStore();
	const {
		isFullscreen,
		fullscreenSupported,
		isMiniPlayerOpen,
		isStudyModeOpen,
		miniPlayerSupport,
		studyModeSupport,
		canExpandMiniPlayer,
		canExpandStudyMode,
		expandMiniPlayer,
		expandStudyMode,
		toggleFullscreen,
		toggleMiniPlayer,
		toggleStudyMode
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
	const miniPlayerHint =
		miniPlayerSupport === 'document-pip'
			? t.hint_mini_player_document_pip
			: miniPlayerSupport === 'popup'
				? t.hint_mini_player_popup
				: t.hint_mini_player_unavailable;
	const studyModeHint =
		studyModeSupport === 'popup'
			? t.hint_study_mode_popup
			: t.hint_study_mode_unavailable;

	return (
		<>
			<div className="flex flex-col gap-2">
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
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
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
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
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
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
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
					{t.label_editor_theme}
				</span>
				<EnumButtons<EditorTheme>
					options={EDITOR_THEMES}
					value={store.editorTheme}
					onChange={store.setEditorTheme}
					labels={editorThemeLabels}
				/>
			</div>

			<SectionDivider label={t.section_window_tools} />
			<div className="flex flex-col gap-1">
				<span className="text-xs text-cyan-400 uppercase tracking-widest">
					{t.label_window_modes}
				</span>
				<span className="text-xs text-gray-500">{miniPlayerHint}</span>
				<span className="text-xs text-gray-500">{studyModeHint}</span>
			</div>
			<div className="flex flex-wrap gap-2">
				{fullscreenSupported ? (
					<button
						onClick={() => void toggleFullscreen()}
						className="min-w-[10rem] flex-1 px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
					>
						{isFullscreen
							? t.label_exit_fullscreen
							: t.label_enter_fullscreen}
					</button>
				) : null}
				<button
					onClick={() => void toggleMiniPlayer()}
					className="min-w-[10rem] flex-1 px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
				>
					{isMiniPlayerOpen
						? t.label_close_mini_player
						: t.label_open_mini_player}
				</button>
				<button
					onClick={() => void toggleStudyMode()}
					className="min-w-[10rem] flex-1 px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
				>
					{isStudyModeOpen
						? t.label_close_study_mode
						: t.label_open_study_mode}
				</button>
			</div>
			{isMiniPlayerOpen && canExpandMiniPlayer ? (
				<button
					onClick={() => void expandMiniPlayer()}
					className="w-full px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
				>
					{t.label_expand_mini_player}
				</button>
			) : null}
			{isStudyModeOpen && canExpandStudyMode ? (
				<button
					onClick={() => void expandStudyMode()}
					className="w-full px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
				>
					{t.label_expand_study_mode}
				</button>
			) : null}

			{isCapped && (
				<div className="px-3 py-2 rounded border border-amber-800 bg-amber-950/30">
					<p className="text-xs text-amber-400">
						{t.label_count}: {store.particleCount} →{' '}
						{t.hint_effective} {cappedCount}
					</p>
				</div>
			)}

			<SectionDivider />
			<button
				onClick={store.reset}
				className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
			>
				{t.reset_all}
			</button>
			<button
				onClick={() => {
					localStorage.removeItem('lwag-state');
					useWallpaperStore.setState({ ...DEFAULT_STATE });
				}}
				className="text-xs text-orange-500 hover:text-orange-400 transition-colors text-left"
			>
				{t.clear_storage}
			</button>
		</>
	);
}
