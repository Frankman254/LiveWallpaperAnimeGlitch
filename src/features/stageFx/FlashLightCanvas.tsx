import { useEffect, useMemo, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getEditorThemePalette } from '@/lib/backgroundPalette';
import {
	readFxChannel,
	resolveFxThreshold,
	shouldTriggerFxPeak,
	STAGE_FX_CAPS,
	type FlashLightShape
} from '@/features/stageFx/stageFxConfig';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function drawFlashShape(
	ctx: CanvasRenderingContext2D,
	shape: FlashLightShape,
	w: number,
	h: number,
	color: string,
	softness: number
) {
	const cx = w / 2;
	const cy = h / 2;
	const softEdge = Math.max(0.05, Math.min(0.92, 1 - softness * 0.72));
	if (shape === 'full-screen') {
		ctx.fillStyle = color;
		ctx.fillRect(0, 0, w, h);
		return;
	}

	if (shape === 'horizontal-blast' || shape === 'vertical-blast') {
		const horizontal = shape === 'horizontal-blast';
		const gradient = horizontal
			? ctx.createLinearGradient(0, 0, 0, h)
			: ctx.createLinearGradient(0, 0, w, 0);
		gradient.addColorStop(0, 'transparent');
		gradient.addColorStop(Math.max(0.05, 0.5 - softEdge * 0.45), color);
		gradient.addColorStop(Math.min(0.95, 0.5 + softEdge * 0.45), color);
		gradient.addColorStop(1, 'transparent');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
		return;
	}

	const radius =
		shape === 'circular-burst'
			? Math.min(w, h) * 0.48
			: Math.hypot(w, h) * 0.72;
	const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
	if (shape === 'edge-flash' || shape === 'vignette-invert') {
		gradient.addColorStop(0, 'transparent');
		gradient.addColorStop(softEdge, 'transparent');
		gradient.addColorStop(1, color);
	} else {
		gradient.addColorStop(0, color);
		gradient.addColorStop(softEdge, color);
		gradient.addColorStop(1, 'transparent');
	}
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, w, h);
}

type FlashShapeCache = {
	canvas: HTMLCanvasElement;
	shape: FlashLightShape;
	width: number;
	height: number;
	color: string;
	softness: number;
};

function getFlashShapeCanvas(
	cache: FlashShapeCache | null,
	shape: FlashLightShape,
	width: number,
	height: number,
	color: string,
	softness: number
): FlashShapeCache {
	if (
		cache &&
		cache.shape === shape &&
		cache.width === width &&
		cache.height === height &&
		cache.color === color &&
		cache.softness === softness
	) {
		return cache;
	}

	const buffer = cache?.canvas ?? document.createElement('canvas');
	buffer.width = width;
	buffer.height = height;
	const bufferCtx = buffer.getContext('2d');
	if (bufferCtx) {
		bufferCtx.clearRect(0, 0, width, height);
		drawFlashShape(bufferCtx, shape, width, height, color, softness);
	}
	return { canvas: buffer, shape, width, height, color, softness };
}

/** Audio-peak impact overlay, independent from the moving Stage Lights beams. */
export default function FlashLightCanvas({ zIndex = 90 }: { zIndex?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const flashRef = useRef<number>(0);
	const lastLevelRef = useRef<number>(0);
	const lastTriggerMsRef = useRef<number>(-Infinity);
	const shapeCacheRef = useRef<FlashShapeCache | null>(null);
	const palette = useBackgroundPalette();
	const paletteRef = useRef(palette);
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const themePalette = useMemo(
		() => getEditorThemePalette(editorTheme),
		[editorTheme]
	);
	const themePaletteRef = useRef(themePalette);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		paletteRef.current = palette;
	}, [palette]);

	useEffect(() => {
		themePaletteRef.current = themePalette;
	}, [themePalette]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		function resize() {
			const c = canvasRef.current;
			if (!c) return;
			c.width = window.innerWidth;
			c.height = window.innerHeight;
		}
		resize();
		window.addEventListener('resize', resize);

		function frame(time: number) {
			const c = canvasRef.current;
			if (!c || !ctx) return;
			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;
			const state = useWallpaperStore.getState();
			ctx.clearRect(0, 0, c.width, c.height);

			if (!state.flashLightEnabled || state.sleepModeActive) {
				flashRef.current = 0;
				lastLevelRef.current = 0;
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			const snapshot = getAudioSnapshot();
			const level = Math.max(
				0,
				readFxChannel(snapshot, state.flashLightAudioChannel)
			);
			const threshold = resolveFxThreshold(
				state.flashLightBandThresholds,
				state.flashLightAudioChannel,
				state.flashLightThreshold
			);
			if (
				snapshot.bins.length > 0 &&
				shouldTriggerFxPeak({
					level,
					previousLevel: lastLevelRef.current,
					threshold,
					nowMs: time,
					lastTriggerMs: lastTriggerMsRef.current,
					retriggerMs: Math.max(35, state.flashLightRetriggerMs)
				})
			) {
				const peak = clamp01(
					((level - threshold) / (1 - threshold)) *
						state.flashLightSensitivity
				);
				flashRef.current = Math.min(
					STAGE_FX_CAPS.maxFlashOpacity,
					Math.max(flashRef.current, peak * state.flashLightIntensity)
				);
				lastTriggerMsRef.current = time;
			}
			lastLevelRef.current = level;
			flashRef.current = Math.max(
				0,
				flashRef.current - dt * Math.max(0.1, state.flashLightDecay)
			);

			if (flashRef.current > 0.001) {
				const activePalette =
					state.flashLightColorSource === 'theme'
						? themePaletteRef.current
						: paletteRef.current;
				const color =
					state.flashLightColorSource === 'manual'
						? state.flashLightColor
						: activePalette.dominant;
				ctx.save();
				ctx.globalCompositeOperation = state.flashLightBlendMode;
				ctx.globalAlpha = Math.min(
					STAGE_FX_CAPS.maxFlashOpacity,
					flashRef.current * Math.max(0, state.flashLightBrightness)
				);
				ctx.shadowBlur =
					clamp01(state.flashLightSoftness) *
					STAGE_FX_CAPS.maxFlashBlurPx;
				ctx.shadowColor = color;
				shapeCacheRef.current = getFlashShapeCanvas(
					shapeCacheRef.current,
					state.flashLightShape,
					c.width,
					c.height,
					color,
					clamp01(state.flashLightSoftness)
				);
				ctx.drawImage(shapeCacheRef.current.canvas, 0, 0);
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
	}, [getAudioSnapshot]);

	return (
		<canvas
			ref={canvasRef}
			data-camera-motion-layer="flash-light"
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex
			}}
		/>
	);
}
