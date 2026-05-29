import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import { DEFAULT_STATE } from '@/lib/constants';
import { AdvancedOnly } from '../../../UIMode';
import { CollapsibleSection } from '@/ui';
import SliderControl from '../../../SliderControl';
import ToggleControl from '../../../ToggleControl';
import AudioChannelSelector from '../../../ui/AudioChannelSelector';
import { SpectrumManualControlGroup } from '../SpectrumManualControlGroup';

export function SpectrumAudioPanel() {
	const t = useT();
	const store = useWallpaperStore();

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<AudioChannelSelector
				value={store.spectrumBandMode}
				onChange={store.setSpectrumBandMode}
				label={t.label_band_mode}
			/>

			<AdvancedOnly>
				<ToggleControl
					label={t.label_smoothing}
					value={store.spectrumAudioSmoothingEnabled}
					onChange={store.setSpectrumAudioSmoothingEnabled}
				/>
				{store.spectrumAudioSmoothingEnabled ? (
					<SliderControl
						label={t.label_smoothing_amount}
						value={store.spectrumAudioSmoothing}
						{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
						onChange={store.setSpectrumAudioSmoothing}
					/>
				) : null}

				<SliderControl
					label="Beat drop depth"
					tooltip="Controls how far the whole spectrum shrinks after a beat. 0 = no global drop, 1 = strong breathing, 3 = can fall near zero if Min Height is 0."
					value={store.spectrumGainExpressiveness}
					{...SPECTRUM_RANGES.gainExpressiveness}
					onChange={store.setSpectrumGainExpressiveness}
					defaultValue={DEFAULT_STATE.spectrumGainExpressiveness}
				/>

				<SliderControl
					label={t.label_visual_smoothing}
					value={store.spectrumSmoothing}
					{...SPECTRUM_RANGES.smoothing}
					onChange={store.setSpectrumSmoothing}
				/>

				<CollapsibleSection title={t.label_envelope_params} dense>
					<div className="flex min-w-0 flex-col gap-2">
						<SliderControl
							label="Rise speed (attack)"
							tooltip="How quickly the envelope jumps upward when audio gets louder."
							value={store.spectrumEnvelopeAttack}
							{...SPECTRUM_RANGES.envelopeAttack}
							onChange={store.setSpectrumEnvelopeAttack}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeAttack}
						/>
						<SliderControl
							label="Drop speed (release)"
							tooltip="How quickly the envelope falls after a beat. Higher values make the spectrum drop faster."
							value={store.spectrumEnvelopeRelease}
							{...SPECTRUM_RANGES.envelopeRelease}
							onChange={store.setSpectrumEnvelopeRelease}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeRelease}
						/>
						<SliderControl
							label="Envelope speed multiplier"
							tooltip="Global speed multiplier for attack and release. Lower feels smoother; higher reacts more sharply."
							value={store.spectrumEnvelopeReactivitySpeed}
							{...SPECTRUM_RANGES.envelopeReactivitySpeed}
							onChange={store.setSpectrumEnvelopeReactivitySpeed}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopeReactivitySpeed
							}
						/>
						<SliderControl
							label="Peak memory (s)"
							tooltip="How long loud moments remain as the adaptive reference. Higher values make the drop feel more dramatic after peaks."
							value={store.spectrumEnvelopePeakWindow}
							{...SPECTRUM_RANGES.envelopePeakWindow}
							onChange={store.setSpectrumEnvelopePeakWindow}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopePeakWindow
							}
						/>
						<SliderControl
							label="Silence floor / noise gate"
							tooltip="Raises the adaptive floor so quiet signal is treated as silence. This is not the visual bar floor; use Min Height for that."
							value={store.spectrumEnvelopePeakFloor}
							{...SPECTRUM_RANGES.envelopePeakFloor}
							onChange={store.setSpectrumEnvelopePeakFloor}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopePeakFloor
							}
						/>
						<SliderControl
							label="Beat punch"
							tooltip="Adds a short transient boost on sharp hits."
							value={store.spectrumEnvelopePunch}
							{...SPECTRUM_RANGES.envelopePunch}
							onChange={store.setSpectrumEnvelopePunch}
							defaultValue={DEFAULT_STATE.spectrumEnvelopePunch}
						/>
					</div>
				</CollapsibleSection>

				<CollapsibleSection title={t.spectrum_section_manual_control} dense>
					<SpectrumManualControlGroup bare />
				</CollapsibleSection>
			</AdvancedOnly>
		</div>
	);
}
