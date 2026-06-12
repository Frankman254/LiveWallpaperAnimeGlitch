import { useContext } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	SPECTRUM_INSTANCE_SETTING_KEYS,
	createDefaultSpectrumInstance
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
	const out = {} as Record<string, unknown>;
	for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
		out[key] = state[key];
	}
	return out as unknown as SpectrumInstanceSettings;
}

/**
 * Binds the spectrum editor panels to the target selected in the Spectrum
 * tab. Panels stay agnostic: `settings.spectrumBarCount` +
 * `update({ spectrumBarCount })` work identically for both spectrums.
 */
export function useSpectrumTargetSettings(): SpectrumTargetBinding {
	const target = useSpectrumTarget();
	const settings = useWallpaperStore(
		useShallow((s): SpectrumInstanceSettings => {
			if (target === 'instance') {
				return s.spectrumInstances[0] ?? createDefaultSpectrumInstance();
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
