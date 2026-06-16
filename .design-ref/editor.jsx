/* global React */
// Editor shells — Compact and Expanded.
// Compact = floating glass card pinned to the right, ~340px wide, single column.
// Expanded = full inspector, two-column on wide screens, header + footer.

const { useState } = React;

const TABS = [
	{ id: 'scene', label: 'Scene', icon: <window.Icons.Layers size={14} /> },
	{
		id: 'spectrum',
		label: 'Spectrum',
		icon: <window.Icons.Activity size={14} />
	},
	{ id: 'looks', label: 'Looks', icon: <window.Icons.Wand size={14} /> },
	{ id: 'layers', label: 'Layers', icon: <window.Icons.Layers size={14} /> },
	{
		id: 'motion',
		label: 'Motion',
		icon: <window.Icons.Sparkles size={14} />
	},
	{ id: 'audio', label: 'Audio', icon: <window.Icons.Music size={14} /> },
	{
		id: 'advanced',
		label: 'Advanced',
		icon: <window.Icons.Settings size={14} />
	}
];

function renderTab(id, mode) {
	if (id === 'scene') return <window.SceneTab mode={mode} />;
	if (id === 'spectrum') return <window.SpectrumTab mode={mode} />;
	if (id === 'looks') return <window.QuickTab kind="looks" />;
	if (id === 'layers') return <window.QuickTab kind="layers" />;
	return (
		<window.Card title={id} padded>
			<div style={{ fontSize: 12, color: T.fgMute, padding: T.s3 }}>
				Tab content lives here — each follows the same pattern: Section
				header → Presets / slots → Core controls → Advanced disclosure.
			</div>
		</window.Card>
	);
}

// ---- COMPACT EDITOR --------------------------------------------------------
window.CompactEditor = function CompactEditor({ accent, onPin }) {
	const [tab, setTab] = useState('spectrum');
	const [mode, setMode] = useState('simple');
	return (
		<div
			style={{
				width: 360,
				height: '100%',
				background: T.shell,
				border: `1px solid ${T.border}`,
				borderRadius: T.r4,
				overflow: 'hidden',
				backdropFilter: 'blur(24px) saturate(140%)',
				WebkitBackdropFilter: 'blur(24px) saturate(140%)',
				boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
				display: 'flex',
				flexDirection: 'column',
				fontFamily: T.fontUI,
				color: T.fg
			}}
		>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: T.s2,
					padding: `${T.s3}px ${T.s3}px`,
					borderBottom: `1px solid ${T.hairline}`,
					background:
						'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)'
				}}
			>
				<div
					style={{
						width: 24,
						height: 24,
						borderRadius: T.r1,
						background: accent || T.accent,
						display: 'grid',
						placeItems: 'center',
						color: '#04141a'
					}}
				>
					<window.Icons.Activity size={14} stroke={2.5} />
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontSize: 12, fontWeight: 600 }}>
						Compact editor
					</div>
					<div
						style={{
							fontSize: 10,
							color: T.fgFaint,
							fontFamily: T.fontMono
						}}
					>
						Scene · Neon
					</div>
				</div>
				<window.SegmentedControl
					size="sm"
					value={mode}
					onChange={setMode}
					options={[
						{ value: 'simple', label: 'Simple' },
						{ value: 'advanced', label: 'Adv' }
					]}
				/>
				<window.IconButton size="sm" onClick={onPin} title="Expand">
					<window.Icons.Maximize size={12} />
				</window.IconButton>
			</div>

			{/* Tab strip */}
			<div
				style={{
					display: 'flex',
					gap: 2,
					padding: `${T.s1}px ${T.s2}px`,
					borderBottom: `1px solid ${T.hairline}`,
					overflowX: 'auto',
					background: 'rgba(0,0,0,0.18)'
				}}
			>
				{TABS.map(t => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							height: 28,
							padding: '0 8px',
							display: 'inline-flex',
							alignItems: 'center',
							gap: 4,
							background: tab === t.id ? T.raised : 'transparent',
							color: tab === t.id ? T.fg : T.fgMute,
							border: 0,
							borderRadius: T.r1,
							cursor: 'pointer',
							fontSize: 11,
							fontWeight: tab === t.id ? 600 : 500,
							fontFamily: T.fontUI,
							whiteSpace: 'nowrap'
						}}
					>
						{t.icon}
						{t.label}
					</button>
				))}
			</div>

			{/* Mode banner — explicit indicator that survives scroll */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					padding: `6px ${T.s3}px`,
					background:
						mode === 'advanced' ? T.accentBg : 'transparent',
					borderBottom: `1px solid ${T.hairline}`,
					fontSize: 10,
					fontFamily: T.fontMono,
					letterSpacing: '0.1em',
					textTransform: 'uppercase',
					color: mode === 'advanced' ? T.accent : T.fgFaint
				}}
			>
				{mode === 'advanced' ? (
					<>
						<window.Icons.Sliders size={11} /> Advanced — all
						controls visible
					</>
				) : (
					<>
						<window.Icons.Sparkles size={11} /> Simple — high-impact
						controls only
					</>
				)}
			</div>

			{/* Scrollable body */}
			<div style={{ flex: 1, overflowY: 'auto', padding: T.s3 }}>
				{renderTab(tab, mode)}
			</div>
		</div>
	);
};

