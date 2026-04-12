import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useT } from '@/lib/i18n';
import { applyWallpaperSettingsJson } from '@/lib/projectSettings';
import {
	applyWallpaperProjectPackage,
	createWallpaperProjectPackageBlob,
	createWallpaperSettingsBlob,
	type ProjectPackageProgress
} from '@/lib/wallpaperPersistenceCoordinator';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import { useDialog } from '../ui/DialogProvider';
import { useAudioContext } from '@/context/AudioDataContext';
import SectionDivider from '../ui/SectionDivider';
import EnumButtons from '../ui/EnumButtons';
import ToggleControl from '../ToggleControl';
import SliderControl from '../SliderControl';
import { useLocalFolders } from '@/hooks/useLocalFolders';

type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error';
type SettingsStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';
type ProjectStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';
type ProjectBusyMode = 'idle' | 'exporting' | 'importing';

type SupportedFormat = {
	id: string;
	mimeType: string;
	extension: 'webm' | 'mp4';
	label: string;
};

const FPS_OPTIONS = ['30', '60'] as const;

function getSupportedFormats(): SupportedFormat[] {
	if (typeof MediaRecorder === 'undefined') {
		return [];
	}

	const candidates: SupportedFormat[] = [
		{
			id: 'browser-default',
			mimeType: '',
			extension: 'webm',
			label: 'Browser Default'
		},
		{
			id: 'mp4-h264',
			mimeType: 'video/mp4;codecs=h264,aac',
			extension: 'mp4',
			label: 'MP4 (H.264)'
		},
		{
			id: 'mp4-basic',
			mimeType: 'video/mp4',
			extension: 'mp4',
			label: 'MP4'
		},
		{
			id: 'webm-vp9',
			mimeType: 'video/webm;codecs=vp9,opus',
			extension: 'webm',
			label: 'WebM (VP9)'
		},
		{
			id: 'webm-vp8',
			mimeType: 'video/webm;codecs=vp8,opus',
			extension: 'webm',
			label: 'WebM (VP8)'
		},
		{
			id: 'webm-basic',
			mimeType: 'video/webm',
			extension: 'webm',
			label: 'WebM'
		}
	];

	return candidates.filter(
		candidate =>
			candidate.mimeType === '' ||
			MediaRecorder.isTypeSupported(candidate.mimeType)
	);
}

