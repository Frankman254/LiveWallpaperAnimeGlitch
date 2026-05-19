import { Button, Caption, UI_COLORS } from '@/ui';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import type { useLocalFolders } from '@/hooks/useLocalFolders';

type LocalFoldersState = ReturnType<typeof useLocalFolders>;

type VirtualFoldersSectionProps = {
	localFolders: LocalFoldersState;
};

function VirtualFolderRow({
	label,
	loaded,
	count,
	onMount,
	onForget
}: {
	label: string;
	loaded: boolean;
	count: number;
	onMount: () => void;
	onForget: () => void;
}) {
	const { confirm } = useDialog();
	async function handleForget() {
		const ok = await confirm({
			title: `Forget ${label}?`,
			message: `Disconnect the ${label} folder. The ${count} matched files will need to be re-mounted to be available again. This action cannot be undone from the editor.`,
			confirmLabel: 'Forget',
			cancelLabel: 'Cancel',
			tone: 'danger'
		});
		if (!ok) return;
		onForget();
	}
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-xs" style={{ color: UI_COLORS.accent }}>
				{label}
			</span>
			<div className="flex items-center gap-2">
				{loaded ? (
					<>
						<span className="text-xs text-green-400">
							{count} files matched
						</span>
						<Button
							onClick={() => void handleForget()}
							size="sm"
							density="compact"
							variant="destructive"
							title="Disconnect folder (with confirmation)"
						>
							Forget
						</Button>
					</>
				) : (
					<Button
						onClick={onMount}
						size="sm"
						density="compact"
						variant="secondary"
					>
						Mount Folder
					</Button>
				)}
			</div>
		</div>
	);
}

export default function VirtualFoldersSection({
	localFolders
}: VirtualFoldersSectionProps) {
	return (
		<>
			<Caption className="text-xs">
				Select external folders to read Assets directly without duplicating them
				in the browser&apos;s hidden storage. It also enables picking files
				without exporting them as Base64. Requires HTTPS or Localhost.
			</Caption>

			<div
				className="flex flex-col gap-2 rounded border p-2"
				style={{ borderColor: UI_COLORS.border }}
			>
				<VirtualFolderRow
					label="Audio Virtual Folder"
					loaded={localFolders.audioFolderLoaded}
					count={localFolders.audioFiles.length}
					onMount={() => localFolders.selectNewFolder('audio')}
					onForget={() => localFolders.forgetFolder('audio')}
				/>
				{!localFolders.audioFolderLoaded ? (
					<button
						type="button"
						onClick={() => localFolders.requestAccess('audio')}
						className="text-left text-xs text-yellow-400 hover:underline"
					>
						Click to request permission if already mounted
					</button>
				) : null}

				<div
					className="my-1 h-px w-full"
					style={{ background: UI_COLORS.border }}
				/>

				<VirtualFolderRow
					label="Image Virtual Folder"
					loaded={localFolders.imageFolderLoaded}
					count={localFolders.imageFiles.length}
					onMount={() => localFolders.selectNewFolder('image')}
					onForget={() => localFolders.forgetFolder('image')}
				/>
				{!localFolders.imageFolderLoaded ? (
					<button
						type="button"
						onClick={() => localFolders.requestAccess('image')}
						className="text-left text-xs text-yellow-400 hover:underline"
					>
						Click to request permission if already mounted
					</button>
				) : null}
			</div>
		</>
	);
}
