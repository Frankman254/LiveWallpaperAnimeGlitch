import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	formatViewportResolution,
	useViewportResolution
} from '@/features/layout/viewportMetrics';
import { useT } from '@/lib/i18n';
import type {
	ControlPanelAnchor,
	EditorImagePreviewQuality,
	EditorTheme,
	ThemeColorSource
} from '@/types/wallpaper';
import {
	Button,
	SectionCard,
	Slider,
	UI_COLORS,
	FONT
} from '@/ui';
import {
	HintText,
	OptionButtonGroup,
	SectionLabel,
	SwitchRow
} from './modernAdvancedControls';

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

const THEME_COLOR_SOURCES: ThemeColorSource[] = ['manual', 'theme', 'image'];

const EDITOR_IMAGE_PREVIEW_QUALITIES: EditorImagePreviewQuality[] = [
	'optimized',
	'original'
];

const UI_SCALE_PRESETS = [
	['Compact', 0.85],
	['Normal', 1],
	['Comfort', 1.15],
	['Large', 1.4],
	['XL', 1.7]
] as const;

function formatDecimal(value: number, digits = 2) {
	return value.toFixed(digits);
}

function formatPx(value: number) {
	return `${Math.round(value)}px`;
}

function ColorField({
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

function ResolutionField({
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

function MetricTile({
	label,
	value
}: {
	label: string;
	value: string;
}) {
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

export default function ModernEditorTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			showFps: s.showFps,
			fpsOverlayAnchor: s.fpsOverlayAnchor,
			controlPanelAnchor: s.controlPanelAnchor,
			editorCornerRadius: s.editorCornerRadius,
			editorControlCornerRadius: s.editorControlCornerRadius,
			editorUiScale: s.editorUiScale,
			editorTheme: s.editorTheme,
			editorThemeColorSource: s.editorThemeColorSource,
			editorManualAccentColor: s.editorManualAccentColor,
			editorManualSecondaryColor: s.editorManualSecondaryColor,
			editorManualBackdropColor: s.editorManualBackdropColor,
			editorManualTextPrimaryColor: s.editorManualTextPrimaryColor,
			editorManualTextSecondaryColor: s.editorManualTextSecondaryColor,
			editorManualBackdropOpacity: s.editorManualBackdropOpacity,
			editorManualSurfaceOpacity: s.editorManualSurfaceOpacity,
			editorManualItemOpacity: s.editorManualItemOpacity,
			editorManualBlurPx: s.editorManualBlurPx,
			editorImagePreviewQuality: s.editorImagePreviewQuality,
			layoutResponsiveEnabled: s.layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled: s.layoutBackgroundReframeEnabled,
			layoutReferenceWidth: s.layoutReferenceWidth,
			layoutReferenceHeight: s.layoutReferenceHeight,
			quickActionsColorSource: s.quickActionsColorSource,
			spectrumColorSource: s.spectrumColorSource,
			spectrumCloneColorSource: s.spectrumCloneColorSource,
			logoGlowColorSource: s.logoGlowColorSource,
			logoShadowColorSource: s.logoShadowColorSource,
			logoBackdropColorSource: s.logoBackdropColorSource,
			particleColorSource: s.particleColorSource,
			rainColorSource: s.rainColorSource,
			audioTrackTitleTextColorSource: s.audioTrackTitleTextColorSource,
			audioTrackTitleStrokeColorSource: s.audioTrackTitleStrokeColorSource,
			audioTrackTitleGlowColorSource: s.audioTrackTitleGlowColorSource,
			audioTrackTitleBackdropColorSource:
				s.audioTrackTitleBackdropColorSource,
			audioTrackTimeTextColorSource: s.audioTrackTimeTextColorSource,
			audioTrackTimeStrokeColorSource: s.audioTrackTimeStrokeColorSource,
			audioTrackTimeGlowColorSource: s.audioTrackTimeGlowColorSource,
			quickActionsEnabled: s.quickActionsEnabled,
			quickActionsLauncherPositionX: s.quickActionsLauncherPositionX,
			quickActionsLauncherPositionY: s.quickActionsLauncherPositionY,
			quickActionsPositionX: s.quickActionsPositionX,
			quickActionsPositionY: s.quickActionsPositionY,
			quickActionsBackdropOpacity: s.quickActionsBackdropOpacity,
			quickActionsBlurPx: s.quickActionsBlurPx,
			quickActionsManualSurfaceOpacity: s.quickActionsManualSurfaceOpacity,
			quickActionsManualItemOpacity: s.quickActionsManualItemOpacity,
			quickActionsScale: s.quickActionsScale,
			quickActionsLauncherSize: s.quickActionsLauncherSize,
			quickActionsManualAccentColor: s.quickActionsManualAccentColor,
			quickActionsManualSecondaryColor: s.quickActionsManualSecondaryColor,
			quickActionsManualBackdropColor: s.quickActionsManualBackdropColor,
			quickActionsManualTextPrimaryColor:
				s.quickActionsManualTextPrimaryColor,
			quickActionsManualTextSecondaryColor:
				s.quickActionsManualTextSecondaryColor,
			setShowFps: s.setShowFps,
			setFpsOverlayAnchor: s.setFpsOverlayAnchor,
			setControlPanelAnchor: s.setControlPanelAnchor,
			setEditorCornerRadius: s.setEditorCornerRadius,
			setEditorUiScale: s.setEditorUiScale,
			setEditorControlCornerRadius: s.setEditorControlCornerRadius,
			setEditorTheme: s.setEditorTheme,
			setEditorThemeColorSource: s.setEditorThemeColorSource,
			setEditorManualAccentColor: s.setEditorManualAccentColor,
			setEditorManualSecondaryColor: s.setEditorManualSecondaryColor,
			setEditorManualBackdropColor: s.setEditorManualBackdropColor,
			setEditorManualTextPrimaryColor: s.setEditorManualTextPrimaryColor,
			setEditorManualTextSecondaryColor:
				s.setEditorManualTextSecondaryColor,
			setEditorManualBackdropOpacity: s.setEditorManualBackdropOpacity,
			setEditorManualSurfaceOpacity: s.setEditorManualSurfaceOpacity,
			setEditorManualItemOpacity: s.setEditorManualItemOpacity,
			setEditorManualBlurPx: s.setEditorManualBlurPx,
			setEditorImagePreviewQuality: s.setEditorImagePreviewQuality,
			setLayoutResponsiveEnabled: s.setLayoutResponsiveEnabled,
			setLayoutBackgroundReframeEnabled:
				s.setLayoutBackgroundReframeEnabled,
			setLayoutReferenceResolution: s.setLayoutReferenceResolution,
			captureCurrentViewportAsReference:
				s.captureCurrentViewportAsReference,
			syncAllColorSources: s.syncAllColorSources,
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
	const currentViewport = useViewportResolution();
	const [referenceWidthDraft, setReferenceWidthDraft] = useState(() =>
		String(store.layoutReferenceWidth)
	);
	const [referenceHeightDraft, setReferenceHeightDraft] = useState(() =>
		String(store.layoutReferenceHeight)
	);

	useEffect(() => {
		setReferenceWidthDraft(String(store.layoutReferenceWidth));
	}, [store.layoutReferenceWidth]);

	useEffect(() => {
		setReferenceHeightDraft(String(store.layoutReferenceHeight));
	}, [store.layoutReferenceHeight]);

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
		image: t.label_current_image
	};
	const imagePreviewQualityLabels: Record<EditorImagePreviewQuality, string> = {
		optimized: 'Optimized previews',
		original: 'Original images'
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

	const commitReferenceWidth = () => {
		const nextWidth = Number.parseInt(referenceWidthDraft, 10);
		if (Number.isFinite(nextWidth) && nextWidth > 0) {
			store.setLayoutReferenceResolution(
				nextWidth,
				store.layoutReferenceHeight
			);
			return;
		}
		setReferenceWidthDraft(String(store.layoutReferenceWidth));
	};

	const commitReferenceHeight = () => {
		const nextHeight = Number.parseInt(referenceHeightDraft, 10);
		if (Number.isFinite(nextHeight) && nextHeight > 0) {
			store.setLayoutReferenceResolution(
				store.layoutReferenceWidth,
				nextHeight
			);
			return;
		}
		setReferenceHeightDraft(String(store.layoutReferenceHeight));
	};

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.section_editor_panel}
				density="compact"
				action={
					<Button
						size="sm"
						density="compact"
						variant="ghost"
						icon={<RotateCcw size={12} />}
						onClick={onReset}
					>
						{t.reset_tab}
					</Button>
				}
			>
				<div className="grid gap-2 md:grid-cols-2">
					<SwitchRow
						label={t.label_show_fps}
						checked={store.showFps}
						onChange={store.setShowFps}
					/>
					<OptionButtonGroup<ControlPanelAnchor>
						label={t.label_panel_corner}
						options={PANEL_ANCHORS}
						value={store.controlPanelAnchor}
						onChange={store.setControlPanelAnchor}
						labels={panelAnchorLabels}
						columns={2}
					/>
				</div>
				{store.showFps ? (
					<OptionButtonGroup<ControlPanelAnchor>
						label={t.label_fps_corner}
						options={PANEL_ANCHORS}
						value={store.fpsOverlayAnchor}
						onChange={store.setFpsOverlayAnchor}
						labels={panelAnchorLabels}
						columns={2}
					/>
				) : null}
				<Slider
					label={t.label_editor_window_corner_radius}
					value={store.editorCornerRadius}
					min={0}
					max={24}
					step={1}
					unit="px"
					variant="compact"
					hint={t.hint_editor_window_corner_radius}
					formatValue={formatPx}
					onReset={() => store.setEditorCornerRadius(14)}
					onChange={store.setEditorCornerRadius}
				/>
				<Slider
					label={t.label_editor_control_corner_radius}
					value={store.editorControlCornerRadius}
					min={0}
					max={24}
					step={1}
					unit="px"
					variant="compact"
					hint={t.hint_editor_control_corner_radius}
					formatValue={formatPx}
					onReset={() => store.setEditorControlCornerRadius(10)}
					onChange={store.setEditorControlCornerRadius}
				/>
				<Slider
					label="Editor UI Scale"
					value={store.editorUiScale}
					min={0.7}
					max={2}
					step={0.05}
					variant="compact"
					hint="Use larger values on 4K / ultrawide displays."
					formatValue={value => formatDecimal(value, 2)}
					onReset={() => store.setEditorUiScale(1)}
					onChange={store.setEditorUiScale}
				/>
				<div className="flex flex-wrap gap-1">
					{UI_SCALE_PRESETS.map(([label, value]) => (
						<Button
							key={label}
							size="sm"
							density="compact"
							variant={
								Math.abs(store.editorUiScale - value) < 0.025
									? 'primary'
									: 'secondary'
							}
							active={
								Math.abs(store.editorUiScale - value) < 0.025
							}
							onClick={() => store.setEditorUiScale(value)}
						>
							{label}
						</Button>
					))}
				</div>
			</SectionCard>

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

			<SectionCard title="Appearance" density="compact">
				<OptionButtonGroup<EditorImagePreviewQuality>
					label="Image preview quality"
					options={EDITOR_IMAGE_PREVIEW_QUALITIES}
					value={store.editorImagePreviewQuality}
					onChange={store.setEditorImagePreviewQuality}
					labels={imagePreviewQualityLabels}
					columns={2}
				/>
				<HintText>
					Optimized uses sharper editor previews without loading every full image.
					Original is available for visual inspection and can be heavier.
				</HintText>
				<Slider
					label={t.label_backdrop_opacity}
					value={store.editorManualBackdropOpacity}
					min={0.08}
					max={0.98}
					step={0.01}
					variant="compact"
					formatValue={value => formatDecimal(value, 2)}
					onReset={() => store.setEditorManualBackdropOpacity(0.62)}
					onChange={store.setEditorManualBackdropOpacity}
				/>
				<Slider
					label={t.label_surface_opacity}
					value={store.editorManualSurfaceOpacity}
					min={0.01}
					max={0.96}
					step={0.01}
					variant="compact"
					formatValue={value => formatDecimal(value, 2)}
					onReset={() => store.setEditorManualSurfaceOpacity(0.58)}
					onChange={store.setEditorManualSurfaceOpacity}
				/>
				<Slider
					label="Item Opacity"
					value={store.editorManualItemOpacity}
					min={0.01}
					max={0.96}
					step={0.01}
					variant="compact"
					hint="Buttons, tabs, and interactive chrome."
					formatValue={value => formatDecimal(value, 2)}
					onReset={() => store.setEditorManualItemOpacity(0.82)}
					onChange={store.setEditorManualItemOpacity}
				/>
				<Slider
					label={t.label_blur}
					value={store.editorManualBlurPx}
					min={0}
					max={42}
					step={1}
					unit="px"
					variant="compact"
					formatValue={formatPx}
					onReset={() => store.setEditorManualBlurPx(18)}
					onChange={store.setEditorManualBlurPx}
				/>
			</SectionCard>

			<SectionCard
				title="Responsive Layout"
				subtitle="Scale HUD, spectrum, logo and track text from a saved reference resolution."
				density="compact"
			>
				<HintText>
					Use a reference resolution to keep overlays proportional when this
					project moves between monitors. Manual values stay untouched.
				</HintText>
				<div className="grid gap-2 md:grid-cols-2">
					<SwitchRow
						label="Auto-adjust to current screen"
						checked={store.layoutResponsiveEnabled}
						onChange={store.setLayoutResponsiveEnabled}
					/>
					<SwitchRow
						label="Preserve background framing"
						checked={store.layoutBackgroundReframeEnabled}
						onChange={store.setLayoutBackgroundReframeEnabled}
						hint="Keeps authored image framing when aspect ratio changes."
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<MetricTile
						label="Current"
						value={formatViewportResolution(currentViewport)}
					/>
					<MetricTile
						label="Reference"
						value={formatViewportResolution({
							width: store.layoutReferenceWidth,
							height: store.layoutReferenceHeight
						})}
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<ResolutionField
						label="Reference Width"
						value={referenceWidthDraft}
						onChange={setReferenceWidthDraft}
						onCommit={commitReferenceWidth}
					/>
					<ResolutionField
						label="Reference Height"
						value={referenceHeightDraft}
						onChange={setReferenceHeightDraft}
						onCommit={commitReferenceHeight}
					/>
				</div>
				<Button
					size="sm"
					density="compact"
					variant="secondary"
					onClick={store.captureCurrentViewportAsReference}
				>
					Use current screen as reference
				</Button>
			</SectionCard>

			<SectionCard title={t.label_global_color_shortcuts} density="compact">
				<HintText>{t.hint_global_color_shortcuts}</HintText>
				<OptionButtonGroup<ThemeColorSource>
					label={t.label_current_state}
					options={THEME_COLOR_SOURCES}
					value={globalShortcutSummary ?? null}
					onChange={store.syncAllColorSources}
					labels={themeColorSourceLabels}
					columns={3}
				/>
				<span
					className="uppercase"
					style={{
						color: UI_COLORS.fgMute,
						fontFamily: FONT.mono,
						fontSize: 10,
						letterSpacing: '0.12em'
					}}
				>
					{t.label_current_state}:{' '}
					<span style={{ color: UI_COLORS.fg }}>
						{globalShortcutSummary
							? themeColorSourceLabels[globalShortcutSummary]
							: t.label_mixed}
					</span>
				</span>
			</SectionCard>

			<SectionCard title="Quick Actions HUD" density="compact">
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
								Manual Quick HUD colors stay saved while Theme or Current
								Image is active.
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
		</div>
	);
}
