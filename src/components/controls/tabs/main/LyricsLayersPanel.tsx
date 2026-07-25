import { RotateCcw } from 'lucide-react';
import { Button, Caption, ColorInput, ICON_SIZE } from '@/ui';
import { useT } from '@/lib/i18n';
import { LYRICS_LAYER_RANGES } from '@/config/ranges';
import { mergeLyrixaVisualStyle } from '@/features/lyrics/lyrixaBundle';
import { DEFAULT_LYRIXA_LYRIC_STYLE } from '@/features/lyrics/lyrixaBundleTypes';
import type { LyrixaLyricsBundleEnvelope } from '@/features/lyrics/lyrixaBundleTypes';
import type {
	LyrixaLayerOverride,
	LyrixaLayerOverrideMap
} from '@/features/lyrics/types';
import ToggleControl from '../../ToggleControl';
import SliderControl from '../../SliderControl';
import CollapsibleSection from '../../ui/CollapsibleSection';

type Props = {
	bundle: LyrixaLyricsBundleEnvelope;
	overrides: LyrixaLayerOverrideMap;
	onOverridesChange: (next: LyrixaLayerOverrideMap) => void;
};

/** Hex the native color input can display; bundle colors may be rgba()/named. */
function toHexOrDefault(color: string | undefined, fallback: string): string {
	if (color && /^#[0-9a-fA-F]{6}$/.test(color.trim())) return color.trim();
	if (color && /^#[0-9a-fA-F]{3}$/.test(color.trim())) {
		const short = color.trim().slice(1);
		return `#${short[0]!}${short[0]!}${short[1]!}${short[1]!}${short[2]!}${short[2]!}`;
	}
	return fallback;
}

/**
 * Per-layer controls for an imported Lyrixa bundle.
 *
 * The override model (`lyrixaLayerOverrides`) was already honoured by BOTH
 * renderers — Editor Native and Lyrixa Look — but nothing in the editor ever
 * wrote to it, so a bundle's layers were effectively frozen wherever Lyrixa
 * placed them. This panel is that missing writer: it is the only way to move a
 * single layer, since the tab's global Position X/Y move every layer at once.
 */
export default function LyricsLayersPanel({
	bundle,
	overrides,
	onOverridesChange
}: Props) {
	const t = useT();
	const layers = [...bundle.project.layers].sort((a, b) => a.order - b.order);

	function patchLayer(layerId: string, patch: Partial<LyrixaLayerOverride>) {
		onOverridesChange({
			...overrides,
			[layerId]: { ...(overrides[layerId] ?? {}), ...patch }
		});
	}

	function resetLayer(layerId: string) {
		const next = { ...overrides };
		delete next[layerId];
		onOverridesChange(next);
	}

	if (layers.length === 0) {
		return <Caption as="p">{t.hint_lyrics_layers_empty}</Caption>;
	}

	return (
		<div className="flex flex-col gap-2.5">
			<Caption as="p">{t.hint_lyrics_layers}</Caption>
			{layers.map((layer, index) => {
				const override = overrides[layer.id] ?? {};
				const bundleStyle = mergeLyrixaVisualStyle(
					bundle.project.styleConfig,
					layer.styleDefaults
				);
				const clipCount = bundle.project.clips.filter(
					clip => clip.layerId === layer.id
				).length;
				const isVisible = override.visible ?? layer.visible !== false;
				const hasOverride = Object.keys(override).length > 0;

				return (
					<CollapsibleSection
						key={layer.id}
						label={`${index + 1}. ${layer.name || t.tab_lyrics}${
							hasOverride ? ' •' : ''
						}`}
						defaultOpen={index === 0}
					>
						<Caption as="p">
							{t.label_lyrics_bundle_clips}: {clipCount}
							{layer.renderSettings?.positionPreset
								? ` • ${layer.renderSettings.positionPreset}`
								: ''}
						</Caption>
						<ToggleControl
							label={t.label_visible}
							value={isVisible}
							onChange={value =>
								patchLayer(layer.id, { visible: value })
							}
						/>
						<SliderControl
							label={t.label_position_x}
							value={override.positionOffsetX ?? 0}
							{...LYRICS_LAYER_RANGES.positionOffsetX}
							onChange={value =>
								patchLayer(layer.id, { positionOffsetX: value })
							}
							defaultValue={0}
						/>
						<SliderControl
							label={t.label_position_y}
							value={override.positionOffsetY ?? 0}
							{...LYRICS_LAYER_RANGES.positionOffsetY}
							onChange={value =>
								patchLayer(layer.id, { positionOffsetY: value })
							}
							defaultValue={0}
						/>
						<SliderControl
							label={t.label_scale}
							value={override.scale ?? 1}
							{...LYRICS_LAYER_RANGES.scale}
							onChange={value =>
								patchLayer(layer.id, { scale: value })
							}
							defaultValue={1}
						/>
						<SliderControl
							label={t.label_opacity}
							value={override.opacity ?? 1}
							{...LYRICS_LAYER_RANGES.opacity}
							onChange={value =>
								patchLayer(layer.id, { opacity: value })
							}
							defaultValue={1}
						/>
						<SliderControl
							label={t.label_glow_intensity}
							value={override.glowIntensity ?? 1}
							{...LYRICS_LAYER_RANGES.glowIntensity}
							onChange={value =>
								patchLayer(layer.id, { glowIntensity: value })
							}
							defaultValue={1}
						/>
						<SliderControl
							label={t.label_blur}
							value={override.blurAmount ?? 0}
							{...LYRICS_LAYER_RANGES.blurAmount}
							onChange={value =>
								patchLayer(layer.id, { blurAmount: value })
							}
							unit="px"
							defaultValue={0}
						/>
						<ColorInput
							label={t.label_lyrics_active_color}
							value={toHexOrDefault(
								override.textColor ?? bundleStyle.textColor,
								DEFAULT_LYRIXA_LYRIC_STYLE.textColor
							)}
							onChange={value =>
								patchLayer(layer.id, { textColor: value })
							}
						/>
						<ColorInput
							label={t.label_glow_color}
							value={toHexOrDefault(
								override.glowColor ?? bundleStyle.glowColor,
								'#ffffff'
							)}
							onChange={value =>
								patchLayer(layer.id, { glowColor: value })
							}
						/>
						<div className="flex justify-end">
							<Button
								type="button"
								size="sm"
								density="compact"
								variant="secondary"
								disabled={!hasOverride}
								onClick={() => resetLayer(layer.id)}
								icon={<RotateCcw size={ICON_SIZE.xs} />}
							>
								{t.label_lyrics_layer_reset}
							</Button>
						</div>
					</CollapsibleSection>
				);
			})}
		</div>
	);
}
