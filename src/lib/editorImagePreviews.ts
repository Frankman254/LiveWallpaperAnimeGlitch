import type {
	BackgroundImageItem,
	EditorImagePreviewQuality
} from '@/types/wallpaper';

type PreviewImageLike = Pick<
	BackgroundImageItem,
	'url' | 'thumbnailUrl'
>;

export function resolveEditorImagePreviewUrl(
	image: PreviewImageLike | null | undefined,
	quality: EditorImagePreviewQuality
): string {
	if (!image) return '';
	if (quality === 'original') return image.url ?? image.thumbnailUrl ?? '';
	return image.thumbnailUrl ?? image.url ?? '';
}
