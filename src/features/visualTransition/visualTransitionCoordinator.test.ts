import { describe, expect, it } from 'vitest';
import {
	createVisualTransitionSnapshot,
	detectVisualTransitionSubsystems,
	isVisualTransitionActive,
	transitionSubsystemForLayerType,
	visualTransitionProgress
} from './visualTransitionCoordinator';
import type { WallpaperState } from '@/types/wallpaper';

describe('visualTransitionCoordinator', () => {
	it('detects the visual subsystems touched by an image or scene patch', () => {
		const subsystems = detectVisualTransitionSubsystems({
			activeSceneSlotId: 'scene-1',
			spectrumMode: 'radial',
			particlesEnabled: true,
			rainIntensity: 0.7,
			filterBrightness: 1.2,
			logoPositionX: 0.25
		} as Partial<WallpaperState>);

		expect(subsystems).toEqual([
			'scene',
			'spectrum',
			'particles',
			'rain',
			'looks',
			'logo'
		]);
	});

	it('creates a transition when the active image changes', () => {
		const transition = createVisualTransitionSnapshot({
			state: { activeImageId: 'img-a', performanceMode: 'high' },
			patch: {},
			toImageId: 'img-b',
			startedAtMs: 1000
		});

		expect(transition).toMatchObject({
			fromImageId: 'img-a',
			toImageId: 'img-b',
			startedAtMs: 1000,
			durationMs: 520,
			easing: 'smoothstep',
			subsystems: []
		});
		expect(transition?.id).toMatch(/^vt-1000-/);
	});

	it('creates a reduced-motion transition without extending animation time', () => {
		const transition = createVisualTransitionSnapshot({
			state: { activeImageId: 'img-a', performanceMode: 'medium' },
			patch: { spectrumMode: 'linear' } as Partial<WallpaperState>,
			toImageId: 'img-a',
			startedAtMs: 1000,
			prefersReducedMotion: true
		});

		expect(transition?.durationMs).toBe(0);
		expect(transition?.subsystems).toEqual(['spectrum']);
		expect(isVisualTransitionActive(transition, 1000)).toBe(false);
	});

	it('smoothsteps progress and ends after its duration', () => {
		const transition = createVisualTransitionSnapshot({
			state: { activeImageId: 'img-a', performanceMode: 'low' },
			patch: { logoEnabled: true },
			toImageId: 'img-a',
			startedAtMs: 1000
		});

		expect(visualTransitionProgress(transition, 1000)).toBe(0);
		expect(visualTransitionProgress(transition, 1110)).toBeCloseTo(0.5, 5);
		expect(visualTransitionProgress(transition, 1220)).toBe(1);
		expect(isVisualTransitionActive(transition, 1219)).toBe(true);
		expect(isVisualTransitionActive(transition, 1220)).toBe(false);
	});

	it('maps layer types to the subsystem that drives their fade envelope', () => {
		expect(transitionSubsystemForLayerType('spectrum')).toBe('spectrum');
		expect(transitionSubsystemForLayerType('logo')).toBe('logo');
		expect(transitionSubsystemForLayerType('rain')).toBe('rain');
		expect(transitionSubsystemForLayerType('particle-background')).toBe(
			'particles'
		);
		expect(transitionSubsystemForLayerType('particle-foreground')).toBe(
			'particles'
		);
		// Layers outside the FASE 0 fade pass.
		expect(transitionSubsystemForLayerType('track-title')).toBeNull();
		expect(transitionSubsystemForLayerType('lyrics')).toBeNull();
		expect(transitionSubsystemForLayerType('background-image')).toBeNull();
		expect(transitionSubsystemForLayerType('overlay-image')).toBeNull();
	});

	it('does not create a transition for an unrelated state patch', () => {
		const transition = createVisualTransitionSnapshot({
			state: { activeImageId: 'img-a', performanceMode: 'high' },
			patch: { language: 'es' } as Partial<WallpaperState>,
			toImageId: 'img-a',
			startedAtMs: 1000
		});

		expect(transition).toBeNull();
	});
});
