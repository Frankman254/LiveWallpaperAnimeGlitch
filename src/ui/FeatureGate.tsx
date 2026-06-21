import type { ReactNode } from 'react';
import Caption from './Caption';

type FeatureGateProps = {
	/** Master switch state for the feature this body belongs to. */
	enabled: boolean;
	/**
	 * One-line hint shown in place of the body when the feature is off. Omit to
	 * render nothing at all when disabled.
	 */
	hint?: string;
	children: ReactNode;
};

/**
 * Canonical "switch off ⇒ hide body" wrapper.
 *
 * Strict editor pattern: a feature's master switch lives in the section header
 * (always visible); the configurable body renders ONLY while enabled. When off,
 * the user sees just the switch + a one-line hint, never stale controls.
 *
 * Render the header (title + ToggleSwitch) yourself, then wrap the body — or a
 * group of sibling cards — in a single FeatureGate keyed to the same enable
 * flag. See `SpectrumTab` for the group-of-cards usage.
 */
export default function FeatureGate({
	enabled,
	hint,
	children
}: FeatureGateProps) {
	if (enabled) return <>{children}</>;
	if (!hint) return null;
	return <Caption as="p">{hint}</Caption>;
}
