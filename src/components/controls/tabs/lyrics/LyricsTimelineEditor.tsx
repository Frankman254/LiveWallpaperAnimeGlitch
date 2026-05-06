import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	chooseTimelineTickInterval,
	formatTimelineTime,
	getTimelineWindowForClip,
	moveTimelineClip,
	resizeTimelineClipEnd,
	resizeTimelineClipStart,
	sortLyricsTimelineClips,
	type LyricsTimelineClip
} from '@/features/lyrics/timeline';

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
	clipId: string;
	mode: DragMode;
	initialClientX: number;
	initialClips: LyricsTimelineClip[];
};

interface LyricsTimelineEditorProps {
	clips: LyricsTimelineClip[];
	duration: number;
	currentTime: number;
	isPaused: boolean;
	playLabel: string;
	pauseLabel: string;
	disabled?: boolean;
	disabledMessage?: string | null;
	onSeek: (time: number) => void;
	onPlayToggle: () => void;
	onCommitClips: (nextClips: LyricsTimelineClip[]) => void;
}

const MIN_ZOOM = 28;
const MAX_ZOOM = 220;
const LANE_HEIGHT = 78;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export default function LyricsTimelineEditor({
	clips,
	duration,
	currentTime,
	isPaused,
	playLabel,
	pauseLabel,
	disabled = false,
	disabledMessage = null,
	onSeek,
	onPlayToggle,
	onCommitClips
}: LyricsTimelineEditorProps) {
	const [pxPerSecond, setPxPerSecond] = useState(74);
	const [selectedClipId, setSelectedClipId] = useState<string | null>(
		clips[0]?.id ?? null
	);
	const [draftClips, setDraftClips] = useState<LyricsTimelineClip[]>(() =>
		sortLyricsTimelineClips(clips)
	);
	const scrollRef = useRef<HTMLDivElement | null>(null);
	const dragStateRef = useRef<DragState | null>(null);

	useEffect(() => {
		if (dragStateRef.current) return;
		setDraftClips(sortLyricsTimelineClips(clips));
		setSelectedClipId(currentSelected => {
			if (!currentSelected) return clips[0]?.id ?? null;
			return clips.some(clip => clip.id === currentSelected)
				? currentSelected
				: clips[0]?.id ?? null;
		});
	}, [clips]);

	useEffect(() => {
		if (!scrollRef.current) return;
		const scroller = scrollRef.current;
		const playheadX = currentTime * pxPerSecond;
		const viewportStart = scroller.scrollLeft;
		const viewportEnd = viewportStart + scroller.clientWidth;
		if (playheadX < viewportStart + 64 || playheadX > viewportEnd - 64) {
			scroller.scrollLeft = Math.max(0, playheadX - scroller.clientWidth / 2);
		}
	}, [currentTime, pxPerSecond]);

	const sortedClips = useMemo(
		() => sortLyricsTimelineClips(draftClips),
		[draftClips]
	);
	const effectiveDuration = useMemo(() => {
		const lastStart = sortedClips[sortedClips.length - 1]?.startTime ?? 0;
		return Math.max(duration, lastStart + 4, 12);
	}, [duration, sortedClips]);
	const laneWidth = effectiveDuration * pxPerSecond;
	const tickInterval = useMemo(
		() => chooseTimelineTickInterval(pxPerSecond),
		[pxPerSecond]
	);
	const ticks = useMemo(() => {
		const count = Math.ceil(effectiveDuration / tickInterval);
		return Array.from({ length: count + 1 }, (_, index) => {
			const time = index * tickInterval;
			return {
				time,
				left: time * pxPerSecond
			};
		});
	}, [effectiveDuration, pxPerSecond, tickInterval]);

	const seekFromClientX = useCallback(
		(clientX: number) => {
			const scroller = scrollRef.current;
			if (!scroller) return;
			const rect = scroller.getBoundingClientRect();
			const relativeX = clientX - rect.left + scroller.scrollLeft;
			onSeek(clamp(relativeX / pxPerSecond, 0, effectiveDuration));
		},
		[effectiveDuration, onSeek, pxPerSecond]
	);

	const commitDraft = useCallback(
		(nextClips: LyricsTimelineClip[]) => {
			const normalized = sortLyricsTimelineClips(nextClips);
			setDraftClips(normalized);
			onCommitClips(normalized);
		},
		[onCommitClips]
	);

	const handleTimelinePointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (disabled) return;
			if ((event.target as HTMLElement).closest('[data-lyric-clip="true"]')) {
				return;
			}
			seekFromClientX(event.clientX);
		},
		[disabled, seekFromClientX]
	);

	const handleClipPointerDown = useCallback(
		(
			event: React.PointerEvent<HTMLDivElement>,
			clipId: string,
			mode: DragMode
		) => {
			if (disabled) return;
			event.stopPropagation();
			setSelectedClipId(clipId);
			dragStateRef.current = {
				clipId,
				mode,
				initialClientX: event.clientX,
				initialClips: sortLyricsTimelineClips(draftClips)
			};
		},
		[disabled, draftClips]
	);

	useEffect(() => {
		function handlePointerMove(event: PointerEvent) {
			const dragState = dragStateRef.current;
			if (!dragState) return;
			const deltaSeconds =
				(event.clientX - dragState.initialClientX) / pxPerSecond;
			const initialClips = dragState.initialClips;
			const clipIndex = initialClips.findIndex(
				clip => clip.id === dragState.clipId
			);
			if (clipIndex < 0) return;
			const clip = initialClips[clipIndex]!;
			const bounds = getTimelineWindowForClip(
				initialClips,
				clipIndex,
				effectiveDuration
			);

			if (dragState.mode === 'move') {
				setDraftClips(
					moveTimelineClip(
						initialClips,
						dragState.clipId,
						clip.startTime + deltaSeconds,
						effectiveDuration
					)
				);
				return;
			}

			if (dragState.mode === 'resize-start') {
				setDraftClips(
					resizeTimelineClipStart(
						initialClips,
						dragState.clipId,
						clip.startTime + deltaSeconds,
						effectiveDuration
					)
				);
				return;
			}

			setDraftClips(
				resizeTimelineClipEnd(
					initialClips,
					dragState.clipId,
					bounds.endTime + deltaSeconds,
					effectiveDuration
				)
			);
		}

		function handlePointerUp() {
			if (!dragStateRef.current) return;
			dragStateRef.current = null;
			commitDraft(draftClips);
		}

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('pointercancel', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			window.removeEventListener('pointercancel', handlePointerUp);
		};
	}, [commitDraft, draftClips, effectiveDuration, pxPerSecond]);

	return (
		<div
			className="rounded border"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div
				className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
				style={{ borderColor: 'var(--editor-accent-border)' }}
			>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onPlayToggle}
						disabled={disabled}
						className="rounded border px-3 py-1 text-xs font-semibold disabled:opacity-40"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-text-primary)',
							background: 'var(--editor-surface-elevated)'
						}}
					>
						{isPaused ? playLabel : pauseLabel}
					</button>
					<div
						className="text-xs tabular-nums"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{formatTimelineTime(currentTime)} / {formatTimelineTime(effectiveDuration)}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setPxPerSecond(value => clamp(value / 1.2, MIN_ZOOM, MAX_ZOOM))}
						className="rounded border px-2 py-1 text-xs"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)'
						}}
					>
						-
					</button>
					<div
						className="min-w-[70px] text-center text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{Math.round(pxPerSecond)} px/s
					</div>
					<button
						type="button"
						onClick={() => setPxPerSecond(value => clamp(value * 1.2, MIN_ZOOM, MAX_ZOOM))}
						className="rounded border px-2 py-1 text-xs"
						style={{
							borderColor: 'var(--editor-accent-border)',
							color: 'var(--editor-accent-soft)'
						}}
					>
						+
					</button>
				</div>
			</div>

			{disabled ? (
				<div
					className="px-3 py-4 text-xs leading-relaxed"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{disabledMessage}
				</div>
			) : (
				<div
					ref={scrollRef}
					className="overflow-x-auto overflow-y-hidden px-2 py-2"
				>
					<div style={{ width: `${laneWidth}px`, minWidth: '100%' }}>
						<div
							className="relative h-8 cursor-pointer border-b"
							style={{ borderColor: 'var(--editor-accent-border)' }}
							onPointerDown={handleTimelinePointerDown}
						>
							{ticks.map(tick => (
								<div
									key={tick.time}
									className="absolute top-0 h-full"
									style={{ left: `${tick.left}px` }}
								>
									<div
										className="h-full w-px"
										style={{ background: 'var(--editor-accent-border)' }}
									/>
									<span
										className="absolute left-1 top-1 text-[10px] tabular-nums"
										style={{ color: 'var(--editor-accent-muted)' }}
									>
										{formatTimelineTime(tick.time)}
									</span>
								</div>
							))}
							<div
								className="absolute top-0 h-full w-px"
								style={{
									left: `${currentTime * pxPerSecond}px`,
									background: '#f8fafc',
									boxShadow: '0 0 8px rgba(248,250,252,0.85)',
									zIndex: 30
								}}
							/>
						</div>

						<div
							className="relative mt-2 cursor-pointer rounded border"
							style={{
								height: `${LANE_HEIGHT}px`,
								borderColor: 'var(--editor-accent-border)',
								background:
									'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(2,6,23,0.82) 100%)'
							}}
							onPointerDown={handleTimelinePointerDown}
						>
							<div
								className="absolute inset-y-0 w-px"
								style={{
									left: `${currentTime * pxPerSecond}px`,
									background: '#f8fafc',
									boxShadow: '0 0 8px rgba(248,250,252,0.85)',
									zIndex: 25
								}}
							/>

							{sortedClips.map((clip, index) => {
								const window = getTimelineWindowForClip(
									sortedClips,
									index,
									effectiveDuration
								);
								const width = Math.max(
									18,
									(window.endTime - window.startTime) * pxPerSecond
								);
								const isSelected = selectedClipId === clip.id;
								const isLastClip = index === sortedClips.length - 1;
								return (
									<div
										key={clip.id}
										data-lyric-clip="true"
										className="absolute top-2 flex h-[60px] overflow-hidden rounded-md border"
										style={{
											left: `${window.startTime * pxPerSecond}px`,
											width: `${width}px`,
											borderColor: isSelected
												? '#93c5fd'
												: 'rgba(147,197,253,0.35)',
											background: isSelected
												? 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(14,165,233,0.16))'
												: 'linear-gradient(135deg, rgba(30,41,59,0.88), rgba(15,23,42,0.92))',
											boxShadow: isSelected
												? '0 0 0 1px rgba(147,197,253,0.45), 0 10px 22px rgba(2,6,23,0.28)'
												: '0 8px 16px rgba(2,6,23,0.2)',
											zIndex: isSelected ? 20 : 10
										}}
										onPointerDown={event =>
											handleClipPointerDown(event, clip.id, 'move')
										}
										onDoubleClick={() => onSeek(clip.startTime)}
									>
										<div
											className="w-2 shrink-0 cursor-ew-resize"
											style={{ background: 'rgba(148,163,184,0.22)' }}
											onPointerDown={event =>
												handleClipPointerDown(
													event,
													clip.id,
													'resize-start'
												)
											}
										/>
										<div className="min-w-0 flex-1 px-2 py-1.5">
											<div
												className="truncate text-[11px] font-semibold uppercase tracking-[0.22em]"
												style={{ color: 'var(--editor-accent-soft)' }}
											>
												{formatTimelineTime(clip.startTime)}
											</div>
											<div
												className="mt-1 line-clamp-2 text-xs font-medium"
												style={{ color: 'var(--editor-text-primary)' }}
											>
												{clip.text || '...'}
											</div>
										</div>
										<div
											className={`w-2 shrink-0 ${
												isLastClip ? 'cursor-not-allowed opacity-30' : 'cursor-ew-resize'
											}`}
											style={{ background: 'rgba(148,163,184,0.22)' }}
											onPointerDown={
												isLastClip
													? undefined
													: event =>
															handleClipPointerDown(
																event,
																clip.id,
																'resize-end'
															)
											}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
