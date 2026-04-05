import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WallpaperAppProviders from '@/components/app/WallpaperAppProviders';
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport';
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { useReceiveWallpaperChanges } from '@/hooks/useWallpaperPreviewSync';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';

export default function PreviewPage() {
	const [showUI, setShowUI] = useState(true);
	const isMiniRoute =
		typeof window !== 'undefined' &&
		window.location.hash.includes('mini=1');
	const {
		isFullscreen,
		fullscreenSupported,
		isMiniPlayerOpen,
		toggleFullscreen,
		toggleMiniPlayer
	} = useWindowPresentationControls();
	useRestoreWallpaperAssets();
	useReceiveWallpaperChanges();

	useEffect(() => {
		if (isMiniRoute) {
			setShowUI(false);
			return undefined;
		}
		// Hide UI overlay after 3s of inactivity
		let timer: ReturnType<typeof setTimeout>;
		const resetTimer = () => {
			setShowUI(true);
			clearTimeout(timer);
			timer = setTimeout(() => setShowUI(false), 3000);
		};
		resetTimer();
		window.addEventListener('mousemove', resetTimer);
		window.addEventListener('keydown', resetTimer);

		return () => {
			window.removeEventListener('mousemove', resetTimer);
			window.removeEventListener('keydown', resetTimer);
			clearTimeout(timer);
		};
	}, [isMiniRoute]);

	return (
		<WallpaperAppProviders>
			<WallpaperViewport />

			<main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
				{/* Minimal overlay — fades out after inactivity */}
				<div
					className={`fixed top-3 right-3 z-50 flex gap-2 transition-opacity duration-500 ${
						showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
					} ${isMiniRoute ? 'hidden' : ''}`}
				>
					{fullscreenSupported ? (
						<button
							onClick={() => void toggleFullscreen()}
							className="px-3 py-1.5 text-xs rounded bg-black/70 border border-cyan-900 text-cyan-400 hover:border-cyan-500 transition-colors backdrop-blur-sm"
						>
							{isFullscreen ? '🗗 Normal View' : '⛶ Fullscreen'}
						</button>
					) : null}
					<button
						onClick={() => void toggleMiniPlayer()}
						className="px-3 py-1.5 text-xs rounded bg-black/70 border border-cyan-900 text-cyan-400 hover:border-cyan-500 transition-colors backdrop-blur-sm"
					>
						{isMiniPlayerOpen
							? '▣ Close Mini Player'
							: '◲ Mini Player'}
					</button>
					<Link
						to="/editor"
						className="px-3 py-1.5 text-xs rounded bg-black/70 border border-cyan-900 text-cyan-400 hover:border-cyan-500 transition-colors backdrop-blur-sm"
					>
						← Editor
					</Link>
				</div>
			</main>
		</WallpaperAppProviders>
	);
}
