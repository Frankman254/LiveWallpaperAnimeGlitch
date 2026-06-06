import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import * as THREE from 'three';
import {
	createAudioChannelSelectionState,
	resolveAudioChannelValue
} from '@/lib/audio/audioChannels';
import {
	getEditorThemePalette,
	resolveModeDrivenColors,
	samplePaletteColor
} from '@/lib/backgroundPalette';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { createAudioEnvelope } from '@/utils/audioEnvelope';
import { randomBetween } from '@/lib/math';
import { PARTICLE_LIMITS } from '@/lib/constants';
import vertexShader from '@/shaders/particleVertex.glsl';
import fragmentShader from '@/shaders/particleFragment.glsl';
import type {
	ParticleDepthFlowDirection,
	ParticleDepthFlowMode,
	ParticleRotationDirection
} from '@/types/wallpaper';

const PARTICLE_SHAPE_INDEX: Record<string, number> = {
	circles: 0,
	squares: 1,
	triangles: 2,
	stars: 3,
	plus: 4,
	minus: 5,
	diamonds: 6,
	cross: 7,
	all: 8
};

const PARTICLE_ROTATION_DIRECTION_INDEX: Record<
	ParticleRotationDirection,
	number
> = {
	clockwise: 1,
	counterclockwise: -1
};

const PARTICLE_DEPTH_DIRECTION_SIGN: Record<
	ParticleDepthFlowDirection,
	number
> = {
	towardViewer: 1,
	awayFromViewer: -1
};

const PARTICLE_DEPTH_MODE_SCALE: Record<ParticleDepthFlowMode, number> = {
	pullToCamera: 1,
	pushFromFocus: 0.8,
	tunnelBurst: 1.45,
	snowRush: 0.65
};

function hexToVec3(hex: string): [number, number, number] {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	return [r, g, b];
}

interface ParticleFieldProps {
	renderOrder?: number;
	zPosition: number;
}

