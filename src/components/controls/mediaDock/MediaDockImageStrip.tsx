import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Images, Snowflake } from 'lucide-react';
import IconButton from '@/ui/IconButton';
import { ICON_SIZE, ICON_STROKE } from '../ui/designTokens';
import { useT } from '@/lib/i18n';
import type { DockInsetStyle, ImageNavProps } from './types';

export default function MediaDockImageStrip({
	imageNav,
	imgBadge,
	hudIconBtn,
	edgeInsetStyle
}: {
	imageNav: ImageNavProps;
	imgBadge: ReactNode;
	hudIconBtn: string;
	edgeInsetStyle: DockInsetStyle;
}) {
	const t = useT();
	if (!imageNav.hasBackgroundImages) return null;

	return (
		<div
			className="flex min-h-[40px] w-full flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:min-h-[34px] sm:flex-nowrap"
			style={edgeInsetStyle}
		>
			<div className="flex justify-center gap-1">
				{!imageNav.slideshowEnabled ? (
					<IconButton
						onClick={imageNav.onPrevImage}
						title={t.mediadock_prev_image}
						className={hudIconBtn}
					>
						<ChevronLeft
							size={ICON_SIZE.md}
							strokeWidth={ICON_STROKE.bold}
						/>
					</IconButton>
				) : null}
			</div>
			<div className="flex justify-center px-0.5">
				<IconButton
					active={imageNav.motionPaused}
					onClick={imageNav.onToggleFreeze}
					title={imageNav.motionPaused ? 'Resume motion' : 'Freeze motion'}
					className={hudIconBtn}
				>
					<Snowflake
						size={ICON_SIZE.md}
						strokeWidth={ICON_STROKE.bold}
					/>
				</IconButton>
			</div>
			<div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5">
				{!imageNav.slideshowEnabled ? (
					<IconButton
						onClick={imageNav.onNextImage}
						title={t.mediadock_next_image}
						className={hudIconBtn}
					>
						<ChevronRight
							size={ICON_SIZE.md}
							strokeWidth={ICON_STROKE.bold}
						/>
					</IconButton>
				) : null}
				<IconButton
					active={imageNav.slideshowEnabled}
					onClick={imageNav.onToggleSlideshow}
					title={
						imageNav.slideshowEnabled
							? 'Auto-cycle images (on) - click to use manual images'
							: 'Auto-cycle images (off) - click to rotate images automatically'
					}
					className={hudIconBtn}
				>
					<Images size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} />
				</IconButton>
				{imgBadge}
			</div>
		</div>
	);
}
