import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { TRACK_TITLE_RANGES } from '@/config/ranges';
import { useAudioContext } from '@/context/useAudioContext';
import {
	doProfileSettingsMatch,
	extractTrackTitleProfileSettings,
	MAX_TRACK_TITLE_SLOT_COUNT,
	type TrackTitleProfileSettings
} from '@/lib/featureProfiles';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	ColorSourceMode,
	TrackTitleFontStyle,
	TrackTitleLayoutMode,
	WallpaperState
} from '@/types/wallpaper';
import {
	CollapsibleSection,
	IconButton,
	SectionCard,
	Slider,
	UI_COLORS,
	ICON_SIZE
} from '@/ui';
import {
	ColorSourceField,
	HintText,
	OptionButtonGroup,
	ProfileSlotsGrid,
	SwitchRow
} from './modernAdvancedControls';
import {
	TRACK_TITLE_FONT_LABELS,
	TRACK_TITLE_FONTS,
	TRACK_TITLE_LAYOUT_LABELS,
	TRACK_TITLE_LAYOUTS
} from '../trackTitleOptions';

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

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function formatInteger(value: number): string {
	return Math.round(value).toString();
}

function sharedColorSource(values: ColorSourceMode[]): ColorSourceMode | null {
	const first = values[0];
	if (!first) return null;
	return values.every(value => value === first) ? first : null;
}

function FilterSliders({
	values,
	setters,
	labels
}: {
	values: {
		brightness: number;
		contrast: number;
		saturation: number;
		blur: number;
		hueRotate: number;
	};
	setters: {
		brightness: (value: number) => void;
		contrast: (value: number) => void;
		saturation: (value: number) => void;
		blur: (value: number) => void;
		hueRotate: (value: number) => void;
	};
	labels: {
		brightness: string;
		contrast: string;
		saturation: string;
		blur: string;
		hueRotate: string;
	};
}) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
			<Slider
				label={labels.brightness}
				value={values.brightness}
				{...TRACK_TITLE_RANGES.filterBrightness}
				onChange={setters.brightness}
				variant="compact"
				formatValue={formatDecimal}
			/>
			<Slider
				label={labels.contrast}
				value={values.contrast}
				{...TRACK_TITLE_RANGES.filterContrast}
				onChange={setters.contrast}
				variant="compact"
				formatValue={formatDecimal}
			/>
			<Slider
				label={labels.saturation}
				value={values.saturation}
				{...TRACK_TITLE_RANGES.filterSaturation}
				onChange={setters.saturation}
				variant="compact"
				formatValue={formatDecimal}
			/>
			<Slider
				label={labels.blur}
				value={values.blur}
				{...TRACK_TITLE_RANGES.filterBlur}
				onChange={setters.blur}
				unit="px"
				variant="compact"
				formatValue={formatDecimal}
			/>
			<Slider
				label={labels.hueRotate}
				value={values.hueRotate}
				{...TRACK_TITLE_RANGES.filterHueRotate}
				onChange={setters.hueRotate}
				unit="deg"
				variant="compact"
				formatValue={formatInteger}
			/>
		</div>
	);
}

