import { AUDIO_ROUTING_RANGES } from '@/config/ranges';
import { useT } from '@/lib/i18n';
import {
	Button,
	CollapsibleSection,
	SectionCard,
	Select,
	Slider
} from '@/ui';
import { InfoText, SectionLabel } from './AudioSharedControls';
import {
	FFT_PRESETS,
	FFT_SIZES,
	formatDecimal,
	formatInteger
} from './audioTabUtils';

const FFT_SIZE_OPTIONS = FFT_SIZES.map(size => ({
	value: size,
	label: `${size} bins`
}));

export default function AudioAnalysisSection({
	fftSize,
	setFftSize,
	audioAutoKickThreshold,
	setAudioAutoKickThreshold,
	audioAutoSwitchHoldMs,
	setAudioAutoSwitchHoldMs
}: {
	fftSize: number;
	setFftSize: (value: number) => void;
	audioAutoKickThreshold: number;
	setAudioAutoKickThreshold: (value: number) => void;
	audioAutoSwitchHoldMs: number;
	setAudioAutoSwitchHoldMs: (value: number) => void;
}) {
	const t = useT();
	const activeFftPreset =
		FFT_PRESETS.find(preset => preset.fftSize === fftSize) ?? null;

	return (
		<SectionCard
			title={t.section_audio_analysis}
			subtitle={t.hint_fft_size}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<SectionLabel>{t.label_fft_presets}</SectionLabel>
					<div className="grid grid-cols-3 gap-1.5">
						{FFT_PRESETS.map(preset => (
							<Button
								key={preset.id}
								size="sm"
								density="compact"
								variant={
									activeFftPreset?.id === preset.id
										? 'primary'
										: 'secondary'
								}
								active={activeFftPreset?.id === preset.id}
								onClick={() => setFftSize(preset.fftSize)}
								full
							>
								{preset.label}
							</Button>
						))}
					</div>
					<InfoText>
						{activeFftPreset?.id === 'fast' && t.hint_fft_fast}
						{activeFftPreset?.id === 'balanced' && t.hint_fft_balanced}
						{activeFftPreset?.id === 'detailed' && t.hint_fft_detailed}
						{!activeFftPreset && t.hint_fft_custom}
					</InfoText>
				</div>
				<div className="flex flex-col gap-1.5">
					<SectionLabel>{t.label_fft_size}</SectionLabel>
					<Select
						value={String(fftSize)}
						onChange={value => setFftSize(Number(value))}
						options={FFT_SIZE_OPTIONS}
						size="sm"
						density="compact"
						full
					/>
				</div>
				<CollapsibleSection title={t.section_audio_routing} defaultOpen={false} dense>
					<div className="flex flex-col gap-3">
						<InfoText>{t.hint_auto_channel_priority}</InfoText>
						<Slider
							label={t.label_auto_kick_threshold}
							value={audioAutoKickThreshold}
							{...AUDIO_ROUTING_RANGES.autoKickThreshold}
							onChange={setAudioAutoKickThreshold}
							variant="compact"
							formatValue={formatDecimal}
						/>
						<Slider
							label={t.label_auto_switch_hold}
							value={audioAutoSwitchHoldMs}
							{...AUDIO_ROUTING_RANGES.autoSwitchHoldMs}
							onChange={setAudioAutoSwitchHoldMs}
							unit="ms"
							variant="compact"
							formatValue={formatInteger}
						/>
					</div>
				</CollapsibleSection>
			</div>
		</SectionCard>
	);
}
