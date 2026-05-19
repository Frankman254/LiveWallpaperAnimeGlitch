import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	AudioLines,
	Grid3x3,
	Image as ImageIcon,
	SlidersHorizontal
} from 'lucide-react';
import { isBackgroundImageUsingDefaultLayout } from '@/lib/backgroundImages';
import {
	loadImageDimensions,
	suggestBackgroundAutoFit
} from '@/lib/backgroundAutoFit';
import { resolveEditorImagePreviewUrl } from '@/lib/editorImagePreviews';
import { generatePoolThumbnail } from '@/lib/thumbnailUtils';
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import { SegmentedControl, ICON_SIZE } from '@/ui';
import ActiveWallpaperSection from '../bg/ActiveWallpaperSection';
import GlobalBackgroundSection from '../bg/GlobalBackgroundSection';
import SlideshowPoolSection from '../bg/SlideshowPoolSection';
import BgZoomAudioSection from '../bg/BgZoomAudioSection';
import { useBackgroundPositionRanges } from '../bg/useBackgroundPositionRanges';
import { useIsSimple } from '../../UIMode';
import { filterImageIdsBySetlist } from '@/store/slices/setlistsSlice';

type BgView = 'pool' | 'active' | 'audio' | 'global';

const MODERN_BG_VIEW_STORAGE_KEY = 'lwag-modern-bg-view';

function isBgView(value: unknown): value is BgView {
	return (
		value === 'pool' ||
		value === 'active' ||
		value === 'audio' ||
		value === 'global'
	);
}

function readPersistedBgView(canShowAudio: boolean): BgView {
	if (typeof window === 'undefined') return 'pool';
	try {
		const value = window.localStorage.getItem(MODERN_BG_VIEW_STORAGE_KEY);
		if (!isBgView(value)) return 'pool';
		// Audio sub-view is gated by Advanced mode. If the user persisted
		// 'audio' but switched to Simple, fall back to Pool — same coercion
		// pattern as `ModernLayersTab`.
		if (value === 'audio' && !canShowAudio) return 'pool';
		return value;
	} catch {
		return 'pool';
	}
}

function writePersistedBgView(value: BgView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_BG_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable — view restore is optional */
	}
}

