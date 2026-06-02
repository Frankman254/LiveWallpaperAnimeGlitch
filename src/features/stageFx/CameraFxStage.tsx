import { useEffect, useRef, type ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import {
	cameraMotionTargetIncludes,
	CAMERA_FX_CAPS,
	readFxChannel,
	resolveFxThreshold,
	shouldTriggerFxPeak,
	type CameraMotionLayer
} from '@/features/stageFx/stageFxConfig';

function clamp(value: number, limit: number): number {
	return Math.max(-limit, Math.min(limit, value));
}

function clearMotionTargets(targets: HTMLElement[]) {
	for (const target of targets) {
		target.style.transform = 'none';
		target.style.transformOrigin = '';
		target.style.willChange = '';
	}
}

/**
 * Screen Shake is applied to the complete visual stage. Camera Motion is
 * applied to marked visual roots so it can target BG, spectrum, or both while
 * preserving the original z-index ordering. HUD/editor elements remain fixed.
 */
export default function CameraFxStage({ children }: { children: ReactNode }) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const motionTargetsRef = useRef<HTMLElement[]>([]);
	const rafRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const motionTimeRef = useRef<number>(0);
	const shakeTimeRef = useRef<number>(0);
	const shakeEnergyRef = useRef<number>(0);
	const lastShakeLevelRef = useRef<number>(0);
	const lastShakeTriggerMsRef = useRef<number>(-Infinity);
	const snapDirectionRef = useRef<1 | -1>(1);
	const cameraMotionEnabled = useWallpaperStore(s => s.cameraMotionEnabled);
	const cameraShakeEnabled = useWallpaperStore(s => s.cameraShakeEnabled);
	const { getAudioSnapshot } = useAudioData();

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const refreshMotionTargets = () => {
			motionTargetsRef.current = Array.from(
				wrapper.querySelectorAll<HTMLElement>(
					'[data-camera-motion-layer]'
				)
			);
		};
		refreshMotionTargets();
		const observer = new MutationObserver(refreshMotionTargets);
		observer.observe(wrapper, { childList: true, subtree: true });

		const cameraActive = cameraMotionEnabled || cameraShakeEnabled;
		if (!cameraActive) {
			wrapper.style.transform = 'none';
			clearMotionTargets(motionTargetsRef.current);
			return () => observer.disconnect();
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
				? Math.min(1.5, Math.max(0, state.cameraMotionAmount)) *
					CAMERA_FX_CAPS.maxMotionPx
				: 0;
			const shakeMax = state.cameraShakeEnabled
				? Math.min(2, Math.max(0, state.cameraShakeAmount)) *
					CAMERA_FX_CAPS.maxShakePx
				: 0;
			const motionScale = Math.min(
				CAMERA_FX_CAPS.maxScale,
				Math.max(1, 1 + motionMax / minDim)
			);
			const shakeScale = Math.min(
				CAMERA_FX_CAPS.maxScale,
				Math.max(1, 1 + shakeMax / minDim)
			);
			const motionSlackX = ((motionScale - 1) * w) / 2;
			const motionSlackY = ((motionScale - 1) * h) / 2;
			const shakeSlackX = ((shakeScale - 1) * w) / 2;
			const shakeSlackY = ((shakeScale - 1) * h) / 2;

			if (!state.motionPaused) motionTimeRef.current += dt;
			shakeTimeRef.current += dt;
			const t = motionTimeRef.current;

			let txMotion = 0;
			let tyMotion = 0;
			if (motionActive) {
				const level = Math.max(
					0,
					readFxChannel(snapshot, state.cameraMotionAudioChannel)
				);
				const amp =
					motionMax *
					(1 + Math.max(0, state.cameraMotionAudioInfluence) * level);
				const direction =
					state.cameraMotionDirection === 'ccw' ? -1 : 1;
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
			txMotion = clamp(txMotion, motionSlackX);
			tyMotion = clamp(tyMotion, motionSlackY);
			const motionTransform = `translate3d(${txMotion.toFixed(2)}px, ${tyMotion.toFixed(2)}px, 0) scale(${motionScale.toFixed(4)})`;
			for (const target of motionTargetsRef.current) {
				const layer = target.dataset.cameraMotionLayer as
					| CameraMotionLayer
					| undefined;
				const applies =
					motionActive &&
					layer !== undefined &&
					cameraMotionTargetIncludes(state.cameraMotionTarget, layer);
				target.style.transform = applies ? motionTransform : 'none';
				target.style.transformOrigin = applies ? 'center center' : '';
				target.style.willChange = applies ? 'transform' : '';
			}

			let txShake = 0;
			let tyShake = 0;
			if (state.cameraShakeEnabled) {
				const level = Math.max(
					0,
					readFxChannel(snapshot, state.cameraShakeChannel)
				);
				const threshold = resolveFxThreshold(
					state.cameraShakeBandThresholds,
					state.cameraShakeChannel,
					state.cameraShakeThreshold
				);
				if (
					snapshot.bins.length > 0 &&
					shouldTriggerFxPeak({
						level,
						previousLevel: lastShakeLevelRef.current,
						threshold,
						nowMs: time,
						lastTriggerMs: lastShakeTriggerMsRef.current,
						retriggerMs: Math.max(35, state.cameraShakeRetriggerMs)
					})
				) {
					shakeEnergyRef.current = Math.max(
						shakeEnergyRef.current,
						Math.min(
							1,
							((level - threshold) / (1 - threshold)) *
								Math.max(0, state.cameraShakeSensitivity)
						)
					);
					lastShakeTriggerMsRef.current = time;
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
							(Math.cos(phase * 1.17) * (1 - roughness) +
								noiseY) *
							mag;
						break;
				}
			}

			txShake = clamp(txShake, shakeSlackX);
			tyShake = clamp(tyShake, shakeSlackY);
			el.style.transform = state.cameraShakeEnabled
				? `translate3d(${txShake.toFixed(2)}px, ${tyShake.toFixed(2)}px, 0) scale(${shakeScale.toFixed(4)})`
				: 'none';
			rafRef.current = requestAnimationFrame(frame);
		}

		lastTimeRef.current = performance.now();
		rafRef.current = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(rafRef.current);
			observer.disconnect();
			wrapper.style.transform = 'none';
			clearMotionTargets(motionTargetsRef.current);
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
