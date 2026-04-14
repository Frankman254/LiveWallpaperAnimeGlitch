import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/AudioDataContext';

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const COLORS = [
	'#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
	'#ff922b', '#cc5de8', '#20c997', '#f06595',
	'#845ef7', '#339af0', '#51cf66', '#fcc419'
];

const MAX_IMAGES_PER_ROW = 4;
const ROW_HEIGHT = 36;

type RowRange = { startSec: number; endSec: number; rowIndex: number };

/**
 * Visual multi-row timeline bar for placing image timestamps.
 * Long tracks split into rows so each row covers a smaller time window.
 */
export default function TimestampTimeline() {
	const store = useWallpaperStore();
	const { getDuration, getCurrentTime } = useAudioContext();
	const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
	const [playheadTime, setPlayheadTime] = useState(0);
	const rafRef = useRef(0);
	const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	const images = store.backgroundImages.filter(img => img.url);
	const duration = getDuration();

	// Build effective timestamps per image
	const effectiveTimestamps = useMemo(
		() =>
			images.map((img, i) => {
				const calculated = (duration / Math.max(images.length, 1)) * i;
				return {
					assetId: img.assetId,
					time: img.playbackSwitchAt != null ? img.playbackSwitchAt : calculated,
					isManual: img.playbackSwitchAt != null,
					index: i
				};
			}),
		[images, duration]
	);

	// Compute rows: split the duration into chunks that contain at most MAX_IMAGES_PER_ROW images each
	const rows = useMemo<RowRange[]>(() => {
		if (duration <= 0 || images.length === 0) return [];

		// Sort timestamps to figure out distribution
		const sorted = [...effectiveTimestamps].sort((a, b) => a.time - b.time);
		const totalImages = sorted.length;

		// Calculate number of rows needed (at least 1)
		const numRows = Math.max(1, Math.ceil(totalImages / MAX_IMAGES_PER_ROW));
		const secPerRow = duration / numRows;

		const result: RowRange[] = [];
		for (let i = 0; i < numRows; i++) {
			result.push({
				startSec: secPerRow * i,
				endSec: secPerRow * (i + 1),
				rowIndex: i
			});
		}
		return result;
	}, [duration, images.length, effectiveTimestamps]);

	// Update playhead
	useEffect(() => {
		if (duration <= 0) return;
		let alive = true;
		const tick = () => {
			if (!alive) return;
			setPlayheadTime(Math.max(0, getCurrentTime()));
			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			alive = false;
			cancelAnimationFrame(rafRef.current);
		};
	}, [duration, getCurrentTime]);

	const getSecondsFromPointer = useCallback(
		(clientX: number, row: RowRange) => {
			const el = rowRefs.current.get(row.rowIndex);
			if (!el) return row.startSec;
			const rect = el.getBoundingClientRect();
			const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
			const rowDuration = row.endSec - row.startSec;
			return Math.round(row.startSec + ratio * rowDuration);
		},
		[]
	);

	const findRowForTime = useCallback(
		(seconds: number): RowRange | undefined => {
			return rows.find(r => seconds >= r.startSec && seconds < r.endSec) ?? rows[rows.length - 1];
		},
		[rows]
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

	const handlePointerMoveOnRow = useCallback(
		(row: RowRange, e: React.PointerEvent) => {
			if (draggingIdx == null) return;
			const seconds = getSecondsFromPointer(e.clientX, row);
			const img = images[draggingIdx];
			if (img) {
				store.setActiveImageId(img.assetId);
				store.setImagePlaybackSwitchAt(Math.max(0, Math.min(Math.round(duration), seconds)));
			}
		},
		[draggingIdx, getSecondsFromPointer, images, store, duration]
	);

	const handlePointerUp = useCallback(() => {
		setDraggingIdx(null);
	}, []);

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

	return (
		<div className="flex flex-col gap-1">
			{/* Multi-row timeline */}
			{rows.map(row => {
				const rowDuration = row.endSec - row.startSec;
				// Find markers that belong in this row
				const markersInRow = effectiveTimestamps.filter(
					e => e.time >= row.startSec && e.time < row.endSec
				);
				// For the last row, include markers exactly at endSec
				if (row.rowIndex === rows.length - 1) {
					effectiveTimestamps.forEach(e => {
						if (e.time >= row.endSec && !markersInRow.some(m => m.assetId === e.assetId)) {
							markersInRow.push(e);
						}
					});
				}

				// Zone segments for this row
				const sortedAll = [...effectiveTimestamps].sort((a, b) => a.time - b.time);

				// Playhead in this row?
				const playheadInRow = playheadTime >= row.startSec && playheadTime < row.endSec;
				const playheadPct = playheadInRow
					? ((playheadTime - row.startSec) / rowDuration) * 100
					: -1;

				return (
					<div key={`row-${row.rowIndex}`} className="flex items-center gap-1">
						{/* Row time label */}
						<span
							className="shrink-0 text-[8px] tabular-nums w-[34px] text-right"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{formatTime(row.startSec)}
						</span>

						{/* Track bar */}
						<div
							ref={el => {
								if (el) rowRefs.current.set(row.rowIndex, el);
							}}
							className="relative flex-1 select-none rounded"
							style={{
								height: ROW_HEIGHT,
								background: 'var(--editor-surface-bg)',
								border: '1px solid var(--editor-accent-border)',
								cursor: draggingIdx != null ? 'grabbing' : 'crosshair'
							}}
							onPointerMove={e => handlePointerMoveOnRow(row, e)}
							onPointerUp={handlePointerUp}
							onPointerLeave={handlePointerUp}
						>
							{/* Zone backgrounds spanning this row */}
							{sortedAll.map((entry, si) => {
								const nextTime = sortedAll[si + 1]?.time ?? duration;
								const zoneStart = Math.max(entry.time, row.startSec);
								const zoneEnd = Math.min(nextTime, row.endSec);
								if (zoneStart >= row.endSec || zoneEnd <= row.startSec) return null;
								const leftPct = ((zoneStart - row.startSec) / rowDuration) * 100;
								const widthPct = ((zoneEnd - zoneStart) / rowDuration) * 100;
								const color = COLORS[entry.index % COLORS.length];
								return (
									<div
										key={`zone-${row.rowIndex}-${entry.assetId}`}
										className="absolute top-0 h-full pointer-events-none"
										style={{
											left: `${leftPct}%`,
											width: `${Math.max(0.3, widthPct)}%`,
											background: color,
											opacity: store.activeImageId === entry.assetId ? 0.3 : 0.12
										}}
									/>
								);
							})}

							{/* Playhead */}
							{playheadPct >= 0 && (
								<div
									className="absolute top-0 h-full w-px pointer-events-none"
									style={{
										left: `${playheadPct}%`,
										background: '#fff',
										boxShadow: '0 0 4px rgba(255,255,255,0.6)',
										zIndex: 20
									}}
								/>
							)}

							{/* Markers */}
							{markersInRow.map(entry => {
								const pct = ((entry.time - row.startSec) / rowDuration) * 100;
								const color = COLORS[entry.index % COLORS.length];
								const isActive = store.activeImageId === entry.assetId;
								const isDragging = draggingIdx === entry.index;
								return (
									<div
										key={`marker-${entry.assetId}`}
										data-marker="true"
										className="absolute flex items-center justify-center rounded-full select-none"
										style={{
											left: `calc(${Math.max(0, Math.min(100, pct))}% - 11px)`,
											top: '50%',
											transform: 'translateY(-50%)',
											width: 22,
											height: 22,
											background: color,
											border: `2px solid ${isActive ? '#fff' : 'rgba(0,0,0,0.5)'}`,
											boxShadow: isDragging
												? `0 0 10px ${color}`
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

						{/* Row end label */}
						<span
							className="shrink-0 text-[8px] tabular-nums w-[34px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{formatTime(row.endSec)}
						</span>
					</div>
				);
			})}

			{/* Legend row */}
			<div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
				{[...effectiveTimestamps]
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
