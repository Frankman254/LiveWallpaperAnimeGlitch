import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildOverlayLayers, buildSceneLayers } from '@/lib/layers';
import { useWallpaperStore } from '@/store/wallpaperStore';
import SlideshowManager from '@/components/SlideshowManager';
import OverlayInteractionStage from '@/components/wallpaper/OverlayInteractionStage';
import SceneLayerCanvas from '@/components/wallpaper/layers/SceneLayerCanvas';
import BackgroundImageLayerView from '@/components/wallpaper/layers/BackgroundImageLayerView';
import OverlayImageLayerView from '@/components/wallpaper/layers/OverlayImageLayerView';
import AudioLayerCanvas from '@/components/audio/layers/AudioLayerCanvas';
import GlobalBackgroundView from '@/components/wallpaper/GlobalBackgroundView';
import CanvasFpsOverlay from '@/components/wallpaper/CanvasFpsOverlay';
import DiagnosticsHudStack from '@/components/wallpaper/DiagnosticsHudStack';
import QuickActionsPanel from '@/components/wallpaper/QuickActionsPanel';
import type { WallpaperState } from '@/types/wallpaper';
import type { OverlayLayer } from '@/types/layers';

function isAudioOverlayLayer(
	layer: OverlayLayer
): layer is Extract<
	OverlayLayer,
	{ type: 'logo' | 'spectrum' | 'track-title' | 'lyrics' }
> {
	return (
		layer.type === 'logo' ||
		layer.type === 'spectrum' ||
		layer.type === 'track-title' ||
		layer.type === 'lyrics'
	);
}

