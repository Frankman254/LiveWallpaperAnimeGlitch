import { useT } from '@/lib/i18n';
import {
	OptionButtonGroup,
	SwitchRow
} from '@/components/controls/tabs/modern/modernAdvancedControls';
import { Caption } from '@/ui';
import { useEnterOutputMode } from '@/runtime/useEnterOutputMode';
import {
	RECORDING_RENDER_SCALE_OPTIONS,
	useOutputPerformanceStore,
	type RecordingRenderScale,
	type RecordingTargetFps
} from '@/runtime/outputPerformanceStore';

const RECORDING_FPS_OPTIONS = ['30', '60'] as const;

export default function OutputModeLaunchSection() {
	const t = useT();
	const { goPresentation, goRecording } = useEnterOutputMode();
	const {
		presentationHideCursor,
		presentationFullscreenOnLaunch,
		recordingTargetFps,
		recordingRenderScale,
		recordingFullscreenOnLaunch,
		setPresentationHideCursor,
		setPresentationFullscreenOnLaunch,
		setRecordingTargetFps,
		setRecordingRenderScale,
		setRecordingFullscreenOnLaunch
	} = useOutputPerformanceStore();

	return (
		<div className="flex min-w-0 flex-col gap-3 rounded border border-white/10 p-3">
			<span className="text-xs font-semibold uppercase tracking-wide text-white/70">
				{t.section_live_output}
			</span>

			<div className="flex flex-col gap-2 rounded border border-white/5 p-2.5">
				<span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
					{t.label_presentation_mode}
				</span>
				<SwitchRow
					label={t.label_output_hide_cursor}
					hint={t.hint_output_hide_cursor}
					checked={presentationHideCursor}
					onChange={setPresentationHideCursor}
				/>
				<SwitchRow
					label={t.label_output_fullscreen_launch}
					hint={t.hint_output_fullscreen_launch}
					checked={presentationFullscreenOnLaunch}
					onChange={setPresentationFullscreenOnLaunch}
				/>
				<button
					type="button"
					className="rounded bg-cyan-700 px-3 py-2 text-xs text-white hover:bg-cyan-600"
					onClick={goPresentation}
				>
					{t.label_presentation_mode}
				</button>
				<Caption as="p">{t.hint_presentation_mode}</Caption>
			</div>

			<div className="flex flex-col gap-2 rounded border border-white/5 p-2.5">
				<span className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
					{t.label_recording_mode}
				</span>
				<OptionButtonGroup
					label={t.label_output_recording_fps}
					options={RECORDING_FPS_OPTIONS}
					value={String(recordingTargetFps)}
					onChange={value =>
						setRecordingTargetFps(
							Number(value) as RecordingTargetFps
						)
					}
					columns={2}
					labels={{
						'30': '30 FPS',
						'60': '60 FPS'
					}}
				/>
				<OptionButtonGroup
					label={t.label_output_render_scale}
					options={RECORDING_RENDER_SCALE_OPTIONS.map(String)}
					value={String(recordingRenderScale)}
					onChange={value =>
						setRecordingRenderScale(
							Number(value) as RecordingRenderScale
						)
					}
					columns={3}
					labels={{
						'0.5': '0.5×',
						'0.75': '0.75×',
						'1': '1×'
					}}
				/>
				<SwitchRow
					label={t.label_output_fullscreen_launch}
					hint={t.hint_output_fullscreen_launch}
					checked={recordingFullscreenOnLaunch}
					onChange={setRecordingFullscreenOnLaunch}
				/>
				<button
					type="button"
					className="rounded bg-amber-700 px-3 py-2 text-xs text-white hover:bg-amber-600"
					onClick={goRecording}
				>
					{t.label_recording_mode}
				</button>
				<Caption as="p">{t.hint_recording_mode}</Caption>
			</div>
		</div>
	);
}
