import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { BackgroundPalette } from '@/lib/backgroundPalette';
import type { OverlayLayer } from '@/types/layers';
import type { LogoLayer, SpectrumLayer, TrackTitleLayer } from '@/types/layers';
import type { WallpaperState } from '@/types/wallpaper';
import { getOverlayLayerById } from '@/lib/layers';
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry';
import {
	drawFilmNoise,
	drawRgbShift,
	drawScanlines,
	getScanlineAmount
} from '@/components/wallpaper/layers/imageCanvasEffects';

export type RenderableAudioLayer = LogoLayer | SpectrumLayer | TrackTitleLayer;

export type AudioLayerFrameRenderState = {
	postProcessCanvas: HTMLCanvasElement | null;
};

export type AudioLayerFrameRenderInput = {
	ctx: CanvasRenderingContext2D;
	canvas: HTMLCanvasElement;
	layer: RenderableAudioLayer;
	state: WallpaperState;
	audio: AudioSnapshot;
	dt: number;
	timeMs: number;
	palette: BackgroundPalette;
	trackTitle: string;
	trackCurrentTime: number;
	trackDuration: number;
	frameState: AudioLayerFrameRenderState;
};

function isRenderableAudioLayer(
	layer: OverlayLayer | null
): layer is RenderableAudioLayer {
	return (
		layer?.type === 'logo' ||
		layer?.type === 'spectrum' ||
		layer?.type === 'track-title'
	);
}

function isFilterTargetActive(
	layer: RenderableAudioLayer,
	filterTargets: string[]
): boolean {
	return (
		(layer.type === 'logo' && filterTargets.includes('logo')) ||
		(layer.type === 'spectrum' && filterTargets.includes('spectrum'))
	);
}

function ensurePostProcessCanvas(
	existing: HTMLCanvasElement | null,
	width: number,
	height: number
): HTMLCanvasElement {
	const snapshotCanvas = existing ?? document.createElement('canvas');
	if (snapshotCanvas.width !== width) snapshotCanvas.width = width;
	if (snapshotCanvas.height !== height) snapshotCanvas.height = height;
	return snapshotCanvas;
}

export function createAudioLayerFrameRenderState(): AudioLayerFrameRenderState {
	return { postProcessCanvas: null };
}

export function renderAudioLayerFrame(
	input: AudioLayerFrameRenderInput
): boolean {
	const nextLayer = getOverlayLayerById(input.state, input.layer.id);
	if (!isRenderableAudioLayer(nextLayer) || !nextLayer.enabled) {
		return false;
	}

	const drawContext = {
		canvas: input.canvas,
		state: input.state,
		audio: input.audio,
		dt: input.dt,
		palette: input.palette,
		trackTitle: input.trackTitle,
		trackCurrentTime: input.trackCurrentTime,
		trackDuration: input.trackDuration
	};
	const filterActive = isFilterTargetActive(
		nextLayer,
		input.state.filterTargets
	);

	if (!filterActive) {
		drawOverlayLayer(nextLayer, {
			ctx: input.ctx,
			...drawContext
		});
		return true;
	}

	const snapshotCanvas = ensurePostProcessCanvas(
		input.frameState.postProcessCanvas,
		input.canvas.width,
		input.canvas.height
	);
	input.frameState.postProcessCanvas = snapshotCanvas;
	const snapshotCtx = snapshotCanvas.getContext('2d');
	if (!snapshotCtx) {
		drawOverlayLayer(nextLayer, {
			ctx: input.ctx,
			...drawContext
		});
		return true;
	}

	snapshotCtx.clearRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
	drawOverlayLayer(nextLayer, {
		ctx: snapshotCtx,
		...drawContext
	});

	input.ctx.save();
	input.ctx.globalAlpha = Math.max(0, Math.min(1, input.state.filterOpacity));
	input.ctx.filter = `brightness(${input.state.filterBrightness}) contrast(${input.state.filterContrast}) saturate(${input.state.filterSaturation}) blur(${input.state.filterBlur}px) hue-rotate(${input.state.filterHueRotate}deg)`;
	input.ctx.drawImage(snapshotCanvas, 0, 0);
	input.ctx.filter = 'none';
	const scanlineAmount = getScanlineAmount(
		input.state.scanlineMode,
		input.state.scanlineIntensity,
		input.timeMs,
		input.audio.amplitude
	);
	input.ctx.globalCompositeOperation = 'source-atop';
	if (input.state.rgbShift > 0.0001) {
		input.ctx.save();
		input.ctx.translate(input.canvas.width / 2, input.canvas.height / 2);
		drawRgbShift(
			input.ctx,
			snapshotCanvas,
			input.canvas.width,
			input.canvas.height,
			input.state.rgbShift *
				Math.min(input.canvas.width, input.canvas.height) *
				0.65,
			'brightness(1) contrast(1) saturate(1) hue-rotate(0deg)',
			input.timeMs,
			input.state.filterOpacity
		);
		input.ctx.restore();
	}
	input.ctx.save();
	input.ctx.translate(input.canvas.width / 2, input.canvas.height / 2);
	drawFilmNoise(
		input.ctx,
		input.canvas.width,
		input.canvas.height,
		input.state.noiseIntensity,
		input.timeMs,
		input.state.filterOpacity
	);
	drawScanlines(
		input.ctx,
		input.canvas.width,
		input.canvas.height,
		scanlineAmount,
		input.state.scanlineSpacing,
		input.state.scanlineThickness,
		input.state.filterOpacity
	);
	input.ctx.restore();
	input.ctx.restore();
	return true;
}
