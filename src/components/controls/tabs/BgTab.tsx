import { useEffect, useRef, useState } from 'react';
import { isBackgroundImageUsingDefaultLayout } from '@/lib/backgroundImages';
import {
	loadImageDimensions,
	suggestBackgroundAutoFit
} from '@/lib/backgroundAutoFit';
import { generateThumbnail } from '@/lib/thumbnailUtils';
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb';
import { getVirtualFileBlob } from '@/lib/db/localFoldersDb';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import ResetButton from '../ui/ResetButton';
import SectionDivider from '../ui/SectionDivider';
import ActiveWallpaperSection from './bg/ActiveWallpaperSection';
import GlobalBackgroundSection from './bg/GlobalBackgroundSection';
import SlideshowPoolSection from './bg/SlideshowPoolSection';
import BgZoomAudioSection from './bg/BgZoomAudioSection';
import { useBackgroundPositionRanges } from './bg/useBackgroundPositionRanges';

export default function BgTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const multiRef = useRef<HTMLInputElement>(null);
	const globalRef = useRef<HTMLInputElement>(null);
	const [showPoolThumbnails, setShowPoolThumbnails] = useState(true);
	const activeImage =
		store.backgroundImages.find(
			image => image.assetId === store.activeImageId
		) ??
		store.backgroundImages[0] ??
		null;
	const activeImageIndex = activeImage
		? store.backgroundImages.findIndex(
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
		positionY: store.imagePositionY
	});
	const globalBackgroundPositionRanges = useBackgroundPositionRanges({
		url: store.globalBackgroundUrl,
		fitMode: store.globalBackgroundFitMode,
		scale: store.globalBackgroundScale,
		positionX: store.globalBackgroundPositionX,
		positionY: store.globalBackgroundPositionY
	});



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
			
			// Generate a very small thumbnail for the pool grid (72×45 matches
			// the display size). Original URL is kept for canvas/active preview.
			const thumbUrl = await generateThumbnail(url, 72, 45);
			store.addImageEntry(id, url, thumbUrl);
			
			if (!firstAddedId) firstAddedId = id;
		}

		if (!store.activeImageId && firstAddedId) {
			store.setActiveImageId(firstAddedId);
		}

		event.target.value = '';
	}

	async function handleVirtualImageSelect(virtualId: string, _fileName: string) {
		const url = await loadImage(virtualId);
		if (!url) return;
		
		const thumbUrl = await generateThumbnail(url, 72, 45);
		store.addImageEntry(virtualId, url, thumbUrl);
		
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
			<ResetButton label={t.reset_tab} onClick={onReset} />

			<BgZoomAudioSection />

			<SectionDivider label={t.section_image} />
			<ActiveWallpaperSection
				t={t}
				activeImage={activeImage}
				activeImageIndex={activeImageIndex}
				imageCount={store.backgroundImages.length}
				imageFitMode={store.imageFitMode}
				imageScale={store.imageScale}
				imagePositionX={store.imagePositionX}
				imagePositionY={store.imagePositionY}
				imagePositionXRange={activeImagePositionRanges.positionX}
				imagePositionYRange={activeImagePositionRanges.positionY}
				imageOpacity={store.imageOpacity}
				imageMirror={store.imageMirror}
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
				onCaptureLogoOverride={store.captureImageLogoOverride}
				onClearLogoOverride={() => store.setImageLogoOverride(null)}
				onCaptureSpectrumOverride={store.captureImageSpectrumOverride}
				onClearSpectrumOverride={() => store.setImageSpectrumOverride(null)}
				onApplyLayoutToDefaults={
					store.applyActiveImageConfigToDefaultImages
				}
				onAutoFitActiveImage={() => void autoFitActiveImage()}
			/>

			<SectionDivider label={t.section_slideshow} />
			<SlideshowPoolSection
				t={t}
				imageIds={store.imageIds}
				backgroundImages={store.backgroundImages}
				activeImage={activeImage}
				activeImageIndex={activeImageIndex}
				showPoolThumbnails={showPoolThumbnails}
				onToggleShowThumbnails={setShowPoolThumbnails}
				onMultiUploadClick={() => multiRef.current?.click()}
				onVirtualImageSelect={handleVirtualImageSelect}
				onClearAllImages={() => void clearAllImages()}
				onSetActiveImage={store.setActiveImageId}
				onRemoveImage={index => void removeImage(index)}
				onMoveLeft={() =>
					activeImage && store.moveImageEntry(activeImage.assetId, -1)
				}
				onMoveRight={() =>
					activeImage && store.moveImageEntry(activeImage.assetId, 1)
				}
				onShuffle={store.shuffleImageEntries}
			/>
			<input
				ref={multiRef}
				type="file"
				accept="image/*"
				multiple
				onChange={handleMultiFiles}
				className="hidden"
			/>

			<SectionDivider label={t.section_global_background} />
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
