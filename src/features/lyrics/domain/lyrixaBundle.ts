import type {
	LyrixaClipProgressIndicatorConfig,
	LyrixaLyricAnimationConfig,
	LyrixaLyricClip,
	LyrixaLyricFxConfig,
	LyrixaLyricWord,
	LyrixaLyricLayer,
	LyrixaLyricTransitionPreset,
	LyrixaLyricVisualStyle,
	LyrixaClipPositionPreset,
	LyrixaLayerAudioReactive,
	LyrixaLayerRole,
	LyrixaLyricsBundleEnvelope,
	LyrixaLyricsBundleProject,
	LyrixaLyricsBundleSourceTrack,
	LyrixaLayerType,
	LyrixaTextFillConfig
} from './lyrixaBundleTypes';
import type { LyrixaLayerOverrideMap } from './types';
import {
	DEFAULT_LYRIXA_LYRIC_STYLE,
	LYRIXA_LAYER_ROLES,
	LYRIXA_LYRICS_BUNDLE_APP,
	LYRIXA_LYRICS_BUNDLE_KIND,
	LYRIXA_LYRICS_BUNDLE_SCHEMA_VERSION
} from './lyrixaBundleTypes';

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isLyrixaTransitionPreset(
	value: unknown
): value is LyrixaLyricTransitionPreset {
	return (
		value === 'none' ||
		value === 'fade' ||
		value === 'fade-out' ||
		value === 'slide-up' ||
		value === 'slide-down' ||
		value === 'scale-in' ||
		value === 'scale-out' ||
		value === 'blur-in' ||
		value === 'blur-out' ||
		value === 'glow-pop' ||
		value === 'glitch-in' ||
		value === 'glitch-out' ||
		value === 'zoom-in' ||
		value === 'zoom-out'
	);
}

function isLyrixaClipPositionPreset(
	value: unknown
): value is LyrixaClipPositionPreset {
	return (
		value === 'center' ||
		value === 'top' ||
		value === 'bottom' ||
		value === 'top-left' ||
		value === 'top-right' ||
		value === 'bottom-left' ||
		value === 'bottom-right'
	);
}

function isLyrixaLayerType(value: unknown): value is LyrixaLayerType {
	return (
		value === 'lyrics' ||
		value === 'backing' ||
		value === 'fx' ||
		value === 'annotation'
	);
}

function isLyrixaLayerRole(value: unknown): value is LyrixaLayerRole {
	return (
		typeof value === 'string' &&
		(LYRIXA_LAYER_ROLES as readonly string[]).includes(value)
	);
}

/**
 * Split a declared role into the narrowed value and the raw string.
 *
 * A role this build does not know is NOT an error and NOT noise: Lyrixa ships
 * on its own schedule, so `role: 'karaoke'` from a newer authoring build is the
 * expected shape of the future. Narrowing it away would silently downgrade the
 * layer to "no role at all", which then falls through to the legacy
 * `layerType`-based guess — the worst outcome, because the bundle DID say what
 * the layer was and we chose to forget.
 *
 * So: `role` stays strictly typed for the code that switches on it, and
 * `roleRaw` carries the author's word whenever the two differ.
 */
function normalizeRole(value: unknown): {
	role?: LyrixaLayerRole;
	roleRaw?: string;
} {
	if (typeof value !== 'string') return {};
	const trimmed = value.trim();
	if (!trimmed) return {};
	const lower = trimmed.toLowerCase();
	if (isLyrixaLayerRole(lower)) {
		return lower === trimmed
			? { role: lower }
			: { role: lower, roleRaw: trimmed };
	}
	return { roleRaw: trimmed };
}

/**
 * Canonicalise a BCP-47 tag (`JA` → `ja`, `zh-hant` → `zh-Hant`).
 *
 * Normalising matters because language is about to become a *selector*: a user
 * picking "Español" must match a layer whether Lyrixa wrote `es`, `ES` or
 * `es-419`. `languageRaw` keeps the author's spelling for display, and is only
 * set when canonicalisation actually changed something.
 *
 * `Intl.getCanonicalLocales` throws on structurally invalid tags (`ja_JP`,
 * `español`). Those are kept verbatim rather than dropped — an odd tag is still
 * a distinguishable one, and losing it would merge two layers that the author
 * meant to keep apart.
 */
