import { Suspense, lazy, type ReactNode } from 'react';

// Legacy bridges still consumed by EditorOverlay (Layers / Overlays tabs).
export const LayersTab = lazy(() => import('./tabs/LayersTab'));
export const OverlaysTab = lazy(() => import('./tabs/OverlaysTab'));

// Adapters used by ModernLyricsTab / ModernExportTab.
export const LyricsTab = lazy(() => import('./tabs/LyricsTab'));
export const ExportTab = lazy(() => import('./tabs/ExportTab'));

export const CalibrationTab = lazy(() => import('./tabs/CalibrationTab'));

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
