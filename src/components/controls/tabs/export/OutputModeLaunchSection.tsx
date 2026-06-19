import { useT } from '@/lib/i18n';
import { useEnterOutputMode } from '@/runtime/useEnterOutputMode';
import { Caption } from '@/ui';

export default function OutputModeLaunchSection() {
	const t = useT();
	const { goPresentation, goRecording } = useEnterOutputMode();

	return (
		<div className="flex min-w-0 flex-col gap-2 rounded border border-white/10 p-3">
			<span className="text-xs font-semibold uppercase tracking-wide text-white/70">
				Live output
			</span>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className="rounded bg-cyan-700 px-3 py-2 text-xs text-white hover:bg-cyan-600"
					onClick={goPresentation}
				>
					{t.label_presentation_mode}
				</button>
				<button
					type="button"
					className="rounded bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-600"
					onClick={goRecording}
				>
					{t.label_recording_mode}
				</button>
			</div>
			<Caption as="p">{t.hint_presentation_mode}</Caption>
			<Caption as="p">{t.hint_recording_mode}</Caption>
		</div>
	);
}
