import type { ReactNode } from 'react';
import SectionCard from './SectionCard';
import ToggleSwitch from './ToggleSwitch';

type EditorTabHeaderProps = {
	/** Tab name (same concept as the nav label). */
	title: ReactNode;
	subtitle?: ReactNode;
	/**
	 * Master enable switch. Provide `onToggle` to show it; omit for tabs that
	 * have no single master switch (e.g. Looks, Audio). The switch is the ONLY
	 * sanctioned location for a tab's master enable.
	 */
	enabled?: boolean;
	onToggle?: (next: boolean) => void;
	switchAriaLabel?: string;
	/**
	 * Inline header controls (color-source shortcut, primary mode selector).
	 * Rendered in the header card body, below the title row.
	 */
	children?: ReactNode;
};

/**
 * Canonical tab header: title + master switch (right) + optional inline
 * controls. Always the first region of an `EditorTabLayout`.
 */
export default function EditorTabHeader({
	title,
	subtitle,
	enabled = false,
	onToggle,
	switchAriaLabel,
	children
}: EditorTabHeaderProps) {
	return (
		<SectionCard
			title={title}
			subtitle={subtitle}
			density="compact"
			padded={children != null}
			action={
				onToggle ? (
					<ToggleSwitch
						checked={enabled}
						onChange={onToggle}
						size="sm"
						ariaLabel={
							switchAriaLabel ??
							(typeof title === 'string' ? title : undefined)
						}
					/>
				) : undefined
			}
		>
			{children}
		</SectionCard>
	);
}
