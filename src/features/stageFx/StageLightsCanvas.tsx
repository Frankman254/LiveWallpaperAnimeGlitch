import { useEffect, useMemo, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { getEditorThemePalette } from '@/lib/backgroundPalette';
import {
	readFxChannel,
	resolveFxThreshold,
	resolveStageLightsBudget,
	updateStageLightsDiag,
	STAGE_FX_CAPS,
	type StageLightsOrigin
} from '@/features/stageFx/stageFxConfig';
import {
	resolveOutputMinFrameMs,
	syncOutputCanvasBacking,
	subscribeOutputRenderQuality
} from '@/runtime/outputRenderQuality';

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

/**
 * Directional concert beams only. Flash impacts live in `FlashLightCanvas` so
 * both layers can be tuned, disabled, and rendered independently.
 */
export default function StageLightsCanvas({ zIndex = 1 }: { zIndex?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const lastDrawTimeRef = useRef<number>(0);
	const timeRef = useRef<number>(0);
	const audioEnergyRef = useRef<number>(0);
	const lastAudioPeakMsRef = useRef<number>(-Infinity);
	// Tracks whether we drew anything last frame — used to avoid redundant
	// clearRect calls on every idle frame when the effect is off.
	const wasVisibleRef = useRef<boolean>(false);
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
			syncOutputCanvasBacking(c);
		}
		resize();
		const unsubQuality = subscribeOutputRenderQuality(resize);
		window.addEventListener('resize', resize);

		function frame(time: number) {
			const c = canvasRef.current;
			if (!c || !ctx) return;
			const state = useWallpaperStore.getState();
			const quality = state.performanceMode;
			const minFrameMs = resolveOutputMinFrameMs(quality);
			if (time - lastDrawTimeRef.current < minFrameMs) {
				rafRef.current = requestAnimationFrame(frame);
				return;
			}
			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;
			lastDrawTimeRef.current = time;

			// Skip entirely when disabled — only clear once on the transition frame.
			if (!state.stageLightsEnabled || state.sleepModeActive) {
				if (wasVisibleRef.current) {
					ctx.clearRect(0, 0, c.width, c.height);
					wasVisibleRef.current = false;
				}
				updateStageLightsDiag(false, 0, 0, quality);
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
			const rawResponse =
				state.stageLightsAudioReactive && level > threshold
					? clamp01(
							((level - threshold) /
								Math.max(0.01, 1 - threshold)) *
								state.stageLightsAudioAmount
						)
					: 0;
			if (rawResponse > audioEnergyRef.current) {
				audioEnergyRef.current = rawResponse;
				lastAudioPeakMsRef.current = time;
			} else if (
				time - lastAudioPeakMsRef.current >
				Math.max(0, state.stageLightsAudioHoldMs)
			) {
				const decay = Math.max(
					0.01,
					Math.min(0.995, state.stageLightsAudioDecay)
				);
				audioEnergyRef.current *= Math.pow(decay, dt * 60);
			}
			if (!state.stageLightsAudioReactive) {
				audioEnergyRef.current = 0;
			} else if (audioEnergyRef.current < 0.001) {
				audioEnergyRef.current = 0;
			}
			const response = state.stageLightsAudioReactive
				? audioEnergyRef.current
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
			const {
				minBeamCount,
				maxBeamCount,
				blurPx,
				drawHaze,
				drawCore,
				drawFlare
			} = resolveStageLightsBudget(
				quality,
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
			const beamLengthRatio = Math.max(
				0.15,
				Math.min(1.35, state.stageLightsBeamLength)
			);
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

			// Skip the whole draw pass when the layer would be invisible.
			// Only clear canvas on the transition frame (was visible → now invisible).
			if (beamAlpha < 0.002) {
				if (wasVisibleRef.current) {
					ctx.clearRect(0, 0, c.width, c.height);
					wasVisibleRef.current = false;
				}
				updateStageLightsDiag(false, 0, 0, quality);
				rafRef.current = requestAnimationFrame(frame);
				return;
			}

			// Parse color once per frame — not inside each gradient stop (~10× per beam).
			const [cr, cg, cb] = parseHexColor(color);
			const rgbaFast = (alpha: number) =>
				`rgba(${cr}, ${cg}, ${cb}, ${clamp01(alpha)})`;

			// Blur scale for the haze and (when active) core/flare passes.
			const hazeBlurScale = quality === 'high' ? 1.3 : 0.8;
			const coreBlurScale = 0.55;
			const flareBlurScale = quality === 'high' ? 0.45 : 0.3;

			// Clear exactly once per draw frame — not while idle.
			ctx.clearRect(0, 0, c.width, c.height);
			wasVisibleRef.current = true;

			ctx.save();
			ctx.globalCompositeOperation = state.stageLightsBlendMode;
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
				const centerDistance = Math.hypot(
					w / 2 - originX,
					h / 2 - originY
				);
				const length = centerDistance * beamLengthRatio;

				const lx = originX + Math.cos(aim - halfWidth) * length;
				const ly = originY + Math.sin(aim - halfWidth) * length;
				const rx = originX + Math.cos(aim + halfWidth) * length;
				const ry = originY + Math.sin(aim + halfWidth) * length;
				const endX = originX + Math.cos(aim) * length;
				const endY = originY + Math.sin(aim) * length;

				// ── Pass 1: main beam triangle ────────────────────────────────
				const mainGradient = ctx.createLinearGradient(
					originX,
					originY,
					endX,
					endY
				);
				mainGradient.addColorStop(0, rgbaFast(0.78));
				mainGradient.addColorStop(0.18, rgbaFast(0.42));
				mainGradient.addColorStop(0.72, rgbaFast(0.16));
				mainGradient.addColorStop(1, rgbaFast(0));

				ctx.globalAlpha = Math.min(1, beamAlpha);
				ctx.shadowBlur = blurPx;
				ctx.fillStyle = mainGradient;
				ctx.beginPath();
				ctx.moveTo(originX, originY);
				ctx.lineTo(lx, ly);
				ctx.lineTo(rx, ry);
				ctx.closePath();
				ctx.fill();

				// ── Pass 2: haze (medium + high only) ────────────────────────
				if (drawHaze) {
					const hazeWidth = halfWidth * 1.65;
					const hlx = originX + Math.cos(aim - hazeWidth) * length;
					const hly = originY + Math.sin(aim - hazeWidth) * length;
					const hrx = originX + Math.cos(aim + hazeWidth) * length;
					const hry = originY + Math.sin(aim + hazeWidth) * length;
					ctx.globalAlpha = Math.min(1, beamAlpha * 0.34);
					ctx.shadowBlur = blurPx * hazeBlurScale;
					ctx.fillStyle = mainGradient;
					ctx.beginPath();
					ctx.moveTo(originX, originY);
					ctx.lineTo(hlx, hly);
					ctx.lineTo(hrx, hry);
					ctx.closePath();
					ctx.fill();
				}

				// ── Pass 3: core stroke (medium + high only) ─────────────────
				if (drawCore) {
					const coreWidth =
						8 + clamp01(state.stageLightsBeamWidth) * 32;
					const coreGradient = ctx.createLinearGradient(
						originX,
						originY,
						endX,
						endY
					);
					coreGradient.addColorStop(0, rgbaFast(0.95));
					coreGradient.addColorStop(0.4, rgbaFast(0.42));
					coreGradient.addColorStop(1, rgbaFast(0));
					ctx.globalAlpha = Math.min(1, beamAlpha * 0.72);
					ctx.shadowBlur = blurPx * coreBlurScale;
					ctx.strokeStyle = coreGradient;
					ctx.lineWidth = coreWidth;
					ctx.lineCap = 'round';
					ctx.beginPath();
					ctx.moveTo(originX, originY);
					ctx.lineTo(endX, endY);
					ctx.stroke();
				}

				// ── Pass 4: flare radial burst (high only) ───────────────────
				if (drawFlare) {
					const flareRadius =
						22 +
						clamp01(state.stageLightsBeamWidth) * 54 +
						response * 18;
					const flare = ctx.createRadialGradient(
						originX,
						originY,
						0,
						originX,
						originY,
						flareRadius
					);
					flare.addColorStop(0, rgbaFast(0.72));
					flare.addColorStop(0.45, rgbaFast(0.22));
					flare.addColorStop(1, rgbaFast(0));
					ctx.globalAlpha = Math.min(1, beamAlpha);
					ctx.shadowBlur = blurPx * flareBlurScale;
					ctx.fillStyle = flare;
					ctx.beginPath();
					ctx.arc(originX, originY, flareRadius, 0, Math.PI * 2);
					ctx.fill();
				}
			}

			const passes =
				1 +
				(drawHaze ? 1 : 0) +
				(drawCore ? 1 : 0) +
				(drawFlare ? 1 : 0);
			updateStageLightsDiag(true, beamCount, passes, quality);

			ctx.restore();
			rafRef.current = requestAnimationFrame(frame);
		}

		rafRef.current = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener('resize', resize);
			unsubQuality();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		};
	}, [getAudioSnapshot]);

	return (
		<canvas
			ref={canvasRef}
			data-camera-motion-layer="stage-lights"
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
