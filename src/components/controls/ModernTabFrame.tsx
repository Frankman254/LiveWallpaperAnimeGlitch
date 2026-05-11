import type { ReactNode } from 'react';
import Card from './ui/Card';

type ModernTabFrameProps = {
	title: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
};

export default function ModernTabFrame({
	title,
	subtitle,
	action,
	children
}: ModernTabFrameProps) {
	return (
		<Card title={title} subtitle={subtitle} action={action}>
			<div className="flex flex-col gap-3">{children}</div>
		</Card>
	);
}
