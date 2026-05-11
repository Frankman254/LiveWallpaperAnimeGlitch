import { useState } from 'react';
import WallpaperAppProviders from '@/components/app/WallpaperAppProviders';
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport';
import ControlPanel from '@/components/controls/ControlPanel';
import ModernControlPanel from '@/components/controls/ModernControlPanel';
import DragModeOverlay from '@/components/wallpaper/DragModeOverlay';
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { usePresetDirtyTracker } from '@/hooks/usePresetDirtyTracker';
import { useBroadcastWallpaperChanges } from '@/hooks/useWallpaperPreviewSync';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import { useWallpaperStore } from '@/store/wallpaperStore';

export default function EditorPage() {
	const [panelOpen, setPanelOpen] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const { isMiniPlayerOpen, toggleMiniPlayer } =
		useWindowPresentationControls();
	const editorUiVariant = useWallpaperStore(s => s.editorUiVariant);
	useRestoreWallpaperAssets();
	usePresetDirtyTracker();
	useBroadcastWallpaperChanges();

	const editorOnlyMode = isMiniPlayerOpen;
	const effectivePanelOpen = !editorOnlyMode && panelOpen;
	const effectiveOverlayOpen = editorOnlyMode || overlayOpen;

	const PanelComponent =
		editorUiVariant === 'modern' ? ModernControlPanel : ControlPanel;

	return (
		<WallpaperAppProviders>
			<WallpaperViewport
				editorMode
				interactionVisible={
					!editorOnlyMode && (panelOpen || overlayOpen)
				}
				sceneVisible={!editorOnlyMode}
			/>
			<PanelComponent
				open={effectivePanelOpen}
				maximized={effectiveOverlayOpen}
				forceMaximized={editorOnlyMode}
				onOpenChange={setPanelOpen}
				onMaximizedChange={setOverlayOpen}
				onForceClose={() => void toggleMiniPlayer()}
			/>
			<DragModeOverlay />
		</WallpaperAppProviders>
	);
}
