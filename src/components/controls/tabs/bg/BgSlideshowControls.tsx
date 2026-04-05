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
						className="mt-3 shrink-0 rounded border border-cyan-900 px-2 py-1 text-xs text-cyan-500 transition-colors hover:border-cyan-600"
					>
						{useMinutes ? 'sec' : 'min'}
					</button>
				</div>
			)}
		</>
	);
}
