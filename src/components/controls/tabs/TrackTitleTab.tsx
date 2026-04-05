import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/AudioDataContext';
import { useT } from '@/lib/i18n';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { TRACK_TITLE_RANGES } from '@/config/ranges';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';
import EnumButtons from '../ui/EnumButtons';
import ColorInput from '../ui/ColorInput';
import {
	TRACK_TITLE_FONT_LABELS,
	TRACK_TITLE_FONTS,
	TRACK_TITLE_LAYOUT_LABELS,
	TRACK_TITLE_LAYOUTS
} from './trackTitleOptions';

export default function TrackTitleTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const { captureMode, getFileName } = useAudioContext();
	const isFile =
		captureMode === 'file' && store.audioCaptureState === 'active';
	const formattedTrackTitle = formatTrackTitle(getFileName());

	return (
		<>
			<ToggleControl
				label={t.label_track_title_enabled}
				value={store.audioTrackTitleEnabled}
				onChange={store.setAudioTrackTitleEnabled}
			/>

			{isFile && (
				<div className="text-xs text-cyan-500">
					{t.label_now_playing}:{' '}
					{formattedTrackTitle || t.label_track_title_empty}
				</div>
			)}

			{store.audioTrackTitleEnabled && (
				<>
					<SectionDivider label={t.section_track_title} />
					<div className="flex flex-col gap-1">
						<span className="text-xs text-cyan-400">
							{t.label_track_title_layout}
						</span>
						<EnumButtons
							options={TRACK_TITLE_LAYOUTS}
							value={store.audioTrackTitleLayoutMode}
							onChange={store.setAudioTrackTitleLayoutMode}
							labels={TRACK_TITLE_LAYOUT_LABELS}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-cyan-400">
							{t.label_font_style}
						</span>
						<EnumButtons
							options={TRACK_TITLE_FONTS}
							value={store.audioTrackTitleFontStyle}
							onChange={store.setAudioTrackTitleFontStyle}
							labels={TRACK_TITLE_FONT_LABELS}
						/>
					</div>
					<ToggleControl
						label={t.label_uppercase}
						value={store.audioTrackTitleUppercase}
						onChange={store.setAudioTrackTitleUppercase}
					/>
					{store.audioTrackTitleLayoutMode === 'free' && (
						<SliderControl
							label={t.label_position_x}
							value={store.audioTrackTitlePositionX}
							{...TRACK_TITLE_RANGES.positionX}
							onChange={store.setAudioTrackTitlePositionX}
						/>
					)}
					<SliderControl
						label={t.label_position_y}
						value={store.audioTrackTitlePositionY}
						{...TRACK_TITLE_RANGES.positionY}
						onChange={store.setAudioTrackTitlePositionY}
					/>
					<SliderControl
						label={t.label_font_size}
						value={store.audioTrackTitleFontSize}
						{...TRACK_TITLE_RANGES.fontSize}
						onChange={store.setAudioTrackTitleFontSize}
						unit="px"
					/>
					<SliderControl
						label={t.label_letter_spacing}
						value={store.audioTrackTitleLetterSpacing}
						{...TRACK_TITLE_RANGES.letterSpacing}
						onChange={store.setAudioTrackTitleLetterSpacing}
						unit="px"
					/>
					<SliderControl
						label={t.label_title_width}
						value={store.audioTrackTitleWidth}
						{...TRACK_TITLE_RANGES.width}
						onChange={store.setAudioTrackTitleWidth}
					/>
					<SliderControl
						label={t.label_opacity}
						value={store.audioTrackTitleOpacity}
						{...TRACK_TITLE_RANGES.opacity}
						onChange={store.setAudioTrackTitleOpacity}
					/>
					<SliderControl
						label={t.label_scroll_speed}
						value={store.audioTrackTitleScrollSpeed}
						{...TRACK_TITLE_RANGES.scrollSpeed}
						onChange={store.setAudioTrackTitleScrollSpeed}
						unit="px/s"
					/>

					<SectionDivider label={t.section_appearance} />
					<ColorInput
						label={t.label_text_color}
						value={store.audioTrackTitleTextColor}
						onChange={store.setAudioTrackTitleTextColor}
					/>
					<ColorInput
						label={t.label_glow_color}
						value={store.audioTrackTitleGlowColor}
						onChange={store.setAudioTrackTitleGlowColor}
					/>
					<SliderControl
						label={t.label_glow_blur}
						value={store.audioTrackTitleGlowBlur}
						{...TRACK_TITLE_RANGES.glowBlur}
						onChange={store.setAudioTrackTitleGlowBlur}
					/>
					<ToggleControl
						label={t.label_backdrop}
						value={store.audioTrackTitleBackdropEnabled}
						onChange={store.setAudioTrackTitleBackdropEnabled}
					/>
					{store.audioTrackTitleBackdropEnabled && (
						<>
							<ColorInput
								label={t.label_backdrop_color}
								value={store.audioTrackTitleBackdropColor}
								onChange={store.setAudioTrackTitleBackdropColor}
							/>
							<SliderControl
								label={t.label_backdrop_opacity}
								value={store.audioTrackTitleBackdropOpacity}
								{...TRACK_TITLE_RANGES.backdropOpacity}
								onChange={
									store.setAudioTrackTitleBackdropOpacity
								}
							/>
							<SliderControl
								label={t.label_backdrop_padding}
								value={store.audioTrackTitleBackdropPadding}
								{...TRACK_TITLE_RANGES.backdropPadding}
								onChange={
									store.setAudioTrackTitleBackdropPadding
								}
								unit="px"
							/>
						</>
					)}

					<SectionDivider label={t.section_track_title_filters} />
					<SliderControl
						label={t.label_brightness}
						value={store.audioTrackTitleFilterBrightness}
						{...TRACK_TITLE_RANGES.filterBrightness}
						onChange={store.setAudioTrackTitleFilterBrightness}
					/>
					<SliderControl
						label={t.label_contrast}
						value={store.audioTrackTitleFilterContrast}
						{...TRACK_TITLE_RANGES.filterContrast}
						onChange={store.setAudioTrackTitleFilterContrast}
					/>
					<SliderControl
						label={t.label_saturation}
						value={store.audioTrackTitleFilterSaturation}
						{...TRACK_TITLE_RANGES.filterSaturation}
						onChange={store.setAudioTrackTitleFilterSaturation}
					/>
					<SliderControl
						label={t.label_blur}
						value={store.audioTrackTitleFilterBlur}
						{...TRACK_TITLE_RANGES.filterBlur}
						onChange={store.setAudioTrackTitleFilterBlur}
						unit="px"
					/>
					<SliderControl
						label={t.label_hue_rotate}
						value={store.audioTrackTitleFilterHueRotate}
						{...TRACK_TITLE_RANGES.filterHueRotate}
						onChange={store.setAudioTrackTitleFilterHueRotate}
						unit="deg"
					/>
					<SliderControl
						label={t.label_rgb_shift}
						value={store.audioTrackTitleRgbShift}
						{...TRACK_TITLE_RANGES.rgbShift}
						onChange={store.setAudioTrackTitleRgbShift}
					/>
				</>
			)}

			<SectionDivider />
			<ResetButton label={t.reset_tab} onClick={onReset} />
		</>
	);
}
