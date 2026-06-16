/* global React */
/*
 * Design system tokens + primitive components for the LWAG editor.
 * Everything in here is intentionally self-contained — drop into the
 * existing app and replace ad-hoc styling.
 */

const { useState, useRef, useEffect, useCallback, useMemo } = React;

// ---- DESIGN TOKENS ---------------------------------------------------------
window.LWAG_TOKENS = {
	// Surface tiers — layered glass over the wallpaper
	shell: 'rgba(11, 14, 22, 0.86)', // outer editor shell
	panel: 'rgba(20, 25, 36, 0.72)', // tab panels / cards
	raised: 'rgba(34, 41, 56, 0.92)', // controls, inputs
	hover: 'rgba(48, 58, 78, 0.95)',
	hairline: 'rgba(255, 255, 255, 0.06)',
	border: 'rgba(255, 255, 255, 0.10)',
	borderHi: 'rgba(255, 255, 255, 0.18)',
	// Text
	fg: 'rgba(255, 255, 255, 0.96)',
	fgMute: 'rgba(255, 255, 255, 0.62)',
	fgFaint: 'rgba(255, 255, 255, 0.38)',
	// Accent — single source of truth, themeable via CSS var
	accent: 'var(--lwag-accent, #67e8f9)',
	accentBg:
		'color-mix(in srgb, var(--lwag-accent, #67e8f9) 14%, transparent)',
	accentBd:
		'color-mix(in srgb, var(--lwag-accent, #67e8f9) 42%, transparent)',
	// Semantic
	danger: '#ff6b6b',
	warn: '#f7c948',
	ok: '#4ade80',
	// Radii
	r1: '6px',
	r2: '10px',
	r3: '14px',
	r4: '18px',
	// Spacing scale
	s1: 4,
	s2: 8,
	s3: 12,
	s4: 16,
	s5: 24,
	s6: 32,
	// Type
	fontUI: "'Inter', system-ui, sans-serif",
	fontMono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"
};
const T = window.LWAG_TOKENS;

// ---- ICONS (inline, lucide-style) ------------------------------------------
const Icon = ({
	d,
	size = 16,
	stroke = 1.75,
	fill = 'none',
	children,
	...rest
}) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill={fill}
		stroke="currentColor"
		strokeWidth={stroke}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...rest}
	>
		{d ? <path d={d} /> : children}
	</svg>
);

