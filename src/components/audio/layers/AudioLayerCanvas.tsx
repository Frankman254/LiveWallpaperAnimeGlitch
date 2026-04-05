import { useEffect, useRef } from 'react';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { LogoLayer, SpectrumLayer, TrackTitleLayer } from '@/types/layers';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { getOverlayLayerById } from '@/lib/layers';
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry';
import { resetSpectrum } from '@/components/audio/CircularSpectrum';
import { resetLogo } from '@/components/audio/ReactiveLogo';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import {
	drawFilmNoise,
	drawRgbShift,
	drawScanlines,
	getScanlineAmount
} from '@/components/wallpaper/layers/imageCanvasEffects';

type RenderableAudioLayer = LogoLayer | SpectrumLayer | TrackTitleLayer;

export default function AudioLayerCanvas({
	layer
}: {
	layer: RenderableAudioLayer;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const postProcessCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const cachedRawTrackTitleRef = useRef<string>('');
	const cachedFormattedTrackTitleRef = useRef<string>('');
	const { getAudioSnapshot, getFileName } = useAudioData();

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
			if (state.motionPaused) {
				lastTimeRef.current = time;
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;
			ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

			const nextLayer = getOverlayLayerById(state, layer.id);
			if (nextLayer?.enabled) {
				const rawTrackTitle = getFileName();
				if (rawTrackTitle !== cachedRawTrackTitleRef.current) {
					cachedRawTrackTitleRef.current = rawTrackTitle;
					cachedFormattedTrackTitleRef.current =
						formatTrackTitle(rawTrackTitle);
				}
				const audio: AudioSnapshot = getAudioSnapshot();
				drawOverlayLayer(nextLayer, {
					ctx,
					canvas: currentCanvas,
					state,
					audio,
					dt,
					trackTitle: cachedFormattedTrackTitleRef.current
				});

				const filterActive =
					(nextLayer.type === 'logo' &&
						state.filterTargets.includes('logo')) ||
					(nextLayer.type === 'spectrum' &&
						state.filterTargets.includes('spectrum'));

				if (filterActive) {
					const snapshotCanvas =
						postProcessCanvasRef.current ??
						document.createElement('canvas');
					postProcessCanvasRef.current = snapshotCanvas;
					if (snapshotCanvas.width !== currentCanvas.width)
						snapshotCanvas.width = currentCanvas.width;
					if (snapshotCanvas.height !== currentCanvas.height)
						snapshotCanvas.height = currentCanvas.height;
					const snapshotCtx = snapshotCanvas.getContext('2d');
					if (snapshotCtx) {
						snapshotCtx.clearRect(
							0,
							0,
							snapshotCanvas.width,
							snapshotCanvas.height
						);
						snapshotCtx.drawImage(currentCanvas, 0, 0);
						ctx.clearRect(
							0,
							0,
							currentCanvas.width,
							currentCanvas.height
						);
						ctx.save();
						ctx.globalAlpha = Math.max(
							0,
							Math.min(1, state.filterOpacity)
						);
						ctx.filter = `brightness(${state.filterBrightness}) contrast(${state.filterContrast}) saturate(${state.filterSaturation}) blur(${state.filterBlur}px) hue-rotate(${state.filterHueRotate}deg)`;
						ctx.drawImage(snapshotCanvas, 0, 0);
						ctx.filter = 'none';
						const scanlineAmount = getScanlineAmount(
							state.scanlineMode,
							state.scanlineIntensity,
							time,
							audio.amplitude
						);
						ctx.globalCompositeOperation = 'source-atop';
						if (state.rgbShift > 0.0001) {
							ctx.save();
							ctx.translate(
								currentCanvas.width / 2,
								currentCanvas.height / 2
							);
							drawRgbShift(
								ctx,
								snapshotCanvas,
								currentCanvas.width,
								currentCanvas.height,
								state.rgbShift *
									Math.min(
										currentCanvas.width,
										currentCanvas.height
									) *
									0.65,
								'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
								time,
								state.filterOpacity
							);
							ctx.restore();
						}
						ctx.save();
						ctx.translate(
							currentCanvas.width / 2,
							currentCanvas.height / 2
						);
						drawFilmNoise(
							ctx,
							currentCanvas.width,
							currentCanvas.height,
							state.noiseIntensity,
							time,
							state.filterOpacity
						);
						drawScanlines(
							ctx,
							currentCanvas.width,
							currentCanvas.height,
							scanlineAmount,
							state.scanlineSpacing,
							state.scanlineThickness,
							state.filterOpacity
						);
						ctx.restore();
						ctx.restore();
					}
				}
			}

			rafRef.current = requestAnimationFrame(frame);
		}

		rafRef.current = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [getAudioSnapshot, getFileName, layer.id, layer.type]);

	useEffect(
		() => () => {
			if (layer.type === 'logo') resetLogo();
			if (layer.type === 'spectrum') resetSpectrum();
		},
		[layer.type]
	);

	if (!layer.enabled) return null;

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
