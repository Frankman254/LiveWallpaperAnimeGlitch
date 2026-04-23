import { useEffect, useRef } from 'react';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { resetSpectrum } from '@/components/audio/CircularSpectrum';
import { resetLogo } from '@/components/audio/ReactiveLogo';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import {
	createAudioLayerFrameRenderState,
	renderAudioLayerFrame,
	type RenderableAudioLayer
} from '@/components/audio/layers/audioLayerFrameRenderer';

export default function AudioLayerCanvas({
	layer
}: {
	layer: RenderableAudioLayer;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const layerRef = useRef<RenderableAudioLayer>(layer);
	const frameRenderStateRef = useRef(createAudioLayerFrameRenderState());
	const cachedRawTrackTitleRef = useRef<string>('');
	const cachedFormattedTrackTitleRef = useRef<string>('');
	const backgroundPalette = useBackgroundPalette();
	const paletteRef = useRef(backgroundPalette);
	const { getAudioSnapshot, getFileName, getCurrentTime, getDuration, captureMode } =
		useAudioData();

	useEffect(() => {
		layerRef.current = layer;
	}, [layer]);

	useEffect(() => {
		paletteRef.current = backgroundPalette;
	}, [backgroundPalette]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		function resize() {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas) return;
			currentCanvas.width = window.innerWidth;
			currentCanvas.height = window.innerHeight;
		}
		resize();
		window.addEventListener('resize', resize);

		function frame(time: number) {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas || !ctx) return;

			const state = useWallpaperStore.getState();
			if (state.motionPaused || state.sleepModeActive) {
				lastTimeRef.current = time;
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;
			ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

			// Only use file-derived title in file mode; clear it in live capture modes
			const rawTrackTitle = captureMode === 'file' ? getFileName() : '';
			if (rawTrackTitle !== cachedRawTrackTitleRef.current) {
				cachedRawTrackTitleRef.current = rawTrackTitle;
				cachedFormattedTrackTitleRef.current =
					formatTrackTitle(rawTrackTitle);
			}

			const audio: AudioSnapshot = getAudioSnapshot();
			const trackCurrentTime = getCurrentTime();
			const trackDuration = getDuration();
			const configuredLayer = layerRef.current;
			renderAudioLayerFrame({
				ctx,
				canvas: currentCanvas,
				layer: configuredLayer,
				state,
				audio,
				dt,
				timeMs: time,
				palette: paletteRef.current,
				trackTitle: cachedFormattedTrackTitleRef.current,
				trackCurrentTime,
				trackDuration,
				frameState: frameRenderStateRef.current
			});

			rafRef.current = requestAnimationFrame(frame);
		}

		rafRef.current = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [captureMode, getAudioSnapshot, getCurrentTime, getDuration, getFileName]);

	useEffect(
		() => () => {
			if (layer.type === 'logo') resetLogo();
			if (layer.type === 'spectrum') {
				resetSpectrum();
			}
		},
		[layer.type]
	);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: layer.zIndex
			}}
		/>
	);
}