window.Icons = {
	Play: p => (
		<Icon {...p}>
			<polygon
				points="6 4 20 12 6 20 6 4"
				fill="currentColor"
				stroke="none"
			/>
		</Icon>
	),
	Pause: p => (
		<Icon {...p}>
			<rect
				x="6"
				y="4"
				width="4"
				height="16"
				fill="currentColor"
				stroke="none"
			/>
			<rect
				x="14"
				y="4"
				width="4"
				height="16"
				fill="currentColor"
				stroke="none"
			/>
		</Icon>
	),
	Prev: p => (
		<Icon {...p}>
			<polygon
				points="19 4 9 12 19 20 19 4"
				fill="currentColor"
				stroke="none"
			/>
			<rect
				x="5"
				y="4"
				width="2"
				height="16"
				fill="currentColor"
				stroke="none"
			/>
		</Icon>
	),
	Next: p => (
		<Icon {...p}>
			<polygon
				points="5 4 15 12 5 20 5 4"
				fill="currentColor"
				stroke="none"
			/>
			<rect
				x="17"
				y="4"
				width="2"
				height="16"
				fill="currentColor"
				stroke="none"
			/>
		</Icon>
	),
	Repeat: p => (
		<Icon {...p}>
			<polyline points="17 1 21 5 17 9" />
			<path d="M3 11V9a4 4 0 0 1 4-4h14" />
			<polyline points="7 23 3 19 7 15" />
			<path d="M21 13v2a4 4 0 0 1-4 4H3" />
		</Icon>
	),
	Shuffle: p => (
		<Icon {...p}>
			<polyline points="16 3 21 3 21 8" />
			<line x1="4" y1="20" x2="21" y2="3" />
			<polyline points="21 16 21 21 16 21" />
			<line x1="15" y1="15" x2="21" y2="21" />
			<line x1="4" y1="4" x2="9" y2="9" />
		</Icon>
	),
	Snowflake: p => (
		<Icon {...p}>
			<line x1="2" y1="12" x2="22" y2="12" />
			<line x1="12" y1="2" x2="12" y2="22" />
			<path d="M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
		</Icon>
	),
	ChevL: p => (
		<Icon {...p}>
			<polyline points="15 18 9 12 15 6" />
		</Icon>
	),
	ChevR: p => (
		<Icon {...p}>
			<polyline points="9 18 15 12 9 6" />
		</Icon>
	),
	ChevD: p => (
		<Icon {...p}>
			<polyline points="6 9 12 15 18 9" />
		</Icon>
	),
	ChevU: p => (
		<Icon {...p}>
			<polyline points="18 15 12 9 6 15" />
		</Icon>
	),
	Images: p => (
		<Icon {...p}>
			<rect x="3" y="3" width="14" height="14" rx="2" />
			<path d="M21 7v14H7" />
		</Icon>
	),
	Music: p => (
		<Icon {...p}>
			<path d="M9 18V5l12-2v13" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="16" r="3" />
		</Icon>
	),
	Eye: p => (
		<Icon {...p}>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</Icon>
	),
	EyeOff: p => (
		<Icon {...p}>
			<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.06M9.9 4.24A11 11 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-3.17 4.49M1 1l22 22" />
			<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
		</Icon>
	),
	Lock: p => (
		<Icon {...p}>
			<rect x="4" y="11" width="16" height="10" rx="2" />
			<path d="M8 11V7a4 4 0 1 1 8 0v4" />
		</Icon>
	),
	Plus: p => (
		<Icon {...p}>
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</Icon>
	),
	Minus: p => (
		<Icon {...p}>
			<line x1="5" y1="12" x2="19" y2="12" />
		</Icon>
	),
	Dots: p => (
		<Icon {...p}>
			<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
			<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
			<circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
		</Icon>
	),
	Sliders: p => (
		<Icon {...p}>
			<line x1="4" y1="21" x2="4" y2="14" />
			<line x1="4" y1="10" x2="4" y2="3" />
			<line x1="12" y1="21" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12" y2="3" />
			<line x1="20" y1="21" x2="20" y2="16" />
			<line x1="20" y1="12" x2="20" y2="3" />
			<line x1="1" y1="14" x2="7" y2="14" />
			<line x1="9" y1="8" x2="15" y2="8" />
			<line x1="17" y1="16" x2="23" y2="16" />
		</Icon>
	),
	Wand: p => (
		<Icon {...p}>
			<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
		</Icon>
	),
	Layers: p => (
		<Icon {...p}>
			<polygon points="12 2 2 7 12 12 22 7 12 2" />
			<polyline points="2 17 12 22 22 17" />
			<polyline points="2 12 12 17 22 12" />
		</Icon>
	),
	Activity: p => (
		<Icon {...p}>
			<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
		</Icon>
	),
	Settings: p => (
		<Icon {...p}>
			<circle cx="12" cy="12" r="3" />
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
		</Icon>
	),
	Drop: p => (
		<Icon {...p}>
			<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
		</Icon>
	),
	Mic: p => (
		<Icon {...p}>
			<rect x="9" y="2" width="6" height="13" rx="3" />
			<path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" />
		</Icon>
	),
	Monitor: p => (
		<Icon {...p}>
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<line x1="8" y1="21" x2="16" y2="21" />
			<line x1="12" y1="17" x2="12" y2="21" />
		</Icon>
	),
	Maximize: p => (
		<Icon {...p}>
			<polyline points="15 3 21 3 21 9" />
			<polyline points="9 21 3 21 3 15" />
			<line x1="21" y1="3" x2="14" y2="10" />
			<line x1="3" y1="21" x2="10" y2="14" />
		</Icon>
	),
	Minimize: p => (
		<Icon {...p}>
			<polyline points="4 14 10 14 10 20" />
			<polyline points="20 10 14 10 14 4" />
			<line x1="14" y1="10" x2="21" y2="3" />
			<line x1="3" y1="21" x2="10" y2="14" />
		</Icon>
	),
	Search: p => (
		<Icon {...p}>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</Icon>
	),
	Star: p => (
		<Icon {...p}>
			<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
		</Icon>
	),
	Save: p => (
		<Icon {...p}>
			<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
			<polyline points="17 21 17 13 7 13 7 21" />
			<polyline points="7 3 7 8 15 8" />
		</Icon>
	),
	Trash: p => (
		<Icon {...p}>
			<polyline points="3 6 5 6 21 6" />
			<path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		</Icon>
	),
	Grid: p => (
		<Icon {...p}>
			<rect x="3" y="3" width="7" height="7" />
			<rect x="14" y="3" width="7" height="7" />
			<rect x="3" y="14" width="7" height="7" />
			<rect x="14" y="14" width="7" height="7" />
		</Icon>
	),
	Waves: p => (
		<Icon {...p}>
			<path d="M2 6c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
			<path d="M2 12c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
			<path d="M2 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2 2 2 4 2" />
		</Icon>
	),
	Circle: p => (
		<Icon {...p}>
			<circle cx="12" cy="12" r="9" />
		</Icon>
	),
	Tunnel: p => (
		<Icon {...p}>
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="5.5" />
			<circle cx="12" cy="12" r="2" />
		</Icon>
	),
	Bars: p => (
		<Icon {...p}>
			<line x1="4" y1="20" x2="4" y2="10" />
			<line x1="9" y1="20" x2="9" y2="4" />
			<line x1="14" y1="20" x2="14" y2="13" />
			<line x1="19" y1="20" x2="19" y2="8" />
		</Icon>
	),
	Sparkles: p => (
		<Icon {...p}>
			<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
		</Icon>
	),
	Reset: p => (
		<Icon {...p}>
			<polyline points="1 4 1 10 7 10" />
			<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
		</Icon>
	),
	Info: p => (
		<Icon {...p}>
			<circle cx="12" cy="12" r="9" />
			<line x1="12" y1="16" x2="12" y2="12" />
			<line x1="12" y1="8" x2="12.01" y2="8" />
		</Icon>
	),
	Pin: p => (
		<Icon {...p}>
			<path d="M12 17v5M9 3h6l-1 7 4 4H6l4-4z" />
		</Icon>
	),
	Zap: p => (
		<Icon {...p}>
			<polygon
				points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
				fill="currentColor"
				stroke="none"
			/>
		</Icon>
	)
};

