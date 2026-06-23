import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	buildControllerLayers,
	buildOverlayLayers,
	buildSceneLayers
} from '@/lib/layers';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperState } from '@/types/wallpaper';
import { useLayerOrder } from './useLayerOrder';
import { useLayerToggles } from './useLayerToggles';

export function useLayerStack() {
	const layerState = useWallpaperStore(
		useShallow(s => ({
			layerZIndices: s.layerZIndices,
			overlays: s.overlays,
			backgroundImages: s.backgroundImages,
			backgroundImageEnabled: s.backgroundImageEnabled,
			imageOpacity: s.imageOpacity,
			imagePositionX: s.imagePositionX,
			imagePositionY: s.imagePositionY,
			imageScale: s.imageScale,
			imageRotation: s.imageRotation,
			imageBassReactive: s.imageBassReactive,
			imageBassScaleIntensity: s.imageBassScaleIntensity,
			imageAudioChannel: s.imageAudioChannel,
			imageUrl: s.imageUrl,
			imageFitMode: s.imageFitMode,
			imageMirror: s.imageMirror,
			slideshowEnabled: s.slideshowEnabled,
			slideshowInterval: s.slideshowInterval,
			slideshowTransitionType: s.slideshowTransitionType,
			slideshowTransitionDuration: s.slideshowTransitionDuration,
			slideshowTransitionIntensity: s.slideshowTransitionIntensity,
			slideshowTransitionAudioDrive: s.slideshowTransitionAudioDrive,
			particlesEnabled: s.particlesEnabled,
			particleLayerMode: s.particleLayerMode,
			particleOpacity: s.particleOpacity,
			particleAudioReactive: s.particleAudioReactive,
			particleAudioSizeBoost: s.particleAudioSizeBoost,
			particleAudioOpacityBoost: s.particleAudioOpacityBoost,
			particleAudioChannel: s.particleAudioChannel,
			particleCount: s.particleCount,
			particleShape: s.particleShape,
			rainEnabled: s.rainEnabled,
			performanceMode: s.performanceMode,
			rainIntensity: s.rainIntensity,
			rainMeshRotationZ: s.rainMeshRotationZ,
			rainParticleType: s.rainParticleType,
			rainColorMode: s.rainColorMode,
			logoEnabled: s.logoEnabled,
			logoPositionX: s.logoPositionX,
			logoPositionY: s.logoPositionY,
			logoAudioSensitivity: s.logoAudioSensitivity,
			logoBandMode: s.logoBandMode,
			logoUrl: s.logoUrl,
			logoBaseSize: s.logoBaseSize,
			audioTrackTitleEnabled: s.audioTrackTitleEnabled,
			audioTrackTimeEnabled: s.audioTrackTimeEnabled,
			audioTrackTitleOpacity: s.audioTrackTitleOpacity,
			audioTrackTimeOpacity: s.audioTrackTimeOpacity,
			audioTrackTitlePositionX: s.audioTrackTitlePositionX,
			audioTrackTitlePositionY: s.audioTrackTitlePositionY,
			audioTrackTitleWidth: s.audioTrackTitleWidth,
			audioTrackTitleFontSize: s.audioTrackTitleFontSize,
			audioTrackTimeFontSize: s.audioTrackTimeFontSize,
			audioTrackTitleScrollSpeed: s.audioTrackTitleScrollSpeed,
			audioLyricsEnabled: s.audioLyricsEnabled,
			audioLyricsOpacity: s.audioLyricsOpacity,
			audioLyricsPositionX: s.audioLyricsPositionX,
			audioLyricsPositionY: s.audioLyricsPositionY,
			audioLyricsWidth: s.audioLyricsWidth,
			audioLyricsFontSize: s.audioLyricsFontSize,
			audioLyricsVisibleLineCount: s.audioLyricsVisibleLineCount,
			spectrumEnabled: s.spectrumEnabled,
			spectrumOpacity: s.spectrumOpacity,
			spectrumPositionX: s.spectrumPositionX,
			spectrumPositionY: s.spectrumPositionY,
			spectrumBandMode: s.spectrumBandMode,
			spectrumMode: s.spectrumMode,
			spectrumLinearOrientation: s.spectrumLinearOrientation,
			spectrumRadialShape: s.spectrumRadialShape,
			spectrumShape: s.spectrumShape,
			spectrumFollowLogo: s.spectrumFollowLogo
		}))
	);
	const wallpaperLayerState = layerState as WallpaperState;
	const renderableLayers = useMemo(
		() =>
			[
				...buildSceneLayers(wallpaperLayerState),
				...buildOverlayLayers(wallpaperLayerState)
			].sort((a, b) => a.zIndex - b.zIndex),
		[wallpaperLayerState]
	);
	const controllerLayers = useMemo(
		() =>
			buildControllerLayers(wallpaperLayerState).sort(
				(a, b) => a.zIndex - b.zIndex
			),
		[wallpaperLayerState]
	);
	const toggles = useLayerToggles();
	const order = useLayerOrder(renderableLayers);

	function restoreLayerDefaults() {
		order.resetLayerZIndices();
		toggles.restoreLayerVisibilityDefaults();
	}

	return {
		renderableLayers,
		controllerLayers,
		globalBackgroundLayer: toggles.globalBackgroundLayer,
		draggedLayerId: order.draggedLayerId,
		dropTargetLayerId: order.dropTargetLayerId,
		getLayerLabel: toggles.getLayerLabel,
		canToggle: toggles.canToggle,
		canReorder: order.canReorder,
		getLayerMoveState: order.getLayerMoveState,
		restoreLayerDefaults,
		setGlobalBackgroundEnabled: toggles.setGlobalBackgroundEnabled,
		setSelectedOverlayId: toggles.setSelectedOverlayId,
		toggleLayer: toggles.toggleLayer,
		moveLayer: order.moveLayer,
		updateZIndex: order.updateZIndex,
		handlePointerDragStart: order.handlePointerDragStart,
		handleNativeDragStart: order.handleNativeDragStart,
		handleNativeDragOver: order.handleNativeDragOver,
		handleNativeDragLeave: order.handleNativeDragLeave,
		handleNativeDrop: order.handleNativeDrop,
		handleNativeDragEnd: order.handleNativeDragEnd
	};
}
