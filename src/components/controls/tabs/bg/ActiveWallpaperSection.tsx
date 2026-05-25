import {
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
	type ReactNode
} from 'react';
import { useAudioContext } from '@/context/useAudioContext';
import { AdvancedOnly } from '@/components/controls/UIMode';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { IMAGE_RANGES, SLIDESHOW_RANGES } from '@/config/ranges';
import { resolveImageTransform } from '@/features/background/resolveImageTransform';
import type {
	AudioReactiveChannel,
	BackgroundImageItem,
	SlideshowTransitionType
} from '@/types/wallpaper';
import type { SliderRange } from '@/types/controls';
import BgFitModeSelector from './BgFitModeSelector';
import BgSectionCard from './BgSectionCard';
import BgPreciseSliderControl from './BgPreciseSliderControl';
import { TRANSITION_LABELS, TRANSITION_TYPES } from './constants';
import BgAudioChannelSelector from './BgAudioChannelSelector';
import {
	Button,
	CollapsibleSection,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT
} from '@/ui';

type Props = {
	t: Record<string, string>;
	activeImage: BackgroundImageItem | null;
	activeImageIndex: number;
	imageCount: number;
	imageFitMode: Parameters<typeof BgFitModeSelector>[0]['value'];
	imageScale: number;
	imagePositionX: number;
	imagePositionY: number;
	imageFocusX: number | null;
	imageFocusY: number | null;
	imageRotation: number;
	imagePreviewUrl: string;
	imagePositionXRange: SliderRange;
	imagePositionYRange: SliderRange;
	imageOpacity: number;
	imageMirror: boolean;
	imageMirrorFill: boolean;
	imageMirrorFillInvert: boolean;
	imageCoverageLockEnabled: boolean;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	imageMinScale: number;
	transitionType: SlideshowTransitionType;
	transitionDuration: number;
	transitionIntensity: number;
	transitionAudioDrive: number;
	transitionAudioChannel: AudioReactiveChannel;
	slideshowManualTimestampsEnabled: boolean;
	onCaptureLogoOverride: () => void;
	onClearLogoOverride: () => void;
	onCaptureSpectrumOverride: () => void;
	onClearSpectrumOverride: () => void;
	onChangePlaybackSwitchAt: (v: number | null) => void;
	calculatedSwitchAt?: number | null;
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
	onChangeFocusPoint: (x: number | null, y: number | null) => void;
	onChangeRotation: (value: number) => void;
	onChangeOpacity: (value: number) => void;
	onChangeMirror: (value: boolean) => void;
	onChangeMirrorFill: (value: boolean) => void;
	onChangeMirrorFillInvert: (value: boolean) => void;
	onChangeImageCoverageLockEnabled: (value: boolean) => void;
	onChangeTransitionType: (value: SlideshowTransitionType) => void;
	onChangeTransitionDuration: (value: number) => void;
	onChangeTransitionIntensity: (value: number) => void;
	onChangeTransitionAudioDrive: (value: number) => void;
	onChangeTransitionAudioChannel: (value: AudioReactiveChannel) => void;
	onAutoFitAllImages: () => void;
};

function SnapToNowButton({ onSnap }: { onSnap: (v: number | null) => void }) {
	const { getCurrentTime } = useAudioContext();
	return (
		<Button
			onClick={() => onSnap(Math.max(0, Math.round(getCurrentTime())))}
			size="sm"
			density="compact"
			variant="ghost"
			title="Set timestamp to current playback position"
		>
			NOW
		</Button>
	);
}

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function ModernSwitchRow({
	label,
	checked,
	onChange
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<span
				className="min-w-0 text-[12px] font-medium"
				style={{ color: UI_COLORS.fg }}
			>
				{label}
			</span>
			<ToggleSwitch
				checked={checked}
				onChange={onChange}
				size="sm"
				ariaLabel={label}
			/>
		</div>
	);
}