// ---- PRIMITIVES ------------------------------------------------------------

// Card / PanelSection — the foundational container
window.Card = function Card({
	title,
	subtitle,
	action,
	children,
	style,
	padded = true,
	level = 1
}) {
	const bg = level === 2 ? T.raised : T.panel;
	return (
		<div
			style={{
				background: bg,
				border: `1px solid ${T.border}`,
				borderRadius: T.r3,
				backdropFilter: 'blur(20px) saturate(140%)',
				WebkitBackdropFilter: 'blur(20px) saturate(140%)',
				...style
			}}
		>
			{(title || action) && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: `${T.s3}px ${T.s4}px`,
						borderBottom: `1px solid ${T.hairline}`
					}}
				>
					<div>
						{title && (
							<div
								style={{
									fontSize: 11,
									fontWeight: 600,
									letterSpacing: '0.08em',
									textTransform: 'uppercase',
									color: T.fgMute,
									fontFamily: T.fontMono
								}}
							>
								{title}
							</div>
						)}
						{subtitle && (
							<div
								style={{
									fontSize: 13,
									color: T.fg,
									marginTop: 2
								}}
							>
								{subtitle}
							</div>
						)}
					</div>
					{action}
				</div>
			)}
			<div style={padded ? { padding: T.s4 } : undefined}>{children}</div>
		</div>
	);
};

// CollapsibleGroup — for advanced disclosures
window.CollapsibleGroup = function CollapsibleGroup({
	title,
	defaultOpen = false,
	badge,
	children,
	dense = false
}) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div style={{ borderTop: `1px solid ${T.hairline}` }}>
			<button
				onClick={() => setOpen(!open)}
				style={{
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: `${dense ? T.s2 : T.s3}px ${T.s4}px`,
					background: 'transparent',
					border: 0,
					cursor: 'pointer',
					color: T.fgMute,
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: '0.08em',
					textTransform: 'uppercase',
					fontFamily: T.fontMono
				}}
			>
				<span
					style={{ display: 'flex', alignItems: 'center', gap: T.s2 }}
				>
					<window.Icons.ChevR
						size={12}
						style={{
							transform: open ? 'rotate(90deg)' : 'none',
							transition: 'transform 120ms'
						}}
					/>
					{title}
					{badge && (
						<span
							style={{
								fontSize: 9,
								padding: '2px 6px',
								borderRadius: 999,
								background: T.accentBg,
								color: T.accent,
								border: `1px solid ${T.accentBd}`
							}}
						>
							{badge}
						</span>
					)}
				</span>
			</button>
			{open && (
				<div style={{ padding: `0 ${T.s4}px ${T.s4}px` }}>
					{children}
				</div>
			)}
		</div>
	);
};

