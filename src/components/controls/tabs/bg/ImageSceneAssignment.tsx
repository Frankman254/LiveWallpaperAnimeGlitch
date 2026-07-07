import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { resolveEffectiveSceneSlotId } from '@/features/scenes/sceneSlot';
import { Button, Caption, Select } from '@/ui';
import type { WallpaperState } from '@/types/wallpaper';

/** Sentinel for the Select option that clears the image's explicit scene so it
 *  rides the global default. Real scene ids never collide with this. */
const USE_DEFAULT = '__default__';

const OVERRIDE_KEYS = [
	'spectrumOverride',
	'spectrumSecondOverride',
	'logoOverride',
	'particlesOverride',
	'rainOverride',
	'looksOverride'
] as const;

/**
 * Scene-first per-image control: assign a Scene to the active image (or let it
 * ride the default scene), and promote a scene to the global default. Scenes are
 * the source of truth for an image's look; the legacy per-image overrides below
 * this block are only a back-compat fallback. Reads the store directly so the
 * parent's prop contract stays unchanged.
 */
export default function ImageSceneAssignment() {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			sceneSlots: s.sceneSlots,
			defaultSceneSlotId: s.defaultSceneSlotId,
			activeImageId: s.activeImageId,
			backgroundImages: s.backgroundImages,
			assignSceneToImage: s.assignSceneToImage,
			setImageUseDefaultScene: s.setImageUseDefaultScene,
			setDefaultSceneSlot: s.setDefaultSceneSlot
		}))
	);

	const image = store.backgroundImages.find(
		img => img.assetId === store.activeImageId
	);
	if (!image) return null;

	const { sceneSlotId: effectiveId, usedDefault } =
		resolveEffectiveSceneSlotId(image, store as unknown as WallpaperState);
	const effectiveScene = store.sceneSlots.find(s => s.id === effectiveId);
	const explicitValid = store.sceneSlots.some(
		s => s.id === image.sceneSlotId
	);
	const hasLegacyOverrides = OVERRIDE_KEYS.some(key => image[key] != null);

	const options = [
		{ value: USE_DEFAULT, label: t.scene_use_default },
		...store.sceneSlots.map(scene => ({
			value: scene.id,
			label:
				scene.id === store.defaultSceneSlotId
					? `${scene.name} · ${t.scene_is_default_badge}`
					: scene.name
		}))
	];

	const indicator = effectiveScene
		? usedDefault
			? `${t.scene_uses_default_label}: ${effectiveScene.name}`
			: `${t.scene_uses_label}: ${effectiveScene.name}`
		: t.scene_uses_none_label;

	const isEffectiveDefault =
		effectiveScene != null &&
		effectiveScene.id === store.defaultSceneSlotId;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="text-[12px] font-semibold">
				{t.scene_for_image_title}
			</div>
			<Caption as="p">{t.scene_for_image_hint}</Caption>
			<Select<string>
				value={
					explicitValid ? (image.sceneSlotId as string) : USE_DEFAULT
				}
				onChange={next => {
					if (next === USE_DEFAULT) {
						store.setImageUseDefaultScene(image.assetId);
					} else {
						store.assignSceneToImage(image.assetId, next);
					}
				}}
				options={options}
				size="sm"
				density="compact"
				full
				ariaLabel={t.scene_for_image_title}
			/>
			<div className="flex items-center justify-between gap-2">
				<Caption as="p">{indicator}</Caption>
				<Button
					type="button"
					size="sm"
					density="compact"
					variant="secondary"
					disabled={!effectiveScene || isEffectiveDefault}
					onClick={() =>
						effectiveScene &&
						store.setDefaultSceneSlot(effectiveScene.id)
					}
				>
					{t.scene_set_as_default}
				</Button>
			</div>
			{hasLegacyOverrides ? (
				<Caption as="p">{t.scene_legacy_overrides_detected}</Caption>
			) : null}
		</div>
	);
}
