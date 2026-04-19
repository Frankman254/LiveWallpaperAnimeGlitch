import type { CSSProperties, ReactNode, RefObject } from 'react';

type QuickActionsShellProps = {
	containerStyle: CSSProperties;
	isOpen: boolean;
	panelRef: RefObject<HTMLDivElement | null>;
	panelStyle: CSSProperties;
	panelFrameClassName: string;
	panelFrameStyle: CSSProperties;
	panelContentClassName: string;
	panelContentStyle?: CSSProperties;
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
	panelFrameClassName,
	panelFrameStyle,
	panelContentClassName,
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
						className="relative"
						style={{ isolation: 'isolate' }}
					>
						<div
							aria-hidden
							className={`pointer-events-none absolute inset-0 overflow-hidden ${panelFrameClassName}`}
							style={panelFrameStyle}
						/>
						<div
							className={`relative z-10 ${panelContentClassName}`}
							style={panelContentStyle}
						>
							{panelChildren}
						</div>
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
