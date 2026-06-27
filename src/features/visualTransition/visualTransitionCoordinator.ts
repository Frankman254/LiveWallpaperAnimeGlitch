import type {
	VisualTransitionSnapshot,
	VisualTransitionSubsystem,
	WallpaperState
} from '@/types/wallpaper';

function patchHasAny(
	patch: Partial<WallpaperState>,
	prefixes: readonly string[]
): boolean {
	return Object.keys(patch).some(key =>
		prefixes.some(prefix => key.startsWith(prefix))
	);
}

export function detectVisualTransitionSubsystems(
	patch: Partial<WallpaperState>
): VisualTransitionSubsystem[] {
	const subsystems: VisualTransitionSubsystem[] = [];
	if (
		patch.activeSceneSlotId !== undefined ||
		patch.sceneSlots !== undefined
	) {
		subsystems.push('scene');
	}
	if (
		patch.spectrumEnabled !== undefined ||
		patchHasAny(patch, ['spectrum'])
	) {
		subsystems.push('spectrum');
	}
	if (
		patch.particlesEnabled !== undefined ||
		patchHasAny(patch, ['particle'])
	) {
		subsystems.push('particles');
	}
	if (patch.rainEnabled !== undefined || patchHasAny(patch, ['rain'])) {
		subsystems.push('rain');
	}
	if (
		patch.filterTargets !== undefined ||
		patch.customFilterLookSettings !== undefined ||
		patch.activeFilterLookId !== undefined ||
		patchHasAny(patch, [
			'filter',
			'brightness',
			'contrast',
			'saturation',
			'blur',
			'hue',
			'vignette',
			'bloom',
			'luma',
			'lens',
			'heat',
			'scanline'
		])
	) {
		subsystems.push('looks');
	}
	if (patch.logoEnabled !== undefined || patchHasAny(patch, ['logo'])) {
		subsystems.push('logo');
	}
	return [...new Set(subsystems)];
}

export function createVisualTransitionSnapshot(params: {
	state: Pick<WallpaperState, 'activeImageId' | 'performanceMode'>;
	patch: Partial<WallpaperState>;
	toImageId: string | null;
	startedAtMs?: number;
	prefersReducedMotion?: boolean;
}): VisualTransitionSnapshot | null {
	const subsystems = detectVisualTransitionSubsystems(params.patch);
	const imageChanged = params.state.activeImageId !== params.toImageId;
	if (!imageChanged && subsystems.length === 0) return null;
	const reduced = params.prefersReducedMotion === true;
	const startedAtMs = params.startedAtMs ?? Date.now();
	const performanceDuration =
		params.state.performanceMode === 'low'
			? 220
			: params.state.performanceMode === 'medium'
				? 420
				: 520;
	return {
		id: `vt-${startedAtMs}-${Math.random().toString(36).slice(2, 8)}`,
		fromImageId: params.state.activeImageId,
		toImageId: params.toImageId,
		startedAtMs,
		durationMs: reduced ? 0 : performanceDuration,
		easing: 'smoothstep',
		subsystems
	};
}

/**
 * Maps a renderable layer's `type` to the visual-transition subsystem whose
 * fade envelope should drive it, or `null` when the layer is not part of the
 * smooth-transition pass (e.g. track-title / lyrics / plain images). Pure so it
 * can be unit-tested without the DOM or the store.
 */
export function transitionSubsystemForLayerType(
	type: string
): VisualTransitionSubsystem | null {
	switch (type) {
		case 'spectrum':
			return 'spectrum';
		case 'logo':
			return 'logo';
		case 'rain':
			return 'rain';
		case 'particle-background':
		case 'particle-foreground':
			return 'particles';
		default:
			return null;
	}
}

export function visualTransitionProgress(
	transition: VisualTransitionSnapshot | null,
	nowMs: number
): number {
	if (!transition) return 1;
	if (transition.durationMs <= 0) return 1;
	const t = Math.max(
		0,
		Math.min(1, (nowMs - transition.startedAtMs) / transition.durationMs)
	);
	return t * t * (3 - 2 * t);
}

export function isVisualTransitionActive(
	transition: VisualTransitionSnapshot | null,
	nowMs: number
): boolean {
	if (!transition) return false;
	return visualTransitionProgress(transition, nowMs) < 1;
}
