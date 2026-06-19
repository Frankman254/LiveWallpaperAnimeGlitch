import { useEffect, useMemo, useRef, useState } from 'react';
import {
	getSupportedRecordingFormats,
	hasMediaRecorderSupport,
	hasScreenCaptureSupport,
	pickRecordingFormat,
	RECORDING_FPS_OPTIONS,
	type RecordingFps
} from '@/features/recording/recordingMimeSupport';
import {
	buildDescriptiveExportFileName,
	downloadBlobFallback,
	saveBlobWithPicker,
	type ExportNamingState
} from './exportFileUtils';

export type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error';

export { RECORDING_FPS_OPTIONS, type RecordingFps };

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
	const canScreenCapture = hasScreenCaptureSupport();
	const hasMediaRecorder = hasMediaRecorderSupport();

	const format = pickRecordingFormat(formatId, supportedFormats);

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
