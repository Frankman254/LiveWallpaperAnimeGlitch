import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { applyWallpaperSettingsJson } from '@/lib/projectSettings';
import { createWallpaperSettingsBlob } from '@/lib/wallpaperPersistenceCoordinator';
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
	getEnabledProjectExportSectionCount
} from '@/features/export/projectExportSelection';
import SectionDivider from '../ui/SectionDivider';
import { useLocalFolders } from '@/hooks/useLocalFolders';
import OfflineExportSection from './export/OfflineExportSection';
import ProjectPackageSection from './export/ProjectPackageSection';
import RecordingToolsSection from './export/RecordingToolsSection';
import SettingsExportSection from './export/SettingsExportSection';
import VirtualFoldersSection from './export/VirtualFoldersSection';
import {
	buildDescriptiveExportFileName,
	downloadBlobFallback,
	formatBytes,
	formatDuration,
	saveBlobWithPicker,
	type ExportNamingState
} from './export/exportFileUtils';
import {
	RECORDING_FPS_OPTIONS,
	useRecordingExport
} from './export/useRecordingExport';
import { useProjectPackageExport } from './export/useProjectPackageExport';

type SettingsStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';
type OfflineAnalysisStatus = 'idle' | 'running' | 'ready' | 'error';

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
	const importRef = useRef<HTMLInputElement | null>(null);
	const projectImportRef = useRef<HTMLInputElement | null>(null);
	const [settingsStatus, setSettingsStatus] =
		useState<SettingsStatus>('idle');
	const [settingsMessage, setSettingsMessage] = useState('');
	const [offlineAnalysisStatus, setOfflineAnalysisStatus] =
		useState<OfflineAnalysisStatus>('idle');
	const [offlineAnalysisMessage, setOfflineAnalysisMessage] = useState('');
	
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
	const recording = useRecordingExport(exportNamingState);
	const projectPackage = useProjectPackageExport({
		exportNamingState,
		confirm,
		stopCapture,
		labels: {
			dialogImportProjectTitle: t.dialog_import_project_title,
			dialogImportProjectMessage: t.dialog_import_project_message,
			importProject: t.label_import_project,
			cancel: t.label_cancel,
			statusProjectExporting: t.status_project_exporting,
			statusProjectImporting: t.status_project_importing
		}
	});

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
		recording: `${t.status_recording} ${formatDuration(recording.elapsedSeconds)}`,
		saved: t.status_record_saved,
		error: t.status_record_error
	}[recording.status];

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
	}[projectPackage.projectStatus];

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
		projectPackage.projectExportSelection
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
				onChange={event => void projectPackage.handleImportProject(event)}
			/>

			<SectionDivider label="Virtual Folders (Beta)" />
			<VirtualFoldersSection localFolders={localFolders} />

			<SectionDivider label={t.section_project_package} />
			<ProjectPackageSection
				projectStatus={projectPackage.projectStatus}
				projectLabel={projectLabel}
				projectMessage={projectPackage.projectMessage}
				projectBusyMode={projectPackage.projectBusyMode}
				projectProgress={projectPackage.projectProgress}
				projectProgressLabel={projectPackage.projectProgressLabel}
				projectExportSelection={projectPackage.projectExportSelection}
				enabledProjectExportSectionCount={enabledProjectExportSectionCount}
				hintProjectPackage={t.hint_project_package}
				hintProjectPackageAudio={t.hint_project_package_audio}
				exportProjectLabel={t.label_export_project}
				importProjectLabel={t.label_import_project}
				onApplyPreset={projectPackage.applyProjectExportPreset}
				onSetSection={projectPackage.setProjectExportSection}
				onExportProject={() => void projectPackage.exportProjectPackage()}
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
				status={recording.status}
				statusLabel={statusLabel}
				errorMessage={recording.errorMessage}
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
				supportedFormats={recording.supportedFormats}
				formatId={recording.formatId}
				onFormatIdChange={recording.setFormatId}
				labelRecordFps={t.label_record_fps}
				fpsOptions={RECORDING_FPS_OPTIONS}
				fps={recording.fps}
				onFpsChange={value =>
					recording.setFps(value as (typeof RECORDING_FPS_OPTIONS)[number])
				}
				labelRecordBitrate={t.label_record_bitrate}
				bitrateMbps={recording.bitrateMbps}
				onBitrateChange={recording.setBitrateMbps}
				labelRecordAudio={t.label_record_audio}
				includeAudio={recording.includeAudio}
				onIncludeAudioChange={recording.setIncludeAudio}
				labelStartRecording={t.label_start_recording}
				labelStopRecording={t.label_stop_recording}
				hasMediaRecorder={recording.hasMediaRecorder}
				onToggleFullscreen={() => void toggleFullscreen()}
				onToggleMiniPlayer={() => void toggleMiniPlayer()}
				onExpandMiniPlayer={() => void expandMiniPlayer()}
				onStartRecording={() => void recording.startRecording()}
				onStopRecording={recording.stopRecording}
			/>
		</>
	);
}
