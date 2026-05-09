import { formatLrcTimestamp } from './parser';
import type {
	LyrixaClipProgressIndicatorConfig,
	LyrixaLyricAnimationConfig,
	LyrixaLyricClip,
	LyrixaLyricFxConfig,
	LyrixaLyricLayer,
	LyrixaLyricTransitionPreset,
	LyrixaLyricVisualStyle,
	LyrixaClipPositionPreset,
	LyrixaLayerAudioReactive,
	LyrixaLyricsBundleEnvelope,
	LyrixaLyricsBundleProject,
	LyrixaLyricsBundleSourceTrack,
	LyrixaLayerType
} from './lyrixaBundleTypes';
import {
	DEFAULT_LYRIXA_LYRIC_STYLE,
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

function parseStyle(value: unknown): LyrixaLyricVisualStyle {
	return isObject(value) ? (value as LyrixaLyricVisualStyle) : {};
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
		targets:
			isObject(value.targets)
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
		styleId:
			typeof value.styleId === 'string' ? value.styleId : undefined,
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
		muted: Boolean(value.muted)
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
					zIndex: toOptionalNumber(value.renderSettings.zIndex)
				}
			: undefined,
		styleDefaults: parseStyle(
			value.styleDefaults ?? value.style
		),
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

function parseSourceTrack(value: unknown): LyrixaLyricsBundleSourceTrack | null {
	if (!isObject(value)) return null;
	return {
		fileName: typeof value.fileName === 'string' ? value.fileName : '',
		durationMs: Math.max(0, Math.round(toFiniteNumber(value.durationMs, 0))),
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
			typeof raw.projectName === 'string' ? raw.projectName : 'Imported lyrics',
		sourceTrack: parseSourceTrack(raw.sourceTrack),
		project: parseProject(raw.project)
	};
}

export function createLyrixaBundleFallbackRawText(
	envelope: LyrixaLyricsBundleEnvelope
): string {
	const raw = envelope.project.rawLyricsText.trim();
	if (raw) return raw;
	return [...envelope.project.clips]
		.sort((a, b) => a.startTime - b.startTime)
		.map(clip => `${formatLrcTimestamp(clip.startTime)} ${clip.text}`.trim())
		.join('\n')
		.trim();
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

export function resolveLyrixaBundlePreviewText(
	envelope: LyrixaLyricsBundleEnvelope | null | undefined,
	currentTimeSec: number
): string {
	if (!envelope) return '';
	const visibleLayers = new Map(
		envelope.project.layers
			.filter(layer => layer.visible !== false)
			.sort((a, b) => a.order - b.order)
			.map(layer => [layer.id, layer])
	);
	const activeTexts = envelope.project.clips
		.filter(
			clip =>
				!clip.muted &&
				currentTimeSec >= clip.startTime &&
				currentTimeSec <= clip.endTime &&
				visibleLayers.has(clip.layerId)
		)
		.sort((a, b) => {
			const layerA = visibleLayers.get(a.layerId)?.order ?? 0;
			const layerB = visibleLayers.get(b.layerId)?.order ?? 0;
			return layerA - layerB || a.startTime - b.startTime;
		})
		.map(clip => clip.text.trim())
		.filter(Boolean);
	return activeTexts.join(' / ');
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
