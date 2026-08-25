import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type ChangeEvent,
	type ReactNode
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	LyricsActiveAnimation,
	LyricsTextTransition,
	NowPlayingTextTreatment,
	TrackTitleFontStyle,
	WallpaperState
} from '@/types/wallpaper';
import type { LyrixaLayerOverrideMap } from '@/features/lyrics/types';
import { TRACK_TITLE_FONT_STACKS } from '@/components/audio/trackFonts';
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
} from '../trackTitleOptions';
import {
	parseLyrixaLyricsBundleEnvelope,
	resolveLyrixaBundlePreviewText
} from '@/features/lyrics/lyrixaBundle';
import ToggleControl from '../../ToggleControl';
import SliderControl from '../../SliderControl';
import CollapsibleSection from '../../ui/CollapsibleSection';
import EnumButtons from '@/ui/EnumButtonGroup';
import { FeatureGate, Select } from '@/ui';
import LyricsLayersPanel from './LyricsLayersPanel';
import AdaptiveColorInput from '../../ui/AdaptiveColorInput';
import LyricsColorSlotControls from '../../ui/LyricsColorSlotControls';
import { seedSecondaryColor } from '@/features/lyrics/lyricsColorModes';
import type { LyricsLayerColorMode } from '@/features/lyrics/types';
import ColorSourceShortcuts from '../../ui/ColorSourceShortcuts';
import { resolveSharedColorSource } from '../../ui/colorSourceUtils';

const TEXT_TREATMENTS: NowPlayingTextTreatment[] = [
	'solid',
	'gradient',
	'metallic',
	'neon',
	'glass',
	'shadow'
];

const LYRICS_TRANSITIONS: LyricsTextTransition[] = [
	'none',
	'fade',
	'slide-up',
	'slide-down',
	'scale',
	'blur',
	'pop'
];

const LYRICS_ACTIVE_ANIMATIONS: LyricsActiveAnimation[] = [
	'none',
	'pulse',
	'glow-pulse',
	'breathing',
	'shake-light',
	'wave',
	'flicker'
];

type LyricsTrackTarget = {
	assetId: string;
	name: string;
	source: 'playlist' | 'file';
	trackId: string | null;
};

/**
 * Switching a global color slot to Gradient seeds its second stop when the user
 * has never set one, so the gradient shows two colors instead of silently
 * collapsing into a solid — the same guard the per-layer panel uses.
 */
function applyColorMode(
	mode: LyricsLayerColorMode,
	primary: string,
	setMode: (value: LyricsLayerColorMode) => void,
	setSecondary: (value: string) => void,
	currentSecondary: string
) {
	setMode(mode);
	if (mode === 'gradient' && currentSecondary === primary) {
		setSecondary(seedSecondaryColor(primary));
	}
}

