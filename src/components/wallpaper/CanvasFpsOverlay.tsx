import type { ControlPanelAnchor } from '@/types/wallpaper';
import FpsBadge from '@/components/controls/FpsBadge';
import { useWallpaperStore } from '@/store/wallpaperStore';

const FPS_OVERLAY_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-4 left-4',
	'top-right': 'top-4 right-4',
	'bottom-left': 'bottom-4 left-4',
	'bottom-right': 'bottom-4 right-4'
};

export default function CanvasFpsOverlay() {
	const anchor = useWallpaperStore(state => state.fpsOverlayAnchor);

	return (
		<div
			className={`pointer-events-none absolute z-[120] ${FPS_OVERLAY_CLASS[anchor]}`}
		>
			<FpsBadge />
		</div>
	);
}
