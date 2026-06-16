import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import * as THREE from 'three';
import type { SceneLayer } from '@/types/layers';
import type { PerformanceMode } from '@/types/wallpaper';
import { renderSceneLayer } from '@/components/wallpaper/layers/sceneLayerRegistry';
import ParallaxController from '@/components/wallpaper/ParallaxController';
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * Caps the R3F render rate. The Canvas runs in `frameloop="demand"` and this
 * pump drives `invalidate()` at the performance-mode cadence (30/45/60), so on
 * a high-refresh display (120Hz) the particle/rain GPU draw — and the heavy
 * additive glow overdraw — happens ~half as often with no visible difference.
 */
function FrameRateLimiter({ minFrameMs }: { minFrameMs: number }) {
	const invalidate = useThree(s => s.invalidate);
	useEffect(() => {
		let rafId = 0;
		let last = 0;
		const tick = (now: number) => {
			if (now - last >= minFrameMs) {
				last = now;
				invalidate();
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [invalidate, minFrameMs]);
	return null;
}

function resolveMinFrameMs(mode: PerformanceMode): number {
	return mode === 'low'
		? 1000 / 30
		: mode === 'medium'
			? 1000 / 45
			: 1000 / 60;
}

export default function SceneLayerCanvas({ layer }: { layer: SceneLayer }) {
	const groupRef = useRef<THREE.Group>(null);
	// Subscribe to only the fields this wrapper actually reads. The previous
	// selector-less `useWallpaperStore()` re-rendered (and reconciled the whole
	// R3F <Canvas> subtree) on EVERY store mutation — any unrelated slider drag
	// churned every particle/rain canvas.
	const {
		performanceMode,
		particleFilterBrightness,
		particleFilterContrast,
		particleFilterSaturation,
		particleFilterBlur,
		particleFilterHueRotate
	} = useWallpaperStore(
		useShallow(s => ({
			performanceMode: s.performanceMode,
			particleFilterBrightness: s.particleFilterBrightness,
			particleFilterContrast: s.particleFilterContrast,
			particleFilterSaturation: s.particleFilterSaturation,
			particleFilterBlur: s.particleFilterBlur,
			particleFilterHueRotate: s.particleFilterHueRotate
		}))
	);

	if (!layer.enabled) return null;

	const particleFilterActive =
		layer.type === 'particle-background' ||
		layer.type === 'particle-foreground';
	const canvasFilter = particleFilterActive
		? `brightness(${particleFilterBrightness}) contrast(${particleFilterContrast}) saturate(${particleFilterSaturation}) blur(${particleFilterBlur}px) hue-rotate(${particleFilterHueRotate}deg)`
		: 'none';
	const canvasDpr: [number, number] = particleFilterActive
		? performanceMode === 'high'
			? [1, 1.15]
			: [1, 1]
		: [1, 1.5];

	return (
		<div
			data-camera-motion-layer={
				layer.type === 'particle-background'
					? 'particles'
					: layer.type === 'particle-foreground'
						? 'particles'
						: layer.type === 'rain'
							? 'rain'
							: 'background'
			}
			style={{
				position: 'fixed',
				inset: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: layer.zIndex,
				filter: canvasFilter
			}}
		>
			<Canvas
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'none'
				}}
				gl={{ antialias: false, alpha: true }}
				onCreated={({ gl }) => {
					gl.setClearColor(0x000000, 0);
				}}
				camera={{ position: [0, 0, 1], fov: 75 }}
				dpr={canvasDpr}
				frameloop="demand"
			>
				<FrameRateLimiter
					minFrameMs={resolveMinFrameMs(performanceMode)}
				/>
				<Suspense fallback={null}>
					<ParallaxController groupRef={groupRef}>
						<group ref={groupRef}>{renderSceneLayer(layer)}</group>
					</ParallaxController>
				</Suspense>
			</Canvas>
		</div>
	);
}