// ---- EXPANDED EDITOR -------------------------------------------------------
window.ExpandedEditor = function ExpandedEditor({
	accent,
	time,
	dur,
	playing,
	onPlay,
	onSeek,
	onPin
}) {
	const [tab, setTab] = useState('spectrum');
	const [mode, setMode] = useState('advanced');

	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				background: T.shell,
				border: `1px solid ${T.border}`,
				borderRadius: T.r4,
				overflow: 'hidden',
				backdropFilter: 'blur(24px) saturate(140%)',
				WebkitBackdropFilter: 'blur(24px) saturate(140%)',
				boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
				display: 'flex',
				flexDirection: 'column',
				fontFamily: T.fontUI,
				color: T.fg
			}}
		>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: T.s3,
					padding: `${T.s3}px ${T.s4}px`,
					borderBottom: `1px solid ${T.hairline}`,
					background:
						'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)'
				}}
			>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: T.r2,
						background: accent || T.accent,
						display: 'grid',
						placeItems: 'center',
						color: '#04141a'
					}}
				>
					<window.Icons.Activity size={18} stroke={2.5} />
				</div>
				<div>
					<div style={{ fontSize: 14, fontWeight: 600 }}>
						Live wallpaper · Anime
					</div>
					<div
						style={{
							fontSize: 11,
							color: T.fgFaint,
							fontFamily: T.fontMono
						}}
					>
						scene: Neon · 6 slots · saved 2 min ago
					</div>
				</div>
				<div style={{ flex: 1 }} />
				<window.SegmentedControl
					value={mode}
					onChange={setMode}
					options={[
						{
							value: 'simple',
							label: 'Simple',
							icon: <window.Icons.Sparkles size={12} />
						},
						{
							value: 'advanced',
							label: 'Advanced',
							icon: <window.Icons.Sliders size={12} />
						}
					]}
				/>
				<window.ToolbarDivider />
				<window.IconButton title="Save preset">
					<window.Icons.Save size={14} />
				</window.IconButton>
				<window.IconButton title="Export">
					<window.Icons.Plus size={14} />
				</window.IconButton>
				<window.IconButton onClick={onPin} title="Collapse">
					<window.Icons.Minimize size={14} />
				</window.IconButton>
			</div>

			{/* Tab bar */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 2,
					padding: `${T.s1}px ${T.s3}px`,
					borderBottom: `1px solid ${T.hairline}`,
					background: 'rgba(0,0,0,0.18)'
				}}
			>
				{TABS.map(t => (
					<window.TabPill
						key={t.id}
						active={tab === t.id}
						onClick={() => setTab(t.id)}
						icon={t.icon}
					>
						{t.label}
					</window.TabPill>
				))}
				<div style={{ flex: 1 }} />
				<div
					style={{
						height: 26,
						padding: '0 10px',
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						background: T.raised,
						border: `1px solid ${T.border}`,
						borderRadius: T.r2,
						fontSize: 11,
						color: T.fgMute,
						fontFamily: T.fontMono
					}}
				>
					<window.Icons.Search size={11} />
					<span>Search settings…</span>
					<span
						style={{
							padding: '1px 5px',
							borderRadius: 3,
							background: 'rgba(255,255,255,0.06)',
							fontSize: 9
						}}
					>
						⌘K
					</span>
				</div>
			</div>

			{/* Body: two columns on wide */}
			<div
				style={{
					flex: 1,
					display: 'grid',
					gridTemplateColumns: '1fr 360px',
					minHeight: 0
				}}
			>
				<div
					style={{
						overflowY: 'auto',
						padding: T.s4,
						display: 'flex',
						flexDirection: 'column',
						gap: T.s4,
						borderRight: `1px solid ${T.hairline}`
					}}
				>
					{renderTab(tab, mode)}
				</div>
				<div
					style={{
						overflowY: 'auto',
						padding: T.s4,
						display: 'flex',
						flexDirection: 'column',
						gap: T.s3,
						background: 'rgba(0,0,0,0.18)'
					}}
				>
					<window.SectionLabel>Preview</window.SectionLabel>
					<div
						style={{
							aspectRatio: '16/9',
							borderRadius: T.r2,
							overflow: 'hidden',
							border: `1px solid ${T.border}`
						}}
					>
						<window.VisualizerMock
							mode={tab === 'spectrum' ? 'radial' : 'bars'}
							accent={accent || '#67e8f9'}
						/>
					</div>
					<window.SectionLabel>Performance</window.SectionLabel>
					<window.Card padded>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: T.s3
							}}
						>
							{[
								{ l: 'FPS', v: '60', s: T.ok },
								{ l: 'GPU', v: '42%', s: T.fg },
								{ l: 'Particles', v: '1.2k', s: T.fg },
								{ l: 'Layers', v: '6', s: T.fg }
							].map(m => (
								<div key={m.l}>
									<div
										style={{
											fontSize: 10,
											color: T.fgMute,
											fontFamily: T.fontMono,
											letterSpacing: '0.08em',
											textTransform: 'uppercase'
										}}
									>
										{m.l}
									</div>
									<div
										style={{
											fontSize: 22,
											fontWeight: 600,
											color: m.s,
											fontFamily: T.fontMono,
											fontVariantNumeric: 'tabular-nums'
										}}
									>
										{m.v}
									</div>
								</div>
							))}
						</div>
					</window.Card>
					<window.SectionLabel>Theme</window.SectionLabel>
					<window.Card padded>
						<window.Field label="Color source">
							<window.SegmentedControl
								size="sm"
								value="image"
								onChange={() => {}}
								options={[
									{ value: 'theme', label: 'T' },
									{ value: 'image', label: 'IMG' },
									{ value: 'manual', label: 'M' }
								]}
							/>
						</window.Field>
						<window.SliderRow
							label="Surface opacity"
							value={72}
							onChange={() => {}}
							unit="%"
						/>
						<window.SliderRow
							label="Blur"
							value={18}
							onChange={() => {}}
							unit="px"
						/>
						<window.SliderRow
							label="Corner radius"
							value={14}
							onChange={() => {}}
							unit="px"
						/>
					</window.Card>
				</div>
			</div>

			{/* Footer dock */}
			<div
				style={{
					padding: T.s3,
					borderTop: `1px solid ${T.hairline}`,
					background: 'rgba(0,0,0,0.32)'
				}}
			>
				<window.MediaDock
					playing={playing}
					onPlay={onPlay}
					time={time}
					dur={dur}
					onSeek={onSeek}
					accent={accent}
				/>
			</div>
		</div>
	);
};
