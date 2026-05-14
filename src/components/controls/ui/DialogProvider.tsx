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
import { Button, UI_COLORS } from '@/ui';

type ConfirmDialogOptions = {
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
	const confirmVariant =
		dialog?.tone === 'danger'
			? 'destructive'
			: dialog?.tone === 'warning'
				? 'warning'
				: 'primary';

	useEffect(() => {
		if (!dialog) return undefined;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeDialog(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [closeDialog, dialog]);

	return (
		<DialogContext.Provider value={value}>
			{children}
			{dialog ? (
				<div
					className="fixed inset-0 z-[180] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
					onClick={() => closeDialog(false)}
				>
					<div
						className="w-full max-w-md rounded-2xl border p-4 shadow-2xl"
						style={{
							background: UI_COLORS.panel,
							borderColor: UI_COLORS.border,
							color: UI_COLORS.fg
						}}
						onClick={event => event.stopPropagation()}
					>
						<div className="flex flex-col gap-2">
							<h3
								className="text-sm font-semibold"
								style={{ color: UI_COLORS.fg }}
							>
								{dialog.title}
							</h3>
							<p
								className="text-xs leading-relaxed"
								style={{ color: UI_COLORS.fgMute }}
							>
								{dialog.message}
							</p>
						</div>
						<div className="mt-4 flex flex-wrap justify-end gap-2">
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
