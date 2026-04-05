import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { lerp } from '@/lib/math';

type Props = {
	groupRef: RefObject<THREE.Group | null>;
	children: React.ReactNode;
};

export default function ParallaxController({ groupRef, children }: Props) {
	const mouse = useRef({ x: 0, y: 0 });
	const smoothed = useRef({ x: 0, y: 0 });
	const { parallaxStrength } = useWallpaperStore();

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	useFrame(() => {
		smoothed.current.x = lerp(smoothed.current.x, mouse.current.x, 0.05);
		smoothed.current.y = lerp(smoothed.current.y, mouse.current.y, 0.05);
		if (groupRef.current) {
			groupRef.current.position.x = smoothed.current.x * parallaxStrength;
			groupRef.current.position.y = smoothed.current.y * parallaxStrength;
		}
	});

	return <>{children}</>;
}