export default function LyricsTabBody(_props: { onReset?: () => void }) {
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
			audioLyricsActiveColorMode: s.audioLyricsActiveColorMode,
			audioLyricsActiveColorSecondary: s.audioLyricsActiveColorSecondary,
			setAudioLyricsActiveColorMode: s.setAudioLyricsActiveColorMode,
			setAudioLyricsActiveColorSecondary:
				s.setAudioLyricsActiveColorSecondary,
			audioLyricsInactiveColor: s.audioLyricsInactiveColor,
			audioLyricsInactiveColorSource: s.audioLyricsInactiveColorSource,
			audioLyricsTextTreatment: s.audioLyricsTextTreatment,
			audioLyricsStrokeColor: s.audioLyricsStrokeColor,
			audioLyricsStrokeColorSource: s.audioLyricsStrokeColorSource,
			audioLyricsStrokeColorMode: s.audioLyricsStrokeColorMode,
			audioLyricsStrokeColorSecondary: s.audioLyricsStrokeColorSecondary,
			setAudioLyricsStrokeColorMode: s.setAudioLyricsStrokeColorMode,
			setAudioLyricsStrokeColorSecondary:
				s.setAudioLyricsStrokeColorSecondary,
			audioLyricsStrokeWidth: s.audioLyricsStrokeWidth,
			audioLyricsGlowColor: s.audioLyricsGlowColor,
			audioLyricsGlowColorSource: s.audioLyricsGlowColorSource,
			audioLyricsGlowColorMode: s.audioLyricsGlowColorMode,
			audioLyricsGlowColorSecondary: s.audioLyricsGlowColorSecondary,
			setAudioLyricsGlowColorMode: s.setAudioLyricsGlowColorMode,
			setAudioLyricsGlowColorSecondary:
				s.setAudioLyricsGlowColorSecondary,
			audioLyricsGlowBlur: s.audioLyricsGlowBlur,
			audioLyricsGlowReach: s.audioLyricsGlowReach,
			audioLyricsTransitionIn: s.audioLyricsTransitionIn,
			audioLyricsTransitionOut: s.audioLyricsTransitionOut,
			audioLyricsActiveAnimation: s.audioLyricsActiveAnimation,
			audioLyricsAnimationDurationMs: s.audioLyricsAnimationDurationMs,
			audioLyricsBackdropEnabled: s.audioLyricsBackdropEnabled,
			audioLyricsBackdropColor: s.audioLyricsBackdropColor,
			audioLyricsBackdropColorSource: s.audioLyricsBackdropColorSource,
			audioLyricsBackdropColorMode: s.audioLyricsBackdropColorMode,
			audioLyricsBackdropColorSecondary:
				s.audioLyricsBackdropColorSecondary,
			audioLyricsBackdropFollowAnimation:
				s.audioLyricsBackdropFollowAnimation,
			setAudioLyricsBackdropColorMode: s.setAudioLyricsBackdropColorMode,
			setAudioLyricsBackdropColorSecondary:
				s.setAudioLyricsBackdropColorSecondary,
			setAudioLyricsBackdropFollowAnimation:
				s.setAudioLyricsBackdropFollowAnimation,
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
			setAudioLyricsInactiveColorSource:
				s.setAudioLyricsInactiveColorSource,
			setAudioLyricsTextTreatment: s.setAudioLyricsTextTreatment,
			setAudioLyricsStrokeColor: s.setAudioLyricsStrokeColor,
			setAudioLyricsStrokeColorSource: s.setAudioLyricsStrokeColorSource,
			setAudioLyricsStrokeWidth: s.setAudioLyricsStrokeWidth,
			setAudioLyricsGlowColor: s.setAudioLyricsGlowColor,
			setAudioLyricsGlowColorSource: s.setAudioLyricsGlowColorSource,
			setAudioLyricsGlowBlur: s.setAudioLyricsGlowBlur,
			setAudioLyricsGlowReach: s.setAudioLyricsGlowReach,
			setAudioLyricsTransitionIn: s.setAudioLyricsTransitionIn,
			setAudioLyricsTransitionOut: s.setAudioLyricsTransitionOut,
			setAudioLyricsActiveAnimation: s.setAudioLyricsActiveAnimation,
			setAudioLyricsAnimationDurationMs:
				s.setAudioLyricsAnimationDurationMs,
			setAudioLyricsBackdropEnabled: s.setAudioLyricsBackdropEnabled,
			setAudioLyricsBackdropColor: s.setAudioLyricsBackdropColor,
			setAudioLyricsBackdropColorSource:
				s.setAudioLyricsBackdropColorSource,
			setAudioLyricsBackdropOpacity: s.setAudioLyricsBackdropOpacity,
			setAudioLyricsBackdropPadding: s.setAudioLyricsBackdropPadding,
			setAudioLyricsBackdropRadius: s.setAudioLyricsBackdropRadius,
			upsertAudioLyricsTrackEntry: s.upsertAudioLyricsTrackEntry,
			updateAudioLyricsTrackEntry: s.updateAudioLyricsTrackEntry
		}))
	);
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const { captureMode, getCurrentTime, getFileName } = useAudioContext();
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
	}, [
		fallbackAssetId,
		playlistTracks,
		standaloneFileName,
		t.label_now_playing
	]);
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
		setSelectedAssetId(
			activeAssetId ?? availableTracks[0]?.assetId ?? null
		);
	}, [activeAssetId, availableTracks, selectedAssetId]);

	const selectedTrack =
		availableTracks.find(track => track.assetId === selectedAssetId) ??
		null;
	const selectedEntry = selectedAssetId
		? store.audioLyricsByTrackAssetId[selectedAssetId]
		: undefined;
	const selectedLyrixaBundle = selectedEntry?.lyrixaBundle ?? null;
	const hasImportedLyrixaBundle = selectedLyrixaBundle !== null;
	const selectedLyrixaRenderMode =
		selectedEntry?.lyrixaRenderMode ?? 'editor';
	const [lyrixaImportError, setLyrixaImportError] = useState<string | null>(
		null
	);

	useEffect(() => {
		setLyrixaImportError(null);
	}, [selectedAssetId]);

	const isLive = captureMode === 'microphone' || captureMode === 'desktop';
	const previewTimeSec = Math.max(
		0,
		getCurrentTime() + store.audioLyricsTimeOffsetMs / 1000
	);
	const previewLine = hasImportedLyrixaBundle
		? resolveLyrixaBundlePreviewText(selectedLyrixaBundle, previewTimeSec)
		: '';
	const liveTrackLabel = activeTrack
		? formatTrackTitle(activeTrack.name)
		: formatTrackTitle(getFileName());

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
			store.upsertAudioLyricsTrackEntry(selectedAssetId, {
				mode: 'lrc',
				rawText: '',
				lyrixaBundle: bundle,
				lyrixaRenderMode: 'editor',
				lyrixaLayerOverrides: {}
			});
			// Turn the lyrics layer on so the imported lyrics actually appear —
			// the renderer early-returns when audioLyricsEnabled is false (its
			// default), which is why a fresh import showed nothing.
			if (!store.audioLyricsEnabled) {
				store.setAudioLyricsEnabled(true);
			}
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

	function setLyrixaRenderMode(mode: 'bundle' | 'editor') {
		if (!selectedAssetId || !hasImportedLyrixaBundle) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaRenderMode: mode
		});
	}

	const selectedLayerOverrides = selectedEntry?.lyrixaLayerOverrides ?? {};

	function handleLayerOverridesChange(next: LyrixaLayerOverrideMap) {
		if (!selectedAssetId) return;
		store.updateAudioLyricsTrackEntry(selectedAssetId, {
			lyrixaLayerOverrides: next
		});
	}

	const sharedLyricsColorSource = resolveSharedColorSource([
		store.audioLyricsActiveColorSource,
		store.audioLyricsInactiveColorSource,
		store.audioLyricsStrokeColorSource,
		store.audioLyricsGlowColorSource,
		store.audioLyricsBackdropColorSource
	]);
	// Each font button previews itself in its own family — with 25 styles the
	// names alone stopped being enough to pick one.
	const fontStyleLabels = useMemo(
		() =>
			Object.fromEntries(
				TRACK_TITLE_FONTS.map(font => [
					font,
					<span style={{ fontFamily: TRACK_TITLE_FONT_STACKS[font] }}>
						{TRACK_TITLE_FONT_LABELS[font]}
					</span>
				])
			) as Record<TrackTitleFontStyle, ReactNode>,
		[]
	);
	const treatmentLabels: Record<NowPlayingTextTreatment, string> = {
		solid: t.label_treatment_solid,
		gradient: t.label_treatment_gradient,
		metallic: t.label_treatment_metallic,
		neon: t.label_treatment_neon,
		glass: t.label_treatment_glass,
		shadow: t.label_treatment_shadow
	};
	const transitionLabels: Record<LyricsTextTransition, string> = {
		none: t.label_none,
		fade: t.lyrics_transition_fade,
		'slide-up': t.lyrics_transition_slide_up,
		'slide-down': t.lyrics_transition_slide_down,
		scale: t.lyrics_transition_scale,
		blur: t.lyrics_transition_blur,
		pop: t.lyrics_transition_pop
	};
	const activeAnimationLabels: Record<LyricsActiveAnimation, string> = {
		none: t.label_none,
		pulse: t.lyrics_active_pulse,
		'glow-pulse': t.lyrics_active_glow_pulse,
		breathing: t.lyrics_active_breathing,
		'shake-light': t.lyrics_active_shake_light,
		wave: t.lyrics_active_wave,
		flicker: t.lyrics_active_flicker
	};

	return (
		<div className="flex flex-col gap-2.5">
			<FeatureGate enabled={store.audioLyricsEnabled}>
				<ColorSourceShortcuts
					label={t.label_color_source}
					value={sharedLyricsColorSource}
					onChange={store.setLyricsColorSources}
				/>
			</FeatureGate>

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
						{t.lyrics_render_mode_title}
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
							{t.lyrics_render_mode_editor}
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
							{t.lyrics_render_mode_bundle}
						</button>
					</div>
					<div
						className="mt-1 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_lyrics_render_mode}
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
				<Select<string>
					value={selectedAssetId ?? ''}
					onChange={next => setSelectedAssetId(next || null)}
					options={[
						{
							value: '',
							label: t.label_lyrics_no_track_selected
						},
						...availableTracks.map(track => ({
							value: track.assetId,
							label:
								formatTrackTitle(track.name) +
								(activeAssetId === track.assetId
									? ` • ${t.label_now_playing}`
									: '')
						}))
					]}
					size="sm"
					full
					ariaLabel={t.label_lyrics_track_target}
				/>
				<div
					className="mt-2 flex flex-col gap-0.5 text-[11px]"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					<div>
						{t.label_now_playing}:{' '}
						{liveTrackLabel || t.label_track_title_empty}
					</div>
					<div>
						{t.label_lyrics_selected_track}:{' '}
						{selectedTrack
							? formatTrackTitle(selectedTrack.name)
							: t.label_lyrics_no_track_selected}
					</div>
				</div>
			</div>

			<CollapsibleSection
				label={t.section_lyrics_bundle}
				defaultOpen={true}
			>
				<div className="flex flex-col gap-2.5">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() =>
								lyrixaImportInputRef.current?.click()
							}
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
								borderColor:
									'var(--editor-danger-border, #7f1d1d)',
								background: 'var(--editor-surface-bg)',
								color: 'var(--editor-danger-text, #fca5a5)'
							}}
						>
							{t.label_lyrics_bundle_import_failed}:{' '}
							{lyrixaImportError}
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
									{selectedLyrixaBundle?.sourceTrack
										?.fileName || t.label_track_title_empty}
								</div>
								<div>
									{t.label_lyrics_bundle_layers}:{' '}
									{selectedLyrixaBundle?.project.layers
										.length ?? 0}
								</div>
								<div>
									{t.label_lyrics_bundle_clips}:{' '}
									{selectedLyrixaBundle?.project.clips
										.length ?? 0}
								</div>
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

			<FeatureGate
				enabled={store.audioLyricsEnabled}
				hint={t.hint_enable_to_configure}
			>
				{/* Lyrixa Look renders straight from the bundle, so none of these
			    global controls reach the canvas — show why instead of stale
			    sliders. */}
				<FeatureGate
					enabled={
						!hasImportedLyrixaBundle ||
						selectedLyrixaRenderMode !== 'bundle'
					}
					hint={t.hint_lyrics_style_bundle_mode}
				>
					<CollapsibleSection
						label={t.section_lyrics_style}
						defaultOpen={true}
					>
						<div className="flex flex-col gap-2.5">
							<CollapsibleSection
								label={t.section_lyrics_placement}
								defaultOpen={true}
							>
								<div className="flex flex-col gap-2.5">
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.label_track_title_layout}
										</span>
										<EnumButtons
											options={TRACK_TITLE_LAYOUTS}
											value={store.audioLyricsLayoutMode}
											onChange={
												store.setAudioLyricsLayoutMode
											}
											labels={TRACK_TITLE_LAYOUT_LABELS}
										/>
									</div>
									{store.audioLyricsLayoutMode === 'free' && (
										<SliderControl
											label={t.label_position_x}
											value={store.audioLyricsPositionX}
											{...LYRICS_RANGES.positionX}
											onChange={
												store.setAudioLyricsPositionX
											}
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
								</div>
							</CollapsibleSection>
							<CollapsibleSection
								label={t.section_lyrics_typography}
								defaultOpen={true}
							>
								<div className="flex flex-col gap-2.5">
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.label_font_style}
										</span>
										<EnumButtons
											options={TRACK_TITLE_FONTS}
											value={store.audioLyricsFontStyle}
											onChange={
												store.setAudioLyricsFontStyle
											}
											labels={fontStyleLabels}
											tooltips={TRACK_TITLE_FONT_LABELS}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.label_text_treatment}
										</span>
										<EnumButtons
											options={TEXT_TREATMENTS}
											value={
												store.audioLyricsTextTreatment
											}
											onChange={
												store.setAudioLyricsTextTreatment
											}
											labels={treatmentLabels}
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
										onChange={
											store.setAudioLyricsLetterSpacing
										}
										unit="px"
									/>
									<SliderControl
										label={t.label_lyrics_line_height}
										value={store.audioLyricsLineHeight}
										{...LYRICS_RANGES.lineHeight}
										onChange={
											store.setAudioLyricsLineHeight
										}
									/>
								</div>
							</CollapsibleSection>
							<CollapsibleSection
								label={t.section_lyrics_timing}
								defaultOpen={true}
							>
								<div className="flex flex-col gap-2.5">
									<SliderControl
										label={
											t.label_lyrics_visible_line_count
										}
										value={
											store.audioLyricsVisibleLineCount
										}
										{...LYRICS_RANGES.visibleLineCount}
										onChange={
											store.setAudioLyricsVisibleLineCount
										}
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
										onChange={
											store.setAudioLyricsInactiveOpacity
										}
									/>
									<SliderControl
										label={t.label_lyrics_time_offset}
										value={store.audioLyricsTimeOffsetMs}
										{...LYRICS_RANGES.timeOffsetMs}
										onChange={
											store.setAudioLyricsTimeOffsetMs
										}
										unit="ms"
									/>
									{/* The resolved line lives next to the offset
									    that shifts it — as its own section it was
									    a readout with no context. */}
									<div
										className="rounded border p-2 text-xs"
										style={{
											borderColor:
												'var(--editor-accent-border)',
											background:
												'var(--editor-surface-bg)'
										}}
									>
										<div
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.label_lyrics_preview_active}
										</div>
										<div
											className="mt-1 text-sm font-semibold"
											style={{
												color: 'var(--editor-text-primary)'
											}}
										>
											{previewLine ||
												t.label_lyrics_preview_empty}
										</div>
									</div>
								</div>
							</CollapsibleSection>
							<CollapsibleSection
								label={t.lyrics_section_animation}
								defaultOpen={true}
							>
								<div className="flex flex-col gap-2.5">
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.lyrics_label_transition_in}
										</span>
										<EnumButtons
											options={LYRICS_TRANSITIONS}
											value={
												store.audioLyricsTransitionIn
											}
											onChange={
												store.setAudioLyricsTransitionIn
											}
											labels={transitionLabels}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.lyrics_label_transition_out}
										</span>
										<EnumButtons
											options={LYRICS_TRANSITIONS}
											value={
												store.audioLyricsTransitionOut
											}
											onChange={
												store.setAudioLyricsTransitionOut
											}
											labels={transitionLabels}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{
												color: 'var(--editor-accent-soft)'
											}}
										>
											{t.lyrics_label_active_animation}
										</span>
										<EnumButtons
											options={LYRICS_ACTIVE_ANIMATIONS}
											value={
												store.audioLyricsActiveAnimation
											}
											onChange={
												store.setAudioLyricsActiveAnimation
											}
											labels={activeAnimationLabels}
										/>
									</div>
									<SliderControl
										label={
											t.lyrics_label_animation_duration
										}
										value={
											store.audioLyricsAnimationDurationMs
										}
										{...LYRICS_RANGES.animationDurationMs}
										onChange={
											store.setAudioLyricsAnimationDurationMs
										}
										unit="ms"
									/>
								</div>
							</CollapsibleSection>
							<CollapsibleSection
								label={t.section_lyrics_colors}
								defaultOpen={true}
							>
								<div className="flex flex-col gap-2.5">
									<LyricsColorSlotControls
										label={t.label_lyrics_active_color}
										source={
											store.audioLyricsActiveColorSource
										}
										onSourceChange={
											store.setAudioLyricsActiveColorSource
										}
										mode={store.audioLyricsActiveColorMode}
										onModeChange={value =>
											applyColorMode(
												value,
												store.audioLyricsActiveColor,
												store.setAudioLyricsActiveColorMode,
												store.setAudioLyricsActiveColorSecondary,
												store.audioLyricsActiveColorSecondary
											)
										}
										primaryColor={
											store.audioLyricsActiveColor
										}
										onPrimaryColorChange={
											store.setAudioLyricsActiveColor
										}
										secondaryColor={
											store.audioLyricsActiveColorSecondary
										}
										onSecondaryColorChange={
											store.setAudioLyricsActiveColorSecondary
										}
									/>
									<AdaptiveColorInput
										label={t.label_lyrics_inactive_color}
										source={
											store.audioLyricsInactiveColorSource
										}
										onSourceChange={
											store.setAudioLyricsInactiveColorSource
										}
										value={store.audioLyricsInactiveColor}
										onChange={
											store.setAudioLyricsInactiveColor
										}
									/>
									<LyricsColorSlotControls
										label={t.lyrics_label_stroke_color}
										source={
											store.audioLyricsStrokeColorSource
										}
										onSourceChange={
											store.setAudioLyricsStrokeColorSource
										}
										mode={store.audioLyricsStrokeColorMode}
										onModeChange={value =>
											applyColorMode(
												value,
												store.audioLyricsStrokeColor,
												store.setAudioLyricsStrokeColorMode,
												store.setAudioLyricsStrokeColorSecondary,
												store.audioLyricsStrokeColorSecondary
											)
										}
										primaryColor={
											store.audioLyricsStrokeColor
										}
										onPrimaryColorChange={
											store.setAudioLyricsStrokeColor
										}
										secondaryColor={
											store.audioLyricsStrokeColorSecondary
										}
										onSecondaryColorChange={
											store.setAudioLyricsStrokeColorSecondary
										}
									/>
									<SliderControl
										label={t.lyrics_label_stroke_width}
										value={store.audioLyricsStrokeWidth}
										{...LYRICS_RANGES.strokeWidth}
										onChange={
											store.setAudioLyricsStrokeWidth
										}
										unit="px"
									/>
									<LyricsColorSlotControls
										label={t.label_glow_color}
										source={
											store.audioLyricsGlowColorSource
										}
										onSourceChange={
											store.setAudioLyricsGlowColorSource
										}
										mode={store.audioLyricsGlowColorMode}
										onModeChange={value =>
											applyColorMode(
												value,
												store.audioLyricsGlowColor,
												store.setAudioLyricsGlowColorMode,
												store.setAudioLyricsGlowColorSecondary,
												store.audioLyricsGlowColorSecondary
											)
										}
										primaryColor={
											store.audioLyricsGlowColor
										}
										onPrimaryColorChange={
											store.setAudioLyricsGlowColor
										}
										secondaryColor={
											store.audioLyricsGlowColorSecondary
										}
										onSecondaryColorChange={
											store.setAudioLyricsGlowColorSecondary
										}
									/>
									<SliderControl
										label={t.label_glow_blur}
										value={store.audioLyricsGlowBlur}
										{...LYRICS_RANGES.glowBlur}
										onChange={store.setAudioLyricsGlowBlur}
									/>
									<SliderControl
										label={t.label_glow_reach}
										value={store.audioLyricsGlowReach}
										{...LYRICS_RANGES.glowReach}
										onChange={store.setAudioLyricsGlowReach}
									/>
								</div>
							</CollapsibleSection>
							<CollapsibleSection
								label={t.label_backdrop}
								defaultOpen={store.audioLyricsBackdropEnabled}
							>
								<ToggleControl
									label={t.label_backdrop}
									value={store.audioLyricsBackdropEnabled}
									onChange={
										store.setAudioLyricsBackdropEnabled
									}
								/>
								{store.audioLyricsBackdropEnabled ? (
									<>
										<LyricsColorSlotControls
											label={t.label_backdrop_color}
											source={
												store.audioLyricsBackdropColorSource
											}
											onSourceChange={
												store.setAudioLyricsBackdropColorSource
											}
											mode={
												store.audioLyricsBackdropColorMode
											}
											onModeChange={value =>
												applyColorMode(
													value,
													store.audioLyricsBackdropColor,
													store.setAudioLyricsBackdropColorMode,
													store.setAudioLyricsBackdropColorSecondary,
													store.audioLyricsBackdropColorSecondary
												)
											}
											primaryColor={
												store.audioLyricsBackdropColor
											}
											onPrimaryColorChange={
												store.setAudioLyricsBackdropColor
											}
											secondaryColor={
												store.audioLyricsBackdropColorSecondary
											}
											onSecondaryColorChange={
												store.setAudioLyricsBackdropColorSecondary
											}
										/>
										<ToggleControl
											label={
												t.label_backdrop_follow_animation
											}
											tooltip={
												t.hint_backdrop_follow_animation
											}
											value={
												store.audioLyricsBackdropFollowAnimation
											}
											onChange={
												store.setAudioLyricsBackdropFollowAnimation
											}
										/>
										<SliderControl
											label={t.label_backdrop_opacity}
											value={
												store.audioLyricsBackdropOpacity
											}
											{...LYRICS_RANGES.backdropOpacity}
											onChange={
												store.setAudioLyricsBackdropOpacity
											}
										/>
										<SliderControl
											label={t.label_backdrop_padding}
											value={
												store.audioLyricsBackdropPadding
											}
											{...LYRICS_RANGES.backdropPadding}
											onChange={
												store.setAudioLyricsBackdropPadding
											}
											unit="px"
										/>
										<SliderControl
											label={t.label_corner_radius}
											value={
												store.audioLyricsBackdropRadius
											}
											{...LYRICS_RANGES.backdropRadius}
											onChange={
												store.setAudioLyricsBackdropRadius
											}
											unit="px"
										/>
									</>
								) : null}
							</CollapsibleSection>
						</div>
					</CollapsibleSection>
				</FeatureGate>
			</FeatureGate>

			{hasImportedLyrixaBundle && selectedLyrixaBundle ? (
				<CollapsibleSection
					label={t.section_lyrics_layers}
					defaultOpen={true}
				>
					<FeatureGate
						enabled={store.audioLyricsEnabled}
						hint={t.hint_enable_to_configure}
					>
						<LyricsLayersPanel
							bundle={selectedLyrixaBundle}
							overrides={selectedLayerOverrides}
							onOverridesChange={handleLayerOverridesChange}
						/>
					</FeatureGate>
				</CollapsibleSection>
			) : null}
		</div>
	);
}
