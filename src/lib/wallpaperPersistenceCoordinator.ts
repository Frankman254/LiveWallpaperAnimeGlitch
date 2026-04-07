import {
	applyWallpaperSettingsJson,
	buildWallpaperSettingsExport,
	createWallpaperSettingsJson
} from '@/lib/projectSettings';
import {
	clearAllImages,
	loadImageAsset,
	saveImageAsset,
	type StoredImageAsset
} from '@/lib/db/imageDb';
import { DEFAULT_STATE } from '@/lib/constants';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperState } from '@/types/wallpaper';

const PROJECT_FORMAT = 'lwag-project';
const PROJECT_VERSION = 1;

type ProjectAssetKind =
	| 'background'
	| 'global-background'
	| 'logo'
	| 'overlay'
	| 'audio';

type ProjectAssetRecord = {
	id: string;
	kind: ProjectAssetKind;
	path: string;
	mimeType: string;
	base64: string;
	originalName?: string;
};

type ProjectEnvelope = {
	format: typeof PROJECT_FORMAT;
	version: typeof PROJECT_VERSION;
	exportedAt: string;
	audioIncluded: boolean;
	settings: ReturnType<typeof buildWallpaperSettingsExport>;
	assets: ProjectAssetRecord[];
};

export type ProjectPackageProgress = {
	phase:
		| 'idle'
		| 'reading'
		| 'validating'
		| 'collecting-assets'
		| 'encoding-assets'
		| 'clearing'
		| 'saving-assets'
		| 'applying-state'
		| 'done';
	current: number;
	total: number;
	percent: number;
	message: string;
};

