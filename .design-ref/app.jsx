/* global React, ReactDOM */
const { useState, useEffect } = React;

function App() {
  const [time, setTime] = useState(72);
  const [playing, setPlaying] = useState(true);
  const dur = 248;
  const [accent, setAccent] = useState('#67e8f9');

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setTime(t => (t + 0.5) % dur), 500);
    return () => clearInterval(i);
  }, [playing]);

  return (
    <window.DesignCanvas title="LiveWallpaperAnimeGlitch — UI remaster" subtitle="Design system + Compact / Expanded editor + flagship tabs">
      <window.DCSection id="overview" title="Overview" subtitle="One unified system across every editor mode">
        <window.DCArtboard id="rationale" label="System rationale" width={920} height={620}>
          <div style={{
            padding: 32, height: '100%', overflow: 'hidden',
            background: '#0b0e16', color: 'rgba(255,255,255,0.92)',
            fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.55,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          }}>
            <div>
              <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Design intent</div>
              <h2 style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, margin: 0, marginBottom: 16 }}>
                One control vocabulary, three editor modes.
              </h2>
              <p style={{ color: T.fgMute, margin: 0, marginBottom: 12 }}>
                The current editor mixes generations of controls — bespoke sliders, ad-hoc dropdowns, inconsistent button shapes. The remaster collapses them into a single set of primitives and reuses them at three densities: <b style={{ color: T.fg }}>Compact</b> (floating glass card), <b style={{ color: T.fg }}>Expanded</b> (full inspector + preview), and <b style={{ color: T.fg }}>HUD</b> (transport dock).
              </p>
              <p style={{ color: T.fgMute, margin: 0, marginBottom: 12 }}>
                Simple vs Advanced is a <b style={{ color: T.fg }}>real distinction</b>, not a label: Advanced reveals a CollapsibleGroup of technical params under each Card; Simple keeps four-or-fewer high-impact sliders per section.
              </p>
              <p style={{ color: T.fgMute, margin: 0 }}>
                Slots stay the architectural unit. Each row in the Scene tab is one slot, with visibility, lock, source dropdown, and per-slot options menu — directly mapping to the existing <code style={{ fontFamily: T.fontMono, color: T.accent, fontSize: 11 }}>sceneSlot.ts</code>.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['01', 'Tokens', 'Three surface tiers, one accent CSS var, four radii, six-step spacing'],
                ['02', 'Primitives', 'Button · IconButton · SegmentedControl · ToggleSwitch · SliderRow · Select · Card · CollapsibleGroup · Toolbar'],
                ['03', 'Tabs', 'Scene · Spectrum · Looks · Layers · Motion · Audio · Advanced'],
                ['04', 'Section pattern', 'Header → Presets/slots → Core controls → Advanced disclosure'],
                ['05', 'Simple vs Advanced', '4 sliders or fewer vs full FFT/curve/attack/decay parameters'],
                ['06', 'HUD', 'Image strip + transport + scrubbable timeline, all built from the same primitives'],
              ].map(([n, t, d]) => (
                <div key={n} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12,
                  padding: 12, background: T.panel, borderRadius: T.r2, border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 600, color: T.accent }}>{n}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t}</div>
                    <div style={{ fontSize: 11, color: T.fgMute }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="tokens" title="Design tokens" subtitle="The visual language behind every primitive">
        <window.DCArtboard id="tokens-card" label="Tokens" width={920} height={520}>
          <div style={{ padding: 28, height: '100%', background: '#0b0e16', color: T.fg, fontFamily: T.fontUI, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Surface tiers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Shell',  T.shell,  'Editor outer + dropdowns'],
                    ['Panel',  T.panel,  'Cards inside the shell'],
                    ['Raised', T.raised, 'Inputs, buttons, controls'],
                  ].map(([n, c, d]) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 56, height: 32, background: c, border: `1px solid ${T.border}`, borderRadius: T.r2 }}/>
                      <div style={{ minWidth: 60, fontSize: 12, fontWeight: 500 }}>{n}</div>
                      <div style={{ fontSize: 11, color: T.fgMute }}>{d}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Accent (themed)</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {['#67e8f9', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80'].map(c => (
                    <div key={c} style={{ width: 40, height: 40, background: c, borderRadius: T.r2, boxShadow: `0 0 16px ${c}55` }}/>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: T.fgMute, marginBottom: 8 }}>One CSS var: <code style={{ color: T.accent, fontFamily: T.fontMono }}>--lwag-accent</code>. Themed by image / theme / manual, just like today.</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Radii</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['r1',6],['r2',10],['r3',14],['r4',18]].map(([n,r]) => (
                    <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 56, height: 56, background: T.raised, borderRadius: r, border: `1px solid ${T.border}` }}/>
                      <span style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono }}>{n} · {r}px</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Spacing</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  {[4,8,12,16,24,32].map((s,i) => (
                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 16, height: s, background: T.accent, borderRadius: 2 }}/>
                      <span style={{ fontSize: 9, color: T.fgMute, fontFamily: T.fontMono }}>s{i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Type</div>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>Inter — UI</div>
                <div style={{ fontSize: 14, fontFamily: T.fontMono, color: T.fgMute, marginTop: 4 }}>JetBrains Mono — 11px 60Hz</div>
                <div style={{ fontSize: 11, color: T.fgFaint, marginTop: 4 }}>Body 13 · Label 12 · Caps 10/11 mono</div>
              </div>
            </div>
          </div>
        </window.DCArtboard>

        <window.DCArtboard id="primitives" label="Primitives" width={920} height={620}>
          <div style={{ padding: 28, height: '100%', background: '#0b0e16', color: T.fg, fontFamily: T.fontUI, overflow: 'auto' }}>
            <Primitives/>
          </div>
        </window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="editor" title="Editor modes" subtitle="Compact vs Expanded — same data, different density">
        <window.DCArtboard id="compact" label="Compact editor — floats over wallpaper" width={1280} height={780}>
          <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <window.VisualizerMock mode="bars" accent="#67e8f9"/>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, padding: 24, width: 400 }}>
              <window.CompactEditor accent="#67e8f9"/>
            </div>
            {/* HUD at bottom */}
            <div style={{ position: 'absolute', left: 24, right: 424, bottom: 24 }}>
              <window.MediaDock playing={true} time={72} dur={248} accent="#67e8f9"/>
            </div>
          </div>
        </window.DCArtboard>

        <window.DCArtboard id="expanded" label="Expanded editor — full inspector" width={1440} height={900}>
          <div style={{ width: '100%', height: '100%', background: '#000', padding: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0 }}><window.VisualizerMock mode="radial" accent="#a78bfa" dim/></div>
            <div style={{ position: 'absolute', inset: 16 }}>
              <window.ExpandedEditor accent="#a78bfa" time={72} dur={248} playing={true}/>
            </div>
          </div>
        </window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="tabs" title="Tab anatomy" subtitle="Section pattern shown on Scene + Spectrum">
        <window.DCArtboard id="scene-simple" label="Scene · Simple" width={420} height={760}>
          <div style={{ padding: 20, height: '100%', background: '#0b0e16', overflow: 'auto', fontFamily: T.fontUI }}>
            <window.SceneTab mode="simple"/>
          </div>
        </window.DCArtboard>
        <window.DCArtboard id="scene-advanced" label="Scene · Advanced" width={420} height={760}>
          <div style={{ padding: 20, height: '100%', background: '#0b0e16', overflow: 'auto', fontFamily: T.fontUI }}>
            <window.SceneTab mode="advanced"/>
          </div>
        </window.DCArtboard>
        <window.DCArtboard id="spectrum-simple" label="Spectrum · Simple" width={420} height={760}>
          <div style={{ padding: 20, height: '100%', background: '#0b0e16', overflow: 'auto', fontFamily: T.fontUI }}>
            <window.SpectrumTab mode="simple"/>
          </div>
        </window.DCArtboard>
        <window.DCArtboard id="spectrum-advanced" label="Spectrum · Advanced" width={420} height={760}>
          <div style={{ padding: 20, height: '100%', background: '#0b0e16', overflow: 'auto', fontFamily: T.fontUI }}>
            <window.SpectrumTab mode="advanced"/>
          </div>
        </window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="hud" title="HUD / Media dock" subtitle="The transport surface — image strip · transport · timeline">
        <window.DCArtboard id="hud-card" label="Media dock" width={920} height={300}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{ position: 'absolute', inset: 0 }}><window.VisualizerMock mode="wave" accent="#f472b6" dim/></div>
            <div style={{ position: 'absolute', left: 32, right: 32, bottom: 32 }}>
              <window.MediaDock playing={true} time={72} dur={248} accent="#f472b6"/>
            </div>
          </div>
        </window.DCArtboard>
      </window.DCSection>
    </window.DesignCanvas>
  );
}

