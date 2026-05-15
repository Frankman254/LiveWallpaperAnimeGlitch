import { useState, type ChangeEvent } from 'react';
import { applyWallpaperSettingsJson } from '@/lib/projectSettings';
import { createWallpaperSettingsBlob } from '@/lib/wallpaperPersistenceCoordinator';
import {
	buildDescriptiveExportFileName,
	downloadBlobFallback,
	saveBlobWithPicker,
	type ExportNamingState
} from './exportFileUtils';

export type SettingsStatus = 'idle' | 'saved' | 'imported' | 'warning' | 'error';

export function useSettingsExport(exportNamingState: ExportNamingState) {
	const [settingsStatus, setSettingsStatus] =
		useState<SettingsStatus>('idle');
	const [settingsMessage, setSettingsMessage] = useState('');

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

	return {
		exportSettings,
		handleImportSettings,
		settingsMessage,
		settingsStatus
	};
}
