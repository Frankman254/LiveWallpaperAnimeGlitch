import type {
	LyrixaLayerRole,
	LyrixaLyricClip,
	LyrixaLyricLayer,
	LyrixaLyricsBundleEnvelope
} from './lyrixaBundleTypes';

/**
 * Choosing *which* lyrics to show, separately from drawing them.
 *
 * The renderer used to answer one question — "translation on or off?" — which
 * only works while a bundle has exactly two layers and one of them is the
 * translation. Lyrixa now emits original + translation + romanization, in any
 * number of languages, and the interesting choices are "show Japanese with
 * Romaji underneath" or "show Español alone". That is a selection problem, and
 * it belongs here: no canvas, no store, no React.
 *
 * Nothing in this module reads state. Callers pass a bundle and a query and get
 * layer ids back; the store decides what the query is and the renderer decides
 * how the result looks.
 */

/** A layer with its role resolved and its clips counted. */
export interface LyricsLayerDescriptor {
	id: string;
	name: string;
	/** Resolved role — declared when the bundle said so, inferred otherwise. */
	role: LyrixaLayerRole;
	/** True when the bundle declared a role this build understands. */
	roleDeclared: boolean;
	/**
	 * The author's role word when it is not one this build knows
	 * (`'karaoke'`, say). `role` then holds the closest fallback, so switching
	 * on `role` stays safe while a UI can still show what the bundle meant.
	 */
	roleRaw?: string;
	/** Canonical BCP-47 tag, when the bundle declared one. */
	language?: string;
	/** The author's spelling, when canonicalisation changed it. */
	languageRaw?: string;
	/** How many clips actually sit on this layer. */
	clipCount: number;
	order: number;
	visible: boolean;
}

/** What a caller is looking for. An empty query matches every layer. */
export interface LyricsLayerQuery {
	/** Any one of these roles matches. Omitted means "any role". */
	roles?: readonly LyrixaLayerRole[];
	/**
	 * BCP-47 tag. Matched on the primary subtag, so `es` finds `es-419` and
	 * vice versa — a user picking "Español" should not have to know which
	 * regional tag the transcriber happened to emit.
	 */
	language?: string;
	/** Skip layers with no clips on them. Defaults to true. */
	requireClips?: boolean;
}

/**
 * What the viewer wants on screen: one main line, optionally a second under it.
 *
 * Two slots rather than an arbitrary list because that is the shape of the
 * thing users actually ask for — "original plus romaji", "original plus
 * translation" — and because stacked lyrics stop being readable past two.
 */
export interface LyricsDisplaySelection {
	primary?: LyricsLayerQuery | null;
	secondary?: LyricsLayerQuery | null;
}

/**
 * The role a layer carries when the bundle did not declare one.
 *
 * This is the pre-role bundle shape, and the mapping is not cosmetic: the old
 * transcriptor bridge put *translations* on the backing channel, so a legacy
 * `backing` layer means translation. Once any layer declares a role the bundle
 * is speaking the new language, and `backing` means backing vocals again —
 * which is why this is only ever called with `anyRoleDeclared: false`.
 */
function inferLegacyRole(layer: LyrixaLyricLayer): LyrixaLayerRole {
	switch (layer.layerType) {
		case 'backing':
			return 'translation';
		case 'fx':
			return 'fx';
		case 'annotation':
			return 'annotation';
		default:
			return 'primary';
	}
}

/** The role of a layer whose declared role this build does not recognise. */
function fallbackRole(layer: LyrixaLyricLayer): LyrixaLayerRole {
	switch (layer.layerType) {
		case 'backing':
			return 'backing';
		case 'fx':
			return 'fx';
		case 'annotation':
			return 'annotation';
		default:
			return 'primary';
	}
}

/** The primary subtag of a BCP-47 tag: `es-419` → `es`. */
function primarySubtag(tag: string): string {
	const cut = tag.indexOf('-');
	return (cut === -1 ? tag : tag.slice(0, cut)).toLowerCase();
}

/** Do these two language tags refer to the same language? */
export function languageMatches(
	a: string | undefined,
	b: string | undefined
): boolean {
	if (!a || !b) return false;
	if (a === b) return true;
	return primarySubtag(a) === primarySubtag(b);
}

/**
 * Every layer in the bundle, with its role resolved and its clips counted.
 *
 * This is the one place role resolution happens. Callers that need to know
 * what a layer carries go through here rather than reading `layer.role`
 * directly, so the legacy fallback lives in exactly one function.
 */
export function describeLyrixaLayers(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): LyricsLayerDescriptor[] {
	const layers = bundle?.project.layers ?? [];
	if (layers.length === 0) return [];

	const anyRoleDeclared = layers.some(layer => layer.role || layer.roleRaw);
	const clipCounts = new Map<string, number>();
	for (const clip of bundle?.project.clips ?? []) {
		clipCounts.set(clip.layerId, (clipCounts.get(clip.layerId) ?? 0) + 1);
	}

	return layers
		.map(layer => ({
			id: layer.id,
			name: layer.name,
			role: layer.role
				? layer.role
				: anyRoleDeclared
					? fallbackRole(layer)
					: inferLegacyRole(layer),
			roleDeclared: Boolean(layer.role),
			roleRaw: layer.roleRaw,
			language: layer.language,
			languageRaw: layer.languageRaw,
			clipCount: clipCounts.get(layer.id) ?? 0,
			order: layer.order,
			visible: layer.visible !== false
		}))
		.sort((a, b) => a.order - b.order);
}