// Primitives showcase
function Primitives() {
  const [seg, setSeg] = useState('a');
  const [tog, setTog] = useState(true);
  const [sli, setSli] = useState(58);
  const [sel, setSel] = useState('linear');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <window.SectionLabel>Buttons</window.SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <window.Button variant="primary" icon={<window.Icons.Save size={13}/>}>Save preset</window.Button>
          <window.Button variant="ghost">Cancel</window.Button>
          <window.Button variant="ghost" active>Active</window.Button>
          <window.Button variant="danger" icon={<window.Icons.Trash size={13}/>}>Delete</window.Button>
          <window.Button variant="ghost" disabled>Disabled</window.Button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <window.IconButton><window.Icons.Play size={14}/></window.IconButton>
          <window.IconButton active><window.Icons.Pause size={14}/></window.IconButton>
          <window.IconButton><window.Icons.Repeat size={14}/></window.IconButton>
          <window.IconButton><window.Icons.Shuffle size={14}/></window.IconButton>
        </div>

        <window.SectionLabel>Segmented</window.SectionLabel>
        <div style={{ marginBottom: 16 }}>
          <window.SegmentedControl value={seg} onChange={setSeg}
            options={[{value:'a',label:'Simple'},{value:'b',label:'Advanced'}]}/>
        </div>

        <window.SectionLabel>Toggle</window.SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <window.ToggleSwitch checked={tog} onChange={setTog}/>
          <window.ToggleSwitch checked={!tog} onChange={() => {}}/>
          <span style={{ fontSize: 12, color: T.fgMute }}>md size</span>
        </div>

        <window.SectionLabel>Select</window.SectionLabel>
        <window.Select value={sel} onChange={setSel}
          options={[
            { value: 'linear', label: 'Linear', icon: <window.Icons.Bars size={14}/> },
            { value: 'radial', label: 'Radial', icon: <window.Icons.Circle size={14}/> },
            { value: 'tunnel', label: 'Tunnel', icon: <window.Icons.Tunnel size={14}/> },
            { value: 'wave',   label: 'Wave',   icon: <window.Icons.Waves size={14}/> },
          ]}/>
      </div>

      <div>
        <window.SectionLabel>SliderRow</window.SectionLabel>
        <div style={{ background: T.panel, padding: 12, borderRadius: T.r2, border: `1px solid ${T.border}`, marginBottom: 16 }}>
          <window.SliderRow label="Intensity"    value={sli} onChange={setSli} unit="%" onReset={() => setSli(50)}/>
          <window.SliderRow label="Sensitivity"  value={72} onChange={() => {}} unit="%" hint="0–100"/>
          <window.SliderRow label="Bar count"    value={64} onChange={() => {}} min={8} max={256} step={8}/>
          <window.SliderRow label="FFT (locked)" value={2048} onChange={() => {}} locked/>
        </div>

        <window.SectionLabel>Card with CollapsibleGroup</window.SectionLabel>
        <window.Card title="Spectrum" subtitle="6 controls" padded={false}>
          <div style={{ padding: 12 }}>
            <window.SliderRow label="Smoothing" value={36} onChange={() => {}} unit="%"/>
          </div>
          <window.CollapsibleGroup title="Advanced — FFT" badge="ADV">
            <window.SliderRow label="Curve" value={1.4} onChange={() => {}} min={0.5} max={3} step={0.05} unit="x"/>
            <window.SliderRow label="Attack" value={20} onChange={() => {}} unit="ms"/>
          </window.CollapsibleGroup>
        </window.Card>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
