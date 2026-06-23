import type { ReactNode } from 'react';

type EditorTabLayoutProps = {
	/** Title + master switch + inline header controls. Use `EditorTabHeader`. */
	header?: ReactNode;
	/** Saved profiles / preset slots. Rendered directly under the header. */
	savedProfiles?: ReactNode;
	/** Reset / recovery actions. Use `EditorTabFooter`. Rendered last. */
	footer?: ReactNode;
	/** The tab body: control sections in semantic order. */
	children: ReactNode;
};

/**
 * Canonical editor-tab scaffold — the SINGLE source of macro layout order for
 * every editor tab. The fixed top-to-bottom anatomy is:
 *
 *   1. header        — tab title + master switch (the ONLY place for it)
 *   2. savedProfiles — preset slots, always directly under the header
 *   3. children      — body sections (source → appearance → audio → advanced)
 *   4. footer        — reset / recovery, always last
 *
 * Tabs render their regions into the named slots; the order is guaranteed here,
 * so it can't drift per-tab and a new tab is ordered by construction. Master
 * switches must live in `header`, preset slots in `savedProfiles`, and
 * reset/recovery in `footer` — never loose in the body.
 */
export default function EditorTabLayout({
	header,
	savedProfiles,
	footer,
	children
}: EditorTabLayoutProps) {
	return (
		<div className="flex min-w-0 flex-col gap-2">
			{header}
			{savedProfiles}
			{children}
			{footer}
		</div>
	);
}
