import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	AudioLines,
	Grid3x3,
	Image as ImageIcon,
	SlidersHorizontal
} from 'lucide-react';
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
import { SegmentedControl, ICON_SIZE, UI_COLORS } from '@/ui';
import ActiveWallpaperSection from '../bg/ActiveWallpaperSection';
import GlobalBackgroundSection from '../bg/GlobalBackgroundSection';
import SlideshowPoolSection from '../bg/SlideshowPoolSection';
import BgZoomAudioSection from '../bg/BgZoomAudioSection';
import { useBackgroundPositionRanges } from '../bg/useBackgroundPositionRanges';
import { useIsSimple } from '../../UIMode';
import {
	filterImageIdsBySetlist,
	getActiveSetlist
} from '@/store/slices/setlistsSlice';

export type BgView = 'pool' | 'active' | 'audio' | 'global';

const MODERN_BG_VIEW_STORAGE_KEY = 'lwag-modern-bg-view';

function isBgView(value: unknown): value is BgView {
	return (
		value === 'pool' ||
		value === 'active' ||
		value === 'audio' ||
		value === 'global'
	);
}

export function readPersistedBgView(canShowAudio: boolean): BgView {
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

export function writePersistedBgView(value: BgView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_BG_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable — view restore is optional */
	}
}

function moveIdToIndex(
	ids: string[],
	id: string,
	targetIndex: number
): string[] {
	const sourceIndex = ids.indexOf(id);
	if (sourceIndex < 0) return ids;
	const next = ids.filter(candidate => candidate !== id);
	const clamped = Math.max(0, Math.min(next.length, targetIndex));
	next.splice(clamped, 0, id);
	return next;
}

function shuffleIds(ids: string[]): string[] {
	const next = [...ids];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[next[index], next[randomIndex]] = [next[randomIndex], next[index]];
	}
	return next;
}

function getBackgroundViewOptions(canShowAudio: boolean) {
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
	return viewOptions;
}

export function BackgroundViewTabs({
	view,
	onChange,
	canShowAudio
}: {
	view: BgView;
	onChange: (view: BgView) => void;
	canShowAudio: boolean;
}) {
	return (
		<SegmentedControl<BgView>
			value={view}
			onChange={onChange}
			options={getBackgroundViewOptions(canShowAudio)}
			size="sm"
			density="compact"
			full
			ariaLabel="Background sections"
		/>
	);
}

