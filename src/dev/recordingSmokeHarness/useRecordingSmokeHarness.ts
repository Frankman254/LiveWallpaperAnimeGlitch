import { useRef, useState } from 'react';
import {
	getSupportedRecordingFormats,
	hasMediaRecorderSupport,
	hasScreenCaptureSupport,
	pickRecordingFormat,
	type RecordingFps,
	type SupportedRecordingFormat
} from '@/features/recording/recordingMimeSupport';

export type SmokeRecorderStatus = 'idle' | 'running' | 'saved' | 'error';

export type SmokeRecordingResult = {
	durationMs: number;
	chunkCount: number;
	byteSize: number;
	mimeType: string;
	objectUrl: string;
};

export function useRecordingSmokeHarness() {
	const recorderRef = useRef<MediaRecorder | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const startedAtRef = useRef(0);
	const [status, setStatus] = useState<SmokeRecorderStatus>('idle');
	const [errorMessage, setErrorMessage] = useState('');
	const [result, setResult] = useState<SmokeRecordingResult | null>(null);
	const supportedFormats = getSupportedRecordingFormats();

	async function runSmokeTest(options: {
		formatId: string;
		fps: RecordingFps;
		includeAudio: boolean;
		durationMs?: number;
	}) {
		if (!hasMediaRecorderSupport()) {
			setStatus('error');
			setErrorMessage('MediaRecorder unavailable');
			return;
		}
		if (!hasScreenCaptureSupport()) {
			setStatus('error');
			setErrorMessage('getDisplayMedia unavailable');
			return;
		}

		const format = pickRecordingFormat(options.formatId, supportedFormats);
		if (!format) {
			setStatus('error');
			setErrorMessage('No supported MIME type');
			return;
		}

		try {
			setErrorMessage('');
			setResult(null);
			chunksRef.current = [];
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: Number(options.fps) },
				audio: options.includeAudio
			});
			streamRef.current = stream;
			const recorder = new MediaRecorder(
				stream,
				format.mimeType ? { mimeType: format.mimeType } : undefined
			);
			recorderRef.current = recorder;
			startedAtRef.current = performance.now();
			setStatus('running');

			recorder.ondataavailable = event => {
				if (event.data.size > 0) chunksRef.current.push(event.data);
			};

			await new Promise<void>((resolve, reject) => {
				recorder.onerror = () => reject(new Error('recorder-error'));
				recorder.onstop = () => resolve();
				recorder.start(250);
				window.setTimeout(() => {
					if (recorder.state !== 'inactive') recorder.stop();
				}, options.durationMs ?? 5000);
			});

			const blob = new Blob(chunksRef.current, {
				type: format.mimeType || 'video/webm'
			});
			stream.getTracks().forEach(track => track.stop());
			streamRef.current = null;
			recorderRef.current = null;

			if (blob.size <= 0) {
				setStatus('error');
				setErrorMessage('empty-recording');
				return;
			}

			setResult({
				durationMs: performance.now() - startedAtRef.current,
				chunkCount: chunksRef.current.length,
				byteSize: blob.size,
				mimeType: format.mimeType || blob.type,
				objectUrl: URL.createObjectURL(blob)
			});
			setStatus('saved');
		} catch (error) {
			setStatus('error');
			setErrorMessage(
				error instanceof Error ? error.message : 'capture-failed'
			);
			streamRef.current?.getTracks().forEach(track => track.stop());
			streamRef.current = null;
			recorderRef.current = null;
		}
	}

	return {
		errorMessage,
		result,
		runSmokeTest,
		status,
		supportedFormats
	};
}

export type { SupportedRecordingFormat };