export default function ModernBackgroundPanel() {
	const t = useT();
	const isSimple = useIsSimple();
	// Audio sub-view is only meaningful when the user has access to
	// advanced controls — Simple mode would expose attack/release/etc.
	const canShowAudio = !isSimple;
	const [view, setView] = useState<BgView>(() =>
		readPersistedBgView(canShowAudio)
	);

	// If the user toggles Simple while sitting on the Audio sub-view, bounce
	// back to Pool. Avoid trapping them on a hidden tab.
	useEffect(() => {
		if (view === 'audio' && !canShowAudio) {
			setView('pool');
			writePersistedBgView('pool');
		}
	}, [view, canShowAudio]);

	function handleViewChange(next: BgView) {
		const safe = next === 'audio' && !canShowAudio ? 'pool' : next;
		setView(safe);
		writePersistedBgView(safe);
	}

	const viewOptions = canShowAudio
		? ([
				{
					value: 'pool',
					label: 'Pool',
					icon: <Grid3x3 size={ICON_SIZE.xs} />
				},
				{
					value: 'active',
					label: 'Active',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				},
				{
					value: 'audio',
					label: 'Audio',
					icon: <AudioLines size={ICON_SIZE.xs} />
				},
				{
					value: 'global',
					label: 'Global',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				}
			] as const)
		: ([
				{
					value: 'pool',
					label: 'Pool',
					icon: <Grid3x3 size={ICON_SIZE.xs} />
				},
				{
					value: 'active',
					label: 'Active',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				},
				{
					value: 'global',
					label: 'Global',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				}
			] as const);
	const store = useWallpaperStore(
		useShallow(s => ({
			backgroundImages: s.backgroundImages,
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			activeImageId: s.activeImageId,
			imageIds: s.imageIds,
			imageFitMode: s.imageFitMode,
			imageScale: s.imageScale,
			imagePositionX: s.imagePositionX,
			imagePositionY: s.imagePositionY,
			imageOpacity: s.imageOpacity,
			imageMirror: s.imageMirror,
			imageBassReactive: s.imageBassReactive,
			imageBassScaleIntensity: s.imageBassScaleIntensity,
			imageRotation: s.imageRotation,
			slideshowTransitionType: s.slideshowTransitionType,
			slideshowTransitionDuration: s.slideshowTransitionDuration,
			slideshowTransitionIntensity: s.slideshowTransitionIntensity,
			slideshowTransitionAudioDrive: s.slideshowTransitionAudioDrive,
			slideshowTransitionAudioChannel: s.slideshowTransitionAudioChannel,
			slideshowManualTimestampsEnabled: s.slideshowManualTimestampsEnabled,
			globalBackgroundId: s.globalBackgroundId,
			globalBackgroundUrl: s.globalBackgroundUrl,
			globalBackgroundEnabled: s.globalBackgroundEnabled,
			globalBackgroundFitMode: s.globalBackgroundFitMode,
			globalBackgroundScale: s.globalBackgroundScale,
			globalBackgroundPositionX: s.globalBackgroundPositionX,
			globalBackgroundPositionY: s.globalBackgroundPositionY,
			globalBackgroundOpacity: s.globalBackgroundOpacity,
			globalBackgroundBrightness: s.globalBackgroundBrightness,
			globalBackgroundContrast: s.globalBackgroundContrast,
			globalBackgroundSaturation: s.globalBackgroundSaturation,
			globalBackgroundBlur: s.globalBackgroundBlur,
			globalBackgroundHueRotate: s.globalBackgroundHueRotate,
			layoutResponsiveEnabled: s.layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled: s.layoutBackgroundReframeEnabled,
			layoutReferenceWidth: s.layoutReferenceWidth,
			layoutReferenceHeight: s.layoutReferenceHeight,
			editorImagePreviewQuality: s.editorImagePreviewQuality,
			setImageThumbnailUrl: s.setImageThumbnailUrl,
			setGlobalBackgroundId: s.setGlobalBackgroundId,
			setGlobalBackgroundUrl: s.setGlobalBackgroundUrl,
			addImageEntry: s.addImageEntry,
			setActiveImageId: s.setActiveImageId,
			setBackgroundImageEntryEnabled: s.setBackgroundImageEntryEnabled,
			moveImageEntryToIndex: s.moveImageEntryToIndex,
			removeImageEntry: s.removeImageEntry,
			setImageUrls: s.setImageUrls,
			setImageFitMode: s.setImageFitMode,
			setImageScale: s.setImageScale,
			setImagePositionX: s.setImagePositionX,
			setImagePositionY: s.setImagePositionY,
			setImageRotation: s.setImageRotation,
			setImageOpacity: s.setImageOpacity,
			setImageMirror: s.setImageMirror,
			setSlideshowTransitionType: s.setSlideshowTransitionType,
			setSlideshowTransitionDuration: s.setSlideshowTransitionDuration,
			setSlideshowTransitionIntensity: s.setSlideshowTransitionIntensity,
			setSlideshowTransitionAudioDrive: s.setSlideshowTransitionAudioDrive,
			setSlideshowTransitionAudioChannel:
				s.setSlideshowTransitionAudioChannel,
			captureImageLogoOverride: s.captureImageLogoOverride,
			setImageLogoOverride: s.setImageLogoOverride,
			captureImageSpectrumOverride: s.captureImageSpectrumOverride,
			setImageSpectrumOverride: s.setImageSpectrumOverride,
			setImagePlaybackSwitchAt: s.setImagePlaybackSwitchAt,
			applyActiveImageConfigToDefaultImages:
				s.applyActiveImageConfigToDefaultImages,
			moveImageEntry: s.moveImageEntry,
			shuffleImageEntries: s.shuffleImageEntries,
			autoFitAllImages: s.autoFitAllImages,
			setGlobalBackgroundEnabled: s.setGlobalBackgroundEnabled,
			setGlobalBackgroundFitMode: s.setGlobalBackgroundFitMode,
			setGlobalBackgroundScale: s.setGlobalBackgroundScale,
			setGlobalBackgroundPositionX: s.setGlobalBackgroundPositionX,
			setGlobalBackgroundPositionY: s.setGlobalBackgroundPositionY,
			setGlobalBackgroundOpacity: s.setGlobalBackgroundOpacity,
			setGlobalBackgroundBrightness: s.setGlobalBackgroundBrightness,
			setGlobalBackgroundContrast: s.setGlobalBackgroundContrast,
			setGlobalBackgroundSaturation: s.setGlobalBackgroundSaturation,
			setGlobalBackgroundBlur: s.setGlobalBackgroundBlur,
			setGlobalBackgroundHueRotate: s.setGlobalBackgroundHueRotate
		}))
	);
	const { getDuration } = useAudioContext();
	const [trackDuration, setTrackDuration] = useState(0);
	const multiRef = useRef<HTMLInputElement>(null);
	const globalRef = useRef<HTMLInputElement>(null);
	const [showPoolThumbnails, setShowPoolThumbnails] = useState(true);
	// Derived: the subset the pool view should display. When a setlist is
	// active the user wants ONLY the curated images visible — non-members
	// are hidden entirely (per the strict-filter decision). The full
	// `store.backgroundImages` array is still used for internal lookups
	// (active image resolution, navigation by id) so internal references
	// don't get clipped.
	const visibleBackgroundImages = filterImageIdsBySetlist(
		store.backgroundImages,
		store.setlists,
		store.activeSetlistId
	);
	const activeImage =
		store.backgroundImages.find(
			image => image.assetId === store.activeImageId
		) ??
		store.backgroundImages[0] ??
		null;
	const activeImageIndex = activeImage
		? visibleBackgroundImages.findIndex(
				image => image.assetId === activeImage.assetId
			)
		: -1;
	const defaultLayoutCount = store.backgroundImages.filter(
		image =>
			image.assetId !== store.activeImageId &&
			isBackgroundImageUsingDefaultLayout(image)
	).length;

	const activeImagePositionRanges = useBackgroundPositionRanges({
		url: activeImage?.url ?? null,
		fitMode: store.imageFitMode,
		scale: store.imageScale,
		positionX: store.imagePositionX,
		positionY: store.imagePositionY,
		layoutResponsiveEnabled: store.layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled:
			store.layoutBackgroundReframeEnabled,
		layoutReferenceWidth: store.layoutReferenceWidth,
		layoutReferenceHeight: store.layoutReferenceHeight,
		mirror: store.imageMirror
	});
	const globalBackgroundPositionRanges = useBackgroundPositionRanges({
		url: store.globalBackgroundUrl,
		fitMode: store.globalBackgroundFitMode,
		scale: store.globalBackgroundScale,
		positionX: store.globalBackgroundPositionX,
		positionY: store.globalBackgroundPositionY,
		layoutResponsiveEnabled: store.layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled:
			store.layoutBackgroundReframeEnabled,
		layoutReferenceWidth: store.layoutReferenceWidth,
		layoutReferenceHeight: store.layoutReferenceHeight
	});

	useEffect(() => {
		const interval = setInterval(() => {
			const d = getDuration();
			if (d > 0 && d !== trackDuration) {
				setTrackDuration(d);
			}
		}, 500);
		return () => clearInterval(interval);
	}, [getDuration, trackDuration]);

	const calculatedSwitchAt =
		store.slideshowManualTimestampsEnabled &&
		activeImageIndex >= 0 &&
		trackDuration > 0
			? (trackDuration / Math.max(store.backgroundImages.length, 1)) *
				activeImageIndex
			: null;

	function queuePoolThumbnail(assetId: string, url: string) {
		void generatePoolThumbnail(url).then(thumbnailUrl => {
			if (!thumbnailUrl || thumbnailUrl === url) return;
			store.setImageThumbnailUrl(assetId, thumbnailUrl);
		});
	}

	async function handleGlobalBackgroundFile(
		event: React.ChangeEvent<HTMLInputElement>
	) {
		const file = event.target.files?.[0];
		if (!file) return;

		const previousId = store.globalBackgroundId;
		const id = await saveImage(file);
		const url = await loadImage(id);
		if (!url) return;

		store.setGlobalBackgroundId(id);
		store.setGlobalBackgroundUrl(url);

		if (previousId && previousId !== id) {
			await deleteImage(previousId).catch(() => undefined);
		}

		event.target.value = '';
	}

	async function handleMultiFiles(
		event: React.ChangeEvent<HTMLInputElement>
	) {
		const files = Array.from(event.target.files ?? []);
		if (files.length === 0) return;

		let firstAddedId: string | null = null;
		for (const file of files) {
			const id = await saveImage(file);
			const url = await loadImage(id);
			if (!url) continue;

			store.addImageEntry(id, url, null);
			queuePoolThumbnail(id, url);

			if (!firstAddedId) firstAddedId = id;
		}

		if (!store.activeImageId && firstAddedId) {
			store.setActiveImageId(firstAddedId);
		}

		event.target.value = '';
	}

	async function handleVirtualImageSelect(
		virtualId: string,
		_fileName: string
	) {
		const url = await loadImage(virtualId);
		if (!url) return;

		store.addImageEntry(virtualId, url, null);
		queuePoolThumbnail(virtualId, url);

		if (!store.activeImageId) {
			store.setActiveImageId(virtualId);
		}
	}

	async function removeImage(index: number) {
		const id = store.backgroundImages[index]?.assetId;
		if (!id) return;
		await deleteImage(id);
		store.removeImageEntry(id);
	}

	async function clearAllImages() {
		for (const id of store.imageIds) await deleteImage(id);
		store.setImageUrls([]);
	}

	async function removeGlobalBackground() {
		const previousId = store.globalBackgroundId;
		if (previousId) await deleteImage(previousId).catch(() => undefined);
		store.setGlobalBackgroundId(null);
		store.setGlobalBackgroundUrl(null);
	}

	async function autoFitActiveImage() {
		if (!activeImage?.url) return;
		const { width, height } = await loadImageDimensions(activeImage.url);
		const suggestion = suggestBackgroundAutoFit(
			window.innerWidth,
			window.innerHeight,
			width,
			height,
			store.imageBassReactive,
			store.imageBassScaleIntensity
		);

		store.setImageFitMode(suggestion.fitMode);
		store.setImageScale(suggestion.scale);
		store.setImagePositionX(suggestion.positionX);
		store.setImagePositionY(suggestion.positionY);
	}

	function cycleActiveImage(direction: -1 | 1) {
		if (store.backgroundImages.length < 2) return;
		const baseIndex = activeImageIndex >= 0 ? activeImageIndex : 0;
		const nextIndex =
			(baseIndex + direction + store.backgroundImages.length) %
			store.backgroundImages.length;
		const nextImage = store.backgroundImages[nextIndex];
		if (nextImage) store.setActiveImageId(nextImage.assetId);
	}

	return (
		<>
			<SegmentedControl<BgView>
				value={view}
				onChange={handleViewChange}
				options={viewOptions}
				size="sm"
				density="compact"
				full
				ariaLabel="Background sections"
			/>
			{view === 'active' ? (
			<ActiveWallpaperSection
				t={t}
				activeImage={activeImage}
				activeImageIndex={activeImageIndex}
				imageCount={store.backgroundImages.length}
				imageFitMode={store.imageFitMode}
				imageScale={store.imageScale}
				imagePositionX={store.imagePositionX}
				imagePositionY={store.imagePositionY}
				imageRotation={store.imageRotation}
				imagePositionXRange={activeImagePositionRanges.positionX}
				imagePositionYRange={activeImagePositionRanges.positionY}
				imageOpacity={store.imageOpacity}
				imageMirror={store.imageMirror}
				imagePreviewUrl={resolveEditorImagePreviewUrl(
					activeImage,
					store.editorImagePreviewQuality,
					true
				)}
				transitionType={store.slideshowTransitionType}
				transitionDuration={store.slideshowTransitionDuration}
				transitionIntensity={store.slideshowTransitionIntensity}
				transitionAudioDrive={store.slideshowTransitionAudioDrive}
				transitionAudioChannel={store.slideshowTransitionAudioChannel}
				defaultLayoutCount={defaultLayoutCount}
				onUploadClick={() => multiRef.current?.click()}
				onPreviousImage={() => cycleActiveImage(-1)}
				onNextImage={() => cycleActiveImage(1)}
				onChangeFitMode={store.setImageFitMode}
				onChangeScale={store.setImageScale}
				onChangePositionX={store.setImagePositionX}
				onChangePositionY={store.setImagePositionY}
				onChangeRotation={store.setImageRotation}
				onChangeOpacity={store.setImageOpacity}
				onChangeMirror={store.setImageMirror}
				onChangeTransitionType={store.setSlideshowTransitionType}
				onChangeTransitionDuration={
					store.setSlideshowTransitionDuration
				}
				onChangeTransitionIntensity={
					store.setSlideshowTransitionIntensity
				}
				onChangeTransitionAudioDrive={
					store.setSlideshowTransitionAudioDrive
				}
				onChangeTransitionAudioChannel={
					store.setSlideshowTransitionAudioChannel
				}
				slideshowManualTimestampsEnabled={
					store.slideshowManualTimestampsEnabled
				}
				onCaptureLogoOverride={store.captureImageLogoOverride}
				onClearLogoOverride={() => store.setImageLogoOverride(null)}
				onCaptureSpectrumOverride={store.captureImageSpectrumOverride}
				onClearSpectrumOverride={() =>
					store.setImageSpectrumOverride(null)
				}
				onChangePlaybackSwitchAt={store.setImagePlaybackSwitchAt}
				calculatedSwitchAt={calculatedSwitchAt}
				onApplyLayoutToDefaults={
					store.applyActiveImageConfigToDefaultImages
				}
				onAutoFitActiveImage={() => void autoFitActiveImage()}
			/>
			) : null}

			{view === 'pool' ? (
			<SlideshowPoolSection
				t={t}
				imageIds={store.imageIds}
				backgroundImages={visibleBackgroundImages}
				activeImage={activeImage}
				activeImageIndex={activeImageIndex}
				imagePreviewQuality={store.editorImagePreviewQuality}
				showPoolThumbnails={showPoolThumbnails}
				onToggleShowThumbnails={setShowPoolThumbnails}
				onMultiUploadClick={() => multiRef.current?.click()}
				onVirtualImageSelect={handleVirtualImageSelect}
				onClearAllImages={() => void clearAllImages()}
				onSetActiveImage={store.setActiveImageId}
				onSetEntryEnabled={store.setBackgroundImageEntryEnabled}
				onMoveEntryToIndex={store.moveImageEntryToIndex}
				onRemoveImage={index => void removeImage(index)}
				onMoveLeft={() =>
					activeImage && store.moveImageEntry(activeImage.assetId, -1)
				}
				onMoveRight={() =>
					activeImage && store.moveImageEntry(activeImage.assetId, 1)
				}
				onShuffle={store.shuffleImageEntries}
				onAutoFitAll={() => void store.autoFitAllImages()}
			/>
			) : null}
			<input
				ref={multiRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleMultiFiles}
				className="hidden"
			/>

			{view === 'audio' && canShowAudio ? <BgZoomAudioSection /> : null}

			{view === 'global' ? (
			<GlobalBackgroundSection
				t={t}
				globalBackgroundId={store.globalBackgroundId}
				globalBackgroundUrl={store.globalBackgroundUrl}
				globalBackgroundEnabled={store.globalBackgroundEnabled}
				globalBackgroundFitMode={store.globalBackgroundFitMode}
				globalBackgroundScale={store.globalBackgroundScale}
				globalBackgroundPositionX={store.globalBackgroundPositionX}
				globalBackgroundPositionY={store.globalBackgroundPositionY}
				globalBackgroundPositionXRange={
					globalBackgroundPositionRanges.positionX
				}
				globalBackgroundPositionYRange={
					globalBackgroundPositionRanges.positionY
				}
				globalBackgroundOpacity={store.globalBackgroundOpacity}
				globalBackgroundBrightness={store.globalBackgroundBrightness}
				globalBackgroundContrast={store.globalBackgroundContrast}
				globalBackgroundSaturation={store.globalBackgroundSaturation}
				globalBackgroundBlur={store.globalBackgroundBlur}
				globalBackgroundHueRotate={store.globalBackgroundHueRotate}
				onUploadClick={() => globalRef.current?.click()}
				onRemove={() => void removeGlobalBackground()}
				onToggleEnabled={store.setGlobalBackgroundEnabled}
				onChangeFitMode={store.setGlobalBackgroundFitMode}
				onChangeScale={store.setGlobalBackgroundScale}
				onChangePositionX={store.setGlobalBackgroundPositionX}
				onChangePositionY={store.setGlobalBackgroundPositionY}
				onChangeOpacity={store.setGlobalBackgroundOpacity}
				onChangeBrightness={store.setGlobalBackgroundBrightness}
				onChangeContrast={store.setGlobalBackgroundContrast}
				onChangeSaturation={store.setGlobalBackgroundSaturation}
				onChangeBlur={store.setGlobalBackgroundBlur}
				onChangeHueRotate={store.setGlobalBackgroundHueRotate}
			/>
			) : null}
			{/* Hidden file input lives outside the conditional so its
			    `ref={globalRef}` survives sub-view switches. Without this,
			    a user opening the Upload dialog from Global view then
			    accidentally switching tabs would unmount the input mid-flow. */}
			<input
				ref={globalRef}
				type="file"
				accept="image/*"
				onChange={handleGlobalBackgroundFile}
				className="hidden"
			/>

		</>
	);
}