// Button
window.Button = function Button({
	children,
	variant = 'ghost',
	size = 'md',
	icon,
	onClick,
	active,
	disabled,
	full,
	style
}) {
	// Normalized heights: sm 28 · md 32 · lg 38 — match SegmentedControl/Select/IconButton.
	const sizes = {
		sm: { h: 28, px: 10, fs: 12 },
		md: { h: 32, px: 12, fs: 13 },
		lg: { h: 38, px: 16, fs: 14 }
	}[size];
	const variants = {
		primary: { bg: T.accent, fg: '#04141a', bd: 'transparent' },
		ghost: {
			bg: active ? T.accentBg : T.raised,
			fg: T.fg,
			bd: active ? T.accentBd : T.border
		},
		flat: { bg: 'transparent', fg: T.fgMute, bd: 'transparent' },
		danger: {
			bg: 'rgba(255,107,107,0.12)',
			fg: T.danger,
			bd: 'rgba(255,107,107,0.34)'
		}
	}[variant];
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			style={{
				height: sizes.h,
				padding: `0 ${sizes.px}px`,
				display: 'inline-flex',
				alignItems: 'center',
				gap: T.s2,
				background: variants.bg,
				color: variants.fg,
				border: `1px solid ${variants.bd}`,
				borderRadius: T.r2,
				fontSize: sizes.fs,
				fontWeight: 500,
				fontFamily: T.fontUI,
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.4 : 1,
				width: full ? '100%' : undefined,
				justifyContent: full ? 'center' : undefined,
				transition: 'background 120ms, border-color 120ms',
				...style
			}}
		>
			{icon}
			{children}
		</button>
	);
};

// IconButton — square icon-only button. Tap target bumps to 40px on touch.
window.IconButton = function IconButton({
	children,
	onClick,
	active,
	size = 'md',
	title,
	style
}) {
	// sm/md/lg: visual sizes. Touch surface enforced via min-height/width media query.
	const dim = { sm: 28, md: 32, lg: 38 }[size];
	const [hover, setHover] = React.useState(false);
	return (
		<button
			onClick={onClick}
			title={title}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={e => {
				setHover(false);
				e.currentTarget.style.transform = 'none';
			}}
			onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
			onMouseUp={e => (e.currentTarget.style.transform = 'none')}
			style={{
				width: dim,
				height: dim,
				minWidth: 32,
				minHeight: 32,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: active ? T.accentBg : hover ? T.hover : T.raised,
				color: active ? T.accent : T.fg,
				border: `1px solid ${active ? T.accentBd : hover ? T.borderHi : T.border}`,
				borderRadius: T.r2,
				cursor: 'pointer',
				transition:
					'background 120ms, border-color 120ms, transform 80ms',
				...style
			}}
		>
			{children}
		</button>
	);
};

// SegmentedControl — heights normalized with Button/Select/IconButton (28/32/38)
window.SegmentedControl = function SegmentedControl({
	value,
	onChange,
	options,
	size = 'md',
	full
}) {
	const h = { sm: 28, md: 32, lg: 38 }[size];
	const fs = { sm: 11, md: 12, lg: 13 }[size];
	return (
		<div
			style={{
				display: 'inline-flex',
				padding: 2,
				gap: 2,
				background: 'rgba(0,0,0,0.32)',
				border: `1px solid ${T.border}`,
				borderRadius: T.r2,
				width: full ? '100%' : undefined
			}}
		>
			{options.map(opt => {
				const v = typeof opt === 'string' ? opt : opt.value;
				const label = typeof opt === 'string' ? opt : opt.label;
				const icon = typeof opt === 'string' ? null : opt.icon;
				const sel = v === value;
				return (
					<button
						key={v}
						onClick={() => onChange(v)}
						style={{
							flex: full ? 1 : undefined,
							height: h - 4,
							padding: `0 ${icon ? 8 : 12}px`,
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 6,
							background: sel ? T.accent : 'transparent',
							color: sel ? '#04141a' : T.fgMute,
							border: 0,
							borderRadius: T.r1,
							cursor: 'pointer',
							fontSize: fs,
							fontWeight: sel ? 600 : 500,
							fontFamily: T.fontUI,
							whiteSpace: 'nowrap',
							transition: 'all 120ms'
						}}
					>
						{icon}
						{label}
					</button>
				);
			})}
		</div>
	);
};

