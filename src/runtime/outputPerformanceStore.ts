import { create } from 'zustand';

/** Session-only output performance settings — never persisted to projects. */
export type RecordingTargetFps = 30 | 60;

export type OutputPerformanceSettings = {
	presentationHideCursor: boolean;
	recordingTargetFps: RecordingTargetFps;
	recordingRenderScale: number;
	recordingLockControls: boolean;
};

const DEFAULTS: OutputPerformanceSettings = {
	presentationHideCursor: true,
	recordingTargetFps: 60,
	recordingRenderScale: 1,
	recordingLockControls: false
};

type OutputPerformanceStore = OutputPerformanceSettings & {
	reset: () => void;
	setPresentationHideCursor: (value: boolean) => void;
	setRecordingTargetFps: (value: RecordingTargetFps) => void;
	setRecordingRenderScale: (value: number) => void;
	setRecordingLockControls: (value: boolean) => void;
};

export const useOutputPerformanceStore = create<OutputPerformanceStore>(
	set => ({
		...DEFAULTS,
		reset: () => set({ ...DEFAULTS }),
		setPresentationHideCursor: presentationHideCursor =>
			set({ presentationHideCursor }),
		setRecordingTargetFps: recordingTargetFps =>
			set({ recordingTargetFps }),
		setRecordingRenderScale: recordingRenderScale =>
			set({
				recordingRenderScale: Math.max(
					0.5,
					Math.min(1, recordingRenderScale)
				)
			}),
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
