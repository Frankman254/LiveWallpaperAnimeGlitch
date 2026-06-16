import { useEffect, useMemo, useRef, useState } from 'react';
import {
	buildDescriptiveExportFileName,
	downloadBlobFallback,
	saveBlobWithPicker,
	type ExportNamingState
} from './exportFileUtils';

export type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error';

export type SupportedRecordingFormat = {
	id: string;
	mimeType: string;
	extension: 'webm' | 'mp4';
	label: string;
};

export const RECORDING_FPS_OPTIONS = ['30', '60'] as const;
export type RecordingFps = (typeof RECORDING_FPS_OPTIONS)[number];

function getSupportedRecordingFormats(): SupportedRecordingFormat[] {
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

	return candidates.filter(
		candidate =>
			candidate.mimeType === '' ||
			MediaRecorder.isTypeSupported(candidate.mimeType)
	);
}

export function useRecordingExport(exportNamingState: ExportNamingState) {
	const recorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<number | null>(null);
	const supportedFormats = useMemo(() => getSupportedRecordingFormats(), []);
	const [formatId, setFormatId] = useState<string>(
		supportedFormats[0]?.id ?? ''
	);
	const [fps, setFps] = useState<RecordingFps>('60');
	const [bitrateMbps, setBitrateMbps] = useState(18);
	const [includeAudio, setIncludeAudio] = useState(true);
	const [status, setStatus] = useState<RecorderStatus>('idle');
	const [errorMessage, setErrorMessage] = useState('');
	const [elapsedSeconds, setElapsedSeconds] = useState(0);
	const canScreenCapture =
		typeof navigator !== 'undefined' &&
		typeof navigator.mediaDevices?.getDisplayMedia === 'function';
	const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

	const format =
		supportedFormats.find(candidate => candidate.id === formatId) ??
		supportedFormats[0] ??
		null;

	useEffect(() => {
		if (!format && supportedFormats[0]) {
			setFormatId(supportedFormats[0].id);
		}
	}, [format, supportedFormats]);

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				window.clearInterval(timerRef.current);
			}
			recorderRef.current?.stop();
			streamRef.current?.getTracks().forEach(track => track.stop());
		};
	}, []);

	async function startRecording() {
		if (!hasMediaRecorder) {
			setStatus('error');
			setErrorMessage('MediaRecorder unavailable in this browser.');
			return;
		}

		if (!canScreenCapture) {
			setStatus('error');
			setErrorMessage(
				window.isSecureContext
					? 'Screen capture is unavailable in this browser.'
					: 'Screen capture requires HTTPS or localhost.'
			);
			return;
		}

		if (!format) {
			setStatus('error');
			setErrorMessage(
				'No recording container is available in this browser.'
			);
			return;
		}

		try {
			setErrorMessage('');
			chunksRef.current = [];
			setElapsedSeconds(0);

			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					frameRate: Number(fps)
				},
				audio: includeAudio
			});

			streamRef.current = stream;

			const recorder = new MediaRecorder(
				stream,
				format.mimeType
					? {
							mimeType: format.mimeType,
							videoBitsPerSecond: Math.round(
								bitrateMbps * 1_000_000
							)
						}
					: {
							videoBitsPerSecond: Math.round(
								bitrateMbps * 1_000_000
							)
						}
			);
			recorderRef.current = recorder;

			recorder.ondataavailable = event => {
				if (event.data.size > 0) {
					chunksRef.current.push(event.data);
				}
			};

			recorder.onerror = () => {
				setStatus('error');
				setErrorMessage('media-recorder-error');
			};

			recorder.onstop = async () => {
				if (timerRef.current !== null) {
					window.clearInterval(timerRef.current);
					timerRef.current = null;
				}

				const blob = new Blob(chunksRef.current, {
					type: format.mimeType
				});
				if (blob.size > 0) {
					const fileName = buildDescriptiveExportFileName({
						kind: 'recording',
						state: exportNamingState,
						extension: format.extension,
						fps
					});
					const savedWithPicker = await saveBlobWithPicker(
						blob,
						fileName,
						{
							description: 'Wallpaper capture export',
							mimeType:
								format.mimeType || blob.type || 'video/webm'
						}
					);
					if (!savedWithPicker) {
						downloadBlobFallback(blob, fileName);
					}
					setStatus('saved');
				} else {
					setStatus('error');
					setErrorMessage('empty-recording');
				}

				stream.getTracks().forEach(track => track.stop());
				streamRef.current = null;
				recorderRef.current = null;
			};

			stream.getVideoTracks().forEach(track => {
				track.addEventListener('ended', () => {
					if (recorder.state !== 'inactive') {
						recorder.stop();
					}
				});
			});

			recorder.start(250);
			setStatus('recording');
			timerRef.current = window.setInterval(() => {
				setElapsedSeconds(value => value + 1);
			}, 1000);
		} catch (error) {
			setStatus('error');
			setErrorMessage(
				error instanceof Error ? error.message : 'screen-capture-failed'
			);
			streamRef.current?.getTracks().forEach(track => track.stop());
			streamRef.current = null;
			recorderRef.current = null;
		}
	}

	function stopRecording() {
		const recorder = recorderRef.current;
		if (recorder && recorder.state !== 'inactive') {
			recorder.stop();
			return;
		}

		streamRef.current?.getTracks().forEach(track => track.stop());
		streamRef.current = null;
	}

	return {
		bitrateMbps,
		elapsedSeconds,
		errorMessage,
		formatId,
		fps,
		hasMediaRecorder,
		includeAudio,
		setBitrateMbps,
		setFormatId,
		setFps,
		setIncludeAudio,
		startRecording,
		status,
		stopRecording,
		supportedFormats
	};
}