// ToggleSwitch
window.ToggleSwitch = function ToggleSwitch({
	checked,
	onChange,
	size = 'md'
}) {
	const w = { sm: 28, md: 36, lg: 44 }[size];
	const h = { sm: 16, md: 20, lg: 24 }[size];
	const k = h - 4;
	return (
		<button
			onClick={() => onChange(!checked)}
			style={{
				width: w,
				height: h,
				padding: 0,
				background: checked ? T.accent : 'rgba(0,0,0,0.42)',
				border: `1px solid ${checked ? 'transparent' : T.border}`,
				borderRadius: 999,
				position: 'relative',
				cursor: 'pointer',
				transition: 'background 160ms'
			}}
		>
			<span
				style={{
					position: 'absolute',
					top: 1,
					left: checked ? w - k - 3 : 1,
					width: k,
					height: k,
					borderRadius: '50%',
					background: checked ? '#04141a' : T.fg,
					transition: 'left 160ms cubic-bezier(0.22, 1, 0.36, 1)',
					boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
				}}
			/>
		</button>
	);
};

// SliderRow — label + slider + numeric input
window.SliderRow = function SliderRow({
	label,
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	unit,
	hint,
	locked,
	onReset
}) {
	const [hover, setHover] = useState(false);
	const pct = ((value - min) / (max - min)) * 100;
	const trackRef = useRef(null);
	const dragRef = useRef(false);

	const updateFromX = useCallback(
		clientX => {
			const r = trackRef.current.getBoundingClientRect();
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - r.left) / r.width)
			);
			const raw = min + ratio * (max - min);
			const snapped = Math.round(raw / step) * step;
			onChange(Math.max(min, Math.min(max, snapped)));
		},
		[min, max, step, onChange]
	);

	return (
		<div
			style={{ padding: `${T.s2}px 0` }}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: 6
				}}
			>
				<span
					style={{
						fontSize: 12,
						color: T.fg,
						fontWeight: 500,
						display: 'flex',
						alignItems: 'center',
						gap: 6
					}}
				>
					{label}
					{hint && (
						<span style={{ fontSize: 10, color: T.fgFaint }}>
							{hint}
						</span>
					)}
				</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					{hover && onReset && (
						<button
							onClick={onReset}
							title="Reset to default"
							style={{
								background: 'transparent',
								border: 0,
								color: T.fgFaint,
								cursor: 'pointer',
								padding: 2
							}}
						>
							<window.Icons.Reset size={11} />
						</button>
					)}
					<span
						style={{
							fontFamily: T.fontMono,
							fontSize: 11,
							fontVariantNumeric: 'tabular-nums',
							color: T.fg,
							background: 'rgba(0,0,0,0.32)',
							padding: '2px 8px',
							borderRadius: T.r1,
							minWidth: 48,
							textAlign: 'right',
							border: `1px solid ${T.border}`
						}}
					>
						{value}
						{unit || ''}
					</span>
				</div>
			</div>
			<div
				ref={trackRef}
				onPointerDown={e => {
					if (locked) return;
					e.currentTarget.setPointerCapture(e.pointerId);
					dragRef.current = true;
					updateFromX(e.clientX);
				}}
				onPointerMove={e => dragRef.current && updateFromX(e.clientX)}
				onPointerUp={e => {
					dragRef.current = false;
					e.currentTarget.releasePointerCapture(e.pointerId);
				}}
				style={{
					position: 'relative',
					height: 22,
					cursor: locked ? 'not-allowed' : 'pointer',
					opacity: locked ? 0.4 : 1
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: 0,
						right: 0,
						transform: 'translateY(-50%)',
						height: 4,
						background: 'rgba(0,0,0,0.42)',
						borderRadius: 999,
						overflow: 'hidden'
					}}
				>
					<div
						style={{
							height: '100%',
							width: `${pct}%`,
							background: T.accent,
							boxShadow: `0 0 8px ${T.accent}`
						}}
					/>
				</div>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: `${pct}%`,
						transform: 'translate(-50%, -50%)',
						width: 12,
						height: 12,
						borderRadius: '50%',
						background: '#fff',
						border: `2px solid ${T.accent}`,
						boxShadow: hover ? `0 0 0 6px ${T.accentBg}` : 'none',
						transition: 'box-shadow 120ms'
					}}
				/>
			</div>
		</div>
	);
};

