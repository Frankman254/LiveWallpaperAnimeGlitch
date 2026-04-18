import {
	createContext,
	memo,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type PointerEvent,
	type ReactNode
} from 'react';
import { formatClock } from '@/components/wallpaper/quickActions/quickActionsShared';

type QuickActionsTransportProviderProps = {
	active: boolean;
	getCurrentTime: () => number;
	getDuration: () => number;
	seek: (time: number) => void;
	children: ReactNode;
};

type QuickActionsTransportContextValue = {
	currentTime: number;
	duration: number;
	progress: number;
	canSeek: boolean;
	seekTo: (time: number) => void;
	setScrubbing: (value: boolean) => void;
};

type QuickActionsTransportProps = {
	imageLabel: string;
	isRainbow: boolean;
};

type HoverPreview = {
	ratio: number;
	time: number;
};

const QuickActionsTransportContext =
	createContext<QuickActionsTransportContextValue | null>(null);

function useQuickActionsTransportContext() {
	const context = useContext(QuickActionsTransportContext);
	if (!context) {
		throw new Error(
			'QuickActions transport components must be used inside QuickActionsTransportProvider.'
		);
	}
	return context;
}

export function QuickActionsTransportProvider({
	active,
	getCurrentTime,
	getDuration,
	seek,
	children
}: QuickActionsTransportProviderProps) {
	const [transportState, setTransportState] = useState(() => {
		const initialDuration = getDuration();
		return {
			currentTime: getCurrentTime(),
			duration: initialDuration
		};
	});
	const durationRef = useRef(transportState.duration);
	const scrubbingRef = useRef(false);

	const syncTransportState = useCallback(() => {
		const nextDuration = Math.max(0, getDuration());
		const nextCurrentTime = Math.max(0, getCurrentTime());
		durationRef.current = nextDuration;
		setTransportState(prev =>
			prev.currentTime === nextCurrentTime &&
			prev.duration === nextDuration
				? prev
				: {
						currentTime: nextCurrentTime,
						duration: nextDuration
					}
		);
	}, [getCurrentTime, getDuration]);

	useEffect(() => {
		syncTransportState();
		if (!active) return undefined;

		let rafId = 0;
		let alive = true;
		const tick = () => {
			if (!alive) return;
			if (!scrubbingRef.current) {
				syncTransportState();
			}
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
		return () => {
			alive = false;
			cancelAnimationFrame(rafId);
		};
	}, [active, syncTransportState]);

	const setScrubbing = useCallback((value: boolean) => {
		scrubbingRef.current = value;
	}, []);

	const seekTo = useCallback(
		(nextTime: number) => {
			const clampedTime =
				durationRef.current > 0
					? Math.min(durationRef.current, Math.max(0, nextTime))
					: 0;
			setTransportState(prev =>
				prev.currentTime === clampedTime
					? prev
					: {
							...prev,
							currentTime: clampedTime
						}
			);
			seek(clampedTime);
		},
		[seek]
	);

	const value = useMemo<QuickActionsTransportContextValue>(() => {
		const progress =
			transportState.duration > 0
				? Math.min(
						1,
						Math.max(
							0,
							transportState.currentTime / transportState.duration
						)
					)
				: 0;

		return {
			currentTime: transportState.currentTime,
			duration: transportState.duration,
			progress,
			canSeek: transportState.duration > 0,
			seekTo,
			setScrubbing
		};
	}, [
		seekTo,
		setScrubbing,
		transportState.currentTime,
		transportState.duration
	]);

	return (
		<QuickActionsTransportContext.Provider value={value}>
			{children}
		</QuickActionsTransportContext.Provider>
	);
}

export const QuickActionsTransportTime = memo(
	function QuickActionsTransportTime() {
		const { currentTime, duration } = useQuickActionsTransportContext();

		return (
			<div
				className="text-[11px] tabular-nums"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{formatClock(currentTime)}
				<span className="opacity-40"> / </span>
				{formatClock(duration)}
			</div>
		);
	}
);

export const QuickActionsTransport = memo(function QuickActionsTransport({
	imageLabel,
	isRainbow
}: QuickActionsTransportProps) {
	const { canSeek, currentTime, duration, progress, seekTo, setScrubbing } =
		useQuickActionsTransportContext();
	const trackRef = useRef<HTMLDivElement | null>(null);
	const activePointerIdRef = useRef<number | null>(null);
	const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);

	const getHoverPreview = useCallback(
		(clientX: number) => {
			const rect = trackRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0 || duration <= 0) return null;
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width)
			);
			return {
				ratio,
				time: ratio * duration
			};
		},
		[duration]
	);

	const clearHoverPreview = useCallback(() => {
		setHoverPreview(prev => (prev == null ? prev : null));
	}, []);

	const setHoverPreviewFromClientX = useCallback(
		(clientX: number) => {
			const nextPreview = getHoverPreview(clientX);
			setHoverPreview(nextPreview);
			return nextPreview?.time ?? 0;
		},
		[getHoverPreview]
	);

	const finishScrub = useCallback(
		(target: HTMLDivElement, pointerId: number) => {
			if (target.hasPointerCapture(pointerId)) {
				target.releasePointerCapture(pointerId);
			}
			activePointerIdRef.current = null;
			setScrubbing(false);
		},
		[setScrubbing]
	);

	const handlePointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (!canSeek) return;
			activePointerIdRef.current = event.pointerId;
			setScrubbing(true);
			event.currentTarget.setPointerCapture(event.pointerId);
			seekTo(setHoverPreviewFromClientX(event.clientX));
		},
		[canSeek, seekTo, setHoverPreviewFromClientX, setScrubbing]
	);

	const handlePointerMove = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (!canSeek) return;
			const nextTime = setHoverPreviewFromClientX(event.clientX);
			if (
				activePointerIdRef.current != null &&
				activePointerIdRef.current === event.pointerId
			) {
				seekTo(nextTime);
			}
		},
		[canSeek, seekTo, setHoverPreviewFromClientX]
	);

	const handlePointerUp = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (
				activePointerIdRef.current == null ||
				activePointerIdRef.current !== event.pointerId
			) {
				return;
			}
			if (canSeek) {
				seekTo(setHoverPreviewFromClientX(event.clientX));
			}
			finishScrub(event.currentTarget, event.pointerId);
		},
		[canSeek, finishScrub, seekTo, setHoverPreviewFromClientX]
	);

	const handlePointerCancel = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			if (
				activePointerIdRef.current == null ||
				activePointerIdRef.current !== event.pointerId
			) {
				return;
			}
			finishScrub(event.currentTarget, event.pointerId);
		},
		[finishScrub]
	);

	const handleLostPointerCapture = useCallback(() => {
		activePointerIdRef.current = null;
		setScrubbing(false);
	}, [setScrubbing]);

	const handlePointerLeave = useCallback(() => {
		if (activePointerIdRef.current == null) {
			clearHoverPreview();
		}
	}, [clearHoverPreview]);

	const handleBlur = useCallback(() => {
		if (activePointerIdRef.current == null) {
			clearHoverPreview();
		}
	}, [clearHoverPreview]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (!canSeek) return;
			const step = event.shiftKey ? 15 : 5;
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				seekTo(currentTime - step);
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault();
				seekTo(currentTime + step);
			}
		},
		[canSeek, currentTime, seekTo]
	);

	return (
		<div className="flex items-center gap-3">
			<div
				ref={trackRef}
				role="slider"
				tabIndex={canSeek ? 0 : -1}
				aria-label="Seek"
				aria-valuemin={0}
				aria-valuemax={Math.max(duration, 0)}
				aria-valuenow={Math.min(currentTime, duration || 0)}
				aria-disabled={!canSeek}
				className={`relative flex h-6 min-w-0 flex-1 items-center ${
					canSeek ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
				}`}
				style={{ touchAction: 'none' }}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onLostPointerCapture={handleLostPointerCapture}
				onPointerLeave={handlePointerLeave}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
			>
				{hoverPreview ? (
					<>
						<div
							className="pointer-events-none absolute bottom-full z-10 mb-1.5 border px-2 py-0.5 text-[10px] font-medium tabular-nums"
							style={{
								left: `${hoverPreview.ratio * 100}%`,
								transform: 'translateX(-50%)',
								borderRadius: 'var(--editor-radius-sm)',
								borderColor: 'var(--editor-tag-border)',
								background: 'var(--editor-shell-bg)',
								color: 'var(--editor-active-fg)',
								boxShadow:
									'0 8px 24px rgba(0,0,0,0.24), 0 0 0 1px color-mix(in srgb, var(--editor-shell-border) 68%, transparent)'
							}}
						>
							{formatClock(hoverPreview.time)}
						</div>
						<div
							className="pointer-events-none absolute top-1/2 h-5 w-px -translate-y-1/2"
							style={{
								left: `${hoverPreview.ratio * 100}%`,
								background:
									'color-mix(in srgb, var(--editor-accent-soft) 70%, transparent)',
								boxShadow:
									'0 0 10px color-mix(in srgb, var(--editor-accent-color) 28%, transparent)'
							}}
						/>
					</>
				) : null}
				<div
					className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden"
					style={{
						borderRadius: 'var(--editor-radius-sm)',
						background:
							'color-mix(in srgb, var(--editor-accent-border) 34%, transparent)'
					}}
				>
					<div
						className={
							isRainbow
								? 'editor-rgb-theme-active h-full'
								: 'h-full'
						}
						style={{
							height: '100%',
							transform: `scaleX(${progress})`,
							transformOrigin: 'left center',
							borderRadius: 'var(--editor-radius-sm)',
							background: !isRainbow
								? 'linear-gradient(90deg, var(--editor-accent-color), color-mix(in srgb, var(--editor-accent-soft) 82%, var(--editor-accent-color)))'
								: undefined,
							boxShadow: !isRainbow
								? '0 0 12px color-mix(in srgb, var(--editor-accent-color) 30%, transparent)'
								: undefined,
							willChange: 'transform'
						}}
					/>
				</div>
				<div
					className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border"
					style={{
						left: `calc(${progress * 100}% - 7px)`,
						borderColor: 'var(--editor-shell-border)',
						background: 'var(--editor-accent-soft)',
						boxShadow:
							'0 0 0 3px color-mix(in srgb, var(--editor-shell-bg) 70%, transparent), 0 4px 14px rgba(0,0,0,0.24)'
					}}
				/>
			</div>
			<div
				className="border px-2.5 py-1 text-[10px] font-medium tracking-[0.16em]"
				style={{
					borderRadius: 'var(--editor-radius-sm)',
					borderColor: 'var(--editor-tag-border)',
					background: 'var(--editor-tag-bg)',
					color: 'var(--editor-tag-fg)'
				}}
			>
				IMG {imageLabel}
			</div>
		</div>
	);
});
