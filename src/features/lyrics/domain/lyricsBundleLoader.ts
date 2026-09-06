import { parseLyrixaLyricsBundleEnvelope } from './lyrixaBundle';
import type { LyrixaLyricsBundleEnvelope } from './lyrixaBundleTypes';

/**
 * Getting a Lyrixa bundle in, without the UI knowing where it came from.
 *
 * Today a bundle arrives as a file the user picks. Tomorrow it arrives over a
 * desktop IPC channel from Lyrixa running in the same suite, or from a local
 * service, or dropped onto the window. Those differ only in how the bytes are
 * fetched — everything after `JSON.parse` is identical — so the difference is
 * confined to this module and the rest of the app takes a
 * `LyricsBundleLoadResult`.
 *
 * The reason this is not "just `await file.text()` in the import handler" is
 * that the handler currently lives inside a React component, which means the
 * component owns the transport. Add a second transport and the component grows
 * a second branch; add IPC and a React component now knows about IPC. Here, a
 * new transport is a new function that returns the same result shape.
 *
 * No network calls happen at import time and nothing here touches the store.
 */

export type LyricsBundleSourceKind = 'file' | 'text' | 'url' | 'ipc';

/** Where a bundle came from — for messages and provenance, never for logic. */
export interface LyricsBundleOrigin {
	kind: LyricsBundleSourceKind;
	/** File name, host, or channel name. Safe to show to a user. */
	label: string;
}

export interface LyricsBundleLoadResult {
	bundle: LyrixaLyricsBundleEnvelope;
	origin: LyricsBundleOrigin;
}

export type LyricsBundleLoadFailure =
	/** The bytes could not be obtained (unreadable file, failed request). */
	| 'read'
	/** The bytes are not JSON. */
	| 'parse'
	/** Valid JSON, but not a Lyrixa lyrics bundle this build accepts. */
	| 'invalid';

export class LyricsBundleLoadError extends Error {
	readonly reason: LyricsBundleLoadFailure;
	readonly origin: LyricsBundleOrigin;

	constructor(
		reason: LyricsBundleLoadFailure,
		origin: LyricsBundleOrigin,
		message: string,
		options?: { cause?: unknown }
	) {
		super(message, options);
		this.name = 'LyricsBundleLoadError';
		this.reason = reason;
		this.origin = origin;
	}
}

/**
 * The only thing this module needs from a `File`.
 *
 * Structural rather than `File` so a caller can hand over anything that yields
 * text — a drag-and-drop item, a test fixture, a future IPC payload — without
 * fabricating a DOM object.
 */
export interface LyricsBundleTextSource {
	name: string;
	text(): Promise<string>;
}

/** Parse text that is already in hand. The shared tail of every transport. */
export function loadLyricsBundleFromText(
	text: string,
	origin: LyricsBundleOrigin
): LyricsBundleLoadResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text) as unknown;
	} catch (error) {
		throw new LyricsBundleLoadError(
			'parse',
			origin,
			'That file is not valid JSON.',
			{ cause: error }
		);
	}
	try {
		return { bundle: parseLyrixaLyricsBundleEnvelope(raw), origin };
	} catch (error) {
		throw new LyricsBundleLoadError(
			'invalid',
			origin,
			error instanceof Error
				? error.message
				: 'Invalid Lyrixa lyrics bundle.',
			{ cause: error }
		);
	}
}

/** Read a picked or dropped file. */
export async function loadLyricsBundleFromFile(
	file: LyricsBundleTextSource
): Promise<LyricsBundleLoadResult> {
	const origin: LyricsBundleOrigin = { kind: 'file', label: file.name };
	let text: string;
	try {
		text = await file.text();
	} catch (error) {
		throw new LyricsBundleLoadError(
			'read',
			origin,
			'That file could not be read.',
			{ cause: error }
		);
	}
	return loadLyricsBundleFromText(text, origin);
}

/**
 * Fetch a bundle over HTTP — a local Lyrixa service, or a shared URL.
 *
 * `fetchImpl` is injectable so this stays testable without a network and so a
 * desktop shell can pass its own client. It is not wired to any UI yet.
 */
export async function loadLyricsBundleFromUrl(
	url: string,
	options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {}
): Promise<LyricsBundleLoadResult> {
	const origin: LyricsBundleOrigin = { kind: 'url', label: url };
	const doFetch = options.fetchImpl ?? globalThis.fetch;
	if (!doFetch) {
		throw new LyricsBundleLoadError(
			'read',
			origin,
			'No fetch implementation is available in this environment.'
		);
	}
	let text: string;
	try {
		const response = await doFetch(url, { signal: options.signal });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		text = await response.text();
	} catch (error) {
		throw new LyricsBundleLoadError(
			'read',
			origin,
			`Could not fetch a lyrics bundle from ${url}.`,
			{ cause: error }
		);
	}
	return loadLyricsBundleFromText(text, origin);
}

/**
 * A transport that can hand over a bundle on request.
 *
 * This is the seam the desktop suite plugs into: the shell registers a provider
 * backed by its IPC channel at startup, and the lyrics UI offers it beside
 * "import a file" without containing a line of IPC code. Nothing registers a
 * provider today — the registry exists so that adding one is not a UI change.
 */
export interface LyricsBundleProvider {
	readonly id: string;
	readonly kind: LyricsBundleSourceKind;
	/** Shown on the button that invokes it. */
	readonly label: string;
	/** Resolves `null` when the user cancelled; rejects on failure. */
	request(): Promise<LyricsBundleLoadResult | null>;
}

const providers = new Map<string, LyricsBundleProvider>();

/** Register a transport. Returns the function that unregisters it. */
export function registerLyricsBundleProvider(
	provider: LyricsBundleProvider
): () => void {
	providers.set(provider.id, provider);
	return () => {
		if (providers.get(provider.id) === provider)
			providers.delete(provider.id);
	};
}

export function listLyricsBundleProviders(): LyricsBundleProvider[] {
	return [...providers.values()];
}

export function getLyricsBundleProvider(
	id: string
): LyricsBundleProvider | undefined {
	return providers.get(id);
}
