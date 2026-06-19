import { create } from 'zustand';

/** Session-only output performance settings — never persisted to projects. */
export type RecordingTargetFps = 30 | 60;

export const RECORDING_RENDER_SCALE_OPTIONS = [0.5, 0.75, 1] as const;
export type RecordingRenderScale =
	(typeof RECORDING_RENDER_SCALE_OPTIONS)[number];

export type OutputPerformanceSettings = {
	presentationHideCursor: boolean;
	presentationFullscreenOnLaunch: boolean;
	recordingTargetFps: RecordingTargetFps;
	recordingRenderScale: RecordingRenderScale;
	recordingFullscreenOnLaunch: boolean;
	recordingLockControls: boolean;
};

const DEFAULTS: OutputPerformanceSettings = {
	presentationHideCursor: true,
	presentationFullscreenOnLaunch: false,
	recordingTargetFps: 60,
	recordingRenderScale: 1,
	recordingFullscreenOnLaunch: false,
	recordingLockControls: false
};

type OutputPerformanceStore = OutputPerformanceSettings & {
	reset: () => void;
	setPresentationHideCursor: (value: boolean) => void;
	setPresentationFullscreenOnLaunch: (value: boolean) => void;
	setRecordingTargetFps: (value: RecordingTargetFps) => void;
	setRecordingRenderScale: (value: RecordingRenderScale) => void;
	setRecordingFullscreenOnLaunch: (value: boolean) => void;
	setRecordingLockControls: (value: boolean) => void;
};

export function resetOutputPerformanceForTests(): void {
	useOutputPerformanceStore.setState({ ...DEFAULTS });
}

export const useOutputPerformanceStore = create<OutputPerformanceStore>(
	set => ({
		...DEFAULTS,
		reset: () => set({ ...DEFAULTS }),
		setPresentationHideCursor: presentationHideCursor =>
			set({ presentationHideCursor }),
		setPresentationFullscreenOnLaunch: presentationFullscreenOnLaunch =>
			set({ presentationFullscreenOnLaunch }),
		setRecordingTargetFps: recordingTargetFps =>
			set({ recordingTargetFps }),
		setRecordingRenderScale: recordingRenderScale =>
			set({
				recordingRenderScale: RECORDING_RENDER_SCALE_OPTIONS.includes(
					recordingRenderScale as RecordingRenderScale
				)
					? (recordingRenderScale as RecordingRenderScale)
					: 1
			}),
		setRecordingFullscreenOnLaunch: recordingFullscreenOnLaunch =>
			set({ recordingFullscreenOnLaunch }),
		setRecordingLockControls: recordingLockControls =>
			set({ recordingLockControls })
	})
);

export function resolveEffectiveDevicePixelRatio(
	mode: 'edit' | 'presentation' | 'recording',
	renderScale: number
): number {
	if (typeof window === 'undefined') return 1;
	const base = window.devicePixelRatio || 1;
	if (mode !== 'recording') return base;
	return base * Math.max(0.5, Math.min(1, renderScale));
}
