import { useMemo, useState } from 'react';
import {
	RECORDING_FPS_OPTIONS,
	type RecordingFps
} from '@/features/recording/recordingMimeSupport';
import { useRecordingSmokeHarness } from './useRecordingSmokeHarness';

export default function RecordingSmokeHarnessPage() {
	const harness = useRecordingSmokeHarness();
	const [formatId, setFormatId] = useState(
		harness.supportedFormats[0]?.id ?? ''
	);
	const [fps, setFps] = useState<RecordingFps>('30');
	const [includeAudio, setIncludeAudio] = useState(true);
	const formatLabel = useMemo(
		() =>
			harness.supportedFormats.find(f => f.id === formatId)?.label ??
			'none',
		[formatId, harness.supportedFormats]
	);

	return (
		<div className="min-h-screen bg-[#0a0a0f] p-4 text-white">
			<h1 className="mb-2 font-mono text-lg">
				Recording Smoke Harness (dev)
			</h1>
			<p className="mb-4 max-w-3xl text-sm text-white/60">
				Uses the legacy getDisplayMedia + MediaRecorder path. Pick a
				tab/window when prompted. Results are local-only blobs — not
				uploaded.
			</p>
			<div className="mb-4 flex flex-wrap gap-2">
				{harness.supportedFormats.map(format => (
					<button
						key={format.id}
						type="button"
						className={`rounded px-2 py-1 text-xs ${formatId === format.id ? 'bg-cyan-600' : 'bg-white/10'}`}
						onClick={() => setFormatId(format.id)}
					>
						{format.label}
					</button>
				))}
			</div>
			<div className="mb-4 flex flex-wrap gap-2">
				{RECORDING_FPS_OPTIONS.map(option => (
					<button
						key={option}
						type="button"
						className={`rounded px-2 py-1 text-xs ${fps === option ? 'bg-fuchsia-600' : 'bg-white/10'}`}
						onClick={() => setFps(option)}
					>
						{option} fps
					</button>
				))}
				<button
					type="button"
					className={`rounded px-2 py-1 text-xs ${includeAudio ? 'bg-emerald-700' : 'bg-white/10'}`}
					onClick={() => setIncludeAudio(value => !value)}
				>
					audio: {includeAudio ? 'on' : 'off'}
				</button>
			</div>
			<button
				type="button"
				className="mb-4 rounded bg-amber-600 px-3 py-2 text-sm disabled:opacity-40"
				disabled={harness.status === 'running'}
				onClick={() =>
					void harness.runSmokeTest({ formatId, fps, includeAudio })
				}
			>
				Run 5s smoke capture ({formatLabel})
			</button>
			<p className="font-mono text-xs text-white/70">
				status: {harness.status}
			</p>
			{harness.errorMessage ? (
				<p className="text-xs text-red-400">{harness.errorMessage}</p>
			) : null}
			{harness.result ? (
				<div className="mt-4 space-y-2 font-mono text-xs text-white/75">
					<p>bytes: {harness.result.byteSize}</p>
					<p>chunks: {harness.result.chunkCount}</p>
					<p>elapsed: {harness.result.durationMs.toFixed(0)} ms</p>
					<p>mime: {harness.result.mimeType || 'browser default'}</p>
					<video
						className="mt-2 max-w-xl rounded border border-white/20"
						src={harness.result.objectUrl}
						controls
					/>
				</div>
			) : null}
		</div>
	);
}
