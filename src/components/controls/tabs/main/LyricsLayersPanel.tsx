import { RotateCcw } from 'lucide-react';
import {
	Button,
	Caption,
	ConnectedColorInput as ColorInput,
	EnumButtonGroup,
	FieldLabel,
	ICON_SIZE,
	SegmentedControl,
	UI_COLORS
} from '@/ui';
import { useT } from '@/lib/i18n';
import { LYRICS_LAYER_RANGES, LYRICS_RANGES } from '@/config/ranges';
import { mergeLyrixaVisualStyle } from '@/features/lyrics/lyrixaBundle';
import { DEFAULT_LYRIXA_LYRIC_STYLE } from '@/features/lyrics/lyrixaBundleTypes';
import type {
	LyrixaLyricsBundleEnvelope,
	LyrixaLyricVisualStyle
} from '@/features/lyrics/lyrixaBundleTypes';
import type { ColorSourceMode } from '@/types/wallpaper';
import type {
	LyricsLayerColorMode,
	LyrixaLayerOverride,
	LyrixaLayerOverrideMap
} from '@/features/lyrics/types';
import {
	resolveLyricsColorMode,
	resolveLyricsColorSource
} from '@/features/lyrics/lyricsColorModes';
import ToggleControl from '../../ToggleControl';
import SliderControl from '../../SliderControl';
import CollapsibleSection from '../../ui/CollapsibleSection';

const LYRICS_COLOR_MODES: LyricsLayerColorMode[] = [
	'solid',
	'gradient',
	'rainbow'
];
const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'image', 'theme'];

/**
 * The three independently colorable parts of a lyric layer. `bundleColor`
 * seeds the picker from whatever the imported bundle already carried.
 */
const COLOR_SLOTS = [
	{
		key: 'text',
		labelKey: 'label_lyrics_active_color',
		fallback: DEFAULT_LYRIXA_LYRIC_STYLE.textColor,
		bundleColor: (style: LyrixaLyricVisualStyle) => style.textColor
	},
	{
		key: 'stroke',
		labelKey: 'lyrics_label_stroke_color',
		fallback: DEFAULT_LYRIXA_LYRIC_STYLE.strokeColor,
		bundleColor: (style: LyrixaLyricVisualStyle) => style.strokeColor
	},
	{
		key: 'glow',
		labelKey: 'label_glow_color',
		fallback: '#ffffff',
		bundleColor: (style: LyrixaLyricVisualStyle) => style.glowColor
	}
] as const;

/** Mirrors the global lyrics stroke width default. */
const DEFAULT_LAYER_STROKE_WIDTH = 1.6;

/**
 * Second stop seeded when a slot is switched to Gradient. Without it the stored
 * value stays undefined while the picker *displays* a fallback, so the gradient
 * silently collapses into a solid — which is exactly what it used to do.
 */
function seedSecondaryColor(primary: string): string {
	return primary.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff';
}

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
 * One color slot of a layer (fill, border or glow): source, mode and the color
 * inputs that mode actually uses.
 *
 * Mirrors `SpectrumColorControls` + `AdaptiveColorInput` without importing
 * either: lyrics slots only expose three of Spectrum's modes, and the pickers
 * are `ConnectedColorInput` so they carry the shared favourites strip.
 */
function LayerColorSlotControls({
	label,
	source,
	onSourceChange,
	mode,
	onModeChange,
	primaryColor,
	onPrimaryColorChange,
	secondaryColor,
	onSecondaryColorChange
}: {
	label: string;
	source: ColorSourceMode;
	onSourceChange: (value: ColorSourceMode) => void;
	mode: LyricsLayerColorMode;
	onModeChange: (value: LyricsLayerColorMode) => void;
	primaryColor: string;
	onPrimaryColorChange: (value: string) => void;
	secondaryColor: string;
	onSecondaryColorChange: (value: string) => void;
}) {
	const t = useT();
	return (
		<div
			className="flex flex-col gap-2 rounded-md border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<FieldLabel>{label}</FieldLabel>
			<EnumButtonGroup<ColorSourceMode>
				options={COLOR_SOURCES}
				value={source}
				onChange={onSourceChange}
				labels={{
					manual: t.label_manual_color,
					image: t.label_current_image,
					theme: t.label_theme
				}}
			/>
			<SegmentedControl<LyricsLayerColorMode>
				value={mode}
				onChange={onModeChange}
				options={LYRICS_COLOR_MODES.map(option => ({
					value: option,
					label: option[0]!.toUpperCase() + option.slice(1)
				}))}
				size="md"
				density="compact"
				full
				ariaLabel={label}
			/>
			{source !== 'manual' ? (
				<Caption as="div" className="text-[11px]">
					{source === 'theme'
						? t.hint_theme_palette_auto
						: t.hint_background_palette_auto}
				</Caption>
			) : mode === 'rainbow' ? null : (
				<>
					<ColorInput
						label={mode === 'gradient' ? t.label_color_1 : label}
						value={primaryColor}
						onChange={onPrimaryColorChange}
					/>
					{mode === 'gradient' ? (
						<ColorInput
							label={t.label_color_2}
							value={secondaryColor}
							onChange={onSecondaryColorChange}
						/>
					) : null}
				</>
			)}
		</div>
	);
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
						<SliderControl
							label={t.lyrics_label_stroke_width}
							value={
								override.strokeWidth ??
								DEFAULT_LAYER_STROKE_WIDTH
							}
							{...LYRICS_RANGES.strokeWidth}
							onChange={value =>
								patchLayer(layer.id, { strokeWidth: value })
							}
							unit="px"
							defaultValue={DEFAULT_LAYER_STROKE_WIDTH}
						/>
						{COLOR_SLOTS.map(slot => {
							const colorKey = `${slot.key}Color` as const;
							const modeKey = `${slot.key}ColorMode` as const;
							const secondaryKey =
								`${slot.key}ColorSecondary` as const;
							const sourceKey = `${slot.key}ColorSource` as const;
							const mode = resolveLyricsColorMode(
								override[modeKey]
							);
							const primary = toHexOrDefault(
								override[colorKey] ??
									slot.bundleColor(bundleStyle),
								slot.fallback
							);
							return (
								<LayerColorSlotControls
									key={slot.key}
									label={t[slot.labelKey]}
									source={resolveLyricsColorSource(
										override[sourceKey]
									)}
									onSourceChange={value =>
										patchLayer(layer.id, {
											[sourceKey]: value
										})
									}
									mode={mode}
									onModeChange={value =>
										patchLayer(layer.id, {
											[modeKey]: value,
											// Seed the second stop so switching
											// to Gradient shows a real gradient
											// instead of collapsing to solid.
											...(value === 'gradient' &&
											override[secondaryKey] === undefined
												? {
														[secondaryKey]:
															seedSecondaryColor(
																primary
															)
													}
												: {})
										})
									}
									primaryColor={primary}
									onPrimaryColorChange={value =>
										patchLayer(layer.id, {
											[colorKey]: value
										})
									}
									secondaryColor={toHexOrDefault(
										override[secondaryKey],
										seedSecondaryColor(primary)
									)}
									onSecondaryColorChange={value =>
										patchLayer(layer.id, {
											[secondaryKey]: value
										})
									}
								/>
							);
						})}
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
