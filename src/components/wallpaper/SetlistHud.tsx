import { X, List } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { getActiveSetlist } from '@/store/slices/setlistsSlice';
import { UI_COLORS, ICON_SIZE } from '@/ui';
import { useT } from '@/lib/i18n';

/**
 * SetlistHud — visible HUD chip indicating the active setlist with a
 * quick deactivate button. Renders only when a setlist is active. Mounted
 * alongside the diagnostic HUDs in `DiagnosticsHudStack`.
 *
 * Why this exists: with strict-filter setlists, the pool/playlist HIDE
 * non-members. Without an always-visible indicator the user can easily
 * forget they're in a filtered view and wonder "where did my other
 * images go". The chip provides the answer + a one-click exit.
 */
export default function SetlistHud() {
	const t = useT();
	const { setlists, activeSetlistId, setActiveSetlistId } = useWallpaperStore(
		useShallow(s => ({
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			setActiveSetlistId: s.setActiveSetlistId
		}))
	);

	const active = getActiveSetlist(setlists, activeSetlistId);
	if (!active) return null;

	const accent = 'rgba(167, 139, 250, 0.55)';

	return (
		<div
			className="rounded-md px-2 py-1.5"
			style={{
				border: `1px solid ${accent}`,
				background: 'rgba(0,0,0,0.34)',
				color: UI_COLORS.fg,
				backdropFilter: 'blur(8px)',
				fontFamily: 'var(--editor-font-mono, ui-monospace, monospace)',
				fontSize: 10,
				letterSpacing: '0.08em'
			}}
		>
			<div
				className="mb-1 font-semibold uppercase tracking-widest flex items-center gap-1"
				style={{ color: accent }}
			>
				<List size={ICON_SIZE.xs} aria-hidden />
				<span>Setlist · {active.name}</span>
			</div>
			<div
				className="flex items-center justify-between gap-2"
				style={{ color: UI_COLORS.fgMute }}
			>
				<span>
					{active.imageAssetIds.length} img ·{' '}
					{active.trackIds.length} trk
				</span>
				<button
					type="button"
					onClick={() => setActiveSetlistId(null)}
					className="pointer-events-auto inline-flex h-5 w-5 items-center justify-center rounded-full transition"
					style={{
						border: `1px solid ${UI_COLORS.border}`,
						background: 'rgba(0,0,0,0.25)',
						color: UI_COLORS.fgMute
					}}
					title={t.setlists_hud_deactivate_tooltip}
				>
					<X size={10} strokeWidth={2.5} aria-hidden />
				</button>
			</div>
		</div>
	);
}
