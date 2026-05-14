import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperState } from '@/types/wallpaper';
import { useAudioContext } from '@/context/useAudioContext';
import { useT } from '@/lib/i18n';
import {
	resolveActiveAudioAssetId,
	resolveActiveAudioTrack
} from '@/lib/audio/activeTrack';
import { formatTrackTitle } from '@/lib/audio/trackTitle';
import { LYRICS_RANGES } from '@/config/ranges';
import {
	TRACK_TITLE_FONTS,
	TRACK_TITLE_FONT_LABELS,
	TRACK_TITLE_LAYOUTS,
	TRACK_TITLE_LAYOUT_LABELS
} from './trackTitleOptions';
import type {
	AudioLyricsSourceMode,
	LyrixaLayerOverrideMap
} from '@/features/lyrics/types';
import {
	findActiveLyricsLineIndex,
	formatLrcTimestamp
} from '@/features/lyrics/parser';
import { getCachedLyricsDocument } from '@/features/lyrics/cache';
import {
	createTimelineClipsFromDocument,
	serializeTimelineClipsToLrc,
	type LyricsTimelineClip
} from '@/features/lyrics/timeline';
import {
	createLyrixaBundleLayeredLrcText,
	parseLyrixaLyricsBundleEnvelope,
	resolveLyrixaBundlePreviewText
} from '@/features/lyrics/lyrixaBundle';
import ToggleControl from '../ToggleControl';
import SliderControl from '../SliderControl';
import CollapsibleSection from '../ui/CollapsibleSection';
import EnumButtons from '../ui/EnumButtons';
import AdaptiveColorInput from '../ui/AdaptiveColorInput';
import ResetButton from '../ui/ResetButton';
import ColorSourceShortcuts from '../ui/ColorSourceShortcuts';
import { resolveSharedColorSource } from '../ui/colorSourceUtils';
import LyricsTimelineEditor from './lyrics/LyricsTimelineEditor';

const LYRICS_SOURCE_MODES: AudioLyricsSourceMode[] = ['auto', 'lrc', 'plain'];