// Select / Dropdown — clear open/closed states + leading caret affordance + checked dot in menu
window.Select = function Select({
	value,
	onChange,
	options,
	full,
	placeholder,
	size = 'md'
}) {
	const [open, setOpen] = useState(false);
	const [hover, setHover] = useState(false);
	const ref = useRef(null);
	const h = { sm: 28, md: 32, lg: 38 }[size];
	useEffect(() => {
		if (!open) return;
		const handler = e => {
			if (ref.current && !ref.current.contains(e.target)) setOpen(false);
		};
		const esc = e => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('mousedown', handler);
		document.addEventListener('keydown', esc);
		return () => {
			document.removeEventListener('mousedown', handler);
			document.removeEventListener('keydown', esc);
		};
	}, [open]);
	const current = options.find(o => (o.value ?? o) === value);
	return (
		<div
			ref={ref}
			style={{ position: 'relative', width: full ? '100%' : undefined }}
		>
			<button
				onClick={() => setOpen(!open)}
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
				style={{
					width: full ? '100%' : undefined,
					height: h,
					padding: '0 6px 0 12px',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 8,
					background: open ? T.accentBg : hover ? T.hover : T.raised,
					color: T.fg,
					border: `1px solid ${open ? T.accent : hover ? T.borderHi : T.border}`,
					borderRadius: T.r2,
					fontSize: 13,
					cursor: 'pointer',
					fontFamily: T.fontUI,
					textAlign: 'left',
					boxShadow: open ? `0 0 0 3px ${T.accentBg}` : 'none',
					transition: 'all 120ms'
				}}
			>
				<span
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						color: current ? T.fg : T.fgFaint,
						minWidth: 0,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap'
					}}
				>
					{current?.icon}
					{current?.label ?? current ?? placeholder ?? 'Select…'}
				</span>
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: 22,
						height: 22,
						borderRadius: T.r1,
						background: open ? T.accent : 'rgba(0,0,0,0.32)',
						color: open ? '#04141a' : T.fgMute,
						transition: 'all 120ms'
					}}
				>
					<window.Icons.ChevD
						size={12}
						style={{
							transform: open ? 'rotate(180deg)' : 'none',
							transition: 'transform 120ms'
						}}
					/>
				</span>
			</button>
			{open && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 6px)',
						left: 0,
						right: 0,
						zIndex: 100,
						background: T.shell,
						border: `1px solid ${T.borderHi}`,
						borderRadius: T.r2,
						padding: 4,
						boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
						backdropFilter: 'blur(24px)',
						maxHeight: 280,
						overflowY: 'auto'
					}}
				>
					{options.map((opt, i) => {
						const v = opt.value ?? opt;
						const label = opt.label ?? opt;
						const sel = v === value;
						return (
							<button
								key={i}
								onClick={() => {
									onChange(v);
									setOpen(false);
								}}
								style={{
									width: '100%',
									height: 34,
									padding: '0 10px',
									display: 'flex',
									alignItems: 'center',
									gap: 10,
									background: sel
										? T.accentBg
										: 'transparent',
									color: sel ? T.accent : T.fg,
									border: 0,
									borderRadius: T.r1,
									cursor: 'pointer',
									fontSize: 13,
									fontFamily: T.fontUI,
									textAlign: 'left'
								}}
								onMouseEnter={e =>
									!sel &&
									(e.currentTarget.style.background = T.hover)
								}
								onMouseLeave={e =>
									!sel &&
									(e.currentTarget.style.background =
										'transparent')
								}
							>
								<span
									style={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										background: sel
											? T.accent
											: 'transparent',
										flexShrink: 0
									}}
								/>
								{opt.icon}
								<span style={{ flex: 1 }}>{label}</span>
								{opt.hint && (
									<span
										style={{
											fontSize: 10,
											color: T.fgFaint,
											fontFamily: T.fontMono
										}}
									>
										{opt.hint}
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

// Toolbar (horizontal strip with groups)
window.Toolbar = function Toolbar({ children, style }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: T.s2,
				padding: `${T.s2}px ${T.s3}px`,
				background: T.shell,
				border: `1px solid ${T.border}`,
				borderRadius: T.r3,
				backdropFilter: 'blur(20px)',
				...style
			}}
		>
			{children}
		</div>
	);
};

window.ToolbarGroup = function ToolbarGroup({ children }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
			{children}
		</div>
	);
};

window.ToolbarDivider = function ToolbarDivider() {
	return (
		<div
			style={{
				width: 1,
				alignSelf: 'stretch',
				background: T.hairline,
				margin: `0 ${T.s1}px`
			}}
		/>
	);
};

// Field row (label + control)
window.Field = function Field({ label, hint, children, layout = 'row' }) {
	return layout === 'row' ? (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 12,
				padding: `${T.s2}px 0`
			}}
		>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					minWidth: 0
				}}
			>
				<span style={{ fontSize: 12, color: T.fg, fontWeight: 500 }}>
					{label}
				</span>
				{hint && (
					<span style={{ fontSize: 10, color: T.fgFaint }}>
						{hint}
					</span>
				)}
			</div>
			{children}
		</div>
	) : (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 6,
				padding: `${T.s2}px 0`
			}}
		>
			<span
				style={{
					fontSize: 11,
					color: T.fgMute,
					fontWeight: 500,
					fontFamily: T.fontMono,
					letterSpacing: '0.04em',
					textTransform: 'uppercase'
				}}
			>
				{label}
			</span>
			{children}
			{hint && (
				<span style={{ fontSize: 10, color: T.fgFaint }}>{hint}</span>
			)}
		</div>
	);
};

