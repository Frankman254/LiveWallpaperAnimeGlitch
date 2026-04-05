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

export default function WallpaperViewport({
	editorMode = false,
	interactionVisible = false,
	sceneVisible = true
}: {
	editorMode?: boolean;
	interactionVisible?: boolean;
	sceneVisible?: boolean;
}) {
	const state = useWallpaperStore();
	const sceneLayers = buildSceneLayers(state);
	const overlayLayers = buildOverlayLayers(state);
	const renderableLayers = [...sceneLayers, ...overlayLayers].sort(
		(a, b) => a.zIndex - b.zIndex
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

					if (
						layer.type === 'logo' ||
						layer.type === 'spectrum' ||
						layer.type === 'track-title'
					) {
						return (
							<AudioLayerCanvas key={layer.id} layer={layer} />
						);
					}

					return <SceneLayerCanvas key={layer.id} layer={layer} />;
				})}

				{editorMode && (
					<OverlayInteractionStage visible={interactionVisible} />
				)}
				<DiagnosticsHudStack />
				<CanvasFpsOverlay />
			</main>
		</>
	);
}
