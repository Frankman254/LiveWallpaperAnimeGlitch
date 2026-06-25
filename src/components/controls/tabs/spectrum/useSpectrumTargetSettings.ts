import { useContext } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	SPECTRUM_INSTANCE_SETTING_KEYS,
	createDefaultSpectrumInstance,
	createDefaultSpectrumInstanceSettings
} from '@/features/spectrum/spectrumInstanceModel';
import type {
	SpectrumInstanceSettings,
	WallpaperState
} from '@/types/wallpaper';
import {
	SpectrumTargetCtx,
	type SpectrumTarget
} from './SpectrumTargetContext';

export function useSpectrumTarget(): SpectrumTarget {
	return useContext(SpectrumTargetCtx);
}

export type SpectrumTargetBinding = {
	target: SpectrumTarget;
	/** Settings of the bound spectrum, always in main key names. */
	settings: SpectrumInstanceSettings;
	/** Normalized patch against the bound spectrum. */
	update: (patch: Partial<SpectrumInstanceSettings>) => void;
};

function pickMainSettings(state: WallpaperState): SpectrumInstanceSettings {
	// Start from defaults so a key that hasn't been backfilled into persisted
	// state yet (e.g. a freshly-added setting before its migration runs) falls
	// back to a valid value instead of leaking `undefined` into the panels.
	const out = createDefaultSpectrumInstanceSettings() as unknown as Record<
		string,
		unknown
	>;
	for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
		const value = state[key];
		if (value !== undefined) out[key] = value;
	}
	return out as unknown as SpectrumInstanceSettings;
}

/**
 * Binds the spectrum editor panels to the target selected in the Spectrum
 * tab. Panels stay agnostic: `settings.spectrumBarCount` +
 * `update({ spectrumBarCount })` work identically for both spectrums.
 */
export function useSpectrumTargetSettings(
	targetOverride?: SpectrumTarget
): SpectrumTargetBinding {
	const contextTarget = useSpectrumTarget();
	const target = targetOverride ?? contextTarget;
	const settings = useWallpaperStore(
		useShallow((s): SpectrumInstanceSettings => {
			if (target === 'instance') {
				const instance = s.spectrumInstances[0];
				// Merge over defaults so a persisted instance missing a newly
				// added key (e.g. spectrumScale before its migration runs)
				// never feeds `undefined` into the editor controls.
				return instance
					? { ...createDefaultSpectrumInstance(), ...instance }
					: createDefaultSpectrumInstance();
			}
			return pickMainSettings(s);
		})
	);
	const patchSpectrumMain = useWallpaperStore(s => s.patchSpectrumMain);
	const updateSpectrumInstance = useWallpaperStore(
		s => s.updateSpectrumInstance
	);
	const instanceId = useWallpaperStore(
		s => s.spectrumInstances[0]?.id ?? null
	);

	const update = (patch: Partial<SpectrumInstanceSettings>) => {
		if (target === 'instance') {
			if (instanceId !== null) updateSpectrumInstance(instanceId, patch);
			return;
		}
		patchSpectrumMain(patch);
	};

	return { target, settings, update };
}
