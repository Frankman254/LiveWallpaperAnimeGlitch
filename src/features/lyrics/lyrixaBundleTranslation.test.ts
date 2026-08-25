import { describe, expect, it } from 'vitest';
import {
	hasTranslationLayer,
	parseLyrixaLyricsBundleEnvelope,
	translationLanguages,
	translationLayerIds
} from './lyrixaBundle';
import type {
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

	it('drops a role it does not understand instead of forwarding it', () => {
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
	});
});
