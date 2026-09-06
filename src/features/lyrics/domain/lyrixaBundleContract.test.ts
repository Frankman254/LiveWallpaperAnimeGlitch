import { describe, expect, it } from 'vitest';
import { parseLyrixaLyricsBundleEnvelope } from './lyrixaBundle';
import {
	buildLyricsClipIndex,
	describeLyrixaLayers,
	groupLyricsClipsBySource,
	hasWordTimings,
	languageMatches,
	lyricsLanguageOptions,
	matchLyricsLayers,
	selectLyricsLayerIds
} from './lyricsLayerSelection';

/** A raw (unparsed) bundle, the way a Lyrixa export arrives on disk. */
function raw(project: Record<string, unknown>): unknown {
	return {
		schemaVersion: 1,
		app: 'Lyrixa',
		exportKind: 'lyrics-bundle',
		exportedAt: '2026-09-01T00:00:00.000Z',
		projectName: 'Contract fixture',
		sourceTrack: null,
		project
	};
}

/**
 * The shape this work is actually for: one song, three ways of reading it.
 * Japanese original, Spanish translation, Latin-script romanization, each line
 * of the last two pointing back at the original through `sourceId`.
 */
const TRILINGUAL = raw({
	layers: [
		{
			id: 'l-ja',
			name: '日本語',
			role: 'primary',
			language: 'ja',
			order: 0
		},
		{
			id: 'l-es',
			name: 'Español',
			layerType: 'backing',
			role: 'translation',
			language: 'es-419',
			order: 1
		},
		{
			id: 'l-ro',
			name: 'Romaji',
			role: 'romanization',
			language: 'ja-Latn',
			order: 2
		}
	],
	clips: [
		{
			id: 'c1',
			text: '君の名は',
			startTime: 1,
			endTime: 4,
			layerId: 'l-ja'
		},
		{
			id: 'c1-es',
			text: 'Tu nombre',
			startTime: 1,
			endTime: 4,
			layerId: 'l-es',
			sourceId: 'c1'
		},
		{
			id: 'c1-ro',
			text: 'kimi no na wa',
			startTime: 1,
			endTime: 4,
			layerId: 'l-ro',
			sourceId: 'c1',
			originalText: '君の名は'
		}
	]
});

describe('Lyrixa contract: roles', () => {
	it('accepts romanization alongside transliteration', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		expect(parsed.project.layers.map(l => l.role)).toEqual([
			'primary',
			'translation',
			'romanization'
		]);
	});

	it('narrows a role written in a different case, keeping the original', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L', role: 'Translation' }],
				clips: []
			})
		);
		expect(parsed.project.layers[0]?.role).toBe('translation');
		expect(parsed.project.layers[0]?.roleRaw).toBe('Translation');
	});

	it('resolves an unknown role to a safe value without losing the word', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [
					{
						id: 'l',
						name: 'L',
						layerType: 'annotation',
						role: 'chords'
					}
				],
				clips: [
					{
						id: 'c',
						text: 'Am',
						startTime: 0,
						endTime: 1,
						layerId: 'l'
					}
				]
			})
		);
		const [described] = describeLyrixaLayers(parsed);
		expect(described?.role).toBe('annotation');
		expect(described?.roleDeclared).toBe(false);
		expect(described?.roleRaw).toBe('chords');
	});

	it('infers roles the legacy way only when nothing declares one', () => {
		const legacy = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [
					{ id: 'a', name: 'A', layerType: 'lyrics', order: 0 },
					{ id: 'b', name: 'B', layerType: 'backing', order: 1 }
				],
				clips: [
					{
						id: 'c1',
						text: 'x',
						startTime: 0,
						endTime: 1,
						layerId: 'a'
					},
					{
						id: 'c2',
						text: 'y',
						startTime: 0,
						endTime: 1,
						layerId: 'b'
					}
				]
			})
		);
		// Pre-roles, the transcriptor bridge shipped translations on `backing`.
		expect(describeLyrixaLayers(legacy).map(l => l.role)).toEqual([
			'primary',
			'translation'
		]);
	});
});

