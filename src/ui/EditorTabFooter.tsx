import type { ReactNode } from 'react';
import SectionCard from './SectionCard';

type EditorTabFooterProps = {
	/** Optional section title (e.g. "Recovery & reset"). */
	title?: ReactNode;
	/** Reset / recovery buttons (use `confirmCritical` for destructive ones). */
	children: ReactNode;
};

/**
 * Canonical tab footer: the reset / recovery zone. Always the LAST region of an
 * `EditorTabLayout`, so destructive actions live in one predictable place,
 * never scattered in the header or body.
 */
export default function EditorTabFooter({
	title,
	children
}: EditorTabFooterProps) {
	return (
		<SectionCard title={title} density="compact">
			<div className="flex flex-wrap gap-1.5">{children}</div>
		</SectionCard>
	);
}
