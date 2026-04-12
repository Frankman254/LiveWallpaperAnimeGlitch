import { useEffect, useState, useCallback } from 'react';
import { getFolderHandle, saveFolderHandle, removeFolderHandle, fallbackVirtualFiles, setFallbackFiles, removeFallbackFolder } from '@/lib/db/localFoldersDb';

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
			} else {
				// Check fallback memory handles
				const fallbackAudio = Array.from(fallbackVirtualFiles.values()).filter(f => f.type.startsWith('audio/') || f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
				if (fallbackAudio.length > 0) {
					setAudioFolderLoaded(true);
					setAudioFiles(fallbackAudio.map(f => ({ name: f.name, virtualId: `virtual://audio/${f.name}`, kind: 'audio' })));
				} else {
					setAudioFolderLoaded(false);
					setAudioFiles([]);
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
			} else {
				const fallbackImage = Array.from(fallbackVirtualFiles.values()).filter(f => f.type.startsWith('image/') || f.name.endsWith('.jpg') || f.name.endsWith('.png'));
				if (fallbackImage.length > 0) {
					setImageFolderLoaded(true);
					setImageFiles(fallbackImage.map(f => ({ name: f.name, virtualId: `virtual://image/${f.name}`, kind: 'image' })));
				} else {
					setImageFolderLoaded(false);
					setImageFiles([]);
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
				// Fallback strategy: webkitdirectory input
				const input = document.createElement('input');
				input.type = 'file';
				// @ts-ignore
				input.webkitdirectory = true;
				// @ts-ignore
				input.directory = true;
				input.multiple = true;
				input.onchange = (e) => {
					const files = Array.from((e.target as HTMLInputElement).files || []);
					if (files.length > 0) {
						setFallbackFiles(folderId, files);
						loadFolderStates();
						alert(`Mapped ${files.length} files from folder for this session.`);
					}
				};
				input.click();
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
		removeFallbackFolder(folderId);
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
