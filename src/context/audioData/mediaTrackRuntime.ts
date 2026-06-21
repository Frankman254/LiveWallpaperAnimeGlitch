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
	lastPlaybackCommand: string | null;
	lastMediaSessionAction: string | null;
	lastKeyboardMediaKey: string | null;
};

const diagnostics: Diagnostics = {
	lastPlaybackCommand: null,
	lastMediaSessionAction: null,
	lastKeyboardMediaKey: null
};

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
	keyLabel?: string;
}): boolean {
	const nowMs = now();

	// Diagnostics record the attempt regardless of dedupe outcome.
	if (args.source === 'mediaSession') {
		diagnostics.lastMediaSessionAction = `${args.direction}track`;
	} else if (args.source.startsWith('keyboard:')) {
		diagnostics.lastKeyboardMediaKey =
			args.keyLabel ?? args.source.slice('keyboard:'.length);
	}

	if (!shouldRunMediaTrackCommand(args.direction, nowMs, lastCommand)) {
		notify();
		return false;
	}

	lastCommand = { direction: args.direction, atMs: nowMs };
	diagnostics.lastPlaybackCommand = `${args.direction} (${args.source})`;
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
	diagnostics.lastPlaybackCommand = null;
	diagnostics.lastMediaSessionAction = null;
	diagnostics.lastKeyboardMediaKey = null;
}
