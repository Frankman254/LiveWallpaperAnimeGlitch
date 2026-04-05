import { useEffect, useRef, useState } from 'react';
import {
	createAudioChannelSelectionState
} from '@/lib/audio/audioChannels';
import { useAudioData } from '@/hooks/useAudioData';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import { renderBackgroundFrame } from './imageCanvasBackgroundRenderer';
import { renderOverlayImageLayer } from './imageCanvasOverlayRenderer';
import { publishBackgroundScaleTelemetry } from '@/lib/debug/backgroundScaleTelemetry';
import { setDebugBgAudio } from '@/lib/debug/frameAudioDebugSnapshot';
import {
	getCachedImage,
	getCanvasBlendMode,
	getLayerRect,
	targetMatches,
	type BackgroundImageSnapshot,
	type BackgroundTransitionSnapshot,
	type ImageLayer
} from './imageCanvasShared';
import {
	resolveActiveImageLayer,
	resolveBackgroundAudioMetrics,
	resolveEffectiveLayerOpacity,
	resolveLayerFilterMetrics,
	resolveParallaxOffset,
	smoothMouseMotion
} from './imageCanvasFrameState';
import { resolveImageCanvasAudioState } from './imageCanvasAudioState';

export default function ImageLayerCanvas({
	layer,
	renderBaseImage = true
}: {
	layer: ImageLayer;
	renderBaseImage?: boolean;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const layerRef = useRef(layer);
	const mouseRef = useRef({ x: 0, y: 0 });
	const smoothedMouseRef = useRef({ x: 0, y: 0 });
	const imageRef = useRef<HTMLImageElement | null>(null);
	const loadedImageUrlRef = useRef<string | null>(null);
	const previousBackgroundImageRef = useRef<HTMLImageElement | null>(null);
	const previousBackgroundParamsRef = useRef<BackgroundImageSnapshot>({
		scale: layer.type === 'background-image' ? layer.scale : 1,
		positionX: layer.type === 'background-image' ? layer.positionX : 0,
		positionY: layer.type === 'background-image' ? layer.positionY : 0,
		fitMode: layer.type === 'background-image' ? layer.fitMode : 'cover',
		mirror: layer.type === 'background-image' ? layer.mirror : false
	});
	const renderedBackgroundParamsRef = useRef<BackgroundImageSnapshot>({
		scale: layer.type === 'background-image' ? layer.scale : 1,
		positionX: layer.type === 'background-image' ? layer.positionX : 0,
		positionY: layer.type === 'background-image' ? layer.positionY : 0,
		fitMode: layer.type === 'background-image' ? layer.fitMode : 'cover',
		mirror: layer.type === 'background-image' ? layer.mirror : false
	});
	const previousBackgroundTransitionRef =
		useRef<BackgroundTransitionSnapshot>({
			transitionType:
				layer.type === 'background-image'
					? layer.transitionType
					: 'fade',
			transitionDuration:
				layer.type === 'background-image'
					? layer.transitionDuration
					: 1,
			transitionIntensity:
				layer.type === 'background-image'
					? layer.transitionIntensity
					: 1,
			transitionAudioDrive:
				layer.type === 'background-image'
					? layer.transitionAudioDrive
					: 0
		});
	const renderedBackgroundTransitionRef =
		useRef<BackgroundTransitionSnapshot>({
			transitionType:
				layer.type === 'background-image'
					? layer.transitionType
					: 'fade',
			transitionDuration:
				layer.type === 'background-image'
					? layer.transitionDuration
					: 1,
			transitionIntensity:
				layer.type === 'background-image'
					? layer.transitionIntensity
					: 1,
			transitionAudioDrive:
				layer.type === 'background-image'
					? layer.transitionAudioDrive
					: 0
		});
	const currentRequestedBackgroundUrlRef = useRef<string | null>(
		layer.type === 'background-image' ? layer.imageUrl : null
	);
	const transitionStartRef = useRef<number | null>(null);
	const lastFrameTimeRef = useRef(0);
	const effectiveTimeRef = useRef(0);
	const backgroundEnvelopeRef = useRef(createAudioEnvelope());
	const imageChannelSelectionRef = useRef(
		createAudioChannelSelectionState('kick')
	);
	const transitionChannelSelectionRef = useRef(
		createAudioChannelSelectionState('instrumental')
	);
	const rgbShiftChannelSelectionRef = useRef(
		createAudioChannelSelectionState('hihat')
	);
	const [image, setImage] = useState<HTMLImageElement | null>(null);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		layerRef.current = layer;
	}, [layer]);

	useEffect(() => {
		if (!layer.imageUrl) {
			setImage(null);
			imageRef.current = null;
			loadedImageUrlRef.current = null;
			previousBackgroundImageRef.current = null;
			transitionStartRef.current = null;
			return;
		}

		if (
			layer.type === 'background-image' &&
			currentRequestedBackgroundUrlRef.current &&
			currentRequestedBackgroundUrlRef.current !== layer.imageUrl
		) {
			if (
				imageRef.current &&
				loadedImageUrlRef.current ===
					currentRequestedBackgroundUrlRef.current
			) {
				previousBackgroundImageRef.current = imageRef.current;
				previousBackgroundParamsRef.current =
					renderedBackgroundParamsRef.current;
				previousBackgroundTransitionRef.current =
					renderedBackgroundTransitionRef.current;
			}
			transitionStartRef.current = null;
		}

		currentRequestedBackgroundUrlRef.current =
			layer.type === 'background-image'
				? layer.imageUrl
				: currentRequestedBackgroundUrlRef.current;

		const requestedUrl = layer.imageUrl;
		const nextImage = getCachedImage(requestedUrl, loadedImage => {
			if (
				layer.type === 'background-image' &&
				currentRequestedBackgroundUrlRef.current !== requestedUrl
			)
				return;
			if (
				layer.type === 'background-image' &&
				previousBackgroundImageRef.current &&
				loadedImageUrlRef.current !== requestedUrl
			) {
				transitionStartRef.current = effectiveTimeRef.current;
			}
			imageRef.current = loadedImage;
			loadedImageUrlRef.current = requestedUrl;
			setImage(loadedImage);
		});
		if (nextImage.complete && nextImage.naturalWidth > 0) {
			if (
				layer.type === 'background-image' &&
				previousBackgroundImageRef.current &&
				loadedImageUrlRef.current !== requestedUrl
			) {
				transitionStartRef.current = effectiveTimeRef.current;
			}
			imageRef.current = nextImage;
			loadedImageUrlRef.current = requestedUrl;
			setImage(nextImage);
		}
	}, [layer.imageUrl]);

	useEffect(() => {
		function handleMouseMove(event: MouseEvent) {
			mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
		}

		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const canRenderBackgroundFallback =
			layer.type === 'background-image' &&
			Boolean(imageRef.current || previousBackgroundImageRef.current);
		if (!canvas || (!image && !canRenderBackgroundFallback)) return;
		const context = canvas.getContext('2d');
		if (context === null) return;
		const ctx = context;
		const loadedImage = imageRef.current ?? image;

		function resize() {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas) return;
			currentCanvas.width = window.innerWidth;
			currentCanvas.height = window.innerHeight;
		}

		resize();
		window.addEventListener('resize', resize);

		function frame(now: number) {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas) return;

			const currentLayer = layerRef.current;
			const deltaMs =
				lastFrameTimeRef.current === 0
					? 0
					: now - lastFrameTimeRef.current;
			const dt = Math.min(deltaMs / 1000, 0.1);
			lastFrameTimeRef.current = now;

			if (
				currentCanvas.width !== window.innerWidth ||
				currentCanvas.height !== window.innerHeight
			) {
				currentCanvas.width = window.innerWidth;
				currentCanvas.height = window.innerHeight;
			}

			const state = useWallpaperStore.getState();
			if (state.motionPaused || state.sleepModeActive) {
				rafRef.current = requestAnimationFrame(frame);
				return;
			}
			effectiveTimeRef.current += deltaMs;
			const time = effectiveTimeRef.current;
			const activeLayer = resolveActiveImageLayer(currentLayer, state);
			if (
				activeLayer.type === 'background-image' &&
				activeLayer.imageUrl &&
				currentRequestedBackgroundUrlRef.current !==
					activeLayer.imageUrl
			) {
				if (
					imageRef.current &&
					loadedImageUrlRef.current &&
					loadedImageUrlRef.current ===
						currentRequestedBackgroundUrlRef.current
				) {
					previousBackgroundImageRef.current = imageRef.current;
					previousBackgroundParamsRef.current =
						renderedBackgroundParamsRef.current;
					previousBackgroundTransitionRef.current =
						renderedBackgroundTransitionRef.current;
				}
				currentRequestedBackgroundUrlRef.current = activeLayer.imageUrl;
				transitionStartRef.current = null;
			}
			const filterActive = targetMatches(
				activeLayer,
				state.filterTargets,
				state.selectedOverlayId
			);
			const audio = getAudioSnapshot();
			const amplitude = audio.amplitude;
			const {
				imageChannelResolved,
				imageChannelValue,
				transitionChannelValue,
				rgbShiftChannelValue
			} = resolveImageCanvasAudioState(audio, state, {
				imageChannelSelection: imageChannelSelectionRef.current,
				transitionChannelSelection:
					transitionChannelSelectionRef.current,
				rgbShiftChannelSelection:
					rgbShiftChannelSelectionRef.current
			});

			smoothedMouseRef.current = smoothMouseMotion(
				smoothedMouseRef.current,
				mouseRef.current
			);
			const { parallaxX, parallaxY } = resolveParallaxOffset(
				activeLayer,
				state,
				smoothedMouseRef.current,
				currentCanvas.width,
				currentCanvas.height
			);

			const isTransitioning =
				transitionStartRef.current !== null &&
				previousBackgroundImageRef.current !== null &&
				effectiveTimeRef.current - transitionStartRef.current <
					Math.max(100, state.slideshowTransitionDuration * 1000);
			const {
				bassBoost,
				envelopeNormalized: bgEnvelopeNormalized,
				envelopeSmoothed: bgEnvelopeSmoothed,
				adaptivePeak: bgAdaptivePeak,
				adaptiveFloor: bgAdaptiveFloor
			} =
				activeLayer.type === 'background-image'
					? resolveBackgroundAudioMetrics(
							activeLayer,
							state,
							imageChannelValue,
							dt,
							backgroundEnvelopeRef.current
						)
					: {
							bassBoost: 0,
							envelopeNormalized: 0,
							envelopeSmoothed: 0,
							adaptivePeak: 0,
							adaptiveFloor: 0
						};
			const effectiveBackgroundOpacity = resolveEffectiveLayerOpacity(
				activeLayer,
				state,
				filterActive,
				isTransitioning,
				bgEnvelopeNormalized
			);

			if (activeLayer.type === 'background-image') {
				if (activeLayer.imageUrl) {
					setDebugBgAudio({
						requestChannel: state.imageAudioChannel,
						resolvedChannel: imageChannelResolved.resolvedChannel,
						channelInstant: imageChannelResolved.instantLevel,
						channelRouterSmoothed: imageChannelResolved.value,
						envelopeBoost: bassBoost,
						hasSlideshowLayer: true
					});
				} else {
					setDebugBgAudio(null);
				}
			} else {
				setDebugBgAudio(null);
			}

			if (
				state.showBackgroundScaleMeter &&
				activeLayer.type === 'background-image'
			) {
				const maxBoost = Math.max(
					0,
					activeLayer.audioReactiveConfig?.sensitivity ?? 0
				);
				publishBackgroundScaleTelemetry({
					hasSignal: Boolean(activeLayer.imageUrl),
					imageBassReactive: Boolean(
						activeLayer.audioReactiveConfig?.enabled
					),
					baseScale: state.imageScale,
					bassBoost,
					maxBoost,
					driveInstant: imageChannelValue,
					channelRouterSmoothed: imageChannelResolved.value,
					envelopeNormalized: bgEnvelopeNormalized,
					envelopeSmoothed: bgEnvelopeSmoothed,
					adaptivePeak: bgAdaptivePeak,
					adaptiveFloor: bgAdaptiveFloor
				});
			}

			const rect = loadedImage
				? getLayerRect(
						activeLayer,
						currentCanvas.width,
						currentCanvas.height,
						loadedImage,
						bassBoost,
						parallaxX,
						-parallaxY
					)
				: null;

			ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);

			const {
				brightness,
				contrast,
				saturation,
				blur,
				hue,
				colorFilter,
				rgbShiftPixels,
				scanlineAmount,
				filmNoiseAmount
			} = resolveLayerFilterMetrics({
				state,
				filterActive,
				isTransitioning,
				time,
				amplitude,
				rgbShiftChannelValue,
				canvasWidth: currentCanvas.width,
				canvasHeight: currentCanvas.height
			});

			if (activeLayer.type === 'background-image') {
				renderBackgroundFrame({
					ctx,
					layer: activeLayer,
					canvasWidth: currentCanvas.width,
					canvasHeight: currentCanvas.height,
					loadedImage:
						loadedImage &&
						loadedImageUrlRef.current === activeLayer.imageUrl
							? loadedImage
							: null,
					time,
					transitionLevel: transitionChannelValue,
					bassBoost,
					amplitude,
					parallaxX,
					parallaxY,
					brightness,
					contrast,
					saturation,
					blur,
					hue,
					colorFilter,
					filterActive,
					layerOpacity: effectiveBackgroundOpacity,
					rgbShiftPixels,
					scanlineMode: state.scanlineMode,
					scanlineIntensity: state.scanlineIntensity,
					scanlineSpacing: state.scanlineSpacing,
					scanlineThickness: state.scanlineThickness,
					filmNoiseAmount,
					previousBackgroundImageRef,
					previousBackgroundParamsRef,
					previousBackgroundTransitionRef,
					renderedBackgroundParamsRef,
					renderedBackgroundTransitionRef,
					transitionStartRef
				});
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			if (!loadedImage || !rect) {
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			renderOverlayImageLayer({
				ctx,
				layer: activeLayer,
				image: loadedImage,
				rect,
				renderBaseImage,
				filterActive,
				filterOpacity: filterActive ? state.filterOpacity : 1,
				brightness,
				contrast,
				saturation,
				blur,
				hue,
				rgbShiftPixels,
				filmNoiseAmount,
				scanlineAmount,
				scanlineSpacing: state.scanlineSpacing,
				scanlineThickness: state.scanlineThickness,
				time
			});
			rafRef.current = requestAnimationFrame(frame);
		}

		rafRef.current = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
		};
	}, [getAudioSnapshot, image, layer.type, layer.imageUrl, renderBaseImage]);

	if (!layer.enabled || !layer.imageUrl) return null;

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: layer.zIndex,
				mixBlendMode: getCanvasBlendMode(layer)
			}}
		/>
	);
}
