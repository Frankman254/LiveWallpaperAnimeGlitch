import { useEffect, useState, useCallback } from 'react';
import { getFolderHandle, saveFolderHandle, removeFolderHandle } from '@/lib/db/localFoldersDb';

export type VirtualFileEntry = {
	name: string;
	virtualId: string;
	kind: 'audio' | 'image';
};

export function useLocalFolders() {
	const [audioFolderLoaded, setAudioFolderLoaded] = useState(false);
	const [imageFolderLoaded, setImageFolderLoaded] = useState(false);
	const [audioFiles, setAudioFiles] = useState<VirtualFileEntry[]>([]);
	const [imageFiles, setImageFiles] = useState<VirtualFileEntry[]>([]);

	const scanFolder = async (handle: FileSystemDirectoryHandle, kind: 'audio' | 'image') => {
		const files: VirtualFileEntry[] = [];
		try {
			for await (const entry of (handle as any).values()) {
				if (entry.kind === 'file') {
					const nameLower = entry.name.toLowerCase();
					if (kind === 'audio' && (nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.ogg'))) {
						files.push({ name: entry.name, virtualId: `virtual://${kind}/${entry.name}`, kind });
					} else if (kind === 'image' && (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.gif') || nameLower.endsWith('.webp'))) {
						files.push({ name: entry.name, virtualId: `virtual://${kind}/${entry.name}`, kind });
					}
				}
			}
		} catch (e) {
			console.warn('[lwag] Failed to scan folder content', e);
		}
		return files;
	};

	const checkFolderPermission = async (handle: FileSystemDirectoryHandle) => {
		const fh = handle as any;
		if (typeof fh.queryPermission === 'function') {
			const permission = await fh.queryPermission({ mode: 'read' });
			return permission === 'granted';
		}
		return true;
	};

	const loadFolderStates = useCallback(async () => {
		try {
			const audioHandle = await getFolderHandle('audio');
			if (audioHandle) {
				if (await checkFolderPermission(audioHandle)) {
					setAudioFolderLoaded(true);
					setAudioFiles(await scanFolder(audioHandle, 'audio'));
				} else {
					setAudioFolderLoaded(false);
				}
			}

			const imageHandle = await getFolderHandle('image');
			if (imageHandle) {
				if (await checkFolderPermission(imageHandle)) {
					setImageFolderLoaded(true);
					setImageFiles(await scanFolder(imageHandle, 'image'));
				} else {
					setImageFolderLoaded(false);
				}
			}
		} catch (e) {
			console.warn('[lwag] load folders failed', e);
		}
	}, []);

	useEffect(() => {
		loadFolderStates();
	}, [loadFolderStates]);

	const requestAccess = async (folderId: 'audio' | 'image') => {
		try {
			const handle = await getFolderHandle(folderId);
			if (handle) {
				const fh = handle as any;
				if (typeof fh.requestPermission === 'function') {
					await fh.requestPermission({ mode: 'read' });
				}
				loadFolderStates();
			}
		} catch (e) {
			console.warn('[lwag] permission request failed', e);
		}
	};

	const selectNewFolder = async (folderId: 'audio' | 'image') => {
		try {
			if (!('showDirectoryPicker' in window)) {
				alert('Your browser does not support Directory Selection (or requires HTTPS).');
				return;
			}
			const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
			await saveFolderHandle(folderId, handle);
			loadFolderStates();
		} catch (e) {
			console.warn('[lwag] directory selection aborted', e);
		}
	};

	const forgetFolder = async (folderId: 'audio' | 'image') => {
		await removeFolderHandle(folderId);
		loadFolderStates();
	};

	return {
		audioFolderLoaded,
		imageFolderLoaded,
		audioFiles,
		imageFiles,
		requestAccess,
		selectNewFolder,
		forgetFolder,
		refresh: loadFolderStates
	};
}