function normalizeLanguage(value: unknown): {
	language?: string;
	languageRaw?: string;
} {
	if (typeof value !== 'string') return {};
	const trimmed = value.trim();
	if (!trimmed) return {};
	let canonical = trimmed;
	try {
		canonical = Intl.getCanonicalLocales(trimmed)[0] ?? trimmed;
	} catch {
		canonical = trimmed;
	}
	return canonical === trimmed
		? { language: canonical }
		: { language: canonical, languageRaw: trimmed };
}

/**
 * Word-level timings, when the bundle carries them.
 *
 * Nothing draws these yet. They are parsed anyway so that importing a
 * word-timed bundle and saving the project is not a lossy round trip — see
 * `LyrixaLyricWord`. Words that are unusable (no text, non-finite times) are
 * dropped individually rather than failing the clip: a transcriber emitting one
 * bad word should not cost the user the whole line.
 */
function parseWords(value: unknown): LyrixaLyricWord[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const words: LyrixaLyricWord[] = [];
	for (const entry of value) {
		if (!isObject(entry)) continue;
		const text = typeof entry.text === 'string' ? entry.text : '';
		if (!text) continue;
		const startTime = toOptionalNumber(entry.startTime);
		const endTime = toOptionalNumber(entry.endTime);
		if (startTime === undefined || endTime === undefined) continue;
		const start = Math.max(0, startTime);
		const word: LyrixaLyricWord = {
			text,
			startTime: start,
			endTime: Math.max(start, endTime)
		};
		const score = toOptionalNumber(entry.score);
		if (score !== undefined) word.score = Math.min(1, Math.max(0, score));
		words.push(word);
	}
	return words.length > 0 ? words : undefined;
}

/**
 * The layers whose text is a translation of another layer.
 *
 * Falls back to `layerType === 'backing'` only when NO layer declares a role:
 * that is the pre-role bundle shape, where the transcriptor bridge already put
 * translations on the backing channel. Once any layer declares a role, the
 * declaration is authoritative and a backing layer means backing vocals again.
 */
export function translationLayerIds(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): Set<string> {
	const layers = bundle?.project.layers ?? [];
	const declared = layers.some(layer => layer.role || layer.roleRaw);
	return new Set(
		layers
			.filter(layer =>
				declared
					? layer.role === 'translation'
					: layer.layerType === 'backing'
			)
			.map(layer => layer.id)
	);
}

/** Does this bundle carry a translation layer with clips on it? */
export function hasTranslationLayer(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): boolean {
	if (!bundle) return false;
	const ids = translationLayerIds(bundle);
	if (ids.size === 0) return false;
	return bundle.project.clips.some(clip => ids.has(clip.layerId));
}

/** How far below centre (fraction of canvas height) an unpositioned
 *  translation layer is pushed on import so it doesn't sit on the main
 *  lyrics. Negative `positionOffsetY` moves down. */
const DEFAULT_TRANSLATION_OFFSET_Y = -0.15;

/**
 * Free-form `coords` a clip should render at, or `undefined` when a named
 * position wins. Lyrixa's contract (`core/types/clip.ts`): a non-centre
 * `position` preset takes priority over `coords`; `'center'` is the default
 * every clip starts with, so it counts as "no preset". Both renderers go
 * through this so editor and bundle modes agree.
 */
export function resolveClipCoords(
	clip: Pick<LyrixaLyricClip, 'coords' | 'position'>
): LyrixaLyricClip['coords'] {
	if (clip.position && clip.position !== 'center') return undefined;
	return clip.coords;
}

/**
 * Layer overrides to seed on import so a translation layer that carries no
 * positioning of its own doesn't render on top of the main lyrics.
 *
 * A translation layer counts as "already positioned" when any of its clips
 * carries free `coords` or a non-centre `position`, or the layer declares a
 * non-centre `renderSettings.positionPreset`. Those bundles respect the
 * author's layout and get no seeded offset.
 */
export function defaultTranslationLayerOffsets(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): LyrixaLayerOverrideMap {
	if (!bundle) return {};
	const ids = translationLayerIds(bundle);
	if (ids.size === 0) return {};

	const positioned = new Set<string>();
	for (const clip of bundle.project.clips) {
		if (!ids.has(clip.layerId)) continue;
		if (clip.coords || (clip.position && clip.position !== 'center')) {
			positioned.add(clip.layerId);
		}
	}

	const result: LyrixaLayerOverrideMap = {};
	for (const layer of bundle.project.layers ?? []) {
		if (!ids.has(layer.id) || positioned.has(layer.id)) continue;
		const preset = layer.renderSettings?.positionPreset;
		if (preset && preset !== 'center') continue;
		result[layer.id] = { positionOffsetY: DEFAULT_TRANSLATION_OFFSET_Y };
	}
	return result;
}

