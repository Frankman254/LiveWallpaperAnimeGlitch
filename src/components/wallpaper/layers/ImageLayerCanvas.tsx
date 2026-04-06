import { useEffect, useRef } from 'react';
import { createAudioChannelSelectionState } from '@/lib/audio/audioChannels';
import { useAudioData } from '@/hooks/useAudioData';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import { getCanvasBlendMode, type ImageLayer } from './imageCanvasShared';
import {
	type ImageCanvasRuntimeRefs,
	renderImageCanvasFrame,
	syncCanvasViewport
} from './imageCanvasRuntime';
import { useImageCanvasSource } from './useImageCanvasSource';

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
	const {
		image,
		canRenderBackgroundFallback,
		imageRef,
		loadedImageUrlRef,
		backgroundTransitionRefs
	} = useImageCanvasSource(layer, effectiveTimeRef);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		layerRef.current = layer;
	}, [layer]);

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
		if (!canvas || (!image && !canRenderBackgroundFallback)) return;
		const context = canvas.getContext('2d');
		if (context === null) return;
		const ctx = context;
		const loadedImage = imageRef.current ?? image;
		const runtimeRefs: ImageCanvasRuntimeRefs = {
			layerRef,
			mouseRef,
			smoothedMouseRef,
			...backgroundTransitionRefs,
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
