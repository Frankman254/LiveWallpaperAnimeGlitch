import { useState } from 'react';
import {
	AUDIO_ROUTING_RANGES,
	FX_RANGES,
	IMAGE_RANGES,
	LOGO_RANGES
} from '@/config/ranges';
import {
	doProfileSettingsMatch,
	extractBackgroundProfileSettings
} from '@/lib/featureProfiles';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import ProfileSlotsEditor from '../../ui/ProfileSlotsEditor';
import SectionDivider from '../../ui/SectionDivider';
import { useDialog } from '../../ui/DialogProvider';

const BASS_SCALE_INTENSITY_RANGE = { min: 0.01, max: 2.5, step: 0.01 };

export default function BgZoomAudioSection() {
	const t = useT();
	const store = useWallpaperStore();
	const { confirm } = useDialog();
	const [showAdvanced, setShowAdvanced] = useState(true);
	const currentProfileSettings = extractBackgroundProfileSettings(store);
	const activeProfileIndex = store.backgroundProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentProfileSettings, slot.values)
	);

	async function handleSaveProfile(index: number) {
		const slot = store.backgroundProfileSlots[index];
		if (slot?.values) {
			const ok = await confirm({
				title: t.label_save_profile,
				message: t.confirm_overwrite_profile,
				confirmLabel: t.label_save_profile,
				cancelLabel: t.label_cancel,
				tone: 'warning'
			});
			if (!ok) return;
		}
		store.saveBackgroundProfileSlot(index);
	}

	return (
		<>
			<SectionDivider label={t.section_bg_zoom_audio} />
			<ProfileSlotsEditor
				title={t.section_saved_profiles}
				hint={t.hint_saved_profiles}
				slots={store.backgroundProfileSlots}
				activeIndex={
					activeProfileIndex >= 0 ? activeProfileIndex : null
				}
				onLoad={store.loadBackgroundProfileSlot}
				onSave={index => void handleSaveProfile(index)}
				onAdd={store.addBackgroundProfileSlot}
				onDelete={store.removeBackgroundProfileSlot}
				loadLabel={t.label_load_profile}
				saveLabel={t.label_save_profile}
				slotLabel={t.label_profile_slot}
				emptyLabel={t.profile_slot_empty}
				activeLabel={t.profile_slot_active}
			/>

			<ToggleControl
				label={t.label_bass_zoom}
				value={store.imageBassReactive}
				onChange={store.setImageBassReactive}
				tooltip={`${t.hint_bg_zoom_audio} ${t.hint_shared_bg_settings}`}
			/>
			{store.imageBassReactive && (
				<>
					<AudioChannelSelector
						value={store.imageAudioChannel}
						onChange={store.setImageAudioChannel}
						label={t.label_zoom_audio_channel}
					/>
					<ToggleControl
						label={t.label_smoothing}
						value={store.imageAudioSmoothingEnabled}
						onChange={store.setImageAudioSmoothingEnabled}
					/>
					{store.imageAudioSmoothingEnabled ? (
						<SliderControl
							label={t.label_smoothing_amount}
							value={store.imageAudioSmoothing}
							{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
							onChange={store.setImageAudioSmoothing}
						/>
					) : null}
					<SliderControl
						label={t.label_zoom_intensity}
						value={store.imageBassScaleIntensity}
						{...IMAGE_RANGES.bassIntensity}
						onChange={store.setImageBassScaleIntensity}
					/>
					<ToggleControl
						label={t.label_opacity_reactive}
						value={store.imageOpacityReactive}
						onChange={store.setImageOpacityReactive}
					/>
					{store.imageOpacityReactive ? (
						<SliderControl
							label={t.label_opacity_reactive_amount}
							value={store.imageOpacityReactiveAmount}
							min={0}
							max={1}
							step={0.05}
							onChange={store.setImageOpacityReactiveAmount}
						/>
					) : null}

					<button
						type="button"
						onClick={() => setShowAdvanced(v => !v)}
						className="self-start text-left text-[11px] text-cyan-500 underline decoration-cyan-800 hover:text-cyan-300"
					>
						{showAdvanced
							? `▼ ${t.label_envelope_params_collapse}`
							: `▶ ${t.label_envelope_params_expand}`}
					</button>

					{showAdvanced && (
						<div className="flex flex-col gap-2 border border-cyan-950/60 rounded-md p-2">
							<SliderControl
								label={t.label_logo_attack}
								value={store.imageBassAttack}
								{...LOGO_RANGES.attack}
								onChange={store.setImageBassAttack}
							/>
							<SliderControl
								label={t.label_logo_release}
								value={store.imageBassRelease}
								{...LOGO_RANGES.release}
								onChange={store.setImageBassRelease}
							/>
							<SliderControl
								label={t.label_reactivity_speed}
								value={store.imageBassReactivitySpeed}
								{...LOGO_RANGES.reactivitySpeed}
								onChange={store.setImageBassReactivitySpeed}
							/>
							<SliderControl
								label={t.label_logo_peak_window}
								value={store.imageBassPeakWindow}
								{...LOGO_RANGES.peakWindow}
								onChange={store.setImageBassPeakWindow}
							/>
							<SliderControl
								label={t.label_logo_peak_floor}
								value={store.imageBassPeakFloor}
								{...LOGO_RANGES.peakFloor}
								onChange={store.setImageBassPeakFloor}
							/>
							<SliderControl
								label={t.label_logo_punch}
								value={store.imageBassPunch}
								{...LOGO_RANGES.punch}
								onChange={store.setImageBassPunch}
							/>
							<SliderControl
								label={t.label_reactive_scale}
								value={store.imageBassReactiveScaleIntensity}
								{...BASS_SCALE_INTENSITY_RANGE}
								onChange={
									store.setImageBassReactiveScaleIntensity
								}
							/>
						</div>
					)}
				</>
			)}

			<SectionDivider label={t.section_background_motion} />
			<SliderControl
				label={t.label_parallax}
				value={store.parallaxStrength}
				{...FX_RANGES.parallax}
				onChange={store.setParallaxStrength}
				tooltip={t.hint_background_motion}
			/>
		</>
	);
}
