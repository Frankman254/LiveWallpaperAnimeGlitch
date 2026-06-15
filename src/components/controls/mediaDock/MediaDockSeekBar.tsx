import type { PointerEvent, RefObject } from 'react';
import { formatTrackTime } from './formatTrackTime';
import type { DockInsetStyle, HoverPreview } from './types';

export default function MediaDockSeekBar({
	trackRef,
	seekRailRef,
	hoverPreview,
	progressRatio,
	isRainbow,
	seeking,
	displayTime,
	duration,
	edgeInsetStyle,
	footerInsetStyle,
	onPointerDown,
	onPointerMove,
	onPointerUp,
	onPointerCancel,
	onLostPointerCapture,
	onPointerLeave
}: {
	trackRef: RefObject<HTMLDivElement | null>;
	seekRailRef: RefObject<HTMLDivElement | null>;
	hoverPreview: HoverPreview | null;
	progressRatio: number;
	isRainbow: boolean;
	seeking: boolean;
	displayTime: number;
	duration: number;
	edgeInsetStyle: DockInsetStyle;
	footerInsetStyle: DockInsetStyle;
	onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerCancel: () => void;
	onLostPointerCapture: (e: PointerEvent<HTMLDivElement>) => void;
	onPointerLeave: () => void;
}) {
	const progressPct = Math.max(0, Math.min(100, progressRatio * 100));
	return (
		<div className="flex w-full flex-col gap-0">
			<div className="mt-1" style={edgeInsetStyle}>
				<div
					ref={trackRef}
					className="group/seek relative flex h-8 cursor-pointer select-none items-center sm:h-7"
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerCancel}
					onLostPointerCapture={onLostPointerCapture}
					onPointerLeave={onPointerLeave}
				>
					<div
						ref={seekRailRef}
						className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2"
					>
						{hoverPreview ? (
							<>
								<div
									className="pointer-events-none absolute bottom-full z-10 mb-1 border px-1.5 py-0.5 text-[10px] tabular-nums"
									style={{
										left: `${hoverPreview.ratio * 100}%`,
										transform: 'translateX(-50%)',
										borderRadius: 'var(--editor-radius-sm)',
										borderColor: 'var(--editor-tag-border)',
										background: 'var(--editor-shell-bg)',
										color: 'var(--editor-active-fg)',
										boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
									}}
								>
									{formatTrackTime(hoverPreview.time)}
								</div>
								<div
									className="pointer-events-none absolute top-1/2 h-4 w-px -translate-y-1/2"
									style={{
										left: `${hoverPreview.ratio * 100}%`,
										background:
											'color-mix(in srgb, var(--editor-accent-soft) 72%, transparent)'
									}}
								/>
							</>
						) : null}
						<div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 overflow-hidden rounded-full">
							<div
								className="h-full w-full rounded-full opacity-20 transition-opacity group-hover/seek:opacity-40"
								style={{
									background: 'var(--editor-accent-soft)'
								}}
							/>
							<div
								className={`absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-75 ${
									isRainbow ? 'editor-rgb-theme-active' : ''
								}`}
								style={{
									width: `${progressPct}%`,
									background: isRainbow
										? undefined
										: 'var(--editor-accent-color)',
									boxShadow: isRainbow
										? '0 0 10px color-mix(in srgb, var(--editor-accent-soft) 46%, transparent)'
										: '0 0 6px var(--editor-accent-color)'
								}}
							>
								<div
									className="media-progress-shimmer h-full w-full"
									style={{ opacity: isRainbow ? 0.4 : 0.55 }}
								/>
							</div>
						</div>
						<div
							className="pointer-events-none absolute z-10 h-3 w-3 rounded-full border-2 bg-white shadow"
							style={{
								top: '50%',
								left: `${progressPct}%`,
								marginLeft: '-6px',
								marginTop: '-6px',
								borderColor: 'var(--editor-accent-color)',
								background: 'var(--editor-active-fg)',
								boxShadow:
									'0 0 8px color-mix(in srgb, var(--editor-accent-color) 38%, transparent)',
								transition: seeking ? 'none' : 'left 0.075s'
							}}
						/>
					</div>
				</div>
			</div>

			<div
				className="flex justify-between pt-1 text-[12px] font-semibold tabular-nums leading-none"
				style={{
					color: 'var(--editor-accent-muted)',
					...footerInsetStyle
				}}
			>
				<span>{formatTrackTime(displayTime)}</span>
				<span>
					-{formatTrackTime(Math.max(0, duration - displayTime))}
				</span>
			</div>
		</div>
	);
}
