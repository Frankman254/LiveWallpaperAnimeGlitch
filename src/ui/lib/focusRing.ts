/**
 * Shared keyboard-focus ring. Applied to every interactive base component so
 * keyboard users get a consistent, accent-colored focus indicator — the editor
 * had none before, which is both an a11y gap and reads unfinished. `focus-visible`
 * means it only shows for keyboard/AT focus, never on mouse click, so the dense
 * mouse-driven UI is visually unchanged.
 */
export const FOCUS_RING =
	'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lwag-accent,#67e8f9)] focus-visible:ring-offset-0';
