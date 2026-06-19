import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
	resetOutputPerformanceForTests,
	useOutputPerformanceStore
} from './outputPerformanceStore';
import {
	resetRuntimeUiModeForTests,
	useRuntimeUiModeStore
} from './runtimeUiModeStore';
import {
	resolveOutputCanvasBacking,
	resolveOutputMinFrameMs,
	resolveSceneLayerMaxDpr
} from './outputRenderQuality';

describe('outputRenderQuality', () => {
	beforeEach(() => {
		resetRuntimeUiModeForTests();
		resetOutputPerformanceForTests();
		vi.stubGlobal('innerWidth', 1920);
		vi.stubGlobal('innerHeight', 1080);
		vi.stubGlobal('devicePixelRatio', 2);
	});

	it('keeps full backing size in edit and presentation modes', () => {
		expect(resolveOutputCanvasBacking().backingWidth).toBe(1920);
		useRuntimeUiModeStore.getState().enterPresentationMode();
		expect(resolveOutputCanvasBacking().backingWidth).toBe(1920);
		expect(resolveOutputCanvasBacking().renderScale).toBe(1);
	});

	it('scales 2D backing store in recording mode', () => {
		useRuntimeUiModeStore.getState().enterRecordingMode();
		useOutputPerformanceStore.getState().setRecordingRenderScale(0.5);
		const backing = resolveOutputCanvasBacking();
		expect(backing.backingWidth).toBe(960);
		expect(backing.backingHeight).toBe(540);
		expect(backing.effectiveDpr).toBe(1);
	});

	it('caps recording WebGL DPR by render scale', () => {
		useRuntimeUiModeStore.getState().enterRecordingMode();
		useOutputPerformanceStore.getState().setRecordingRenderScale(0.75);
		expect(resolveSceneLayerMaxDpr('high', true)).toBeCloseTo(0.8625);
	});

	it('uses recording target fps for frame pacing', () => {
		useRuntimeUiModeStore.getState().enterRecordingMode();
		useOutputPerformanceStore.getState().setRecordingTargetFps(30);
		expect(resolveOutputMinFrameMs('high')).toBeCloseTo(1000 / 30);
	});
});
