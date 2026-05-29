/**
 * ⌘K command palette — jump between tabs.
 *
 * Opens on ⌘K / Ctrl+K, filters the action list by name, executes the
 * highlighted action on Enter. Designed as a top-level modal that floats
 * over the ControlPanel so it can switch tabs from anywhere.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type ReactNode
} from 'react';
import { Search, X } from 'lucide-react';
import { UI_COLORS, FONT, ICON_SIZE, Z_INDEX } from '@/ui';
import { IconButton } from '@/ui';
import { transition } from '@/ui/tokens/motion';
import { useT } from '@/lib/i18n';

export type CommandPaletteAction = {
	id: string;
	label: string;
	group: string;
	hint?: string;
	icon?: ReactNode;
	keywords?: string[];
	run: () => void;
};

export type CommandPaletteProps = {
	open: boolean;
	onClose: () => void;
	actions: ReadonlyArray<CommandPaletteAction>;
};

function normalize(s: string): string {
	return s
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');
}

function matches(action: CommandPaletteAction, query: string): boolean {
	if (!query) return true;
	const haystack = normalize(
		[action.label, action.group, ...(action.keywords ?? [])].join(' ')
	);
	const tokens = normalize(query).split(/\s+/).filter(Boolean);
	return tokens.every(token => haystack.includes(token));
}

export default function CommandPalette({
	open,
	onClose,
	actions
}: CommandPaletteProps) {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const listRef = useRef<HTMLDivElement | null>(null);
	const t = useT();

	const filtered = useMemo(
		() => actions.filter(a => matches(a, query)),
		[actions, query]
	);

	useEffect(() => {
		setSelectedIndex(0);
	}, [query, open]);

	useEffect(() => {
		if (open) {
			// Focus input on next tick so the input is in the DOM
			const id = requestAnimationFrame(() => inputRef.current?.focus());
			return () => cancelAnimationFrame(id);
		}
		// Reset state when palette closes
		setQuery('');
		setSelectedIndex(0);
	}, [open]);

	useEffect(() => {
		const item = listRef.current?.querySelector<HTMLElement>(
			`[data-palette-index="${selectedIndex}"]`
		);
		item?.scrollIntoView({ block: 'nearest' });
	}, [selectedIndex]);

	const executeAt = useCallback(
		(index: number) => {
			const action = filtered[index];
			if (!action) return;
			action.run();
			onClose();
		},
		[filtered, onClose]
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setSelectedIndex(idx => Math.min(filtered.length - 1, idx + 1));
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				setSelectedIndex(idx => Math.max(0, idx - 1));
			} else if (event.key === 'Enter') {
				event.preventDefault();
				executeAt(selectedIndex);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
			}
		},
		[filtered.length, executeAt, selectedIndex, onClose]
	);

	const [visible, setVisible] = useState(false);
	useEffect(() => {
		if (open) {
			// Two-frame defer so the initial paint happens with opacity:0 and
			// the transition has something to interpolate from.
			const id = requestAnimationFrame(() => {
				requestAnimationFrame(() => setVisible(true));
			});
			return () => cancelAnimationFrame(id);
		}
		setVisible(false);
	}, [open]);

	if (!open) return null;

	return (
		<div
			role="presentation"
			onClick={onClose}
			className="fixed inset-0 flex items-start justify-center"
			style={{
				zIndex: Z_INDEX.modal ?? 200,
				background: 'rgba(0,0,0,0.45)',
				paddingTop: '15vh',
				backdropFilter: 'blur(6px)',
				WebkitBackdropFilter: 'blur(6px)',
				opacity: visible ? 1 : 0,
				transition: transition('opacity', 'fast')
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Command palette"
				onClick={e => e.stopPropagation()}
				onKeyDown={handleKeyDown}
				className="flex w-[min(92vw,540px)] flex-col overflow-hidden rounded-xl border"
				style={{
					borderColor: UI_COLORS.border,
					background: UI_COLORS.panel,
					boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
					transform: visible ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)',
					transition: `${transition('transform', 'base', 'emphasized')}, ${transition('opacity', 'fast')}`,
					opacity: visible ? 1 : 0
				}}
			>
				<div
					className="flex items-center gap-2 border-b px-3 py-2"
					style={{ borderBottomColor: UI_COLORS.hairline }}
				>
					<Search
						size={ICON_SIZE.sm}
						style={{ color: UI_COLORS.fgMute }}
					/>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder={t.command_palette_placeholder}
						className="flex-1 bg-transparent text-[14px] outline-none"
						style={{
							color: UI_COLORS.fg,
							fontFamily: FONT.ui ?? FONT.mono
						}}
					/>
					<span
						className="hidden rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider sm:inline"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised,
							color: UI_COLORS.fgMute,
							fontFamily: FONT.mono
						}}
					>
						esc
					</span>
					<IconButton
						size="sm"
						density="compact"
						onClick={onClose}
						title={t.label_close}
					>
						<X size={ICON_SIZE.xs} />
					</IconButton>
				</div>
				<div
					ref={listRef}
					className="flex max-h-[60vh] flex-col overflow-y-auto py-1"
				>
					{filtered.length === 0 ? (
						<div
							className="px-4 py-6 text-center text-[12px]"
							style={{ color: UI_COLORS.fgMute }}
						>
							Sin resultados para “{query}”.
						</div>
					) : (
						filtered.map((action, index) => {
							const isSelected = index === selectedIndex;
							return (
								<button
									key={action.id}
									type="button"
									data-palette-index={index}
									onMouseEnter={() => setSelectedIndex(index)}
									onClick={() => executeAt(index)}
									className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
									style={{
										background: isSelected
											? UI_COLORS.accentSoft
											: 'transparent',
										color: isSelected
											? UI_COLORS.fg
											: UI_COLORS.fgMute,
										borderLeft: `2px solid ${
											isSelected
												? UI_COLORS.accent
												: 'transparent'
										}`
									}}
								>
									{action.icon ? (
										<span
											className="shrink-0"
											style={{
												color: isSelected
													? UI_COLORS.accent
													: UI_COLORS.fgMute
											}}
										>
											{action.icon}
										</span>
									) : null}
									<div className="min-w-0 flex-1">
										<div
											className="truncate text-[13px]"
											style={{
												color: isSelected
													? UI_COLORS.fg
													: UI_COLORS.fgMute,
												fontWeight: isSelected ? 600 : 400
											}}
										>
											{action.label}
										</div>
										{action.hint ? (
											<div
												className="truncate text-[10px]"
												style={{
													color: UI_COLORS.fgMute,
													fontFamily: FONT.mono
												}}
											>
												{action.hint}
											</div>
										) : null}
									</div>
									<span
										className="shrink-0 text-[9px] uppercase"
										style={{
											color: UI_COLORS.fgMute,
											fontFamily: FONT.mono,
											letterSpacing: '0.08em'
										}}
									>
										{action.group}
									</span>
								</button>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
