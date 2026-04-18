import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import { useT } from '@/lib/i18n';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { TRACK_TITLE_RANGES } from '@/config/ranges';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import SectionDivider from '../ui/SectionDivider';
import CollapsibleSection from '../ui/CollapsibleSection';
import ResetButton from '../ui/ResetButton';
import EnumButtons from '../ui/EnumButtons';
import AdaptiveColorInput from '../ui/AdaptiveColorInput';
import {
	TRACK_TITLE_FONT_LABELS,
	TRACK_TITLE_FONTS,
	TRACK_TITLE_LAYOUT_LABELS,
	TRACK_TITLE_LAYOUTS
} from './trackTitleOptions';

function formatClock(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainder = seconds % 60;

	if (hours > 0) {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
	}

	return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export default function TrackTitleTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const { captureMode, getFileName, getCurrentTime, getDuration } =
		useAudioContext();
	const isFile =
		captureMode === 'file' && store.audioCaptureState === 'active';
	const isLive = captureMode === 'microphone' || captureMode === 'desktop';
	const formattedTrackTitle = formatTrackTitle(getFileName());
	const hasDuration = getDuration() > 0;
	const previewTime = hasDuration
		? `${formatClock(getCurrentTime())} / ${formatClock(getDuration())}`
		: '';
	const trackDetailsEnabled =
		store.audioTrackTitleEnabled || store.audioTrackTimeEnabled;

	return (
		<>
			{isLive && (
				<div
					className="rounded border px-2.5 py-2 text-[11px] leading-snug"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-bg)',
						color: 'var(--editor-accent-muted)'
					}}
				>
					{t.hint_track_info_live_mode}
				</div>
			)}

			<div
				className={isLive ? 'pointer-events-none opacity-40' : undefined}
				aria-disabled={isLive}
			>
				<ToggleControl
					label={t.label_track_title_enabled}
					value={store.audioTrackTitleEnabled}
					onChange={store.setAudioTrackTitleEnabled}
				/>
				<ToggleControl
					label={t.label_track_time_enabled}
					value={store.audioTrackTimeEnabled}
					onChange={store.setAudioTrackTimeEnabled}
				/>
			</div>

			{isFile && (
				<div
					className="flex flex-col gap-0.5 text-xs"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					<div>
						{t.label_now_playing}:{' '}
						{formattedTrackTitle || t.label_track_title_empty}
					</div>
					{previewTime ? <div>{previewTime}</div> : null}
				</div>
			)}

			{trackDetailsEnabled && (
				<>
					{/* ── BACKDROP ── */}
					<CollapsibleSection
						label={t.label_backdrop}
						defaultOpen={store.audioTrackTitleBackdropEnabled}
					>
						<ToggleControl
							label={t.label_backdrop}
							value={store.audioTrackTitleBackdropEnabled}
							onChange={store.setAudioTrackTitleBackdropEnabled}
						/>
						{store.audioTrackTitleBackdropEnabled && (
							<>
								<AdaptiveColorInput
									label={t.label_backdrop_color}
									source={store.audioTrackTitleBackdropColorSource}
									onSourceChange={
										store.setAudioTrackTitleBackdropColorSource
									}
									value={store.audioTrackTitleBackdropColor}
									onChange={store.setAudioTrackTitleBackdropColor}
								/>
								<SliderControl
									label={t.label_backdrop_opacity}
									value={store.audioTrackTitleBackdropOpacity}
									{...TRACK_TITLE_RANGES.backdropOpacity}
									onChange={store.setAudioTrackTitleBackdropOpacity}
								/>
								<SliderControl
									label={t.label_backdrop_padding}
									value={store.audioTrackTitleBackdropPadding}
									{...TRACK_TITLE_RANGES.backdropPadding}
									onChange={store.setAudioTrackTitleBackdropPadding}
									unit="px"
								/>
							</>
						)}
					</CollapsibleSection>

					{/* ── TRACK TITLE ── */}
					{store.audioTrackTitleEnabled && (
						<>
							<SectionDivider label={t.section_track_title} />

							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.label_track_title_layout}
								</span>
								<EnumButtons
									options={TRACK_TITLE_LAYOUTS}
									value={store.audioTrackTitleLayoutMode}
									onChange={store.setAudioTrackTitleLayoutMode}
									labels={TRACK_TITLE_LAYOUT_LABELS}
								/>
							</div>
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
								label={t.label_title_width}
								value={store.audioTrackTitleWidth}
								{...TRACK_TITLE_RANGES.width}
								onChange={store.setAudioTrackTitleWidth}
							/>

							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
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
							<AdaptiveColorInput
								label={t.label_fill_color}
								source={store.audioTrackTitleTextColorSource}
								onSourceChange={
									store.setAudioTrackTitleTextColorSource
								}
								value={store.audioTrackTitleTextColor}
								onChange={store.setAudioTrackTitleTextColor}
							/>
							<AdaptiveColorInput
								label={t.label_stroke_color}
								source={store.audioTrackTitleStrokeColorSource}
								onSourceChange={
									store.setAudioTrackTitleStrokeColorSource
								}
								value={store.audioTrackTitleStrokeColor}
								onChange={store.setAudioTrackTitleStrokeColor}
							/>
							<SliderControl
								label={t.label_stroke_width}
								value={store.audioTrackTitleStrokeWidth}
								{...TRACK_TITLE_RANGES.strokeWidth}
								onChange={store.setAudioTrackTitleStrokeWidth}
								unit="px"
							/>
							<AdaptiveColorInput
								label={t.label_glow_color}
								source={store.audioTrackTitleGlowColorSource}
								onSourceChange={
									store.setAudioTrackTitleGlowColorSource
								}
								value={store.audioTrackTitleGlowColor}
								onChange={store.setAudioTrackTitleGlowColor}
							/>
							<SliderControl
								label={t.label_glow_blur}
								value={store.audioTrackTitleGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTitleGlowBlur}
							/>
							<SliderControl
								label={t.label_rgb_shift}
								value={store.audioTrackTitleRgbShift}
								{...TRACK_TITLE_RANGES.rgbShift}
								onChange={store.setAudioTrackTitleRgbShift}
							/>

							<CollapsibleSection
								label={t.section_track_title_filters}
								defaultOpen={false}
							>
								<SliderControl
									label={t.label_brightness}
									value={store.audioTrackTitleFilterBrightness}
									{...TRACK_TITLE_RANGES.filterBrightness}
									onChange={
										store.setAudioTrackTitleFilterBrightness
									}
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
									onChange={
										store.setAudioTrackTitleFilterSaturation
									}
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
									onChange={
										store.setAudioTrackTitleFilterHueRotate
									}
									unit="deg"
								/>
							</CollapsibleSection>
						</>
					)}

					{/* ── TRACK TIME ── */}
					{store.audioTrackTimeEnabled && (
						<>
							<SectionDivider label={t.section_track_time} />

							<SliderControl
								label={t.label_position_x}
								value={store.audioTrackTimePositionX}
								{...TRACK_TITLE_RANGES.positionX}
								onChange={store.setAudioTrackTimePositionX}
							/>
							<SliderControl
								label={t.label_position_y}
								value={store.audioTrackTimePositionY}
								{...TRACK_TITLE_RANGES.positionY}
								onChange={store.setAudioTrackTimePositionY}
							/>
							<SliderControl
								label={t.label_title_width}
								value={store.audioTrackTimeWidth}
								{...TRACK_TITLE_RANGES.width}
								onChange={store.setAudioTrackTimeWidth}
							/>

							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.label_font_style}
								</span>
								<EnumButtons
									options={TRACK_TITLE_FONTS}
									value={store.audioTrackTimeFontStyle}
									onChange={store.setAudioTrackTimeFontStyle}
									labels={TRACK_TITLE_FONT_LABELS}
								/>
							</div>
							<SliderControl
								label={t.label_time_font_size}
								value={store.audioTrackTimeFontSize}
								{...TRACK_TITLE_RANGES.fontSize}
								onChange={store.setAudioTrackTimeFontSize}
								unit="px"
							/>
							<SliderControl
								label={t.label_letter_spacing}
								value={store.audioTrackTimeLetterSpacing}
								{...TRACK_TITLE_RANGES.letterSpacing}
								onChange={store.setAudioTrackTimeLetterSpacing}
								unit="px"
							/>
							<SliderControl
								label={t.label_opacity}
								value={store.audioTrackTimeOpacity}
								{...TRACK_TITLE_RANGES.opacity}
								onChange={store.setAudioTrackTimeOpacity}
							/>
							<AdaptiveColorInput
								label={t.label_fill_color}
								source={store.audioTrackTimeTextColorSource}
								onSourceChange={
									store.setAudioTrackTimeTextColorSource
								}
								value={store.audioTrackTimeTextColor}
								onChange={store.setAudioTrackTimeTextColor}
							/>
							<AdaptiveColorInput
								label={t.label_stroke_color}
								source={store.audioTrackTimeStrokeColorSource}
								onSourceChange={
									store.setAudioTrackTimeStrokeColorSource
								}
								value={store.audioTrackTimeStrokeColor}
								onChange={store.setAudioTrackTimeStrokeColor}
							/>
							<SliderControl
								label={t.label_stroke_width}
								value={store.audioTrackTimeStrokeWidth}
								{...TRACK_TITLE_RANGES.strokeWidth}
								onChange={store.setAudioTrackTimeStrokeWidth}
								unit="px"
							/>
							<AdaptiveColorInput
								label={t.label_glow_color}
								source={store.audioTrackTimeGlowColorSource}
								onSourceChange={
									store.setAudioTrackTimeGlowColorSource
								}
								value={store.audioTrackTimeGlowColor}
								onChange={store.setAudioTrackTimeGlowColor}
							/>
							<SliderControl
								label={t.label_glow_blur}
								value={store.audioTrackTimeGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTimeGlowBlur}
							/>
							<SliderControl
								label={t.label_rgb_shift}
								value={store.audioTrackTimeRgbShift}
								{...TRACK_TITLE_RANGES.rgbShift}
								onChange={store.setAudioTrackTimeRgbShift}
							/>

							<CollapsibleSection
								label={t.section_track_time_filters}
								defaultOpen={false}
							>
								<SliderControl
									label={t.label_brightness}
									value={store.audioTrackTimeFilterBrightness}
									{...TRACK_TITLE_RANGES.filterBrightness}
									onChange={
										store.setAudioTrackTimeFilterBrightness
									}
								/>
								<SliderControl
									label={t.label_contrast}
									value={store.audioTrackTimeFilterContrast}
									{...TRACK_TITLE_RANGES.filterContrast}
									onChange={store.setAudioTrackTimeFilterContrast}
								/>
								<SliderControl
									label={t.label_saturation}
									value={store.audioTrackTimeFilterSaturation}
									{...TRACK_TITLE_RANGES.filterSaturation}
									onChange={store.setAudioTrackTimeFilterSaturation}
								/>
								<SliderControl
									label={t.label_blur}
									value={store.audioTrackTimeFilterBlur}
									{...TRACK_TITLE_RANGES.filterBlur}
									onChange={store.setAudioTrackTimeFilterBlur}
									unit="px"
								/>
								<SliderControl
									label={t.label_hue_rotate}
									value={store.audioTrackTimeFilterHueRotate}
									{...TRACK_TITLE_RANGES.filterHueRotate}
									onChange={store.setAudioTrackTimeFilterHueRotate}
									unit="deg"
								/>
							</CollapsibleSection>
						</>
					)}
				</>
			)}

			<SectionDivider />
			<ResetButton label={t.reset_tab} onClick={onReset} />
		</>
	);
}