export default function ModernBackgroundPanel({
	view: controlledView,
	onViewChange,
	hideViewTabs = false
}: {
	view?: BgView;
	onViewChange?: (view: BgView) => void;
	hideViewTabs?: boolean;
} = {}) {
	const t = useT();
	const isSimple = useIsSimple();
	// Audio sub-view is only meaningful when the user has access to
	// advanced controls — Simple mode would expose attack/release/etc.
	const canShowAudio = !isSimple;
	const [internalView, setInternalView] = useState<BgView>(() =>
		readPersistedBgView(canShowAudio)
	);
	const view = controlledView ?? internalView;

	function handleViewChange(next: BgView) {
		const safe = next === 'audio' && !canShowAudio ? 'pool' : next;
		if (controlledView === undefined) setInternalView(safe);
		onViewChange?.(safe);
		writePersistedBgView(safe);
	}

	// If the user toggles Simple while sitting on the Audio sub-view, bounce
	// back to Pool. Avoid trapping them on a hidden tab.
	useEffect(() => {
		if (view === 'audio' && !canShowAudio) {
			handleViewChange('pool');
		}
	}, [view, canShowAudio]);

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
			imageFocusX: s.imageFocusX,
			imageFocusY: s.imageFocusY,
			imageOpacity: s.imageOpacity,
			imageMirror: s.imageMirror,
			imageMirrorFill: s.imageMirrorFill,
			imageMirrorFillInvert: s.imageMirrorFillInvert,
			imageMirrorFillCount: s.imageMirrorFillCount,
			imageCoverageLockEnabled: s.imageCoverageLockEnabled,
			imageRotation: s.imageRotation,
			slideshowTransitionType: s.slideshowTransitionType,
			slideshowTransitionDuration: s.slideshowTransitionDuration,
			slideshowTransitionIntensity: s.slideshowTransitionIntensity,
			slideshowTransitionAudioDrive: s.slideshowTransitionAudioDrive,
			slideshowTransitionAudioChannel: s.slideshowTransitionAudioChannel,
			slideshowManualTimestampsEnabled:
				s.slideshowManualTimestampsEnabled,
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
			setSetlistImages: s.setSetlistImages,
			setBackgroundImageEntryEnabled: s.setBackgroundImageEntryEnabled,
			moveImageEntryToIndex: s.moveImageEntryToIndex,
			removeImageEntry: s.removeImageEntry,
			setImageUrls: s.setImageUrls,
			setImageFitMode: s.setImageFitMode,
			setImageScale: s.setImageScale,
			setImagePositionX: s.setImagePositionX,
			setImagePositionY: s.setImagePositionY,
			setImageFocusPoint: s.setImageFocusPoint,
			setImageRotation: s.setImageRotation,
			setImageOpacity: s.setImageOpacity,
			setImageMirror: s.setImageMirror,
			setImageMirrorFill: s.setImageMirrorFill,
			setImageMirrorFillInvert: s.setImageMirrorFillInvert,
			setImageMirrorFillCount: s.setImageMirrorFillCount,
			setImageCoverageLockEnabled: s.setImageCoverageLockEnabled,
			setSlideshowTransitionType: s.setSlideshowTransitionType,
			setSlideshowTransitionDuration: s.setSlideshowTransitionDuration,
			setSlideshowTransitionIntensity: s.setSlideshowTransitionIntensity,
			setSlideshowTransitionAudioDrive:
				s.setSlideshowTransitionAudioDrive,
			setSlideshowTransitionAudioChannel:
				s.setSlideshowTransitionAudioChannel,
			captureImageLogoOverride: s.captureImageLogoOverride,
			setImageLogoOverride: s.setImageLogoOverride,
			captureImageSpectrumOverride: s.captureImageSpectrumOverride,
			setImageSpectrumOverride: s.setImageSpectrumOverride,
			setBackgroundImagePlaybackSwitchAt:
				s.setBackgroundImagePlaybackSwitchAt,
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
	const currentActiveSetlistId = store.activeSetlistId;
	const currentActiveImageId = store.activeImageId;
	const setCurrentActiveImageId = store.setActiveImageId;
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
	const visibleImageIds = visibleBackgroundImages.map(image => image.assetId);
	const activeSetlist = getActiveSetlist(
		store.setlists,
		store.activeSetlistId
	);
	const activeImage =
		visibleBackgroundImages.find(
			image => image.assetId === store.activeImageId
		) ??
		visibleBackgroundImages[0] ??
		null;
	const activeImageIndex = activeImage
		? visibleBackgroundImages.findIndex(
				image => image.assetId === activeImage.assetId
			)
		: -1;

	const activeImagePositionRanges = useBackgroundPositionRanges({
		url: activeImage?.url ?? null,
		fitMode: store.imageFitMode,
		scale: store.imageScale,
		positionX: store.imagePositionX,
		positionY: store.imagePositionY,
		layoutResponsiveEnabled: store.layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled: store.layoutBackgroundReframeEnabled,
		layoutReferenceWidth: store.layoutReferenceWidth,
		layoutReferenceHeight: store.layoutReferenceHeight,
		mirror: store.imageMirror,
		rotation: store.imageRotation,
		keepCovered: store.imageCoverageLockEnabled,
		focusX: store.imageFocusX,
		focusY: store.imageFocusY,
		mirrorFill: store.imageMirrorFill,
		mirrorFillInvert: store.imageMirrorFillInvert,
		mirrorFillCount: store.imageMirrorFillCount
	});
	const globalBackgroundPositionRanges = useBackgroundPositionRanges({
		url: store.globalBackgroundUrl,
		fitMode: store.globalBackgroundFitMode,
		scale: store.globalBackgroundScale,
		positionX: store.globalBackgroundPositionX,
		positionY: store.globalBackgroundPositionY,
		layoutResponsiveEnabled: store.layoutResponsiveEnabled,
		layoutBackgroundReframeEnabled: store.layoutBackgroundReframeEnabled,
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

	useEffect(() => {
		if (!currentActiveSetlistId) return;
		const nextActive = visibleBackgroundImages[0]?.assetId ?? null;
		if (
			visibleBackgroundImages.some(
				image => image.assetId === currentActiveImageId
			)
		) {
			return;
		}
		if (currentActiveImageId !== nextActive) {
			setCurrentActiveImageId(nextActive);
		}
	}, [
		currentActiveSetlistId,
		currentActiveImageId,
		setCurrentActiveImageId,
		visibleBackgroundImages
	]);

	const calculatedSwitchAt =
		store.slideshowManualTimestampsEnabled &&
		activeImageIndex >= 0 &&
		trackDuration > 0
			? (trackDuration / Math.max(visibleBackgroundImages.length, 1)) *
				activeImageIndex
			: null;

	function queuePoolThumbnail(assetId: string, url: string) {
		void generatePoolThumbnail(url).then(thumbnailUrl => {
			if (!thumbnailUrl || thumbnailUrl === url) return;
			store.setImageThumbnailUrl(assetId, thumbnailUrl);
		});
	}

	function setActiveSetlistImageOrder(nextVisibleIds: string[]) {
		if (!activeSetlist) return;
		const visible = new Set(visibleImageIds);
		const hiddenOrDanglingIds = activeSetlist.imageAssetIds.filter(
			assetId => !visible.has(assetId)
		);
		store.setSetlistImages(activeSetlist.id, [
			...nextVisibleIds,
			...hiddenOrDanglingIds
		]);
	}

	function moveVisibleImageToIndex(assetId: string, targetIndex: number) {
		if (activeSetlist) {
			setActiveSetlistImageOrder(
				moveIdToIndex(visibleImageIds, assetId, targetIndex)
			);
			return;
		}
		store.moveImageEntryToIndex(assetId, targetIndex);
	}

	function shuffleVisibleImages() {
		if (activeSetlist) {
			setActiveSetlistImageOrder(shuffleIds(visibleImageIds));
			return;
		}
		store.shuffleImageEntries();
	}

	function moveActiveVisibleImage(direction: -1 | 1) {
		if (!activeImage) return;
		if (activeSetlist) {
			const targetIndex = activeImageIndex + direction;
			if (targetIndex < 0 || targetIndex >= visibleImageIds.length)
				return;
			setActiveSetlistImageOrder(
				moveIdToIndex(visibleImageIds, activeImage.assetId, targetIndex)
			);
			return;
		}
		store.moveImageEntry(activeImage.assetId, direction);
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
		const addedIds: string[] = [];
		for (const file of files) {
			const id = await saveImage(file);
			const url = await loadImage(id);
			if (!url) continue;

			store.addImageEntry(id, url, null);
			queuePoolThumbnail(id, url);
			addedIds.push(id);

			if (!firstAddedId) firstAddedId = id;
		}

		if (activeSetlist && addedIds.length > 0) {
			store.setSetlistImages(activeSetlist.id, [
				...activeSetlist.imageAssetIds,
				...addedIds.filter(
					id => !activeSetlist.imageAssetIds.includes(id)
				)
			]);
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
		if (activeSetlist && !activeSetlist.imageAssetIds.includes(virtualId)) {
			store.setSetlistImages(activeSetlist.id, [
				...activeSetlist.imageAssetIds,
				virtualId
			]);
		}

		if (!store.activeImageId) {
			store.setActiveImageId(virtualId);
		}
	}

	async function removeImage(assetId: string) {
		if (activeSetlist) {
			store.setSetlistImages(
				activeSetlist.id,
				activeSetlist.imageAssetIds.filter(id => id !== assetId)
			);
			return;
		}
		await deleteImage(assetId);
		store.removeImageEntry(assetId);
	}

	async function clearAllImages() {
		if (activeSetlist) {
			store.setSetlistImages(activeSetlist.id, []);
			return;
		}
		for (const id of store.imageIds) await deleteImage(id);
		store.setImageUrls([]);
	}

	async function removeGlobalBackground() {
		const previousId = store.globalBackgroundId;
		if (previousId) await deleteImage(previousId).catch(() => undefined);
		store.setGlobalBackgroundId(null);
		store.setGlobalBackgroundUrl(null);
	}

	// Coverage-aware setters: when "Keep screen covered" is on, scale/position
	// are clamped before they reach the store so the persisted value is always
	// legal (turning coverage off later never leaves a broken far-away state).
	const coverageActive = store.imageCoverageLockEnabled;

	function clampToRange(value: number, range: { min: number; max: number }) {
		return Math.min(range.max, Math.max(range.min, value));
	}

	function handleChangeScale(value: number) {
		store.setImageScale(
			coverageActive && activeImagePositionRanges.ready
				? Math.max(value, activeImagePositionRanges.minScale)
				: value
		);
	}

	function handleChangePositionX(value: number) {
		store.setImagePositionX(
			coverageActive && activeImagePositionRanges.ready
				? clampToRange(value, {
						min: activeImagePositionRanges.coverageBounds.minX,
						max: activeImagePositionRanges.coverageBounds.maxX
					})
				: value
		);
	}

	function handleChangePositionY(value: number) {
		store.setImagePositionY(
			coverageActive && activeImagePositionRanges.ready
				? clampToRange(value, {
						min: activeImagePositionRanges.coverageBounds.minY,
						max: activeImagePositionRanges.coverageBounds.maxY
					})
				: value
		);
	}

	function normalizeCoveredTransform() {
		if (!coverageActive || !activeImagePositionRanges.ready) return;
		const { minScale, coverageBounds } = activeImagePositionRanges;
		const nextScale = Math.max(store.imageScale, minScale);
		const nextPositionX = clampToRange(store.imagePositionX, {
			min: coverageBounds.minX,
			max: coverageBounds.maxX
		});
		const nextPositionY = clampToRange(store.imagePositionY, {
			min: coverageBounds.minY,
			max: coverageBounds.maxY
		});

		if (nextScale !== store.imageScale) store.setImageScale(nextScale);
		if (nextPositionX !== store.imagePositionX) {
			store.setImagePositionX(nextPositionX);
		}
		if (nextPositionY !== store.imagePositionY) {
			store.setImagePositionY(nextPositionY);
		}
	}

	function handleChangeRotation(value: number) {
		store.setImageRotation(value);
	}

	function handleToggleCoverageLock(enabled: boolean) {
		store.setImageCoverageLockEnabled(enabled);
		if (!enabled || !activeImagePositionRanges.ready) return;
		// Correct the currently-stored transform so enabling coverage snaps the
		// image to a legal covered state instead of waiting for the next edit.
		const { minScale, coverageBounds } = activeImagePositionRanges;
		if (store.imageScale < minScale) store.setImageScale(minScale);
		store.setImagePositionX(
			clampToRange(store.imagePositionX, {
				min: coverageBounds.minX,
				max: coverageBounds.maxX
			})
		);
		store.setImagePositionY(
			clampToRange(store.imagePositionY, {
				min: coverageBounds.minY,
				max: coverageBounds.maxY
			})
		);
	}

	useEffect(() => {
		normalizeCoveredTransform();
	}, [
		activeImagePositionRanges.coverageBounds.maxX,
		activeImagePositionRanges.coverageBounds.maxY,
		activeImagePositionRanges.coverageBounds.minX,
		activeImagePositionRanges.coverageBounds.minY,
		activeImagePositionRanges.minScale,
		activeImagePositionRanges.ready,
		coverageActive,
		store.imagePositionX,
		store.imagePositionY,
		store.imageScale
	]);

	async function autoFitActiveImage() {
		if (!activeImage?.url) return;
		const { width, height } = await loadImageDimensions(activeImage.url);
		const suggestion = suggestBackgroundAutoFit(
			window.innerWidth,
			window.innerHeight,
			width,
			height,
			store.imageRotation
		);

		store.setImageFitMode(suggestion.fitMode);
		store.setImageScale(suggestion.scale);
		store.setImagePositionX(suggestion.positionX);
		store.setImagePositionY(suggestion.positionY);
		store.setImageFocusPoint(null, null);
	}

	function cycleActiveImage(direction: -1 | 1) {
		// Manual prev/next navigation must respect the active setlist filter
		// — otherwise the user paused the slideshow expecting to walk only
		// the curated images but the arrows jump to non-members. Use the
		// filtered list (same one the pool grid renders).
		if (visibleBackgroundImages.length < 2) return;
		const baseIndex = activeImageIndex >= 0 ? activeImageIndex : 0;
		const nextIndex =
			(baseIndex + direction + visibleBackgroundImages.length) %
			visibleBackgroundImages.length;
		const nextImage = visibleBackgroundImages[nextIndex];
		if (nextImage) store.setActiveImageId(nextImage.assetId);
	}

	return (
		<>
			{hideViewTabs ? null : (
				<div
					className="sticky top-0 z-20 -mx-1 px-1 pb-2 pt-1"
					style={{
						background: `linear-gradient(to bottom, ${UI_COLORS.shell} 0%, ${UI_COLORS.shell} 78%, transparent 100%)`
					}}
				>
					<BackgroundViewTabs
						view={view}
						onChange={handleViewChange}
						canShowAudio={canShowAudio}
					/>
				</div>
			)}
			{view === 'active' ? (
				<ActiveWallpaperSection
					t={t}
					activeImage={activeImage}
					activeImageIndex={activeImageIndex}
					imageCount={visibleBackgroundImages.length}
					imageFitMode={store.imageFitMode}
					imageScale={store.imageScale}
					imagePositionX={store.imagePositionX}
					imagePositionY={store.imagePositionY}
					imageFocusX={store.imageFocusX}
					imageFocusY={store.imageFocusY}
					imageRotation={store.imageRotation}
					imagePositionXRange={activeImagePositionRanges.positionX}
					imagePositionYRange={activeImagePositionRanges.positionY}
					imageOpacity={store.imageOpacity}
					imageMirror={store.imageMirror}
					imageMirrorFill={store.imageMirrorFill}
					imageMirrorFillInvert={store.imageMirrorFillInvert}
					imageMirrorFillCount={store.imageMirrorFillCount}
					imageCoverageLockEnabled={store.imageCoverageLockEnabled}
					layoutResponsiveEnabled={store.layoutResponsiveEnabled}
					layoutBackgroundReframeEnabled={
						store.layoutBackgroundReframeEnabled
					}
					layoutReferenceWidth={store.layoutReferenceWidth}
					layoutReferenceHeight={store.layoutReferenceHeight}
					imagePreviewUrl={resolveEditorImagePreviewUrl(
						activeImage,
						store.editorImagePreviewQuality,
						true
					)}
					transitionType={store.slideshowTransitionType}
					transitionDuration={store.slideshowTransitionDuration}
					transitionIntensity={store.slideshowTransitionIntensity}
					transitionAudioDrive={store.slideshowTransitionAudioDrive}
					transitionAudioChannel={
						store.slideshowTransitionAudioChannel
					}
					onUploadClick={() => multiRef.current?.click()}
					onPreviousImage={() => cycleActiveImage(-1)}
					onNextImage={() => cycleActiveImage(1)}
					onChangeFitMode={store.setImageFitMode}
					onChangeScale={handleChangeScale}
					onChangePositionX={handleChangePositionX}
					onChangePositionY={handleChangePositionY}
					onChangeFocusPoint={store.setImageFocusPoint}
					onChangeRotation={handleChangeRotation}
					onChangeOpacity={store.setImageOpacity}
					onChangeMirror={store.setImageMirror}
					onChangeMirrorFill={store.setImageMirrorFill}
					onChangeMirrorFillInvert={store.setImageMirrorFillInvert}
					onChangeMirrorFillCount={store.setImageMirrorFillCount}
					imageMinScale={activeImagePositionRanges.minScale}
					onChangeImageCoverageLockEnabled={handleToggleCoverageLock}
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
					onCaptureSpectrumOverride={
						store.captureImageSpectrumOverride
					}
					onClearSpectrumOverride={() =>
						store.setImageSpectrumOverride(null)
					}
					onChangePlaybackSwitchAt={value => {
						if (!activeImage) return;
						store.setBackgroundImagePlaybackSwitchAt(
							activeImage.assetId,
							value
						);
					}}
					calculatedSwitchAt={calculatedSwitchAt}
					onAutoFitAllImages={() => void store.autoFitAllImages()}
					onAutoFitActiveImage={() => void autoFitActiveImage()}
				/>
			) : null}

			{view === 'pool' ? (
				<SlideshowPoolSection
					t={t}
					imageIds={activeSetlist ? visibleImageIds : store.imageIds}
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
					onMoveEntryToIndex={moveVisibleImageToIndex}
					onRemoveImage={assetId => void removeImage(assetId)}
					onMoveLeft={() => moveActiveVisibleImage(-1)}
					onMoveRight={() => moveActiveVisibleImage(1)}
					onShuffle={shuffleVisibleImages}
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
					globalBackgroundBrightness={
						store.globalBackgroundBrightness
					}
					globalBackgroundContrast={store.globalBackgroundContrast}
					globalBackgroundSaturation={
						store.globalBackgroundSaturation
					}
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
