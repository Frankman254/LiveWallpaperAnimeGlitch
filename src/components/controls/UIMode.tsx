import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * AdvancedOnly — only renders children when uiMode === 'advanced'.
 * Use this to hide technical controls in simple mode.
 */
export function AdvancedOnly({ children }: { children: ReactNode }) {
	const uiMode = useWallpaperStore(s => s.uiMode);
	if (uiMode !== 'advanced') return null;
	return <>{children}</>;
}

/**
 * SimpleOnly — only renders children when uiMode === 'simple'.
 */
export function SimpleOnly({ children }: { children: ReactNode }) {
	const uiMode = useWallpaperStore(s => s.uiMode);
	if (uiMode !== 'simple') return null;
	return <>{children}</>;
}

/**
 * useIsAdvanced — hook version of the UI mode check.
 */
export function useIsAdvanced(): boolean {
	return useWallpaperStore(s => s.uiMode === 'advanced');
}

/**
 * useIsSimple — hook version of the simple mode check.
 */
export function useIsSimple(): boolean {
	return useWallpaperStore(s => s.uiMode === 'simple');
}
