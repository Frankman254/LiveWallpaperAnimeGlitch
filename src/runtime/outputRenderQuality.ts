import type { PerformanceMode } from '@/types/wallpaper';
import {
	resolveEffectiveDevicePixelRatio,
	useOutputPerformanceStore,
	type RecordingTargetFps
} from './outputPerformanceStore';
import {
	useRuntimeUiModeStore,
	type RuntimeUiMode
} from './runtimeUiModeStore';

export const OUTPUT_RENDER_QUALITY_EVENT = 'lwag-output-render-quality-change';

export type OutputCanvasBacking = {
	mode: RuntimeUiMode;
	cssWidth: number;
	cssHeight: number;
	backingWidth: number;
	backingHeight: number;
	renderScale: number;
	effectiveDpr: number;
};

export function resolveOutputCanvasBacking(): OutputCanvasBacking {
	const mode = useRuntimeUiModeStore.getState().mode;
	const cssWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
	const cssHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
	const renderScale =
		mode === 'recording'
			? useOutputPerformanceStore.getState().recordingRenderScale
			: 1;
	const effectiveDpr = resolveEffectiveDevicePixelRatio(mode, renderScale);
	const backingWidth =
		mode === 'recording'
			? Math.max(1, Math.round(cssWidth * renderScale))
			: cssWidth;
	const backingHeight =
		mode === 'recording'
			? Math.max(1, Math.round(cssHeight * renderScale))
			: cssHeight;

	return {
		mode,
		cssWidth,
		cssHeight,
		backingWidth,
		backingHeight,
		renderScale,
		effectiveDpr
	};
}

/** Syncs a full-viewport 2D canvas backing store to the current output quality. */
export function syncOutputCanvasBacking(canvas: HTMLCanvasElement): boolean {
	const { backingWidth, backingHeight } = resolveOutputCanvasBacking();
	if (canvas.width === backingWidth && canvas.height === backingHeight) {
		return false;
	}
	canvas.width = backingWidth;
	canvas.height = backingHeight;
	return true;
}

export function resolveSceneLayerMaxDpr(
	performanceMode: PerformanceMode,
	particleFilterActive: boolean
): number {
	const baseMax = particleFilterActive
		? performanceMode === 'high'
			? 1.15
			: 1
		: 1.5;
	const { mode, renderScale } = resolveOutputCanvasBacking();
	if (mode !== 'recording') return baseMax;
	return Math.max(0.5, baseMax * renderScale);
}

export function resolveOutputMinFrameMs(
	performanceMode: PerformanceMode
): number {
	const mode = useRuntimeUiModeStore.getState().mode;
	if (mode === 'recording') {
		const fps: RecordingTargetFps =
			useOutputPerformanceStore.getState().recordingTargetFps;
		return 1000 / fps;
	}
	return performanceMode === 'low'
		? 1000 / 30
		: performanceMode === 'medium'
			? 1000 / 45
			: 1000 / 60;
}

export function subscribeOutputRenderQuality(onChange: () => void): () => void {
	const handleChange = () => onChange();
	const unsubMode = useRuntimeUiModeStore.subscribe(handleChange);
	const unsubPerf = useOutputPerformanceStore.subscribe(handleChange);
	if (typeof window !== 'undefined') {
		window.addEventListener('resize', handleChange);
		window.addEventListener(OUTPUT_RENDER_QUALITY_EVENT, handleChange);
	}
	return () => {
		unsubMode();
		unsubPerf();
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleChange);
			window.removeEventListener(
				OUTPUT_RENDER_QUALITY_EVENT,
				handleChange
			);
		}
	};
}

export function emitOutputRenderQualityChange(): void {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new Event(OUTPUT_RENDER_QUALITY_EVENT));
}
