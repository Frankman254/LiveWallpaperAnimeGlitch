import type { OverlayImageLayer } from '@/types/layers'
import ImageLayerCanvas from '@/components/wallpaper/layers/ImageLayerCanvas'
import { useWallpaperStore } from '@/store/wallpaperStore'

function getBlendMode(blendMode: OverlayImageLayer['blendMode']): React.CSSProperties['mixBlendMode'] {
  if (blendMode === 'screen') return 'screen'
  if (blendMode === 'lighten') return 'lighten'
  if (blendMode === 'multiply') return 'multiply'
  return 'normal'
}

function getCropStyles(cropShape: OverlayImageLayer['cropShape']): Pick<React.CSSProperties, 'clipPath' | 'borderRadius'> {
  if (cropShape === 'circle') {
    return { clipPath: 'circle(50% at 50% 50%)' }
  }
  if (cropShape === 'rounded') {
    return { borderRadius: '18px' }
  }
  if (cropShape === 'diamond') {
    return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }
  }
  return {}
}

export default function OverlayImageLayerView({ layer }: { layer: OverlayImageLayer }) {
  const {
    filterTarget,
    selectedOverlayId,
    filterBrightness,
    filterContrast,
    filterSaturation,
    filterBlur,
    filterHueRotate,
    rgbShift,
    scanlineIntensity,
    noiseIntensity,
  } = useWallpaperStore()

  const selectedTarget = filterTarget === 'selected-overlay' && selectedOverlayId === layer.id
  const filterTargetMatches = filterTarget === 'all-images' || selectedTarget
  const advancedEffectsActive = filterTargetMatches && (
    filterBrightness !== 1 ||
    filterContrast !== 1 ||
    filterSaturation !== 1 ||
    filterBlur !== 0 ||
    filterHueRotate !== 0 ||
    rgbShift > 0.0001 ||
    scanlineIntensity > 0.001 ||
    noiseIntensity > 0.001
  )
  const blurPx = Math.max(0, layer.edgeBlur)
  const glowPx = 8 + layer.edgeGlow * 26
  const fadePercent = Math.max(48, 100 - layer.edgeFade * 120)
  const cropStyles = getCropStyles(layer.cropShape)

  if (!layer.enabled || !layer.imageUrl) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: layer.zIndex,
          mixBlendMode: getBlendMode(layer.blendMode),
        }}
      >
        <img
          src={layer.imageUrl}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: `calc(50% + ${layer.positionX * 100}vw)`,
            top: `calc(50% - ${layer.positionY * 100}vh)`,
            width: layer.width * layer.scale,
            height: layer.height * layer.scale,
            transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
            opacity: layer.opacity,
            userSelect: 'none',
            pointerEvents: 'none',
            objectFit: 'fill',
            filter: `blur(${blurPx}px) drop-shadow(0 0 ${glowPx}px rgba(255,255,255,${0.18 + layer.edgeGlow * 0.2}))`,
            WebkitMaskImage: `radial-gradient(ellipse at center, rgba(0,0,0,1) ${fadePercent}%, rgba(0,0,0,0) 100%)`,
            maskImage: `radial-gradient(ellipse at center, rgba(0,0,0,1) ${fadePercent}%, rgba(0,0,0,0) 100%)`,
            ...cropStyles,
          }}
        />
      </div>
      {advancedEffectsActive && <ImageLayerCanvas layer={layer} />}
    </>
  )
}
