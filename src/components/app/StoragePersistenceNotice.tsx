import { useSyncExternalStore } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
	clearPersistenceFailure,
	getPersistenceFailureSnapshot,
	subscribePersistenceFailure
} from '@/store/persistenceStatus';
import { BLUR, FONT, GLOW, UI_COLORS, Z_INDEX } from '@/ui';

export default function StoragePersistenceNotice() {
	const t = useT();
	const failure = useSyncExternalStore(
		subscribePersistenceFailure,
		getPersistenceFailureSnapshot,
		getPersistenceFailureSnapshot
	);
	if (!failure) return null;

	const detail =
		failure.kind === 'quota'
			? t.storage_persistence_quota_detail
			: t.storage_persistence_unavailable_detail;

	return (
		<div
			role="alert"
			aria-live="assertive"
			style={{
				position: 'fixed',
				left: '50%',
				bottom: 24,
				transform: 'translateX(-50%)',
				zIndex: Z_INDEX.toast,
				display: 'flex',
				alignItems: 'flex-start',
				gap: 12,
				width: 'min(560px, calc(100vw - 32px))',
				padding: '14px 16px',
				border: `1px solid ${UI_COLORS.dangerBorder}`,
				borderRadius: 'var(--editor-radius-lg, 16px)',
				background: UI_COLORS.shell,
				backdropFilter: BLUR.heavy,
				WebkitBackdropFilter: BLUR.heavy,
				boxShadow: GLOW.popover,
				color: UI_COLORS.fg,
				fontFamily: FONT.ui
			}}
		>
			<AlertTriangle
				aria-hidden="true"
				size={22}
				style={{
					color: UI_COLORS.danger,
					flex: '0 0 auto',
					marginTop: 1
				}}
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div style={{ fontWeight: 800, fontSize: 14 }}>
					{t.storage_persistence_title}
				</div>
				<div
					style={{
						marginTop: 4,
						fontSize: 12,
						lineHeight: 1.45,
						color: UI_COLORS.fgMute
					}}
				>
					{detail} {t.storage_persistence_export_hint}
				</div>
			</div>
			<button
				type="button"
				aria-label={t.storage_persistence_dismiss}
				onClick={() => clearPersistenceFailure(failure.id)}
				style={{
					display: 'grid',
					placeItems: 'center',
					width: 30,
					height: 30,
					padding: 0,
					border: `1px solid ${UI_COLORS.border}`,
					borderRadius: 9,
					background: UI_COLORS.panel,
					color: UI_COLORS.fg,
					cursor: 'pointer'
				}}
			>
				<X aria-hidden="true" size={16} />
			</button>
		</div>
	);
}
