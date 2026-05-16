import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { ControlPanelAnchor } from '@/types/wallpaper';
import { Button, SectionCard, Slider } from '@/ui';
import { OptionButtonGroup, SwitchRow } from '../modernAdvancedControls';
import {
	PANEL_ANCHORS,
	UI_SCALE_PRESETS,
	formatDecimal,
	formatPx
} from './editorTabHelpers';

export default function EditorPanelSection({
	onReset
}: {
	onReset: () => void;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			showFps: s.showFps,
			fpsOverlayAnchor: s.fpsOverlayAnchor,
			controlPanelAnchor: s.controlPanelAnchor,
			editorCornerRadius: s.editorCornerRadius,
			editorControlCornerRadius: s.editorControlCornerRadius,
			editorUiScale: s.editorUiScale,
			setShowFps: s.setShowFps,
			setFpsOverlayAnchor: s.setFpsOverlayAnchor,
			setControlPanelAnchor: s.setControlPanelAnchor,
			setEditorCornerRadius: s.setEditorCornerRadius,
			setEditorControlCornerRadius: s.setEditorControlCornerRadius,
			setEditorUiScale: s.setEditorUiScale
		}))
	);

	const panelAnchorLabels: Record<ControlPanelAnchor, string> = {
		'top-left': t.corner_top_left,
		'top-right': t.corner_top_right,
		'bottom-left': t.corner_bottom_left,
		'bottom-right': t.corner_bottom_right
	};

	return (
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
						active={Math.abs(store.editorUiScale - value) < 0.025}
						onClick={() => store.setEditorUiScale(value)}
					>
						{label}
					</Button>
				))}
			</div>
		</SectionCard>
	);
}
