import {
	shouldRunMediaTrackCommand,
	type MediaTrackDirection
} from './mediaTrackKeys';

/**
 * Shared runtime for track previous/next commands.
 *
 * Module-scoped so every source (HUD buttons, Media Session action handlers,
 * and the keyboard fallback) funnels through ONE place: this gives a single
 * behavior, a shared dedupe window (so one physical media-key press can't fire
 * twice), and DEV diagnostics for the output overlay — without threading state
 * through React.
 */

export type MediaTrackCommandSource =
	| 'hud'
	| 'mediaSession'
	| `keyboard:${string}`;

type Diagnostics = {
	lastTrackCommandSource: string | null;
	lastResolvedCommand: string | null;
	lastSuppressedByDedupe: boolean | null;
	lastMediaSessionAction: string | null;
	lastKeyboardEventKey: string | null;
	lastKeyboardEventCode: string | null;
	lastKeyboardEventTime: number | null;
	lastKeyboardModifiers: string | null;
};

const diagnostics: Diagnostics = {
	lastTrackCommandSource: null,
	lastResolvedCommand: null,
	lastSuppressedByDedupe: null,
	lastMediaSessionAction: null,
	lastKeyboardEventKey: null,
	lastKeyboardEventCode: null,
	lastKeyboardEventTime: null,
	lastKeyboardModifiers: null
};

/** Record a candidate media keydown — even if it resolves to nothing — so the
 * overlay can prove whether the OS delivers the key to the page at all. */
export function recordMediaKeyboardEvent(event: {
	key: string;
	code?: string;
	altKey?: boolean;
	metaKey?: boolean;
	shiftKey?: boolean;
	ctrlKey?: boolean;
}): void {
	diagnostics.lastKeyboardEventKey = event.key;
	diagnostics.lastKeyboardEventCode = event.code ?? null;
	diagnostics.lastKeyboardEventTime = now();
	const mods = [
		event.altKey ? 'alt' : null,
		event.metaKey ? 'meta' : null,
		event.shiftKey ? 'shift' : null,
		event.ctrlKey ? 'ctrl' : null
	].filter(Boolean);
	diagnostics.lastKeyboardModifiers = mods.length ? mods.join('+') : 'none';
	notify();
}

let lastCommand: { direction: MediaTrackDirection; atMs: number } | null = null;
let version = 0;
const listeners = new Set<() => void>();

function now(): number {
	return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function notify(): void {
	version += 1;
	for (const listener of listeners) listener();
}

/**
 * Run a previous/next command from a given source. Dedupes identical directions
 * within the shared window, records diagnostics, and invokes `run` (the same
 * `playPrevTrack` / `playNextTrack` the HUD uses). Returns whether it ran.
 */
export function runMediaTrackCommand(args: {
	direction: MediaTrackDirection;
	source: MediaTrackCommandSource;
	run: () => void;
}): boolean {
	const nowMs = now();

	// Diagnostics record the attempt regardless of dedupe outcome.
	if (args.source === 'mediaSession') {
		diagnostics.lastMediaSessionAction = `${args.direction}track`;
	}

	if (!shouldRunMediaTrackCommand(args.direction, nowMs, lastCommand)) {
		diagnostics.lastSuppressedByDedupe = true;
		notify();
		return false;
	}

	lastCommand = { direction: args.direction, atMs: nowMs };
	diagnostics.lastTrackCommandSource = args.source;
	diagnostics.lastResolvedCommand = args.direction;
	diagnostics.lastSuppressedByDedupe = false;
	notify();
	args.run();
	return true;
}

export function getMediaTrackDiagnostics(): Readonly<Diagnostics> {
	return diagnostics;
}

/** Monotonic version for useSyncExternalStore snapshots (diagnostics mutate in place). */
export function getMediaTrackDiagnosticsVersion(): number {
	return version;
}

export function subscribeMediaTrackDiagnostics(
	listener: () => void
): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** Test-only: reset the shared dedupe + diagnostics state. */
export function resetMediaTrackRuntime(): void {
	lastCommand = null;
	diagnostics.lastTrackCommandSource = null;
	diagnostics.lastResolvedCommand = null;
	diagnostics.lastSuppressedByDedupe = null;
	diagnostics.lastMediaSessionAction = null;
	diagnostics.lastKeyboardEventKey = null;
	diagnostics.lastKeyboardEventCode = null;
	diagnostics.lastKeyboardEventTime = null;
	diagnostics.lastKeyboardModifiers = null;
}
