import { useEffect, useMemo, useRef, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
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
import type { AudioLyricsSourceMode } from '@/features/lyrics/types';
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
import ToggleControl from '../ToggleControl';
import SliderControl from '../SliderControl';
import CollapsibleSection from '../ui/CollapsibleSection';
import EnumButtons from '../ui/EnumButtons';
import AdaptiveColorInput from '../ui/AdaptiveColorInput';
import ResetButton from '../ui/ResetButton';
import LyricsTimelineEditor from './lyrics/LyricsTimelineEditor';

const LYRICS_SOURCE_MODES: AudioLyricsSourceMode[] = ['auto', 'lrc', 'plain'];

type LyricsTrackTarget = {
	assetId: string;
	name: string;
	source: 'playlist' | 'file';
	trackId: string | null;
};

export default function LyricsTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
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
	const playlistTracks = store.audioTracks;
	const activeTrack = resolveActiveAudioTrack(store);
	const fallbackAssetId = store.audioFileAssetId;
	const activeAssetId = resolveActiveAudioAssetId(store);
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
	const [draftText, setDraftText] = useState(selectedEntry?.rawText ?? '');

	useEffect(() => {
		setDraftText(selectedEntry?.rawText ?? '');
	}, [selectedAssetId, selectedEntry?.rawText]);

	const selectedMode = selectedEntry?.mode ?? 'auto';
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
	const previewIndex = findActiveLyricsLineIndex(
		parsedLyrics.lines,
		Math.max(0, getCurrentTime() + store.audioLyricsTimeOffsetMs / 1000),
		parsedLyrics.hasTimestamps
	);
	const previewLine =
		previewIndex >= 0 ? parsedLyrics.lines[previewIndex]?.text ?? '' : '';
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
		!isLive &&
		selectedAssetId != null &&
		selectedAssetId === activeAssetId &&
		currentDuration > 0;
	const timelineDisabledMessage = isLive
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
		if (!selectedAssetId) return;
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
		patch: Partial<{ mode: AudioLyricsSourceMode; rawText: string }>
	) {
		if (!selectedAssetId) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, patch);
	}

	function handleChangeMode(mode: AudioLyricsSourceMode) {
		if (!selectedAssetId) return;
		store.upsertAudioLyricsTrackEntry(selectedAssetId, {
			mode,
			rawText: draftText
		});
	}

	function handleTextChange(nextText: string) {
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
		if (!textarea || !selectedAssetId) return;
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

	return (
		<div className="flex flex-col gap-2.5">
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
						!selectedAssetId ? 'pointer-events-none opacity-50' : ''
					}`}
				>
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

			<ResetButton label={t.reset_tab} onClick={onReset} />
		</div>
	);
}