describe('Lyrixa contract: languages', () => {
	it('canonicalises a tag and remembers how the author wrote it', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L', language: 'zh-hant' }],
				clips: []
			})
		);
		expect(parsed.project.layers[0]?.language).toBe('zh-Hant');
		expect(parsed.project.layers[0]?.languageRaw).toBe('zh-hant');
	});

	it('keeps a tag it cannot canonicalise rather than dropping it', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L', language: 'ja_JP' }],
				clips: []
			})
		);
		expect(parsed.project.layers[0]?.language).toBe('ja_JP');
	});

	it('matches on the primary subtag so es finds es-419', () => {
		expect(languageMatches('es', 'es-419')).toBe(true);
		expect(languageMatches('ja-Latn', 'ja')).toBe(true);
		expect(languageMatches('es', 'ja')).toBe(false);
		expect(languageMatches(undefined, 'es')).toBe(false);
	});

	it('lists the languages that actually carry clips', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		expect(lyricsLanguageOptions(parsed).map(o => o.language)).toEqual([
			'ja',
			'es-419',
			'ja-Latn'
		]);
	});
});

describe('Lyrixa contract: layer selection', () => {
	it('picks an original plus a romanization under it', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		const ids = selectLyricsLayerIds(parsed, {
			primary: { roles: ['primary'] },
			secondary: { roles: ['romanization', 'transliteration'] }
		});
		expect([...ids].sort()).toEqual(['l-ja', 'l-ro']);
	});

	it('picks a translation by language, not by layer position', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		const ids = selectLyricsLayerIds(parsed, {
			primary: { roles: ['translation'], language: 'es' }
		});
		expect([...ids]).toEqual(['l-es']);
	});

	it('skips layers that declare a role but carry no clips', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L', role: 'translation' }],
				clips: []
			})
		);
		expect(matchLyricsLayers(parsed, { roles: ['translation'] })).toEqual(
			[]
		);
		expect(
			matchLyricsLayers(parsed, {
				roles: ['translation'],
				requireClips: false
			})
		).toHaveLength(1);
	});

	it('handles more than the two layers the old flow assumed', () => {
		const many = raw({
			layers: Array.from({ length: 6 }, (_, i) => ({
				id: `l${i}`,
				name: `L${i}`,
				role: i === 0 ? 'primary' : 'translation',
				language: i === 0 ? 'ja' : `lang${i}`,
				order: i
			})),
			clips: Array.from({ length: 6 }, (_, i) => ({
				id: `c${i}`,
				text: `t${i}`,
				startTime: 0,
				endTime: 1,
				layerId: `l${i}`
			}))
		});
		const parsed = parseLyrixaLyricsBundleEnvelope(many);
		expect(
			matchLyricsLayers(parsed, { roles: ['translation'] })
		).toHaveLength(5);
	});

	it('returns nothing for a missing bundle or an empty selection', () => {
		expect(describeLyrixaLayers(null)).toEqual([]);
		expect([...selectLyricsLayerIds(null, {})]).toEqual([]);
		expect([
			...selectLyricsLayerIds(
				parseLyrixaLyricsBundleEnvelope(TRILINGUAL),
				{}
			)
		]).toEqual([]);
	});
});

describe('Lyrixa contract: sourceId relations', () => {
	it('pairs every variant with the line it came from', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		const groups = groupLyricsClipsBySource(parsed);
		expect(groups).toHaveLength(1);
		expect(groups[0]?.root.id).toBe('c1');
		expect(groups[0]?.variants.map(v => v.id).sort()).toEqual([
			'c1-es',
			'c1-ro'
		]);
	});

	it('exposes the link in both directions', () => {
		const index = buildLyricsClipIndex(
			parseLyrixaLyricsBundleEnvelope(TRILINGUAL)
		);
		expect(index.sourceOf.get('c1-es')?.id).toBe('c1');
		expect(index.derivedFrom.get('c1')).toHaveLength(2);
	});

	it('degrades to one group per clip when no sourceId is present', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L' }],
				clips: [
					{
						id: 'a',
						text: '1',
						startTime: 0,
						endTime: 1,
						layerId: 'l'
					},
					{
						id: 'b',
						text: '2',
						startTime: 1,
						endTime: 2,
						layerId: 'l'
					}
				]
			})
		);
		expect(groupLyricsClipsBySource(parsed)).toHaveLength(2);
	});

	it('ignores a sourceId pointing at a clip that is not in the bundle', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L' }],
				clips: [
					{
						id: 'a',
						text: '1',
						startTime: 0,
						endTime: 1,
						layerId: 'l',
						sourceId: 'ghost'
					}
				]
			})
		);
		const groups = groupLyricsClipsBySource(parsed);
		expect(groups).toHaveLength(1);
		expect(groups[0]?.root.id).toBe('a');
	});

	it('does not hang on a sourceId cycle', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L' }],
				clips: [
					{
						id: 'a',
						text: '1',
						startTime: 0,
						endTime: 1,
						layerId: 'l',
						sourceId: 'b'
					},
					{
						id: 'b',
						text: '2',
						startTime: 1,
						endTime: 2,
						layerId: 'l',
						sourceId: 'a'
					}
				]
			})
		);
		expect(groupLyricsClipsBySource(parsed)).toHaveLength(1);
	});
});

