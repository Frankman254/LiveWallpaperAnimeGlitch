import { useCallback, useRef, useState, useEffect } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/AudioDataContext';

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Visual timeline bar for placing image timestamps.
 * Each image gets a draggable marker on the bar.
 * The playhead shows current audio position.
 */
export default function TimestampTimeline() {
	const store = useWallpaperStore();
	const { getDuration, getCurrentTime } = useAudioContext();
	const trackRef = useRef<HTMLDivElement>(null);
	const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
	const [playheadPos, setPlayheadPos] = useState(0);
	const rafRef = useRef(0);

	const images = store.backgroundImages.filter(img => img.url);
	const duration = getDuration();

	// Update playhead position via rAF
	useEffect(() => {
		if (duration <= 0) return;
		const tick = () => {
			const t = getCurrentTime();
			setPlayheadPos(Math.min(1, Math.max(0, t / duration)));
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [duration, getCurrentTime]);

	const getPositionFromEvent = useCallback(
		(clientX: number) => {
			const track = trackRef.current;
			if (!track || duration <= 0) return 0;
			const rect = track.getBoundingClientRect();
			const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
			return Math.round(ratio * duration);
		},
		[duration]
	);

	const handlePointerDown = useCallback(
		(index: number, e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDraggingIdx(index);
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[]
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (draggingIdx == null) return;
			const seconds = getPositionFromEvent(e.clientX);
			const img = images[draggingIdx];
			if (img) {
				store.setActiveImageId(img.assetId);
				store.setImagePlaybackSwitchAt(seconds);
			}
		},
		[draggingIdx, getPositionFromEvent, images, store]
	);

	const handlePointerUp = useCallback(() => {
		setDraggingIdx(null);
	}, []);

	const handleTrackClick = useCallback(
		(e: React.MouseEvent) => {
			// If clicking the track (not a marker), do nothing or seek
			if ((e.target as HTMLElement).dataset.marker) return;
		},
		[]
	);

	if (duration <= 0 || images.length === 0) {
		return (
			<div
				className="rounded border px-2 py-2 text-center text-[10px]"
				style={{
					borderColor: 'var(--editor-accent-border)',
					background: 'var(--editor-surface-bg)',
					color: 'var(--editor-accent-muted)'
				}}
			>
				Load an audio file to use the visual timeline
			</div>
		);
	}

	// Build effective timestamps per image (manual or auto-calculated)
	const effectiveTimestamps = images.map((img, i) => {
		const calculated = (duration / Math.max(images.length, 1)) * i;
		return {
			assetId: img.assetId,
			time: img.playbackSwitchAt != null ? img.playbackSwitchAt : calculated,
			isManual: img.playbackSwitchAt != null,
			index: i
		};
	});

	// Generate colors per image (cycle a small palette)
	const COLORS = [
		'#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
		'#ff922b', '#cc5de8', '#20c997', '#f06595',
		'#845ef7', '#339af0', '#51cf66', '#fcc419'
	];

	return (
		<div className="flex flex-col gap-1.5">
			{/* Timeline track */}
			<div
				ref={trackRef}
				className="relative h-8 cursor-crosshair select-none rounded"
				style={{
					background: 'var(--editor-surface-bg)',
					border: '1px solid var(--editor-accent-border)'
				}}
				onClick={handleTrackClick}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerUp}
			>
				{/* Duration labels */}
				<span
					className="absolute left-1 top-0.5 text-[8px] pointer-events-none"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					0:00
				</span>
				<span
					className="absolute right-1 top-0.5 text-[8px] pointer-events-none"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{formatTime(duration)}
				</span>

				{/* Image zone backgrounds (colored segments) */}
				{effectiveTimestamps
					.slice()
					.sort((a, b) => a.time - b.time)
					.map((entry, sortedIdx, sorted) => {
						const startPct = (entry.time / duration) * 100;
						const nextTime = sorted[sortedIdx + 1]?.time ?? duration;
						const widthPct = ((nextTime - entry.time) / duration) * 100;
						const color = COLORS[entry.index % COLORS.length];
						return (
							<div
								key={`zone-${entry.assetId}`}
								className="absolute top-0 h-full pointer-events-none"
								style={{
									left: `${startPct}%`,
									width: `${Math.max(0.5, widthPct)}%`,
									background: color,
									opacity: store.activeImageId === entry.assetId ? 0.25 : 0.12
								}}
							/>
						);
					})}

				{/* Playhead */}
				<div
					className="absolute top-0 h-full w-px pointer-events-none"
					style={{
						left: `${playheadPos * 100}%`,
						background: '#fff',
						boxShadow: '0 0 4px rgba(255,255,255,0.6)',
						zIndex: 20
					}}
				/>

				{/* Draggable markers */}
				{effectiveTimestamps.map(entry => {
					const pct = duration > 0 ? (entry.time / duration) * 100 : 0;
					const color = COLORS[entry.index % COLORS.length];
					const isActive = store.activeImageId === entry.assetId;
					const isDragging = draggingIdx === entry.index;
					return (
						<div
							key={`marker-${entry.assetId}`}
							data-marker="true"
							className="absolute flex items-center justify-center rounded-full cursor-grab select-none transition-shadow"
							style={{
								left: `calc(${pct}% - 10px)`,
								top: '50%',
								transform: 'translateY(-50%)',
								width: 20,
								height: 20,
								background: color,
								border: `2px solid ${isActive ? '#fff' : 'rgba(0,0,0,0.5)'}`,
								boxShadow: isDragging
									? `0 0 8px ${color}`
									: isActive
										? `0 0 6px ${color}88`
										: 'none',
								zIndex: isDragging ? 30 : isActive ? 15 : 10,
								fontSize: 9,
								fontWeight: 700,
								color: '#000',
								cursor: isDragging ? 'grabbing' : 'grab'
							}}
							title={`IMG ${entry.index + 1} · ${formatTime(entry.time)}${entry.isManual ? ' (manual)' : ' (auto)'}`}
							onPointerDown={e => handlePointerDown(entry.index, e)}
						>
							{entry.index + 1}
						</div>
					);
				})}
			</div>

			{/* Legend row */}
			<div className="flex flex-wrap gap-x-3 gap-y-0.5">
				{effectiveTimestamps
					.slice()
					.sort((a, b) => a.time - b.time)
					.map(entry => {
						const color = COLORS[entry.index % COLORS.length];
						return (
							<button
								key={`legend-${entry.assetId}`}
								className="flex items-center gap-1 text-[9px] transition-opacity hover:opacity-80"
								style={{
									color: entry.isManual ? 'var(--editor-active-fg)' : 'var(--editor-accent-muted)',
									opacity: store.activeImageId === entry.assetId ? 1 : 0.7
								}}
								onClick={() => store.setActiveImageId(entry.assetId)}
								title={`Select image ${entry.index + 1}`}
							>
								<span
									className="inline-block rounded-full"
									style={{ width: 8, height: 8, background: color }}
								/>
								<span>{entry.index + 1}</span>
								<span style={{ opacity: 0.6 }}>{formatTime(entry.time)}</span>
								{entry.isManual && (
									<span style={{ fontSize: 7, opacity: 0.5 }}>✎</span>
								)}
							</button>
						);
					})}
			</div>
		</div>
	);
}
