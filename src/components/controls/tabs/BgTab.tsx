import { useEffect, useRef, useState } from 'react'
import { isBackgroundImageUsingDefaultLayout } from '@/lib/backgroundImages'
import { loadImageDimensions, suggestBackgroundAutoFit } from '@/lib/backgroundAutoFit'
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'
import ResetButton from '../ui/ResetButton'
import SectionDivider from '../ui/SectionDivider'
import ActiveWallpaperSection from './bg/ActiveWallpaperSection'
import GlobalBackgroundSection from './bg/GlobalBackgroundSection'
import SlideshowPoolSection from './bg/SlideshowPoolSection'
import BgZoomAudioSection from './bg/BgZoomAudioSection'
import { VISIBLE_BACKGROUND_THUMBNAILS } from './bg/constants'

export default function BgTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const multiRef = useRef<HTMLInputElement>(null)
  const globalRef = useRef<HTMLInputElement>(null)
  const [showPoolThumbnails, setShowPoolThumbnails] = useState(true)
  const [thumbnailWindowStart, setThumbnailWindowStart] = useState(0)
  const activeImage = store.backgroundImages.find((image) => image.assetId === store.activeImageId)
    ?? store.backgroundImages[0]
    ?? null
  const activeImageIndex = activeImage
    ? store.backgroundImages.findIndex((image) => image.assetId === activeImage.assetId)
    : -1
  const defaultLayoutCount = store.backgroundImages.filter((image) => (
    image.assetId !== store.activeImageId && isBackgroundImageUsingDefaultLayout(image)
  )).length
  const maxThumbnailWindowStart = Math.max(0, store.backgroundImages.length - VISIBLE_BACKGROUND_THUMBNAILS)
  const visibleBackgroundImages = showPoolThumbnails
    ? store.backgroundImages.slice(thumbnailWindowStart, thumbnailWindowStart + VISIBLE_BACKGROUND_THUMBNAILS)
    : []

  useEffect(() => {
    setThumbnailWindowStart((prev) => Math.min(prev, maxThumbnailWindowStart))
  }, [maxThumbnailWindowStart])

  useEffect(() => {
    if (!store.activeImageId || store.backgroundImages.length === 0) return
    const activeIndex = store.backgroundImages.findIndex((image) => image.assetId === store.activeImageId)
    if (activeIndex < 0) return

    setThumbnailWindowStart((prev) => {
      if (activeIndex < prev) return activeIndex
      if (activeIndex >= prev + VISIBLE_BACKGROUND_THUMBNAILS) {
        return Math.max(0, activeIndex - VISIBLE_BACKGROUND_THUMBNAILS + 1)
      }
      return prev
    })
  }, [store.activeImageId, store.backgroundImages])

  async function handleGlobalBackgroundFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const previousId = store.globalBackgroundId
    const id = await saveImage(file)
    const url = await loadImage(id)
    if (!url) return

    store.setGlobalBackgroundId(id)
    store.setGlobalBackgroundUrl(url)

    if (previousId && previousId !== id) {
      await deleteImage(previousId).catch(() => undefined)
    }

    event.target.value = ''
  }

  async function handleMultiFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    let firstAddedId: string | null = null
    for (const file of files) {
      const id = await saveImage(file)
      const url = await loadImage(id)
      if (!url) continue
      store.addImageEntry(id, url)
      if (!firstAddedId) firstAddedId = id
    }

    if (!store.activeImageId && firstAddedId) {
      store.setActiveImageId(firstAddedId)
    }

    event.target.value = ''
  }

  async function removeImage(index: number) {
    const id = store.backgroundImages[index]?.assetId
    if (!id) return
    await deleteImage(id)
    store.removeImageEntry(id)
  }

  async function clearAllImages() {
    for (const id of store.imageIds) await deleteImage(id)
    store.setImageUrls([])
  }

  async function removeGlobalBackground() {
    const previousId = store.globalBackgroundId
    if (previousId) await deleteImage(previousId).catch(() => undefined)
    store.setGlobalBackgroundId(null)
    store.setGlobalBackgroundUrl(null)
  }

  async function autoFitActiveImage() {
    if (!activeImage?.url) return
    const { width, height } = await loadImageDimensions(activeImage.url)
    const suggestion = suggestBackgroundAutoFit(
      window.innerWidth,
      window.innerHeight,
      width,
      height,
      store.imageBassReactive,
      store.imageBassScaleIntensity
    )

    store.setImageFitMode(suggestion.fitMode)
    store.setImageScale(suggestion.scale)
    store.setImagePositionX(suggestion.positionX)
    store.setImagePositionY(suggestion.positionY)
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
        imageMirror={store.imageMirror}
        transitionType={store.slideshowTransitionType}
        transitionDuration={store.slideshowTransitionDuration}
        transitionIntensity={store.slideshowTransitionIntensity}
        transitionAudioDrive={store.slideshowTransitionAudioDrive}
        transitionAudioChannel={store.slideshowTransitionAudioChannel}
        defaultLayoutCount={defaultLayoutCount}
        onUploadClick={() => multiRef.current?.click()}
        onChangeFitMode={store.setImageFitMode}
        onChangeScale={store.setImageScale}
        onChangePositionX={store.setImagePositionX}
        onChangePositionY={store.setImagePositionY}
        onChangeMirror={store.setImageMirror}
        onChangeTransitionType={store.setSlideshowTransitionType}
        onChangeTransitionDuration={store.setSlideshowTransitionDuration}
        onChangeTransitionIntensity={store.setSlideshowTransitionIntensity}
        onChangeTransitionAudioDrive={store.setSlideshowTransitionAudioDrive}
        onChangeTransitionAudioChannel={store.setSlideshowTransitionAudioChannel}
        onApplyLayoutToDefaults={store.applyActiveImageConfigToDefaultImages}
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
        thumbnailWindowStart={thumbnailWindowStart}
        maxThumbnailWindowStart={maxThumbnailWindowStart}
        visibleBackgroundImages={visibleBackgroundImages}
        onToggleShowThumbnails={setShowPoolThumbnails}
        onChangeThumbnailWindowStart={setThumbnailWindowStart}
        onMultiUploadClick={() => multiRef.current?.click()}
        onClearAllImages={() => void clearAllImages()}
        onSetActiveImage={store.setActiveImageId}
        onRemoveImage={(index) => void removeImage(index)}
        onMoveLeft={() => activeImage && store.moveImageEntry(activeImage.assetId, -1)}
        onMoveRight={() => activeImage && store.moveImageEntry(activeImage.assetId, 1)}
        onShuffle={store.shuffleImageEntries}
      />
      <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMultiFiles} className="hidden" />

      <SectionDivider label={t.section_global_background} />
      <GlobalBackgroundSection
        t={t}
        globalBackgroundId={store.globalBackgroundId}
        globalBackgroundUrl={store.globalBackgroundUrl}
        globalBackgroundFitMode={store.globalBackgroundFitMode}
        globalBackgroundScale={store.globalBackgroundScale}
        globalBackgroundPositionX={store.globalBackgroundPositionX}
        globalBackgroundPositionY={store.globalBackgroundPositionY}
        globalBackgroundOpacity={store.globalBackgroundOpacity}
        globalBackgroundBrightness={store.globalBackgroundBrightness}
        globalBackgroundContrast={store.globalBackgroundContrast}
        globalBackgroundSaturation={store.globalBackgroundSaturation}
        globalBackgroundBlur={store.globalBackgroundBlur}
        globalBackgroundHueRotate={store.globalBackgroundHueRotate}
        onUploadClick={() => globalRef.current?.click()}
        onRemove={() => void removeGlobalBackground()}
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
      <input ref={globalRef} type="file" accept="image/*" onChange={handleGlobalBackgroundFile} className="hidden" />
    </>
  )
}
