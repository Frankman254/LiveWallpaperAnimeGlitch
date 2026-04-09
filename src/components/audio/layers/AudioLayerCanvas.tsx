import { useEffect, useMemo, useRef } from 'react';
import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { LogoLayer, SpectrumLayer, TrackTitleLayer } from '@/types/layers';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { getOverlayLayerById } from '@/lib/layers';
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry';
import { resetSpectrum } from '@/components/audio/CircularSpectrum';
import { resetLogo } from '@/components/audio/ReactiveLogo';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import {
	drawFilmNoise,
	drawRgbShift,
	drawScanlines,
	getScanlineAmount
} from '@/components/wallpaper/layers/imageCanvasEffects';

type RenderableAudioLayer = LogoLayer | SpectrumLayer | TrackTitleLayer;

function isFilterTargetActive(
	layer: RenderableAudioLayer,
	filterTargets: string[]
): boolean {
	return (
		(layer.type === 'logo' && filterTargets.includes('logo')) ||
		(layer.type === 'spectrum' && filterTargets.includes('spectrum'))
	);
}

export default function AudioLayerCanvas({
	layers
}: {
	layers: RenderableAudioLayer[];
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const layerListRef = useRef<RenderableAudioLayer[]>(layers);
	const postProcessCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const cachedRawTrackTitleRef = useRef<string>('');
	const cachedFormattedTrackTitleRef = useRef<string>('');
	const backgroundPalette = useBackgroundPalette();
	const paletteRef = useRef(backgroundPalette);
	const { getAudioSnapshot, getFileName, getCurrentTime, getDuration } =
		useAudioData();

	useEffect(() => {
		layerListRef.current = layers;
	}, [layers]);

	useEffect(() => {
		paletteRef.current = backgroundPalette;
	}, [backgroundPalette]);

	const highestZIndex = useMemo(
		() => layers.reduce((max, layer) => Math.max(max, layer.zIndex), 0),
		[layers]
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || layerListRef.current.length === 0) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		function ensurePostProcessCanvas(
			width: number,
			height: number
		): HTMLCanvasElement {
			const snapshotCanvas =
				postProcessCanvasRef.current ?? document.createElement('canvas');
			postProcessCanvasRef.current = snapshotCanvas;
			if (snapshotCanvas.width !== width) snapshotCanvas.width = width;
			if (snapshotCanvas.height !== height) snapshotCanvas.height = height;
			return snapshotCanvas;
		}

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

			const rawTrackTitle = getFileName();
			if (rawTrackTitle !== cachedRawTrackTitleRef.current) {
				cachedRawTrackTitleRef.current = rawTrackTitle;
				cachedFormattedTrackTitleRef.current =
					formatTrackTitle(rawTrackTitle);
			}

			const audio: AudioSnapshot = getAudioSnapshot();
			const trackCurrentTime = getCurrentTime();
			const trackDuration = getDuration();
			const activeLayers = [...layerListRef.current].sort(
				(a, b) => a.zIndex - b.zIndex
			);

			for (const configuredLayer of activeLayers) {
				const nextLayer = getOverlayLayerById(state, configuredLayer.id);
				if (
					!nextLayer?.enabled ||
					(nextLayer.type !== 'logo' &&
						nextLayer.type !== 'spectrum' &&
						nextLayer.type !== 'track-title')
				) {
					continue;
				}

				const filterActive = isFilterTargetActive(
					nextLayer,
					state.filterTargets
				);
				const drawContext = {
					canvas: currentCanvas,
					state,
					audio,
					dt,
					palette: paletteRef.current,
					trackTitle: cachedFormattedTrackTitleRef.current,
					trackCurrentTime,
					trackDuration
				};

				if (!filterActive) {
					drawOverlayLayer(nextLayer, {
						ctx,
						...drawContext
					});
					continue;
				}

				const snapshotCanvas = ensurePostProcessCanvas(
					currentCanvas.width,
					currentCanvas.height
				);
				const snapshotCtx = snapshotCanvas.getContext('2d');
				if (!snapshotCtx) {
					drawOverlayLayer(nextLayer, {
						ctx,
						...drawContext
					});
					continue;
				}

				snapshotCtx.clearRect(
					0,
					0,
					snapshotCanvas.width,
					snapshotCanvas.height
				);
				drawOverlayLayer(nextLayer, {
					ctx: snapshotCtx,
					...drawContext
				});

				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(1, state.filterOpacity));
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

			rafRef.current = requestAnimationFrame(frame);
		}

		rafRef.current = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [getAudioSnapshot, getCurrentTime, getDuration, getFileName]);

	useEffect(
		() => () => {
			const currentLayers = layerListRef.current;
			if (currentLayers.some(layer => layer.type === 'logo')) resetLogo();
			if (currentLayers.some(layer => layer.type === 'spectrum')) {
				resetSpectrum();
			}
		},
		[]
	);

	if (layers.length === 0) return null;

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: highestZIndex
			}}
		/>
	);
}
