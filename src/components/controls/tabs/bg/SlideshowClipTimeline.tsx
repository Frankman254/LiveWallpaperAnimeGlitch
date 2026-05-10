import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudioContext } from '@/context/useAudioContext';
import { useWallpaperStore } from '@/store/wallpaperStore';

const MIN_CLIP_DURATION = 0.5;
const CLIP_COLORS = [
	'#ff6b6b',
	'#ffd43b',
	'#51cf66',
	'#4dabf7',
	'#cc5de8',
	'#ff922b',
	'#20c997',
	'#f06595'
];

type TimelineClip = {
	assetId: string;
	index: number;
	start: number;
	end: number;
	isManual: boolean;
	imageUrl: string | null;
	thumbnailUrl: string | null;
	enabled: boolean;
};

type DragMode = 'move' | 'resize-start' | 'resize-end';

type DragState = {
	pointerId: number;
	clipIndex: number;
	mode: DragMode;
	originStart: number;
	originEnd: number;
	originTime: number;
} | null;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function formatTime(seconds: number): string {
	const total = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = total % 60;
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}
	return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function buildTimelineClips(
	images: ReturnType<typeof useWallpaperStore.getState>['backgroundImages'],
	duration: number
): TimelineClip[] {
	const visibleImages = images.filter(image => image.url);
	if (visibleImages.length === 0 || duration <= 0) return [];

	const starts: number[] = [];
	for (let index = 0; index < visibleImages.length; index += 1) {
		const image = visibleImages[index]!;
		const autoStart = (duration / Math.max(visibleImages.length, 1)) * index;
		const previousStart = starts[index - 1] ?? 0;
		const remainingClips = visibleImages.length - index - 1;
		const minStart = index === 0 ? 0 : previousStart + MIN_CLIP_DURATION;
		const maxStart = Math.max(
			minStart,
			duration - remainingClips * MIN_CLIP_DURATION
		);
		const candidate = index === 0 ? 0 : image.playbackSwitchAt ?? autoStart;
		starts.push(clamp(candidate, minStart, maxStart));
	}

	return visibleImages.map((image, index) => ({
		assetId: image.assetId,
		index,
		start: starts[index] ?? 0,
		end: starts[index + 1] ?? duration,
		isManual: image.playbackSwitchAt != null,
		imageUrl: image.url,
		thumbnailUrl: image.thumbnailUrl,
		enabled: image.enabled,
	}));
}

