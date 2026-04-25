import type { RenderFrameContext } from './renderFrameContext';

declare global {
	interface Window {
		__DEBUG_RENDER_SYNC?: boolean;
	}
}

export type SyncFrameRecord = {
	timeMs: number;
	deltaMs: number;
	isOffline: boolean;
	resolution: { width: number; height: number };
	audioAmplitude: number | null;
	audioPeak: number | null;
};

const MAX_RECORDS = 240;
const records: SyncFrameRecord[] = [];

function syncEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	return window.__DEBUG_RENDER_SYNC === true;
}

export function recordSyncFrame(ctx: RenderFrameContext): void {
	if (!syncEnabled()) return;
	records.push({
		timeMs: ctx.timeMs,
		deltaMs: ctx.deltaMs,
		isOffline: ctx.isOffline,
		resolution: { ...ctx.resolution },
		audioAmplitude: ctx.audio?.amplitude ?? null,
		audioPeak: ctx.audio?.peak ?? null
	});
	if (records.length > MAX_RECORDS) records.shift();
}

export function getSyncRecords(): readonly SyncFrameRecord[] {
	return records;
}

export function clearSyncRecords(): void {
	records.length = 0;
}

export type SyncDriftReport = {
	frameCount: number;
	maxAmplitudeDelta: number;
	maxPeakDelta: number;
	mismatchedFrames: number;
};

export function compareSyncRuns(
	live: readonly SyncFrameRecord[],
	offline: readonly SyncFrameRecord[]
): SyncDriftReport {
	const frameCount = Math.min(live.length, offline.length);
	let maxAmplitudeDelta = 0;
	let maxPeakDelta = 0;
	let mismatchedFrames = 0;
	for (let i = 0; i < frameCount; i += 1) {
		const a = live[i];
		const b = offline[i];
		const ampA = a.audioAmplitude ?? 0;
		const ampB = b.audioAmplitude ?? 0;
		const peakA = a.audioPeak ?? 0;
		const peakB = b.audioPeak ?? 0;
		const ampDelta = Math.abs(ampA - ampB);
		const peakDelta = Math.abs(peakA - peakB);
		if (ampDelta > maxAmplitudeDelta) maxAmplitudeDelta = ampDelta;
		if (peakDelta > maxPeakDelta) maxPeakDelta = peakDelta;
		if (ampDelta > 0.001 || peakDelta > 0.001) mismatchedFrames += 1;
	}
	return { frameCount, maxAmplitudeDelta, maxPeakDelta, mismatchedFrames };
}
