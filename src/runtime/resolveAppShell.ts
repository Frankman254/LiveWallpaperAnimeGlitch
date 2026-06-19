import type { RuntimeUiMode } from './runtimeUiModeStore';

export type AppShellKind = 'edit' | 'output';

export function resolveAppShellFromRoute(pathname: string): AppShellKind {
	if (pathname === '/present' || pathname === '/record') return 'output';
	return 'edit';
}

export function resolveRuntimeUiModeFromRoute(pathname: string): RuntimeUiMode {
	if (pathname === '/present') return 'presentation';
	if (pathname === '/record') return 'recording';
	return 'edit';
}

export function resolveOutputRoute(mode: RuntimeUiMode): string {
	if (mode === 'presentation') return '/present';
	if (mode === 'recording') return '/record';
	return '/edit';
}
