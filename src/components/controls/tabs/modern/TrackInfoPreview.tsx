import { useEffect, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { drawTrackTitleOverlay } from '@/components/audio/TrackTitleOverlay';
import { resolveTrackDisplay } from '@/lib/audio/trackMetadata';
import { UI_COLORS } from '@/ui';

/** Builds a placeholder cover so the widget's cover slot is visible in the
 *  preview even when the sample track has no real artwork. */
function createPlaceholderCover(): HTMLImageElement | null {
	if (typeof document === 'undefined') return null;
	const size = 160;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	const grad = ctx.createLinearGradient(0, 0, size, size);
	grad.addColorStop(0, '#3b1d6e');
	grad.addColorStop(1, '#0e7490');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, size, size);
	ctx.fillStyle = 'rgba(255,255,255,0.85)';
	ctx.font = '600 84px "Segoe UI", sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('♪', size / 2, size / 2 + 4);
	const image = new Image();
	image.src = canvas.toDataURL();
	return image;
}

const SAMPLE_TRACK = {
	name: 'Aurora Skies - Midnight Drive.mp3',
	artist: 'Aurora Skies',
	title: 'Midnight Drive',
	manualArtist: '',
	manualTitle: ''
};

const SAMPLE_DURATION = 213;

/**
 * Honest WYSIWYG preview: renders the real now-playing overlay (widget or free
 * mode) with the live settings into a screen-aspect canvas, so styling shows
 * exactly as it will on the wallpaper.
 */
export default function TrackInfoPreview() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const coverRef = useRef<HTMLImageElement | null>(null);
	const startRef = useRef<number>(performance.now());

	useEffect(() => {
		coverRef.current = createPlaceholderCover();
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const aspect =
			typeof window !== 'undefined' && window.innerHeight > 0
				? window.innerWidth / window.innerHeight
				: 16 / 9;

		function resize() {
			if (!canvas) return;
			const cssWidth = canvas.clientWidth || 320;
			const cssHeight = cssWidth / aspect;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(cssWidth * dpr);
			canvas.height = Math.round(cssHeight * dpr);
			canvas.style.height = `${cssHeight}px`;
		}
		resize();
		window.addEventListener('resize', resize);

		function frame(now: number) {
			if (!canvas || !ctx) return;
			const state = useWallpaperStore.getState();
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Backdrop so glass/glow read against something.
			const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
			bg.addColorStop(0, '#1b1726');
			bg.addColorStop(1, '#05070c');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const display = resolveTrackDisplay(SAMPLE_TRACK, state);
			const elapsed = ((now - startRef.current) / 1000) % SAMPLE_DURATION;
			drawTrackTitleOverlay(
				ctx,
				canvas,
				{
					artist: display.artist,
					title: display.title,
					coverImage: state.nowPlayingCoverEnabled
						? coverRef.current
						: null
				},
				elapsed,
				SAMPLE_DURATION,
				1 / 30,
				state
			);

			rafRef.current = requestAnimationFrame(frame);
		}
		rafRef.current = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, []);

	return (
		<div
			className="overflow-hidden rounded-[var(--editor-radius-md)] border"
			style={{ borderColor: UI_COLORS.border, background: '#05070c' }}
		>
			<canvas ref={canvasRef} className="block w-full" />
		</div>
	);
}
