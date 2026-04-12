import { Suspense, lazy, type ReactNode } from 'react';

export const BgTab = lazy(() => import('./tabs/BgTab'));
export const FiltersTab = lazy(() => import('./tabs/FiltersTab'));
export const AudioTab = lazy(() => import('./tabs/AudioTab'));
export const TrackTitleTab = lazy(() => import('./tabs/TrackTitleTab'));
export const SpectrumTab = lazy(() => import('./tabs/SpectrumTab'));
export const LogoTab = lazy(() => import('./tabs/LogoTab'));
export const DiagnosticsTab = lazy(() => import('./tabs/DiagnosticsTab'));
export const ParticlesTab = lazy(() => import('./tabs/ParticlesTab'));
export const RainTab = lazy(() => import('./tabs/RainTab'));
export const LayersTab = lazy(() => import('./tabs/LayersTab'));
export const OverlaysTab = lazy(() => import('./tabs/OverlaysTab'));
export const ExportTab = lazy(() => import('./tabs/ExportTab'));
export const PerfTab = lazy(() => import('./tabs/PerfTab'));

export const EditorTab = lazy(() => import('./tabs/EditorTab'));

export function ControlTabSuspense({ children }: { children: ReactNode }) {
	return (
		<Suspense
			fallback={
				<div
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					Loading tab...
				</div>
			}
		>
			{children}
		</Suspense>
	);
}
