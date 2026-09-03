/**
 * A `CollapsibleSection` with the editor's label/spacing conventions applied.
 *
 * Named distinctly on purpose: this used to be a second component called
 * `CollapsibleSection`, wrapping the one in `@/ui`, with both re-exported from
 * barrels — so `import { CollapsibleSection }` resolved to different components
 * depending on which barrel you reached for.
 */
import type { ReactNode } from 'react';
import UICollapsibleSection from './CollapsibleSection';

interface Props {
	label: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export default function LabeledSection({
	label,
	defaultOpen = true,
	children
}: Props) {
	return (
		<UICollapsibleSection title={label} defaultOpen={defaultOpen} dense>
			<div className="flex min-w-0 flex-col gap-2.5">{children}</div>
		</UICollapsibleSection>
	);
}
