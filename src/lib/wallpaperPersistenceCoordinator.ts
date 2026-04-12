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

async function* readLinesRaw(file: File, onProgress?: (p: number) => void): AsyncGenerator<string> {
	const stream = file.stream();
	const reader = stream.getReader();
	let chunks: Uint8Array[] = [];
	let chunksTotalLength = 0;
	let readBytes = 0;
	const decoder = new TextDecoder();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			readBytes += value.byteLength;
			if (onProgress && file.size > 0) {
				onProgress(readBytes / file.size);
			}

			let offset = 0;
			while (offset < value.byteLength) {
				const newlineIndex = value.indexOf(10, offset); // 10 is '\n'
				if (newlineIndex !== -1) {
					const slice = value.subarray(offset, newlineIndex);
					if (chunks.length === 0) {
						yield decoder.decode(slice);
					} else {
						chunks.push(slice);
						chunksTotalLength += slice.byteLength;
						const merged = new Uint8Array(chunksTotalLength);
						let pos = 0;
						for (const c of chunks) {
							merged.set(c, pos);
							pos += c.byteLength;
						}
						yield decoder.decode(merged);
						chunks = [];
						chunksTotalLength = 0;
					}
					offset = newlineIndex + 1;
				} else {
					const remaining = value.subarray(offset);
					chunks.push(remaining);
					chunksTotalLength += remaining.byteLength;
					break;
				}
			}
		}
		if (chunks.length > 0) {
			const merged = new Uint8Array(chunksTotalLength);
			let pos = 0;
			for (const c of chunks) {
				merged.set(c, pos);
				pos += c.byteLength;
			}
			yield decoder.decode(merged);
		}
	} finally {
		reader.releaseLock();
	}
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
	const blob = await createWallpaperProjectPackageBlob(onProgress);
	return await blob.text();
}

function createProjectEnvelopeBlobParts(
	settings: ReturnType<typeof buildWallpaperSettingsExport>,
	assets: ProjectAssetRecord[]
) {
	const exportedAt = new Date().toISOString();
	const header =
		'{\n' +
		`  "format": ${JSON.stringify(PROJECT_FORMAT)},\n` +
		`  "version": ${PROJECT_VERSION},\n` +
		`  "exportedAt": ${JSON.stringify(exportedAt)},\n` +
		`  "audioIncluded": ${JSON.stringify(
			Boolean(useWallpaperStore.getState().audioFileAssetId)
		)},\n` +
		'  "settings": ';
	const footer = '\n}';
	const parts: BlobPart[] = [header, JSON.stringify(settings, null, 2)];

	if (assets.length === 0) {
		parts.push(',\n  "assets": []', footer);
		return parts;
	}

	parts.push(',\n  "assets": [\n');
	for (let index = 0; index < assets.length; index += 1) {
		parts.push('    ');
		parts.push(JSON.stringify(assets[index]));
		parts.push(index < assets.length - 1 ? ',\n' : '\n');
	}
	parts.push('  ]', footer);
	return parts;
}

export async function createWallpaperProjectPackageBlob(
	onProgress?: (progress: ProjectPackageProgress) => void
): Promise<Blob> {
	emitProjectProgress(onProgress, {
		phase: 'validating',
		current: 0,
		total: 1,
		percent: 0,
		message: 'Preparing project package'
	});
	const settings = buildWallpaperSettingsExport();
	const assets = await collectProjectAssets(onProgress);
	emitProjectProgress(onProgress, {
		phase: 'done',
		current: 1,
		total: 1,
		percent: 1,
		message: 'Project package ready'
	});

	return new Blob(createProjectEnvelopeBlobParts(settings, assets), {
		type: 'application/x-live-wallpaper-project+json'
	});
}

export async function applyWallpaperProjectPackage(
	file: File,
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
		phase: 'reading',
		current: 0,
		total: file.size,
		percent: 0,
		message: 'Validating project package'
	});

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

	let envelopeContent = '';
	let parsedSettings: any = null;
	let expectedAssets = 0;
	let importedAssets = 0;
	let inAssetsStr = false;

	for await (const line of readLinesRaw(file, p => {
		if (!inAssetsStr) {
			emitProjectProgress(onProgress, { phase: 'reading', current: p * file.size, total: file.size, percent: p * 0.2, message: `Reading package ${Math.round(p * 100)}%` });
		}
	})) {
		if (!inAssetsStr) {
			envelopeContent += line + '\n';
			if (line.includes('"assets": [')) {
				inAssetsStr = true;
				try {
					const safeEnvelope = envelopeContent.replace(/,\s*"assets"\s*:\s*\[.*\n?/g, '}');
					const parsed = JSON.parse(safeEnvelope);
					if (
						!isRecord(parsed) ||
						parsed.format !== PROJECT_FORMAT ||
						parsed.version !== PROJECT_VERSION
					) {
						throw new Error('invalid-project-envelope');
					}
					parsedSettings = parsed.settings;
				} catch (e) {
					console.error('[lwag] parse error', e);
					throw new Error('invalid-project-file');
				}
			}
		} else {
			const trimmed = line.trim();
			if (trimmed === ']' || trimmed === ']}' || trimmed.startsWith('],')) {
				break;
			}
			if (trimmed.startsWith('{')) {
				let assetJson = trimmed;
				if (assetJson.endsWith(',')) assetJson = assetJson.slice(0, -1);
				try {
					const asset = JSON.parse(assetJson);
					if (isRecord(asset) && typeof asset.id === 'string' && typeof asset.base64 === 'string') {
						expectedAssets += 1;
						emitProjectProgress(onProgress, {
							phase: 'saving-assets',
							current: expectedAssets,
							total: expectedAssets,
							percent: 0.2 + (0.8 * importedAssets / Math.max(importedAssets + 1, expectedAssets)),
							message: `Importing asset #${expectedAssets}`
						});
						await saveImageAsset(
							asset.id,
							base64ToArrayBuffer(asset.base64),
							typeof asset.mimeType === 'string' ? asset.mimeType : 'application/octet-stream'
						);
						importedAssets += 1;
						await yieldToUi();
					}
				} catch (e) {
					console.error('[lwag] Failed to parse asset line', e);
				}
			}
		}
	}

	if (!parsedSettings) {
		throw new Error('invalid-project-missing-settings');
	}

	emitProjectProgress(onProgress, {
		phase: 'applying-state',
		current: 1,
		total: 1,
		percent: 1,
		message: 'Applying project state'
	});

	const result = await applyWallpaperSettingsJson(JSON.stringify(parsedSettings));
	
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
		expectedAssets
	};
}

export function createWallpaperSettingsBlob(): Blob {
	return new Blob([createWallpaperSettingsJson()], {
		type: 'application/json'
	});
}
