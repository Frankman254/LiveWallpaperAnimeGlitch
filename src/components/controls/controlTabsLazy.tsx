import { Suspense, lazy, type ReactNode } from 'react';

// Adapters used by ModernLyricsTab / ModernExportTab to preserve untouched
// lyric parsing / project export logic until those flows migrate fully.
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
