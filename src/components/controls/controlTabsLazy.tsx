import { Suspense, type ReactNode } from 'react';

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
