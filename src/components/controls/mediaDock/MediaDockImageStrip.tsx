import type { ReactNode } from 'react';
import {
	AudioWaveform,
	ChevronLeft,
	ChevronRight,
	Images,
	Snowflake,
	Wand2
} from 'lucide-react';
import IconButton from '@/ui/IconButton';
import { ICON_SIZE, ICON_STROKE } from '../ui/designTokens';
import { useT } from '@/lib/i18n';
import type {
	DockInsetStyle,
	ImageNavProps,
	SubsystemCarouselNav
} from './types';

function CarouselPicker({
	nav,
	icon,
	hudIconBtn
}: {
	nav: SubsystemCarouselNav;
	icon: ReactNode;
	hudIconBtn: string;
}) {
	if (!nav.hasItems) return null;
	return (
		<div className="flex items-center gap-0.5">
			<IconButton
				onClick={nav.onPrev}
				title={`Previous (${nav.tooltip})`}
				className={hudIconBtn}
			>
				<ChevronLeft
					size={ICON_SIZE.md}
					strokeWidth={ICON_STROKE.bold}
				/>
			</IconButton>
			<span
				className="flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-medium tracking-[0.14em]"
				style={{
					borderRadius: 'var(--editor-radius-sm)',
					borderColor: 'var(--editor-tag-border)',
					background: 'var(--editor-tag-bg)',
					color: 'var(--editor-tag-fg)'
				}}
				title={nav.tooltip}
			>
				{icon}
				{nav.label}
			</span>
			<IconButton
				onClick={nav.onNext}
				title={`Next (${nav.tooltip})`}
				className={hudIconBtn}
			>
				<ChevronRight
					size={ICON_SIZE.md}
					strokeWidth={ICON_STROKE.bold}
				/>
			</IconButton>
		</div>
	);
}

export default function MediaDockImageStrip({
	imageNav,
	spectrumNav,
	looksNav,
	imgBadge,
	hudIconBtn,
	edgeInsetStyle
}: {
	imageNav: ImageNavProps;
	spectrumNav?: SubsystemCarouselNav;
	looksNav?: SubsystemCarouselNav;
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
				{spectrumNav ? (
					<CarouselPicker
						nav={spectrumNav}
						icon={
							<AudioWaveform
								size={ICON_SIZE.xs}
								strokeWidth={ICON_STROKE.bold}
							/>
						}
						hudIconBtn={hudIconBtn}
					/>
				) : null}
				{looksNav ? (
					<CarouselPicker
						nav={looksNav}
						icon={
							<Wand2
								size={ICON_SIZE.xs}
								strokeWidth={ICON_STROKE.bold}
							/>
						}
						hudIconBtn={hudIconBtn}
					/>
				) : null}
			</div>
		</div>
	);
}
