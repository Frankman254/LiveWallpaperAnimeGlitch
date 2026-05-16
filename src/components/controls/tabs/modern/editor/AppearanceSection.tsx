import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { EditorImagePreviewQuality } from '@/types/wallpaper';
import { SectionCard, Slider } from '@/ui';
import { HintText, OptionButtonGroup } from '../modernAdvancedControls';
import {
	EDITOR_IMAGE_PREVIEW_QUALITIES,
	formatDecimal,
	formatPx
} from './editorTabHelpers';

export default function AppearanceSection() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			editorImagePreviewQuality: s.editorImagePreviewQuality,
			editorManualBackdropOpacity: s.editorManualBackdropOpacity,
			editorManualSurfaceOpacity: s.editorManualSurfaceOpacity,
			editorManualItemOpacity: s.editorManualItemOpacity,
			editorManualBlurPx: s.editorManualBlurPx,
			setEditorImagePreviewQuality: s.setEditorImagePreviewQuality,
			setEditorManualBackdropOpacity: s.setEditorManualBackdropOpacity,
			setEditorManualSurfaceOpacity: s.setEditorManualSurfaceOpacity,
			setEditorManualItemOpacity: s.setEditorManualItemOpacity,
			setEditorManualBlurPx: s.setEditorManualBlurPx
		}))
	);

	const imagePreviewQualityLabels: Record<EditorImagePreviewQuality, string> = {
		optimized: 'Optimized previews',
		original: 'Original images'
	};

	return (
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
	);
}