/** Language codes of the translation layers, for labelling the UI. */
export function translationLanguages(
	bundle: LyrixaLyricsBundleEnvelope | null | undefined
): string[] {
	const ids = translationLayerIds(bundle);
	return (bundle?.project.layers ?? [])
		.filter(layer => ids.has(layer.id) && layer.language)
		.map(layer => layer.language as string);
}

function isTextAlign(value: unknown): value is 'left' | 'center' | 'right' {
	return value === 'left' || value === 'center' || value === 'right';
}

function toFiniteNumber(value: unknown, fallback: number): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : undefined;
}

function parseStringRecordArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

function parseTextFill(value: unknown): LyrixaTextFillConfig | undefined {
	if (!isObject(value)) return undefined;
	const type =
		value.type === 'gradient' || value.type === 'image-texture'
			? value.type
			: 'solid';
	const next: LyrixaTextFillConfig = { type };
	if (typeof value.solidColor === 'string')
		next.solidColor = value.solidColor;
	if (isObject(value.gradient)) {
		next.gradient = {
			colorA:
				typeof value.gradient.colorA === 'string'
					? value.gradient.colorA
					: '#ffffff',
			colorB:
				typeof value.gradient.colorB === 'string'
					? value.gradient.colorB
					: '#80eaff',
			angle: toFiniteNumber(value.gradient.angle, 110)
		};
	}
	if (isObject(value.imageTexture)) {
		const tex = value.imageTexture;
		next.imageTexture = {
			id: typeof tex.id === 'string' ? tex.id : '',
			objectUrl:
				typeof tex.objectUrl === 'string' ? tex.objectUrl : undefined,
			opacity: toFiniteNumber(tex.opacity, 1),
			scale: toFiniteNumber(tex.scale, 1),
			offsetX: toFiniteNumber(tex.offsetX, 0),
			offsetY: toFiniteNumber(tex.offsetY, 0),
			fit: tex.fit === 'contain' ? 'contain' : 'cover',
			missing: tex.missing === true ? true : undefined,
			fileName:
				typeof tex.fileName === 'string' ? tex.fileName : undefined
		};
	}
	return next;
}

function parseStyle(value: unknown): LyrixaLyricVisualStyle {
	if (!isObject(value)) return {};
	const style = { ...(value as LyrixaLyricVisualStyle) };
	const textFill = parseTextFill(value.textFill);
	if (textFill) style.textFill = textFill;
	else delete style.textFill;
	return style;
}

function parseAnimation(value: unknown): LyrixaLyricAnimationConfig {
	return isObject(value) ? (value as LyrixaLyricAnimationConfig) : {};
}

function parseFx(value: unknown): LyrixaLyricFxConfig {
	return isObject(value) ? (value as LyrixaLyricFxConfig) : {};
}

function parseProgress(value: unknown): LyrixaClipProgressIndicatorConfig {
	return isObject(value) ? (value as LyrixaClipProgressIndicatorConfig) : {};
}

function parseAudioReactive(
	value: unknown
): LyrixaLayerAudioReactive | undefined {
	if (!isObject(value)) return undefined;
	return {
		enabled: value.enabled !== false,
		source:
			value.source === 'master' ||
			value.source === 'vocals-stem' ||
			value.source === 'estimated'
				? value.source
				: 'estimated',
		bandMode:
			value.bandMode === 'full-mix' ||
			value.bandMode === 'vocals' ||
			value.bandMode === 'instrumental' ||
			value.bandMode === 'kick' ||
			value.bandMode === 'bass' ||
			value.bandMode === 'hihat'
				? value.bandMode
				: 'full-mix',
		responseMode:
			value.responseMode === 'peak' || value.responseMode === 'envelope'
				? value.responseMode
				: 'envelope',
		attackMs: Math.max(0, toFiniteNumber(value.attackMs, 0)),
		releaseMs: Math.max(0, toFiniteNumber(value.releaseMs, 160)),
		threshold: toFiniteNumber(value.threshold, 0.2),
		softness: toFiniteNumber(value.softness, 0.25),
		invert: Boolean(value.invert),
		targets: isObject(value.targets)
			? (value.targets as LyrixaLayerAudioReactive['targets'])
			: {}
	};
}

