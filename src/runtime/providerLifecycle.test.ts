import { describe, expect, it } from 'vitest';

describe('provider lifecycle contract', () => {
	it('App mounts WallpaperAppProviders above route shells', async () => {
		const appSource = await import.meta.glob<string>('../App.tsx', {
			query: '?raw',
			import: 'default',
			eager: true
		});
		const source = Object.values(appSource)[0] ?? '';
		expect(source).toContain('WallpaperAppProviders');
		expect(source).toContain('RouteRuntimeModeSync');
		expect(source).toContain('<Routes>');
	});

	it('Editor and output shells do not nest duplicate providers', async () => {
		const pages = await import.meta.glob<string>(
			'../pages/{EditorPage,OutputShellPage}.tsx',
			{
				query: '?raw',
				import: 'default',
				eager: true
			}
		);
		for (const source of Object.values(pages)) {
			expect(source).not.toContain('WallpaperAppProviders');
		}
	});
});
