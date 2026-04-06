import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import vertexShader from '@/shaders/rainVertex.glsl';
import fragmentShader from '@/shaders/rainOverlayFragment.glsl';

const PARTICLE_TYPE_INDEX: Record<string, number> = {
	lines: 0,
	drops: 1,
	dots: 2,
	bars: 3
};
const COLOR_MODE_INDEX: Record<string, number> = { solid: 0, rainbow: 1 };

function hexToVec3(hex: string): [number, number, number] {
	const c = hex.replace('#', '');
	return [
		parseInt(c.slice(0, 2), 16) / 255,
		parseInt(c.slice(2, 4), 16) / 255,
		parseInt(c.slice(4, 6), 16) / 255
	];
}

export default function RainLayer({
	renderOrder = 20
}: {
	renderOrder?: number;
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const motionTimeRef = useRef(0);
	const { viewport } = useThree();
	const {
		rainIntensity,
		rainDropCount,
		rainAngle,
		rainMeshRotationZ,
		rainColor,
		rainColorSource,
		rainColorMode,
		rainParticleType,
		rainLength,
		rainWidth,
		rainBlur,
		rainSpeed,
		rainVariation,
		motionPaused,
		sleepModeActive
	} = useWallpaperStore();
	const backgroundPalette = useBackgroundPalette();
	const usePaletteRainbow =
		rainColorSource === 'background' && rainColorMode === 'rainbow';
	const resolvedRainColor =
		rainColorSource === 'background'
			? backgroundPalette.dominant
			: rainColor;

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uRainIntensity: { value: rainIntensity },
			uDropCount: { value: rainDropCount },
			uRainAngle: { value: (rainAngle * Math.PI) / 180 },
			uRainSpeed: { value: rainSpeed },
			uRainLength: { value: rainLength },
			uRainWidth: { value: rainWidth },
			uRainBlur: { value: rainBlur },
			uRainVariation: { value: rainVariation },
			uRainColor: {
				value: new THREE.Vector3(...hexToVec3(resolvedRainColor))
			},
			uColorMode: { value: COLOR_MODE_INDEX[rainColorMode] ?? 0 },
			uUsePaletteRainbow: { value: usePaletteRainbow ? 1 : 0 },
			uPaletteCount: { value: backgroundPalette.rainbow.length },
			uPaletteColors: {
				value: backgroundPalette.rainbow.map(
					color => new THREE.Vector3(...hexToVec3(color))
				)
			},
			uParticleType: { value: PARTICLE_TYPE_INDEX[rainParticleType] ?? 0 }
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}),
		[]
	);

	useFrame((_, dt) => {
		if (!meshRef.current) return;
		if (motionPaused || sleepModeActive) return;
		const mat = meshRef.current.material as THREE.ShaderMaterial;
		motionTimeRef.current += Math.min(dt, 0.1);
		mat.uniforms.uTime.value = motionTimeRef.current;
		mat.uniforms.uRainIntensity.value = rainIntensity;
		mat.uniforms.uDropCount.value = Math.floor(rainDropCount);
		mat.uniforms.uRainAngle.value = (rainAngle * Math.PI) / 180;
		mat.uniforms.uRainSpeed.value = rainSpeed;
		mat.uniforms.uRainLength.value = rainLength;
		mat.uniforms.uRainWidth.value = rainWidth;
		mat.uniforms.uRainBlur.value = rainBlur;
		mat.uniforms.uRainVariation.value = rainVariation;
		const [r, g, b] = hexToVec3(resolvedRainColor);
		mat.uniforms.uRainColor.value.set(r, g, b);
		mat.uniforms.uColorMode.value = COLOR_MODE_INDEX[rainColorMode] ?? 0;
		mat.uniforms.uUsePaletteRainbow.value = usePaletteRainbow ? 1 : 0;
		mat.uniforms.uPaletteCount.value = backgroundPalette.rainbow.length;
		const paletteUniforms = mat.uniforms.uPaletteColors.value as THREE.Vector3[];
		for (let i = 0; i < paletteUniforms.length; i++) {
			const [pr, pg, pb] = hexToVec3(
				backgroundPalette.rainbow[i] ?? backgroundPalette.dominant
			);
			paletteUniforms[i].set(pr, pg, pb);
		}
		mat.uniforms.uParticleType.value =
			PARTICLE_TYPE_INDEX[rainParticleType] ?? 0;

		// Z-rotation for 3D tilt effect — scale 1.5× to cover corners when rotated
		meshRef.current.rotation.z = (rainMeshRotationZ * Math.PI) / 180;
	});

	// 1.5× overscale prevents corners from becoming visible during Z-rotation
	return (
		<mesh
			ref={meshRef}
			position={[0, 0, 0.1]}
			scale={[viewport.width * 1.5, viewport.height * 1.5, 1]}
			renderOrder={renderOrder}
		>
			<planeGeometry args={[1, 1]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				transparent
				depthTest={false}
				depthWrite={false}
			/>
		</mesh>
	);
}
