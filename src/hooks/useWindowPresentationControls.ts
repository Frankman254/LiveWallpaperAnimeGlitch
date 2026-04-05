import { useCallback, useEffect, useState } from 'react';

type ExternalWindowMode =
	| 'closed'
	| 'mini-document-pip'
	| 'mini-popup'
	| 'studio-popup';

type ExternalWindowKind = 'mini' | 'studio';

type DocumentPictureInPictureApi = {
	window?: Window | null;
	requestWindow: (options?: {
		width?: number;
		height?: number;
	}) => Promise<Window>;
};

const WINDOW_MODE_EVENT = 'wallpaper-window-mode-change';
const MINI_PLAYER_WINDOW_NAME = 'live-wallpaper-mini-player';
const STUDIO_WINDOW_NAME = 'live-wallpaper-studio';

let presentationWindowRef: Window | null = null;
let presentationModeRef: ExternalWindowMode = 'closed';

function emitWindowModeChange() {
	if (typeof window === 'undefined') return;
	window.dispatchEvent(new Event(WINDOW_MODE_EVENT));
}

function getDocumentPictureInPictureApi(): DocumentPictureInPictureApi | null {
	if (typeof window === 'undefined') return null;
	return (
		(
			window as Window & {
				documentPictureInPicture?: DocumentPictureInPictureApi;
			}
		).documentPictureInPicture ?? null
	);
}

