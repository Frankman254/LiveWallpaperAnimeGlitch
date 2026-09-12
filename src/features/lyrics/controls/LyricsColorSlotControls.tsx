import { useMemo } from 'react';
import type { ColorSourceMode } from '@/types/wallpaper';
import type { LyricsLayerColorMode } from '@/features/lyrics/domain/types';
import {
	LYRICS_COLOR_MODES,
	lyricsColorModeLabel,
	resolveLyricsColorMode,
	resolveLyricsColorSlot,
	resolveLyricsColorSource,
	type LyricsPalettes
} from '@/features/lyrics/domain/lyricsColorModes';
import { useT } from '@/lib/i18n';
import {
	Caption,
	EnumButtonGroup,
	FieldLabel,
	SegmentedControl,
	UI_COLORS
} from '@/ui';
import { ConnectedColorInput as ColorInput } from '@/editor';
import LyricsColorSlotPreview, {
	type LyricsSlotPreviewRole
} from './LyricsColorSlotPreview';

const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'image', 'theme'];

/**
 * One colorable part of the lyrics (fill, border or glow): source, mode and the
 * color inputs that mode actually uses.
 *
 * Shared by the global Lyrics Style section and the per-layer Bundle Layers
 * panel so both offer exactly the same modes — they used to disagree, with the
 * global colors stuck on source-only pickers.
 */
export default function LyricsColorSlotControls({
	label,
	role,
	palettes,
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
	/** Which part of the lyric line this slot paints; drives the preview. */
	role: LyricsSlotPreviewRole;
	/** Palettes the image/theme sources sample from; required for an honest
	 *  preview when `source` isn't `manual`. */
	palettes?: LyricsPalettes;
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
	const resolvedMode = resolveLyricsColorMode(mode);
	const resolvedSource = resolveLyricsColorSource(source);
	const preview = useMemo(
		() =>
			resolveLyricsColorSlot(
				{
					source,
					mode,
					primary: primaryColor,
					secondary: secondaryColor
				},
				palettes
			),
		[source, mode, primaryColor, secondaryColor, palettes]
	);
	return (
		<div
			className="flex flex-col gap-2 rounded-md border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<FieldLabel>{label}</FieldLabel>
			<LyricsColorSlotPreview
				role={role}
				resolved={preview}
				title={t.hint_lyrics_slot_preview}
			/>
			<EnumButtonGroup<ColorSourceMode>
				options={COLOR_SOURCES}
				value={resolvedSource}
				onChange={onSourceChange}
				labels={{
					manual: t.label_manual_color,
					image: t.label_current_image,
					theme: t.label_theme
				}}
			/>
			<SegmentedControl<LyricsLayerColorMode>
				value={resolvedMode}
				onChange={onModeChange}
				options={LYRICS_COLOR_MODES.map(option => ({
					value: option,
					label: lyricsColorModeLabel(option)
				}))}
				size="md"
				density="compact"
				full
				ariaLabel={label}
			/>
			{resolvedSource !== 'manual' ? (
				<Caption as="div" className="text-[11px]">
					{resolvedSource === 'theme'
						? t.hint_theme_palette_auto
						: t.hint_background_palette_auto}
				</Caption>
			) : resolvedMode !== 'solid' &&
			  resolvedMode !== 'gradient' ? null : (
				<>
					<ColorInput
						label={
							resolvedMode === 'gradient'
								? t.label_color_1
								: label
						}
						value={primaryColor}
						onChange={onPrimaryColorChange}
					/>
					{resolvedMode === 'gradient' ? (
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
