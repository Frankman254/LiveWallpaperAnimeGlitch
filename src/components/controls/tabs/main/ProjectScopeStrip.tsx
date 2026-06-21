import {
	FolderKanban,
	Image as ImageIcon,
	Library,
	Music2
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { getActiveSetlist } from '@/store/slices/setlistsSlice';
import { Select, UI_COLORS, ICON_SIZE, FONT } from '@/ui';

const ALL_ASSETS_OPTION_VALUE = '__all__';

export default function ProjectScopeStrip() {
	const { setlists, activeSetlistId, setActiveSetlistId } = useWallpaperStore(
		useShallow(s => ({
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			setActiveSetlistId: s.setActiveSetlistId
		}))
	);

	if (setlists.length === 0) return null;

	const active = getActiveSetlist(setlists, activeSetlistId);
	const options = [
		{
			value: ALL_ASSETS_OPTION_VALUE,
			label: 'All library',
			hint: 'Global images + audio',
			icon: <Library size={ICON_SIZE.xs} />
		},
		...setlists.map(setlist => ({
			value: setlist.id,
			label: setlist.name,
			hint: `${setlist.imageAssetIds.length} img / ${setlist.trackIds.length} trk`,
			icon: <FolderKanban size={ICON_SIZE.xs} />
		}))
	];

	return (
		<div
			className="flex min-w-0 flex-col gap-1.5 rounded-[var(--editor-radius-md)] border px-2 py-2"
			style={{
				borderColor: active ? UI_COLORS.accentBorder : UI_COLORS.border,
				background: active ? UI_COLORS.accentSoft : UI_COLORS.raised
			}}
		>
			<div className="flex min-w-0 items-center justify-between gap-2">
				<div className="min-w-0">
					<div
						className="uppercase tracking-[0.12em]"
						style={{
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono,
							fontSize: 10,
							fontWeight: 650
						}}
					>
						Project scope
					</div>
					<div
						className="truncate text-[12px]"
						style={{ color: UI_COLORS.fg }}
					>
						{active
							? `${active.name} is filtering this editor`
							: 'Editing the global library'}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<span
						className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px]"
						style={{
							background: UI_COLORS.overlay,
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono
						}}
					>
						<ImageIcon size={ICON_SIZE.xs} />
						{active?.imageAssetIds.length ?? 'all'}
					</span>
					<span
						className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px]"
						style={{
							background: UI_COLORS.overlay,
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono
						}}
					>
						<Music2 size={ICON_SIZE.xs} />
						{active?.trackIds.length ?? 'all'}
					</span>
				</div>
			</div>
			<Select<string>
				value={activeSetlistId ?? ALL_ASSETS_OPTION_VALUE}
				onChange={next =>
					setActiveSetlistId(
						next === ALL_ASSETS_OPTION_VALUE ? null : next
					)
				}
				options={options}
				size="sm"
				density="compact"
				full
				ariaLabel="Project scope"
			/>
		</div>
	);
}