export default function ModernTrackTitleTab({
	onReset
}: {
	onReset: () => void;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			audioCaptureState: s.audioCaptureState,
			audioTrackTitleEnabled: s.audioTrackTitleEnabled,
			audioTrackTimeEnabled: s.audioTrackTimeEnabled,
			audioTrackTitleBackdropEnabled: s.audioTrackTitleBackdropEnabled,
			audioTrackTitleBackdropColor: s.audioTrackTitleBackdropColor,
			audioTrackTitleBackdropColorSource:
				s.audioTrackTitleBackdropColorSource,
			audioTrackTitleBackdropOpacity: s.audioTrackTitleBackdropOpacity,
			audioTrackTitleBackdropPadding: s.audioTrackTitleBackdropPadding,
			audioTrackTitleLayoutMode: s.audioTrackTitleLayoutMode,
			audioTrackTitlePositionX: s.audioTrackTitlePositionX,
			audioTrackTitlePositionY: s.audioTrackTitlePositionY,
			audioTrackTitleWidth: s.audioTrackTitleWidth,
			audioTrackTitleFontStyle: s.audioTrackTitleFontStyle,
			audioTrackTitleUppercase: s.audioTrackTitleUppercase,
			audioTrackTitleFontSize: s.audioTrackTitleFontSize,
			audioTrackTitleLetterSpacing: s.audioTrackTitleLetterSpacing,
			audioTrackTitleOpacity: s.audioTrackTitleOpacity,
			audioTrackTitleScrollSpeed: s.audioTrackTitleScrollSpeed,
			audioTrackTitleTextColor: s.audioTrackTitleTextColor,
			audioTrackTitleTextColorSource: s.audioTrackTitleTextColorSource,
			audioTrackTitleStrokeColor: s.audioTrackTitleStrokeColor,
			audioTrackTitleStrokeColorSource: s.audioTrackTitleStrokeColorSource,
			audioTrackTitleStrokeWidth: s.audioTrackTitleStrokeWidth,
			audioTrackTitleGlowColor: s.audioTrackTitleGlowColor,
			audioTrackTitleGlowColorSource: s.audioTrackTitleGlowColorSource,
			audioTrackTitleGlowBlur: s.audioTrackTitleGlowBlur,
			audioTrackTitleRgbShift: s.audioTrackTitleRgbShift,
			audioTrackTitleFilterBrightness: s.audioTrackTitleFilterBrightness,
			audioTrackTitleFilterContrast: s.audioTrackTitleFilterContrast,
			audioTrackTitleFilterSaturation: s.audioTrackTitleFilterSaturation,
			audioTrackTitleFilterBlur: s.audioTrackTitleFilterBlur,
			audioTrackTitleFilterHueRotate: s.audioTrackTitleFilterHueRotate,
			audioTrackTimePositionX: s.audioTrackTimePositionX,
			audioTrackTimePositionY: s.audioTrackTimePositionY,
			audioTrackTimeWidth: s.audioTrackTimeWidth,
			audioTrackTimeFontStyle: s.audioTrackTimeFontStyle,
			audioTrackTimeFontSize: s.audioTrackTimeFontSize,
			audioTrackTimeLetterSpacing: s.audioTrackTimeLetterSpacing,
			audioTrackTimeOpacity: s.audioTrackTimeOpacity,
			audioTrackTimeTextColor: s.audioTrackTimeTextColor,
			audioTrackTimeTextColorSource: s.audioTrackTimeTextColorSource,
			audioTrackTimeStrokeColor: s.audioTrackTimeStrokeColor,
			audioTrackTimeStrokeColorSource: s.audioTrackTimeStrokeColorSource,
			audioTrackTimeStrokeWidth: s.audioTrackTimeStrokeWidth,
			audioTrackTimeGlowColor: s.audioTrackTimeGlowColor,
			audioTrackTimeGlowColorSource: s.audioTrackTimeGlowColorSource,
			audioTrackTimeGlowBlur: s.audioTrackTimeGlowBlur,
			audioTrackTimeRgbShift: s.audioTrackTimeRgbShift,
			audioTrackTimeFilterBrightness: s.audioTrackTimeFilterBrightness,
			audioTrackTimeFilterContrast: s.audioTrackTimeFilterContrast,
			audioTrackTimeFilterSaturation: s.audioTrackTimeFilterSaturation,
			audioTrackTimeFilterBlur: s.audioTrackTimeFilterBlur,
			audioTrackTimeFilterHueRotate: s.audioTrackTimeFilterHueRotate,
			trackTitleProfileSlots: s.trackTitleProfileSlots,
			setTrackTitleColorSources: s.setTrackTitleColorSources,
			setAudioTrackTitleEnabled: s.setAudioTrackTitleEnabled,
			setAudioTrackTimeEnabled: s.setAudioTrackTimeEnabled,
			setAudioTrackTitleBackdropEnabled: s.setAudioTrackTitleBackdropEnabled,
			setAudioTrackTitleBackdropColor: s.setAudioTrackTitleBackdropColor,
			setAudioTrackTitleBackdropColorSource:
				s.setAudioTrackTitleBackdropColorSource,
			setAudioTrackTitleBackdropOpacity: s.setAudioTrackTitleBackdropOpacity,
			setAudioTrackTitleBackdropPadding: s.setAudioTrackTitleBackdropPadding,
			setAudioTrackTitleLayoutMode: s.setAudioTrackTitleLayoutMode,
			setAudioTrackTitlePositionX: s.setAudioTrackTitlePositionX,
			setAudioTrackTitlePositionY: s.setAudioTrackTitlePositionY,
			setAudioTrackTitleWidth: s.setAudioTrackTitleWidth,
			setAudioTrackTitleFontStyle: s.setAudioTrackTitleFontStyle,
			setAudioTrackTitleUppercase: s.setAudioTrackTitleUppercase,
			setAudioTrackTitleFontSize: s.setAudioTrackTitleFontSize,
			setAudioTrackTitleLetterSpacing: s.setAudioTrackTitleLetterSpacing,
			setAudioTrackTitleOpacity: s.setAudioTrackTitleOpacity,
			setAudioTrackTitleScrollSpeed: s.setAudioTrackTitleScrollSpeed,
			setAudioTrackTitleTextColor: s.setAudioTrackTitleTextColor,
			setAudioTrackTitleTextColorSource: s.setAudioTrackTitleTextColorSource,
			setAudioTrackTitleStrokeColor: s.setAudioTrackTitleStrokeColor,
			setAudioTrackTitleStrokeColorSource:
				s.setAudioTrackTitleStrokeColorSource,
			setAudioTrackTitleStrokeWidth: s.setAudioTrackTitleStrokeWidth,
			setAudioTrackTitleGlowColor: s.setAudioTrackTitleGlowColor,
			setAudioTrackTitleGlowColorSource: s.setAudioTrackTitleGlowColorSource,
			setAudioTrackTitleGlowBlur: s.setAudioTrackTitleGlowBlur,
			setAudioTrackTitleRgbShift: s.setAudioTrackTitleRgbShift,
			setAudioTrackTitleFilterBrightness:
				s.setAudioTrackTitleFilterBrightness,
			setAudioTrackTitleFilterContrast: s.setAudioTrackTitleFilterContrast,
			setAudioTrackTitleFilterSaturation:
				s.setAudioTrackTitleFilterSaturation,
			setAudioTrackTitleFilterBlur: s.setAudioTrackTitleFilterBlur,
			setAudioTrackTitleFilterHueRotate: s.setAudioTrackTitleFilterHueRotate,
			setAudioTrackTimePositionX: s.setAudioTrackTimePositionX,
			setAudioTrackTimePositionY: s.setAudioTrackTimePositionY,
			setAudioTrackTimeWidth: s.setAudioTrackTimeWidth,
			setAudioTrackTimeFontStyle: s.setAudioTrackTimeFontStyle,
			setAudioTrackTimeFontSize: s.setAudioTrackTimeFontSize,
			setAudioTrackTimeLetterSpacing: s.setAudioTrackTimeLetterSpacing,
			setAudioTrackTimeOpacity: s.setAudioTrackTimeOpacity,
			setAudioTrackTimeTextColor: s.setAudioTrackTimeTextColor,
			setAudioTrackTimeTextColorSource: s.setAudioTrackTimeTextColorSource,
			setAudioTrackTimeStrokeColor: s.setAudioTrackTimeStrokeColor,
			setAudioTrackTimeStrokeColorSource:
				s.setAudioTrackTimeStrokeColorSource,
			setAudioTrackTimeStrokeWidth: s.setAudioTrackTimeStrokeWidth,
			setAudioTrackTimeGlowColor: s.setAudioTrackTimeGlowColor,
			setAudioTrackTimeGlowColorSource: s.setAudioTrackTimeGlowColorSource,
			setAudioTrackTimeGlowBlur: s.setAudioTrackTimeGlowBlur,
			setAudioTrackTimeRgbShift: s.setAudioTrackTimeRgbShift,
			setAudioTrackTimeFilterBrightness: s.setAudioTrackTimeFilterBrightness,
			setAudioTrackTimeFilterContrast: s.setAudioTrackTimeFilterContrast,
			setAudioTrackTimeFilterSaturation: s.setAudioTrackTimeFilterSaturation,
			setAudioTrackTimeFilterBlur: s.setAudioTrackTimeFilterBlur,
			setAudioTrackTimeFilterHueRotate: s.setAudioTrackTimeFilterHueRotate,
			loadTrackTitleProfileSlot: s.loadTrackTitleProfileSlot,
			saveTrackTitleProfileSlot: s.saveTrackTitleProfileSlot,
			addTrackTitleProfileSlot: s.addTrackTitleProfileSlot,
			removeTrackTitleProfileSlot: s.removeTrackTitleProfileSlot
		}))
	);
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
	const sharedTrackTitleColorSource = sharedColorSource([
		store.audioTrackTitleTextColorSource,
		store.audioTrackTitleStrokeColorSource,
		store.audioTrackTitleGlowColorSource,
		store.audioTrackTitleBackdropColorSource,
		store.audioTrackTimeTextColorSource,
		store.audioTrackTimeStrokeColorSource,
		store.audioTrackTimeGlowColorSource
	]);
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const currentProfileSettings = extractTrackTitleProfileSettings(fullStore);
	const activeSavedProfileIndex = store.trackTitleProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentProfileSettings, slot.values)
	);
	const colorSourceLabels: Record<ColorSourceMode, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.tab_track}
				subtitle={isLive ? t.hint_track_info_live_mode : undefined}
				density="compact"
				action={
					<IconButton
						size="sm"
						density="compact"
						onClick={onReset}
						title={t.reset_tab}
					>
						<RotateCcw size={ICON_SIZE.xs} />
					</IconButton>
				}
			>
				<div className="flex flex-col gap-3">
					<OptionButtonGroup<ColorSourceMode>
						label={t.label_color_source}
						options={['manual', 'theme', 'image']}
						value={sharedTrackTitleColorSource}
						onChange={store.setTrackTitleColorSources}
						labels={colorSourceLabels}
						columns={3}
					/>
					<div
						className={isLive ? 'pointer-events-none opacity-40' : undefined}
						aria-disabled={isLive}
					>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<SwitchRow
								label={t.label_track_title_enabled}
								checked={store.audioTrackTitleEnabled}
								onChange={store.setAudioTrackTitleEnabled}
							/>
							<SwitchRow
								label={t.label_track_time_enabled}
								checked={store.audioTrackTimeEnabled}
								onChange={store.setAudioTrackTimeEnabled}
							/>
						</div>
					</div>
					{isFile ? (
						<div
							className="rounded-[var(--editor-radius-md)] border px-3 py-2 text-[12px]"
							style={{
								borderColor: UI_COLORS.border,
								background: UI_COLORS.raised,
								color: UI_COLORS.fgMute
							}}
						>
							<div>
								{t.label_now_playing}:{' '}
								<span style={{ color: UI_COLORS.fg }}>
									{formattedTrackTitle || t.label_track_title_empty}
								</span>
							</div>
							{previewTime ? <div>{previewTime}</div> : null}
						</div>
					) : null}
				</div>
			</SectionCard>

			{trackDetailsEnabled ? (
				<SectionCard title={t.label_backdrop} density="compact">
					<div className="flex flex-col gap-3">
						<SwitchRow
							label={t.label_backdrop}
							checked={store.audioTrackTitleBackdropEnabled}
							onChange={store.setAudioTrackTitleBackdropEnabled}
						/>
						{store.audioTrackTitleBackdropEnabled ? (
							<>
								<ColorSourceField
									label={t.label_backdrop_color}
									source={store.audioTrackTitleBackdropColorSource}
									onSourceChange={
										store.setAudioTrackTitleBackdropColorSource
									}
									value={store.audioTrackTitleBackdropColor}
									onChange={store.setAudioTrackTitleBackdropColor}
									labels={colorSourceLabels}
									hintTheme={t.hint_theme_palette_auto}
									hintImage={t.hint_background_palette_auto}
								/>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={t.label_backdrop_opacity}
										value={store.audioTrackTitleBackdropOpacity}
										{...TRACK_TITLE_RANGES.backdropOpacity}
										onChange={store.setAudioTrackTitleBackdropOpacity}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_backdrop_padding}
										value={store.audioTrackTitleBackdropPadding}
										{...TRACK_TITLE_RANGES.backdropPadding}
										onChange={store.setAudioTrackTitleBackdropPadding}
										unit="px"
										variant="compact"
										formatValue={formatInteger}
									/>
								</div>
							</>
						) : null}
					</div>
				</SectionCard>
			) : null}

			{store.audioTrackTitleEnabled ? (
				<SectionCard title={t.section_track_title} density="compact">
					<div className="flex flex-col gap-3">
						<OptionButtonGroup<TrackTitleLayoutMode>
							label={t.label_track_title_layout}
							options={TRACK_TITLE_LAYOUTS}
							value={store.audioTrackTitleLayoutMode}
							onChange={store.setAudioTrackTitleLayoutMode}
							labels={TRACK_TITLE_LAYOUT_LABELS}
							columns={2}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{store.audioTrackTitleLayoutMode === 'free' ? (
								<Slider
									label={t.label_position_x}
									value={store.audioTrackTitlePositionX}
									{...TRACK_TITLE_RANGES.positionX}
									onChange={store.setAudioTrackTitlePositionX}
									variant="compact"
									formatValue={formatDecimal}
								/>
							) : null}
							<Slider
								label={t.label_position_y}
								value={store.audioTrackTitlePositionY}
								{...TRACK_TITLE_RANGES.positionY}
								onChange={store.setAudioTrackTitlePositionY}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_title_width}
								value={store.audioTrackTitleWidth}
								{...TRACK_TITLE_RANGES.width}
								onChange={store.setAudioTrackTitleWidth}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<OptionButtonGroup<TrackTitleFontStyle>
							label={t.label_font_style}
							options={TRACK_TITLE_FONTS}
							value={store.audioTrackTitleFontStyle}
							onChange={store.setAudioTrackTitleFontStyle}
							labels={TRACK_TITLE_FONT_LABELS}
							columns={3}
						/>
						<SwitchRow
							label={t.label_uppercase}
							checked={store.audioTrackTitleUppercase}
							onChange={store.setAudioTrackTitleUppercase}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_font_size}
								value={store.audioTrackTitleFontSize}
								{...TRACK_TITLE_RANGES.fontSize}
								onChange={store.setAudioTrackTitleFontSize}
								unit="px"
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_letter_spacing}
								value={store.audioTrackTitleLetterSpacing}
								{...TRACK_TITLE_RANGES.letterSpacing}
								onChange={store.setAudioTrackTitleLetterSpacing}
								unit="px"
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_opacity}
								value={store.audioTrackTitleOpacity}
								{...TRACK_TITLE_RANGES.opacity}
								onChange={store.setAudioTrackTitleOpacity}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_scroll_speed}
								value={store.audioTrackTitleScrollSpeed}
								{...TRACK_TITLE_RANGES.scrollSpeed}
								onChange={store.setAudioTrackTitleScrollSpeed}
								unit="px/s"
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
						<ColorSourceField
							label={t.label_fill_color}
							source={store.audioTrackTitleTextColorSource}
							onSourceChange={store.setAudioTrackTitleTextColorSource}
							value={store.audioTrackTitleTextColor}
							onChange={store.setAudioTrackTitleTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_stroke_color}
							source={store.audioTrackTitleStrokeColorSource}
							onSourceChange={store.setAudioTrackTitleStrokeColorSource}
							value={store.audioTrackTitleStrokeColor}
							onChange={store.setAudioTrackTitleStrokeColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<Slider
							label={t.label_stroke_width}
							value={store.audioTrackTitleStrokeWidth}
							{...TRACK_TITLE_RANGES.strokeWidth}
							onChange={store.setAudioTrackTitleStrokeWidth}
							unit="px"
							variant="compact"
							formatValue={formatDecimal}
						/>
						<ColorSourceField
							label={t.label_glow_color}
							source={store.audioTrackTitleGlowColorSource}
							onSourceChange={store.setAudioTrackTitleGlowColorSource}
							value={store.audioTrackTitleGlowColor}
							onChange={store.setAudioTrackTitleGlowColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_glow_blur}
								value={store.audioTrackTitleGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTitleGlowBlur}
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_rgb_shift}
								value={store.audioTrackTitleRgbShift}
								{...TRACK_TITLE_RANGES.rgbShift}
								onChange={store.setAudioTrackTitleRgbShift}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<CollapsibleSection
							title={t.section_track_title_filters}
							defaultOpen={false}
							dense
						>
							<FilterSliders
								values={{
									brightness: store.audioTrackTitleFilterBrightness,
									contrast: store.audioTrackTitleFilterContrast,
									saturation: store.audioTrackTitleFilterSaturation,
									blur: store.audioTrackTitleFilterBlur,
									hueRotate: store.audioTrackTitleFilterHueRotate
								}}
								setters={{
									brightness:
										store.setAudioTrackTitleFilterBrightness,
									contrast: store.setAudioTrackTitleFilterContrast,
									saturation:
										store.setAudioTrackTitleFilterSaturation,
									blur: store.setAudioTrackTitleFilterBlur,
									hueRotate:
										store.setAudioTrackTitleFilterHueRotate
								}}
								labels={{
									brightness: t.label_brightness,
									contrast: t.label_contrast,
									saturation: t.label_saturation,
									blur: t.label_blur,
									hueRotate: t.label_hue_rotate
								}}
							/>
						</CollapsibleSection>
					</div>
				</SectionCard>
			) : null}

			{store.audioTrackTimeEnabled ? (
				<SectionCard title={t.section_track_time} density="compact">
					<div className="flex flex-col gap-3">
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_position_x}
								value={store.audioTrackTimePositionX}
								{...TRACK_TITLE_RANGES.positionX}
								onChange={store.setAudioTrackTimePositionX}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_position_y}
								value={store.audioTrackTimePositionY}
								{...TRACK_TITLE_RANGES.positionY}
								onChange={store.setAudioTrackTimePositionY}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_title_width}
								value={store.audioTrackTimeWidth}
								{...TRACK_TITLE_RANGES.width}
								onChange={store.setAudioTrackTimeWidth}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<OptionButtonGroup<TrackTitleFontStyle>
							label={t.label_font_style}
							options={TRACK_TITLE_FONTS}
							value={store.audioTrackTimeFontStyle}
							onChange={store.setAudioTrackTimeFontStyle}
							labels={TRACK_TITLE_FONT_LABELS}
							columns={3}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_time_font_size}
								value={store.audioTrackTimeFontSize}
								{...TRACK_TITLE_RANGES.fontSize}
								onChange={store.setAudioTrackTimeFontSize}
								unit="px"
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_letter_spacing}
								value={store.audioTrackTimeLetterSpacing}
								{...TRACK_TITLE_RANGES.letterSpacing}
								onChange={store.setAudioTrackTimeLetterSpacing}
								unit="px"
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_opacity}
								value={store.audioTrackTimeOpacity}
								{...TRACK_TITLE_RANGES.opacity}
								onChange={store.setAudioTrackTimeOpacity}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<ColorSourceField
							label={t.label_fill_color}
							source={store.audioTrackTimeTextColorSource}
							onSourceChange={store.setAudioTrackTimeTextColorSource}
							value={store.audioTrackTimeTextColor}
							onChange={store.setAudioTrackTimeTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_stroke_color}
							source={store.audioTrackTimeStrokeColorSource}
							onSourceChange={store.setAudioTrackTimeStrokeColorSource}
							value={store.audioTrackTimeStrokeColor}
							onChange={store.setAudioTrackTimeStrokeColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<Slider
							label={t.label_stroke_width}
							value={store.audioTrackTimeStrokeWidth}
							{...TRACK_TITLE_RANGES.strokeWidth}
							onChange={store.setAudioTrackTimeStrokeWidth}
							unit="px"
							variant="compact"
							formatValue={formatDecimal}
						/>
						<ColorSourceField
							label={t.label_glow_color}
							source={store.audioTrackTimeGlowColorSource}
							onSourceChange={store.setAudioTrackTimeGlowColorSource}
							value={store.audioTrackTimeGlowColor}
							onChange={store.setAudioTrackTimeGlowColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_glow_blur}
								value={store.audioTrackTimeGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTimeGlowBlur}
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_rgb_shift}
								value={store.audioTrackTimeRgbShift}
								{...TRACK_TITLE_RANGES.rgbShift}
								onChange={store.setAudioTrackTimeRgbShift}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<CollapsibleSection
							title={t.section_track_time_filters}
							defaultOpen={false}
							dense
						>
							<FilterSliders
								values={{
									brightness: store.audioTrackTimeFilterBrightness,
									contrast: store.audioTrackTimeFilterContrast,
									saturation: store.audioTrackTimeFilterSaturation,
									blur: store.audioTrackTimeFilterBlur,
									hueRotate: store.audioTrackTimeFilterHueRotate
								}}
								setters={{
									brightness:
										store.setAudioTrackTimeFilterBrightness,
									contrast: store.setAudioTrackTimeFilterContrast,
									saturation:
										store.setAudioTrackTimeFilterSaturation,
									blur: store.setAudioTrackTimeFilterBlur,
									hueRotate:
										store.setAudioTrackTimeFilterHueRotate
								}}
								labels={{
									brightness: t.label_brightness,
									contrast: t.label_contrast,
									saturation: t.label_saturation,
									blur: t.label_blur,
									hueRotate: t.label_hue_rotate
								}}
							/>
						</CollapsibleSection>
					</div>
				</SectionCard>
			) : null}

			<SectionCard
				title={t.section_saved_profiles}
				subtitle={t.hint_saved_profiles}
				density="compact"
			>
				<ProfileSlotsGrid<TrackTitleProfileSettings>
					slots={store.trackTitleProfileSlots}
					activeIndex={
						activeSavedProfileIndex >= 0
							? activeSavedProfileIndex
							: null
					}
					onLoad={store.loadTrackTitleProfileSlot}
					onSave={store.saveTrackTitleProfileSlot}
					onAdd={store.addTrackTitleProfileSlot}
					onDelete={store.removeTrackTitleProfileSlot}
					loadLabel={t.label_load_profile}
					saveLabel={t.label_save_profile}
					slotLabel={t.label_profile_slot}
					emptyLabel={t.profile_slot_empty}
					activeLabel={t.profile_slot_active}
					maxSlots={MAX_TRACK_TITLE_SLOT_COUNT}
				/>
			</SectionCard>
			{isLive ? <HintText>{t.hint_track_info_live_mode}</HintText> : null}
		</div>
	);
}
