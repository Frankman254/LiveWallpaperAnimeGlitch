import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
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
import { useAudioContext } from '@/context/useAudioContext';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { loadImageBlob } from '@/lib/db/imageDb';
import { createOfflineAudioAnalysisSource } from '@/features/export/offlineAudioAnalysis';
import {
	createOfflineExportPlan,
	resolveOfflineExportAudioAsset
} from '@/features/export/offlineExportPlanner';
import {
	DEFAULT_PROJECT_EXPORT_SELECTION,
	getEnabledProjectExportSectionCount,
	type ProjectExportSectionId,
	type ProjectExportSelection
} from '@/features/export/projectExportSelection';
import SectionDivider from '../ui/SectionDivider';
import { useLocalFolders } from '@/hooks/useLocalFolders';
import OfflineExportSection from './export/OfflineExportSection';
import ProjectPackageSection from './export/ProjectPackageSection';
import RecordingToolsSection from './export/RecordingToolsSection';
import SettingsExportSection from './export/SettingsExportSection';
import VirtualFoldersSection from './export/VirtualFoldersSection';

type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error';
type SettingsStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';
type ProjectStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';
type ProjectBusyMode = 'idle' | 'exporting' | 'importing';
type OfflineAnalysisStatus = 'idle' | 'running' | 'ready' | 'error';

type SupportedFormat = {
	id: string;
	mimeType: string;
	extension: 'webm' | 'mp4';
	label: string;
};

type SavePickerAcceptMap = Record<string, string[]>;

type SaveFilePickerOptions = {
	suggestedName?: string;
	types?: Array<{
		description?: string;
		accept: SavePickerAcceptMap;
	}>;
};

type SaveFileHandleLike = {
	createWritable: () => Promise<{
		write: (data: Blob) => Promise<void>;
		close: () => Promise<void>;
	}>;
};

type ExportNamingState = {
	activeAudioTrackId: string | null;
	audioFileName: string;
	audioTracks: Array<{ id: string; name: string; enabled: boolean }>;
	backgroundImages: Array<{ enabled: boolean }>;
	logoEnabled: boolean;
	spectrumEnabled: boolean;
	particlesEnabled: boolean;
	rainEnabled: boolean;
	overlays: Array<{ enabled: boolean }>;
	audioLyricsEnabled: boolean;
	audioTrackTitleEnabled: boolean;
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

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	return `${Math.round(bytes / 1024)} KB`;
}

function sanitizeFileNameSegment(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\.[a-z0-9]+$/i, '')
		.replace(/[^a-z0-9]+/gi, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase();
}

