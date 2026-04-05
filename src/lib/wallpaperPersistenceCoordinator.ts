import {
	applyWallpaperSettingsJson,
	buildWallpaperSettingsExport,
	createWallpaperSettingsJson
} from '@/lib/projectSettings';
import {
	loadImageAsset,
	saveImageAsset,
	type StoredImageAsset
} from '@/lib/db/imageDb';
import { useWallpaperStore } from '@/store/wallpaperStore';

const PROJECT_FORMAT = 'lwag-project';
const PROJECT_VERSION = 1;

type ProjectAssetKind =
	| 'background'
	| 'global-background'
	| 'logo'
	| 'overlay';

type ProjectAssetRecord = {
	id: string;
	kind: ProjectAssetKind;
	mimeType: string;
	base64: string;
};

type ProjectEnvelope = {
	format: typeof PROJECT_FORMAT;
	version: typeof PROJECT_VERSION;
	exportedAt: string;
	audioIncluded: false;
	settings: ReturnType<typeof buildWallpaperSettingsExport>;
	assets: ProjectAssetRecord[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	const chunkSize = 0x8000;
	let binary = '';

	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, index + chunkSize);
		binary += String.fromCharCode(...chunk);
	}

	return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes.buffer;
}

function dedupeAssets(assets: Array<StoredImageAsset & { kind: ProjectAssetKind }>) {
	const seen = new Set<string>();
	return assets.filter(asset => {
		if (seen.has(asset.id)) return false;
		seen.add(asset.id);
		return true;
	});
}

async function collectProjectAssets(): Promise<ProjectAssetRecord[]> {
	const state = useWallpaperStore.getState();
	const requestedAssets: Array<{ id: string; kind: ProjectAssetKind }> = [];

	for (const image of state.backgroundImages) {
		requestedAssets.push({ id: image.assetId, kind: 'background' });
	}

	for (const overlay of state.overlays) {
		requestedAssets.push({ id: overlay.assetId, kind: 'overlay' });
	}

	if (state.globalBackgroundId) {
		requestedAssets.push({
			id: state.globalBackgroundId,
			kind: 'global-background'
		});
	}

	if (state.logoId) {
		requestedAssets.push({ id: state.logoId, kind: 'logo' });
	}

	const resolved = await Promise.all(
		dedupeAssets(
			(
				await Promise.all(
					requestedAssets.map(async asset => {
						const stored = await loadImageAsset(asset.id);
						return stored ? { ...stored, kind: asset.kind } : null;
					})
				)
			).filter(
				(asset): asset is StoredImageAsset & { kind: ProjectAssetKind } =>
					Boolean(asset)
			)
		).map(async asset => ({
			id: asset.id,
			kind: asset.kind,
			mimeType: asset.type,
			base64: arrayBufferToBase64(asset.data)
		}))
	);

	return resolved;
}

export async function createWallpaperProjectPackageJson(): Promise<string> {
	const envelope: ProjectEnvelope = {
		format: PROJECT_FORMAT,
		version: PROJECT_VERSION,
		exportedAt: new Date().toISOString(),
		audioIncluded: false,
		settings: buildWallpaperSettingsExport(),
		assets: await collectProjectAssets()
	};

	return JSON.stringify(envelope, null, 2);
}

export async function createWallpaperProjectPackageBlob(): Promise<Blob> {
	const json = await createWallpaperProjectPackageJson();
	return new Blob([json], {
		type: 'application/x-live-wallpaper-project+json'
	});
}

export async function applyWallpaperProjectPackage(
	raw: string
): Promise<{ missingAssets: boolean; importedAssets: number }> {
	const parsed = JSON.parse(raw) as unknown;
	if (!isRecord(parsed)) {
		throw new Error('invalid-project-file');
	}
	if (parsed.format !== PROJECT_FORMAT || parsed.version !== PROJECT_VERSION) {
		throw new Error('invalid-project-file');
	}
	if (!Array.isArray(parsed.assets) || !isRecord(parsed.settings)) {
		throw new Error('invalid-project-file');
	}

	const importedAssets = (
		await Promise.all(
			parsed.assets.map(async asset => {
				if (
					!isRecord(asset) ||
					typeof asset.id !== 'string' ||
					typeof asset.mimeType !== 'string' ||
					typeof asset.base64 !== 'string'
				) {
					return false;
				}

				await saveImageAsset(
					asset.id,
					base64ToArrayBuffer(asset.base64),
					asset.mimeType
				);
				return true;
			})
		)
	).filter(Boolean).length;

	const result = await applyWallpaperSettingsJson(
		JSON.stringify(parsed.settings)
	);

	return {
		...result,
		importedAssets
	};
}

export function createWallpaperSettingsBlob(): Blob {
	return new Blob([createWallpaperSettingsJson()], {
		type: 'application/json'
	});
}
