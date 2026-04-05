import { useEffect, useRef, useState } from 'react';
import {
	createAudioChannelSelectionState,
	resolveAudioChannelValue
} from '@/lib/audio/audioChannels';
import { clamp, lerp } from '@/lib/math';
import { useAudioData } from '@/hooks/useAudioData';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import { renderBackgroundFrame } from './imageCanvasBackgroundRenderer';
import {
	getScanlineAmount
} from './imageCanvasEffects';
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
			const backgroundLayer =
				currentLayer.type === 'background-image'
					? {
							...currentLayer,
							enabled: state.backgroundImageEnabled,
							imageUrl: state.imageUrl,
							scale: state.imageScale,
							positionX: state.imagePositionX,
							positionY: state.imagePositionY,
							opacity: state.imageOpacity,
							fitMode: state.imageFitMode,
							mirror: state.imageMirror,
							transitionType: state.slideshowTransitionType,
							transitionDuration:
								state.slideshowTransitionDuration,
							transitionIntensity:
								state.slideshowTransitionIntensity,
							transitionAudioDrive:
								state.slideshowTransitionAudioDrive,
							audioReactiveConfig: {
								...currentLayer.audioReactiveConfig,
								enabled: state.imageBassReactive,
								sensitivity: state.imageBassScaleIntensity,
								channel: state.imageAudioChannel
							}
						}
					: null;
			const activeLayer = backgroundLayer ?? currentLayer;
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
			const imageChannelResolved = resolveAudioChannelValue(
				audio.channels,
				state.imageAudioChannel,
				imageChannelSelectionRef.current,
				state.imageAudioSmoothingEnabled
					? state.imageAudioSmoothing
					: 0,
				state.audioAutoKickThreshold,
				state.audioAutoSwitchHoldMs,
				audio.timestampMs
			);
			const imageChannelValue = state.imageAudioSmoothingEnabled
				? imageChannelResolved.value
				: imageChannelResolved.instantLevel;
			const { instantLevel: transitionChannelValue } =
				resolveAudioChannelValue(
					audio.channels,
					state.slideshowTransitionAudioChannel,
					transitionChannelSelectionRef.current,
					0,
					state.audioAutoKickThreshold,
					state.audioAutoSwitchHoldMs,
					audio.timestampMs
				);
			const rgbShiftChannelResolved = resolveAudioChannelValue(
				audio.channels,
				state.rgbShiftAudioChannel,
				rgbShiftChannelSelectionRef.current,
				state.rgbShiftAudioSmoothingEnabled
					? state.rgbShiftAudioSmoothing
					: 0,
				state.audioAutoKickThreshold,
				state.audioAutoSwitchHoldMs,
				audio.timestampMs
			);
			const rgbShiftChannelValue = state.rgbShiftAudioSmoothingEnabled
				? rgbShiftChannelResolved.value
				: rgbShiftChannelResolved.instantLevel;

			smoothedMouseRef.current.x = lerp(
				smoothedMouseRef.current.x,
				mouseRef.current.x,
				0.05
			);
			smoothedMouseRef.current.y = lerp(
				smoothedMouseRef.current.y,
				mouseRef.current.y,
				0.05
			);

			const parallaxX =
				activeLayer.type === 'background-image'
					? smoothedMouseRef.current.x *
						state.parallaxStrength *
						currentCanvas.width *
						0.08
					: 0;
			const parallaxY =
				activeLayer.type === 'background-image'
					? smoothedMouseRef.current.y *
						state.parallaxStrength *
						currentCanvas.height *
						0.08
					: 0;

			let bassBoost = 0;
			let bgEnvelopeNormalized = 0;
			let bgEnvelopeSmoothed = 0;
			let bgAdaptivePeak = 0;
			let bgAdaptiveFloor = 0;
			if (
				activeLayer.type === 'background-image' &&
				activeLayer.audioReactiveConfig?.enabled
			) {
				const env = backgroundEnvelopeRef.current.tick(
					imageChannelValue,
					Math.max(dt, 1 / 120),
					{
						attack: state.imageBassAttack,
						release: state.imageBassRelease,
						responseSpeed: state.imageBassReactivitySpeed * 2.4,
						peakWindow: state.imageBassPeakWindow,
						peakFloor: state.imageBassPeakFloor,
						punch: state.imageBassPunch,
						scaleIntensity: state.imageBassReactiveScaleIntensity,
						min: 0,
						max: activeLayer.audioReactiveConfig.sensitivity ?? 0
					}
				);
				bassBoost = env.value;
				bgEnvelopeNormalized = env.normalizedAmplitude;
				bgEnvelopeSmoothed = env.smoothedAmplitude;
				bgAdaptivePeak = env.adaptivePeak;
				bgAdaptiveFloor = env.adaptiveFloor;
			}
			const backgroundOpacityFactor =
				activeLayer.type === 'background-image' &&
				state.imageBassReactive &&
				state.imageOpacityReactive
					? clamp(
							1 -
								state.imageOpacityReactiveAmount +
								bgEnvelopeNormalized *
									state.imageOpacityReactiveAmount,
							0.05,
							1
						)
					: 1;
			const isTransitioning =
				transitionStartRef.current !== null &&
				previousBackgroundImageRef.current !== null &&
				effectiveTimeRef.current - transitionStartRef.current <
					Math.max(100, state.slideshowTransitionDuration * 1000);
			const effectiveBackgroundOpacity =
				activeLayer.type === 'background-image'
					? activeLayer.opacity *
						(isTransitioning ? 1 : backgroundOpacityFactor) *
						(filterActive ? state.filterOpacity : 1)
					: activeLayer.opacity;

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

			const brightness = filterActive ? state.filterBrightness : 1;
			const contrast = filterActive ? state.filterContrast : 1;
			const saturation = filterActive ? state.filterSaturation : 1;
			const blur = filterActive ? state.filterBlur : 0;
			const hue = filterActive ? state.filterHueRotate : 0;
			const colorFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`;
			const rgbShiftBoost = state.rgbShiftAudioReactive
				? rgbShiftChannelValue * state.rgbShiftAudioSensitivity
				: 0;
			const rgbShiftPixels =
				filterActive && !isTransitioning
					? clamp(
							(state.rgbShift + rgbShiftBoost) *
								Math.min(
									currentCanvas.width,
									currentCanvas.height
								) *
								0.65,
							0,
							36
						)
					: 0;
			const scanlineAmount =
				filterActive && !isTransitioning
					? getScanlineAmount(
							state.scanlineMode,
							state.scanlineIntensity,
							time,
							amplitude
						)
					: 0;
			const filmNoiseAmount =
				filterActive && !isTransitioning ? state.noiseIntensity : 0;

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
