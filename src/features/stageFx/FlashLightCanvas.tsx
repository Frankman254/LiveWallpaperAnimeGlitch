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

function parseHexColor(color: string): [number, number, number] {
	const normalized = color.trim();
	const short = /^#([0-9a-f]{3})$/i.exec(normalized);
	if (short) {
		return short[1].split('').map(part => parseInt(part + part, 16)) as [
			number,
			number,
			number
		];
	}
	const long = /^#([0-9a-f]{6})$/i.exec(normalized);
	if (long) {
		const value = parseInt(long[1], 16);
		return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
	}
	return [255, 255, 255];
}

function rgba(color: string, alpha: number): string {
	const [r, g, b] = parseHexColor(color);
	return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
}

function drawEdgeFlash(
	ctx: CanvasRenderingContext2D,
	w: number,
	h: number,
	color: string,
	softness: number
) {
	const edgeDepth = Math.max(
		48,
		Math.min(
			Math.max(w, h) * 0.42,
			Math.min(w, h) * (0.16 + softness * 0.3)
		)
	);
	const hot = rgba(color, 1);
	const mid = rgba(color, 0.42 + softness * 0.26);
	const clear = rgba(color, 0);

	const top = ctx.createLinearGradient(0, 0, 0, edgeDepth);
	top.addColorStop(0, hot);
	top.addColorStop(0.24, mid);
	top.addColorStop(1, clear);
	ctx.fillStyle = top;
	ctx.fillRect(0, 0, w, edgeDepth);

	const bottom = ctx.createLinearGradient(0, h, 0, h - edgeDepth);
	bottom.addColorStop(0, hot);
	bottom.addColorStop(0.24, mid);
	bottom.addColorStop(1, clear);
	ctx.fillStyle = bottom;
	ctx.fillRect(0, h - edgeDepth, w, edgeDepth);

	const left = ctx.createLinearGradient(0, 0, edgeDepth, 0);
	left.addColorStop(0, hot);
	left.addColorStop(0.24, mid);
	left.addColorStop(1, clear);
	ctx.fillStyle = left;
	ctx.fillRect(0, 0, edgeDepth, h);

	const right = ctx.createLinearGradient(w, 0, w - edgeDepth, 0);
	right.addColorStop(0, hot);
	right.addColorStop(0.24, mid);
	right.addColorStop(1, clear);
	ctx.fillStyle = right;
	ctx.fillRect(w - edgeDepth, 0, edgeDepth, h);
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

	if (shape === 'edge-flash') {
		drawEdgeFlash(ctx, w, h, color, softness);
		return;
	}

	if (shape === 'horizontal-blast' || shape === 'vertical-blast') {
		const horizontal = shape === 'horizontal-blast';
		const gradient = horizontal
			? ctx.createLinearGradient(0, 0, 0, h)
			: ctx.createLinearGradient(0, 0, w, 0);
		gradient.addColorStop(0, rgba(color, 0));
		gradient.addColorStop(
			Math.max(0.05, 0.5 - softEdge * 0.45),
			rgba(color, 1)
		);
		gradient.addColorStop(
			Math.min(0.95, 0.5 + softEdge * 0.45),
			rgba(color, 1)
		);
		gradient.addColorStop(1, rgba(color, 0));
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
		return;
	}

	const radius =
		shape === 'circular-burst'
			? Math.min(w, h) * 0.48
			: shape === 'vignette-invert'
				? Math.hypot(w, h) * 0.5
				: Math.hypot(w, h) * 0.72;
	const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
	if (shape === 'vignette-invert') {
		const clearRadius = Math.max(0.18, 0.52 - softness * 0.3);
		gradient.addColorStop(0, rgba(color, 0));
		gradient.addColorStop(clearRadius, rgba(color, 0));
		gradient.addColorStop(
			Math.min(0.92, clearRadius + 0.22),
			rgba(color, 0.42)
		);
		gradient.addColorStop(1, rgba(color, 1));
	} else {
		gradient.addColorStop(0, rgba(color, 1));
		gradient.addColorStop(softEdge, rgba(color, 1));
		gradient.addColorStop(1, rgba(color, 0));
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
