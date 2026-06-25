import { describe, expect, it } from 'vitest';
import { buildWallpaperSettingsExport } from './projectSettings';
import type { WallpaperState } from '@/types/wallpaper';

describe('project settings export normalization', () => {
	it('does not export an active runtime visual transition', () => {
		const exportEnvelope = buildWallpaperSettingsExport({
			activeImageId: 'img-a',
			visualTransition: {
				id: 'vt-runtime',
				fromImageId: 'img-a',
				toImageId: 'img-b',
				startedAtMs: 1000,
				durationMs: 420,
				easing: 'smoothstep',
				subsystems: ['spectrum']
			}
		} as Partial<WallpaperState>);

		expect(exportEnvelope.state.visualTransition).toBeNull();
	});
});
