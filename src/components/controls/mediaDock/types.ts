import type { CSSProperties } from 'react';

export type ImageNavProps = {
	hasBackgroundImages: boolean;
	slideshowEnabled: boolean;
	onToggleSlideshow: () => void;
	motionPaused: boolean;
	onPrevImage: () => void;
	onNextImage: () => void;
	onToggleFreeze: () => void;
};

export type HoverPreview = {
	ratio: number;
	time: number;
};

export type DockInsetStyle = CSSProperties | undefined;
