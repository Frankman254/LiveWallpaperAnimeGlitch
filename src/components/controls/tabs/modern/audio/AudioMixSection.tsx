import type { AudioMixMode, AudioTransitionStyle } from '@/types/wallpaper';
import { Button, CollapsibleSection, SectionCard, Slider, FONT } from '@/ui';
import { useT } from '@/lib/i18n';
import { InfoText, SectionLabel, ToggleRow } from './AudioSharedControls';
import { MIX_MODES, TRANSITION_STYLES, formatDecimal } from './audioTabUtils';

export type MixModeMeta = Record<
	Extract<AudioMixMode, 'sequential' | 'energy-match' | 'contrast'>,
	{ label: string; desc: string }
>;

export type TransitionStyleMeta = Record<
	AudioTransitionStyle,
	{ label: string; desc: string }
>;

export default function AudioMixSection({
	audioAutoAdvance,
	setAudioAutoAdvance,
	audioMixMode,
	setAudioMixMode,
	mixModeMeta,
	audioCrossfadeEnabled,
	setAudioCrossfadeEnabled,
	transitionStyle,
	setTransitionStyle,
	transitionStyleMeta,
	audioCrossfadeSeconds,
	setAudioCrossfadeSeconds
}: {
	audioAutoAdvance: boolean;
	setAudioAutoAdvance: (value: boolean) => void;
	audioMixMode: AudioMixMode;
	setAudioMixMode: (value: AudioMixMode) => void;
	mixModeMeta: MixModeMeta;
	audioCrossfadeEnabled: boolean;
	setAudioCrossfadeEnabled: (value: boolean) => void;
	transitionStyle: AudioTransitionStyle;
	setTransitionStyle: (value: AudioTransitionStyle) => void;
	transitionStyleMeta: TransitionStyleMeta;
	audioCrossfadeSeconds: number;
	setAudioCrossfadeSeconds: (value: number) => void;
}) {
	const t = useT();

	return (
		<SectionCard
			title={t.label_mix_mode}
			subtitle={t.hint_mix_mode}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<ToggleRow
					label={t.label_auto_mix}
					hint={t.hint_auto_mix}
					checked={audioAutoAdvance}
					onChange={setAudioAutoAdvance}
				/>
				<div className="grid grid-cols-3 gap-1.5">
					{MIX_MODES.map(mode => {
						const active = audioMixMode === mode.id;
						const meta = mixModeMeta[mode.id];
						return (
							<Button
								key={mode.id}
								size="sm"
								density="compact"
								variant={active ? 'primary' : 'secondary'}
								active={active}
								onClick={() => setAudioMixMode(mode.id)}
								title={meta.desc}
								full
							>
								<span style={{ fontFamily: FONT.mono }}>
									{mode.icon}
								</span>
								{meta.label}
							</Button>
						);
					})}
				</div>
				<CollapsibleSection
					title={t.label_crossfade_transitions}
					defaultOpen={audioCrossfadeEnabled}
					dense
				>
					<div className="flex flex-col gap-3">
						<ToggleRow
							label={t.label_enable_crossfade}
							checked={audioCrossfadeEnabled}
							onChange={setAudioCrossfadeEnabled}
						/>
						{audioCrossfadeEnabled ? (
							<>
								<div className="flex flex-col gap-1.5">
									<SectionLabel>{t.label_style}</SectionLabel>
									<div className="grid grid-cols-2 gap-1.5">
										{TRANSITION_STYLES.map(style => {
											const active =
												transitionStyle === style;
											const meta =
												transitionStyleMeta[style];
											return (
												<Button
													key={style}
													size="sm"
													density="compact"
													variant={
														active
															? 'primary'
															: 'secondary'
													}
													active={active}
													onClick={() =>
														setTransitionStyle(
															style
														)
													}
													title={meta.desc}
													full
												>
													{meta.label}
												</Button>
											);
										})}
									</div>
									<InfoText>
										{
											transitionStyleMeta[transitionStyle]
												.desc
										}
									</InfoText>
								</div>
								<Slider
									label={t.label_duration_seconds}
									value={audioCrossfadeSeconds}
									min={0.5}
									max={15}
									step={0.5}
									onChange={setAudioCrossfadeSeconds}
									variant="compact"
									formatValue={formatDecimal}
								/>
							</>
						) : null}
					</div>
				</CollapsibleSection>
			</div>
		</SectionCard>
	);
}