function parseClip(value: unknown, index: number): LyrixaLyricClip | null {
	if (!isObject(value)) return null;
	const text = typeof value.text === 'string' ? value.text : '';
	const startTime = Math.max(0, toFiniteNumber(value.startTime, 0));
	const endTime = Math.max(
		startTime + 0.001,
		toFiniteNumber(value.endTime, startTime + 3)
	);
	return {
		id:
			typeof value.id === 'string' && value.id
				? value.id
				: `clip-${index}`,
		text,
		startTime,
		endTime,
		layerId:
			typeof value.layerId === 'string' && value.layerId
				? value.layerId
				: 'layer-main',
		sourceId:
			typeof value.sourceId === 'string' && value.sourceId
				? value.sourceId
				: undefined,
		originalText:
			typeof value.originalText === 'string' && value.originalText
				? value.originalText
				: undefined,
		words: parseWords(value.words),
		styleId: typeof value.styleId === 'string' ? value.styleId : undefined,
		styleOverride: parseStyle(value.styleOverride),
		animationOverride: parseAnimation(value.animationOverride),
		fxOverride: parseFx(value.fxOverride),
		progressIndicatorOverride: parseProgress(
			value.progressIndicatorOverride
		),
		transitionIn: isLyrixaTransitionPreset(value.transitionIn)
			? value.transitionIn
			: undefined,
		transitionOut: isLyrixaTransitionPreset(value.transitionOut)
			? value.transitionOut
			: undefined,
		position: isLyrixaClipPositionPreset(value.position)
			? value.position
			: undefined,
		coords:
			isObject(value.coords) &&
			Number.isFinite(Number(value.coords.x)) &&
			Number.isFinite(Number(value.coords.y))
				? {
						x: Number(value.coords.x),
						y: Number(value.coords.y)
					}
				: undefined,
		locked: Boolean(value.locked),
		muted: Boolean(value.muted),
		forceTextRender: Boolean(value.forceTextRender)
	};
}

function parseLayer(value: unknown, index: number): LyrixaLyricLayer | null {
	if (!isObject(value)) return null;
	return {
		id:
			typeof value.id === 'string' && value.id
				? value.id
				: `layer-${index}`,
		name:
			typeof value.name === 'string' && value.name
				? value.name
				: `Layer ${index + 1}`,
		layerType: isLyrixaLayerType(value.layerType)
			? value.layerType
			: 'lyrics',
		...normalizeRole(value.role),
		...normalizeLanguage(value.language),
		color:
			typeof value.color === 'string' && value.color
				? value.color
				: '#ffffff',
		visible: value.visible !== false,
		locked: Boolean(value.locked),
		order: Math.round(toFiniteNumber(value.order, index)),
		renderSettings: isObject(value.renderSettings)
			? {
					positionPreset: isLyrixaClipPositionPreset(
						value.renderSettings.positionPreset
					)
						? value.renderSettings.positionPreset
						: 'center',
					textAlign: isTextAlign(value.renderSettings.textAlign)
						? value.renderSettings.textAlign
						: undefined,
					zIndex: toOptionalNumber(value.renderSettings.zIndex),
					suppressClipText: Boolean(
						value.renderSettings.suppressClipText
					)
				}
			: undefined,
		styleDefaults: parseStyle(value.styleDefaults ?? value.style),
		animationDefaults: parseAnimation(
			value.animationDefaults ?? value.animation
		),
		fxDefaults: parseFx(value.fxDefaults ?? value.fx),
		progressIndicatorDefaults: parseProgress(
			value.progressIndicatorDefaults ?? value.progressIndicator
		),
		audioReactive: parseAudioReactive(value.audioReactive)
	};
}

function parseProject(value: unknown): LyrixaLyricsBundleProject {
	if (!isObject(value)) {
		throw new Error('Lyrixa lyrics bundle is missing its project payload.');
	}
	return {
		rawLyricsText:
			typeof value.rawLyricsText === 'string' ? value.rawLyricsText : '',
		normalizedLyrics: parseStringRecordArray(value.normalizedLyrics),
		layers: Array.isArray(value.layers)
			? value.layers
					.map(parseLayer)
					.filter((item): item is LyrixaLyricLayer => item !== null)
			: [],
		clips: Array.isArray(value.clips)
			? value.clips
					.map(parseClip)
					.filter((item): item is LyrixaLyricClip => item !== null)
			: [],
		styleConfig: parseStyle(value.styleConfig),
		animationConfig: parseAnimation(value.animationConfig),
		fxConfig: parseFx(value.fxConfig),
		progressIndicatorConfig: parseProgress(value.progressIndicatorConfig)
	};
}

