import { describe, expect, it } from 'vitest';
import { buildDisplayMediaRequest } from './displayMediaCapture';

describe('buildDisplayMediaRequest', () => {
	it('prefers current tab and excludes monitor surfaces', () => {
		const request = buildDisplayMediaRequest('60', true);
		expect(request.preferCurrentTab).toBe(true);
		expect(request.selfBrowserSurface).toBe('include');
		expect(request.monitorTypeSurfaces).toBe('exclude');
		expect(request.surfaceSwitching).toBe('exclude');
		expect(request.audio).toBe(true);
		expect(request.video).toMatchObject({
			frameRate: { ideal: 60, max: 60 }
		});
	});
});
