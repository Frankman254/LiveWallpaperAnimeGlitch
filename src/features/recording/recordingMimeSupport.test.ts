import { describe, expect, it } from 'vitest';
import {
	getSupportedRecordingFormats,
	pickRecordingFormat
} from './recordingMimeSupport';

describe('recordingMimeSupport', () => {
	it('returns empty formats when MediaRecorder is unavailable', () => {
		const original = globalThis.MediaRecorder;
		// @ts-expect-error test override
		globalThis.MediaRecorder = undefined;
		expect(getSupportedRecordingFormats()).toEqual([]);
		globalThis.MediaRecorder = original;
	});

	it('always includes browser-default candidate when MediaRecorder exists', () => {
		if (typeof MediaRecorder === 'undefined') return;
		const formats = getSupportedRecordingFormats();
		expect(formats.some(f => f.id === 'browser-default')).toBe(true);
	});

	it('pickRecordingFormat falls back to first supported', () => {
		if (typeof MediaRecorder === 'undefined') return;
		const supported = getSupportedRecordingFormats();
		expect(pickRecordingFormat('missing-id', supported)?.id).toBe(
			supported[0]?.id
		);
	});
});