/** The layers matching a query, in layer order. */
export function matchLyricsLayers(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined,
	query: LyricsLayerQuery | null | undefined
): LyricsLayerDescriptor[] {
	if (!query) return [];
	const requireClips = query.requireClips !== false;
	return describeLyrixaLayers(bundle).filter(layer => {
		if (requireClips && layer.clipCount === 0) return false;
		if (query.roles && !query.roles.includes(layer.role)) return false;
		if (query.language && !languageMatches(layer.language, query.language))
			return false;
		return true;
	});
}

/**
 * Resolve a display selection to the set of layer ids that should render.
 *
 * Returns a Set because that is what both render paths already consume for
 * visibility, and because a layer matched by both slots must appear once.
 */
export function selectLyricsLayerIds(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined,
	selection: LyricsDisplaySelection
): Set<string> {
	const ids = new Set<string>();
	for (const query of [selection.primary, selection.secondary]) {
		for (const layer of matchLyricsLayers(bundle, query)) ids.add(layer.id);
	}
	return ids;
}

/** The distinct languages present, in layer order, for labelling a picker. */
export function lyricsLanguageOptions(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): Array<{ language: string; label: string; roles: LyrixaLayerRole[] }> {
	const byLanguage = new Map<
		string,
		{ language: string; label: string; roles: LyrixaLayerRole[] }
	>();
	for (const layer of describeLyrixaLayers(bundle)) {
		if (!layer.language || layer.clipCount === 0) continue;
		const existing = byLanguage.get(layer.language);
		if (existing) {
			if (!existing.roles.includes(layer.role))
				existing.roles.push(layer.role);
			continue;
		}
		byLanguage.set(layer.language, {
			language: layer.language,
			label: layer.languageRaw ?? layer.language,
			roles: [layer.role]
		});
	}
	return [...byLanguage.values()];
}

/**
 * Clips indexed by id, with the `sourceId` links resolved in both directions.
 *
 * `sourceId` is how Lyrixa says "this Spanish line is that Japanese line" —
 * the only honest way to pair an original with its translation and its
 * romanization. Position-in-array pairing would break the moment a translator
 * merges two lines into one, which is exactly what translators do.
 */
export interface LyricsClipIndex {
	byId: Map<string, LyrixaLyricClip>;
	/** clip id → the clip it derives from, when that clip exists. */
	sourceOf: Map<string, LyrixaLyricClip>;
	/** clip id → the clips that derive from it. */
	derivedFrom: Map<string, LyrixaLyricClip[]>;
}

export function buildLyricsClipIndex(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): LyricsClipIndex {
	const byId = new Map<string, LyrixaLyricClip>();
	const sourceOf = new Map<string, LyrixaLyricClip>();
	const derivedFrom = new Map<string, LyrixaLyricClip[]>();
	for (const clip of bundle?.project.clips ?? []) byId.set(clip.id, clip);
	for (const clip of byId.values()) {
		if (!clip.sourceId || clip.sourceId === clip.id) continue;
		const source = byId.get(clip.sourceId);
		if (!source) continue;
		sourceOf.set(clip.id, source);
		const list = derivedFrom.get(source.id);
		if (list) list.push(clip);
		else derivedFrom.set(source.id, [clip]);
	}
	return { byId, sourceOf, derivedFrom };
}

/** One line of the song and every variant of it, keyed by the original clip. */
export interface LyricsLineGroup {
	root: LyrixaLyricClip;
	/** Translations, romanizations and any other derived clip. */
	variants: LyrixaLyricClip[];
}

/**
 * Group clips into one entry per line of the song.
 *
 * A clip with no resolvable `sourceId` is its own root, so a bundle without
 * `sourceId` anywhere degrades to one group per clip rather than to nothing.
 * Cycles (`a → b → a`, which a buggy exporter can produce) are broken by
 * treating the first clip revisited as a root instead of looping forever.
 */
export function groupLyricsClipsBySource(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): LyricsLineGroup[] {
	const index = buildLyricsClipIndex(bundle);
	const rootIdCache = new Map<string, string>();

	function rootIdOf(clip: LyrixaLyricClip): string {
		const cached = rootIdCache.get(clip.id);
		if (cached) return cached;
		const seen = new Set<string>([clip.id]);
		let current = clip;
		for (;;) {
			const source = index.sourceOf.get(current.id);
			if (!source || seen.has(source.id)) break;
			seen.add(source.id);
			current = source;
		}
		for (const id of seen) rootIdCache.set(id, current.id);
		return current.id;
	}

	const groups = new Map<string, LyricsLineGroup>();
	for (const clip of index.byId.values()) {
		const rootId = rootIdOf(clip);
		const root = index.byId.get(rootId);
		if (!root) continue;
		const group = groups.get(rootId);
		if (group) {
			if (clip.id !== rootId) group.variants.push(clip);
		} else {
			groups.set(rootId, {
				root,
				variants: clip.id === rootId ? [] : [clip]
			});
		}
	}
	for (const group of groups.values()) {
		group.variants.sort((a, b) => a.startTime - b.startTime);
	}
	return [...groups.values()].sort(
		(a, b) => a.root.startTime - b.root.startTime
	);
}

/** Does any clip in this bundle carry word-level timings? */
export function hasWordTimings(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): boolean {
	return (bundle?.project.clips ?? []).some(
		clip => (clip.words?.length ?? 0) > 0
	);
}
