import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button, BLUR, GLOW, RADIUS, UI_COLORS, ICON_SIZE } from '@/ui';

export type ConfirmDialogOptions = {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	tone?: 'default' | 'warning' | 'danger';
};

type DialogContextValue = {
	confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const TITLE_ID = 'lwag-confirm-dialog-title';
const MESSAGE_ID = 'lwag-confirm-dialog-message';

export function DialogProvider({ children }: { children: ReactNode }) {
	const resolverRef = useRef<((value: boolean) => void) | null>(null);
	const [dialog, setDialog] = useState<ConfirmDialogOptions | null>(null);

	const closeDialog = useCallback((result: boolean) => {
		const resolver = resolverRef.current;
		resolverRef.current = null;
		setDialog(null);
		resolver?.(result);
	}, []);

	const confirm = useCallback(
		(options: ConfirmDialogOptions) =>
			new Promise<boolean>(resolve => {
				resolverRef.current = resolve;
				setDialog(options);
			}),
		[]
	);

	useEffect(
		() => () => {
			if (resolverRef.current) {
				resolverRef.current(false);
				resolverRef.current = null;
			}
		},
		[]
	);

	const value = useMemo<DialogContextValue>(() => ({ confirm }), [confirm]);
	const tone = dialog?.tone ?? 'default';
	const confirmVariant =
		tone === 'danger'
			? 'destructive'
			: tone === 'warning'
				? 'warning'
				: 'primary';
	const Icon = tone === 'danger' ? Trash2 : AlertTriangle;
	const iconColor =
		tone === 'danger'
			? UI_COLORS.danger
			: tone === 'warning'
				? UI_COLORS.warn
				: UI_COLORS.accent;
	const iconBackground =
		tone === 'danger'
			? UI_COLORS.dangerSoft
			: tone === 'warning'
				? UI_COLORS.warnSoft
				: UI_COLORS.accentSoft;

	useEffect(() => {
		if (!dialog) return undefined;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeDialog(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = previousOverflow;
		};
	}, [closeDialog, dialog]);

	return (
		<DialogContext.Provider value={value}>
			{children}
			{dialog ? (
				<div
					className="fixed inset-0 z-[180] flex items-center justify-center p-4"
					style={{
						background: UI_COLORS.overlayHi,
						backdropFilter: BLUR.heavy,
						WebkitBackdropFilter: BLUR.heavy
					}}
					onClick={() => closeDialog(false)}
				>
					<div
						role="alertdialog"
						aria-modal="true"
						aria-labelledby={TITLE_ID}
						aria-describedby={MESSAGE_ID}
						className="w-full max-w-[min(24rem,calc(100vw-2rem))] border"
						style={{
							background: UI_COLORS.shell,
							borderColor: UI_COLORS.borderStrong,
							borderRadius: RADIUS.lg,
							boxShadow: GLOW.modal,
							color: UI_COLORS.fg
						}}
						onClick={event => event.stopPropagation()}
					>
						<div className="flex flex-col gap-3 p-4">
							<div className="flex items-start gap-3">
								<div
									className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--editor-radius-md)] border"
									style={{
										background: iconBackground,
										borderColor: UI_COLORS.border,
										color: iconColor
									}}
								>
									<Icon size={ICON_SIZE.md} aria-hidden />
								</div>
								<div className="min-w-0 flex-1 pt-0.5">
									<h3
										id={TITLE_ID}
										className="text-[13px] font-semibold leading-snug"
										style={{ color: UI_COLORS.fg }}
									>
										{dialog.title}
									</h3>
									<p
										id={MESSAGE_ID}
										className="mt-1.5 text-[12px] leading-relaxed"
										style={{ color: UI_COLORS.fgMute }}
									>
										{dialog.message}
									</p>
								</div>
							</div>
							<div
								className="flex flex-wrap justify-end gap-2 border-t pt-3"
								style={{ borderColor: UI_COLORS.hairline }}
							>
								<Button
									type="button"
									onClick={() => closeDialog(false)}
									size="sm"
									density="compact"
									variant="secondary"
								>
									{dialog.cancelLabel ?? 'Cancel'}
								</Button>
								<Button
									type="button"
									autoFocus
									onClick={() => closeDialog(true)}
									size="sm"
									density="compact"
									variant={confirmVariant}
								>
									{dialog.confirmLabel ?? 'Confirm'}
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</DialogContext.Provider>
	);
}

export function useDialog() {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('useDialog must be used inside DialogProvider');
	}
	return context;
}
