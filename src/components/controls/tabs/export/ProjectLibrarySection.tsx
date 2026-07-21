import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, FolderOpen, Plus, Save, Trash2 } from 'lucide-react';
import { useAudioContext } from '@/context/useAudioContext';
import { useT } from '@/lib/i18n';
import {
	createProjectId,
	loadProject,
	saveCurrentProject,
	type ProjectSyncProgress
} from '@/lib/sync/projectSyncCoordinator';
import {
	SyncConflictError,
	type ProjectSummary
} from '@/lib/sync/SyncRepository';
import { localSyncRepository } from '@/lib/sync/localSyncRepository';
import { Button, Caption, SectionCard, TextInput, UI_COLORS } from '@/ui';
import { useDialog } from '../../ui/DialogProvider';

type BusyMode = 'idle' | 'saving' | 'loading' | 'deleting';
type StatusTone = 'muted' | 'ok' | 'warning' | 'error';

function formatUpdatedAt(value: string): string {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

function progressPercent(progress: ProjectSyncProgress | null): number {
	if (!progress) return 0;
	if (progress.phase === 'done') return 1;
	if (progress.total <= 0) return 0.15;
	return Math.max(0.08, progress.current / progress.total);
}

export default function ProjectLibrarySection() {
	const t = useT();
	const { confirm } = useDialog();
	const { stopCapture } = useAudioContext();
	const [projects, setProjects] = useState<ProjectSummary[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [name, setName] = useState(t.local_project_default_name);
	const [busy, setBusy] = useState<BusyMode>('idle');
	const [progress, setProgress] = useState<ProjectSyncProgress | null>(null);
	const [status, setStatus] = useState<{
		tone: StatusTone;
		message: string;
	}>({ tone: 'muted', message: t.local_project_library_hint });

	const selected = useMemo(
		() => projects.find(project => project.id === selectedId) ?? null,
		[projects, selectedId]
	);

	const refresh = useCallback(async () => {
		try {
			const next = await localSyncRepository.listProjects();
			setProjects(next);
			setSelectedId(current =>
				current && next.some(project => project.id === current)
					? current
					: null
			);
		} catch (error) {
			setStatus({
				tone: 'error',
				message:
					error instanceof Error
						? error.message
						: t.local_project_error
			});
		}
	}, [t.local_project_error]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	function handleError(error: unknown) {
		if (error instanceof SyncConflictError) {
			setStatus({
				tone: 'warning',
				message: t.local_project_conflict.replace(
					'{revision}',
					String(error.serverRevision)
				)
			});
			void refresh();
			return;
		}
		setStatus({
			tone: 'error',
			message:
				error instanceof Error ? error.message : t.local_project_error
		});
	}

	async function save(projectId: string, baseRevision?: number) {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setStatus({
				tone: 'warning',
				message: t.local_project_name_required
			});
			return;
		}
		setBusy('saving');
		setProgress(null);
		try {
			const result = await saveCurrentProject(
				localSyncRepository,
				{ id: projectId, name: trimmedName, baseRevision },
				setProgress
			);
			setSelectedId(result.snapshot.id);
			setStatus({
				tone: result.missingAssetIds.length > 0 ? 'warning' : 'ok',
				message:
					result.missingAssetIds.length > 0
						? t.local_project_saved_missing.replace(
								'{count}',
								String(result.missingAssetIds.length)
							)
						: t.local_project_saved.replace(
								'{assets}',
								String(result.savedAssets)
							)
			});
			await refresh();
		} catch (error) {
			handleError(error);
		} finally {
			setBusy('idle');
			setProgress(null);
		}
	}

	async function handleLoad(project: ProjectSummary) {
		const approved = await confirm({
			title: t.local_project_load_title,
			message: t.local_project_load_confirm.replace(
				'{name}',
				project.name
			),
			confirmLabel: t.local_project_load,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!approved) return;
		setBusy('loading');
		setProgress(null);
		try {
			stopCapture();
			const result = await loadProject(
				localSyncRepository,
				project.id,
				setProgress
			);
			setSelectedId(project.id);
			setName(project.name);
			setStatus({
				tone: result.missingAssets ? 'warning' : 'ok',
				message: result.missingAssets
					? t.local_project_loaded_missing.replace(
							'{count}',
							String(result.missingAssetIds.length)
						)
					: t.local_project_loaded.replace(
							'{assets}',
							String(result.restoredAssets)
						)
			});
		} catch (error) {
			handleError(error);
		} finally {
			setBusy('idle');
			setProgress(null);
		}
	}

	async function handleDelete(project: ProjectSummary) {
		const approved = await confirm({
			title: t.local_project_delete_title,
			message: t.local_project_delete_confirm.replace(
				'{name}',
				project.name
			),
			confirmLabel: t.local_project_delete,
			cancelLabel: t.label_cancel,
			tone: 'danger'
		});
		if (!approved) return;
		setBusy('deleting');
		try {
			await localSyncRepository.deleteProject(project.id);
			if (selectedId === project.id) setSelectedId(null);
			setStatus({ tone: 'ok', message: t.local_project_deleted });
			await refresh();
		} catch (error) {
			handleError(error);
		} finally {
			setBusy('idle');
		}
	}

	const disabled = busy !== 'idle';
	const toneColor = {
		muted: UI_COLORS.fgMute,
		ok: UI_COLORS.ok,
		warning: UI_COLORS.warn,
		error: UI_COLORS.danger
	}[status.tone];
	const percent = progressPercent(progress);
	const progressPhase = progress
		? {
				collecting: t.local_project_phase_collecting,
				saving: t.local_project_phase_saving,
				loading: t.local_project_phase_loading,
				applying: t.local_project_phase_applying,
				done: t.local_project_phase_done
			}[progress.phase]
		: '';

	return (
		<SectionCard
			title={t.local_project_library_title}
			subtitle={t.local_project_library_subtitle}
			action={<Database size={16} style={{ color: UI_COLORS.accent }} />}
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 sm:flex-row">
					<TextInput
						value={name}
						onChange={event => setName(event.target.value)}
						placeholder={t.local_project_name_placeholder}
						aria-label={t.local_project_name_label}
						maxLength={120}
						full
						disabled={disabled}
					/>
					<Button
						icon={<Plus size={14} />}
						onClick={() => void save(createProjectId())}
						disabled={disabled}
						variant="primary"
					>
						{t.local_project_save_new}
					</Button>
					<Button
						icon={<Save size={14} />}
						onClick={() =>
							selected &&
							void save(selected.id, selected.revision)
						}
						disabled={disabled || !selected}
					>
						{t.local_project_update}
					</Button>
				</div>

				{progress ? (
					<div className="flex flex-col gap-1">
						<div
							className="h-1.5 overflow-hidden rounded-full"
							style={{ background: UI_COLORS.overlay }}
						>
							<div
								className="h-full rounded-full transition-[width] duration-150"
								style={{
									width: `${Math.round(percent * 100)}%`,
									background: UI_COLORS.accent
								}}
							/>
						</div>
						<Caption className="text-[10px]">
							{t.local_project_progress
								.replace('{phase}', progressPhase)
								.replace('{current}', String(progress.current))
								.replace('{total}', String(progress.total))}
						</Caption>
					</div>
				) : null}

				<div className="flex flex-col gap-1">
					{projects.length === 0 ? (
						<Caption>{t.local_project_empty}</Caption>
					) : (
						projects.map(project => {
							const active = project.id === selectedId;
							return (
								<div
									key={project.id}
									className="flex items-center gap-2 rounded-[var(--editor-radius-md)] border px-2 py-2"
									style={{
										background: active
											? UI_COLORS.accentSoft
											: UI_COLORS.panel,
										borderColor: active
											? UI_COLORS.accentBorder
											: UI_COLORS.border
									}}
								>
									<button
										type="button"
										className="min-w-0 flex-1 text-left"
										onClick={() => {
											setSelectedId(project.id);
											setName(project.name);
										}}
									>
										<div
											className="truncate text-[12px] font-semibold"
											style={{ color: UI_COLORS.fg }}
										>
											{project.name}
										</div>
										<Caption className="text-[10px]">
											{formatUpdatedAt(project.updatedAt)}{' '}
											· r{project.revision}
										</Caption>
									</button>
									<Button
										icon={<FolderOpen size={13} />}
										onClick={() => void handleLoad(project)}
										disabled={disabled}
										density="compact"
										size="sm"
									>
										{t.local_project_load}
									</Button>
									<Button
										icon={<Trash2 size={13} />}
										onClick={() =>
											void handleDelete(project)
										}
										disabled={disabled}
										density="compact"
										size="sm"
										variant="ghost"
										aria-label={t.local_project_delete}
									/>
								</div>
							);
						})
					)}
				</div>

				<div className="text-[11px]" style={{ color: toneColor }}>
					{status.message}
				</div>
			</div>
		</SectionCard>
	);
}
