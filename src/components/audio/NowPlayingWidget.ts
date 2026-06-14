import type { WallpaperState } from '@/types/wallpaper';
import { buildTrackFont } from '@/components/audio/trackFonts';

/** Resolved now-playing payload handed to the renderer each frame. */
export type NowPlayingData = {
	artist: string;
	title: string;
	coverImage: HTMLImageElement | null;
};

/** Settings the cohesive widget reads. Typography/colors/backdrop are reused
 *  from the existing track-title fields so there is no duplicate control set;
 *  the artist line reuses the "time" color as its secondary tone. */
export type NowPlayingWidgetSettings = Pick<
	WallpaperState,
	| 'nowPlayingCoverEnabled'
	| 'nowPlayingArtistEnabled'
	| 'nowPlayingProgressEnabled'
	| 'nowPlayingScale'
	| 'nowPlayingAccentColor'
	| 'audioTrackTitleUppercase'
	| 'audioTrackTitleFontStyle'
	| 'audioTrackTitleFontSize'
	| 'audioTrackTitleTextColor'
	| 'audioTrackTitleGlowColor'
	| 'audioTrackTitleGlowBlur'
	| 'audioTrackTitleOpacity'
	| 'audioTrackTitlePositionX'
	| 'audioTrackTitlePositionY'
	| 'audioTrackTitleWidth'
	| 'audioTrackTitleBackdropEnabled'
	| 'audioTrackTitleBackdropColor'
	| 'audioTrackTitleBackdropOpacity'
	| 'audioTrackTitleBackdropPadding'
	| 'audioTrackTimeTextColor'
