import { useSpectrumTargetSettings } from '../useSpectrumTargetSettings';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import { DEFAULT_STATE } from '@/lib/constants';
import { AdvancedOnly } from '../../../UIMode';
import { CollapsibleSection } from '@/ui';
import SliderControl from '../../../SliderControl';
import AudioChannelSelector from '../../../ui/AudioChannelSelector';
import { SpectrumManualControlGroup } from '../SpectrumManualControlGroup';

export function SpectrumAudioPanel() {
	const t = useT();
	const { settings: sp, update, target } = useSpectrumTargetSettings();

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<AudioChannelSelector
				value={sp.spectrumBandMode}
				onChange={(value => update({ spectrumBandMode: value }))}
				label={t.label_band_mode}
			/>

			<AdvancedOnly>
				<SliderControl
					label={t.label_smoothing}
					value={sp.spectrumAudioSmoothing}
					{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
					onChange={(value => update({ spectrumAudioSmoothing: value }))}
					defaultValue={DEFAULT_STATE.spectrumAudioSmoothing}
				/>
				<SliderControl
					label={t.label_audio_glow}
					tooltip="Adds extra halo on peaks without changing the base glow when the track is quiet."
					value={sp.spectrumGlowAudioAmount}
					{...SPECTRUM_RANGES.glowAudioAmount}
					onChange={(value => update({ spectrumGlowAudioAmount: value }))}
					defaultValue={DEFAULT_STATE.spectrumGlowAudioAmount}
				/>

				<SliderControl
					label="Beat drop depth"
					tooltip="Controls how far the whole spectrum shrinks after a beat. 0 = no global drop, 1 = strong breathing, 3 = can fall near zero if Min Height is 0."
					value={sp.spectrumGainExpressiveness}
					{...SPECTRUM_RANGES.gainExpressiveness}
					onChange={(value => update({ spectrumGainExpressiveness: value }))}
					defaultValue={DEFAULT_STATE.spectrumGainExpressiveness}
				/>

				<SliderControl
					label={t.label_visual_smoothing}
					value={sp.spectrumSmoothing}
					{...SPECTRUM_RANGES.smoothing}
					onChange={(value => update({ spectrumSmoothing: value }))}
				/>

				<CollapsibleSection title={t.label_envelope_params} dense>
					<div className="flex min-w-0 flex-col gap-2">
						<SliderControl
							label="Rise speed (attack)"
							tooltip="How quickly the envelope jumps upward when audio gets louder."
							value={sp.spectrumEnvelopeAttack}
							{...SPECTRUM_RANGES.envelopeAttack}
							onChange={(value => update({ spectrumEnvelopeAttack: value }))}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeAttack}
						/>
						<SliderControl
							label="Drop speed (release)"
							tooltip="How quickly the envelope falls after a beat. Higher values make the spectrum drop faster."
							value={sp.spectrumEnvelopeRelease}
							{...SPECTRUM_RANGES.envelopeRelease}
							onChange={(value => update({ spectrumEnvelopeRelease: value }))}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeRelease}
						/>
						<SliderControl
							label="Envelope speed multiplier"
							tooltip="Global speed multiplier for attack and release. Lower feels smoother; higher reacts more sharply."
							value={sp.spectrumEnvelopeReactivitySpeed}
							{...SPECTRUM_RANGES.envelopeReactivitySpeed}
							onChange={(value => update({ spectrumEnvelopeReactivitySpeed: value }))}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopeReactivitySpeed
							}
						/>
						<SliderControl
							label="Peak memory (s)"
							tooltip="How long loud moments remain as the adaptive reference. Higher values make the drop feel more dramatic after peaks."
							value={sp.spectrumEnvelopePeakWindow}
							{...SPECTRUM_RANGES.envelopePeakWindow}
							onChange={(value => update({ spectrumEnvelopePeakWindow: value }))}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopePeakWindow
							}
						/>
						<SliderControl
							label="Silence floor / noise gate"
							tooltip="Raises the adaptive floor so quiet signal is treated as silence. This is not the visual bar floor; use Min Height for that."
							value={sp.spectrumEnvelopePeakFloor}
							{...SPECTRUM_RANGES.envelopePeakFloor}
							onChange={(value => update({ spectrumEnvelopePeakFloor: value }))}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopePeakFloor
							}
						/>
						<SliderControl
							label="Beat punch"
							tooltip="Adds a short transient boost on sharp hits."
							value={sp.spectrumEnvelopePunch}
							{...SPECTRUM_RANGES.envelopePunch}
							onChange={(value => update({ spectrumEnvelopePunch: value }))}
							defaultValue={DEFAULT_STATE.spectrumEnvelopePunch}
						/>
					</div>
				</CollapsibleSection>

				{target === 'main' ? (
					<CollapsibleSection
						title={t.spectrum_section_manual_control}
						dense
					>
						<SpectrumManualControlGroup bare />
					</CollapsibleSection>
				) : null}
			</AdvancedOnly>
		</div>
	);
}
