import type { CSSProperties, ReactNode, RefObject } from 'react';

type QuickActionsShellProps = {
	containerStyle: CSSProperties;
	isOpen: boolean;
	panelRef: RefObject<HTMLDivElement | null>;
	panelStyle: CSSProperties;
	panelClassName: string;
	panelContentStyle: CSSProperties;
	launcherRef: RefObject<HTMLButtonElement | null>;
	launcherStyle: CSSProperties;
	launcherClassName: string;
	launcherTitle: string;
	onToggle: () => void;
	panelChildren: ReactNode;
	launcherChildren: ReactNode;
};

export default function QuickActionsShell({
	containerStyle,
	isOpen,
	panelRef,
	panelStyle,
	panelClassName,
	panelContentStyle,
	launcherRef,
	launcherStyle,
	launcherClassName,
	launcherTitle,
	onToggle,
	panelChildren,
	launcherChildren
}: QuickActionsShellProps) {
	return (
		<div
			className="pointer-events-none fixed inset-0 z-[126]"
			style={containerStyle}
		>
			{isOpen && (
				<div
					className="pointer-events-auto absolute"
					ref={panelRef}
					style={panelStyle}
				>
					<div
						className={`min-h-0 flex-1 flex-col overflow-hidden ${panelClassName}`}
						style={panelContentStyle}
					>
						{panelChildren}
					</div>
				</div>
			)}

			<button
				ref={launcherRef}
				type="button"
				onClick={onToggle}
				title={launcherTitle}
				aria-label={launcherTitle}
				className={launcherClassName}
				style={launcherStyle}
			>
				{launcherChildren}
			</button>
		</div>
	);
}
