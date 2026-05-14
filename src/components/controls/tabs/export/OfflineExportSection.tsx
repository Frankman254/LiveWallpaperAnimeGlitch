import {
	getOfflineExportReadinessLabel
} from '@/features/export/offlineExportPlanner';
import type {
	OfflineExportIssue,
	OfflineExportPlan
} from '@/features/export/offlineExportTypes';

type OfflineAnalysisStatus = 'idle' | 'running' | 'ready' | 'error';

type OfflineExportSectionProps = {
	offlineExportPlan: OfflineExportPlan;
	offlineExportVisibleIssues: OfflineExportIssue[];
	offlineExportToneClass: string;
	offlineAnalysisStatus: OfflineAnalysisStatus;
	offlineAnalysisMessage: string;
	canAnalyzeOfflineAudio: boolean;
	onAnalyzeOfflineAudio: () => void;
};

export default function OfflineExportSection({
	offlineExportPlan,
	offlineExportVisibleIssues,
	offlineExportToneClass,
	offlineAnalysisStatus,
	offlineAnalysisMessage,
	canAnalyzeOfflineAudio,
	onAnalyzeOfflineAudio
}: OfflineExportSectionProps) {
	return (
		<div className="flex flex-col gap-1">
			<span className={`text-xs ${offlineExportToneClass}`}>
				{getOfflineExportReadinessLabel(offlineExportPlan)}
			</span>
			<span className="text-xs text-gray-500">
				Deterministic export will use project state plus file/playlist audio.
				Screen recording remains available below as the legacy capture path.
			</span>
			<div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
				<span>
					Profile: {offlineExportPlan.profile.resolution.width}x
					{offlineExportPlan.profile.resolution.height} @{' '}
					{offlineExportPlan.profile.fps}fps
				</span>
				<span>Target: {offlineExportPlan.profile.containerTarget}</span>
				<span>Audio: {offlineExportPlan.audio.label}</span>
				<span>Layer cost: {offlineExportPlan.estimatedLayerCost}</span>
			</div>
			{offlineExportVisibleIssues.map(issue => (
				<span
					key={issue.code}
					className={`text-[11px] ${
						issue.severity === 'blocker'
							? 'text-red-400'
							: issue.severity === 'warning'
								? 'text-yellow-400'
								: 'text-gray-500'
					}`}
				>
					{issue.message}
				</span>
			))}
			<button
				onClick={onAnalyzeOfflineAudio}
				disabled={!canAnalyzeOfflineAudio}
				className="mt-1 rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
				style={{
					background: 'var(--editor-button-bg)',
					borderColor: 'var(--editor-button-border)',
					color: 'var(--editor-button-fg)'
				}}
			>
				{offlineAnalysisStatus === 'running'
					? 'Analyzing offline audio...'
					: 'Test Offline Audio Analysis'}
			</button>
			{offlineAnalysisMessage ? (
				<span
					className={`text-[11px] ${
						offlineAnalysisStatus === 'ready'
							? 'text-green-400'
							: offlineAnalysisStatus === 'error'
								? 'text-red-400'
								: 'text-gray-400'
					}`}
				>
					{offlineAnalysisMessage}
				</span>
			) : null}
		</div>
	);
}