>;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function formatClock(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainder = seconds % 60;
	if (hours > 0) {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
	}
	return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function roundedRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
): void {
	const radius = clamp(r, 0, Math.min(w, h) / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}

function ellipsize(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number
): string {
	if (maxWidth <= 0) return '';
	if (ctx.measureText(text).width <= maxWidth) return text;
	const ellipsis = '…';
	let lo = 0;
	let hi = text.length;
	while (lo < hi) {
		const mid = Math.ceil((lo + hi) / 2);
		const candidate = text.slice(0, mid).trimEnd() + ellipsis;
		if (ctx.measureText(candidate).width <= maxWidth) lo = mid;
		else hi = mid - 1;
	}
	return lo > 0 ? text.slice(0, lo).trimEnd() + ellipsis : ellipsis;
}

/**
 * Draws the cohesive Now Playing card: optional cover, artist + title lines,
 * and a progress bar with elapsed/total time — all inside one glass backdrop,
 * positioned and scaled as a single unit.
 */
export function drawNowPlayingWidget(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	nowPlaying: NowPlayingData,
	currentTime: number,
	duration: number,
	_dt: number,
	settings: NowPlayingWidgetSettings
): void {
	const title = (
		settings.audioTrackTitleUppercase
			? nowPlaying.title.toUpperCase()
			: nowPlaying.title
	).trim();
	if (!title) return;

	const opacity = clamp(settings.audioTrackTitleOpacity, 0, 1);
	if (opacity <= 0.001) return;

	const scale = clamp(settings.nowPlayingScale, 0.5, 2.5);
	const titleFontSize = clamp(settings.audioTrackTitleFontSize, 12, 160) * scale;
	const artistFontSize = titleFontSize * 0.55;
	const timeFontSize = titleFontSize * 0.5;

	const showArtist =
		settings.nowPlayingArtistEnabled && nowPlaying.artist.trim().length > 0;
	const artist = settings.audioTrackTitleUppercase
		? nowPlaying.artist.trim().toUpperCase()
		: nowPlaying.artist.trim();
	const hasDuration = Number.isFinite(duration) && duration > 0;
	const showProgress = settings.nowPlayingProgressEnabled && hasDuration;
	const showCover =
		settings.nowPlayingCoverEnabled && nowPlaying.coverImage !== null;

	const pad = clamp(settings.audioTrackTitleBackdropPadding, 8, 48) * scale + 6;
	const titleFont = buildTrackFont(
		settings.audioTrackTitleFontStyle,
		titleFontSize
	);
	const artistFont = buildTrackFont(
		settings.audioTrackTitleFontStyle,
		artistFontSize,
		600
	);
	const timeFont = buildTrackFont('mono', timeFontSize, 600);

	// Text block height (artist + title + progress row), with gaps.
	const lineGap = titleFontSize * 0.28;
	const artistH = showArtist ? artistFontSize * 1.15 : 0;
	const titleH = titleFontSize * 1.15;
	const progressH = showProgress ? timeFontSize * 1.5 : 0;
	const textBlockH =
		artistH +
		titleH +
		progressH +
		(showArtist ? lineGap : 0) +
		(showProgress ? lineGap : 0);

	const coverSize = showCover ? textBlockH : 0;
	const coverGap = showCover ? pad * 0.7 : 0;

	// Width: cap to the configured fraction of the canvas; size the text column
	// to the wider of the measured lines within that budget.
	const cardMaxWidth = canvas.width * clamp(settings.audioTrackTitleWidth, 0.2, 1);
	const maxTextWidth = Math.max(
		40,
		cardMaxWidth - pad * 2 - coverSize - coverGap
	);
	ctx.font = titleFont;
	const titleMeasured = ctx.measureText(title).width;
	ctx.font = artistFont;
	const artistMeasured = showArtist ? ctx.measureText(artist).width : 0;
	const minTextWidth = showProgress ? timeFontSize * 9 : 0;
	const textWidth = clamp(
		Math.max(titleMeasured, artistMeasured, minTextWidth),
		Math.min(maxTextWidth, timeFontSize * 6),
		maxTextWidth
	);

	const cardWidth = pad * 2 + coverSize + coverGap + textWidth;
	const cardHeight = textBlockH + pad * 2;

	const centerX =
		canvas.width / 2 +
		settings.audioTrackTitlePositionX * canvas.width * 0.5;
	const centerY =
		canvas.height / 2 -
		settings.audioTrackTitlePositionY * canvas.height * 0.5;
	const cardLeft = Math.round(centerX - cardWidth / 2);
	const cardTop = Math.round(centerY - cardHeight / 2);
	const cardRadius = Math.max(12, titleFontSize * 0.4);

	ctx.save();
	ctx.globalAlpha *= opacity;

	// Glass card: drop shadow → fill → top highlight → hairline border.
	if (settings.audioTrackTitleBackdropEnabled) {
		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
		ctx.shadowBlur = 30 * scale;
		ctx.shadowOffsetY = 10 * scale;
		ctx.fillStyle = settings.audioTrackTitleBackdropColor;
		ctx.globalAlpha *= clamp(settings.audioTrackTitleBackdropOpacity, 0, 1);
		roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cardRadius);
		ctx.fill();
		ctx.restore();

		const highlight = ctx.createLinearGradient(
			0,
			cardTop,
			0,
			cardTop + cardHeight
		);
		highlight.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
		highlight.addColorStop(0.4, 'rgba(255, 255, 255, 0.02)');
		highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
		ctx.save();
		ctx.fillStyle = highlight;
		roundedRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cardRadius);
		ctx.fill();
		ctx.restore();

		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
		roundedRectPath(
			ctx,
			cardLeft + 0.5,
			cardTop + 0.5,
			cardWidth - 1,
			cardHeight - 1,
			cardRadius
		);
		ctx.stroke();
		ctx.restore();
	}

	const contentLeft = cardLeft + pad;
	const contentTop = cardTop + pad;

	// Cover art, cover-fit into a rounded square.
	if (showCover && nowPlaying.coverImage) {
		const img = nowPlaying.coverImage;
		ctx.save();
		roundedRectPath(
			ctx,
			contentLeft,
			contentTop,
			coverSize,
			coverSize,
			Math.max(8, coverSize * 0.12)
		);
		ctx.clip();
		const iw = img.naturalWidth || 1;
		const ih = img.naturalHeight || 1;
		const ratio = Math.max(coverSize / iw, coverSize / ih);
		const dw = iw * ratio;
		const dh = ih * ratio;
		ctx.drawImage(
			img,
			contentLeft + (coverSize - dw) / 2,
			contentTop + (coverSize - dh) / 2,
			dw,
			dh
		);
		ctx.restore();
		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
		roundedRectPath(
			ctx,
			contentLeft + 0.5,
			contentTop + 0.5,
			coverSize - 1,
			coverSize - 1,
			Math.max(8, coverSize * 0.12)
		);
		ctx.stroke();
		ctx.restore();
	}

	const textLeft = contentLeft + coverSize + coverGap;
	let cursorY = contentTop;
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';

	if (showArtist) {
		ctx.save();
		ctx.font = artistFont;
		ctx.fillStyle = settings.audioTrackTimeTextColor;
		ctx.globalAlpha *= 0.85;
		ctx.fillText(ellipsize(ctx, artist, textWidth), textLeft, cursorY);
		ctx.restore();
		cursorY += artistH + lineGap;
	}

	// Title with glow.
	ctx.save();
	ctx.font = titleFont;
	ctx.fillStyle = settings.audioTrackTitleTextColor;
	if (settings.audioTrackTitleGlowBlur > 0.01) {
		ctx.shadowColor = settings.audioTrackTitleGlowColor;
		ctx.shadowBlur = settings.audioTrackTitleGlowBlur * scale;
	}
	ctx.fillText(ellipsize(ctx, title, textWidth), textLeft, cursorY);
	ctx.restore();
	cursorY += titleH;

	// Progress bar + elapsed/total time.
	if (showProgress) {
		cursorY += lineGap;
		const barH = Math.max(3, timeFontSize * 0.32);
		const barY = cursorY + (progressH - barH) / 2 - timeFontSize * 0.1;
		const fraction = clamp(currentTime / duration, 0, 1);
		const timeText = `${formatClock(currentTime)} / ${formatClock(duration)}`;
		ctx.save();
		ctx.font = timeFont;
		const timeWidth = ctx.measureText(timeText).width;
		const barWidth = Math.max(0, textWidth - timeWidth - timeFontSize * 0.8);

		// Track.
		ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
		roundedRectPath(ctx, textLeft, barY, barWidth, barH, barH / 2);
		ctx.fill();
		// Fill.
		if (fraction > 0 && barWidth > 0) {
			ctx.fillStyle = settings.nowPlayingAccentColor;
			roundedRectPath(
				ctx,
				textLeft,
				barY,
				Math.max(barH, barWidth * fraction),
				barH,
				barH / 2
			);
			ctx.fill();
		}
		// Time text, right-aligned in the column.
		ctx.fillStyle = settings.audioTrackTimeTextColor;
		ctx.globalAlpha *= 0.9;
		ctx.textAlign = 'right';
		ctx.textBaseline = 'middle';
		ctx.fillText(timeText, textLeft + textWidth, barY + barH / 2);
		ctx.restore();
	}

	ctx.restore();
}
