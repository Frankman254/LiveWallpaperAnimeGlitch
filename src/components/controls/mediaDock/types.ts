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

/**
 * Generic carousel-style picker for subsystems that have a list of named
 * entries (slots, presets, or a mix). Total/index labels follow the same
 * `n/N` convention used by the image badge so the HUD stays consistent.
 */
export type SubsystemCarouselNav = {
	/** When false, the picker hides entirely (no entries to navigate). */
	hasItems: boolean;
	/** Short label for the chip (e.g. `SPEC 02/05`). */
	label: string;
	/** Long tooltip describing the current entry. */
	tooltip: string;
	onPrev: () => void;
	onNext: () => void;
};

export type HoverPreview = {
	ratio: number;
	time: number;
};

export type DockInsetStyle = CSSProperties | undefined;
