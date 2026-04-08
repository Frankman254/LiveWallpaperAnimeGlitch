import { useCurrentFps } from '@/hooks/useCurrentFps';
import { useWallpaperStore } from '@/store/wallpaperStore';

function getFpsTone(fps: number) {
	if (fps >= 55) {
		return {
			color: '#86efac',
			borderColor: 'rgba(34, 197, 94, 0.4)',
			background: 'rgba(34, 197, 94, 0.1)'
		};
	}
	if (fps >= 35) {
		return {
			color: 'var(--editor-tag-fg)',
			borderColor: 'var(--editor-tag-border)',
			background: 'var(--editor-tag-bg)'
		};
	}
	if (fps >= 20) {
		return {
			color: '#fcd34d',
			borderColor: 'rgba(245, 158, 11, 0.4)',
			background: 'rgba(245, 158, 11, 0.1)'
		};
	}
	return {
		color: '#fda4af',
		borderColor: 'rgba(244, 63, 94, 0.4)',
		background: 'rgba(244, 63, 94, 0.1)'
	};
}

export default function FpsBadge() {
	const showFps = useWallpaperStore(state => state.showFps);
	if (!showFps) return null;

	return <VisibleFpsBadge />;
}

function VisibleFpsBadge() {
	const fps = useCurrentFps();
	const displayValue = fps > 0 ? `${fps} FPS` : '-- FPS';

	return (
		<span
			className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide tabular-nums"
			style={getFpsTone(fps)}
			title="Current render FPS"
		>
			{displayValue}
		</span>
	);
}
