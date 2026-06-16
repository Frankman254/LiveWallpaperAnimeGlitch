import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * DragModeOverlay — shows a persistent hint when drag mode is active.
 * Renders above the canvas, below the control panel (z-30).
 */
export default function DragModeOverlay() {
	const { enableDragMode, activeTool } = useWallpaperStore();

	if (!enableDragMode) return null;

	const toolLabels: Record<string, string> = {
		none: 'Pick a tool on the editor toolbar to start dragging',
		logo: 'Drag anywhere on the canvas to reposition the logo',
		spectrum:
			'Drag anywhere on the canvas to reposition the spectrum visualizer',
		'track-title':
			'Drag anywhere on the canvas to reposition the track title',
		lyrics: 'Drag anywhere on the canvas to reposition the lyrics',
		hud: 'Drag the HUD chip itself to reposition it'
	};

	return (
		<div
			className="pointer-events-none fixed top-4 left-1/2 z-30 -translate-x-1/2"
			style={{ fontFamily: 'inherit' }}
		>
			<div
				className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] backdrop-blur-sm"
				style={{
					background: 'rgba(0,0,0,0.65)',
					borderColor: 'rgba(255,255,255,0.18)',
					color: 'rgba(255,255,255,0.75)',
					boxShadow:
						activeTool !== 'none'
							? '0 0 12px var(--editor-accent-color, rgba(0,200,255,0.5))'
							: 'none'
				}}
			>
				<span
					className="h-2 w-2 rounded-full animate-pulse"
					style={{
						background:
							activeTool !== 'none'
								? 'var(--editor-accent-color, #00ccff)'
								: 'rgba(255,255,255,0.4)'
					}}
				/>
				{toolLabels[activeTool] ?? toolLabels.none}
			</div>
		</div>
	);
}
