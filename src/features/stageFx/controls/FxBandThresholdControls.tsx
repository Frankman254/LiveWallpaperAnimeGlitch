/**
 * The kick / bass / full threshold row shared by the Stage FX sections.
 *
 * It lived in `editor/MotionSharedControls` and was the last thing making the
 * shared editor chrome import a domain: its props are `FxBandThresholds` and
 * `FxAudioChannel`, which are stageFx vocabulary, and its only three consumers
 * are stageFx sections. Generic chrome does not know what a kick band is.
 */
import { Slider } from '@/ui';
import type { FxAudioChannel, FxBandThresholds } from '../stageFxConfig';

export function FxBandThresholdControls({
	thresholds,
	defaultThresholds,
	onChange
}: {
	thresholds: FxBandThresholds;
	defaultThresholds: FxBandThresholds;
	onChange: (channel: FxAudioChannel, value: number) => void;
}) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
			{(['kick', 'bass', 'full'] as const).map(channel => (
				<Slider
					key={channel}
					label={`${channel} threshold`}
					value={thresholds[channel]}
					min={0}
					max={1}
					step={0.01}
					onChange={value => onChange(channel, value)}
					defaultValue={defaultThresholds[channel]}
					variant="compact"
					formatValue={value => value.toFixed(2)}
				/>
			))}
		</div>
	);
}
