import { useEffect, useMemo, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getEditorThemePalette } from '@/lib/backgroundPalette';
import {
	readFxChannel,
	resolveFxThreshold,
	resolveStageLightsBudget,
	STAGE_FX_CAPS,
	type StageLightsOrigin
} from '@/features/stageFx/stageFxConfig';

type BeamEdge = 'top' | 'bottom' | 'left' | 'right';

function resolveBeamEdge(origin: StageLightsOrigin, index: number): BeamEdge {
	switch (origin) {
		case 'bottom':
		case 'left':
		case 'right':
			return origin;
		case 'top-bottom':
			return index % 2 === 0 ? 'top' : 'bottom';
		case 'sides':
			return index % 2 === 0 ? 'left' : 'right';
		case 'all':
			return (['top', 'right', 'bottom', 'left'] as const)[index % 4];
		default:
			return 'top';
	}
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/**
 * Directional concert beams only. Flash impacts live in `FlashLightCanvas` so
 * both layers can be tuned, disabled, and rendered independently.
 */
export default function StageLightsCanvas({ zIndex = 1 }: { zIndex?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const timeRef = useRef<number>(0);
	const beamPhasesRef = useRef<Float32Array>(
		Float32Array.from(
			{ length: STAGE_FX_CAPS.maxBeamCount },
			(_, i) => (i * 2.39996) % (Math.PI * 2)
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

			const level = state.stageLightsAudioReactive
				? Math.max(
						0,
						readFxChannel(
							getAudioSnapshot(),
							state.stageLightsAudioChannel
						)
					)
				: 0;
			const threshold = resolveFxThreshold(
				state.stageLightsBandThresholds,
				state.stageLightsAudioChannel,
				state.stageLightsPeakThreshold
			);
			const response =
				state.stageLightsAudioReactive && level > threshold
					? clamp01(
							((level - threshold) /
								Math.max(0.01, 1 - threshold)) *
								state.stageLightsAudioAmount
						)
					: 0;
			const motionRate =
				(state.stageLightsFixedMotion ? 1 : 0) +
				(state.stageLightsAudioReactive
					? response * state.stageLightsAudioAmount
					: 0);
			if (!state.motionPaused) {
				timeRef.current += dt * motionRate;
			}

			const w = c.width;
			const h = c.height;
			const intensity = Math.max(
				0,
				Math.min(2, state.stageLightsIntensity)
			);
			const opacity = Math.min(
				STAGE_FX_CAPS.maxOpacity,
				Math.max(0, state.stageLightsOpacity)
			);
			const { minBeamCount, maxBeamCount, blurPx } =
				resolveStageLightsBudget(
					state.performanceMode,
					state.stageLightsMinBeamCount,
					state.stageLightsMaxBeamCount,
					state.stageLightsSoftness * STAGE_FX_CAPS.maxBeamBlurPx
				);
			const beamCount = Math.max(
				minBeamCount,
				Math.min(
					maxBeamCount,
					Math.round(
						minBeamCount + (maxBeamCount - minBeamCount) * response
					)
				)
			);
			const activePalette =
				state.stageLightsColorSource === 'theme'
					? themePaletteRef.current
					: paletteRef.current;
			const color =
				state.stageLightsColorSource === 'manual'
					? state.stageLightsColor
					: activePalette.dominant;
			const halfWidth = 0.04 + clamp01(state.stageLightsBeamWidth) * 0.22;
			const length = Math.hypot(w, h) * 1.35;
			const direction = state.stageLightsInvertDirection ? -1 : 1;
			const phases = beamPhasesRef.current;
			const t = timeRef.current * state.stageLightsSpeed * direction;
			const audioOscillation =
				1 +
				response *
					Math.max(
						0,
						Math.min(2, state.stageLightsAudioOscillationAmount)
					);
			const beamAlpha =
				opacity *
				intensity *
				(state.stageLightsAudioReactive
					? state.stageLightsAudioGateEnabled
						? response
						: 0.14 + response * 0.86
					: 0.8);

			ctx.save();
			ctx.globalCompositeOperation = state.stageLightsBlendMode;
			ctx.fillStyle = color;
			ctx.shadowBlur = blurPx;
			ctx.shadowColor = color;

			for (let i = 0; i < beamCount; i += 1) {
				const edge = resolveBeamEdge(state.stageLightsOrigin, i);
				const edgeRatio = (i + 0.5) / beamCount;
				let originX = edgeRatio * w;
				let originY = -0.06 * h;
				if (edge === 'bottom') {
					originY = 1.06 * h;
				} else if (edge === 'left') {
					originX = -0.06 * w;
					originY = edgeRatio * h;
				} else if (edge === 'right') {
					originX = 1.06 * w;
					originY = edgeRatio * h;
				}

				const centerAim = Math.atan2(h / 2 - originY, w / 2 - originX);
				const mirroredDirection =
					state.stageLightsMirrorDirections && i % 2 === 1 ? -1 : 1;
				const sweep = Math.sin(t + phases[i]) * mirroredDirection;
				let sweepOffset = sweep * 0.34;
				switch (state.stageLightsMovementMode) {
					case 'top-down':
						sweepOffset = sweep * 0.34;
						break;
					case 'bottom-up':
						sweepOffset = -sweep * 0.34;
						break;
					case 'left-right':
						sweepOffset = sweep * 0.5;
						break;
					case 'right-left':
						sweepOffset = -sweep * 0.5;
						break;
					case 'cross-sweep':
						sweepOffset = sweep * 0.72;
						break;
					case 'radial-sweep':
						sweepOffset = sweep * 0.9;
						break;
					case 'circular-sweep':
						sweepOffset =
							(Math.sin(t + phases[i]) * 0.64 +
								Math.sin(t * 0.55 + phases[i] * 0.35) * 0.18) *
							mirroredDirection;
						break;
					default:
						break;
				}
				const aim =
					centerAim +
					Math.max(
						-1.05,
						Math.min(1.05, sweepOffset * audioOscillation)
					);

				const lx = originX + Math.cos(aim - halfWidth) * length;
				const ly = originY + Math.sin(aim - halfWidth) * length;
				const rx = originX + Math.cos(aim + halfWidth) * length;
				const ry = originY + Math.sin(aim + halfWidth) * length;

				ctx.globalAlpha = Math.min(1, beamAlpha);
				ctx.beginPath();
				ctx.moveTo(originX, originY);
				ctx.lineTo(lx, ly);
				ctx.lineTo(rx, ry);
				ctx.closePath();
				ctx.fill();
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
			data-camera-motion-layer="other"
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