function getPreviewUrl(kind: ExternalWindowKind): string {
	const base = window.location.href.replace(/#.*$/, '');
	return `${base}#/preview?windowMode=${kind}`;
}

function isMiniMode(mode: ExternalWindowMode): boolean {
	return mode === 'mini-document-pip' || mode === 'mini-popup';
}

function isStudyMode(mode: ExternalWindowMode): boolean {
	return mode === 'studio-popup';
}

function resolvePresentationMode(): ExternalWindowMode {
	if (presentationWindowRef && !presentationWindowRef.closed) {
		return presentationModeRef;
	}
	presentationWindowRef = null;
	presentationModeRef = 'closed';
	return 'closed';
}

function readFullscreenState(): boolean {
	if (typeof document === 'undefined') return false;
	if (document.fullscreenElement) return true;
	if (presentationWindowRef && !presentationWindowRef.closed) {
		try {
			return Boolean(presentationWindowRef.document.fullscreenElement);
		} catch {
			return false;
		}
	}
	return false;
}

function attachPresentationWindowLifecycle(
	nextWindow: Window,
	mode: Exclude<ExternalWindowMode, 'closed'>
) {
	presentationWindowRef = nextWindow;
	presentationModeRef = mode;

	const clearRef = () => {
		if (presentationWindowRef === nextWindow) {
			presentationWindowRef = null;
			presentationModeRef = 'closed';
			emitWindowModeChange();
		}
	};

	nextWindow.addEventListener('pagehide', clearRef, { once: true });
	nextWindow.addEventListener('beforeunload', clearRef, { once: true });
	try {
		nextWindow.document.addEventListener('fullscreenchange', () => {
			emitWindowModeChange();
		});
	} catch {
		// Ignore cross-window fullscreen listener failures.
	}
	emitWindowModeChange();
}

function closePresentationWindow() {
	if (!presentationWindowRef || presentationWindowRef.closed) {
		presentationWindowRef = null;
		presentationModeRef = 'closed';
		emitWindowModeChange();
		return;
	}

	presentationWindowRef.close();
	presentationWindowRef = null;
	presentationModeRef = 'closed';
	emitWindowModeChange();
}

async function openDocumentMiniPlayer(): Promise<void> {
	const api = getDocumentPictureInPictureApi();
	if (!api) {
		throw new Error('document-picture-in-picture-unavailable');
	}

	if (isMiniMode(resolvePresentationMode()) && presentationWindowRef) {
		presentationWindowRef.focus();
		presentationModeRef = 'mini-document-pip';
		emitWindowModeChange();
		return;
	}

	if (resolvePresentationMode() !== 'closed') {
		closePresentationWindow();
	}

	const pipWindow = await api.requestWindow({
		width: 520,
		height: 320
	});

	const doc = pipWindow.document;
	doc.title = 'Live Wallpaper Mini Player';
	doc.body.style.margin = '0';
	doc.body.style.width = '100vw';
	doc.body.style.height = '100vh';
	doc.body.style.background = '#000';
	doc.body.style.overflow = 'hidden';

	const iframe = doc.createElement('iframe');
	iframe.src = getPreviewUrl('mini');
	iframe.title = 'Live Wallpaper Mini Player';
	iframe.allow = 'fullscreen';
	iframe.style.width = '100%';
	iframe.style.height = '100%';
	iframe.style.border = '0';
	iframe.style.display = 'block';

	doc.body.replaceChildren(iframe);
	attachPresentationWindowLifecycle(pipWindow, 'mini-document-pip');
}

function openPopupWindow({
	url,
	name,
	width,
	height
}: {
	url: string;
	name: string;
	width: number;
	height: number;
}): Window {
	const popup = window.open(
		url,
		name,
		[
			'popup=yes',
			`width=${width}`,
			`height=${height}`,
			'resizable=yes',
			'scrollbars=no',
			'toolbar=no',
			'location=no',
			'status=no',
			'menubar=no'
		].join(',')
	);

	if (!popup) {
		throw new Error('popup-blocked');
	}
	try {
		popup.focus();
	} catch {
		// Ignore focus failures.
	}

	return popup;
}

function openPopupMiniPlayer(): void {
	if (isMiniMode(resolvePresentationMode()) && presentationWindowRef) {
		presentationWindowRef.focus();
		presentationModeRef = 'mini-popup';
		emitWindowModeChange();
		return;
	}

	if (resolvePresentationMode() !== 'closed') {
		closePresentationWindow();
	}

	const popup = openPopupWindow({
		url: getPreviewUrl('mini'),
		name: MINI_PLAYER_WINDOW_NAME,
		width: 520,
		height: 320
	});

	attachPresentationWindowLifecycle(popup, 'mini-popup');
}

function openStudyPopup(): void {
	if (isStudyMode(resolvePresentationMode()) && presentationWindowRef) {
		presentationWindowRef.focus();
		presentationModeRef = 'studio-popup';
		emitWindowModeChange();
		return;
	}

	if (resolvePresentationMode() !== 'closed') {
		closePresentationWindow();
	}

	const popup = openPopupWindow({
		url: getPreviewUrl('studio'),
		name: STUDIO_WINDOW_NAME,
		width: Math.max(1200, Math.round(window.screen.availWidth * 0.72)),
		height: Math.max(720, Math.round(window.screen.availHeight * 0.72))
	});

	attachPresentationWindowLifecycle(popup, 'studio-popup');
}

async function maximizePresentationWindow(): Promise<boolean> {
	if (!presentationWindowRef || presentationWindowRef.closed) {
		return false;
	}

	try {
		presentationWindowRef.focus();
	} catch {
		// ignore focus failures
	}

	if (presentationModeRef === 'mini-popup' || presentationModeRef === 'studio-popup') {
		try {
			await presentationWindowRef.document.documentElement.requestFullscreen?.();
			return true;
		} catch {
			// fall through to resize fallback
		}

		try {
			presentationWindowRef.moveTo?.(0, 0);
		} catch {
			// ignore move failures
		}

		try {
			presentationWindowRef.resizeTo?.(
				window.screen.availWidth,
				window.screen.availHeight
			);
			return true;
		} catch {
			return false;
		}
	}

	return false;
}

export function useWindowPresentationControls() {
	const [isFullscreen, setIsFullscreen] = useState(() =>
		readFullscreenState()
	);
	const [presentationMode, setPresentationMode] =
		useState<ExternalWindowMode>(() => resolvePresentationMode());

	useEffect(() => {
		function handleFullscreenChange() {
			setIsFullscreen(readFullscreenState());
		}

		function handleWindowModeChange() {
			setPresentationMode(resolvePresentationMode());
			setIsFullscreen(readFullscreenState());
		}

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		window.addEventListener(WINDOW_MODE_EVENT, handleWindowModeChange);

		const timer = window.setInterval(() => {
			if (
				presentationModeRef !== 'closed' &&
				(!presentationWindowRef || presentationWindowRef.closed)
			) {
				presentationWindowRef = null;
				presentationModeRef = 'closed';
				handleWindowModeChange();
				return;
			}
			handleFullscreenChange();
		}, 700);

		return () => {
			document.removeEventListener(
				'fullscreenchange',
				handleFullscreenChange
			);
			window.removeEventListener(
				WINDOW_MODE_EVENT,
				handleWindowModeChange
			);
			window.clearInterval(timer);
		};
	}, []);

	const fullscreenSupported =
		typeof document !== 'undefined' &&
		Boolean(document.documentElement?.requestFullscreen);
	const documentMiniPlayerSupported =
		typeof window !== 'undefined' &&
		window.isSecureContext &&
		Boolean(getDocumentPictureInPictureApi());
	const popupWindowSupported =
		typeof window !== 'undefined' && typeof window.open === 'function';

	const toggleFullscreen = useCallback(async () => {
		const targetDocument =
			isStudyMode(resolvePresentationMode()) &&
			presentationWindowRef &&
			!presentationWindowRef.closed
				? presentationWindowRef.document
				: document;

		if (!targetDocument.documentElement?.requestFullscreen) return;
		if (targetDocument.fullscreenElement) {
			await targetDocument.exitFullscreen?.();
			emitWindowModeChange();
			return;
		}
		await targetDocument.documentElement.requestFullscreen();
		emitWindowModeChange();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'F11') return;
			if (!isStudyMode(resolvePresentationMode())) return;
			event.preventDefault();
			void toggleFullscreen();
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [toggleFullscreen]);

	const closeMiniPlayer = useCallback(() => {
		if (isMiniMode(resolvePresentationMode())) {
			closePresentationWindow();
		}
	}, []);

	const closeStudyMode = useCallback(() => {
		if (isStudyMode(resolvePresentationMode())) {
			closePresentationWindow();
		}
	}, []);

	const openMiniPlayer = useCallback(async () => {
		if (documentMiniPlayerSupported) {
			try {
				await openDocumentMiniPlayer();
				return;
			} catch (error) {
				if (!popupWindowSupported) {
					throw error;
				}
			}
		}

		if (popupWindowSupported) {
			openPopupMiniPlayer();
			return;
		}

		throw new Error('mini-player-unavailable');
	}, [documentMiniPlayerSupported, popupWindowSupported]);

	const openStudyMode = useCallback(async () => {
		if (!popupWindowSupported) {
			throw new Error('study-mode-unavailable');
		}
		openStudyPopup();
	}, [popupWindowSupported]);

	const toggleMiniPlayer = useCallback(async () => {
		if (isMiniMode(resolvePresentationMode())) {
			closePresentationWindow();
			return;
		}

		await openMiniPlayer();
	}, [openMiniPlayer]);

	const toggleStudyMode = useCallback(async () => {
		if (isStudyMode(resolvePresentationMode())) {
			closePresentationWindow();
			return;
		}

		await openStudyMode();
	}, [openStudyMode]);

	const expandMiniPlayer = useCallback(async () => {
		if (isMiniMode(resolvePresentationMode())) {
			await maximizePresentationWindow();
		}
	}, []);

	const expandStudyMode = useCallback(async () => {
		if (isStudyMode(resolvePresentationMode())) {
			await maximizePresentationWindow();
		}
	}, []);

	return {
		isFullscreen,
		fullscreenSupported,
		presentationMode,
		miniPlayerMode: isMiniMode(presentationMode) ? presentationMode : 'closed',
		isMiniPlayerOpen: isMiniMode(presentationMode),
		isStudyModeOpen: isStudyMode(presentationMode),
		miniPlayerSupport: documentMiniPlayerSupported
			? 'document-pip'
			: popupWindowSupported
				? 'popup'
				: 'none',
		studyModeSupport: popupWindowSupported ? 'popup' : 'none',
		toggleFullscreen,
		toggleMiniPlayer,
		openMiniPlayer,
		closeMiniPlayer,
		toggleStudyMode,
		openStudyMode,
		closeStudyMode,
		expandMiniPlayer,
		expandStudyMode,
		canExpandMiniPlayer: presentationMode === 'mini-popup',
		canExpandStudyMode: presentationMode === 'studio-popup'
	} as const;
}
