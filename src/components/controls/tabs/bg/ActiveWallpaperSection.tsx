import type { ReactNode } from 'react';
import SliderControl from '@/components/controls/SliderControl';
import ToggleControl from '@/components/controls/ToggleControl';
import AudioChannelSelector from '@/components/controls/ui/AudioChannelSelector';
import EnumButtons from '@/components/controls/ui/EnumButtons';
import SectionDivider from '@/components/controls/ui/SectionDivider';
import { IMAGE_RANGES, SLIDESHOW_RANGES } from '@/config/ranges';
import type {
	AudioReactiveChannel,
	BackgroundImageItem,
	SlideshowTransitionType
} from '@/types/wallpaper';
import type { SliderRange } from '@/types/controls';
import BgFitModeSelector from './BgFitModeSelector';
import BgSectionCard from './BgSectionCard';
import { TRANSITION_LABELS, TRANSITION_TYPES } from './constants';

type Props = {
	t: Record<string, string>;
	activeImage: BackgroundImageItem | null;
	activeImageIndex: number;
	imageCount: number;
	imageFitMode: Parameters<typeof BgFitModeSelector>[0]['value'];
	imageScale: number;
	imagePositionX: number;
	imagePositionY: number;
	imagePositionXRange: SliderRange;
	imagePositionYRange: SliderRange;
	imageOpacity: number;
	imageMirror: boolean;
	transitionType: SlideshowTransitionType;
	transitionDuration: number;
	transitionIntensity: number;
	transitionAudioDrive: number;
	transitionAudioChannel: AudioReactiveChannel;
	defaultLayoutCount: number;
	onCaptureLogoOverride: () => void;
	onClearLogoOverride: () => void;
	onCaptureSpectrumOverride: () => void;
	onClearSpectrumOverride: () => void;
	onAutoFitActiveImage: () => void;
	onUploadClick: () => void;
	onPreviousImage: () => void;
	onNextImage: () => void;
	onChangeFitMode: (
		value: Parameters<typeof BgFitModeSelector>[0]['value']
	) => void;
	onChangeScale: (value: number) => void;
	onChangePositionX: (value: number) => void;
	onChangePositionY: (value: number) => void;
	onChangeOpacity: (value: number) => void;
	onChangeMirror: (value: boolean) => void;
	onChangeTransitionType: (value: SlideshowTransitionType) => void;
	onChangeTransitionDuration: (value: number) => void;
	onChangeTransitionIntensity: (value: number) => void;
	onChangeTransitionAudioDrive: (value: number) => void;
	onChangeTransitionAudioChannel: (value: AudioReactiveChannel) => void;
	onApplyLayoutToDefaults: () => void;
};