describe('Lyrixa contract: word timings', () => {
	it('preserves words when the bundle carries them', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L' }],
				clips: [
					{
						id: 'c',
						text: 'kimi no na wa',
						startTime: 1,
						endTime: 4,
						layerId: 'l',
						words: [
							{
								text: 'kimi',
								startTime: 1,
								endTime: 1.6,
								score: 0.98
							},
							{ text: 'no', startTime: 1.6, endTime: 1.9 },
							{ text: 'na', startTime: 1.9, endTime: 2.4 },
							{ text: 'wa', startTime: 2.4, endTime: 3.1 }
						]
					}
				]
			})
		);
		const words = parsed.project.clips[0]?.words;
		expect(words).toHaveLength(4);
		expect(words?.[0]).toEqual({
			text: 'kimi',
			startTime: 1,
			endTime: 1.6,
			score: 0.98
		});
		expect(hasWordTimings(parsed)).toBe(true);
	});

	it('leaves words undefined on a bundle without them', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(TRILINGUAL);
		expect(parsed.project.clips[0]?.words).toBeUndefined();
		expect(hasWordTimings(parsed)).toBe(false);
	});

	it('drops only the unusable words, never the whole line', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: [{ id: 'l', name: 'L' }],
				clips: [
					{
						id: 'c',
						text: 'a b',
						startTime: 0,
						endTime: 2,
						layerId: 'l',
						words: [
							{ text: 'a', startTime: 0, endTime: 1 },
							{ text: '', startTime: 1, endTime: 2 },
							{ text: 'b', startTime: 'soon', endTime: 2 },
							'nonsense',
							{ text: 'c', startTime: 3, endTime: 2, score: 4 }
						]
					}
				]
			})
		);
		const words = parsed.project.clips[0]?.words;
		expect(words?.map(w => w.text)).toEqual(['a', 'c']);
		// endTime before startTime is clamped, not trusted; score is 0–1.
		expect(words?.[1]).toEqual({
			text: 'c',
			startTime: 3,
			endTime: 3,
			score: 1
		});
	});
});

describe('Lyrixa contract: parser resilience', () => {
	it('rejects anything that is not a Lyrixa lyrics bundle', () => {
		expect(() => parseLyrixaLyricsBundleEnvelope(null)).toThrow();
		expect(() => parseLyrixaLyricsBundleEnvelope('nope')).toThrow();
		expect(() =>
			parseLyrixaLyricsBundleEnvelope({
				app: 'Something',
				exportKind: 'x'
			})
		).toThrow(/not a Lyrixa/);
		expect(() =>
			parseLyrixaLyricsBundleEnvelope({
				app: 'Lyrixa',
				exportKind: 'lyrics-bundle',
				schemaVersion: 99
			})
		).toThrow(/Unsupported/);
	});

	it('survives layers and clips that are not objects', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(
			raw({
				layers: ['nope', null, { id: 'l', name: 'L' }],
				clips: [
					42,
					{
						id: 'c',
						text: 'x',
						startTime: 0,
						endTime: 1,
						layerId: 'l'
					}
				]
			})
		);
		expect(parsed.project.layers).toHaveLength(1);
		expect(parsed.project.clips).toHaveLength(1);
	});

	it('fills in a project that is missing its arrays', () => {
		const parsed = parseLyrixaLyricsBundleEnvelope(raw({}));
		expect(parsed.project.layers).toEqual([]);
		expect(parsed.project.clips).toEqual([]);
		expect(describeLyrixaLayers(parsed)).toEqual([]);
	});
});
