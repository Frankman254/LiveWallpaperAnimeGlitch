import { useState } from 'react';
import WallpaperAppProviders from '@/components/app/WallpaperAppProviders';
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport';
import ControlPanel from '@/components/controls/ControlPanel';
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { usePresetDirtyTracker } from '@/hooks/usePresetDirtyTracker';
import { useBroadcastWallpaperChanges } from '@/hooks/useWallpaperPreviewSync';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';

export default function EditorPage() {
	const [panelOpen, setPanelOpen] = useState(false);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const { isStudyModeOpen, closeStudyMode } =
		useWindowPresentationControls();
	useRestoreWallpaperAssets();
	usePresetDirtyTracker();
	useBroadcastWallpaperChanges();

	const editorOnlyMode = isStudyModeOpen;
	const effectivePanelOpen = !editorOnlyMode && panelOpen;
	const effectiveOverlayOpen = editorOnlyMode || overlayOpen;

	return (
		<WallpaperAppProviders>
			<WallpaperViewport
				editorMode
				interactionVisible={
					!editorOnlyMode && (panelOpen || overlayOpen)
				}
				sceneVisible={!editorOnlyMode}
			/>
			<ControlPanel
				open={effectivePanelOpen}
				maximized={effectiveOverlayOpen}
				forceMaximized={editorOnlyMode}
				onOpenChange={setPanelOpen}
				onMaximizedChange={setOverlayOpen}
				onForceClose={() => void closeStudyMode()}
			/>
		</WallpaperAppProviders>
	);
}