// Section label (small caps)
window.SectionLabel = function SectionLabel({ children, action }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: T.s2
			}}
		>
			<span
				style={{
					fontSize: 10,
					fontWeight: 600,
					letterSpacing: '0.12em',
					textTransform: 'uppercase',
					color: T.fgMute,
					fontFamily: T.fontMono
				}}
			>
				{children}
			</span>
			{action}
		</div>
	);
};

// Tab pill (used at top of editor)
window.TabPill = function TabPill({ children, active, onClick, icon }) {
	return (
		<button
			onClick={onClick}
			style={{
				height: 32,
				padding: '0 12px',
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				background: active ? T.raised : 'transparent',
				color: active ? T.fg : T.fgMute,
				border: 0,
				borderRadius: T.r2,
				cursor: 'pointer',
				fontSize: 13,
				fontWeight: active ? 600 : 500,
				fontFamily: T.fontUI,
				borderBottom: active
					? `2px solid ${T.accent}`
					: '2px solid transparent',
				transition: 'all 120ms'
			}}
		>
			{icon}
			{children}
		</button>
	);
};

// Preset chip (image thumbnail + label)
window.PresetChip = function PresetChip({
	label,
	active,
	onClick,
	color,
	icon
}) {
	return (
		<button
			onClick={onClick}
			style={{
				padding: 8,
				minWidth: 88,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				gap: 6,
				background: active ? T.accentBg : T.raised,
				border: `1px solid ${active ? T.accentBd : T.border}`,
				borderRadius: T.r2,
				cursor: 'pointer',
				transition: 'all 120ms',
				textAlign: 'left'
			}}
		>
			<div
				style={{
					width: '100%',
					aspectRatio: '16/9',
					background:
						color ||
						'linear-gradient(135deg, rgba(103,232,249,0.18), rgba(168,85,247,0.18))',
					borderRadius: T.r1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: T.fg
				}}
			>
				{icon}
			</div>
			<span
				style={{
					fontSize: 11,
					color: active ? T.accent : T.fg,
					fontWeight: 500
				}}
			>
				{label}
			</span>
		</button>
	);
};

Object.assign(window, { T });