function OverrideRow({
	label,
	active,
	onCapture,
	onClear
}: {
	label: string;
	active: boolean;
	onCapture: () => void;
	onClear: () => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<div className="min-w-0">
				<div
					className="truncate text-[12px] font-medium"
					style={{ color: UI_COLORS.fg }}
				>
					{label}
				</div>
				<div
					className="text-[10px] uppercase tracking-[0.12em]"
					style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
				>
					{active ? 'Active override' : 'Uses global settings'}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button
					onClick={onCapture}
					size="sm"
					density="compact"
					variant="secondary"
				>
					Capture
				</Button>
				{active ? (
					<Button
						onClick={onClear}
						size="sm"
						density="compact"
						variant="ghost"
					>
						Clear
					</Button>
				) : null}
			</div>
		</div>
	);
}

export default function ActiveWallpaperSection({
	t,
	activeImage,
	activeImageIndex,
	imageCount,
	imageFitMode,
	imageScale,
	imagePositionX,
	imagePositionY,
	imageFocusX,
	imageFocusY,
	imageRotation,
	imagePreviewUrl,
	imagePositionXRange,
	imagePositionYRange,
	imageOpacity,
	imageMirror,
	imageMirrorFill,
	imageMirrorFillInvert,
	imageCoverageLockEnabled,
	layoutResponsiveEnabled,
	layoutBackgroundReframeEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	imageMinScale,
	transitionType,
	transitionDuration,
	transitionIntensity,
	transitionAudioDrive,
	transitionAudioChannel,
	slideshowManualTimestampsEnabled,
	onCaptureLogoOverride,
	onClearLogoOverride,
	onCaptureSpectrumOverride,
	onClearSpectrumOverride,
	onChangePlaybackSwitchAt,
	calculatedSwitchAt,
	onAutoFitActiveImage,
	onUploadClick,
	onPreviousImage,
	onNextImage,
	onChangeFitMode,
	onChangeScale,
	onChangePositionX,
	onChangePositionY,
	onChangeFocusPoint,
	onChangeRotation,
	onChangeOpacity,
	onChangeMirror,
	onChangeMirrorFill,
	onChangeMirrorFillInvert,
	onChangeImageCoverageLockEnabled,
	onChangeTransitionType,
	onChangeTransitionDuration,
	onChangeTransitionIntensity,
	onChangeTransitionAudioDrive,
	onChangeTransitionAudioChannel,
	onAutoFitAllImages
}: Props) {
	const { confirm } = useDialog();
	const [pickingFocus, setPickingFocus] = useState(false);
	const logoOverrideActive = activeImage?.logoOverride != null;
	const spectrumOverrideActive = activeImage?.spectrumOverride != null;

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	function parseTime(value: string): number | null {
		const parts = value.split(':');
		if (parts.length === 2) {
			const m = parseInt(parts[0] ?? '0', 10);
			const s = parseInt(parts[1] ?? '0', 10);
			if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
		}
		const plain = parseFloat(value);
		return isNaN(plain) ? null : plain;
	}

	const isCalculatedTime = activeImage?.playbackSwitchAt == null;
	const displayTime = !isCalculatedTime
		? activeImage.playbackSwitchAt
		: calculatedSwitchAt != null
			? calculatedSwitchAt
			: null;

	async function handleAutoFitAllImages() {
		const ok = await confirm({
			title: t.label_auto_fit_all_images,
			message: t.confirm_auto_fit_all_images,
			confirmLabel: t.label_auto_fit_all_images,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!ok) return;
		onAutoFitAllImages();
	}

	return (
		<BackgroundCardShell
			t={t}
			activeImage={activeImage}
			activeImageIndex={activeImageIndex}
			imageCount={imageCount}
			onUploadClick={onUploadClick}
			onPreviousImage={onPreviousImage}
			onNextImage={onNextImage}
			imageFitMode={imageFitMode}
			imageScale={imageScale}
			imagePositionX={imagePositionX}
			imagePositionY={imagePositionY}
			imageFocusX={imageFocusX}
			imageFocusY={imageFocusY}
			imageRotation={imageRotation}
			imagePreviewUrl={imagePreviewUrl}
			imageMirror={imageMirror}
			imageMirrorFill={imageMirrorFill}
			imageMirrorFillInvert={imageMirrorFillInvert}
			coverageLockActive={imageCoverageLockEnabled}
			layoutResponsiveEnabled={layoutResponsiveEnabled}
			layoutBackgroundReframeEnabled={layoutBackgroundReframeEnabled}
			layoutReferenceWidth={layoutReferenceWidth}
			layoutReferenceHeight={layoutReferenceHeight}
			onChangePositionX={onChangePositionX}
			onChangePositionY={onChangePositionY}
			onChangeFocusPoint={onChangeFocusPoint}
			pickingFocus={pickingFocus}
			onPickFocusDone={() => setPickingFocus(false)}
		>
			<CollapsibleSection title="Transform" defaultOpen>
				<BgFitModeSelector
					label={t.label_fit_mode}
					value={imageFitMode}
					onChange={onChangeFitMode}
				/>

				<BgPreciseSliderControl
					label={t.label_scale}
					value={imageScale}
					range={IMAGE_RANGES.scale}
					onChange={onChangeScale}
					resetValue={1}
					mode="log"
				/>
				{imageCoverageLockEnabled &&
				imageScale <= imageMinScale + 0.001 ? (
					<span
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_bg_coverage_min_scale}
					</span>
				) : null}

				<BgPreciseSliderControl
					label={t.label_position_x}
					value={imagePositionX}
					range={imagePositionXRange}
					onChange={onChangePositionX}
					resetValue={0}
				/>
				<BgPreciseSliderControl
					label={t.label_position_y}
					value={imagePositionY}
					range={imagePositionYRange}
					onChange={onChangePositionY}
					resetValue={0}
				/>
				<BgPreciseSliderControl
					label={`${t.label_rotation} (°)`}
					value={imageRotation}
					range={IMAGE_RANGES.rotation}
					unit="°"
					onChange={onChangeRotation}
					resetValue={0}
				/>
				<BgPreciseSliderControl
					label={t.label_opacity}
					value={imageOpacity}
					range={IMAGE_RANGES.opacity}
					onChange={onChangeOpacity}
					resetValue={1}
				/>

				<div className="grid grid-cols-2 gap-2">
					<ModernSwitchRow
						label={t.label_mirror_image}
						checked={imageMirror}
						onChange={onChangeMirror}
					/>
					<ModernSwitchRow
						label={t.label_bg_coverage_lock}
						checked={imageCoverageLockEnabled}
						onChange={onChangeImageCoverageLockEnabled}
					/>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<ModernSwitchRow
						label={t.label_mirror_fill}
						checked={imageMirrorFill}
						onChange={onChangeMirrorFill}
					/>
					<ModernSwitchRow
						label={t.label_mirror_fill_invert}
						checked={imageMirrorFillInvert}
						onChange={onChangeMirrorFillInvert}
					/>
				</div>
				<span
					className="text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{t.hint_mirror_fill}
				</span>
				{imageCoverageLockEnabled ? (
					<span
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_bg_coverage_constrained}
					</span>
				) : null}

				<div className="grid grid-cols-2 gap-2">
					<Button
						onClick={onAutoFitActiveImage}
						size="sm"
						density="compact"
						variant="secondary"
						title={t.hint_auto_fit_image}
						full
					>
						{t.label_auto_fit_image}
					</Button>
					<Button
						onClick={() => void handleAutoFitAllImages()}
						disabled={imageCount === 0}
						size="sm"
						density="compact"
						variant="secondary"
						title={t.hint_auto_fit_all_images}
						full
					>
						{t.label_auto_fit_all_images}
					</Button>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button
						onClick={() => setPickingFocus(value => !value)}
						size="sm"
						density="compact"
						variant={pickingFocus ? 'primary' : 'secondary'}
						active={pickingFocus}
						title={t.hint_image_focus_point}
						full
					>
						{t.label_pick_focus}
					</Button>
					<Button
						onClick={() => {
							onChangeFocusPoint(0.5, 0.5);
							onChangePositionX(0);
							onChangePositionY(0);
						}}
						size="sm"
						density="compact"
						variant="secondary"
						title={t.hint_image_focus_point}
						full
					>
						{t.label_center_focus}
					</Button>
				</div>
			</CollapsibleSection>

			<AdvancedOnly>
				<CollapsibleSection title="Per-image overrides">
					<div className="flex flex-col gap-2">
						<OverrideRow
							label="Logo Override"
							active={logoOverrideActive}
							onCapture={onCaptureLogoOverride}
							onClear={onClearLogoOverride}
						/>
						<OverrideRow
							label="Spectrum Override"
							active={spectrumOverrideActive}
							onCapture={onCaptureSpectrumOverride}
							onClear={onClearSpectrumOverride}
						/>
					</div>

					{activeImage && slideshowManualTimestampsEnabled && (
						<div
							className="mt-2 flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
							style={{
								borderColor: UI_COLORS.border,
								background: UI_COLORS.raised
							}}
						>
							<span
								className="text-[12px] font-medium"
								style={{ color: UI_COLORS.fg }}
							>
								Switch at
							</span>
							<div className="flex flex-wrap items-center justify-end gap-1">
								<SnapToNowButton
									onSnap={onChangePlaybackSwitchAt}
								/>
								<Button
									onClick={() =>
										onChangePlaybackSwitchAt(
											Math.max(0, (displayTime ?? 0) - 1)
										)
									}
									size="sm"
									density="compact"
									variant="secondary"
									title="-1s"
								>
									-
								</Button>
								<Button
									onClick={() =>
										onChangePlaybackSwitchAt(
											(displayTime ?? 0) + 1
										)
									}
									size="sm"
									density="compact"
									variant="secondary"
									title="+1s"
								>
									+
								</Button>
								<input
									type="text"
									placeholder="mm:ss"
									value={
										displayTime != null
											? formatTime(displayTime)
											: ''
									}
									onChange={e => {
										const v = parseTime(e.target.value);
										onChangePlaybackSwitchAt(
											v != null && v >= 0 ? v : null
										);
									}}
									className="w-16 rounded border px-1.5 py-0.5 text-[11px] text-center outline-none transition-colors"
									style={{
										background: isCalculatedTime
											? 'var(--editor-tag-bg)'
											: 'var(--editor-surface-bg)',
										borderColor: isCalculatedTime
											? 'transparent'
											: 'var(--editor-accent-border)',
										color: isCalculatedTime
											? 'var(--editor-tag-fg)'
											: 'var(--editor-active-fg)',
										opacity: isCalculatedTime ? 0.7 : 1
									}}
									title={
										isCalculatedTime
											? 'Auto-calculated from Audio Checkpoints'
											: 'Manual override'
									}
								/>
								{!isCalculatedTime && (
									<Button
										onClick={() =>
											onChangePlaybackSwitchAt(null)
										}
										size="sm"
										density="compact"
										variant="ghost"
									>
										✕
									</Button>
								)}
							</div>
						</div>
					)}
				</CollapsibleSection>
			</AdvancedOnly>
			<AdvancedOnly>
				{activeImage ? (
					<CollapsibleSection title={t.section_transition_next}>
						<span
							className="text-[11px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							{t.hint_transition_next}
						</span>

						<div className="flex flex-col gap-1">
							<span
								className="uppercase"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono,
									fontSize: 10,
									fontWeight: 650,
									letterSpacing: '0.1em'
								}}
							>
								Transition Style
							</span>
							<div className="flex flex-wrap gap-1.5">
								{TRANSITION_TYPES.map(type => (
									<Button
										key={type}
										size="sm"
										density="compact"
										variant={
											transitionType === type
												? 'primary'
												: 'secondary'
										}
										active={transitionType === type}
										onClick={() =>
											onChangeTransitionType(type)
										}
									>
										{TRANSITION_LABELS[type]}
									</Button>
								))}
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<Slider
								label={t.label_transition_duration}
								value={transitionDuration}
								{...SLIDESHOW_RANGES.transitionDuration}
								unit="s"
								onChange={onChangeTransitionDuration}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<Slider
								label={t.label_transition_intensity}
								value={transitionIntensity}
								{...SLIDESHOW_RANGES.transitionIntensity}
								onChange={onChangeTransitionIntensity}
								variant="compact"
								formatValue={formatDecimal}
							/>
						</div>

						<Slider
							label={t.label_transition_audio_drive}
							value={transitionAudioDrive}
							{...SLIDESHOW_RANGES.transitionAudioDrive}
							onChange={onChangeTransitionAudioDrive}
							variant="compact"
							formatValue={formatDecimal}
						/>
						<BgAudioChannelSelector
							value={transitionAudioChannel}
							onChange={onChangeTransitionAudioChannel}
							label={t.label_transition_audio_channel}
						/>
					</CollapsibleSection>
				) : null}
			</AdvancedOnly>
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
	children,
	imageFitMode,
	imageScale,
	imagePositionX,
	imagePositionY,
	imageFocusX,
	imageFocusY,
	imageRotation,
	imagePreviewUrl,
	imageMirror,
	imageMirrorFill,
	imageMirrorFillInvert,
	coverageLockActive,
	layoutResponsiveEnabled,
	layoutBackgroundReframeEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	onChangePositionX,
	onChangePositionY,
	onChangeFocusPoint,
	pickingFocus,
	onPickFocusDone
}: {
	t: Record<string, string>;
	activeImage: BackgroundImageItem | null;
	activeImageIndex: number;
	imageCount: number;
	onUploadClick: () => void;
	onPreviousImage: () => void;
	onNextImage: () => void;
	children: ReactNode;
	imageFitMode: Parameters<typeof BgFitModeSelector>[0]['value'];
	imageScale: number;
	imagePositionX: number;
	imagePositionY: number;
	imageFocusX: number | null;
	imageFocusY: number | null;
	imageRotation: number;
	imagePreviewUrl: string;
	imageMirror: boolean;
	imageMirrorFill: boolean;
	imageMirrorFillInvert: boolean;
	coverageLockActive: boolean;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	onChangePositionX: (value: number) => void;
	onChangePositionY: (value: number) => void;
	onChangeFocusPoint: (x: number | null, y: number | null) => void;
	pickingFocus: boolean;
	onPickFocusDone: () => void;
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
					<InteractiveImagePreview
						imageUrl={imagePreviewUrl || activeImage.url}
						fitMode={imageFitMode}
						scale={imageScale}
						positionX={imagePositionX}
						positionY={imagePositionY}
						focusX={imageFocusX}
						focusY={imageFocusY}
						rotation={imageRotation}
						mirror={imageMirror}
						mirrorFill={imageMirrorFill}
						mirrorFillInvert={imageMirrorFillInvert}
						coverageLockActive={coverageLockActive}
						layoutResponsiveEnabled={layoutResponsiveEnabled}
						layoutBackgroundReframeEnabled={
							layoutBackgroundReframeEnabled
						}
						layoutReferenceWidth={layoutReferenceWidth}
						layoutReferenceHeight={layoutReferenceHeight}
						onChangePositionX={onChangePositionX}
						onChangePositionY={onChangePositionY}
						onChangeFocusPoint={onChangeFocusPoint}
						pickingFocus={pickingFocus}
						onPickFocusDone={onPickFocusDone}
					/>
				) : (
					<Button
						onClick={onUploadClick}
						size="md"
						variant="primary"
						full
						className="h-14"
					>
						{t.upload_images}
					</Button>
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
						<Button
							onClick={onPreviousImage}
							disabled={imageCount < 2}
							size="sm"
							density="compact"
							variant="secondary"
							full
						>
							{t.label_previous_image}
						</Button>
						<Button
							onClick={onUploadClick}
							size="sm"
							density="compact"
							variant="primary"
							full
						>
							{t.upload_images}
						</Button>
						<Button
							onClick={onNextImage}
							disabled={imageCount < 2}
							size="sm"
							density="compact"
							variant="secondary"
							full
						>
							{t.label_next_image}
						</Button>
					</div>
				</div>
			</div>

			{children}
		</BgSectionCard>
	);
}

