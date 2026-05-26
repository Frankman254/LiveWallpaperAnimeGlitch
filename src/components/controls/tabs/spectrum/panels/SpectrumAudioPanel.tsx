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
					label="Reactivity expressiveness"
					tooltip="How much the global beat envelope modulates bar height. 0 = bars ignore the envelope (only per-bin smoothing drives them). 0.5 = the legacy subtle pop. 1 = cinematic — bars drop ~32% on silence and surge ~16% on peaks."
					value={store.spectrumGainExpressiveness}
					{...SPECTRUM_RANGES.gainExpressiveness}
					onChange={store.setSpectrumGainExpressiveness}
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
							label={t.label_logo_attack}
							value={store.spectrumEnvelopeAttack}
							{...SPECTRUM_RANGES.envelopeAttack}
							onChange={store.setSpectrumEnvelopeAttack}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeAttack}
						/>
						<SliderControl
							label={t.label_logo_release}
							value={store.spectrumEnvelopeRelease}
							{...SPECTRUM_RANGES.envelopeRelease}
							onChange={store.setSpectrumEnvelopeRelease}
							defaultValue={DEFAULT_STATE.spectrumEnvelopeRelease}
						/>
						<SliderControl
							label={t.label_reactivity_speed}
							value={store.spectrumEnvelopeReactivitySpeed}
							{...SPECTRUM_RANGES.envelopeReactivitySpeed}
							onChange={store.setSpectrumEnvelopeReactivitySpeed}
							defaultValue={
								DEFAULT_STATE.spectrumEnvelopeReactivitySpeed
							}
						/>
						<SliderControl
							label={t.label_logo_peak_window}
							value={store.spectrumEnvelopePeakWindow}
							{...SPECTRUM_RANGES.envelopePeakWindow}
							onChange={store.setSpectrumEnvelopePeakWindow}
							defaultValue={DEFAULT_STATE.spectrumEnvelopePeakWindow}
						/>
						<SliderControl
							label={t.label_logo_peak_floor}
							value={store.spectrumEnvelopePeakFloor}
							{...SPECTRUM_RANGES.envelopePeakFloor}
							onChange={store.setSpectrumEnvelopePeakFloor}
							defaultValue={DEFAULT_STATE.spectrumEnvelopePeakFloor}
						/>
						<SliderControl
							label={t.label_logo_punch}
							value={store.spectrumEnvelopePunch}
							{...SPECTRUM_RANGES.envelopePunch}
							onChange={store.setSpectrumEnvelopePunch}
							defaultValue={DEFAULT_STATE.spectrumEnvelopePunch}
						/>
					</div>
				</CollapsibleSection>

				<CollapsibleSection title="Manual control" dense>
					<SpectrumManualControlGroup bare />
				</CollapsibleSection>
			</AdvancedOnly>
		</div>
	);
}
