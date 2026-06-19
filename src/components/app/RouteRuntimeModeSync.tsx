import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveRuntimeUiModeFromRoute } from '@/runtime/resolveAppShell';
import { useRuntimeUiModeStore } from '@/runtime/runtimeUiModeStore';

/** Keeps session runtime UI mode aligned with the active hash route. */
export default function RouteRuntimeModeSync() {
	const { pathname } = useLocation();

	useEffect(() => {
		const next = resolveRuntimeUiModeFromRoute(pathname);
		useRuntimeUiModeStore.getState().setMode(next);
	}, [pathname]);

	return null;
}
