import { useEffect, useMemo, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getEditorThemePalette } from '@/lib/backgroundPalette';
import {
	readFxChannel,
	resolveStageLightsBudget,
	STAGE_FX_CAPS
} from '@/features/stageFx/stageFxConfig';

/**
 * Stage Lights FX (Task 2) — a lightweight 2D canvas layer of big, sweeping
 * concert-style light beams that react to kicks/peaks. Self-contained RAF like
 * `AudioLayerCanvas`; never touches particles/rain or the R3F scene. All inputs
 * are capped (beam count, blur, opacity, flash) and perf-mode aware, so it can
 * neither whiteout the screen nor run unbounded blur. Mounted only while
 * `stageLightsEnabled` is true (no idle RAF when off).
 */
export default function StageLightsCanvas({
	zIndex = 1
}: {
	zIndex?: number;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const timeRef = useRef<number>(0);
	const flashRef = useRef<number>(0);
	const beamGradientRef = useRef<{
		color: string;
		height: number;
		gradient: CanvasGradient;
	} | null>(null);
	// Stable per-beam phase offsets — allocated once, never inside the loop.
	const beamPhasesRef = useRef<Float32Array>(
		Float32Array.from({ length: STAGE_FX_CAPS.maxBeamCount }, (_, i) =>
			((i * 2.39996) % (Math.PI * 2))
		)
	);
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
			if (!state.stageLightsEnabled || state.sleepModeActive) {
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			// Freeze sweep motion when globally paused, but still draw a static
			// frame so the beams remain visible.
			if (!state.motionPaused) timeRef.current += dt;

			const w = c.width;
			const h = c.height;
			const intensity = Math.max(0, Math.min(1, state.stageLightsIntensity));
			const opacity = Math.min(
				STAGE_FX_CAPS.maxOpacity,
				Math.max(0, state.stageLightsOpacity)
			);
			const { beamCount, blurPx } = resolveStageLightsBudget(
				state.performanceMode,
				state.stageLightsBeamCount,
				state.stageLightsSoftness * STAGE_FX_CAPS.maxBeamBlurPx
			);

			const audioReactive = state.stageLightsAudioReactive;
			const level = audioReactive
				? Math.max(0, readFxChannel(getAudioSnapshot(), state.stageLightsAudioChannel))
				: 0;

			// Peak flash — brief additive burst, capped, decays fast.
			if (state.stageLightsPeakFlash && audioReactive) {
				const thr = Math.max(0.01, Math.min(0.99, state.stageLightsPeakThreshold));
				if (level > thr) {
					const over = (level - thr) / (1 - thr);
					flashRef.current = Math.min(
						STAGE_FX_CAPS.maxFlash,
						Math.max(flashRef.current, over * intensity)
					);
				}
			}
			flashRef.current = Math.max(0, flashRef.current - dt * 2.2);

			ctx.save();
			ctx.globalCompositeOperation = state.stageLightsBlendMode;

			const t = timeRef.current;
			const speed = state.stageLightsSpeed;
			const halfWidth = 0.04 + state.stageLightsBeamWidth * 0.22; // radians
			const length = h * 1.5;
			const phases = beamPhasesRef.current;
			const activePalette =
				state.stageLightsColorSource === 'theme'
					? themePaletteRef.current
					: paletteRef.current;
			const color =
				state.stageLightsColorSource === 'manual'
					? state.stageLightsColor
					: activePalette.dominant;
			let beamGradient = beamGradientRef.current;
			if (!beamGradient || beamGradient.color !== color || beamGradient.height !== h) {
				const gradient = ctx.createLinearGradient(0, -0.08 * h, 0, length);
				gradient.addColorStop(0, color);
				gradient.addColorStop(1, 'transparent');
				beamGradient = { color, height: h, gradient };
				beamGradientRef.current = beamGradient;
			}

			for (let i = 0; i < beamCount; i++) {
				const originX = ((i + 0.5) / beamCount) * w;
				const originY = -0.08 * h;
				const sweep = Math.sin(t * speed + phases[i]); // -1..1
				const aim = Math.PI / 2 + sweep * 0.6; // fan around straight-down
				const beamAlpha =
					opacity *
					intensity *
					(audioReactive ? 0.35 + level * 0.85 : 0.8);
				if (beamAlpha <= 0.002) continue;

				const lx = originX + Math.cos(aim - halfWidth) * length;
				const ly = originY + Math.sin(aim - halfWidth) * length;
				const rx = originX + Math.cos(aim + halfWidth) * length;
				const ry = originY + Math.sin(aim + halfWidth) * length;

				ctx.globalAlpha = Math.min(1, beamAlpha);
				ctx.shadowBlur = blurPx;
				ctx.shadowColor = color;
				ctx.fillStyle = beamGradient.gradient;
				ctx.beginPath();
				ctx.moveTo(originX, originY);
				ctx.lineTo(lx, ly);
				ctx.lineTo(rx, ry);
				ctx.closePath();
				ctx.fill();
			}

			if (flashRef.current > 0.001) {
				ctx.globalAlpha = flashRef.current;
				ctx.shadowBlur = 0;
				ctx.fillStyle =
					state.stageLightsColorSource === 'manual'
						? state.stageLightsColor
						: state.stageLightsColorSource === 'theme'
							? themePaletteRef.current.dominant
							: paletteRef.current.dominant;
				ctx.fillRect(0, 0, w, h);
			}

			ctx.restore();
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
