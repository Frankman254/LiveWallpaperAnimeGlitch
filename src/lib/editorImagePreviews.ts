import type {
	BackgroundImageItem,
	EditorImagePreviewQuality
} from '@/types/wallpaper';

type PreviewImageLike = Pick<BackgroundImageItem, 'url' | 'thumbnailUrl'>;

/**
 * Resolve which URL to use for an editor preview thumbnail.
 *
 * `quality` controls the default tier used for grid/list thumbnails. Pass
 * `forceOriginal: true` for the **active / currently-playing** image — it must
 * always render at full quality regardless of the grid setting, since that
 * preview is the closest a user gets to seeing what the wallpaper looks like.
 */
export function resolveEditorImagePreviewUrl(
	image: PreviewImageLike | null | undefined,
	quality: EditorImagePreviewQuality,
	forceOriginal = false
): string {
	if (!image) return '';
	if (forceOriginal || quality === 'original') {
		return image.url ?? image.thumbnailUrl ?? '';
	}
	return image.thumbnailUrl ?? image.url ?? '';
}