export default function WallpaperViewport({
	editorMode = false,
	interactionVisible = false,
	sceneVisible = true
}: {
	editorMode?: boolean;
	interactionVisible?: boolean;
	sceneVisible?: boolean;
}) {
	const sceneLayerState = useWallpaperStore(
		useShallow(state =>
			({
				backgroundImageEnabled: state.backgroundImageEnabled,
				imageOpacity: state.imageOpacity,
				imagePositionX: state.imagePositionX,
				imagePositionY: state.imagePositionY,
				imageScale: state.imageScale,
				imageBassReactive: state.imageBassReactive,
				imageBassScaleIntensity: state.imageBassScaleIntensity,
				imageAudioChannel: state.imageAudioChannel,
				imageUrl: state.imageUrl,
				imageFitMode: state.imageFitMode,
				imageMirror: state.imageMirror,
				slideshowTransitionType: state.slideshowTransitionType,
				slideshowTransitionDuration: state.slideshowTransitionDuration,
				slideshowTransitionIntensity:
					state.slideshowTransitionIntensity,
				slideshowTransitionAudioDrive:
					state.slideshowTransitionAudioDrive,
				particlesEnabled: state.particlesEnabled,
				particleLayerMode: state.particleLayerMode,
				particleOpacity: state.particleOpacity,
				particleAudioReactive: state.particleAudioReactive,
				particleAudioSizeBoost: state.particleAudioSizeBoost,
				particleAudioOpacityBoost: state.particleAudioOpacityBoost,
				particleAudioChannel: state.particleAudioChannel,
				particleCount: state.particleCount,
				particleShape: state.particleShape,
				rainEnabled: state.rainEnabled,
				performanceMode: state.performanceMode,
				rainIntensity: state.rainIntensity,
				rainMeshRotationZ: state.rainMeshRotationZ,
				rainParticleType: state.rainParticleType,
				rainColorMode: state.rainColorMode,
				layerZIndices: state.layerZIndices
			}) satisfies Partial<WallpaperState>)
		);
	const overlayLayerState = useWallpaperStore(
		useShallow(state =>
			({
				overlays: state.overlays,
				layerZIndices: state.layerZIndices,
				logoEnabled: state.logoEnabled,
				logoPositionX: state.logoPositionX,
				logoPositionY: state.logoPositionY,
				logoAudioSensitivity: state.logoAudioSensitivity,
				logoBandMode: state.logoBandMode,
				logoUrl: state.logoUrl,
				logoBaseSize: state.logoBaseSize,
				audioTrackTitleEnabled: state.audioTrackTitleEnabled,
				audioTrackTimeEnabled: state.audioTrackTimeEnabled,
				audioTrackTitleOpacity: state.audioTrackTitleOpacity,
				audioTrackTimeOpacity: state.audioTrackTimeOpacity,
				audioTrackTitlePositionX: state.audioTrackTitlePositionX,
				audioTrackTitlePositionY: state.audioTrackTitlePositionY,
				audioTrackTitleWidth: state.audioTrackTitleWidth,
				audioTrackTitleFontSize: state.audioTrackTitleFontSize,
				audioTrackTimeFontSize: state.audioTrackTimeFontSize,
				audioTrackTitleScrollSpeed: state.audioTrackTitleScrollSpeed,
				audioLyricsEnabled: state.audioLyricsEnabled,
				audioLyricsPositionX: state.audioLyricsPositionX,
				audioLyricsPositionY: state.audioLyricsPositionY,
				audioLyricsWidth: state.audioLyricsWidth,
				audioLyricsFontSize: state.audioLyricsFontSize,
				audioLyricsOpacity: state.audioLyricsOpacity,
				audioLyricsVisibleLineCount: state.audioLyricsVisibleLineCount,
				spectrumEnabled: state.spectrumEnabled,
				spectrumOpacity: state.spectrumOpacity,
				spectrumPositionX: state.spectrumPositionX,
				spectrumPositionY: state.spectrumPositionY,
				spectrumMode: state.spectrumMode,
				spectrumLinearOrientation: state.spectrumLinearOrientation,
				spectrumRadialShape: state.spectrumRadialShape,
				spectrumShape: state.spectrumShape,
				spectrumFollowLogo: state.spectrumFollowLogo,
				spectrumBandMode: state.spectrumBandMode
			}) satisfies Partial<WallpaperState>)
		);

	const sceneLayers = useMemo(
		() => buildSceneLayers(sceneLayerState as WallpaperState),
		[sceneLayerState]
	);
	const overlayLayers = useMemo(
		() => buildOverlayLayers(overlayLayerState as WallpaperState),
		[overlayLayerState]
	);
	const audioLayers = useMemo(
		() =>
			overlayLayers
				.filter(isAudioOverlayLayer)
				.filter(layer => layer.enabled),
		[overlayLayers]
	);
	const renderableLayers = useMemo(
		() =>
			[...sceneLayers, ...overlayLayers]
				.filter(
					layer =>
						layer.type !== 'logo' &&
						layer.type !== 'spectrum' &&
						layer.type !== 'track-title' &&
						layer.type !== 'lyrics'
				)
				.sort((a, b) => a.zIndex - b.zIndex),
		[overlayLayers, sceneLayers]
	);

	if (!sceneVisible) {
		return null;
	}

	return (
		<>
			<SlideshowManager />
			<main
				style={{
					position: 'fixed',
					inset: 0,
					overflow: 'hidden',
					isolation: 'isolate'
				}}
			>
				<GlobalBackgroundView />
				{renderableLayers.map(layer => {
					if (!layer.enabled) return null;

					if (layer.type === 'background-image' && layer.imageUrl) {
						return (
							<BackgroundImageLayerView
								key={layer.id}
								layer={layer}
							/>
						);
					}

					if (layer.type === 'overlay-image') {
						return (
							<OverlayImageLayerView
								key={layer.id}
								layer={layer}
							/>
						);
					}

					return <SceneLayerCanvas key={layer.id} layer={layer} />;
				})}
				{audioLayers.map(layer => (
					<AudioLayerCanvas key={layer.id} layer={layer} />
				))}

				{editorMode && (
					<OverlayInteractionStage visible={interactionVisible} />
				)}
				<DiagnosticsHudStack />
				<CanvasFpsOverlay />
				<QuickActionsPanel />
			</main>
		</>
	);
}
