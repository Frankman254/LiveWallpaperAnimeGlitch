import { RotateCcw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { TRACK_TITLE_RANGES } from '@/config/ranges';
import { useAudioContext } from '@/context/useAudioContext';
import {
	doProfileSettingsMatch,
	extractTrackTitleProfileSettings,
	MAX_TRACK_TITLE_SLOT_COUNT
} from '@/lib/featureProfiles';
import { resolveTrackDisplay } from '@/lib/audio/trackMetadata';
import { useT } from '@/lib/i18n';
import { useTabViewState } from '@/hooks/useTabViewState';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	ColorSourceMode,
	TrackTitleFontStyle,
	TrackTitleLayoutMode,
	WallpaperState
} from '@/types/wallpaper';
import {
	Button,
	CollapsibleSection,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ProfileSlotsEditor,
	FeatureGate,
	SectionCard,
	SegmentedControl,
	Slider,
	TabFade,
	UI_COLORS,
	ICON_SIZE
} from '@/ui';
import {
	ColorSourceField,
	HintText,
	OptionButtonGroup,
	SwitchRow
} from './advancedControls';
import type {
	NowPlayingMode,
	NowPlayingTextTreatment,
	TrackMetadataAutoSource,
	TrackMetadataMode
} from '@/types/wallpaper';
import {
	TRACK_TITLE_FONT_LABELS,
	TRACK_TITLE_FONTS,
	TRACK_TITLE_LAYOUT_LABELS,
	TRACK_TITLE_LAYOUTS
} from '../trackTitleOptions';

type TrackView = 'content' | 'style' | 'layout';

const TRACK_VIEW_STORAGE_KEY = 'lwag-track-info-view';

function isTrackView(value: unknown): value is TrackView {
	return value === 'content' || value === 'style' || value === 'layout';
}

const TEXT_TREATMENTS: NowPlayingTextTreatment[] = [
	'solid',
	'gradient',
	'metallic',
	'neon',
	'glass',
	'shadow'
];

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

