import { describe, expect, it } from 'vitest';
import {
	defaultTranslationLayerOffsets,
	hasTranslationLayer,
	parseLyrixaLyricsBundleEnvelope,
	translationLanguages,
	translationLayerIds
} from './lyrixaBundle';
import type {
	LyrixaLyricClip,
	LyrixaLyricLayer,
	LyrixaLyricsBundleEnvelope
} from './lyrixaBundleTypes';

function layer(patch: Partial<LyrixaLyricLayer>): LyrixaLyricLayer {
	return {
		id: 'layer-main',
		name: 'Main',
		layerType: 'lyrics',
		color: '#ffffff',
		visible: true,
		locked: false,
		order: 0,
		...patch
	};
}

function bundle(
	layers: LyrixaLyricLayer[],
	clipLayerIds: string[] = layers.map(l => l.id)
): LyrixaLyricsBundleEnvelope {
	return {
		schemaVersion: 1,
		app: 'Lyrixa',
		exportKind: 'lyrics-bundle',
		exportedAt: '2026-08-25T00:00:00.000Z',
		projectName: 'Test',
		sourceTrack: null,
		project: {
			rawLyricsText: '',
			normalizedLyrics: [],
			layers,
			clips: clipLayerIds.map((layerId, index) => ({
				id: `clip-${index}`,
				text: `line ${index}`,
				startTime: index,
				endTime: index + 1,
				layerId
			})),
			styleConfig: {},
			animationConfig: {},
			fxConfig: {},
			progressIndicatorConfig: {}
		}
	};
}

function bundleWithClips(
	layers: LyrixaLyricLayer[],
	clips: Array<Partial<LyrixaLyricClip> & { layerId: string }>
): LyrixaLyricsBundleEnvelope {
	const base = bundle(layers, []);
	return {
		...base,
		project: {
			...base.project,
			clips: clips.map((clip, index) => ({
				id: `clip-${index}`,
				text: `line ${index}`,
				startTime: index,
				endTime: index + 1,
				...clip
			}))
		}
	};
}

describe('translation layer detection', () => {
	it('finds the layer that declares the translation role', () => {
		const envelope = bundle([
			layer({ id: 'layer-main', role: 'primary', language: 'ja' }),
			layer({
				id: 'layer-backing',
				layerType: 'backing',
				role: 'translation',
				language: 'es',
				order: 1
			})
		]);
		expect([...translationLayerIds(envelope)]).toEqual(['layer-backing']);
		expect(hasTranslationLayer(envelope)).toBe(true);
		expect(translationLanguages(envelope)).toEqual(['es']);
	});

	it('does not treat a declared backing-vocal layer as a translation', () => {
		// The whole point of the role field: same layerType, different meaning.
		const envelope = bundle([
			layer({ id: 'layer-main', role: 'primary' }),
			layer({
				id: 'layer-backing',
				layerType: 'backing',
				role: 'backing',
				order: 1
			})
		]);
		expect(hasTranslationLayer(envelope)).toBe(false);
	});

	it('falls back to the backing channel on bundles authored before roles', () => {
		const envelope = bundle([
			layer({ id: 'layer-main' }),
			layer({ id: 'layer-backing', layerType: 'backing', order: 1 })
		]);
		expect([...translationLayerIds(envelope)]).toEqual(['layer-backing']);
		expect(hasTranslationLayer(envelope)).toBe(true);
	});

	it('reports no translation when the layer exists but carries no clips', () => {
		const envelope = bundle(
			[
				layer({ id: 'layer-main', role: 'primary' }),
				layer({
					id: 'layer-backing',
					layerType: 'backing',
					role: 'translation',
					order: 1
				})
			],
			['layer-main']
		);
		expect(hasTranslationLayer(envelope)).toBe(false);
	});

	it('handles a missing bundle', () => {
		expect(hasTranslationLayer(null)).toBe(false);
		expect([...translationLayerIds(undefined)]).toEqual([]);
		expect(translationLanguages(null)).toEqual([]);
	});
});

