import { createContext, type ReactNode } from 'react';

/** Which spectrum the editor panels are bound to. 'main' edits the flat
 *  WallpaperState keys; 'instance' edits spectrumInstances[0] ("Spectrum 2").
 *  Both share the same key names, so every panel reads/writes one shape. */
export type SpectrumTarget = 'main' | 'instance';

export const SpectrumTargetCtx = createContext<SpectrumTarget>('main');

export function SpectrumTargetProvider({
	target,
	children
}: {
	target: SpectrumTarget;
	children: ReactNode;
}) {
	return (
		<SpectrumTargetCtx.Provider value={target}>
			{children}
		</SpectrumTargetCtx.Provider>
	);
}
