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
import { randomBetween } from '@/lib/math';
import { PARTICLE_LIMITS } from '@/lib/constants';
import vertexShader from '@/shaders/particleVertex.glsl';
import fragmentShader from '@/shaders/particleFragment.glsl';
import type { ParticleRotationDirection } from '@/types/wallpaper';

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
		particleAudioSizeBoost,
		particleAudioOpacityBoost,
		particleFadeInOut,
		particleScanlineIntensity,
		particleScanlineSpacing,
		particleScanlineThickness,
		particleRotationIntensity,
		particleRotationDirection,
		performanceMode,
		motionPaused,
		sleepModeActive,
		particleAudioChannel,
		audioAutoKickThreshold,
		audioAutoSwitchHoldMs,
		editorTheme
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
			particleAudioSizeBoost: state.particleAudioSizeBoost,
			particleAudioOpacityBoost: state.particleAudioOpacityBoost,
			particleFadeInOut: state.particleFadeInOut,
			particleScanlineIntensity: state.particleScanlineIntensity,
			particleScanlineSpacing: state.particleScanlineSpacing,
			particleScanlineThickness: state.particleScanlineThickness,
			particleRotationIntensity: state.particleRotationIntensity,
			particleRotationDirection: state.particleRotationDirection,
			performanceMode: state.performanceMode,
			motionPaused: state.motionPaused,
			sleepModeActive: state.sleepModeActive,
			particleAudioChannel: state.particleAudioChannel,
			audioAutoKickThreshold: state.audioAutoKickThreshold,
			audioAutoSwitchHoldMs: state.audioAutoSwitchHoldMs,
			editorTheme: state.editorTheme
		}))
	);
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
	const sizeLo = Math.min(particleSizeMin, particleSizeMax);
	const sizeHi = Math.max(particleSizeMin, particleSizeMax);

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
						i / Math.max(count, 1) + (offsets[i] / (Math.PI * 2)) * 0.4;
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
			uOpacity: { value: particleOpacity },
			uGlowStrength: { value: 0 },
			uAmplitude: { value: 0 },
			uAudioSizeBoost: { value: particleAudioSizeBoost },
			uAudioOpacityBoost: { value: particleAudioOpacityBoost },
			uAudioReactive: { value: particleAudioReactive },
			uFadeInOut: { value: particleFadeInOut },
			uShape: { value: PARTICLE_SHAPE_INDEX[particleShape] ?? 0 },
			uScanlineIntensity: { value: particleScanlineIntensity },
			uScanlineSpacing: { value: particleScanlineSpacing },
			uScanlineThickness: { value: particleScanlineThickness },
			uRotationIntensity: { value: particleRotationIntensity },
			uRotationDirection: {
				value:
					PARTICLE_ROTATION_DIRECTION_INDEX[
						particleRotationDirection
					] ?? 1
			},
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
		const { instantLevel: amplitude } = resolveAudioChannelValue(
			audio.channels,
			particleAudioChannel,
			particleChannelSelectionRef.current,
			0,
			audioAutoKickThreshold,
			audioAutoSwitchHoldMs,
			audio.timestampMs
		);
		const safeDt = Math.min(dt, 0.1);
		motionTimeRef.current += safeDt;
		mat.uniforms.uTime.value = motionTimeRef.current;
		mat.uniforms.uOpacity.value = particleOpacity;
		mat.uniforms.uGlowStrength.value = particleGlow
			? particleGlowStrength
			: 0;
		mat.uniforms.uAmplitude.value = amplitude;
		mat.uniforms.uAudioSizeBoost.value = particleAudioSizeBoost;
		mat.uniforms.uAudioOpacityBoost.value = particleAudioOpacityBoost;
		mat.uniforms.uAudioReactive.value = particleAudioReactive;
		mat.uniforms.uFadeInOut.value = particleFadeInOut;
		mat.uniforms.uShape.value = PARTICLE_SHAPE_INDEX[particleShape] ?? 0;
		mat.uniforms.uScanlineIntensity.value = particleScanlineIntensity;
		mat.uniforms.uScanlineSpacing.value = particleScanlineSpacing;
		mat.uniforms.uScanlineThickness.value = particleScanlineThickness;
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

		if (particleSpeed > 0.001) {
			for (let i = 0; i < count; i++) {
				pos[i * 3] += velocities[i * 3] * particleSpeed;
				pos[i * 3 + 1] += velocities[i * 3 + 1] * particleSpeed;
				if (pos[i * 3] > 2.1) pos[i * 3] = -2.1;
				if (pos[i * 3] < -2.1) pos[i * 3] = 2.1;
				if (pos[i * 3 + 1] > 1.1) pos[i * 3 + 1] = -1.1;
				if (pos[i * 3 + 1] < -1.1) pos[i * 3 + 1] = 1.1;
			}
			pointsRef.current.geometry.attributes.position.needsUpdate = true;
		}

		for (let i = 0; i < count; i++) {
			lifeArr[i] += lifeSpeeds[i] * (60 * safeDt);
			if (lifeArr[i] >= 1.0) {
				lifeArr[i] = 0;
				pos[i * 3] = randomBetween(-2, 2);
				pos[i * 3 + 1] = randomBetween(-1, 1);
			}
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
