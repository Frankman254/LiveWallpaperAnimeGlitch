export type SupportedRecordingFormat = {
	id: string;
	mimeType: string;
	extension: 'webm' | 'mp4';
	label: string;
};

export const RECORDING_FPS_OPTIONS = ['30', '60'] as const;
export type RecordingFps = (typeof RECORDING_FPS_OPTIONS)[number];

export function getSupportedRecordingFormats(): SupportedRecordingFormat[] {
	if (typeof MediaRecorder === 'undefined') {
		return [];
	}

	const candidates: SupportedRecordingFormat[] = [
		{
			id: 'browser-default',
			mimeType: '',
			extension: 'webm',
			label: 'Browser Default'
		},
		{
			id: 'mp4-h264',
			mimeType: 'video/mp4;codecs=h264,aac',
			extension: 'mp4',
			label: 'MP4 (H.264)'
		},
		{
			id: 'mp4-basic',
			mimeType: 'video/mp4',
			extension: 'mp4',
			label: 'MP4'
		},
		{
			id: 'webm-vp9',
			mimeType: 'video/webm;codecs=vp9,opus',
			extension: 'webm',
			label: 'WebM (VP9)'
		},
		{
			id: 'webm-vp8',
			mimeType: 'video/webm;codecs=vp8,opus',
			extension: 'webm',
			label: 'WebM (VP8)'
		},
		{
			id: 'webm-basic',
			mimeType: 'video/webm',
			extension: 'webm',
			label: 'WebM'
		}
	];

	const filtered = candidates.filter(
		candidate =>
			candidate.mimeType === '' ||
			MediaRecorder.isTypeSupported(candidate.mimeType)
	);
	const preferred = filtered.find(candidate => candidate.id === 'webm-vp9');
	if (preferred) {
		return [
			preferred,
			...filtered.filter(candidate => candidate.id !== 'webm-vp9')
		];
	}
	return filtered;
}

export function pickRecordingFormat(
	formatId: string,
	supported = getSupportedRecordingFormats()
): SupportedRecordingFormat | null {
	return (
		supported.find(candidate => candidate.id === formatId) ??
		supported[0] ??
		null
	);
}

export function hasScreenCaptureSupport(): boolean {
	return (
		typeof navigator !== 'undefined' &&
		typeof navigator.mediaDevices?.getDisplayMedia === 'function'
	);
}

export function hasMediaRecorderSupport(): boolean {
	return typeof MediaRecorder !== 'undefined';
}