export default function TrackTitleTab({ onReset }: { onReset: () => void }) {
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
			audioTrackTitleStrokeColorSource:
				s.audioTrackTitleStrokeColorSource,
			audioTrackTitleStrokeWidth: s.audioTrackTitleStrokeWidth,
			audioTrackTitleGlowColor: s.audioTrackTitleGlowColor,
			audioTrackTitleGlowColorSource: s.audioTrackTitleGlowColorSource,
			audioTrackTitleGlowBlur: s.audioTrackTitleGlowBlur,
			audioTrackTitleGlowReach: s.audioTrackTitleGlowReach,
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
			audioTrackTimeGlowReach: s.audioTrackTimeGlowReach,
			audioTrackTimeRgbShift: s.audioTrackTimeRgbShift,
			audioTrackTimeFilterBrightness: s.audioTrackTimeFilterBrightness,
			audioTrackTimeFilterContrast: s.audioTrackTimeFilterContrast,
			audioTrackTimeFilterSaturation: s.audioTrackTimeFilterSaturation,
			audioTrackTimeFilterBlur: s.audioTrackTimeFilterBlur,
			audioTrackTimeFilterHueRotate: s.audioTrackTimeFilterHueRotate,
			trackManualArtist: s.trackManualArtist,
			trackManualTitle: s.trackManualTitle,
			setTrackManualArtist: s.setTrackManualArtist,
			setTrackManualTitle: s.setTrackManualTitle,
			trackTitleProfileSlots: s.trackTitleProfileSlots,
			setTrackTitleColorSources: s.setTrackTitleColorSources,
			setAudioTrackTitleEnabled: s.setAudioTrackTitleEnabled,
			setAudioTrackTimeEnabled: s.setAudioTrackTimeEnabled,
			setAudioTrackTitleBackdropEnabled:
				s.setAudioTrackTitleBackdropEnabled,
			setAudioTrackTitleBackdropColor: s.setAudioTrackTitleBackdropColor,
			setAudioTrackTitleBackdropColorSource:
				s.setAudioTrackTitleBackdropColorSource,
			setAudioTrackTitleBackdropOpacity:
				s.setAudioTrackTitleBackdropOpacity,
			setAudioTrackTitleBackdropPadding:
				s.setAudioTrackTitleBackdropPadding,
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
			setAudioTrackTitleTextColorSource:
				s.setAudioTrackTitleTextColorSource,
			setAudioTrackTitleStrokeColor: s.setAudioTrackTitleStrokeColor,
			setAudioTrackTitleStrokeColorSource:
				s.setAudioTrackTitleStrokeColorSource,
			setAudioTrackTitleStrokeWidth: s.setAudioTrackTitleStrokeWidth,
			setAudioTrackTitleGlowColor: s.setAudioTrackTitleGlowColor,
			setAudioTrackTitleGlowColorSource:
				s.setAudioTrackTitleGlowColorSource,
			setAudioTrackTitleGlowBlur: s.setAudioTrackTitleGlowBlur,
			setAudioTrackTitleGlowReach: s.setAudioTrackTitleGlowReach,
			setAudioTrackTitleRgbShift: s.setAudioTrackTitleRgbShift,
			setAudioTrackTitleFilterBrightness:
				s.setAudioTrackTitleFilterBrightness,
			setAudioTrackTitleFilterContrast:
				s.setAudioTrackTitleFilterContrast,
			setAudioTrackTitleFilterSaturation:
				s.setAudioTrackTitleFilterSaturation,
			setAudioTrackTitleFilterBlur: s.setAudioTrackTitleFilterBlur,
			setAudioTrackTitleFilterHueRotate:
				s.setAudioTrackTitleFilterHueRotate,
			setAudioTrackTimePositionX: s.setAudioTrackTimePositionX,
			setAudioTrackTimePositionY: s.setAudioTrackTimePositionY,
			setAudioTrackTimeWidth: s.setAudioTrackTimeWidth,
			setAudioTrackTimeFontStyle: s.setAudioTrackTimeFontStyle,
			setAudioTrackTimeFontSize: s.setAudioTrackTimeFontSize,
			setAudioTrackTimeLetterSpacing: s.setAudioTrackTimeLetterSpacing,
			setAudioTrackTimeOpacity: s.setAudioTrackTimeOpacity,
			setAudioTrackTimeTextColor: s.setAudioTrackTimeTextColor,
			setAudioTrackTimeTextColorSource:
				s.setAudioTrackTimeTextColorSource,
			setAudioTrackTimeStrokeColor: s.setAudioTrackTimeStrokeColor,
			setAudioTrackTimeStrokeColorSource:
				s.setAudioTrackTimeStrokeColorSource,
			setAudioTrackTimeStrokeWidth: s.setAudioTrackTimeStrokeWidth,
			setAudioTrackTimeGlowColor: s.setAudioTrackTimeGlowColor,
			setAudioTrackTimeGlowColorSource:
				s.setAudioTrackTimeGlowColorSource,
			setAudioTrackTimeGlowBlur: s.setAudioTrackTimeGlowBlur,
			setAudioTrackTimeGlowReach: s.setAudioTrackTimeGlowReach,
			setAudioTrackTimeRgbShift: s.setAudioTrackTimeRgbShift,
			setAudioTrackTimeFilterBrightness:
				s.setAudioTrackTimeFilterBrightness,
			setAudioTrackTimeFilterContrast: s.setAudioTrackTimeFilterContrast,
			setAudioTrackTimeFilterSaturation:
				s.setAudioTrackTimeFilterSaturation,
			setAudioTrackTimeFilterBlur: s.setAudioTrackTimeFilterBlur,
			setAudioTrackTimeFilterHueRotate:
				s.setAudioTrackTimeFilterHueRotate,
			loadTrackTitleProfileSlot: s.loadTrackTitleProfileSlot,
			saveTrackTitleProfileSlot: s.saveTrackTitleProfileSlot,
			addTrackTitleProfileSlot: s.addTrackTitleProfileSlot,
			removeTrackTitleProfileSlot: s.removeTrackTitleProfileSlot
		}))
	);
	const np = useWallpaperStore(
		useShallow(s => ({
			trackMetadataMode: s.trackMetadataMode,
			trackMetadataAutoSource: s.trackMetadataAutoSource,
			nowPlayingMode: s.nowPlayingMode,
			nowPlayingCoverEnabled: s.nowPlayingCoverEnabled,
			nowPlayingArtistEnabled: s.nowPlayingArtistEnabled,
			nowPlayingProgressEnabled: s.nowPlayingProgressEnabled,
			nowPlayingScale: s.nowPlayingScale,
			nowPlayingAccentColor: s.nowPlayingAccentColor,
			nowPlayingAccentColorSource: s.nowPlayingAccentColorSource,
			nowPlayingTextTreatment: s.nowPlayingTextTreatment,
			nowPlayingLiquidGlassEnabled: s.nowPlayingLiquidGlassEnabled,
			nowPlayingLiquidGlassBlur: s.nowPlayingLiquidGlassBlur,
			nowPlayingLiquidGlassMagnify: s.nowPlayingLiquidGlassMagnify,
			nowPlayingLiquidGlassTint: s.nowPlayingLiquidGlassTint,
			setNowPlayingLiquidGlassEnabled: s.setNowPlayingLiquidGlassEnabled,
			setNowPlayingLiquidGlassBlur: s.setNowPlayingLiquidGlassBlur,
			setNowPlayingLiquidGlassMagnify: s.setNowPlayingLiquidGlassMagnify,
			setNowPlayingLiquidGlassTint: s.setNowPlayingLiquidGlassTint,
			setNowPlayingTextTreatment: s.setNowPlayingTextTreatment,
			setTrackMetadataMode: s.setTrackMetadataMode,
			setTrackMetadataAutoSource: s.setTrackMetadataAutoSource,
			setNowPlayingMode: s.setNowPlayingMode,
			setNowPlayingCoverEnabled: s.setNowPlayingCoverEnabled,
			setNowPlayingArtistEnabled: s.setNowPlayingArtistEnabled,
			setNowPlayingProgressEnabled: s.setNowPlayingProgressEnabled,
			setNowPlayingScale: s.setNowPlayingScale,
			setNowPlayingAccentColor: s.setNowPlayingAccentColor,
			setNowPlayingAccentColorSource: s.setNowPlayingAccentColorSource,
			audioTracks: s.audioTracks,
			activeAudioTrackId: s.activeAudioTrackId,
			updateAudioTrack: s.updateAudioTrack
		}))
	);
	const activeTrack =
		np.audioTracks.find(track => track.id === np.activeAudioTrackId) ??
		null;
	const isWidget = np.nowPlayingMode === 'widget';
	const [view, changeView] = useTabViewState<TrackView>(
		TRACK_VIEW_STORAGE_KEY,
		'content',
		isTrackView
	);
	// Manual fields bind to the active playlist track when present; otherwise
	// to the global fallback so manual mode works in live/file capture too.
	const manualArtist = activeTrack
		? (activeTrack.manualArtist ?? '')
		: store.trackManualArtist;
	const manualTitle = activeTrack
		? (activeTrack.manualTitle ?? '')
		: store.trackManualTitle;
	const setManualArtist = (value: string) =>
		activeTrack
			? np.updateAudioTrack(activeTrack.id, { manualArtist: value })
			: store.setTrackManualArtist(value);
	const setManualTitle = (value: string) =>
		activeTrack
			? np.updateAudioTrack(activeTrack.id, { manualTitle: value })
			: store.setTrackManualTitle(value);
	const treatmentLabels: Record<NowPlayingTextTreatment, string> = {
		solid: t.label_treatment_solid,
		gradient: t.label_treatment_gradient,
		metallic: t.label_treatment_metallic,
		neon: t.label_treatment_neon,
		glass: t.label_treatment_glass,
		shadow: t.label_treatment_shadow
	};
	const { captureMode, getFileName, getCurrentTime, getDuration } =
		useAudioContext();
	const isFile =
		captureMode === 'file' && store.audioCaptureState === 'active';
	const isLive = captureMode === 'microphone' || captureMode === 'desktop';
	const previewTrack = activeTrack ?? { name: getFileName() };
	const previewDisplay = resolveTrackDisplay(previewTrack, {
		trackMetadataMode: np.trackMetadataMode,
		trackMetadataAutoSource: np.trackMetadataAutoSource,
		trackManualArtist: store.trackManualArtist,
		trackManualTitle: store.trackManualTitle
	});
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
	const activeSavedProfileIndex = store.trackTitleProfileSlots.findIndex(
		slot => doProfileSettingsMatch(currentProfileSettings, slot.values)
	);
	const colorSourceLabels: Record<ColorSourceMode, string> = {
		manual: t.label_manual_color,
		theme: t.label_theme,
		image: t.label_current_image
	};

	return (
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_track}
					subtitle={isLive ? t.hint_track_info_live_mode : undefined}
				>
					<OptionButtonGroup<ColorSourceMode>
						label={t.label_color_source}
						options={['manual', 'theme', 'image']}
						value={sharedTrackTitleColorSource}
						onChange={store.setTrackTitleColorSources}
						labels={colorSourceLabels}
						columns={3}
					/>
				</EditorTabHeader>
			}
			savedProfiles={
				<SectionCard
					title={t.section_saved_profiles}
					subtitle={t.hint_saved_profiles}
					density="compact"
				>
					<ProfileSlotsEditor
						title=""
						hint={t.hint_saved_profiles}
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
			}
			footer={
				<EditorTabFooter title={t.label_reset}>
					<Button
						type="button"
						onClick={onReset}
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.reset_tab}
					</Button>
				</EditorTabFooter>
			}
		>
			<SectionCard title={t.section_track_details} density="compact">
				<div className="flex flex-col gap-3">
					<div
						className={
							isLive
								? 'pointer-events-none opacity-40'
								: undefined
						}
						aria-disabled={isLive}
					>
						{isWidget ? (
							<SwitchRow
								label={t.label_show_now_playing}
								checked={store.audioTrackTitleEnabled}
								onChange={store.setAudioTrackTitleEnabled}
							/>
						) : (
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
						)}
					</div>
					<SegmentedControl<NowPlayingMode>
						value={np.nowPlayingMode}
						onChange={np.setNowPlayingMode}
						options={[
							{
								value: 'widget',
								label: t.label_now_playing_widget
							},
							{ value: 'free', label: t.label_now_playing_free }
						]}
						size="sm"
						density="compact"
						full
						ariaLabel={t.section_now_playing}
					/>
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
									{previewDisplay.title ||
										t.label_track_title_empty}
								</span>
							</div>
							{previewTime ? <div>{previewTime}</div> : null}
						</div>
					) : null}
				</div>
			</SectionCard>

			{trackDetailsEnabled ? (
				<SectionCard
					title={t.spectrum_section_sections}
					density="compact"
				>
					<SegmentedControl<TrackView>
						value={view}
						onChange={changeView}
						options={[
							{ value: 'content', label: t.track_view_content },
							{ value: 'style', label: t.track_view_style },
							{ value: 'layout', label: t.track_view_layout }
						]}
						size="sm"
						density="compact"
						full
						ariaLabel={t.spectrum_section_sections}
					/>
				</SectionCard>
			) : null}

			<FeatureGate
				enabled={trackDetailsEnabled}
				hint={t.hint_enable_to_configure}
			>
			<TabFade tabKey={view}>
			{view === 'content' ? (
				<SectionCard title={t.section_track_metadata} density="compact">
					<div className="flex flex-col gap-3">
						<SegmentedControl<TrackMetadataMode>
							value={np.trackMetadataMode}
							onChange={np.setTrackMetadataMode}
							options={[
								{ value: 'auto', label: t.label_metadata_auto },
								{
									value: 'manual',
									label: t.label_metadata_manual
								}
							]}
							size="sm"
							density="compact"
							full
							ariaLabel={t.section_track_metadata}
						/>
						{np.trackMetadataMode === 'auto' ? (
							<>
								<SegmentedControl<TrackMetadataAutoSource>
									value={np.trackMetadataAutoSource}
									onChange={np.setTrackMetadataAutoSource}
									options={[
										{
											value: 'name',
											label: t.label_metadata_source_name
										},
										{
											value: 'full',
											label: t.label_metadata_source_full
										}
									]}
									size="sm"
									density="compact"
									full
									ariaLabel={t.label_metadata_source}
								/>
								<HintText>
									{np.trackMetadataAutoSource === 'full'
										? t.hint_metadata_source_full
										: t.hint_metadata_source_name}
								</HintText>
							</>
						) : (
							<div className="flex flex-col gap-2">
								{!activeTrack ? (
									<HintText>
										{t.hint_metadata_manual_global}
									</HintText>
								) : null}
								<label className="flex flex-col gap-1 text-[12px]">
									<span style={{ color: UI_COLORS.fgMute }}>
										{t.label_artist}
									</span>
									<input
										type="text"
										value={manualArtist}
										placeholder={t.label_artist}
										onChange={event =>
											setManualArtist(event.target.value)
										}
										className="rounded-[var(--editor-radius-sm)] border px-2 py-1 text-[12px]"
										style={{
											borderColor: UI_COLORS.border,
											background: UI_COLORS.raised,
											color: UI_COLORS.fg
										}}
									/>
								</label>
								<label className="flex flex-col gap-1 text-[12px]">
									<span style={{ color: UI_COLORS.fgMute }}>
										{t.label_title}
									</span>
									<input
										type="text"
										value={manualTitle}
										placeholder={t.label_title}
										onChange={event =>
											setManualTitle(event.target.value)
										}
										className="rounded-[var(--editor-radius-sm)] border px-2 py-1 text-[12px]"
										style={{
											borderColor: UI_COLORS.border,
											background: UI_COLORS.raised,
											color: UI_COLORS.fg
										}}
									/>
								</label>
							</div>
						)}
					</div>
				</SectionCard>
			) : null}

			{view === 'content' && trackDetailsEnabled && isWidget ? (
				<SectionCard title={t.section_now_playing} density="compact">
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						<SwitchRow
							label={t.label_widget_cover}
							checked={np.nowPlayingCoverEnabled}
							onChange={np.setNowPlayingCoverEnabled}
						/>
						<SwitchRow
							label={t.label_widget_artist}
							checked={np.nowPlayingArtistEnabled}
							onChange={np.setNowPlayingArtistEnabled}
						/>
						<SwitchRow
							label={t.label_widget_progress}
							checked={np.nowPlayingProgressEnabled}
							onChange={np.setNowPlayingProgressEnabled}
						/>
					</div>
					<SwitchRow
						label={t.label_liquid_glass}
						hint={t.hint_liquid_glass}
						checked={np.nowPlayingLiquidGlassEnabled}
						onChange={np.setNowPlayingLiquidGlassEnabled}
					/>
					{np.nowPlayingLiquidGlassEnabled ? (
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<Slider
								label={t.label_glass_blur}
								value={np.nowPlayingLiquidGlassBlur}
								min={0}
								max={60}
								step={1}
								unit="px"
								variant="compact"
								onChange={np.setNowPlayingLiquidGlassBlur}
							/>
							<Slider
								label={t.label_glass_magnify}
								value={np.nowPlayingLiquidGlassMagnify}
								min={1}
								max={1.4}
								step={0.01}
								variant="compact"
								formatValue={formatDecimal}
								onChange={np.setNowPlayingLiquidGlassMagnify}
							/>
							<Slider
								label={t.label_glass_tint}
								value={np.nowPlayingLiquidGlassTint}
								min={0}
								max={0.8}
								step={0.01}
								variant="compact"
								formatValue={formatDecimal}
								onChange={np.setNowPlayingLiquidGlassTint}
							/>
						</div>
					) : null}
				</SectionCard>
			) : null}

			{view === 'style' && trackDetailsEnabled && isWidget ? (
				<SectionCard title={t.track_view_style} density="compact">
					<div className="flex flex-col gap-3">
						<OptionButtonGroup<TrackTitleFontStyle>
							label={t.label_font_style}
							options={TRACK_TITLE_FONTS}
							value={store.audioTrackTitleFontStyle}
							onChange={store.setAudioTrackTitleFontStyle}
							labels={TRACK_TITLE_FONT_LABELS}
							columns="auto"
						/>
						<OptionButtonGroup<NowPlayingTextTreatment>
							label={t.label_text_treatment}
							options={TEXT_TREATMENTS}
							value={np.nowPlayingTextTreatment}
							onChange={np.setNowPlayingTextTreatment}
							labels={treatmentLabels}
							columns={3}
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
								label={t.label_opacity}
								value={store.audioTrackTitleOpacity}
								{...TRACK_TITLE_RANGES.opacity}
								onChange={store.setAudioTrackTitleOpacity}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
								label={t.label_scroll_speed}
								value={store.audioTrackTitleScrollSpeed}
								{...TRACK_TITLE_RANGES.scrollSpeed}
								onChange={store.setAudioTrackTitleScrollSpeed}
								unit="px/s"
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
						<HintText>{t.hint_widget_scroll}</HintText>
						<SwitchRow
							label={t.label_uppercase}
							checked={store.audioTrackTitleUppercase}
							onChange={store.setAudioTrackTitleUppercase}
						/>
						<ColorSourceField
							label={t.label_fill_color}
							source={store.audioTrackTitleTextColorSource}
							onSourceChange={
								store.setAudioTrackTitleTextColorSource
							}
							value={store.audioTrackTitleTextColor}
							onChange={store.setAudioTrackTitleTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_artist_color}
							source={store.audioTrackTimeTextColorSource}
							onSourceChange={
								store.setAudioTrackTimeTextColorSource
							}
							value={store.audioTrackTimeTextColor}
							onChange={store.setAudioTrackTimeTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						{np.nowPlayingProgressEnabled ? (
							<ColorSourceField
								label={t.label_accent_color}
								source={np.nowPlayingAccentColorSource}
								onSourceChange={
									np.setNowPlayingAccentColorSource
								}
								value={np.nowPlayingAccentColor}
								onChange={np.setNowPlayingAccentColor}
								labels={colorSourceLabels}
								hintTheme={t.hint_theme_palette_auto}
								hintImage={t.hint_background_palette_auto}
							/>
						) : null}
						<ColorSourceField
							label={t.label_glow_color}
							source={store.audioTrackTitleGlowColorSource}
							onSourceChange={
								store.setAudioTrackTitleGlowColorSource
							}
							value={store.audioTrackTitleGlowColor}
							onChange={store.setAudioTrackTitleGlowColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_stroke_color}
							source={store.audioTrackTitleStrokeColorSource}
							onSourceChange={
								store.setAudioTrackTitleStrokeColorSource
							}
							value={store.audioTrackTitleStrokeColor}
							onChange={store.setAudioTrackTitleStrokeColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<Slider
								label={t.label_stroke_width}
								value={store.audioTrackTitleStrokeWidth}
								{...TRACK_TITLE_RANGES.strokeWidth}
								onChange={store.setAudioTrackTitleStrokeWidth}
								unit="px"
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_glow_blur}
								value={store.audioTrackTitleGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTitleGlowBlur}
								variant="compact"
								formatValue={formatInteger}
							/>
						</div>
					</div>
				</SectionCard>
			) : null}

			{view === 'layout' && trackDetailsEnabled && isWidget ? (
				<SectionCard title={t.track_view_layout} density="compact">
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<Slider
							label={t.label_scale}
							value={np.nowPlayingScale}
							{...TRACK_TITLE_RANGES.nowPlayingScale}
							onChange={np.setNowPlayingScale}
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
						<Slider
							label={t.label_position_x}
							value={store.audioTrackTitlePositionX}
							{...TRACK_TITLE_RANGES.positionX}
							onChange={store.setAudioTrackTitlePositionX}
							variant="compact"
							formatValue={formatDecimal}
						/>
						<Slider
							label={t.label_position_y}
							value={store.audioTrackTitlePositionY}
							{...TRACK_TITLE_RANGES.positionY}
							onChange={store.setAudioTrackTitlePositionY}
							variant="compact"
							formatValue={formatDecimal}
						/>
					</div>
				</SectionCard>
			) : null}

			{view === 'layout' && trackDetailsEnabled ? (
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
									source={
										store.audioTrackTitleBackdropColorSource
									}
									onSourceChange={
										store.setAudioTrackTitleBackdropColorSource
									}
									value={store.audioTrackTitleBackdropColor}
									onChange={
										store.setAudioTrackTitleBackdropColor
									}
									labels={colorSourceLabels}
									hintTheme={t.hint_theme_palette_auto}
									hintImage={t.hint_background_palette_auto}
								/>
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<Slider
										label={t.label_backdrop_opacity}
										value={
											store.audioTrackTitleBackdropOpacity
										}
										{...TRACK_TITLE_RANGES.backdropOpacity}
										onChange={
											store.setAudioTrackTitleBackdropOpacity
										}
										variant="compact"
										formatValue={formatDecimal}
									/>
									<Slider
										label={t.label_backdrop_padding}
										value={
											store.audioTrackTitleBackdropPadding
										}
										{...TRACK_TITLE_RANGES.backdropPadding}
										onChange={
											store.setAudioTrackTitleBackdropPadding
										}
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

			{view === 'layout' && !isWidget && store.audioTrackTitleEnabled ? (
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
					</div>
				</SectionCard>
			) : null}

			{view === 'layout' && !isWidget && store.audioTrackTimeEnabled ? (
				<SectionCard title={t.section_track_time} density="compact">
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
				</SectionCard>
			) : null}

			{view === 'style' && !isWidget && store.audioTrackTitleEnabled ? (
				<SectionCard title={t.section_track_title} density="compact">
					<div className="flex flex-col gap-3">
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
							onSourceChange={
								store.setAudioTrackTitleTextColorSource
							}
							value={store.audioTrackTitleTextColor}
							onChange={store.setAudioTrackTitleTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_stroke_color}
							source={store.audioTrackTitleStrokeColorSource}
							onSourceChange={
								store.setAudioTrackTitleStrokeColorSource
							}
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
							onSourceChange={
								store.setAudioTrackTitleGlowColorSource
							}
							value={store.audioTrackTitleGlowColor}
							onChange={store.setAudioTrackTitleGlowColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<Slider
								label={t.label_glow_blur}
								value={store.audioTrackTitleGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTitleGlowBlur}
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_glow_reach}
								value={store.audioTrackTitleGlowReach}
								{...TRACK_TITLE_RANGES.glowReach}
								onChange={store.setAudioTrackTitleGlowReach}
								variant="compact"
								formatValue={formatDecimal}
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
									brightness:
										store.audioTrackTitleFilterBrightness,
									contrast:
										store.audioTrackTitleFilterContrast,
									saturation:
										store.audioTrackTitleFilterSaturation,
									blur: store.audioTrackTitleFilterBlur,
									hueRotate:
										store.audioTrackTitleFilterHueRotate
								}}
								setters={{
									brightness:
										store.setAudioTrackTitleFilterBrightness,
									contrast:
										store.setAudioTrackTitleFilterContrast,
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

			{view === 'style' && !isWidget && store.audioTrackTimeEnabled ? (
				<SectionCard title={t.section_track_time} density="compact">
					<div className="flex flex-col gap-3">
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
							onSourceChange={
								store.setAudioTrackTimeTextColorSource
							}
							value={store.audioTrackTimeTextColor}
							onChange={store.setAudioTrackTimeTextColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<ColorSourceField
							label={t.label_stroke_color}
							source={store.audioTrackTimeStrokeColorSource}
							onSourceChange={
								store.setAudioTrackTimeStrokeColorSource
							}
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
							onSourceChange={
								store.setAudioTrackTimeGlowColorSource
							}
							value={store.audioTrackTimeGlowColor}
							onChange={store.setAudioTrackTimeGlowColor}
							labels={colorSourceLabels}
							hintTheme={t.hint_theme_palette_auto}
							hintImage={t.hint_background_palette_auto}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
							<Slider
								label={t.label_glow_blur}
								value={store.audioTrackTimeGlowBlur}
								{...TRACK_TITLE_RANGES.glowBlur}
								onChange={store.setAudioTrackTimeGlowBlur}
								variant="compact"
								formatValue={formatInteger}
							/>
							<Slider
								label={t.label_glow_reach}
								value={store.audioTrackTimeGlowReach}
								{...TRACK_TITLE_RANGES.glowReach}
								onChange={store.setAudioTrackTimeGlowReach}
								variant="compact"
								formatValue={formatDecimal}
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
									brightness:
										store.audioTrackTimeFilterBrightness,
									contrast:
										store.audioTrackTimeFilterContrast,
									saturation:
										store.audioTrackTimeFilterSaturation,
									blur: store.audioTrackTimeFilterBlur,
									hueRotate:
										store.audioTrackTimeFilterHueRotate
								}}
								setters={{
									brightness:
										store.setAudioTrackTimeFilterBrightness,
									contrast:
										store.setAudioTrackTimeFilterContrast,
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

			</TabFade>
			</FeatureGate>

			{isLive ? <HintText>{t.hint_track_info_live_mode}</HintText> : null}
		</EditorTabLayout>
	);
}
