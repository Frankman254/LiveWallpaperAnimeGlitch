import { loadImageBlob, saveImageAsset } from '@/lib/db/imageDb';
import {
	applyWallpaperSettingsJson,
	buildWallpaperSettingsExport
} from '@/lib/projectSettings';
import { SETTINGS_FORMAT, SETTINGS_SCHEMA_VERSION } from '@/lib/version';
import type { WallpaperState } from '@/types/wallpaper';
import type {
	AssetKind,
	ProjectAssetWrite,
	ProjectSnapshot,
	SaveProjectInput,
	SyncRepository
} from './SyncRepository';

export type ProjectSyncProgress = {
	phase: 'collecting' | 'saving' | 'loading' | 'applying' | 'done';
	current: number;
	total: number;
};

export type ReferencedProjectAsset = {
	assetId: string;
	kind: AssetKind;
};

export type SaveCurrentProjectResult = {
	snapshot: ProjectSnapshot;
	savedAssets: number;
	missingAssetIds: string[];
};

export type LoadProjectResult = {
	snapshot: ProjectSnapshot;
	restoredAssets: number;
	missingAssetIds: string[];
	missingAssets: boolean;
};

function emitProgress(
	onProgress: ((progress: ProjectSyncProgress) => void) | undefined,
	progress: ProjectSyncProgress
): void {
	onProgress?.(progress);
}

export function collectReferencedProjectAssets(
	state: WallpaperState
): ReferencedProjectAsset[] {
	const byId = new Map<string, ReferencedProjectAsset>();
	const add = (assetId: string | null | undefined, kind: AssetKind) => {
		if (!assetId || byId.has(assetId)) return;
		byId.set(assetId, { assetId, kind });
	};

	for (const image of state.backgroundImages) add(image.assetId, 'image');
	add(state.globalBackgroundId, 'image');
	for (const overlay of state.overlays) add(overlay.assetId, 'overlay');
	add(state.logoId, 'logo');
	add(state.audioFileAssetId, 'audio');
	for (const track of state.audioTracks) {
		add(track.assetId, 'audio');
		add(track.coverAssetId, 'image');
	}

	return [...byId.values()];
}

export function createProjectId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	const bytes = new Uint8Array(16);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(bytes);
	} else {
		for (let index = 0; index < bytes.length; index += 1) {
			bytes[index] = Math.floor(Math.random() * 256);
		}
	}
	bytes[6] = (bytes[6]! & 0x0f) | 0x40;
	bytes[8] = (bytes[8]! & 0x3f) | 0x80;
	const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0'));
	return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export async function saveCurrentProject(
	repository: SyncRepository,
	input: Pick<SaveProjectInput, 'id' | 'name' | 'baseRevision'>,
	onProgress?: (progress: ProjectSyncProgress) => void
): Promise<SaveCurrentProjectResult> {
	const settings = buildWallpaperSettingsExport();
	const references = collectReferencedProjectAssets(settings.state);
	const assets: ProjectAssetWrite[] = [];
	const missingAssetIds: string[] = [];

	for (let index = 0; index < references.length; index += 1) {
		const reference = references[index]!;
		emitProgress(onProgress, {
			phase: 'collecting',
			current: index + 1,
			total: references.length
		});
		const blob = await loadImageBlob(reference.assetId);
		if (blob) assets.push({ ...reference, blob });
		else missingAssetIds.push(reference.assetId);
	}

	emitProgress(onProgress, {
		phase: 'saving',
		current: 0,
		total: 1
	});
	const snapshot = await repository.saveProjectBundle(
		{
			...input,
			name: input.name.trim(),
			storePersistVersion: settings.storePersistVersion,
			state: settings.state
		},
		assets
	);
	emitProgress(onProgress, { phase: 'done', current: 1, total: 1 });
	return {
		snapshot,
		savedAssets: assets.length,
		missingAssetIds
	};
}

export async function loadProject(
	repository: SyncRepository,
	projectId: string,
	onProgress?: (progress: ProjectSyncProgress) => void
): Promise<LoadProjectResult> {
	const snapshot = await repository.loadProject(projectId);
	if (!snapshot) throw new Error('project-not-found');
	const assets = await repository.listAssets(projectId);
	const missingAssetIds: string[] = [];
	let restoredAssets = 0;

	for (let index = 0; index < assets.length; index += 1) {
		const meta = assets[index]!;
		emitProgress(onProgress, {
			phase: 'loading',
			current: index + 1,
			total: assets.length
		});
		const blob = await repository.getAsset(projectId, meta.assetId);
		if (!blob) {
			missingAssetIds.push(meta.assetId);
			continue;
		}
		await saveImageAsset(
			meta.assetId,
			await blob.arrayBuffer(),
			blob.type || meta.mimeType
		);
		restoredAssets += 1;
	}

	emitProgress(onProgress, {
		phase: 'applying',
		current: 0,
		total: 1
	});
	const applied = await applyWallpaperSettingsJson(
		JSON.stringify({
			format: SETTINGS_FORMAT,
			version: SETTINGS_SCHEMA_VERSION,
			storePersistVersion: snapshot.storePersistVersion,
			state: snapshot.state
		})
	);
	emitProgress(onProgress, { phase: 'done', current: 1, total: 1 });

	return {
		snapshot,
		restoredAssets,
		missingAssetIds,
		missingAssets: applied.missingAssets || missingAssetIds.length > 0
	};
}
