import { useEffect, useRef, type ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { readFxChannel, CAMERA_FX_CAPS } from '@/features/stageFx/stageFxConfig';

/**
 * Applies continuous camera movement and peak-triggered screen shake to visual
 * layers only. HUD/editor elements stay outside this wrapper.
 */
export default function CameraFxStage({ children }: { children: ReactNode }) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const motionTimeRef = useRef<number>(0);
	const shakeTimeRef = useRef<number>(0);
	const shakeEnergyRef = useRef<number>(0);
	const lastShakeLevelRef = useRef<number>(0);
	const snapDirectionRef = useRef<1 | -1>(1);
	const cameraMotionEnabled = useWallpaperStore(s => s.cameraMotionEnabled);
	const cameraShakeEnabled = useWallpaperStore(s => s.cameraShakeEnabled);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const cameraActive = cameraMotionEnabled || cameraShakeEnabled;

		if (!cameraActive) {
			wrapper.style.transform = 'none';
			return;
		}

		function frame(time: number) {
			const el = wrapperRef.current;
			if (!el) return;
			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
			lastTimeRef.current = time;

			const state = useWallpaperStore.getState();
			const snapshot = getAudioSnapshot();
			const w = window.innerWidth;
			const h = window.innerHeight;
			const minDim = Math.max(1, Math.min(w, h));
			const motionActive =
				state.cameraMotionEnabled && state.cameraMotionMode !== 'none';
			const motionMax = motionActive
				? state.cameraMotionAmount * CAMERA_FX_CAPS.maxMotionPx
				: 0;
			const shakeMax = state.cameraShakeEnabled
				? state.cameraShakeAmount * CAMERA_FX_CAPS.maxShakePx
				: 0;

			const scale = Math.min(
				CAMERA_FX_CAPS.maxScale,
				Math.max(1, 1 + (motionMax + shakeMax) / minDim)
			);
			const slackX = ((scale - 1) * w) / 2;
			const slackY = ((scale - 1) * h) / 2;

			if (!state.motionPaused) motionTimeRef.current += dt;
			shakeTimeRef.current += dt;
			const t = motionTimeRef.current;

			// ── Camera Motion: continuous and independent from shake ───────
			let txMotion = 0;
			let tyMotion = 0;
			if (motionActive) {
				const level = Math.max(
					0,
					readFxChannel(snapshot, state.cameraMotionAudioChannel)
				);
				const amp =
					motionMax * (1 + state.cameraMotionAudioInfluence * level);
				const direction = state.cameraMotionDirection === 'ccw' ? -1 : 1;
				const p = t * state.cameraMotionSpeed * direction;
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
					case 'orbit':
						txMotion = Math.cos(p) * amp;
						tyMotion = Math.sin(p) * amp * 0.58;
						break;
					case 'pendulum':
						txMotion = Math.sin(p) * amp;
						tyMotion = Math.abs(Math.cos(p)) * amp * 0.22;
						break;
					default:
						break;
				}
			}

			// ── Screen Shake: rising peak impulse + configurable decay ─────
			let txShake = 0;
			let tyShake = 0;
			if (state.cameraShakeEnabled) {
				const level = Math.max(
					0,
					readFxChannel(snapshot, state.cameraShakeChannel)
				);
				const threshold = Math.max(
					0.01,
					Math.min(0.99, state.cameraShakeThreshold)
				);
				if (
					snapshot.bins.length > 0 &&
					level > threshold &&
					lastShakeLevelRef.current <= threshold
				) {
					shakeEnergyRef.current = Math.max(
						shakeEnergyRef.current,
						(level - threshold) / (1 - threshold)
					);
					snapDirectionRef.current *= -1;
				}
				lastShakeLevelRef.current = level;
				if (snapshot.bins.length === 0) {
					shakeEnergyRef.current = 0;
				} else {
					const decay = Math.min(
						0.999,
						Math.max(0.01, state.cameraShakeDecay)
					);
					shakeEnergyRef.current *= Math.pow(decay, dt * 60);
				}
				if (shakeEnergyRef.current < 0.001) shakeEnergyRef.current = 0;

				const mag = shakeEnergyRef.current * shakeMax;
				const phase =
					shakeTimeRef.current *
					Math.max(1, state.cameraShakeFrequency) *
					Math.PI *
					2;
				const roughness = Math.max(
					0,
					Math.min(1, state.cameraShakeRoughness)
				);
				const wave = Math.sin(phase);
				const noiseX = (Math.random() * 2 - 1) * roughness;
				const noiseY = (Math.random() * 2 - 1) * roughness;
				switch (state.cameraShakeMode) {
					case 'horizontal':
						txShake = (wave * (1 - roughness) + noiseX) * mag;
						break;
					case 'vertical':
						tyShake = (wave * (1 - roughness) + noiseY) * mag;
						break;
					case 'punch':
						tyShake = -Math.abs(wave) * mag;
						break;
					case 'jitter':
						txShake = noiseX * mag;
						tyShake = noiseY * mag;
						break;
					case 'kick-snap':
						txShake = snapDirectionRef.current * mag;
						tyShake = -mag * 0.24;
						break;
					default:
						txShake = (wave * (1 - roughness) + noiseX) * mag;
						tyShake =
							(Math.cos(phase * 1.17) * (1 - roughness) + noiseY) *
							mag;
						break;
				}
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
	}, [cameraMotionEnabled, cameraShakeEnabled, getAudioSnapshot]);

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
