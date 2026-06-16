import { useEffect, useRef, useState } from 'react';
import { Star, X } from 'lucide-react';
import FieldLabel from './FieldLabel';

type ColorInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	/**
	 * Optional favourites palette. When provided, a swatch strip renders
	 * below the picker; clicking a swatch applies it, the star button pins
	 * the current colour, and ✕ on hover removes that favourite.
	 */
	favorites?: string[];
	onAddFavorite?: (hex: string) => void;
	onRemoveFavorite?: (hex: string) => void;
};

/**
 * Color picker — native swatch + hex text + optional favourites strip.
 *
 * Performance: the native `<input type="color">` previously fired `onInput`
 * on every cursor move inside the OS picker dialog, which committed each
 * intermediate hue straight to the global store and re-rendered the entire
 * app per frame. Now we keep a local `pendingValue` for visual feedback
 * while the dialog is open and only forward the FINAL value via `change`
 * (which fires once when the dialog closes). The hex text input commits on
 * blur or Enter for the same reason.
 */
export default function ColorInput({
	label,
	value,
	onChange,
	favorites,
	onAddFavorite,
	onRemoveFavorite
}: ColorInputProps) {
	const [pendingValue, setPendingValue] = useState(value);
	const [hexDraft, setHexDraft] = useState(value);
	// Sync external value changes (e.g. preset load) into local fields without
	// fighting an in-progress edit.
	useEffect(() => {
		setPendingValue(value);
		setHexDraft(value);
	}, [value]);

	const normalizedFavorites = useRef(favorites ?? []);
	normalizedFavorites.current = favorites ?? [];

	function commitHex(raw: string) {
		const trimmed = raw.trim().replace(/^#/, '');
		const valid =
			/^[0-9a-fA-F]{6}$/.test(trimmed) ||
			/^[0-9a-fA-F]{3}$/.test(trimmed);
		if (!valid) {
			// Reset draft to the last committed value so the user sees the
			// rejection instead of an inconsistent state.
			setHexDraft(value);
			return;
		}
		const normalized =
			trimmed.length === 3
				? `#${trimmed[0]}${trimmed[0]}${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}`
				: `#${trimmed}`;
		const lower = normalized.toLowerCase();
		setHexDraft(lower);
		setPendingValue(lower);
		if (lower !== value) onChange(lower);
	}

	const showFavorites =
		favorites !== undefined &&
		(favorites.length > 0 ||
			onAddFavorite !== undefined ||
			onRemoveFavorite !== undefined);

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between gap-2">
				<FieldLabel>{label}</FieldLabel>
				<div className="flex items-center gap-1">
					<input
						type="color"
						value={pendingValue}
						// Visual-only preview while the dialog is open. No
						// store commits here.
						onInput={event =>
							setPendingValue(
								(event.target as HTMLInputElement).value
							)
						}
						// Fires when the OS picker is dismissed → commit.
						onChange={event => {
							const next = event.target.value.toLowerCase();
							setPendingValue(next);
							setHexDraft(next);
							if (next !== value) onChange(next);
						}}
						className="h-6 w-8 cursor-pointer border-0 bg-transparent"
						style={{ borderRadius: 'var(--editor-radius-sm)' }}
						aria-label={`${label} colour picker`}
					/>
					<input
						type="text"
						value={hexDraft}
						maxLength={7}
						spellCheck={false}
						onChange={event => setHexDraft(event.target.value)}
						onBlur={event => commitHex(event.target.value)}
						onKeyDown={event => {
							if (event.key === 'Enter') {
								commitHex(
									(event.target as HTMLInputElement).value
								);
								(event.target as HTMLInputElement).blur();
							} else if (event.key === 'Escape') {
								setHexDraft(value);
								(event.target as HTMLInputElement).blur();
							}
						}}
						className="h-6 w-[72px] border bg-transparent px-1.5 text-[10px] uppercase tracking-widest outline-none"
						style={{
							borderRadius: 'var(--editor-radius-sm)',
							borderColor: 'var(--editor-tag-border)',
							color: 'var(--editor-accent-soft)',
							fontFamily:
								'"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'
						}}
						aria-label={`${label} hex value`}
						title="Paste or type a #RRGGBB hex value, Enter to commit"
					/>
					{onAddFavorite ? (
						<button
							type="button"
							onClick={() => onAddFavorite(value)}
							className="grid h-6 w-6 place-items-center border transition disabled:opacity-40"
							style={{
								borderRadius: 'var(--editor-radius-sm)',
								borderColor: 'var(--editor-tag-border)',
								background: 'transparent',
								color: 'var(--editor-accent-muted)'
							}}
							disabled={(favorites ?? []).includes(
								value.toLowerCase()
							)}
							title={
								(favorites ?? []).includes(value.toLowerCase())
									? 'Already in favourites'
									: 'Pin this colour to global favourites'
							}
						>
							<Star size={11} />
						</button>
					) : null}
				</div>
			</div>
			{showFavorites ? (
				<FavouritesStrip
					favorites={favorites ?? []}
					currentValue={value}
					onPick={hex => {
						if (hex === value) return;
						setPendingValue(hex);
						setHexDraft(hex);
						onChange(hex);
					}}
					onRemove={onRemoveFavorite}
				/>
			) : null}
		</div>
	);
}

function FavouritesStrip({
	favorites,
	currentValue,
	onPick,
	onRemove
}: {
	favorites: string[];
	currentValue: string;
	onPick: (hex: string) => void;
	onRemove?: (hex: string) => void;
}) {
	if (favorites.length === 0) {
		return (
			<p
				className="text-[9px] uppercase tracking-widest"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				No favourites yet — tap ★ to pin
			</p>
		);
	}
	return (
		<div
			className="flex flex-wrap items-center gap-1 rounded border p-1"
			style={{
				borderColor: 'var(--editor-tag-border)',
				background:
					'color-mix(in srgb, var(--editor-tag-bg) 60%, transparent)'
			}}
		>
			{favorites.map(hex => {
				const isActive =
					hex.toLowerCase() === currentValue.toLowerCase();
				return (
					<div key={hex} className="relative">
						<button
							type="button"
							onClick={() => onPick(hex)}
							className="h-5 w-5 border transition hover:scale-110"
							style={{
								borderRadius: 'var(--editor-radius-sm)',
								borderColor: isActive
									? 'var(--editor-accent-color)'
									: 'rgba(255,255,255,0.16)',
								boxShadow: isActive
									? '0 0 0 2px color-mix(in srgb, var(--editor-accent-color) 35%, transparent)'
									: 'none',
								background: hex
							}}
							title={hex.toUpperCase()}
							aria-label={`Apply favourite ${hex}`}
						/>
						{onRemove ? (
							<button
								type="button"
								onClick={event => {
									event.stopPropagation();
									onRemove(hex);
								}}
								className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full border opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100"
								style={{
									background: 'rgba(0,0,0,0.7)',
									borderColor: 'rgba(255,255,255,0.4)',
									color: 'rgba(252,165,165,0.95)'
								}}
								title={`Remove ${hex}`}
								aria-label={`Remove favourite ${hex}`}
							>
								<X size={7} strokeWidth={3} />
							</button>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
