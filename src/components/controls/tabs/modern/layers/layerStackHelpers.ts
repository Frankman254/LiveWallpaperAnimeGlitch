import type { OverlayLayer, WallpaperLayer } from '@/types/layers';

export type SyntheticLayer = {
	id: 'global-background';
	title: string;
	kindLabel: string;
	enabled: boolean;
	lockedOrder: true;
	hasAsset: boolean;
};

export function isOverlayImage(
	layer: WallpaperLayer
): layer is Extract<OverlayLayer, { type: 'overlay-image' }> {
	return layer.type === 'overlay-image';
}

export function formatInteger(value: number): string {
	return Math.round(value).toString();
}