const LYRIXA_LAYER_TWEAK_RANGES = {
	positionOffset: { min: -1.5, max: 1.5, step: 0.01 },
	scale: { min: 0.25, max: 3, step: 0.05 },
	opacity: { min: 0, max: 1, step: 0.05 },
	blurAmount: { min: 0, max: 48, step: 1 },
	glowIntensity: { min: 0, max: 4, step: 0.05 }
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function colorInputValue(value: string | undefined, fallback: string): string {
	const candidate = value?.trim() ?? '';
	return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}

type LyricsTrackTarget = {
	assetId: string;
	name: string;
	source: 'playlist' | 'file';
	trackId: string | null;
};

export default function LyricsTab({
	onReset,
	modernChrome = false
}: {
	onReset: () => void;
	modernChrome?: boolean;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			audioTracks: s.audioTracks,
			audioFileAssetId: s.audioFileAssetId,
			audioLyricsByTrackAssetId: s.audioLyricsByTrackAssetId,
			audioLyricsEnabled: s.audioLyricsEnabled,
			audioLyricsTimeOffsetMs: s.audioLyricsTimeOffsetMs,
			audioLyricsLayoutMode: s.audioLyricsLayoutMode,
			audioLyricsPositionX: s.audioLyricsPositionX,
			audioLyricsPositionY: s.audioLyricsPositionY,
			audioLyricsWidth: s.audioLyricsWidth,
			audioLyricsFontStyle: s.audioLyricsFontStyle,
			audioLyricsUppercase: s.audioLyricsUppercase,
			audioLyricsFontSize: s.audioLyricsFontSize,
			audioLyricsLetterSpacing: s.audioLyricsLetterSpacing,
			audioLyricsLineHeight: s.audioLyricsLineHeight,
			audioLyricsVisibleLineCount: s.audioLyricsVisibleLineCount,
			audioLyricsOpacity: s.audioLyricsOpacity,
			audioLyricsInactiveOpacity: s.audioLyricsInactiveOpacity,
			audioLyricsActiveColor: s.audioLyricsActiveColor,
			audioLyricsActiveColorSource: s.audioLyricsActiveColorSource,
			audioLyricsInactiveColor: s.audioLyricsInactiveColor,
			audioLyricsInactiveColorSource: s.audioLyricsInactiveColorSource,
			audioLyricsGlowColor: s.audioLyricsGlowColor,
			audioLyricsGlowColorSource: s.audioLyricsGlowColorSource,
			audioLyricsGlowBlur: s.audioLyricsGlowBlur,
			audioLyricsBackdropEnabled: s.audioLyricsBackdropEnabled,
			audioLyricsBackdropColor: s.audioLyricsBackdropColor,
			audioLyricsBackdropColorSource: s.audioLyricsBackdropColorSource,
			audioLyricsBackdropOpacity: s.audioLyricsBackdropOpacity,
			audioLyricsBackdropPadding: s.audioLyricsBackdropPadding,
			audioLyricsBackdropRadius: s.audioLyricsBackdropRadius,
			setLyricsColorSources: s.setLyricsColorSources,
			setAudioLyricsEnabled: s.setAudioLyricsEnabled,
			setAudioLyricsLayoutMode: s.setAudioLyricsLayoutMode,
			setAudioLyricsPositionX: s.setAudioLyricsPositionX,
			setAudioLyricsPositionY: s.setAudioLyricsPositionY,
			setAudioLyricsWidth: s.setAudioLyricsWidth,
			setAudioLyricsFontStyle: s.setAudioLyricsFontStyle,
			setAudioLyricsUppercase: s.setAudioLyricsUppercase,
			setAudioLyricsFontSize: s.setAudioLyricsFontSize,
			setAudioLyricsLetterSpacing: s.setAudioLyricsLetterSpacing,
			setAudioLyricsLineHeight: s.setAudioLyricsLineHeight,
			setAudioLyricsVisibleLineCount: s.setAudioLyricsVisibleLineCount,
			setAudioLyricsOpacity: s.setAudioLyricsOpacity,
			setAudioLyricsInactiveOpacity: s.setAudioLyricsInactiveOpacity,
			setAudioLyricsTimeOffsetMs: s.setAudioLyricsTimeOffsetMs,
			setAudioLyricsActiveColor: s.setAudioLyricsActiveColor,
			setAudioLyricsActiveColorSource: s.setAudioLyricsActiveColorSource,
			setAudioLyricsInactiveColor: s.setAudioLyricsInactiveColor,
			setAudioLyricsInactiveColorSource: s.setAudioLyricsInactiveColorSource,
			setAudioLyricsGlowColor: s.setAudioLyricsGlowColor,
			setAudioLyricsGlowColorSource: s.setAudioLyricsGlowColorSource,
			setAudioLyricsGlowBlur: s.setAudioLyricsGlowBlur,
			setAudioLyricsBackdropEnabled: s.setAudioLyricsBackdropEnabled,
			setAudioLyricsBackdropColor: s.setAudioLyricsBackdropColor,
			setAudioLyricsBackdropColorSource: s.setAudioLyricsBackdropColorSource,
			setAudioLyricsBackdropOpacity: s.setAudioLyricsBackdropOpacity,
			setAudioLyricsBackdropPadding: s.setAudioLyricsBackdropPadding,
			setAudioLyricsBackdropRadius: s.setAudioLyricsBackdropRadius,
			upsertAudioLyricsTrackEntry: s.upsertAudioLyricsTrackEntry,
			updateAudioLyricsTrackEntry: s.updateAudioLyricsTrackEntry,
			removeAudioLyricsTrackEntry: s.removeAudioLyricsTrackEntry
		}))
	);
	// resolveActiveAudioTrack/resolveActiveAudioAssetId expect WallpaperState.
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const {
		captureMode,
		isPaused,
		pauseCapture,
		resumeCapture,
		pauseFileForSystem,
		resumeFileFromSystem,
		seek,
		getCurrentTime,
		getDuration,
		getFileName,
		playTrackById
	} = useAudioContext();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const lyrixaImportInputRef = useRef<HTMLInputElement>(null);
	const playlistTracks = store.audioTracks;
	const activeTrack = resolveActiveAudioTrack(fullStore);
	const fallbackAssetId = store.audioFileAssetId;
	const activeAssetId = resolveActiveAudioAssetId(fullStore);
	const standaloneFileName = getFileName().trim();
	const availableTracks = useMemo<LyricsTrackTarget[]>(() => {
		const seen = new Set<string>();
		const nextTargets: LyricsTrackTarget[] = [];
		for (const track of playlistTracks) {
			if (seen.has(track.assetId)) continue;
			seen.add(track.assetId);
			nextTargets.push({
				assetId: track.assetId,
				name: track.name,
				source: 'playlist',
				trackId: track.id
			});
		}
		if (fallbackAssetId && !seen.has(fallbackAssetId)) {
			nextTargets.push({
				assetId: fallbackAssetId,
				name: standaloneFileName || t.label_now_playing,
				source: 'file',
				trackId: null
			});
		}
		return nextTargets;
	}, [fallbackAssetId, playlistTracks, standaloneFileName, t.label_now_playing]);
	const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
		activeAssetId ?? availableTracks[0]?.assetId ?? null
	);

	useEffect(() => {
		if (
			selectedAssetId &&
			availableTracks.some(track => track.assetId === selectedAssetId)
		) {
			return;
		}
		setSelectedAssetId(activeAssetId ?? availableTracks[0]?.assetId ?? null);
	}, [activeAssetId, availableTracks, selectedAssetId]);

	const selectedTrack =
		availableTracks.find(track => track.assetId === selectedAssetId) ?? null;
	const selectedEntry = selectedAssetId
		? store.audioLyricsByTrackAssetId[selectedAssetId]
		: undefined;
	const selectedLyrixaBundle = selectedEntry?.lyrixaBundle ?? null;
	const hasImportedLyrixaBundle = selectedLyrixaBundle !== null;
	const selectedLyrixaRenderMode = selectedEntry?.lyrixaRenderMode ?? 'editor';
	const usesEditorLyricsRenderer =
		!hasImportedLyrixaBundle || selectedLyrixaRenderMode === 'editor';
	const selectedLyrixaLayerOverrides =
		selectedEntry?.lyrixaLayerOverrides ?? {};
	const selectedLyrixaLayers = useMemo(
		() =>
			selectedLyrixaBundle
				? [...selectedLyrixaBundle.project.layers].sort(
						(a, b) => a.order - b.order
					)
				: [],
		[selectedLyrixaBundle]
	);
	const lyrixaEditorRawText = useMemo(
		() =>
			selectedLyrixaBundle
				? createLyrixaBundleLayeredLrcText(selectedLyrixaBundle)
				: '',
		[selectedLyrixaBundle]
	);
	const [draftText, setDraftText] = useState(selectedEntry?.rawText ?? '');
	const [lyrixaImportError, setLyrixaImportError] = useState<string | null>(null);

	useEffect(() => {
		const nextText =
			hasImportedLyrixaBundle && selectedLyrixaRenderMode === 'editor'
				? lyrixaEditorRawText
				: selectedEntry?.rawText ?? '';
		setDraftText(nextText);
		if (
			selectedAssetId &&
			hasImportedLyrixaBundle &&
			selectedLyrixaRenderMode === 'editor' &&
			((selectedEntry?.rawText ?? '') !== nextText ||
				selectedEntry?.mode !== 'lrc')
		) {
			store.updateAudioLyricsTrackEntry(selectedAssetId, {
				mode: 'lrc',
				rawText: nextText
			});
		}
	}, [
		hasImportedLyrixaBundle,
		lyrixaEditorRawText,
		selectedAssetId,
		selectedEntry?.mode,
		selectedEntry?.rawText,
		selectedLyrixaRenderMode,
		store
	]);

	useEffect(() => {
		setLyrixaImportError(null);
	}, [selectedAssetId]);

	const selectedMode =
		hasImportedLyrixaBundle && selectedLyrixaRenderMode === 'editor'
			? 'lrc'
			: selectedEntry?.mode ?? 'auto';
	const currentDuration = getDuration();
	const parsedLyrics = useMemo(
		() =>
			getCachedLyricsDocument(
				selectedAssetId
					? {
							mode: selectedMode,
							rawText: draftText
						}
					: null,
				currentDuration
			),
		[currentDuration, draftText, selectedAssetId, selectedMode]
	);
	const previewTimeSec = Math.max(
		0,
		getCurrentTime() + store.audioLyricsTimeOffsetMs / 1000
	);
	const previewIndex = findActiveLyricsLineIndex(
		parsedLyrics.lines,
		previewTimeSec,
		parsedLyrics.hasTimestamps
	);
	const previewLine = hasImportedLyrixaBundle
		? resolveLyrixaBundlePreviewText(selectedLyrixaBundle, previewTimeSec) ||
			(previewIndex >= 0 ? parsedLyrics.lines[previewIndex]?.text ?? '' : '')
		: previewIndex >= 0
			? parsedLyrics.lines[previewIndex]?.text ?? ''
			: '';
	const isLive = captureMode === 'microphone' || captureMode === 'desktop';
	const timelineClips = useMemo(
		() => createTimelineClipsFromDocument(parsedLyrics),
		[parsedLyrics]
	);
	const [editorClips, setEditorClips] = useState<LyricsTimelineClip[]>(
		timelineClips
	);

	useEffect(() => {
		setEditorClips(timelineClips);
	}, [timelineClips, selectedAssetId]);

	const liveTrackLabel = activeTrack
		? formatTrackTitle(activeTrack.name)
		: formatTrackTitle(getFileName());
	const timelineCanSync =
		usesEditorLyricsRenderer &&
		!isLive &&
		selectedAssetId != null &&
		selectedAssetId === activeAssetId &&
		currentDuration > 0;
	const timelineDisabledMessage =
		hasImportedLyrixaBundle && !usesEditorLyricsRenderer
			? t.hint_lyrics_bundle_edit_in_lyrixa
			: isLive
			? t.hint_lyrics_timeline_live
			: selectedAssetId !== activeAssetId
				? t.hint_lyrics_timeline_load_track
				: t.label_lyrics_timeline_unavailable;

	function handleAudioToggle() {
		if (captureMode === 'file') {
			if (isPaused) resumeFileFromSystem();
			else pauseFileForSystem();
			return;
		}
		if (isPaused) resumeCapture();
		else pauseCapture();
	}

	function handleCommitTimeline(nextClips: LyricsTimelineClip[]) {
		if (!selectedAssetId || !usesEditorLyricsRenderer) return;
		const nextRawText = serializeTimelineClipsToLrc(
			nextClips,
			parsedLyrics.metadata
		);
		setEditorClips(nextClips);
		setDraftText(nextRawText);
		store.upsertAudioLyricsTrackEntry(selectedAssetId, {
			mode: 'lrc',
			rawText: nextRawText
		});
	}

	function commitTrackEntry(
		patch: Partial<{
			mode: AudioLyricsSourceMode;
			rawText: string;
		}>
	) {
		if (!selectedAssetId) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, patch);
	}

	function handleChangeMode(mode: AudioLyricsSourceMode) {
		if (!selectedAssetId || !usesEditorLyricsRenderer) return;
		store.upsertAudioLyricsTrackEntry(selectedAssetId, {
			mode,
			rawText: draftText
		});
	}

	function handleTextChange(nextText: string) {
		if (!usesEditorLyricsRenderer) return;
		setDraftText(nextText);
		commitTrackEntry({ rawText: nextText });
	}

	function handleClearLyrics() {
		if (!selectedAssetId) return;
		setDraftText('');
		store.removeAudioLyricsTrackEntry(selectedAssetId);
	}

	function handleInsertTimestamp() {
		const textarea = textareaRef.current;
		if (!textarea || !selectedAssetId || !usesEditorLyricsRenderer) return;
		const start = textarea.selectionStart ?? draftText.length;
		const end = textarea.selectionEnd ?? start;
		const stamp = `${formatLrcTimestamp(getCurrentTime())} `;
		const nextText = `${draftText.slice(0, start)}${stamp}${draftText.slice(end)}`;
		setDraftText(nextText);
		store.upsertAudioLyricsTrackEntry(selectedAssetId, {
			mode: selectedMode === 'plain' ? 'lrc' : selectedMode,
			rawText: nextText
		});
		requestAnimationFrame(() => {
			textarea.focus();
			const nextCursor = start + stamp.length;
			textarea.setSelectionRange(nextCursor, nextCursor);
		});
	}

	async function handleImportLyrixaBundle(
		event: ChangeEvent<HTMLInputElement>
	) {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file || !selectedAssetId) return;
		try {
			setLyrixaImportError(null);
			const raw = JSON.parse(await file.text()) as unknown;
			const bundle = parseLyrixaLyricsBundleEnvelope(raw);
			const fallbackRawText = createLyrixaBundleLayeredLrcText(bundle);
			setDraftText(fallbackRawText);
			store.upsertAudioLyricsTrackEntry(selectedAssetId, {
				mode: 'lrc',
				rawText: fallbackRawText,
				lyrixaBundle: bundle,
				lyrixaRenderMode: 'editor',
				lyrixaLayerOverrides: {}
			});
		} catch (error) {
			setLyrixaImportError(
				error instanceof Error
					? error.message
					: t.label_lyrics_bundle_import_failed
			);
		}
	}

	function handleClearLyrixaBundle() {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaBundle: null,
			lyrixaRenderMode: 'editor',
			lyrixaLayerOverrides: {}
		});
		setLyrixaImportError(null);
	}

	function updateLyrixaLayerOverride(
		layerId: string,
		patch: NonNullable<LyrixaLayerOverrideMap[string]>
	) {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaLayerOverrides: {
				...selectedLyrixaLayerOverrides,
				[layerId]: {
					...(selectedLyrixaLayerOverrides[layerId] ?? {}),
					...patch
				}
			}
		});
	}

	function setLyrixaRenderMode(mode: 'bundle' | 'editor') {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaRenderMode: mode
		});
	}

	function resetLyrixaLayerOverride(layerId: string) {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		const nextOverrides = { ...selectedLyrixaLayerOverrides };
		delete nextOverrides[layerId];
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaLayerOverrides: nextOverrides
		});
	}

	function resetAllLyrixaLayerOverrides() {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaLayerOverrides: {}
		});
	}

	function cleanLyrixaImportedStyling() {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		const glowIntensity = clamp(store.audioLyricsGlowBlur / 16, 0, 4);
		const nextOverrides: LyrixaLayerOverrideMap = {
			...selectedLyrixaLayerOverrides
		};
		for (const layer of selectedLyrixaLayers) {
			nextOverrides[layer.id] = {
				...(nextOverrides[layer.id] ?? {}),
				textColor: store.audioLyricsActiveColor,
				glowColor: store.audioLyricsGlowColor,
				glowIntensity,
				blurAmount: 0,
				opacity: store.audioLyricsOpacity
			};
		}
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaLayerOverrides: nextOverrides
		});
	}

	const sharedLyricsColorSource = resolveSharedColorSource([
		store.audioLyricsActiveColorSource,
		store.audioLyricsInactiveColorSource,
		store.audioLyricsGlowColorSource,
		store.audioLyricsBackdropColorSource
	]);

	return (
		<div className="flex flex-col gap-2.5">
			<ColorSourceShortcuts
				label={t.label_color_source}
				value={sharedLyricsColorSource}
				onChange={store.setLyricsColorSources}
			/>

			{isLive && (
				<div
					className="rounded border px-2.5 py-2 text-[11px] leading-snug"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-bg)',
						color: 'var(--editor-accent-muted)'
					}}
				>
					{t.hint_lyrics_live_mode}
				</div>
			)}

			<ToggleControl
				label={t.label_lyrics_enabled}
				value={store.audioLyricsEnabled}
				onChange={store.setAudioLyricsEnabled}
			/>

			{hasImportedLyrixaBundle ? (
				<div
					className="rounded border p-2"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-bg)'
					}}
				>
					<div
						className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						Render mode
					</div>
					<div className="grid grid-cols-2 gap-1.5">
						<button
							type="button"
							onClick={() => setLyrixaRenderMode('editor')}
							className="rounded border px-2 py-1.5 text-[11px] font-semibold"
							style={{
								borderColor:
									selectedLyrixaRenderMode === 'editor'
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
								background:
									selectedLyrixaRenderMode === 'editor'
										? 'var(--editor-accent-color)'
										: 'transparent',
								color:
									selectedLyrixaRenderMode === 'editor'
										? 'var(--editor-active-fg)'
										: 'var(--editor-accent-soft)'
							}}
						>
							Editor Native
						</button>
						<button
							type="button"
							onClick={() => setLyrixaRenderMode('bundle')}
							className="rounded border px-2 py-1.5 text-[11px] font-semibold"
							style={{
								borderColor:
									selectedLyrixaRenderMode === 'bundle'
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
								background:
									selectedLyrixaRenderMode === 'bundle'
										? 'var(--editor-accent-color)'
										: 'transparent',
								color:
									selectedLyrixaRenderMode === 'bundle'
										? 'var(--editor-active-fg)'
										: 'var(--editor-accent-soft)'
							}}
						>
							Lyrixa Look
						</button>
					</div>
					<div
						className="mt-1 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						Editor Native uses Lyrixa clips/layers/timing as local lyrics.
						Lyrixa Look preserves the imported Lyrixa styling.
					</div>
				</div>
			) : null}

			<input
				ref={lyrixaImportInputRef}
				type="file"
				accept=".lyrixa-lyrics.json,.json,application/json"
				onChange={event => void handleImportLyrixaBundle(event)}
				className="hidden"
			/>

			<div
				className="rounded border p-2"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-surface-bg)'
				}}
			>
				<div
					className="mb-1 text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_lyrics_track_target}
				</div>
				<select
					value={selectedAssetId ?? ''}
					onChange={event =>
						setSelectedAssetId(event.target.value || null)
					}
					className="w-full rounded border px-2 py-1 text-xs outline-none"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-elevated)',
						color: 'var(--editor-text-primary)'
					}}
				>
					<option value="">
						{t.label_lyrics_no_track_selected}
					</option>
					{availableTracks.map(track => (
						<option key={track.assetId} value={track.assetId}>
							{formatTrackTitle(track.name)}
							{activeAssetId === track.assetId
								? ` • ${t.label_now_playing}`
								: ''}
						</option>
					))}
				</select>
				<div
					className="mt-2 flex flex-col gap-0.5 text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					<div>
						{t.label_now_playing}: {liveTrackLabel || t.label_track_title_empty}
					</div>
					<div>
						{t.label_lyrics_selected_track}:{' '}
						{selectedTrack
							? formatTrackTitle(selectedTrack.name)
							: t.label_lyrics_no_track_selected}
					</div>
					{currentDuration > 0 ? (
						<div>
							{t.label_lyrics_sync_summary}:{' '}
							{parsedLyrics.lines.length} {t.label_lyrics_lines_count}
							{' • '}
							{parsedLyrics.mode.toUpperCase()}
						</div>
					) : null}
				</div>
			</div>

			<CollapsibleSection
				label={t.section_lyrics_bundle}
				defaultOpen={hasImportedLyrixaBundle}
			>
				<div className="flex flex-col gap-2.5">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => lyrixaImportInputRef.current?.click()}
							disabled={!selectedAssetId}
							className="rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								borderColor: 'var(--editor-accent-border)',
								color: 'var(--editor-accent-soft)'
							}}
						>
							{t.label_import_lyrixa_bundle}
						</button>
						<button
							type="button"
							onClick={handleClearLyrixaBundle}
							disabled={!hasImportedLyrixaBundle}
							className="rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								borderColor: 'var(--editor-accent-border)',
								color: 'var(--editor-accent-soft)'
							}}
						>
							{t.label_clear_lyrixa_bundle}
						</button>
					</div>

					{lyrixaImportError ? (
						<div
							className="rounded border px-2.5 py-2 text-[11px] leading-snug"
							style={{
								borderColor: 'var(--editor-danger-border, #7f1d1d)',
								background: 'var(--editor-surface-bg)',
								color: 'var(--editor-danger-text, #fca5a5)'
							}}
						>
							{t.label_lyrics_bundle_import_failed}: {lyrixaImportError}
						</div>
					) : null}

					{hasImportedLyrixaBundle ? (
						<div
							className="rounded border p-2"
							style={{
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-surface-bg)'
							}}
						>
							<div
								className="mb-2 text-xs font-semibold"
								style={{ color: 'var(--editor-text-primary)' }}
							>
								{t.label_lyrics_bundle_mode_active}
							</div>
							<div
								className="flex flex-col gap-0.5 text-[11px]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								<div>
									{t.label_lyrics_bundle_project}:{' '}
									{selectedLyrixaBundle?.projectName || '—'}
								</div>
								<div>
									{t.label_lyrics_bundle_source_track}:{' '}
									{selectedLyrixaBundle?.sourceTrack?.fileName ||
										t.label_track_title_empty}
								</div>
								<div>
									{t.label_lyrics_bundle_layers}:{' '}
									{selectedLyrixaBundle?.project.layers.length ?? 0}
								</div>
								<div>
									{t.label_lyrics_bundle_clips}:{' '}
									{selectedLyrixaBundle?.project.clips.length ?? 0}
								</div>
							</div>
						</div>
					) : null}

					{hasImportedLyrixaBundle ? (
						<div
							className="rounded border p-2"
							style={{
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-surface-bg)'
							}}
						>
							<div className="mb-2 flex items-center justify-between gap-2">
								<div
									className="text-xs font-semibold uppercase tracking-[0.18em]"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.section_lyrics_bundle_layer_overrides}
								</div>
								<button
									type="button"
									onClick={resetAllLyrixaLayerOverrides}
									className="rounded border px-2 py-1 text-[11px] font-semibold"
									style={{
										borderColor: 'var(--editor-accent-border)',
										color: 'var(--editor-accent-soft)'
									}}
								>
									{t.label_lyrics_bundle_reset_layer_overrides}
								</button>
							</div>
							<div
								className="mb-2 rounded border px-2.5 py-2 text-[11px] leading-snug"
								style={{
									borderColor: 'var(--editor-accent-border)',
									background: 'var(--editor-surface-elevated)',
									color: 'var(--editor-accent-muted)'
								}}
							>
								{t.hint_lyrics_bundle_layer_overrides}
							</div>
							<button
								type="button"
								onClick={cleanLyrixaImportedStyling}
								className="mb-2 w-full rounded border px-3 py-1.5 text-xs font-semibold"
								style={{
									borderColor: 'var(--editor-accent-border)',
									background: 'var(--editor-surface-elevated)',
									color: 'var(--editor-text-primary)'
								}}
							>
								{t.label_lyrics_bundle_clean_style}
							</button>
							<div className="flex flex-col gap-2">
								{selectedLyrixaLayers.map(layer => {
									const override =
										selectedLyrixaLayerOverrides[layer.id] ?? {};
									const projectStyle =
										selectedLyrixaBundle?.project.styleConfig;
									const layerStyle = layer.styleDefaults ?? {};
									const textColor = colorInputValue(
										override.textColor ??
											layerStyle.textColor ??
											projectStyle?.textColor,
										store.audioLyricsActiveColor
									);
									const glowColor = colorInputValue(
										override.glowColor ??
											layerStyle.glowColor ??
											projectStyle?.glowColor,
										store.audioLyricsGlowColor
									);
									return (
										<div
											key={layer.id}
											className="rounded border p-2"
											style={{
												borderColor: 'var(--editor-accent-border)',
												background: 'var(--editor-surface-elevated)'
											}}
										>
											<div className="mb-2 flex items-center justify-between gap-2">
												<div className="min-w-0">
													<div
														className="truncate text-xs font-semibold"
														style={{
															color: 'var(--editor-text-primary)'
														}}
													>
														{layer.name}
													</div>
													<div
														className="truncate text-[10px]"
														style={{
															color: 'var(--editor-accent-muted)'
														}}
													>
														{layer.layerType} · {layer.id}
													</div>
												</div>
												<button
													type="button"
													onClick={() =>
														resetLyrixaLayerOverride(layer.id)
													}
													className="shrink-0 rounded border px-2 py-1 text-[11px]"
													style={{
														borderColor:
															'var(--editor-accent-border)',
														color: 'var(--editor-accent-soft)'
													}}
												>
													{t.label_reset}
												</button>
											</div>
											<ToggleControl
												label={t.label_visible}
												value={
													override.visible ??
													(layer.visible !== false)
												}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														visible: value
													})
												}
											/>
											<SliderControl
												label={t.label_position_x}
												value={override.positionOffsetX ?? 0}
												{...LYRIXA_LAYER_TWEAK_RANGES.positionOffset}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														positionOffsetX: value
													})
												}
											/>
											<SliderControl
												label={t.label_position_y}
												value={override.positionOffsetY ?? 0}
												{...LYRIXA_LAYER_TWEAK_RANGES.positionOffset}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														positionOffsetY: value
													})
												}
											/>
											<SliderControl
												label={t.label_scale}
												value={override.scale ?? 1}
												{...LYRIXA_LAYER_TWEAK_RANGES.scale}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														scale: value
													})
												}
											/>
											<SliderControl
												label={t.label_opacity}
												value={
													override.opacity ??
													layerStyle.opacity ??
													projectStyle?.opacity ??
													1
												}
												{...LYRIXA_LAYER_TWEAK_RANGES.opacity}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														opacity: value
													})
												}
											/>
											<SliderControl
												label={t.label_blur}
												value={
													override.blurAmount ??
													layerStyle.blurAmount ??
													projectStyle?.blurAmount ??
													0
												}
												{...LYRIXA_LAYER_TWEAK_RANGES.blurAmount}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														blurAmount: value
													})
												}
												unit="px"
											/>
											<SliderControl
												label={t.label_glow_intensity}
												value={
													override.glowIntensity ??
													layerStyle.glowIntensity ??
													projectStyle?.glowIntensity ??
													0
												}
												{...LYRIXA_LAYER_TWEAK_RANGES.glowIntensity}
												onChange={value =>
													updateLyrixaLayerOverride(layer.id, {
														glowIntensity: value
													})
												}
											/>
											<div className="grid grid-cols-2 gap-2">
												<label className="flex items-center justify-between gap-2 text-[11px]">
													<span
														style={{
															color: 'var(--editor-accent-muted)'
														}}
													>
														{t.label_lyrics_active_color}
													</span>
													<input
														type="color"
														value={textColor}
														onInput={event =>
															updateLyrixaLayerOverride(layer.id, {
																textColor: (
																	event.target as HTMLInputElement
																).value
															})
														}
														onChange={event =>
															updateLyrixaLayerOverride(layer.id, {
																textColor: event.target.value
															})
														}
														className="h-7 w-10 cursor-pointer rounded border bg-transparent"
														style={{
															borderColor:
																'var(--editor-accent-border)'
														}}
													/>
												</label>
												<label className="flex items-center justify-between gap-2 text-[11px]">
													<span
														style={{
															color: 'var(--editor-accent-muted)'
														}}
													>
														{t.label_glow_color}
													</span>
													<input
														type="color"
														value={glowColor}
														onInput={event =>
															updateLyrixaLayerOverride(layer.id, {
																glowColor: (
																	event.target as HTMLInputElement
																).value
															})
														}
														onChange={event =>
															updateLyrixaLayerOverride(layer.id, {
																glowColor: event.target.value
															})
														}
														className="h-7 w-10 cursor-pointer rounded border bg-transparent"
														style={{
															borderColor:
																'var(--editor-accent-border)'
														}}
													/>
												</label>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					) : null}

					<div
						className="rounded border px-2.5 py-2 text-[11px] leading-snug"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)',
							color: 'var(--editor-accent-muted)'
						}}
					>
						{hasImportedLyrixaBundle
							? t.hint_lyrics_bundle_active
							: t.hint_lyrics_bundle_import}
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t.section_lyrics_timeline} defaultOpen={true}>
				<div className="flex flex-col gap-2.5">
					{selectedTrack?.source === 'playlist' &&
					selectedTrack.trackId &&
					selectedAssetId !== activeAssetId ? (
						<div
							className="flex items-center justify-between gap-2 rounded border px-2.5 py-2"
							style={{
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-surface-bg)'
							}}
						>
							<div
								className="text-[11px] leading-snug"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_lyrics_timeline_load_track}
							</div>
							<button
								type="button"
								onClick={() => void playTrackById(selectedTrack.trackId!)}
								className="rounded border px-3 py-1.5 text-xs font-semibold"
								style={{
									borderColor: 'var(--editor-accent-border)',
									background: 'var(--editor-surface-elevated)',
									color: 'var(--editor-text-primary)'
								}}
							>
								{t.label_load_selected_track}
							</button>
						</div>
					) : null}

					<LyricsTimelineEditor
						clips={editorClips}
						duration={currentDuration}
						currentTime={Math.max(0, getCurrentTime())}
						isPaused={isPaused}
						playLabel={t.resume}
						pauseLabel={t.pause}
						disabled={!timelineCanSync}
						disabledMessage={timelineDisabledMessage}
						onSeek={seek}
						onPlayToggle={handleAudioToggle}
						onCommitClips={handleCommitTimeline}
					/>

					<div
						className="rounded border px-2.5 py-2 text-[11px] leading-snug"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)',
							color: 'var(--editor-accent-muted)'
						}}
					>
						{t.hint_lyrics_timeline_trim}
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t.section_lyrics_source} defaultOpen={false}>
				<div
					className={`flex flex-col gap-2.5 ${
						!selectedAssetId || !usesEditorLyricsRenderer
							? 'pointer-events-none opacity-50'
							: ''
					}`}
				>
					{hasImportedLyrixaBundle && !usesEditorLyricsRenderer ? (
						<div
							className="rounded border px-2.5 py-2 text-[11px] leading-snug"
							style={{
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-surface-bg)',
								color: 'var(--editor-accent-muted)'
							}}
						>
							{t.hint_lyrics_bundle_edit_in_lyrixa}
						</div>
					) : null}

					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_lyrics_source_mode}
						</span>
						<EnumButtons<AudioLyricsSourceMode>
							options={LYRICS_SOURCE_MODES}
							value={selectedMode}
							onChange={handleChangeMode}
							labels={{
								auto: t.label_auto,
								lrc: 'LRC',
								plain: t.label_plain
							}}
						/>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleInsertTimestamp}
							disabled={!selectedAssetId}
							className="rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								borderColor: 'var(--editor-accent-border)',
								color: 'var(--editor-accent-soft)'
							}}
						>
							{t.label_insert_current_timestamp}
						</button>
						<button
							type="button"
							onClick={handleClearLyrics}
							disabled={!selectedAssetId}
							className="rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
							style={{
								borderColor: 'var(--editor-danger-border, #7f1d1d)',
								color: 'var(--editor-danger-text, #fca5a5)'
							}}
						>
							{t.label_clear_lyrics}
						</button>
					</div>

					<textarea
						ref={textareaRef}
						value={draftText}
						onChange={event => handleTextChange(event.target.value)}
						placeholder={t.hint_lyrics_editor_placeholder}
						rows={12}
						className="w-full rounded border px-3 py-2 text-xs leading-6 outline-none transition-colors"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-elevated)',
							color: 'var(--editor-text-primary)'
						}}
					/>

					<div
						className="rounded border px-2.5 py-2 text-[11px] leading-snug"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)',
							color: 'var(--editor-accent-muted)'
						}}
					>
						{t.hint_lyrics_editor_lrc}
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t.section_lyrics_preview} defaultOpen={true}>
				<div
					className="rounded border p-2 text-xs"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-surface-bg)'
					}}
				>
					<div style={{ color: 'var(--editor-accent-soft)' }}>
						{t.label_lyrics_preview_active}
					</div>
					<div
						className="mt-1 text-sm font-semibold"
						style={{ color: 'var(--editor-text-primary)' }}
					>
						{previewLine || t.label_lyrics_preview_empty}
					</div>
				</div>
			</CollapsibleSection>

			<CollapsibleSection label={t.section_lyrics_style} defaultOpen={true}>
				<div className="flex flex-col gap-2.5">
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_track_title_layout}
						</span>
						<EnumButtons
							options={TRACK_TITLE_LAYOUTS}
							value={store.audioLyricsLayoutMode}
							onChange={store.setAudioLyricsLayoutMode}
							labels={TRACK_TITLE_LAYOUT_LABELS}
						/>
					</div>
					{store.audioLyricsLayoutMode === 'free' && (
						<SliderControl
							label={t.label_position_x}
							value={store.audioLyricsPositionX}
							{...LYRICS_RANGES.positionX}
							onChange={store.setAudioLyricsPositionX}
						/>
					)}
					<SliderControl
						label={t.label_position_y}
						value={store.audioLyricsPositionY}
						{...LYRICS_RANGES.positionY}
						onChange={store.setAudioLyricsPositionY}
					/>
					<SliderControl
						label={t.label_title_width}
						value={store.audioLyricsWidth}
						{...LYRICS_RANGES.width}
						onChange={store.setAudioLyricsWidth}
					/>
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_font_style}
						</span>
						<EnumButtons
							options={TRACK_TITLE_FONTS}
							value={store.audioLyricsFontStyle}
							onChange={store.setAudioLyricsFontStyle}
							labels={TRACK_TITLE_FONT_LABELS}
						/>
					</div>
					<ToggleControl
						label={t.label_uppercase}
						value={store.audioLyricsUppercase}
						onChange={store.setAudioLyricsUppercase}
					/>
					<SliderControl
						label={t.label_font_size}
						value={store.audioLyricsFontSize}
						{...LYRICS_RANGES.fontSize}
						onChange={store.setAudioLyricsFontSize}
						unit="px"
					/>
					<SliderControl
						label={t.label_letter_spacing}
						value={store.audioLyricsLetterSpacing}
						{...LYRICS_RANGES.letterSpacing}
						onChange={store.setAudioLyricsLetterSpacing}
						unit="px"
					/>
					<SliderControl
						label={t.label_lyrics_line_height}
						value={store.audioLyricsLineHeight}
						{...LYRICS_RANGES.lineHeight}
						onChange={store.setAudioLyricsLineHeight}
					/>
					<SliderControl
						label={t.label_lyrics_visible_line_count}
						value={store.audioLyricsVisibleLineCount}
						{...LYRICS_RANGES.visibleLineCount}
						onChange={store.setAudioLyricsVisibleLineCount}
					/>
					<SliderControl
						label={t.label_opacity}
						value={store.audioLyricsOpacity}
						{...LYRICS_RANGES.opacity}
						onChange={store.setAudioLyricsOpacity}
					/>
					<SliderControl
						label={t.label_lyrics_inactive_opacity}
						value={store.audioLyricsInactiveOpacity}
						{...LYRICS_RANGES.inactiveOpacity}
						onChange={store.setAudioLyricsInactiveOpacity}
					/>
					<SliderControl
						label={t.label_lyrics_time_offset}
						value={store.audioLyricsTimeOffsetMs}
						{...LYRICS_RANGES.timeOffsetMs}
						onChange={store.setAudioLyricsTimeOffsetMs}
						unit="ms"
					/>
					<AdaptiveColorInput
						label={t.label_lyrics_active_color}
						source={store.audioLyricsActiveColorSource}
						onSourceChange={store.setAudioLyricsActiveColorSource}
						value={store.audioLyricsActiveColor}
						onChange={store.setAudioLyricsActiveColor}
					/>
					<AdaptiveColorInput
						label={t.label_lyrics_inactive_color}
						source={store.audioLyricsInactiveColorSource}
						onSourceChange={store.setAudioLyricsInactiveColorSource}
						value={store.audioLyricsInactiveColor}
						onChange={store.setAudioLyricsInactiveColor}
					/>
					<AdaptiveColorInput
						label={t.label_glow_color}
						source={store.audioLyricsGlowColorSource}
						onSourceChange={store.setAudioLyricsGlowColorSource}
						value={store.audioLyricsGlowColor}
						onChange={store.setAudioLyricsGlowColor}
					/>
					<SliderControl
						label={t.label_glow_blur}
						value={store.audioLyricsGlowBlur}
						{...LYRICS_RANGES.glowBlur}
						onChange={store.setAudioLyricsGlowBlur}
					/>
					<CollapsibleSection
						label={t.label_backdrop}
						defaultOpen={store.audioLyricsBackdropEnabled}
					>
						<ToggleControl
							label={t.label_backdrop}
							value={store.audioLyricsBackdropEnabled}
							onChange={store.setAudioLyricsBackdropEnabled}
						/>
						{store.audioLyricsBackdropEnabled ? (
							<>
								<AdaptiveColorInput
									label={t.label_backdrop_color}
									source={store.audioLyricsBackdropColorSource}
									onSourceChange={
										store.setAudioLyricsBackdropColorSource
									}
									value={store.audioLyricsBackdropColor}
									onChange={store.setAudioLyricsBackdropColor}
								/>
								<SliderControl
									label={t.label_backdrop_opacity}
									value={store.audioLyricsBackdropOpacity}
									{...LYRICS_RANGES.backdropOpacity}
									onChange={store.setAudioLyricsBackdropOpacity}
								/>
								<SliderControl
									label={t.label_backdrop_padding}
									value={store.audioLyricsBackdropPadding}
									{...LYRICS_RANGES.backdropPadding}
									onChange={store.setAudioLyricsBackdropPadding}
									unit="px"
								/>
								<SliderControl
									label={t.label_corner_radius}
									value={store.audioLyricsBackdropRadius}
									{...LYRICS_RANGES.backdropRadius}
									onChange={store.setAudioLyricsBackdropRadius}
									unit="px"
								/>
							</>
						) : null}
					</CollapsibleSection>
				</div>
			</CollapsibleSection>

			{modernChrome ? null : (
				<ResetButton label={t.reset_tab} onClick={onReset} />
			)}
		</div>
	);
}