export default function SlideshowClipTimeline() {
	const {
		backgroundImages,
		activeImageId,
		setActiveImageId,
		setBackgroundImagePlaybackSwitchAt
	} = useWallpaperStore();
	const { getDuration, getCurrentTime } = useAudioContext();
	const trackRef = useRef<HTMLDivElement | null>(null);
	const rafRef = useRef(0);
	const dragStateRef = useRef<DragState>(null);
	const [duration, setDuration] = useState(0);
	const [playheadTime, setPlayheadTime] = useState(0);
	const clips = useMemo(
		() => buildTimelineClips(backgroundImages, duration),
		[backgroundImages, duration]
	);

	useEffect(() => {
		let alive = true;
		const tick = () => {
			if (!alive) return;
			setDuration(Math.max(0, getDuration()));
			setPlayheadTime(Math.max(0, getCurrentTime()));
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			alive = false;
			cancelAnimationFrame(rafRef.current);
		};
	}, [getCurrentTime, getDuration]);

	const timeFromClientX = useCallback(
		(clientX: number) => {
			const rect = trackRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0 || duration <= 0) return 0;
			const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
			return ratio * duration;
		},
		[duration]
	);

	const applyClipMutation = useCallback(
		(clipIndex: number, mode: DragMode, nextTime: number) => {
			const clip = clips[clipIndex];
			if (!clip) return;

			if (mode === 'resize-start') {
				if (clipIndex === 0) return;
				const previousClip = clips[clipIndex - 1];
				const minStart = (previousClip?.start ?? 0) + MIN_CLIP_DURATION;
				const maxStart = clip.end - MIN_CLIP_DURATION;
				setBackgroundImagePlaybackSwitchAt(
					clip.assetId,
					clamp(nextTime, minStart, maxStart)
				);
				return;
			}

			if (mode === 'resize-end') {
				const nextClip = clips[clipIndex + 1];
				if (!nextClip) return;
				const nextNextStart = clips[clipIndex + 2]?.start ?? duration;
				const minEnd = clip.start + MIN_CLIP_DURATION;
				const maxEnd = nextNextStart - MIN_CLIP_DURATION;
				setBackgroundImagePlaybackSwitchAt(
					nextClip.assetId,
					clamp(nextTime, minEnd, maxEnd)
				);
				return;
			}

			const dragState = dragStateRef.current;
			if (!dragState) return;
			const delta = nextTime - dragState.originTime;
			const clipDuration = dragState.originEnd - dragState.originStart;

			if (clipIndex === 0) {
				const nextClip = clips[clipIndex + 1];
				if (!nextClip) return;
				const nextNextStart = clips[clipIndex + 2]?.start ?? duration;
				const nextEnd = clamp(
					dragState.originEnd + delta,
					MIN_CLIP_DURATION,
					nextNextStart - MIN_CLIP_DURATION
				);
				setBackgroundImagePlaybackSwitchAt(nextClip.assetId, nextEnd);
				return;
			}

			if (clipIndex === clips.length - 1) {
				const previousStart = clips[clipIndex - 1]?.start ?? 0;
				const nextStart = clamp(
					dragState.originStart + delta,
					previousStart + MIN_CLIP_DURATION,
					duration - MIN_CLIP_DURATION
				);
				setBackgroundImagePlaybackSwitchAt(clip.assetId, nextStart);
				return;
			}

			const nextClip = clips[clipIndex + 1];
			if (!nextClip) return;
			const previousStart = clips[clipIndex - 1]?.start ?? 0;
			const nextNextStart = clips[clipIndex + 2]?.start ?? duration;
			const nextStart = clamp(
				dragState.originStart + delta,
				previousStart + MIN_CLIP_DURATION,
				nextNextStart - MIN_CLIP_DURATION - clipDuration
			);
			setBackgroundImagePlaybackSwitchAt(clip.assetId, nextStart);
			setBackgroundImagePlaybackSwitchAt(
				nextClip.assetId,
				nextStart + clipDuration
			);
		},
		[clips, duration, setBackgroundImagePlaybackSwitchAt]
	);

	const handlePointerDown = useCallback(
		(
			event: React.PointerEvent<HTMLDivElement>,
			clipIndex: number,
			mode: DragMode
		) => {
			const clip = clips[clipIndex];
			if (!clip) return;
			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);
			dragStateRef.current = {
				pointerId: event.pointerId,
				clipIndex,
				mode,
				originStart: clip.start,
				originEnd: clip.end,
				originTime: timeFromClientX(event.clientX)
			};
			setActiveImageId(clip.assetId);
		},
		[clips, setActiveImageId, timeFromClientX]
	);

	const handleTrackPointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const dragState = dragStateRef.current;
			if (!dragState || dragState.pointerId !== event.pointerId) return;
			applyClipMutation(
				dragState.clipIndex,
				dragState.mode,
				timeFromClientX(event.clientX)
			);
		},
		[applyClipMutation, timeFromClientX]
	);

	const handleTrackPointerUp = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (dragStateRef.current?.pointerId !== event.pointerId) return;
			event.currentTarget.releasePointerCapture(event.pointerId);
			dragStateRef.current = null;
		},
		[]
	);

	if (duration <= 0 || clips.length === 0) {
		return (
			<div
				className="rounded border px-2.5 py-2 text-[11px]"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-surface-bg)',
					color: 'var(--editor-accent-muted)'
				}}
			>
				Load a file track to edit slideshow timing on a real timeline.
			</div>
		);
	}

	const playheadPct = clamp(playheadTime / duration, 0, 1) * 100;

	return (
		<div className="flex flex-col gap-2">
			<div
				className="flex items-center justify-between text-[10px] tabular-nums"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				<span>0:00</span>
				<span>{formatTime(playheadTime)} / {formatTime(duration)}</span>
				<span>{formatTime(duration)}</span>
			</div>
			<div
				ref={trackRef}
				className="relative h-28 select-none overflow-hidden rounded border"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background:
						'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))'
				}}
				onPointerMove={handleTrackPointerMove}
				onPointerUp={handleTrackPointerUp}
				onPointerCancel={handleTrackPointerUp}
			>
				<div
					className="pointer-events-none absolute inset-y-0 w-px"
					style={{
						left: `${playheadPct}%`,
						background: 'rgba(255,255,255,0.9)',
						boxShadow: '0 0 6px rgba(255,255,255,0.5)',
						zIndex: 30
					}}
				/>
				<div className="pointer-events-none absolute inset-x-0 top-0 flex h-5">
					{Array.from({ length: 8 }).map((_, index) => (
						<div
							key={index}
							className="relative h-full flex-1 border-r last:border-r-0"
							style={{ borderColor: 'rgba(255,255,255,0.07)' }}
						>
							<span
								className="absolute left-1 top-1 text-[9px] tabular-nums"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{formatTime((duration / 8) * index)}
							</span>
						</div>
					))}
				</div>
				<div className="absolute inset-x-2 bottom-2 top-7">
					{clips.map(clip => {
						const leftPct = (clip.start / duration) * 100;
						const widthPct = ((clip.end - clip.start) / duration) * 100;
						const color = CLIP_COLORS[clip.index % CLIP_COLORS.length]!;
						const isActive = activeImageId === clip.assetId;
						return (
							<div
								key={clip.assetId}
								className="absolute h-14 overflow-hidden rounded border"
								style={{
									left: `${leftPct}%`,
									width: `${Math.max(widthPct, 1.2)}%`,
									top: clip.index % 2 === 0 ? 0 : 16,
									borderColor: isActive ? '#fff' : 'rgba(255,255,255,0.16)',
									background:
										clip.thumbnailUrl || clip.imageUrl
											? `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.48)), url("${clip.thumbnailUrl ?? clip.imageUrl}") center / cover`
											: color,
									boxShadow: isActive
										? `0 0 0 1px ${color}, 0 0 18px ${color}66`
										: undefined,
									opacity: clip.enabled ? 1 : 0.42,
									minWidth: 28
								}}
								onPointerDown={event =>
									handlePointerDown(event, clip.index, 'move')
								}
								onClick={() => setActiveImageId(clip.assetId)}
								title={`Image ${clip.index + 1} · ${formatTime(clip.start)} - ${formatTime(clip.end)}`}
							>
								{clip.index > 0 ? (
									<div
										className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize"
										onPointerDown={event =>
											handlePointerDown(
												event,
												clip.index,
												'resize-start'
											)
										}
									/>
								) : null}
								{clip.index < clips.length - 1 ? (
									<div
										className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize"
										onPointerDown={event =>
											handlePointerDown(
												event,
												clip.index,
												'resize-end'
											)
										}
									/>
								) : null}
								<div className="pointer-events-none flex h-full flex-col justify-between bg-black/25 px-2 py-1">
									<div className="flex items-center justify-between gap-2">
										<span className="truncate text-[10px] font-semibold text-white">
											IMG {clip.index + 1}
										</span>
										<span className="text-[9px] text-white/85">
											{clip.isManual ? 'manual' : 'auto'}
										</span>
									</div>
									<div className="text-[9px] tabular-nums text-white/85">
										{formatTime(clip.start)} - {formatTime(clip.end)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<div
				className="rounded border px-2.5 py-2 text-[11px] leading-snug"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-surface-bg)',
					color: 'var(--editor-accent-muted)'
				}}
			>
				Drag a card to move its image span. Drag left or right edges to trim when an image starts or ends.
			</div>
		</div>
	);
}