export default function ActiveWallpaperSection({
	t,
	activeImage,
	activeImageIndex,
	imageCount,
	imageFitMode,
	imageScale,
	imagePositionX,
	imagePositionY,
	imagePositionXRange,
	imagePositionYRange,
	imageOpacity,
	imageMirror,
	transitionType,
	transitionDuration,
	transitionIntensity,
	transitionAudioDrive,
	transitionAudioChannel,
	defaultLayoutCount,
	onCaptureLogoOverride,
	onClearLogoOverride,
	onCaptureSpectrumOverride,
	onClearSpectrumOverride,
	onAutoFitActiveImage,
	onUploadClick,
	onPreviousImage,
	onNextImage,
	onChangeFitMode,
	onChangeScale,
	onChangePositionX,
	onChangePositionY,
	onChangeOpacity,
	onChangeMirror,
	onChangeTransitionType,
	onChangeTransitionDuration,
	onChangeTransitionIntensity,
	onChangeTransitionAudioDrive,
	onChangeTransitionAudioChannel,
	onApplyLayoutToDefaults
}: Props) {
	const logoOverrideActive = activeImage?.logoOverride != null;
	const spectrumOverrideActive = activeImage?.spectrumOverride != null;
	return (
		<BackgroundCardShell
			t={t}
			activeImage={activeImage}
			activeImageIndex={activeImageIndex}
			imageCount={imageCount}
			onUploadClick={onUploadClick}
			onPreviousImage={onPreviousImage}
			onNextImage={onNextImage}
		>
			<BgFitModeSelector
				label={t.label_fit_mode}
				value={imageFitMode}
				onChange={onChangeFitMode}
			/>

			<div className="grid grid-cols-2 gap-2">
				<SliderControl
					label={t.label_scale}
					value={imageScale}
					{...IMAGE_RANGES.scale}
					onChange={onChangeScale}
				/>
				<SliderControl
					label={t.label_opacity}
					value={imageOpacity}
					{...IMAGE_RANGES.opacity}
					onChange={onChangeOpacity}
				/>
				<SliderControl
					label={t.label_position_x}
					value={imagePositionX}
					{...imagePositionXRange}
					onChange={onChangePositionX}
				/>
				<SliderControl
					label={t.label_position_y}
					value={imagePositionY}
					{...imagePositionYRange}
					onChange={onChangePositionY}
				/>
			</div>

			<ToggleControl
				label={t.label_mirror_image}
				value={imageMirror}
				onChange={onChangeMirror}
			/>

			{/* Per-image Logo Override */}
			<div className="flex items-center justify-between mt-2">
				<span className="text-xs" style={{ color: 'var(--editor-accent-soft)' }}>
					Logo Override
					{logoOverrideActive && (
						<span className="ml-1.5 text-[10px] rounded px-1 py-0.5"
							style={{ background: 'var(--editor-active-bg)', color: 'var(--editor-active-fg)' }}>
							active
						</span>
					)}
				</span>
				<div className="flex gap-1">
					<button
						onClick={onCaptureLogoOverride}
						className="rounded border px-2 py-0.5 text-[10px] transition-colors"
						style={{
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
					>
						Capture
					</button>
					{logoOverrideActive && (
						<button
							onClick={onClearLogoOverride}
							className="rounded border px-2 py-0.5 text-[10px] transition-colors"
							style={{
								background: 'var(--editor-tag-bg)',
								borderColor: 'var(--editor-tag-border)',
								color: 'var(--editor-tag-fg)'
							}}
						>
							Clear
						</button>
					)}
				</div>
			</div>

			{/* Per-image Spectrum Override */}
			<div className="flex items-center justify-between mt-1 mb-2">
				<span className="text-xs" style={{ color: 'var(--editor-accent-soft)' }}>
					Spectrum Override
					{spectrumOverrideActive && (
						<span className="ml-1.5 text-[10px] rounded px-1 py-0.5"
							style={{ background: 'var(--editor-active-bg)', color: 'var(--editor-active-fg)' }}>
							active
						</span>
					)}
				</span>
				<div className="flex gap-1">
					<button
						onClick={onCaptureSpectrumOverride}
						className="rounded border px-2 py-0.5 text-[10px] transition-colors"
						style={{
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
					>
						Capture
					</button>
					{spectrumOverrideActive && (
						<button
							onClick={onClearSpectrumOverride}
							className="rounded border px-2 py-0.5 text-[10px] transition-colors"
							style={{
								background: 'var(--editor-tag-bg)',
								borderColor: 'var(--editor-tag-border)',
								color: 'var(--editor-tag-fg)'
							}}
						>
							Clear
						</button>
					)}
				</div>
			</div>

			{activeImage ? (
				<>
					<SectionDivider label={t.section_transition_next} />
					<span
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_transition_next}
					</span>

					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							Transition Style
						</span>
						<EnumButtons<SlideshowTransitionType>
							options={TRANSITION_TYPES}
							value={transitionType}
							onChange={onChangeTransitionType}
							labels={TRANSITION_LABELS}
						/>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<SliderControl
							label={t.label_transition_duration}
							value={transitionDuration}
							{...SLIDESHOW_RANGES.transitionDuration}
							unit="s"
							onChange={onChangeTransitionDuration}
						/>
						<SliderControl
							label={t.label_transition_intensity}
							value={transitionIntensity}
							{...SLIDESHOW_RANGES.transitionIntensity}
							onChange={onChangeTransitionIntensity}
						/>
					</div>

					<SliderControl
						label={t.label_transition_audio_drive}
						value={transitionAudioDrive}
						{...SLIDESHOW_RANGES.transitionAudioDrive}
						onChange={onChangeTransitionAudioDrive}
					/>
					<AudioChannelSelector
						value={transitionAudioChannel}
						onChange={onChangeTransitionAudioChannel}
						label={t.label_transition_audio_channel}
					/>

					<div className="grid grid-cols-2 gap-2">
						<button
							onClick={onAutoFitActiveImage}
							className="rounded border px-3 py-1.5 text-xs transition-colors"
							style={{
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
							title={t.hint_auto_fit_image}
						>
							{t.label_auto_fit_image}
						</button>
						<button
							onClick={onApplyLayoutToDefaults}
							disabled={defaultLayoutCount === 0}
							className="rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
							title={`${t.label_apply_to_default_images} (${defaultLayoutCount})`}
						>
							Apply ({defaultLayoutCount})
						</button>
					</div>
				</>
			) : null}
		</BackgroundCardShell>
	);
}

function BackgroundCardShell({
	t,
	activeImage,
	activeImageIndex,
	imageCount,
	onUploadClick,
	onPreviousImage,
	onNextImage,
	children
}: {
	t: Record<string, string>;
	activeImage: BackgroundImageItem | null;
	activeImageIndex: number;
	imageCount: number;
	onUploadClick: () => void;
	onPreviousImage: () => void;
	onNextImage: () => void;
	children: ReactNode;
}) {
	return (
		<BgSectionCard
			title={t.label_active_wallpaper}
			hint={
				activeImage ? t.hint_per_image_settings : t.hint_slideshow_pool
			}
		>
			<div className="flex flex-col gap-3">
				{activeImage?.url ? (
					<div
						className="w-full overflow-hidden rounded border"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)'
						}}
					>
						<img
							src={activeImage.url}
							alt=""
							className="h-56 w-full object-cover"
						/>
					</div>
				) : (
					<button
						onClick={onUploadClick}
						className="w-full rounded border px-3 py-4 text-xs transition-colors"
						style={{
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
					>
						{t.upload_images}
					</button>
				)}

				<div className="flex min-w-0 flex-1 flex-col gap-2">
					{activeImageIndex >= 0 ? (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.label_image_order} {activeImageIndex + 1} /{' '}
							{imageCount}
						</span>
					) : (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_slideshow_pool}
						</span>
					)}

					<div className="grid grid-cols-3 gap-2">
						<button
							onClick={onPreviousImage}
							disabled={imageCount < 2}
							className="rounded border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
						>
							{t.label_previous_image}
						</button>
						<button
							onClick={onUploadClick}
							className="rounded border px-2 py-1 text-xs transition-colors"
							style={{
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
						>
							{t.upload_images}
						</button>
						<button
							onClick={onNextImage}
							disabled={imageCount < 2}
							className="rounded border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
						>
							{t.label_next_image}
						</button>
					</div>
				</div>
			</div>

			{children}
		</BgSectionCard>
	);
}
