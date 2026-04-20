import type { ReactNode } from 'react';
import QuickActionButton, {
	type QuickActionButtonProps
} from '@/components/wallpaper/quickActions/QuickActionButton';

type QuickActionsHeaderProps = {
	statusLabel: string;
	trackLabel: string;
	secondaryContent?: ReactNode;
	actions: QuickActionButtonProps[];
	isRainbow: boolean;
	compact?: boolean;
};

type QuickActionsActionGridProps = {
	actions: QuickActionButtonProps[];
	isRainbow: boolean;
};

type QuickActionsSlotItem = {
	key: string;
	orderLabel: string;
	name: string;
	active?: boolean;
	onClick: () => void;
};

type QuickActionsSlotsPanelProps = {
	slots: QuickActionsSlotItem[];
	isRainbow: boolean;
};

type QuickActionsThemePanelProps = {
	themeActions: QuickActionButtonProps[];
	colorSourceActions: QuickActionButtonProps[];
	isRainbow: boolean;
};

type QuickActionsPlaybackControlsProps = {
	leftActions: QuickActionButtonProps[];
	rightAction: QuickActionButtonProps;
	isRainbow: boolean;
};

function QuickActionsActionGrid({
	actions,
	isRainbow
}: QuickActionsActionGridProps) {
	return (
		<div className="flex flex-wrap items-center gap-1">
			{actions.map((action, index) => (
				<QuickActionButton
					key={`${action.label}-${index}`}
					{...action}
					small={action.small ?? true}
					isRainbow={isRainbow}
				/>
			))}
		</div>
	);
}

export function QuickActionsHeader({
	statusLabel,
	trackLabel,
	secondaryContent,
	actions,
	isRainbow,
	compact = false
}: QuickActionsHeaderProps) {
	// In file mode the track label is the filename — the "FILE" tag just
	// repeats information. Suppress it there. Keep it for LIVE/MICROPHONE/etc.
	// where the tag adds capture-mode context.
	const showStatusTag = statusLabel !== 'FILE';
	if (compact) {
		return (
			<div className="flex flex-wrap items-center gap-1.5">
				{showStatusTag ? (
					<span
						className={`shrink-0 inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.26em] ${
							isRainbow
								? 'editor-rgb-theme-active border-transparent'
								: ''
						}`}
						style={{
							borderRadius: 'var(--editor-radius-sm)',
							borderColor: !isRainbow
								? 'var(--editor-tag-border)'
								: undefined,
							background: !isRainbow
								? 'var(--editor-tag-bg)'
								: undefined,
							color: isRainbow
								? '#08080e'
								: 'var(--editor-tag-fg)'
						}}
					>
						{statusLabel}
					</span>
				) : null}
				{actions.map((action, index) => (
					<QuickActionButton
						key={`${action.label}-${index}`}
						{...action}
						isRainbow={isRainbow}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-3">
			<div className="flex min-w-0 flex-1 items-center gap-2.5">
				{showStatusTag ? (
					<span
						className={`shrink-0 inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.26em] ${
							isRainbow
								? 'editor-rgb-theme-active border-transparent'
								: ''
						}`}
						style={{
							borderRadius: 'var(--editor-radius-sm)',
							borderColor: !isRainbow
								? 'var(--editor-tag-border)'
								: undefined,
							background: !isRainbow
								? 'var(--editor-tag-bg)'
								: undefined,
							color: isRainbow
								? '#08080e'
								: 'var(--editor-tag-fg)'
						}}
					>
						{statusLabel}
					</span>
				) : null}
				<div className="min-w-0 flex-1">
					<div
						className="truncate text-[12.5px] font-semibold leading-tight"
						style={{ color: 'var(--editor-accent-soft)' }}
						title={trackLabel}
					>
						{trackLabel}
					</div>
					{secondaryContent}
				</div>
			</div>

			<div className="flex shrink-0 items-center gap-1">
				{actions.map((action, index) => (
					<QuickActionButton
						key={`${action.label}-${index}`}
						{...action}
						isRainbow={isRainbow}
					/>
				))}
			</div>
		</div>
	);
}

export function QuickActionsLayersPanel(props: QuickActionsActionGridProps) {
	return <QuickActionsActionGrid {...props} />;
}

export function QuickActionsShortcutsPanel(props: QuickActionsActionGridProps) {
	return <QuickActionsActionGrid {...props} />;
}

export function QuickActionsSlotsPanel({
	slots,
	isRainbow
}: QuickActionsSlotsPanelProps) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{slots.map(slot => (
				<button
					key={slot.key}
					type="button"
					onClick={slot.onClick}
					className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition-all duration-150 hover:-translate-y-0.5 ${
						isRainbow
							? 'editor-rgb-theme-active border-transparent'
							: ''
					}`}
					style={{
						borderRadius: 'var(--editor-radius-md)',
						borderColor: !isRainbow
							? slot.active
								? 'var(--editor-accent-color)'
								: 'var(--editor-accent-border)'
							: undefined,
						background: !isRainbow
							? slot.active
								? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-active-bg) 74%, transparent), color-mix(in srgb, var(--editor-shell-bg) 84%, transparent))'
								: 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 72%, transparent), color-mix(in srgb, var(--editor-shell-bg) 82%, transparent))'
							: undefined,
						color: isRainbow
							? '#08080e'
							: slot.active
								? 'var(--editor-active-fg)'
								: 'var(--editor-accent-soft)',
						boxShadow: slot.active && !isRainbow
							? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent), 0 8px 20px color-mix(in srgb, var(--editor-accent-color) 20%, transparent)'
							: 'none'
					}}
					title={`Load: ${slot.name}`}
				>
					<span
						style={{
							color: isRainbow
								? '#08080e'
								: slot.active
									? 'var(--editor-active-fg)'
									: 'var(--editor-accent-muted)'
						}}
					>
						{slot.orderLabel}
					</span>
					<span className="max-w-[140px] truncate">{slot.name}</span>
					<span
						className="text-[9px] font-bold uppercase tracking-wider"
						style={{
							color: isRainbow
								? '#08080e'
								: slot.active
									? 'var(--editor-active-fg)'
									: 'var(--editor-accent-color)'
						}}
					>
						{slot.active ? 'ACTIVE' : 'LOAD'}
					</span>
				</button>
			))}
		</div>
	);
}

export function QuickActionsThemePanel({
	themeActions,
	colorSourceActions,
	isRainbow
}: QuickActionsThemePanelProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<QuickActionsActionGrid
				actions={themeActions}
				isRainbow={isRainbow}
			/>
			<QuickActionsActionGrid
				actions={colorSourceActions}
				isRainbow={isRainbow}
			/>
		</div>
	);
}

export function QuickActionsPlaybackControls({
	leftActions,
	rightAction,
	isRainbow
}: QuickActionsPlaybackControlsProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-1.5">
				{leftActions.map((action, index) => (
					<QuickActionButton
						key={`${action.label}-${index}`}
						{...action}
						isRainbow={isRainbow}
					/>
				))}
			</div>
			<QuickActionButton {...rightAction} isRainbow={isRainbow} />
		</div>
	);
}
