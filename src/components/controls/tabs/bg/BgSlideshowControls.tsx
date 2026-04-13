import { useState } from 'react';
import ToggleControl from '@/components/controls/ToggleControl';
import SliderControl from '@/components/controls/SliderControl';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';

export default function BgSlideshowControls() {
	const t = useT();
	const store = useWallpaperStore();
	const [useMinutes, setUseMinutes] = useState(false);

	const intervalSeconds = store.slideshowInterval;
	const displayInterval = useMinutes ? intervalSeconds / 60 : intervalSeconds;
	const minInterval = useMinutes ? 1 : 5;
	const maxInterval = useMinutes ? 60 : 300;
	const stepInterval = useMinutes ? 1 : 5;

	function handleIntervalChange(value: number) {
		store.setSlideshowInterval(useMinutes ? Math.round(value * 60) : value);
	}

	return (
		<>
			<ToggleControl
				label={t.label_slideshow_enabled}
				value={store.slideshowEnabled}
				onChange={store.setSlideshowEnabled}
			/>
			{store.slideshowEnabled && (
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						<ToggleControl
							label={t.label_slideshow_audio_checkpoints}
							value={store.slideshowAudioCheckpointsEnabled}
							onChange={store.setSlideshowAudioCheckpointsEnabled}
							tooltip={t.hint_slideshow_audio_checkpoints}
						/>
						<ToggleControl
							label="Manual timestamps"
							value={store.slideshowManualTimestampsEnabled}
							onChange={store.setSlideshowManualTimestampsEnabled}
							tooltip="Switch images at exact seconds defined per image (audio file mode)"
						/>
						<ToggleControl
							label={t.label_slideshow_track_change_sync}
							value={store.slideshowTrackChangeSyncEnabled}
							onChange={store.setSlideshowTrackChangeSyncEnabled}
							tooltip={t.hint_slideshow_track_change_sync}
						/>
					</div>

					{store.slideshowManualTimestampsEnabled && (
					<div className="flex items-center gap-2">
						<span
							className="flex-1 text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							Set the exact second for each image in the Active Wallpaper section above. Requires audio file mode.
						</span>
						<button
							onClick={() => store.resetAllManualTimestamps()}
							className="shrink-0 rounded border px-2 py-1 text-[10px] transition-colors hover:bg-white/5"
							style={{
								background: 'var(--editor-tag-bg)',
								borderColor: 'var(--editor-tag-border)',
								color: 'var(--editor-tag-fg)'
							}}
							title="Clear all manual timestamps on every image, revert to auto-calculated"
						>
							Reset All
						</button>
					</div>
				)}

					{store.slideshowAudioCheckpointsEnabled && !store.slideshowManualTimestampsEnabled ? (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_slideshow_audio_checkpoints}
						</span>
					) : null}

					{store.slideshowTrackChangeSyncEnabled ? (
						<span
							className="text-[11px]"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_slideshow_track_change_sync}
						</span>
					) : null}

					{!store.slideshowAudioCheckpointsEnabled &&
					!store.slideshowManualTimestampsEnabled &&
					!store.slideshowTrackChangeSyncEnabled ? (
						<div className="flex items-center gap-2">
							<div className="flex-1">
								<SliderControl
									label={`Interval (${useMinutes ? 'min' : 'sec'})`}
									value={displayInterval}
									min={minInterval}
									max={maxInterval}
									step={stepInterval}
									onChange={handleIntervalChange}
									unit={useMinutes ? 'min' : 's'}
								/>
							</div>
							<button
								onClick={() => setUseMinutes(prev => !prev)}
								className="mt-3 shrink-0 rounded border px-2 py-1 text-xs transition-colors"
								style={{
									background: 'var(--editor-button-bg)',
									borderColor: 'var(--editor-button-border)',
									color: 'var(--editor-button-fg)'
								}}
							>
								{useMinutes ? 'sec' : 'min'}
							</button>
						</div>
					) : null}
				</div>
			)}
		</>
	);
}
