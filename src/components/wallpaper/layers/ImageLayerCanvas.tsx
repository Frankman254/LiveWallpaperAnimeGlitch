import { useEffect, useRef, useState } from 'react';
import { createAudioChannelSelectionState } from '@/lib/audio/audioChannels';
import { useAudioData } from '@/hooks/useAudioData';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import {
	getCachedImage,
	getCanvasBlendMode,
	type BackgroundImageSnapshot,
	type BackgroundTransitionSnapshot,
	type ImageLayer
} from './imageCanvasShared';
import {
	beginBackgroundImageRequest,
	commitBackgroundImageLoad,
	createInitialBackgroundSnapshot,
	createInitialBackgroundTransitionSnapshot,
} from './imageCanvasBackgroundTransitionState';
import {
	renderImageCanvasFrame,
	syncCanvasViewport
} from './imageCanvasRuntime';

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
	const previousBackgroundParamsRef = useRef<BackgroundImageSnapshot>(
		createInitialBackgroundSnapshot(layer)
	);
	const renderedBackgroundParamsRef = useRef<BackgroundImageSnapshot>(
		createInitialBackgroundSnapshot(layer)
	);
	const previousBackgroundTransitionRef =
		useRef<BackgroundTransitionSnapshot>(
			createInitialBackgroundTransitionSnapshot(layer)
		);
	const renderedBackgroundTransitionRef =
		useRef<BackgroundTransitionSnapshot>(
			createInitialBackgroundTransitionSnapshot(layer)
		);
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
		const requestedUrl = beginBackgroundImageRequest(
			layer,
			{
				imageRef,
				loadedImageUrlRef,
				previousBackgroundImageRef,
				previousBackgroundParamsRef,
				renderedBackgroundParamsRef,
				previousBackgroundTransitionRef,
				renderedBackgroundTransitionRef,
				currentRequestedBackgroundUrlRef,
				transitionStartRef,
				effectiveTimeRef
			},
			setImage
		);
		if (!requestedUrl) return;

		const nextImage = getCachedImage(requestedUrl, loadedImage => {
			commitBackgroundImageLoad({
				layer,
				requestedUrl,
				loadedImage,
				refs: {
					imageRef,
					loadedImageUrlRef,
					previousBackgroundImageRef,
					previousBackgroundParamsRef,
					renderedBackgroundParamsRef,
					previousBackgroundTransitionRef,
					renderedBackgroundTransitionRef,
					currentRequestedBackgroundUrlRef,
					transitionStartRef,
					effectiveTimeRef
				},
				setImage
			});
		});
		if (nextImage.complete && nextImage.naturalWidth > 0) {
			commitBackgroundImageLoad({
				layer,
				requestedUrl,
				loadedImage: nextImage,
				refs: {
					imageRef,
					loadedImageUrlRef,
					previousBackgroundImageRef,
					previousBackgroundParamsRef,
					renderedBackgroundParamsRef,
					previousBackgroundTransitionRef,
					renderedBackgroundTransitionRef,
					currentRequestedBackgroundUrlRef,
					transitionStartRef,
					effectiveTimeRef
				},
				setImage
			});
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
		const runtimeRefs = {
			layerRef,
			mouseRef,
			smoothedMouseRef,
			imageRef,
			loadedImageUrlRef,
			previousBackgroundImageRef,
			previousBackgroundParamsRef,
			renderedBackgroundParamsRef,
			previousBackgroundTransitionRef,
			renderedBackgroundTransitionRef,
			currentRequestedBackgroundUrlRef,
			transitionStartRef,
			lastFrameTimeRef,
			effectiveTimeRef,
			backgroundEnvelopeRef,
			imageChannelSelectionRef,
			transitionChannelSelectionRef,
			rgbShiftChannelSelectionRef
		};

		function resize() {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas) return;
			syncCanvasViewport(currentCanvas);
		}

		resize();
		window.addEventListener('resize', resize);

		function frame(now: number) {
			const currentCanvas = canvasRef.current;
			if (!currentCanvas) return;
			syncCanvasViewport(currentCanvas);
			renderImageCanvasFrame({
				now,
				canvas: currentCanvas,
				ctx,
				loadedImage,
				renderBaseImage,
				getAudioSnapshot,
				runtimeRefs
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
