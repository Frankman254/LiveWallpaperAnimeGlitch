import { Button, Caption, UI_COLORS } from '@/ui';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
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
	const t = useT();
	async function handleForget() {
		const ok = await confirm({
			title: t.vfolder_dialog_forget_title.replace('{name}', label),
			message: t.vfolder_dialog_forget_message
				.replace('{name}', label)
				.replace('{count}', String(count)),
			confirmLabel: t.vfolder_btn_forget,
			cancelLabel: t.label_cancel,
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
							{t.vfolder_files_matched.replace(
								'{n}',
								String(count)
							)}
						</span>
						<Button
							onClick={() => void handleForget()}
							size="sm"
							density="compact"
							variant="destructive"
							title={t.virtual_folders_disconnect_tooltip}
						>
							{t.vfolder_btn_forget}
						</Button>
					</>
				) : (
					<Button
						onClick={onMount}
						size="sm"
						density="compact"
						variant="secondary"
					>
						{t.vfolder_btn_mount}
					</Button>
				)}
			</div>
		</div>
	);
}

export default function VirtualFoldersSection({
	localFolders
}: VirtualFoldersSectionProps) {
	const t = useT();
	return (
		<>
			<Caption className="text-xs">{t.vfolder_caption}</Caption>

			<div
				className="flex flex-col gap-2 rounded border p-2"
				style={{ borderColor: UI_COLORS.border }}
			>
				<VirtualFolderRow
					label={t.vfolder_audio_label}
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
						{t.vfolder_request_permission}
					</button>
				) : null}

				<div
					className="my-1 h-px w-full"
					style={{ background: UI_COLORS.border }}
				/>

				<VirtualFolderRow
					label={t.vfolder_image_label}
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
						{t.vfolder_request_permission}
					</button>
				) : null}
			</div>
		</>
	);
}
