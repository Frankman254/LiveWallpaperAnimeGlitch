import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { ProjectHealthReport } from '@/lib/projectHealth';
import { Caption, ICON_SIZE, UI_COLORS } from '@/ui';
import { useT } from '@/lib/i18n';

type ProjectHealthSectionProps = {
	report: ProjectHealthReport;
};

function statusClass(status: ProjectHealthReport['status']): string {
	if (status === 'healthy') return 'text-green-400';
	if (status === 'warning') return 'text-yellow-400';
	return 'text-red-500';
}

function StatusIcon({ status }: { status: ProjectHealthReport['status'] }) {
	if (status === 'healthy') return <CheckCircle2 size={ICON_SIZE.xs} />;
	if (status === 'warning') return <AlertTriangle size={ICON_SIZE.xs} />;
	return <XCircle size={ICON_SIZE.xs} />;
}

export default function ProjectHealthSection({
	report
}: ProjectHealthSectionProps) {
	const t = useT();
	const visibleIssues = report.issues.slice(0, 5);
	const hiddenCount = Math.max(0, report.issues.length - visibleIssues.length);
	const label =
		report.status === 'healthy'
			? t.project_health_clean
			: t.project_health_summary
					.replace('{errors}', String(report.errorCount))
					.replace('{warnings}', String(report.warningCount));

	return (
		<div
			className="flex flex-col gap-2 rounded border px-3 py-2"
			style={{
				borderColor:
					report.status === 'error' ? UI_COLORS.danger : UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<div
				className={`flex items-center gap-2 text-xs font-semibold ${statusClass(
					report.status
				)}`}
			>
				<StatusIcon status={report.status} />
				<span>{label}</span>
			</div>
			<Caption className="text-xs">{t.project_health_caption}</Caption>
			{visibleIssues.length > 0 ? (
				<div className="flex flex-col gap-1">
					{visibleIssues.map(issue => (
						<div
							key={`${issue.code}-${issue.message}`}
							className={`text-[11px] ${
								issue.severity === 'error'
									? 'text-red-400'
									: 'text-yellow-300'
							}`}
						>
							{issue.message}
						</div>
					))}
					{hiddenCount > 0 ? (
						<Caption className="text-[11px]">
							{t.project_health_more_issues.replace(
								'{n}',
								String(hiddenCount)
							)}
						</Caption>
					) : null}
				</div>
			) : null}
		</div>
	);
}
