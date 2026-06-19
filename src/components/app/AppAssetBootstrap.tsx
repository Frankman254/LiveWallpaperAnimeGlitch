import { useLocation } from 'react-router-dom';
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';

/** Restores persisted assets once for the shared provider tree. */
export default function AppAssetBootstrap() {
	const { pathname } = useLocation();
	const isMiniPreview =
		pathname === '/preview' &&
		typeof window !== 'undefined' &&
		window.location.hash.includes('mini=1');

	useRestoreWallpaperAssets(!isMiniPreview);
	return null;
}