function formatDuration(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatProgressLabel(progress: ProjectPackageProgress): string {
	return `${Math.round(progress.percent * 100)}% · ${progress.message}`;
}



export default function ExportTab() {
	const t = useT();
	const { confirm } = useDialog();
	const {
		isFullscreen,
		fullscreenSupported,
		miniPlayerSupport,
		isMiniPlayerOpen,
		canExpandMiniPlayer,
		expandMiniPlayer,
		toggleFullscreen,
		toggleMiniPlayer
	} = useWindowPresentationControls();
	const { stopCapture } = useAudioContext();
	const recorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<number | null>(null);
	const importRef = useRef<HTMLInputElement | null>(null);
	const projectImportRef = useRef<HTMLInputElement | null>(null);
	const supportedFormats = useMemo(() => getSupportedFormats(), []);
	const [formatId, setFormatId] = useState<string>(
		supportedFormats[0]?.id ?? ''
	);
	const [fps, setFps] = useState<(typeof FPS_OPTIONS)[number]>('60');
	const [bitrateMbps, setBitrateMbps] = useState(18);
	const [includeAudio, setIncludeAudio] = useState(true);
	const [status, setStatus] = useState<RecorderStatus>('idle');
	const [errorMessage, setErrorMessage] = useState('');
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const [settingsStatus, setSettingsStatus] =
		useState<SettingsStatus>('idle');
	const [settingsMessage, setSettingsMessage] = useState('');
	const [projectStatus, setProjectStatus] = useState<ProjectStatus>('idle');
	const [projectMessage, setProjectMessage] = useState('');
	const [projectBusyMode, setProjectBusyMode] =
		useState<ProjectBusyMode>('idle');
	const [projectProgress, setProjectProgress] = useState(0);
	const [projectProgressLabel, setProjectProgressLabel] = useState('');
	const canScreenCapture =
		typeof navigator !== 'undefined' &&
		typeof navigator.mediaDevices?.getDisplayMedia === 'function';
	const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
	
	const localFolders = useLocalFolders();

	const format =
		supportedFormats.find(candidate => candidate.id === formatId) ??
		supportedFormats[0] ??
		null;

	useEffect(() => {
		if (!format && supportedFormats[0]) {
			setFormatId(supportedFormats[0].id);
		}
	}, [format, supportedFormats]);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				window.clearInterval(timerRef.current);
			}
			recorderRef.current?.stop();
			streamRef.current?.getTracks().forEach(track => track.stop());
		};
	}, []);

	async function startRecording() {
		if (!hasMediaRecorder) {
			setStatus('error');
			setErrorMessage('MediaRecorder unavailable in this browser.');
			return;
		}

		if (!canScreenCapture) {
			setStatus('error');
			setErrorMessage(
				window.isSecureContext
					? 'Screen capture is unavailable in this browser.'
					: 'Screen capture requires HTTPS or localhost.'
			);
			return;
		}

		if (!format) {
			setStatus('error');
			setErrorMessage(
				'No recording container is available in this browser.'
			);
			return;
		}

		try {
			setErrorMessage('');
			chunksRef.current = [];
			setElapsedSeconds(0);

			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					frameRate: Number(fps)
				},
				audio: includeAudio
			});

			streamRef.current = stream;

			const recorder = new MediaRecorder(
				stream,
				format.mimeType
					? {
							mimeType: format.mimeType,
							videoBitsPerSecond: Math.round(
								bitrateMbps * 1_000_000
							)
						}
					: {
							videoBitsPerSecond: Math.round(
								bitrateMbps * 1_000_000
							)
						}
			);
			recorderRef.current = recorder;

			recorder.ondataavailable = event => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			recorder.onerror = () => {
				setStatus('error');
				setErrorMessage('media-recorder-error');
			};

			recorder.onstop = () => {
				if (timerRef.current !== null) {
					window.clearInterval(timerRef.current);
					timerRef.current = null;
				}

				const blob = new Blob(chunksRef.current, {
					type: format.mimeType
				});
				if (blob.size > 0) {
					const url = URL.createObjectURL(blob);
					const link = document.createElement('a');
					const stamp = new Date()
						.toISOString()
						.replace(/[:.]/g, '-');
					link.href = url;
					link.download = `live-wallpaper-export-${stamp}.${format.extension}`;
					link.click();
					window.setTimeout(() => URL.revokeObjectURL(url), 2000);
					setStatus('saved');
				} else {
					setStatus('error');
					setErrorMessage('empty-recording');
				}

				stream.getTracks().forEach(track => track.stop());
				streamRef.current = null;
				recorderRef.current = null;
			};

			stream.getVideoTracks().forEach(track => {
				track.addEventListener('ended', () => {
					if (recorder.state !== 'inactive') {
						recorder.stop();
					}
				});
			});

			recorder.start(250);
			setStatus('recording');
			timerRef.current = window.setInterval(() => {
				setElapsedSeconds(value => value + 1);
			}, 1000);
		} catch (error) {
			setStatus('error');
			setErrorMessage(
				error instanceof Error ? error.message : 'screen-capture-failed'
			);
			streamRef.current?.getTracks().forEach(track => track.stop());
			streamRef.current = null;
			recorderRef.current = null;
		}
	}

	function stopRecording() {
		const recorder = recorderRef.current;
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
			return;
		}

		streamRef.current?.getTracks().forEach(track => track.stop());
		streamRef.current = null;
	}

	function exportSettings() {
		try {
			const blob = createWallpaperSettingsBlob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			const stamp = new Date().toISOString().replace(/[:.]/g, '-');
			link.href = url;
			link.download = `live-wallpaper-settings-${stamp}.json`;
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(url), 2000);
			setSettingsStatus('saved');
			setSettingsMessage('');
		} catch (error) {
			setSettingsStatus('error');
			setSettingsMessage(
				error instanceof Error
					? error.message
					: 'settings-export-failed'
			);
		}
	}

	async function exportProjectPackage() {
		try {
			setProjectBusyMode('exporting');
			setProjectProgress(0);
			setProjectProgressLabel(t.status_project_exporting);
			const blob = await createWallpaperProjectPackageBlob(progress => {
				setProjectProgress(progress.percent);
				setProjectProgressLabel(formatProgressLabel(progress));
			});
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			const stamp = new Date().toISOString().replace(/[:.]/g, '-');
			link.href = url;
			link.download = `live-wallpaper-project-${stamp}.lwag`;
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(url), 2000);
			setProjectStatus('saved');
			setProjectMessage('');
		} catch (error) {
			setProjectStatus('error');
			setProjectMessage(
				error instanceof Error ? error.message : 'project-export-failed'
			);
		} finally {
			setProjectBusyMode('idle');
			setProjectProgress(0);
			setProjectProgressLabel('');
		}
	}

	async function handleImportSettings(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		try {
			const text = await file.text();
			const { missingAssets } = await applyWallpaperSettingsJson(text);
			setSettingsStatus(missingAssets ? 'warning' : 'imported');
			setSettingsMessage('');
		} catch (error) {
			setSettingsStatus('error');
			setSettingsMessage(
				error instanceof Error
					? error.message
					: 'settings-import-failed'
			);
		}
	}

	async function handleImportProject(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;

		const shouldImport = await confirm({
			title: t.dialog_import_project_title,
			message: t.dialog_import_project_message,
			confirmLabel: t.label_import_project,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!shouldImport) return;

		try {
			setProjectBusyMode('importing');
			setProjectProgress(0);
			setProjectProgressLabel(t.status_project_importing);
			stopCapture();
			const { missingAssets, importedAssets, expectedAssets } =
				await applyWallpaperProjectPackage(file, {
					hardReset: true,
					onProgress: progress => {
						setProjectProgress(progress.percent);
						setProjectProgressLabel(formatProgressLabel(progress));
					}
				});
			setProjectStatus(
				missingAssets || importedAssets < expectedAssets
					? 'warning'
					: 'imported'
			);
			setProjectMessage(
				importedAssets > 0
					? `${importedAssets}/${expectedAssets} assets imported`
					: ''
			);
		} catch (error) {
			setProjectStatus('error');
			setProjectMessage(
				error instanceof Error ? error.message : 'project-import-failed'
			);
		} finally {
			setProjectBusyMode('idle');
			setProjectProgress(0);
			setProjectProgressLabel('');
		}
	}

	const statusLabel = {
		idle: t.status_record_idle,
		recording: `${t.status_recording} ${formatDuration(elapsedSeconds)}`,
		saved: t.status_record_saved,
		error: t.status_record_error
	}[status];

	const settingsLabel = {
		idle: t.status_settings_idle,
		saved: t.status_settings_saved,
		imported: t.status_settings_imported,
		warning: t.status_settings_imported_missing_assets,
		error: t.status_settings_error
	}[settingsStatus];
	const projectLabel = {
		idle: t.status_project_idle,
		saved: t.status_project_saved,
		imported: t.status_project_imported,
		warning: t.status_project_imported_missing_assets,
		error: t.status_project_error
	}[projectStatus];

	const miniPlayerHint =
		miniPlayerSupport === 'document-pip'
			? t.hint_mini_player_document_pip
			: miniPlayerSupport === 'popup'
				? t.hint_mini_player_popup
				: t.hint_mini_player_unavailable;

	return (
		<>
			<SectionDivider label={t.section_export} />
			<div className="flex flex-col gap-1">
				<span
					className={`text-xs ${
						settingsStatus === 'saved' ||
						settingsStatus === 'imported'
							? 'text-green-400'
							: settingsStatus === 'warning'
								? 'text-yellow-400'
								: settingsStatus === 'error'
									? 'text-red-500'
									: 'text-cyan-400'
					}`}
				>
					{settingsLabel}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_settings_json}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_settings_assets}
				</span>
				{settingsMessage && settingsStatus === 'error' && (
					<span className="text-xs text-red-500">
						{settingsMessage}
					</span>
				)}
			</div>

			<input
				ref={importRef}
				type="file"
				accept=".json,application/json"
				className="hidden"
				onChange={event => void handleImportSettings(event)}
			/>
			<input
				ref={projectImportRef}
				type="file"
				accept=".lwag,application/json"
				className="hidden"
				onChange={event => void handleImportProject(event)}
			/>

			<div className="flex gap-2">
				<button
					onClick={exportSettings}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_export_settings}
				</button>
				<button
					onClick={() => importRef.current?.click()}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_import_settings}
				</button>
			</div>

			<SectionDivider label="Virtual Folders (Beta)" />
			<div className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">
					Select external folders to read Assets directly without duplicating them in the browser's hidden storage. It also enables picking files without exporting them as Base64. Requires HTTPS or Localhost.
				</span>
			</div>
			
			<div className="flex flex-col gap-2 p-2 border rounded" style={{ borderColor: 'var(--editor-button-border)' }}>
				<div className="flex items-center justify-between">
					<span className="text-xs" style={{ color: 'var(--editor-accent-soft)' }}>Audio Virtual Folder</span>
					<div className="flex gap-2">
						{localFolders.audioFolderLoaded ? (
							<>
								<span className="text-xs text-green-400">{localFolders.audioFiles.length} files matched</span>
								<button onClick={() => localFolders.forgetFolder('audio')} className="text-xs text-red-400">Forget</button>
							</>
						) : (
							<button onClick={() => localFolders.selectNewFolder('audio')} className="text-xs text-cyan-400">Mount Folder</button>
						)}
					</div>
				</div>
				{!localFolders.audioFolderLoaded && (
					<button onClick={() => localFolders.requestAccess('audio')} className="text-xs text-yellow-400 text-left hover:underline">
						Click to request permission if already mounted
					</button>
				)}
				
				<div className="h-px w-full my-1" style={{ background: 'var(--editor-button-border)' }} />

				<div className="flex items-center justify-between">
					<span className="text-xs" style={{ color: 'var(--editor-accent-soft)' }}>Image Virtual Folder</span>
					<div className="flex gap-2">
						{localFolders.imageFolderLoaded ? (
							<>
								<span className="text-xs text-green-400">{localFolders.imageFiles.length} files matched</span>
								<button onClick={() => localFolders.forgetFolder('image')} className="text-xs text-red-400">Forget</button>
							</>
						) : (
							<button onClick={() => localFolders.selectNewFolder('image')} className="text-xs text-cyan-400">Mount Folder</button>
						)}
					</div>
				</div>
				{!localFolders.imageFolderLoaded && (
					<button onClick={() => localFolders.requestAccess('image')} className="text-xs text-yellow-400 text-left hover:underline">
						Click to request permission if already mounted
					</button>
				)}
			</div>

			<SectionDivider label={t.section_project_package} />
			<div className="flex flex-col gap-1">
				<span
					className={`text-xs ${
						projectStatus === 'saved' || projectStatus === 'imported'
							? 'text-green-400'
							: projectStatus === 'warning'
								? 'text-yellow-400'
								: projectStatus === 'error'
									? 'text-red-500'
									: 'text-cyan-400'
					}`}
				>
					{projectLabel}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_project_package}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_project_package_audio}
				</span>
				{projectMessage ? (
					<span
						className={`text-xs ${
							projectStatus === 'error'
								? 'text-red-500'
								: 'text-gray-400'
						}`}
					>
						{projectMessage}
					</span>
				) : null}
				{projectBusyMode !== 'idle' ? (
					<div className="mt-1 flex flex-col gap-1">
						<div
							className="h-2 w-full overflow-hidden rounded-full border"
							style={{
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-surface-bg)'
							}}
						>
							<div
								className="h-full rounded-full transition-[width] duration-150"
								style={{
									background: 'var(--editor-accent-color)',
									width: `${Math.max(
										4,
										Math.round(projectProgress * 100)
									)}%`
								}}
							/>
						</div>
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{projectProgressLabel}
						</span>
					</div>
				) : null}
			</div>

			<div className="flex gap-2">
				<button
					onClick={() => void exportProjectPackage()}
					disabled={projectBusyMode !== 'idle'}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_export_project}
				</button>
				<button
					onClick={() => projectImportRef.current?.click()}
					disabled={projectBusyMode !== 'idle'}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_import_project}
				</button>
			</div>

			<SectionDivider label={t.section_recording_tools} />
			<div className="flex flex-col gap-1">
				<span
					className={`text-xs ${
						status === 'recording'
							? 'text-red-400'
							: status === 'saved'
								? 'text-green-400'
								: status === 'error'
									? 'text-red-500'
									: 'text-cyan-400'
					}`}
				>
					{statusLabel}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_record_preview}
				</span>
				<span className="text-xs text-gray-500">
					{t.hint_record_format}
				</span>
				{errorMessage && status === 'error' && (
					<span className="text-xs text-red-500">{errorMessage}</span>
				)}
			</div>

			<SectionDivider label={t.section_window_tools} />
			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_window_modes}
				</span>
				<span className="text-xs text-gray-500">{miniPlayerHint}</span>
			</div>

			<div className="flex gap-2">
				{fullscreenSupported ? (
					<button
						onClick={() => void toggleFullscreen()}
						className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
						style={{
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
					>
						{isFullscreen
							? t.label_exit_fullscreen
							: t.label_enter_fullscreen}
					</button>
				) : null}
				<button
					onClick={() => void toggleMiniPlayer()}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{isMiniPlayerOpen
						? t.label_close_mini_player
						: t.label_open_mini_player}
				</button>
			</div>
			{isMiniPlayerOpen && canExpandMiniPlayer ? (
				<button
					onClick={() => void expandMiniPlayer()}
					className="w-full rounded border px-3 py-1.5 text-xs transition-colors"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_expand_mini_player}
				</button>
			) : null}

			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_record_format}
				</span>
				<EnumButtons<string>
					options={supportedFormats.map(candidate => candidate.id)}
					value={format?.id ?? ''}
					onChange={setFormatId}
					labels={Object.fromEntries(
						supportedFormats.map(candidate => [
							candidate.id,
							candidate.label
						])
					)}
				/>
			</div>

			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_record_fps}
				</span>
				<EnumButtons<(typeof FPS_OPTIONS)[number]>
					options={[...FPS_OPTIONS]}
					value={fps}
					onChange={setFps}
				/>
			</div>

			<SliderControl
				label={t.label_record_bitrate}
				value={bitrateMbps}
				min={6}
				max={40}
				step={1}
				unit="Mbps"
				onChange={setBitrateMbps}
			/>
			<ToggleControl
				label={t.label_record_audio}
				value={includeAudio}
				onChange={setIncludeAudio}
			/>

			<div className="flex gap-2">
				<button
					onClick={() => void startRecording()}
					disabled={status === 'recording' || !hasMediaRecorder}
					className="flex-1 rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
					style={{
						background: 'var(--editor-button-bg)',
						borderColor: 'var(--editor-button-border)',
						color: 'var(--editor-button-fg)'
					}}
				>
					{t.label_start_recording}
				</button>
				<button
					onClick={stopRecording}
					disabled={status !== 'recording'}
					className="px-3 py-1.5 text-xs rounded border border-red-800 text-red-400 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
				>
					{t.label_stop_recording}
				</button>
			</div>
		</>
	);
}
