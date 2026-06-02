import { useEffect, useRef, type ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { readFxChannel, CAMERA_FX_CAPS } from '@/features/stageFx/stageFxConfig';

/**
 * Camera FX (Task 3) — wraps the wallpaper visual layers and drives a CSS
 * transform (smooth motion + kick shake) by mutating the element's style
 * directly inside a RAF (no per-frame React render). Only the wrapped visual
 * layers move; the HUD/editor live outside this wrapper and never shake.
 *
 * Coverage-safe: the stage takes a base scale just large enough to absorb the
 * configured max translation, and the per-frame translation is clamped to the
 * slack that scale provides — so it can never reveal frame edges or break
 * "Keep Screen Covered", regardless of settings.
 */
export default function CameraFxStage({ children }: { children: ReactNode }) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const motionTimeRef = useRef<number>(0);
	const shakeEnergyRef = useRef<number>(0);
	const cameraFxEnabled = useWallpaperStore(s => s.cameraFxEnabled);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		if (!cameraFxEnabled) {
			wrapper.style.transform = 'none';
			return;
		}

		function frame(time: number) {
			const el = wrapperRef.current;
			if (!el) return;
			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;

			const state = useWallpaperStore.getState();
			const w = window.innerWidth;
			const h = window.innerHeight;
			const minDim = Math.max(1, Math.min(w, h));

			const motionActive = state.cameraMotionMode !== 'none';
			const motionMax = motionActive
				? state.cameraMotionAmount * CAMERA_FX_CAPS.maxMotionPx
				: 0;
			const shakeMax = state.cameraShakeEnabled
				? state.cameraShakeAmount * CAMERA_FX_CAPS.maxShakePx
				: 0;

			// Base scale absorbs the worst-case translation; capped.
			const scale = Math.min(
				CAMERA_FX_CAPS.maxScale,
				Math.max(1, 1 + (motionMax + shakeMax) / minDim)
			);
			const slackX = ((scale - 1) * w) / 2;
			const slackY = ((scale - 1) * h) / 2;

			if (!state.motionPaused) motionTimeRef.current += dt;
			const t = motionTimeRef.current;

			// ── Smooth camera motion ──────────────────────────────────────
			let txMotion = 0;
			let tyMotion = 0;
			if (motionActive) {
				const level = Math.max(
					0,
					readFxChannel(getAudioSnapshot(), state.cameraShakeChannel)
				);
				const amp =
					motionMax * (1 + state.cameraMotionAudioInfluence * level);
				const p = t * state.cameraMotionSpeed;
				switch (state.cameraMotionMode) {
					case 'drift':
						txMotion = Math.sin(p) * amp;
						tyMotion = Math.cos(p * 0.7) * amp;
						break;
					case 'circle':
						txMotion = Math.cos(p) * amp;
						tyMotion = Math.sin(p) * amp;
						break;
					case 'semicircle':
						txMotion = Math.cos(p) * amp;
						tyMotion = -Math.abs(Math.sin(p)) * amp;
						break;
					case 'figure-eight':
						txMotion = Math.sin(p) * amp;
						tyMotion = Math.sin(p * 2) * amp * 0.5;
						break;
					default:
						break;
				}
			}

			// ── Kick shake (impulse + decay) ─────────────────────────────
			let txShake = 0;
			let tyShake = 0;
			if (state.cameraShakeEnabled) {
				const level = Math.max(
					0,
					readFxChannel(getAudioSnapshot(), state.cameraShakeChannel)
				);
				const thr = Math.max(
					0.01,
					Math.min(0.99, state.cameraShakeThreshold)
				);
				if (level > thr) {
					shakeEnergyRef.current = Math.max(
						shakeEnergyRef.current,
						(level - thr) / (1 - thr)
					);
				}
				// Frame-rate-independent decay toward 0 (also drains when paused).
				const decay = Math.min(0.999, Math.max(0.01, state.cameraShakeDecay));
				shakeEnergyRef.current *= Math.pow(decay, dt * 60);
				if (shakeEnergyRef.current < 0.001) shakeEnergyRef.current = 0;
				const mag = shakeEnergyRef.current * shakeMax;
				txShake = (Math.random() * 2 - 1) * mag;
				tyShake = (Math.random() * 2 - 1) * mag;
			}

			const tx = Math.max(-slackX, Math.min(slackX, txMotion + txShake));
			const ty = Math.max(-slackY, Math.min(slackY, tyMotion + tyShake));

			el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

			rafRef.current = requestAnimationFrame(frame);
		}

		lastTimeRef.current = performance.now();
		rafRef.current = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(rafRef.current);
			wrapper.style.transform = 'none';
		};
	}, [cameraFxEnabled, getAudioSnapshot]);

	return (
		<div
			ref={wrapperRef}
			style={{
				position: 'fixed',
				inset: 0,
				transformOrigin: 'center center',
				willChange: 'transform'
			}}
		>
			{children}
		</div>
	);
}
