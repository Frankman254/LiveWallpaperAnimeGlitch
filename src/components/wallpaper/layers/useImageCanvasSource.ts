import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
	getCachedImage,
	type BackgroundImageSnapshot,
	type BackgroundTransitionSnapshot,
	type ImageLayer
} from './imageCanvasShared';
import {
	beginBackgroundImageRequest,
	commitBackgroundImageLoad,
	createInitialBackgroundSnapshot,
	createInitialBackgroundTransitionSnapshot,
	type BackgroundTransitionRuntimeRefs
} from './imageCanvasBackgroundTransitionState';

type ImageCanvasSourceState = {
	image: HTMLImageElement | null;
	canRenderBackgroundFallback: boolean;
	imageRef: MutableRefObject<HTMLImageElement | null>;
	loadedImageUrlRef: MutableRefObject<string | null>;
	previousBackgroundImageRef: MutableRefObject<HTMLImageElement | null>;
	previousBackgroundParamsRef: MutableRefObject<BackgroundImageSnapshot>;
	renderedBackgroundParamsRef: MutableRefObject<BackgroundImageSnapshot>;
	previousBackgroundTransitionRef: MutableRefObject<BackgroundTransitionSnapshot>;
	renderedBackgroundTransitionRef: MutableRefObject<BackgroundTransitionSnapshot>;
	currentRequestedBackgroundUrlRef: MutableRefObject<string | null>;
	transitionStartRef: MutableRefObject<number | null>;
	backgroundTransitionRefs: BackgroundTransitionRuntimeRefs;
};

export function useImageCanvasSource(
	layer: ImageLayer,
	effectiveTimeRef: MutableRefObject<number>
): ImageCanvasSourceState {
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
	const [image, setImage] = useState<HTMLImageElement | null>(null);

	const backgroundTransitionRefs: BackgroundTransitionRuntimeRefs = {
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
	};

	useEffect(() => {
		const requestedUrl = beginBackgroundImageRequest(
			layer,
			backgroundTransitionRefs,
			setImage
		);
		if (!requestedUrl) return;

		const nextImage = getCachedImage(requestedUrl, loadedImage => {
			commitBackgroundImageLoad({
				layer,
				requestedUrl,
				loadedImage,
				refs: backgroundTransitionRefs,
				setImage
			});
		});

		if (nextImage.complete && nextImage.naturalWidth > 0) {
			commitBackgroundImageLoad({
				layer,
				requestedUrl,
				loadedImage: nextImage,
				refs: backgroundTransitionRefs,
				setImage
			});
		}
	}, [backgroundTransitionRefs, layer]);

	return {
		image,
		canRenderBackgroundFallback:
			layer.type === 'background-image' &&
			Boolean(imageRef.current || previousBackgroundImageRef.current),
		imageRef,
		loadedImageUrlRef,
		previousBackgroundImageRef,
		previousBackgroundParamsRef,
		renderedBackgroundParamsRef,
		previousBackgroundTransitionRef,
		renderedBackgroundTransitionRef,
		currentRequestedBackgroundUrlRef,
		transitionStartRef,
		backgroundTransitionRefs
	};
}