export default function ParticleField({
	renderOrder = 10,
	zPosition
}: ParticleFieldProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const motionTimeRef = useRef(0);
	const particleChannelSelectionRef = useRef(
		createAudioChannelSelectionState('instrumental')
	);
	const particleDriftChannelSelectionRef = useRef(
		createAudioChannelSelectionState('kick')
	);
	const particleDepthChannelSelectionRef = useRef(
		createAudioChannelSelectionState('kick')
	);
	const particleEnvelopeRef = useRef(createAudioEnvelope());
	const particleDriftEnvelopeRef = useRef(createAudioEnvelope());
	const particleDepthEnvelopeRef = useRef(createAudioEnvelope());
	const {
		particleCount,
		particleSpeed,
		particleColor1,
		particleColor2,
		particleColorSource,
		particleColorMode,
		particleShape,
		particleSizeMin,
		particleSizeMax,
		particleOpacity,
		particleGlow,
		particleGlowStrength,
		particleAudioReactive,
		particleAudioSmoothing,
		particleAudioSizeBoost,
		particleAudioOpacityBoost,
		particleAudioAttack,
		particleAudioRelease,
		particleAudioReactivitySpeed,
		particleAudioPeakWindow,
		particleAudioPeakFloor,
		particleAudioPunch,
		particleAudioDriftEnabled,
		particleAudioDriftAngle,
		particleAudioDriftAmount,
		particleAudioDriftBase,
		particleAudioDriftChannel,
		particleAudioDriftThreshold,
		particleAudioDriftRelease,
		particleAudioDriftMode,
		particleDepthFlowEnabled,
		particleDepthFlowAmount,
		particleDepthFlowDirection,
		particleDepthFlowChannel,
		particleDepthFlowThreshold,
		particleDepthFlowSensitivity,
		particleDepthFlowAttack,
		particleDepthFlowRelease,
		particleDepthFlowSpeed,
		particleDepthFlowSpread,
		particleDepthFlowFocusX,
		particleDepthFlowFocusY,
		particleDepthFlowMode,
		particleFadeInOut,
		particleRotationIntensity,
		particleRotationDirection,
		performanceMode,
		motionPaused,
		sleepModeActive,
		particleAudioChannel,
		audioAutoKickThreshold,
		audioAutoSwitchHoldMs,
		editorTheme,
		filterTargets,
		filterOpacity
	} = useWallpaperStore(
		useShallow(state => ({
			particleCount: state.particleCount,
			particleSpeed: state.particleSpeed,
			particleColor1: state.particleColor1,
			particleColor2: state.particleColor2,
			particleColorSource: state.particleColorSource,
			particleColorMode: state.particleColorMode,
			particleShape: state.particleShape,
			particleSizeMin: state.particleSizeMin,
			particleSizeMax: state.particleSizeMax,
			particleOpacity: state.particleOpacity,
			particleGlow: state.particleGlow,
			particleGlowStrength: state.particleGlowStrength,
			particleAudioReactive: state.particleAudioReactive,
			particleAudioSmoothing: state.particleAudioSmoothing,
			particleAudioSizeBoost: state.particleAudioSizeBoost,
			particleAudioOpacityBoost: state.particleAudioOpacityBoost,
			particleAudioAttack: state.particleAudioAttack,
			particleAudioRelease: state.particleAudioRelease,
			particleAudioReactivitySpeed: state.particleAudioReactivitySpeed,
			particleAudioPeakWindow: state.particleAudioPeakWindow,
			particleAudioPeakFloor: state.particleAudioPeakFloor,
			particleAudioPunch: state.particleAudioPunch,
			particleAudioDriftEnabled: state.particleAudioDriftEnabled,
			particleAudioDriftAngle: state.particleAudioDriftAngle,
			particleAudioDriftAmount: state.particleAudioDriftAmount,
			particleAudioDriftBase: state.particleAudioDriftBase,
			particleAudioDriftChannel: state.particleAudioDriftChannel,
			particleAudioDriftThreshold: state.particleAudioDriftThreshold,
			particleAudioDriftRelease: state.particleAudioDriftRelease,
			particleAudioDriftMode: state.particleAudioDriftMode,
			particleDepthFlowEnabled: state.particleDepthFlowEnabled,
			particleDepthFlowAmount: state.particleDepthFlowAmount,
			particleDepthFlowDirection: state.particleDepthFlowDirection,
			particleDepthFlowChannel: state.particleDepthFlowChannel,
			particleDepthFlowThreshold: state.particleDepthFlowThreshold,
			particleDepthFlowSensitivity: state.particleDepthFlowSensitivity,
			particleDepthFlowAttack: state.particleDepthFlowAttack,
			particleDepthFlowRelease: state.particleDepthFlowRelease,
			particleDepthFlowSpeed: state.particleDepthFlowSpeed,
			particleDepthFlowSpread: state.particleDepthFlowSpread,
			particleDepthFlowFocusX: state.particleDepthFlowFocusX,
			particleDepthFlowFocusY: state.particleDepthFlowFocusY,
			particleDepthFlowMode: state.particleDepthFlowMode,
			particleFadeInOut: state.particleFadeInOut,
			particleRotationIntensity: state.particleRotationIntensity,
			particleRotationDirection: state.particleRotationDirection,
			performanceMode: state.performanceMode,
			motionPaused: state.motionPaused,
			sleepModeActive: state.sleepModeActive,
			particleAudioChannel: state.particleAudioChannel,
			audioAutoKickThreshold: state.audioAutoKickThreshold,
			audioAutoSwitchHoldMs: state.audioAutoSwitchHoldMs,
			editorTheme: state.editorTheme,
			filterTargets: state.filterTargets,
			filterOpacity: state.filterOpacity
		}))
	);
	// When this layer is in the filter targets, scale opacity by filterOpacity
	// so the Looks tab's "filter opacity" actually does something to particles.
	const filterAffected = filterTargets.includes('particles');
	const effectiveOpacityMultiplier = filterAffected ? filterOpacity : 1;
	const backgroundPalette = useBackgroundPalette();
	const themePalette = useMemo(
		() => getEditorThemePalette(editorTheme),
		[editorTheme]
	);
	const { getAudioSnapshot } = useAudioData();

	const count = Math.min(particleCount, PARTICLE_LIMITS[performanceMode]);
	// Defensive ordering: if the user drags sizeMin past sizeMax (or vice
	// versa) the `randomBetween(sizeMin, sizeMax)` call below returns NaN
	// for every particle. Swap so we always have a valid range.
	const orderedSizeMin = Math.min(particleSizeMin, particleSizeMax);
	const orderedSizeMax = Math.max(particleSizeMin, particleSizeMax);
	const maxSeedSize =
		performanceMode === 'low' ? 14 : performanceMode === 'medium' ? 22 : 30;
	const maxPointSize =
		performanceMode === 'low' ? 18 : performanceMode === 'medium' ? 26 : 36;
	const sizeLo = Math.min(orderedSizeMin, maxSeedSize);
	const sizeHi = Math.min(Math.max(sizeLo, orderedSizeMax), maxSeedSize);
	const audioSizeBoostCap =
		performanceMode === 'low' ? 2.5 : performanceMode === 'medium' ? 5 : 8;
	const glowStrengthCap =
		performanceMode === 'low'
			? 0.45
			: performanceMode === 'medium'
				? 0.85
				: 1.2;
	const depthSpeedCap =
		performanceMode === 'low'
			? 0.75
			: performanceMode === 'medium'
				? 1.4
				: 2.1;
	const depthSizeBoostCap =
		performanceMode === 'low' ? 2 : performanceMode === 'medium' ? 3.5 : 5;
	const depthFrameCap =
		performanceMode === 'low'
			? 0.012
			: performanceMode === 'medium'
				? 0.022
				: 0.035;

	const resolvedColors = useMemo(
		() =>
			resolveModeDrivenColors(
				particleColorSource,
				particleColor1,
				particleColor2,
				backgroundPalette,
				themePalette
			),
		[
			particleColorSource,
			particleColor1,
			particleColor2,
			backgroundPalette,
			themePalette
		]
	);
	// Rotation in `rotateRgb` mode is driven by the shader for `manual`
	// (HSL spectrum cycle) and by CPU for `theme`/`image` (palette cycle).
	// Pre-decompose the palette once so the per-frame loop only does math.
	const paletteVec3s = useMemo(
		() => resolvedColors.rainbowColors.map(hexToVec3),
		[resolvedColors.rainbowColors]
	);
	const paletteVec3sRef = useRef(paletteVec3s);
	paletteVec3sRef.current = paletteVec3s;
	const usePaletteRotation =
		particleColorMode === 'rotateRgb' && particleColorSource !== 'manual';
	const usePaletteRotationRef = useRef(usePaletteRotation);
	usePaletteRotationRef.current = usePaletteRotation;

	const { positions, velocities, sizes, colors, offsets, lives, lifeSpeeds } =
		useMemo(() => {
			const positions = new Float32Array(count * 3);
			const velocities = new Float32Array(count * 3);
			const sizes = new Float32Array(count);
			const colors = new Float32Array(count * 3);
			const offsets = new Float32Array(count);
			const lives = new Float32Array(count);
			const lifeSpeeds = new Float32Array(count);
			const c1 = hexToVec3(resolvedColors.primaryColor);
			const c2 = hexToVec3(resolvedColors.secondaryColor);
			const rainbowPalette = resolvedColors.rainbowColors;

			for (let i = 0; i < count; i++) {
				positions[i * 3] = randomBetween(-2, 2);
				positions[i * 3 + 1] = randomBetween(-1, 1);
				positions[i * 3 + 2] = zPosition;
				velocities[i * 3] = randomBetween(-0.0008, 0.0008);
				velocities[i * 3 + 1] = randomBetween(-0.0008, 0.0008);
				sizes[i] = randomBetween(sizeLo, sizeHi);
				offsets[i] = randomBetween(0, Math.PI * 2);
				lives[i] = randomBetween(0, 1);
				lifeSpeeds[i] = randomBetween(0.003, 0.012);

				if (particleColorMode === 'solid') {
					colors[i * 3] = c1[0];
					colors[i * 3 + 1] = c1[1];
					colors[i * 3 + 2] = c1[2];
				} else if (particleColorMode === 'rotateRgb') {
					if (particleColorSource === 'manual') {
						// Shader does the HSL cycle via uRotateRgb=1 and ignores
						// vColor — a neutral base is enough.
						colors[i * 3] = 0.5;
						colors[i * 3 + 1] = 0.5;
						colors[i * 3 + 2] = 0.5;
					} else {
						// Seed from the palette; useFrame will keep cycling.
						const t = offsets[i] / (Math.PI * 2);
						const [r, g, b] = hexToVec3(
							samplePaletteColor(rainbowPalette, t)
						);
						colors[i * 3] = r;
						colors[i * 3 + 1] = g;
						colors[i * 3 + 2] = b;
					}
				} else if (particleColorMode === 'rainbow') {
					// Spread across whichever palette `resolvedColors` produced —
					// DEFAULT_RAINBOW_PALETTE for manual, theme/image palettes
					// otherwise. samplePaletteColor handles the interpolation.
					const t =
						i / Math.max(count, 1) +
						(offsets[i] / (Math.PI * 2)) * 0.4;
					const wrapped = t - Math.floor(t);
					const [r, g, b] = hexToVec3(
						samplePaletteColor(rainbowPalette, wrapped)
					);
					colors[i * 3] = r;
					colors[i * 3 + 1] = g;
					colors[i * 3 + 2] = b;
				} else {
					const t = i / Math.max(count, 1);
					colors[i * 3] = c1[0] + (c2[0] - c1[0]) * t;
					colors[i * 3 + 1] = c1[1] + (c2[1] - c1[1]) * t;
					colors[i * 3 + 2] = c1[2] + (c2[2] - c1[2]) * t;
				}
			}

			return {
				positions,
				velocities,
				sizes,
				colors,
				offsets,
				lives,
				lifeSpeeds
			};
		}, [
			count,
			resolvedColors,
			particleColorSource,
			particleColorMode,
			sizeLo,
			sizeHi,
			zPosition
		]);

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uOpacity: { value: 0 },
			uGlowStrength: { value: 0 },
			uAmplitude: { value: 0 },
			uAudioSizeBoost: { value: 0 },
			uMaxPointSize: { value: 36 },
			uAudioOpacityBoost: { value: 0 },
			uDepthAmplitude: { value: 0 },
			uDepthSizeBoost: { value: 0 },
			uAudioReactive: { value: false },
			uFadeInOut: { value: false },
			uShape: { value: 0 },
			uRotationIntensity: { value: 0 },
			uRotationDirection: { value: 1 },
			uRotateRgb: { value: 0 }
		}),
		[]
	);

	useEffect(() => {
		if (!pointsRef.current) return;
		const geometry = pointsRef.current.geometry;
		(geometry.attributes.position as THREE.BufferAttribute).setUsage(
			THREE.DynamicDrawUsage
		);
		(geometry.attributes.aLife as THREE.BufferAttribute).setUsage(
			THREE.DynamicDrawUsage
		);
	}, [count]);

	useFrame((_, dt) => {
		if (!pointsRef.current) return;
		if (motionPaused || sleepModeActive) return;
		const mat = pointsRef.current.material as THREE.ShaderMaterial;
		const pos = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const lifeArr = pointsRef.current.geometry.attributes.aLife
			.array as Float32Array;

		const audio = getAudioSnapshot();
		const { value: channelLevel } = resolveAudioChannelValue(
			audio.channels,
			particleAudioChannel,
			particleChannelSelectionRef.current,
			particleAudioSmoothing,
			audioAutoKickThreshold,
			audioAutoSwitchHoldMs,
			audio.timestampMs
		);
		const safeDt = Math.min(dt, 0.1);
		// Envelope mapped to [0, 1] so the shader uniform stays in the same
		// range it had with `instantLevel`. The shader multiplies by Size/Opacity
		// boosts separately, so we keep `scaleIntensity` at 1 here.
		const envelopeState = particleEnvelopeRef.current.tick(
			channelLevel,
			Math.max(safeDt, 1 / 120),
			{
				attack: particleAudioAttack,
				release: particleAudioRelease,
				responseSpeed: particleAudioReactivitySpeed * 2.4,
				peakWindow: particleAudioPeakWindow,
				peakFloor: particleAudioPeakFloor,
				punch: particleAudioPunch,
				scaleIntensity: 1,
				min: 0,
				max: 1
			}
		);
		const amplitude = envelopeState.value;
		const driftChannelLevel =
			particleAudioDriftChannel === particleAudioChannel
				? channelLevel
				: resolveAudioChannelValue(
						audio.channels,
						particleAudioDriftChannel,
						particleDriftChannelSelectionRef.current,
						particleAudioSmoothing,
						audioAutoKickThreshold,
						audioAutoSwitchHoldMs,
						audio.timestampMs
					).value;
		const driftInput =
			particleAudioDriftEnabled &&
			driftChannelLevel >= particleAudioDriftThreshold
				? driftChannelLevel
				: 0;
		const driftState = particleDriftEnvelopeRef.current.tick(
			driftInput,
			Math.max(safeDt, 1 / 120),
			{
				attack: 0.85,
				release: particleAudioDriftRelease,
				responseSpeed: 2.2,
				peakWindow: particleAudioPeakWindow,
				peakFloor: particleAudioPeakFloor,
				punch: particleAudioPunch,
				scaleIntensity: 1,
				min: 0,
				max: 1
			}
		);
		const driftLevel =
			particleAudioDriftMode === 'burst'
				? Math.pow(driftState.value, 1.35)
				: driftState.value;
		const perfDriftScale =
			performanceMode === 'low'
				? 0.45
				: performanceMode === 'medium'
					? 0.7
					: 1;
		const driftModeScale =
			particleAudioDriftMode === 'burst'
				? 1.65
				: particleAudioDriftMode === 'offset'
					? 0.45
					: 1;
		const driftSpeed = particleAudioDriftEnabled
			? Math.min(
					2.5,
					Math.max(
						0,
						particleAudioDriftBase +
							driftLevel * particleAudioDriftAmount
					)
				) *
				perfDriftScale *
				driftModeScale
			: 0;
		const driftAngleRad = (particleAudioDriftAngle * Math.PI) / 180;
		const driftX = Math.cos(driftAngleRad) * driftSpeed * safeDt;
		const driftY = Math.sin(driftAngleRad) * driftSpeed * safeDt;
		const depthChannelLevel =
			particleDepthFlowChannel === particleAudioChannel
				? channelLevel
				: particleDepthFlowChannel === particleAudioDriftChannel
					? driftChannelLevel
					: resolveAudioChannelValue(
							audio.channels,
							particleDepthFlowChannel,
							particleDepthChannelSelectionRef.current,
							particleAudioSmoothing,
							audioAutoKickThreshold,
							audioAutoSwitchHoldMs,
							audio.timestampMs
						).value;
		const depthInput =
			particleDepthFlowEnabled &&
			depthChannelLevel >= particleDepthFlowThreshold
				? depthChannelLevel
				: 0;
		const depthState = particleDepthEnvelopeRef.current.tick(
			depthInput,
			Math.max(safeDt, 1 / 120),
			{
				attack: particleDepthFlowAttack,
				release: particleDepthFlowRelease,
				responseSpeed: 2.4,
				peakWindow: particleAudioPeakWindow,
				peakFloor: particleAudioPeakFloor,
				punch: particleAudioPunch,
				scaleIntensity: particleDepthFlowSensitivity,
				min: 0,
				max: 1
			}
		);
		const depthModeScale =
			PARTICLE_DEPTH_MODE_SCALE[particleDepthFlowMode] ?? 1;
		const depthDirectionSign =
			PARTICLE_DEPTH_DIRECTION_SIGN[particleDepthFlowDirection] ?? 1;
		const depthDrive = particleDepthFlowEnabled
			? Math.min(
					1,
					Math.max(0, depthState.value * particleDepthFlowAmount)
				)
			: 0;
		const depthSpeed = Math.min(
			depthSpeedCap,
			Math.max(0, particleDepthFlowSpeed)
		);
		const depthFrameStep = Math.min(
			depthFrameCap,
			depthDrive * depthSpeed * depthModeScale * safeDt
		);
		const depthSpread = Math.min(3, Math.max(0.2, particleDepthFlowSpread));
		const focusX =
			(Math.min(1, Math.max(0, particleDepthFlowFocusX)) - 0.5) * 4;
		const focusY =
			(0.5 - Math.min(1, Math.max(0, particleDepthFlowFocusY))) * 2;
		const depthSizeBoost = Math.min(
			depthSizeBoostCap,
			depthDrive * depthSpeed * 2.4
		);
		motionTimeRef.current += safeDt;
		mat.uniforms.uTime.value = motionTimeRef.current;
		mat.uniforms.uOpacity.value =
			particleOpacity * effectiveOpacityMultiplier;
		mat.uniforms.uGlowStrength.value = particleGlow
			? Math.min(Math.max(0, particleGlowStrength), glowStrengthCap)
			: 0;
		mat.uniforms.uAmplitude.value = amplitude;
		mat.uniforms.uAudioSizeBoost.value = Math.min(
			Math.max(0, particleAudioSizeBoost),
			audioSizeBoostCap
		);
		mat.uniforms.uMaxPointSize.value = maxPointSize;
		mat.uniforms.uAudioOpacityBoost.value = particleAudioOpacityBoost;
		mat.uniforms.uDepthAmplitude.value = depthDrive;
		mat.uniforms.uDepthSizeBoost.value = depthSizeBoost;
		mat.uniforms.uAudioReactive.value = particleAudioReactive;
		mat.uniforms.uFadeInOut.value = particleFadeInOut;
		mat.uniforms.uShape.value = PARTICLE_SHAPE_INDEX[particleShape] ?? 0;
		mat.uniforms.uRotationIntensity.value = particleRotationIntensity;
		mat.uniforms.uRotationDirection.value =
			PARTICLE_ROTATION_DIRECTION_INDEX[particleRotationDirection] ?? 1;
		// uRotateRgb activates the GPU HSL cycle that fully overrides vColor;
		// only do that for manual rotateRgb. For theme/image rotateRgb the CPU
		// cycle below writes palette colours into the buffer and we leave the
		// shader to render those vColors directly.
		mat.uniforms.uRotateRgb.value =
			particleColorMode === 'rotateRgb' &&
			particleColorSource === 'manual'
				? 1
				: 0;

		let positionNeedsUpdate = false;
		if (
			particleSpeed > 0.001 ||
			driftSpeed > 0.0001 ||
			depthFrameStep > 0.00001
		) {
			for (let i = 0; i < count; i++) {
				const idx = i * 3;
				let nextX = pos[idx] + velocities[idx] * particleSpeed + driftX;
				let nextY =
					pos[idx + 1] + velocities[idx + 1] * particleSpeed + driftY;
				if (depthFrameStep > 0.00001) {
					const dx = nextX - focusX;
					const dy = nextY - focusY;
					const dist = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy));
					let radial = depthFrameStep * depthDirectionSign;
					if (particleDepthFlowMode === 'tunnelBurst') {
						radial *= 0.65 + Math.min(1.8, dist * depthSpread);
					} else if (particleDepthFlowMode === 'snowRush') {
						radial *= 0.35 + Math.min(1.2, (1.15 - nextY) * 0.55);
						nextY -= radial * 0.35;
					} else {
						radial *= 0.55 + Math.min(1.35, dist * depthSpread);
					}
					nextX += (dx / dist) * radial;
					nextY += (dy / dist) * radial;
				}
				pos[idx] = nextX;
				pos[idx + 1] = nextY;
				if (pos[i * 3] > 2.1) pos[i * 3] = -2.1;
				if (pos[i * 3] < -2.1) pos[i * 3] = 2.1;
				if (pos[i * 3 + 1] > 1.1) pos[i * 3 + 1] = -1.1;
				if (pos[i * 3 + 1] < -1.1) pos[i * 3 + 1] = 1.1;
				if (depthFrameStep > 0.00001) {
					const nearFocus =
						Math.abs(pos[idx] - focusX) < 0.035 &&
						Math.abs(pos[idx + 1] - focusY) < 0.035;
					const hitEdge =
						Math.abs(pos[idx]) > 2.05 ||
						Math.abs(pos[idx + 1]) > 1.05;
					if (
						(depthDirectionSign > 0 && hitEdge) ||
						(depthDirectionSign < 0 && nearFocus)
					) {
						if (depthDirectionSign > 0) {
							pos[idx] =
								focusX +
								randomBetween(-0.14, 0.14) * depthSpread;
							pos[idx + 1] =
								focusY +
								randomBetween(-0.08, 0.08) * depthSpread;
						} else {
							pos[idx] = randomBetween(-2, 2);
							pos[idx + 1] = randomBetween(-1, 1);
						}
					}
				}
			}
			positionNeedsUpdate = true;
		}

		for (let i = 0; i < count; i++) {
			lifeArr[i] += lifeSpeeds[i] * (60 * safeDt);
			if (lifeArr[i] >= 1.0) {
				lifeArr[i] = 0;
				pos[i * 3] = randomBetween(-2, 2);
				pos[i * 3 + 1] = randomBetween(-1, 1);
				positionNeedsUpdate = true;
			}
		}
		if (positionNeedsUpdate) {
			pointsRef.current.geometry.attributes.position.needsUpdate = true;
		}
		pointsRef.current.geometry.attributes.aLife.needsUpdate = true;

		// Palette-driven rotateRgb (theme/image): cycle each particle through
		// the resolved rainbow palette using its random offset for stagger.
		// Manual rotateRgb is handled entirely in the shader and skipped here.
		if (usePaletteRotationRef.current) {
			const colorAttr = pointsRef.current.geometry.attributes
				.aColor as THREE.BufferAttribute;
			const colorArr = colorAttr.array as Float32Array;
			const palette = paletteVec3sRef.current;
			const paletteLen = palette.length;
			if (paletteLen > 0) {
				const time = motionTimeRef.current;
				for (let i = 0; i < count; i++) {
					// 0.16 keeps the cycle calm enough to feel like rotation
					// without strobing — close in tempo to the GPU cycle.
					const tRaw = time * 0.16 + offsets[i] / (Math.PI * 2);
					const t = tRaw - Math.floor(tRaw);
					const scaled = t * paletteLen;
					const lower = Math.floor(scaled) % paletteLen;
					const upper = (lower + 1) % paletteLen;
					const alpha = scaled - Math.floor(scaled);
					const a = palette[lower];
					const b = palette[upper];
					colorArr[i * 3] = a[0] + (b[0] - a[0]) * alpha;
					colorArr[i * 3 + 1] = a[1] + (b[1] - a[1]) * alpha;
					colorArr[i * 3 + 2] = a[2] + (b[2] - a[2]) * alpha;
				}
				colorAttr.needsUpdate = true;
			}
		}
	});

	if (count === 0) return null;

	return (
		<points
			ref={pointsRef}
			position={[0, 0, 0]}
			renderOrder={renderOrder}
			frustumCulled={false}
		>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[positions, 3]}
				/>
				<bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
				<bufferAttribute
					attach="attributes-aColor"
					args={[colors, 3]}
				/>
				<bufferAttribute
					attach="attributes-aOffset"
					args={[offsets, 1]}
				/>
				<bufferAttribute attach="attributes-aLife" args={[lives, 1]} />
			</bufferGeometry>
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				transparent
				depthTest={false}
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}