function getScreenAspect(): number {
	if (typeof window === 'undefined') return 16 / 9;
	return Math.max(0.1, window.innerWidth / Math.max(1, window.innerHeight));
}

/**
 * Editor preview for the active background image. The frame matches the
 * SCREEN aspect ratio so "what you see is what the wallpaper renders" — this
 * is what makes coverage honest: the same normalized position/scale that
 * covers the preview covers the live wallpaper. All transform math goes
 * through `resolveImageTransform` so it agrees with the renderer and the
 * position sliders.
 */
function InteractiveImagePreview({
	imageUrl,
	fitMode,
	scale,
	positionX,
	positionY,
	focusX,
	focusY,
	rotation,
	mirror,
	mirrorFill,
	mirrorFillInvert,
	coverageLockActive,
	layoutResponsiveEnabled,
	layoutBackgroundReframeEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	onChangePositionX,
	onChangePositionY,
	onChangeFocusPoint,
	pickingFocus,
	onPickFocusDone
}: {
	imageUrl: string;
	fitMode: Parameters<typeof BgFitModeSelector>[0]['value'];
	scale: number;
	positionX: number;
	positionY: number;
	focusX: number | null;
	focusY: number | null;
	rotation: number;
	mirror: boolean;
	mirrorFill: boolean;
	mirrorFillInvert: boolean;
	coverageLockActive: boolean;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	onChangePositionX: (value: number) => void;
	onChangePositionY: (value: number) => void;
	onChangeFocusPoint: (x: number | null, y: number | null) => void;
	pickingFocus: boolean;
	onPickFocusDone: () => void;
}) {
	const frameRef = useRef<HTMLDivElement | null>(null);
	const dragRef = useRef({
		pointerId: -1,
		startClientX: 0,
		startClientY: 0,
		startPositionX: 0,
		startPositionY: 0
	});
	const [viewportSize, setViewportSize] = useState({ width: 1, height: 224 });
	const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
	const [screenAspect, setScreenAspect] = useState(getScreenAspect);

	useEffect(() => {
		const element = frameRef.current;
		if (!element || typeof ResizeObserver === 'undefined') return undefined;
		const observer = new ResizeObserver(entries => {
			const entry = entries[0];
			if (!entry) return;
			setViewportSize({
				width: Math.max(1, entry.contentRect.width),
				height: Math.max(1, entry.contentRect.height)
			});
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;
		const handle = () => setScreenAspect(getScreenAspect());
		window.addEventListener('resize', handle);
		return () => window.removeEventListener('resize', handle);
	}, []);

	const transform = resolveImageTransform({
		viewportWidth: viewportSize.width,
		viewportHeight: viewportSize.height,
		imageWidth: imageSize.width,
		imageHeight: imageSize.height,
		scale,
		rotation,
		positionX,
		positionY,
		fitMode,
		mirror,
		keepCovered: coverageLockActive,
		focusX,
		focusY,
		mirrorFill,
		mirrorFillInvert,
		layout: {
			layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight
		}
	});
	const primaryRect = transform.drawRects[0];
	const hasFocus = focusX != null && focusY != null;
	const focusMarkerX =
		viewportSize.width / 2 +
		transform.effectivePositionX * viewportSize.width * 0.5;
	const focusMarkerY =
		viewportSize.height / 2 -
		transform.effectivePositionY * viewportSize.height * 0.5;

	function clamp01(value: number): number {
		return Math.min(1, Math.max(0, value));
	}

	function pickFocus(event: ReactPointerEvent<HTMLDivElement>) {
		const frameBounds = event.currentTarget.getBoundingClientRect();
		const pointerX = event.clientX - frameBounds.left;
		const pointerY = event.clientY - frameBounds.top;
		const deltaX = pointerX - primaryRect.cx;
		const deltaY = pointerY - primaryRect.cy;
		const radians = (primaryRect.rotation * Math.PI) / 180;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		const localX = deltaX * cos + deltaY * sin;
		const localY = -deltaX * sin + deltaY * cos;
		const nextFocusX = primaryRect.mirror
			? 0.5 - localX / Math.max(1, primaryRect.width)
			: 0.5 + localX / Math.max(1, primaryRect.width);
		const nextFocusY = 0.5 + localY / Math.max(1, primaryRect.height);

		onChangeFocusPoint(clamp01(nextFocusX), clamp01(nextFocusY));
		onChangePositionX(0);
		onChangePositionY(0);
		onPickFocusDone();
	}

	function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		if (pickingFocus) {
			pickFocus(event);
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = {
			pointerId: event.pointerId,
			startClientX: event.clientX,
			startClientY: event.clientY,
			startPositionX: transform.effectivePositionX,
			startPositionY: transform.effectivePositionY
		};
	}

	function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
		if (dragRef.current.pointerId !== event.pointerId) return;
		const deltaX = event.clientX - dragRef.current.startClientX;
		const deltaY = event.clientY - dragRef.current.startClientY;
		// Raw new position; the store handler re-clamps to the legal coverage
		// window, so the image stops at the edge when coverage is on.
		onChangePositionX(
			dragRef.current.startPositionX + deltaX / (viewportSize.width * 0.5)
		);
		onChangePositionY(
			dragRef.current.startPositionY -
				deltaY / (viewportSize.height * 0.5)
		);
	}

	function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
		if (dragRef.current.pointerId !== event.pointerId) return;
		event.currentTarget.releasePointerCapture(event.pointerId);
		dragRef.current.pointerId = -1;
	}

	return (
		<div
			ref={frameRef}
			className="relative w-full overflow-hidden rounded border"
			style={{
				aspectRatio: String(screenAspect),
				maxHeight: '60vh',
				borderColor: 'var(--editor-accent-border)',
				background:
					'radial-gradient(circle at center, rgba(255,255,255,0.05), rgba(255,255,255,0.015) 45%, rgba(0,0,0,0.16) 100%)',
				cursor: pickingFocus ? 'crosshair' : 'grab'
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						'linear-gradient(to right, transparent calc(50% - 0.5px), rgba(255,255,255,0.14) 50%, transparent calc(50% + 0.5px)), linear-gradient(to bottom, transparent calc(50% - 0.5px), rgba(255,255,255,0.14) 50%, transparent calc(50% + 0.5px))'
				}}
			/>
			{transform.drawRects.map((rect, index) => (
				<img
					key={`${rect.kind}-${index}`}
					src={imageUrl}
					alt=""
					draggable={false}
					onLoad={
						index === 0
							? event =>
									setImageSize({
										width:
											event.currentTarget.naturalWidth ||
											1,
										height:
											event.currentTarget.naturalHeight ||
											1
									})
							: undefined
					}
					className="pointer-events-none absolute max-w-none select-none"
					style={{
						left: rect.cx - rect.width / 2,
						top: rect.cy - rect.height / 2,
						width: rect.width,
						height: rect.height,
						transform: `rotate(${rect.rotation}deg)${rect.mirror ? ' scaleX(-1)' : ''}${rect.mirrorY ? ' scaleY(-1)' : ''}`,
						transformOrigin: 'center center'
					}}
				/>
			))}
			{hasFocus || pickingFocus ? (
				<div
					className="pointer-events-none absolute h-5 w-5 rounded-full border"
					style={{
						left: focusMarkerX - 10,
						top: focusMarkerY - 10,
						borderColor: 'var(--editor-active-fg)',
						boxShadow:
							'0 0 0 1px rgba(0,0,0,0.55), 0 0 16px rgba(255,188,66,0.5)'
					}}
				/>
			) : null}
			<div
				className="pointer-events-none absolute bottom-2 left-2 rounded border px-2 py-1 text-[10px] leading-tight"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'rgba(0,0,0,0.42)',
					color: 'var(--editor-accent-soft)'
				}}
			>
				{pickingFocus
					? 'Click the image to set focus'
					: coverageLockActive
						? 'Drag to reposition — kept covered'
						: 'Drag preview to move image'}
			</div>
		</div>
	);
}
