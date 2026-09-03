import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import ColorInput from './ColorInput';

/**
 * Color input wired to the global `colorFavorites` palette so every consumer
 * (spectrum, logo, particles, bg, lyrics, …) shares the same favourites strip
 * automatically. Use this over `ColorInput` for any in-editor picker — the
 * base component stays generic for unit tests / isolated use.
 */
export default function ConnectedColorInput(props: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	const { favorites, add, remove } = useWallpaperStore(
		useShallow(s => ({
			favorites: s.colorFavorites,
			add: s.addColorFavorite,
			remove: s.removeColorFavorite
		}))
	);
	return (
		<ColorInput
			{...props}
			favorites={favorites}
			onAddFavorite={add}
			onRemoveFavorite={remove}
		/>
	);
}
