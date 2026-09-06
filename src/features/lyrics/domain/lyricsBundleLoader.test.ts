import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getLyricsBundleProvider,
	listLyricsBundleProviders,
	loadLyricsBundleFromFile,
	loadLyricsBundleFromText,
	loadLyricsBundleFromUrl,
	LyricsBundleLoadError,
	registerLyricsBundleProvider
} from './lyricsBundleLoader';
import type { LyricsBundleLoadResult } from './lyricsBundleLoader';

const VALID = JSON.stringify({
	schemaVersion: 1,
	app: 'Lyrixa',
	exportKind: 'lyrics-bundle',
	exportedAt: '2026-09-01T00:00:00.000Z',
	projectName: 'Loader fixture',
	sourceTrack: null,
	project: {
		layers: [{ id: 'l', name: 'L', role: 'primary', language: 'ja' }],
		clips: [{ id: 'c', text: 'x', startTime: 0, endTime: 1, layerId: 'l' }]
	}
});

function textSource(name: string, text: string) {
	return { name, text: () => Promise.resolve(text) };
}

const unregister: Array<() => void> = [];
afterEach(() => {
	while (unregister.length) unregister.pop()?.();
});

describe('lyrics bundle loader', () => {
	it('loads a file and reports where it came from', async () => {
		const result = await loadLyricsBundleFromFile(
			textSource('song.lyrixa.json', VALID)
		);
		expect(result.bundle.projectName).toBe('Loader fixture');
		expect(result.origin).toEqual({
			kind: 'file',
			label: 'song.lyrixa.json'
		});
	});

	it('separates unreadable, unparseable and invalid', async () => {
		const unreadable = {
			name: 'x',
			text: () => Promise.reject(new Error('EIO'))
		};
		await expect(
			loadLyricsBundleFromFile(unreadable)
		).rejects.toMatchObject({
			reason: 'read'
		});
		await expect(
			loadLyricsBundleFromFile(textSource('x', '{ not json'))
		).rejects.toMatchObject({ reason: 'parse' });
		await expect(
			loadLyricsBundleFromFile(textSource('x', '{"app":"Other"}'))
		).rejects.toMatchObject({ reason: 'invalid' });
	});

	it('carries the origin on the error, so a message can name the file', async () => {
		const error = await loadLyricsBundleFromFile(
			textSource('broken.json', '{ not json')
		).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(LyricsBundleLoadError);
		expect((error as LyricsBundleLoadError).origin.label).toBe(
			'broken.json'
		);
	});

	it('fetches from a URL with an injected client', async () => {
		const fetchImpl = vi.fn(
			async () => new Response(VALID, { status: 200 })
		);
		const result = await loadLyricsBundleFromUrl(
			'http://localhost:7777/bundle',
			{ fetchImpl: fetchImpl as unknown as typeof fetch }
		);
		expect(result.origin.kind).toBe('url');
		expect(result.bundle.project.layers).toHaveLength(1);
	});

	it('treats a non-2xx response as unreadable, not as a bad bundle', async () => {
		const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
		await expect(
			loadLyricsBundleFromUrl('http://localhost:7777/missing', {
				fetchImpl: fetchImpl as unknown as typeof fetch
			})
		).rejects.toMatchObject({ reason: 'read' });
	});

	it('parses text that is already in hand', () => {
		const result = loadLyricsBundleFromText(VALID, {
			kind: 'ipc',
			label: 'lyrixa-desktop'
		});
		expect(result.origin.kind).toBe('ipc');
	});

	it('registers and unregisters a transport without the UI knowing it', async () => {
		const provider = {
			id: 'test-ipc',
			kind: 'ipc' as const,
			label: 'Lyrixa (desktop)',
			request: async (): Promise<LyricsBundleLoadResult | null> =>
				loadLyricsBundleFromText(VALID, {
					kind: 'ipc',
					label: 'lyrixa-desktop'
				})
		};
		const off = registerLyricsBundleProvider(provider);
		expect(getLyricsBundleProvider('test-ipc')).toBe(provider);
		expect(listLyricsBundleProviders()).toContain(provider);
		const result = await provider.request();
		expect(result?.bundle.projectName).toBe('Loader fixture');
		off();
		expect(getLyricsBundleProvider('test-ipc')).toBeUndefined();
	});
});