type CollectedProjectAsset = StoredImageAsset & {
	kind: ProjectAssetKind;
	originalName: string | undefined;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function emitProjectProgress(
	onProgress: ((progress: ProjectPackageProgress) => void) | undefined,
	progress: ProjectPackageProgress
) {
	onProgress?.(progress);
}

function yieldToUi(): Promise<void> {
	return new Promise(resolve => {
		window.setTimeout(resolve, 0);
	});
}

function cloneDefaultState(): WallpaperState {
	if (typeof structuredClone === 'function') {
		return structuredClone(DEFAULT_STATE);
	}

	return JSON.parse(JSON.stringify(DEFAULT_STATE)) as WallpaperState;
}

async function hardResetProjectState() {
	await clearAllImages();
	useWallpaperStore.setState(cloneDefaultState());
	await yieldToUi();
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

function dedupeAssets<T extends { id: string }>(assets: T[]) {
	const seen = new Set<string>();
	return assets.filter(asset => {
		if (seen.has(asset.id)) return false;
		seen.add(asset.id);
		return true;
	});
}

function sanitizeProjectNameSegment(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '') || 'asset';
}

function extensionFromMimeType(mimeType: string): string {
	if (mimeType === 'audio/mpeg') return 'mp3';
	if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return 'wav';
	if (mimeType === 'audio/ogg') return 'ogg';
	if (mimeType === 'audio/mp4') return 'm4a';
	if (mimeType === 'image/jpeg') return 'jpg';
	if (mimeType === 'image/png') return 'png';
	if (mimeType === 'image/webp') return 'webp';
	if (mimeType === 'image/gif') return 'gif';
	const subtype = mimeType.split('/')[1];
	return sanitizeProjectNameSegment(subtype || 'bin');
}

function buildProjectAssetPath(
	kind: ProjectAssetKind,
	index: number,
	assetId: string,
	mimeType: string,
	originalName?: string
) {
	const extension = extensionFromMimeType(mimeType);
	const safeOriginal = originalName
		? sanitizeProjectNameSegment(
				originalName.replace(/\.[a-z0-9]+$/i, '')
			)
		: '';
	const shortId = sanitizeProjectNameSegment(assetId).slice(-8);
	const fileName = `${String(index + 1).padStart(3, '0')}-${shortId}${safeOriginal ? `-${safeOriginal}` : ''}.${extension}`;

	switch (kind) {
		case 'background':
			return `backgrounds/${fileName}`;
		case 'global-background':
			return `global-background/${fileName}`;
		case 'logo':
			return `logo/${fileName}`;
		case 'overlay':
			return `overlays/${fileName}`;
		case 'audio':
			return `audio/${fileName}`;
	}
}

function parseProjectEnvelope(raw: string): ProjectEnvelope {
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

	return parsed as ProjectEnvelope;
}

async function collectProjectAssets(
	onProgress?: (progress: ProjectPackageProgress) => void
): Promise<ProjectAssetRecord[]> {
	const state = useWallpaperStore.getState();
	const requestedAssets: Array<{
		id: string;
		kind: ProjectAssetKind;
		originalName?: string;
	}> = [];

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

	if (state.audioFileAssetId) {
		requestedAssets.push({
			id: state.audioFileAssetId,
			kind: 'audio',
			originalName: state.audioFileName || undefined
		});
	}

	for (const track of state.audioTracks ?? []) {
		if (track.assetId) {
			requestedAssets.push({
				id: track.assetId,
				kind: 'audio',
				originalName: track.name || undefined
			});
		}
	}

	const loadedAssets: CollectedProjectAsset[] = [];
	for (let index = 0; index < requestedAssets.length; index += 1) {
		const asset = requestedAssets[index];
		emitProjectProgress(onProgress, {
			phase: 'collecting-assets',
			current: index + 1,
			total: requestedAssets.length,
			percent:
				requestedAssets.length > 0
					? (index + 1) / requestedAssets.length
					: 1,
			message: `Collecting assets ${index + 1}/${requestedAssets.length}`
		});
		const stored = await loadImageAsset(asset.id);
		if (stored) {
			loadedAssets.push({
				...stored,
				kind: asset.kind,
				originalName: asset.originalName
			});
		}
		await yieldToUi();
	}

	const storedAssets = dedupeAssets(loadedAssets);
	const resolved: ProjectAssetRecord[] = [];
	for (let index = 0; index < storedAssets.length; index += 1) {
		const asset = storedAssets[index];
		emitProjectProgress(onProgress, {
			phase: 'encoding-assets',
			current: index + 1,
			total: storedAssets.length,
			percent:
				storedAssets.length > 0
					? (index + 1) / storedAssets.length
					: 1,
			message: `Encoding assets ${index + 1}/${storedAssets.length}`
		});
		resolved.push({
			id: asset.id,
			kind: asset.kind,
			path: buildProjectAssetPath(
				asset.kind,
				index,
				asset.id,
				asset.type,
				asset.originalName
			),
			mimeType: asset.type,
			base64: arrayBufferToBase64(asset.data),
			originalName: asset.originalName
		});
		await yieldToUi();
	}

	return resolved;
}

export async function createWallpaperProjectPackageJson(
	onProgress?: (progress: ProjectPackageProgress) => void
): Promise<string> {
	emitProjectProgress(onProgress, {
		phase: 'validating',
		current: 0,
		total: 1,
		percent: 0,
		message: 'Preparing project package'
	});
	const envelope: ProjectEnvelope = {
		format: PROJECT_FORMAT,
		version: PROJECT_VERSION,
		exportedAt: new Date().toISOString(),
		audioIncluded: Boolean(useWallpaperStore.getState().audioFileAssetId),
		settings: buildWallpaperSettingsExport(),
		assets: await collectProjectAssets(onProgress)
	};
	emitProjectProgress(onProgress, {
		phase: 'done',
		current: 1,
		total: 1,
		percent: 1,
		message: 'Project package ready'
	});

	return JSON.stringify(envelope, null, 2);
}

export async function createWallpaperProjectPackageBlob(
	onProgress?: (progress: ProjectPackageProgress) => void
): Promise<Blob> {
	const json = await createWallpaperProjectPackageJson(onProgress);
	return new Blob([json], {
		type: 'application/x-live-wallpaper-project+json'
	});
}

export async function applyWallpaperProjectPackage(
	raw: string,
	options?: {
		onProgress?: (progress: ProjectPackageProgress) => void;
		hardReset?: boolean;
	}
): Promise<{
	missingAssets: boolean;
	importedAssets: number;
	expectedAssets: number;
}> {
	const onProgress = options?.onProgress;
	emitProjectProgress(onProgress, {
		phase: 'validating',
		current: 0,
		total: 1,
		percent: 0,
		message: 'Validating project package'
	});
	const parsed = parseProjectEnvelope(raw);

	if (options?.hardReset !== false) {
		emitProjectProgress(onProgress, {
			phase: 'clearing',
			current: 0,
			total: 1,
			percent: 0,
			message: 'Clearing current project'
		});
		await hardResetProjectState();
	}

	let importedAssets = 0;
	for (let index = 0; index < parsed.assets.length; index += 1) {
		const asset = parsed.assets[index];
		emitProjectProgress(onProgress, {
			phase: 'saving-assets',
			current: index + 1,
			total: parsed.assets.length,
			percent:
				parsed.assets.length > 0
					? (index + 1) / parsed.assets.length
					: 1,
			message: `Importing assets ${index + 1}/${parsed.assets.length}`
		});
		if (
			!isRecord(asset) ||
			typeof asset.id !== 'string' ||
			typeof asset.path !== 'string' ||
			typeof asset.mimeType !== 'string' ||
			typeof asset.base64 !== 'string'
		) {
			await yieldToUi();
			continue;
		}

		await saveImageAsset(
			asset.id,
			base64ToArrayBuffer(asset.base64),
			asset.mimeType
		);
		importedAssets += 1;
		await yieldToUi();
	}

	emitProjectProgress(onProgress, {
		phase: 'applying-state',
		current: 1,
		total: 1,
		percent: 1,
		message: 'Applying project state'
	});

	const result = await applyWallpaperSettingsJson(
		JSON.stringify(parsed.settings)
	);
	emitProjectProgress(onProgress, {
		phase: 'done',
		current: 1,
		total: 1,
		percent: 1,
		message: 'Project imported'
	});

	return {
		...result,
		importedAssets,
		expectedAssets: parsed.assets.length
	};
}

export function createWallpaperSettingsBlob(): Blob {
	return new Blob([createWallpaperSettingsJson()], {
		type: 'application/json'
	});
}
