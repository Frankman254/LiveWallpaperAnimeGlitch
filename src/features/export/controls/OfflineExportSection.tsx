import type {
	OfflineExportIssue,
	OfflineExportPlan
} from '@/features/export/offlineExportTypes';
import { useT } from '@/lib/i18n';

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
	const t = useT();
	const readinessLabel =
		offlineExportPlan.status === 'ready'
			? t.offline_readiness_ready
			: offlineExportPlan.status === 'warning'
				? t.offline_readiness_warning
				: t.offline_readiness_blocked;
	return (
		<div className="flex flex-col gap-1">
			<span className={`text-xs ${offlineExportToneClass}`}>
				{readinessLabel}
			</span>
			<span className="text-xs text-gray-500">{t.offline_caption}</span>
			<div className="grid grid-cols-2 gap-1 text-[11px] text-gray-400">
				<span>
					{t.offline_label_profile}:{' '}
					{offlineExportPlan.profile.resolution.width}x
					{offlineExportPlan.profile.resolution.height} @{' '}
					{offlineExportPlan.profile.fps}fps
				</span>
				<span>
					{t.offline_label_target}:{' '}
					{offlineExportPlan.profile.containerTarget}
				</span>
				<span>
					{t.offline_label_audio}: {offlineExportPlan.audio.label}
				</span>
				<span>
					{t.offline_label_layer_cost}:{' '}
					{offlineExportPlan.estimatedLayerCost}
				</span>
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
					? t.offline_btn_analyzing
					: t.offline_btn_test_analysis}
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
