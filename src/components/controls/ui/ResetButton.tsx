import { Button } from '@/ui';

interface Props {
	label: string;
	onClick: () => void;
}

export default function ResetButton({ label, onClick }: Props) {
	return (
		<Button
			onClick={onClick}
			className="self-end transition-transform hover:-translate-y-0.5"
			size="sm"
			density="compact"
			variant="secondary"
			title="Reset this tab to defaults"
		>
			{label}
		</Button>
	);
}
