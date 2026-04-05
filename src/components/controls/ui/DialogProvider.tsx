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
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

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
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
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
	const toneClasses =
		dialog?.tone === 'danger'
			? 'border-red-500/35 bg-red-500/10 text-red-100'
			: dialog?.tone === 'warning'
				? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
				: theme.actionButton;

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
						className={`w-full max-w-md rounded-2xl border p-4 shadow-2xl ${theme.panelShell}`}
						onClick={event => event.stopPropagation()}
					>
						<div className="flex flex-col gap-2">
							<h3
								className={`text-sm font-semibold ${theme.panelTitle}`}
							>
								{dialog.title}
							</h3>
							<p
								className={`text-xs leading-relaxed ${theme.panelSubtle}`}
							>
								{dialog.message}
							</p>
						</div>
						<div className="mt-4 flex flex-wrap justify-end gap-2">
							<button
								type="button"
								onClick={() => closeDialog(false)}
								className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${theme.actionButton}`}
							>
								{dialog.cancelLabel ?? 'Cancel'}
							</button>
							<button
								type="button"
								onClick={() => closeDialog(true)}
								className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${toneClasses}`}
							>
								{dialog.confirmLabel ?? 'Confirm'}
							</button>
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