function buildExportStamp(): string {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolvePrimaryTrackLabel(state: ExportNamingState): string {
	const activeTrack = state.audioTracks.find(
		track => track.id === state.activeAudioTrackId
	);
	const candidate = activeTrack?.name || state.audioFileName || 'untitled';
	return sanitizeFileNameSegment(candidate) || 'untitled';
}

function buildVisualTagList(
	state: ExportNamingState,
	options?: {
		selection?: ProjectExportSelection;
	}
): string[] {
	const selection = options?.selection;
	const tags: string[] = [];
	const backgroundsEnabled =
		selection?.backgrounds ?? state.backgroundImages.length > 0;
	const enabledBackgrounds = state.backgroundImages.filter(image => image.enabled)
		.length;
	const overlaysEnabled =
		selection?.overlays ?? state.overlays.some(overlay => overlay.enabled);
	const enabledOverlays = state.overlays.filter(overlay => overlay.enabled).length;

	if (backgroundsEnabled && enabledBackgrounds > 0) {
		tags.push(enabledBackgrounds > 1 ? `bg${enabledBackgrounds}` : 'bg');
	}
	if ((selection?.spectrum ?? state.spectrumEnabled) && state.spectrumEnabled) {
		tags.push('spectrum');
	}
	if ((selection?.logo ?? state.logoEnabled) && state.logoEnabled) {
		tags.push('logo');
	}
	if ((selection?.motion ?? state.particlesEnabled) && state.particlesEnabled) {
		tags.push('particles');
	}
	if ((selection?.motion ?? state.rainEnabled) && state.rainEnabled) {
		tags.push('rain');
	}
	if (overlaysEnabled && enabledOverlays > 0) {
		tags.push(enabledOverlays > 1 ? `ov${enabledOverlays}` : 'overlay');
	}
	if ((selection?.track ?? state.audioTrackTitleEnabled) && state.audioTrackTitleEnabled) {
		tags.push('track-info');
	}
	if ((selection?.lyrics ?? state.audioLyricsEnabled) && state.audioLyricsEnabled) {
		tags.push('lyrics');
	}
	if ((selection?.audio ?? Boolean(state.audioFileName || state.audioTracks.length > 0))) {
		tags.push('audio');
	}

	return tags.length > 0 ? tags : ['visual'];
}

function buildDescriptiveExportFileName(options: {
	kind: 'recording' | 'settings' | 'project';
	state: ExportNamingState;
	extension: string;
	selection?: ProjectExportSelection;
	fps?: string;
}): string {
	const baseTrack = resolvePrimaryTrackLabel(options.state);
	const tags = buildVisualTagList(options.state, {
		selection: options.selection
	}).slice(0, 4);
	const modeTag =
		options.kind === 'project'
			? 'project'
			: options.kind === 'settings'
				? 'settings'
				: options.fps
					? `${options.fps}fps`
					: 'capture';
	const sections = [baseTrack, ...tags, modeTag].filter(Boolean);
	return `${sections.join('_')}_${buildExportStamp()}.${options.extension}`;
}

async function saveBlobWithPicker(
	blob: Blob,
	fileName: string,
	options?: {
		description?: string;
		mimeType?: string;
	}
): Promise<boolean> {
	const picker = (
		window as Window & {
			showSaveFilePicker?: (
				options?: SaveFilePickerOptions
			) => Promise<SaveFileHandleLike>;
		}
	).showSaveFilePicker;

	if (!picker) {
		return false;
	}

	try {
		const extension = fileName.includes('.')
			? `.${fileName.split('.').pop()!.toLowerCase()}`
			: '';
		const handle = await picker({
			suggestedName: fileName,
			types:
				extension && options?.mimeType
					? [
							{
								description: options.description ?? 'Exported file',
								accept: {
									[options.mimeType]: [extension]
								}
							}
						]
					: undefined
		});
		const writable = await handle.createWritable();
		await writable.write(blob);
		await writable.close();
		return true;
	} catch (error) {
		if (
			error instanceof DOMException &&
			error.name === 'AbortError'
		) {
			return true;
		}
		throw error;
	}
}

function downloadBlobFallback(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function ExportTab({
	modernChrome = false
}: {
	modernChrome?: boolean;
}) {
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
	const [projectExportSelection, setProjectExportSelection] =
		useState<ProjectExportSelection>(DEFAULT_PROJECT_EXPORT_SELECTION);
	const [projectProgress, setProjectProgress] = useState(0);
	const [projectProgressLabel, setProjectProgressLabel] = useState('');
	const [offlineAnalysisStatus, setOfflineAnalysisStatus] =
		useState<OfflineAnalysisStatus>('idle');
	const [offlineAnalysisMessage, setOfflineAnalysisMessage] = useState('');
	const canScreenCapture =
		typeof navigator !== 'undefined' &&
		typeof navigator.mediaDevices?.getDisplayMedia === 'function';
	const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
	
	const localFolders = useLocalFolders();
	const offlineExportState = useWallpaperStore(
		useShallow(state => ({
			activeAudioTrackId: state.activeAudioTrackId,
			audioChannelSmoothing: state.audioChannelSmoothing,
			audioFileAssetId: state.audioFileAssetId,
			audioFileName: state.audioFileName,
			audioSourceMode: state.audioSourceMode,
			audioTracks: state.audioTracks,
			audioLyricsEnabled: state.audioLyricsEnabled,
			audioTrackTitleEnabled: state.audioTrackTitleEnabled,
			backgroundImages: state.backgroundImages,
			logoEnabled: state.logoEnabled,
			overlays: state.overlays,
			particlesEnabled: state.particlesEnabled,
			performanceMode: state.performanceMode,
			fftSize: state.fftSize,
			rainEnabled: state.rainEnabled,
			spectrumEnabled: state.spectrumEnabled
		}))
	);
	const offlineExportPlan = useMemo(
		() => createOfflineExportPlan(offlineExportState),
		[offlineExportState]
	);
	const exportNamingState = useMemo<ExportNamingState>(
		() => ({
			activeAudioTrackId: offlineExportState.activeAudioTrackId,
			audioFileName: offlineExportState.audioFileName,
			audioTracks: offlineExportState.audioTracks.map(track => ({
				id: track.id,
				name: track.name,
				enabled: track.enabled
			})),
			backgroundImages: offlineExportState.backgroundImages.map(image => ({
				enabled: image.enabled
			})),
			logoEnabled: offlineExportState.logoEnabled,
			spectrumEnabled: offlineExportState.spectrumEnabled,
			particlesEnabled: offlineExportState.particlesEnabled,
			rainEnabled: offlineExportState.rainEnabled,
			overlays: offlineExportState.overlays.map(overlay => ({
				enabled: overlay.enabled
			})),
			audioLyricsEnabled: offlineExportState.audioLyricsEnabled,
			audioTrackTitleEnabled: offlineExportState.audioTrackTitleEnabled
		}),
		[offlineExportState]
	);
	const offlineAudioAsset = useMemo(
		() => resolveOfflineExportAudioAsset(offlineExportState),
		[offlineExportState]
	);

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

			recorder.onstop = async () => {
				if (timerRef.current !== null) {
					window.clearInterval(timerRef.current);
					timerRef.current = null;
				}

				const blob = new Blob(chunksRef.current, {
					type: format.mimeType
				});
				if (blob.size > 0) {
					const fileName = buildDescriptiveExportFileName({
						kind: 'recording',
						state: exportNamingState,
						extension: format.extension,
						fps
					});
					const savedWithPicker = await saveBlobWithPicker(blob, fileName, {
						description: 'Wallpaper capture export',
						mimeType: format.mimeType || blob.type || 'video/webm'
					});
					if (!savedWithPicker) {
						downloadBlobFallback(blob, fileName);
					}
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

	async function exportSettings() {
		try {
			const blob = createWallpaperSettingsBlob();
			const fileName = buildDescriptiveExportFileName({
				kind: 'settings',
				state: exportNamingState,
				extension: 'json'
			});
			const savedWithPicker = await saveBlobWithPicker(blob, fileName, {
				description: 'Wallpaper settings export',
				mimeType: 'application/json'
			});
			if (!savedWithPicker) {
				downloadBlobFallback(blob, fileName);
			}
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
			const blob = await createWallpaperProjectPackageBlob({
				selection: projectExportSelection,
				onProgress: progress => {
					setProjectProgress(progress.percent);
					setProjectProgressLabel(formatProgressLabel(progress));
				}
			});
			const fileName = buildDescriptiveExportFileName({
				kind: 'project',
				state: exportNamingState,
				selection: projectExportSelection,
				extension: 'lwag'
			});
			const savedWithPicker = await saveBlobWithPicker(blob, fileName, {
				description: 'Live Wallpaper project package',
				mimeType: 'application/x-live-wallpaper-project+json'
			});
			if (!savedWithPicker) {
				downloadBlobFallback(blob, fileName);
			}
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

	function setProjectExportSection(
		sectionId: ProjectExportSectionId,
		value: boolean
	) {
		setProjectExportSelection(current => ({
			...current,
			[sectionId]: value
		}));
	}

	function applyProjectExportPreset(
		preset: 'all' | 'no-images' | 'spectrum-only' | 'logo-only'
	) {
		switch (preset) {
			case 'all':
				setProjectExportSelection(DEFAULT_PROJECT_EXPORT_SELECTION);
				return;
			case 'no-images':
				setProjectExportSelection({
					...DEFAULT_PROJECT_EXPORT_SELECTION,
					backgrounds: false
				});
				return;
			case 'spectrum-only':
				setProjectExportSelection({
					backgrounds: false,
					spectrum: true,
					logo: false,
					overlays: false,
					motion: false,
					looks: false,
					track: false,
					lyrics: false,
					audio: false,
					editor: false
				});
				return;
			case 'logo-only':
				setProjectExportSelection({
					backgrounds: false,
					spectrum: false,
					logo: true,
					overlays: false,
					motion: false,
					looks: false,
					track: false,
					lyrics: false,
					audio: false,
					editor: false
				});
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

	async function analyzeOfflineExportAudio() {
		if (!offlineAudioAsset) {
			setOfflineAnalysisStatus('error');
			setOfflineAnalysisMessage('No imported file or playlist audio found.');
			return;
		}

		try {
			setOfflineAnalysisStatus('running');
			setOfflineAnalysisMessage('Decoding audio and building deterministic snapshot...');
			const blob = await loadImageBlob(offlineAudioAsset.assetId);
			if (!blob) {
				throw new Error('audio-asset-not-found');
			}

			const file = new File([blob], offlineAudioAsset.name, {
				type: blob.type || offlineAudioAsset.mimeType
			});
			const source = await createOfflineAudioAnalysisSource(file, {
				fftSize: offlineExportState.fftSize,
				channelSmoothing: offlineExportState.audioChannelSmoothing
			});

			try {
				const sampleTimeMs = Math.min(
					source.summary.durationMs,
					Math.max(1000, source.summary.durationMs * 0.25)
				);
				const snapshot = source.getSnapshotAt(sampleTimeMs);
				setOfflineAnalysisStatus('ready');
				setOfflineAnalysisMessage(
					`${formatDuration(Math.round(source.summary.durationMs / 1000))} · ${snapshot.bins.length} bins · amp ${snapshot.amplitude.toFixed(3)} · decoded ${formatBytes(source.summary.estimatedDecodedBytes)} · memory ${source.summary.memoryRisk}`
				);
			} finally {
				source.dispose();
			}
		} catch (error) {
			setOfflineAnalysisStatus('error');
			setOfflineAnalysisMessage(
				error instanceof Error
					? error.message
					: 'offline-audio-analysis-failed'
			);
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
	const offlineExportToneClass =
		offlineExportPlan.status === 'ready'
			? 'text-green-400'
			: offlineExportPlan.status === 'warning'
				? 'text-yellow-400'
				: 'text-red-400';
	const offlineExportVisibleIssues = offlineExportPlan.issues.slice(0, 3);
	const enabledProjectExportSectionCount = getEnabledProjectExportSectionCount(
		projectExportSelection
	);
	const canAnalyzeOfflineAudio =
		Boolean(offlineAudioAsset) && offlineAnalysisStatus !== 'running';

	return (
		<>
			{modernChrome ? null : <SectionDivider label={t.section_export} />}
			<SettingsExportSection
				importRef={importRef}
				settingsStatus={settingsStatus}
				settingsLabel={settingsLabel}
				settingsMessage={settingsMessage}
				hintSettingsJson={t.hint_settings_json}
				hintSettingsAssets={t.hint_settings_assets}
				exportLabel={t.label_export_settings}
				importLabel={t.label_import_settings}
				onExportSettings={() => void exportSettings()}
				onImportSettings={event => void handleImportSettings(event)}
			/>
			<input
				ref={projectImportRef}
				type="file"
				accept=".lwag,application/json"
				className="hidden"
				onChange={event => void handleImportProject(event)}
			/>

			<SectionDivider label="Virtual Folders (Beta)" />
			<VirtualFoldersSection localFolders={localFolders} />

			<SectionDivider label={t.section_project_package} />
			<ProjectPackageSection
				projectStatus={projectStatus}
				projectLabel={projectLabel}
				projectMessage={projectMessage}
				projectBusyMode={projectBusyMode}
				projectProgress={projectProgress}
				projectProgressLabel={projectProgressLabel}
				projectExportSelection={projectExportSelection}
				enabledProjectExportSectionCount={enabledProjectExportSectionCount}
				hintProjectPackage={t.hint_project_package}
				hintProjectPackageAudio={t.hint_project_package_audio}
				exportProjectLabel={t.label_export_project}
				importProjectLabel={t.label_import_project}
				onApplyPreset={applyProjectExportPreset}
				onSetSection={setProjectExportSection}
				onExportProject={() => void exportProjectPackage()}
				onImportProject={() => projectImportRef.current?.click()}
			/>

			<SectionDivider label="Offline Export (MVP Foundation)" />
			<OfflineExportSection
				offlineExportPlan={offlineExportPlan}
				offlineExportVisibleIssues={offlineExportVisibleIssues}
				offlineExportToneClass={offlineExportToneClass}
				offlineAnalysisStatus={offlineAnalysisStatus}
				offlineAnalysisMessage={offlineAnalysisMessage}
				canAnalyzeOfflineAudio={canAnalyzeOfflineAudio}
				onAnalyzeOfflineAudio={() => void analyzeOfflineExportAudio()}
			/>

			<RecordingToolsSection
				status={status}
				statusLabel={statusLabel}
				errorMessage={errorMessage}
				hintRecordPreview={t.hint_record_preview}
				hintRecordFormat={t.hint_record_format}
				sectionRecordingToolsLabel={t.section_recording_tools}
				sectionWindowToolsLabel={t.section_window_tools}
				labelWindowModes={t.label_window_modes}
				miniPlayerHint={miniPlayerHint}
				fullscreenSupported={fullscreenSupported}
				isFullscreen={isFullscreen}
				isMiniPlayerOpen={isMiniPlayerOpen}
				canExpandMiniPlayer={canExpandMiniPlayer}
				labelEnterFullscreen={t.label_enter_fullscreen}
				labelExitFullscreen={t.label_exit_fullscreen}
				labelOpenMiniPlayer={t.label_open_mini_player}
				labelCloseMiniPlayer={t.label_close_mini_player}
				labelExpandMiniPlayer={t.label_expand_mini_player}
				labelRecordFormat={t.label_record_format}
				supportedFormats={supportedFormats}
				formatId={format?.id ?? ''}
				onFormatIdChange={setFormatId}
				labelRecordFps={t.label_record_fps}
				fpsOptions={FPS_OPTIONS}
				fps={fps}
				onFpsChange={value => setFps(value as (typeof FPS_OPTIONS)[number])}
				labelRecordBitrate={t.label_record_bitrate}
				bitrateMbps={bitrateMbps}
				onBitrateChange={setBitrateMbps}
				labelRecordAudio={t.label_record_audio}
				includeAudio={includeAudio}
				onIncludeAudioChange={setIncludeAudio}
				labelStartRecording={t.label_start_recording}
				labelStopRecording={t.label_stop_recording}
				hasMediaRecorder={hasMediaRecorder}
				onToggleFullscreen={() => void toggleFullscreen()}
				onToggleMiniPlayer={() => void toggleMiniPlayer()}
				onExpandMiniPlayer={() => void expandMiniPlayer()}
				onStartRecording={() => void startRecording()}
				onStopRecording={stopRecording}
			/>
		</>
	);
}