function parseSourceTrack(
	value: unknown
): LyrixaLyricsBundleSourceTrack | null {
	if (!isObject(value)) return null;
	return {
		fileName: typeof value.fileName === 'string' ? value.fileName : '',
		durationMs: Math.max(
			0,
			Math.round(toFiniteNumber(value.durationMs, 0))
		),
		fileKey: typeof value.fileKey === 'string' ? value.fileKey : undefined,
		sizeBytes: toOptionalNumber(value.sizeBytes),
		lastModified: toOptionalNumber(value.lastModified)
	};
}

export function parseLyrixaLyricsBundleEnvelope(
	raw: unknown
): LyrixaLyricsBundleEnvelope {
	if (!isObject(raw)) throw new Error('Invalid Lyrixa lyrics bundle.');
	if (raw.app !== LYRIXA_LYRICS_BUNDLE_APP) {
		throw new Error('This file is not a Lyrixa lyrics bundle.');
	}
	if (raw.exportKind !== LYRIXA_LYRICS_BUNDLE_KIND) {
		throw new Error('This file is not a Lyrixa lyrics bundle.');
	}
	if (raw.schemaVersion !== LYRIXA_LYRICS_BUNDLE_SCHEMA_VERSION) {
		throw new Error(
			`Unsupported Lyrixa lyrics bundle version: ${String(
				raw.schemaVersion
			)}`
		);
	}

	return {
		schemaVersion: LYRIXA_LYRICS_BUNDLE_SCHEMA_VERSION,
		app: LYRIXA_LYRICS_BUNDLE_APP,
		exportKind: LYRIXA_LYRICS_BUNDLE_KIND,
		exportedAt:
			typeof raw.exportedAt === 'string'
				? raw.exportedAt
				: new Date().toISOString(),
		projectName:
			typeof raw.projectName === 'string'
				? raw.projectName
				: 'Imported lyrics',
		sourceTrack: parseSourceTrack(raw.sourceTrack),
		project: parseProject(raw.project)
	};
}

export function hasRenderableLyrixaBundle(
	envelope: LyrixaLyricsBundleEnvelope | null | undefined
): boolean {
	return Boolean(
		envelope &&
		envelope.project.layers.length > 0 &&
		envelope.project.clips.length > 0
	);
}

export function resolveLyrixaBundleActiveLines(
	envelope: LyrixaLyricsBundleEnvelope | null | undefined,
	currentTimeSec: number
): string[] {
	if (!envelope) return [];
	const visibleLayers = new Map(
		envelope.project.layers
			.filter(layer => layer.visible !== false)
			.sort((a, b) => a.order - b.order)
			.map(layer => [layer.id, layer])
	);
	return envelope.project.clips
		.filter(
			clip =>
				!clip.muted &&
				currentTimeSec >= clip.startTime &&
				currentTimeSec <= clip.endTime &&
				visibleLayers.has(clip.layerId) &&
				(!visibleLayers.get(clip.layerId)?.renderSettings
					?.suppressClipText ||
					clip.forceTextRender)
		)
		.sort((a, b) => {
			const layerA = visibleLayers.get(a.layerId)?.order ?? 0;
			const layerB = visibleLayers.get(b.layerId)?.order ?? 0;
			return layerA - layerB || a.startTime - b.startTime;
		})
		.map(clip => clip.text.trim())
		.filter(Boolean);
}

export function resolveLyrixaBundlePreviewText(
	envelope: LyrixaLyricsBundleEnvelope | null | undefined,
	currentTimeSec: number
): string {
	return resolveLyrixaBundleActiveLines(envelope, currentTimeSec).join(' / ');
}

export function mergeLyrixaVisualStyle(
	...styles: Array<LyrixaLyricVisualStyle | null | undefined>
): LyrixaLyricVisualStyle {
	return styles.reduce<LyrixaLyricVisualStyle>(
		(acc, style) => ({
			...acc,
			...(style ?? {})
		}),
		{ ...DEFAULT_LYRIXA_LYRIC_STYLE }
	);
}