describe('bundle parsing of the translation contract', () => {
	it('keeps role, language, sourceId and originalText', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope({
			schemaVersion: 1,
			app: 'Lyrixa',
			exportKind: 'lyrics-bundle',
			exportedAt: '2026-08-25T00:00:00.000Z',
			projectName: 'Test',
			sourceTrack: null,
			project: {
				layers: [
					{
						id: 'layer-backing',
						name: 'Traducción · es',
						layerType: 'backing',
						role: 'translation',
						language: 'es'
					}
				],
				clips: [
					{
						id: 'clip-0000-t',
						text: 'No olvidaré tu nombre',
						startTime: 1,
						endTime: 4,
						layerId: 'layer-backing',
						sourceId: 'clip-0000',
						originalText: 'kimi no na wa wasurenai'
					}
				]
			}
		});
		const [parsedLayer] = parsed.project.layers;
		expect(parsedLayer?.role).toBe('translation');
		expect(parsedLayer?.language).toBe('es');
		const [clip] = parsed.project.clips;
		expect(clip?.sourceId).toBe('clip-0000');
		expect(clip?.originalText).toBe('kimi no na wa wasurenai');
	});

	it('keeps a role it does not understand instead of dropping it', () => {
		// This used to assert the opposite. Discarding the role made the import
		// lossy exactly where Lyrixa is most likely to move ahead of this
		// renderer, and worse, it made the layer fall through to the legacy
		// layerType guess — throwing away a declaration the bundle had made.
		const parsed = parseLyrixaLyricsBundleEnvelope({
			schemaVersion: 1,
			app: 'Lyrixa',
			exportKind: 'lyrics-bundle',
			exportedAt: '2026-08-25T00:00:00.000Z',
			projectName: 'Test',
			sourceTrack: null,
			project: {
				layers: [{ id: 'layer-main', name: 'Main', role: 'karaoke' }],
				clips: []
			}
		});
		expect(parsed.project.layers[0]?.role).toBeUndefined();
		expect(parsed.project.layers[0]?.roleRaw).toBe('karaoke');
	});

	it('does not fall back to legacy inference once any role is declared', () => {
		// A bundle whose only declaration is one this build cannot narrow still
		// counts as a roles-era bundle: backing means backing vocals, not
		// translation.
		const envelope = bundle([
			layer({ id: 'layer-main', roleRaw: 'karaoke' }),
			layer({ id: 'layer-backing', layerType: 'backing', order: 1 })
		]);
		expect(hasTranslationLayer(envelope)).toBe(false);
	});
});

describe('defaultTranslationLayerOffsets', () => {
	const main = layer({ id: 'layer-main' });
	const translation = layer({ id: 'layer-tr', role: 'translation' });

	it('pushes an unpositioned translation layer below centre', () => {
		const offsets = defaultTranslationLayerOffsets(
			bundle([main, translation])
		);
		expect(offsets['layer-tr']).toEqual({ positionOffsetY: -0.15 });
		expect(offsets['layer-main']).toBeUndefined();
	});

	it('leaves a translation layer with per-clip coords alone', () => {
		const offsets = defaultTranslationLayerOffsets(
			bundleWithClips(
				[main, translation],
				[
					{ layerId: 'layer-main' },
					{ layerId: 'layer-tr', coords: { x: 0.5, y: 0.8 } }
				]
			)
		);
		expect(offsets).toEqual({});
	});

	it('leaves a translation layer with a non-centre clip position alone', () => {
		const offsets = defaultTranslationLayerOffsets(
			bundleWithClips(
				[main, translation],
				[
					{ layerId: 'layer-main' },
					{ layerId: 'layer-tr', position: 'bottom' }
				]
			)
		);
		expect(offsets).toEqual({});
	});

	it('leaves a translation layer with a non-centre layer preset alone', () => {
		const offsets = defaultTranslationLayerOffsets(
			bundle([
				main,
				layer({
					id: 'layer-tr',
					role: 'translation',
					renderSettings: { positionPreset: 'bottom' }
				})
			])
		);
		expect(offsets).toEqual({});
	});

	it('a centre preset is not positioning', () => {
		const offsets = defaultTranslationLayerOffsets(
			bundle([
				main,
				layer({
					id: 'layer-tr',
					role: 'translation',
					renderSettings: { positionPreset: 'center' }
				})
			])
		);
		expect(offsets['layer-tr']).toEqual({ positionOffsetY: -0.15 });
	});

	it('handles a bundle without translation layers', () => {
		expect(defaultTranslationLayerOffsets(bundle([main]))).toEqual({});
		expect(defaultTranslationLayerOffsets(null)).toEqual({});
	});
});
