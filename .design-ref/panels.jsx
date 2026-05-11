/* global React */
// Tab content — Scene + Spectrum (the two flagship tabs the user requested),
// plus a sketched HUD/MediaDock. Built using primitives from tokens.jsx.

const { useState } = React;

// ---- SCENE TAB -------------------------------------------------------------
window.SceneTab = function SceneTab({ mode }) {
  const [slots, setSlots] = useState([
    { id: 'bg',       label: 'Background',  value: 'image',     options: ['image', 'gradient', 'solid', 'none'], locked: false, visible: true },
    { id: 'spectrum', label: 'Spectrum',    value: 'linear',    options: ['linear', 'radial', 'tunnel', 'liquid', 'wave', 'spectrogram'], locked: false, visible: true },
    { id: 'logo',     label: 'Logo',        value: 'reactive',  options: ['reactive', 'static', 'none'], locked: false, visible: true },
    { id: 'particles',label: 'Particles',   value: 'embers',    options: ['embers', 'snow', 'sparks', 'galaxy', 'none'], locked: false, visible: false },
    { id: 'rain',     label: 'Rain / FX',   value: 'glitch',    options: ['glitch', 'rain', 'scanlines', 'none'], locked: true, visible: true },
    { id: 'overlay',  label: 'Overlay',     value: 'vignette',  options: ['vignette', 'grain', 'rgb-shift', 'none'], locked: false, visible: true },
  ]);

  const update = (id, patch) => setSlots(s => s.map(x => x.id === id ? { ...x, ...patch } : x));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.s4 }}>
      <window.Card title="Scene presets" padded={false}>
        <div style={{ padding: T.s3, display: 'flex', gap: T.s2, overflowX: 'auto' }}>
          {[
            { l: 'Studio',  c: 'linear-gradient(135deg, #67e8f9, #818cf8)', i: <window.Icons.Sparkles size={18}/> },
            { l: 'Neon',    c: 'linear-gradient(135deg, #f472b6, #c084fc)', i: <window.Icons.Zap size={18}/>, active: true },
            { l: 'Mono',    c: 'linear-gradient(135deg, #475569, #94a3b8)', i: <window.Icons.Drop size={18}/> },
            { l: 'Sunrise', c: 'linear-gradient(135deg, #fb923c, #fbbf24)', i: <window.Icons.Star size={18}/> },
            { l: 'Deep',    c: 'linear-gradient(135deg, #1e293b, #0f172a)', i: <window.Icons.Layers size={18}/> },
            { l: '+ Save',  c: 'rgba(255,255,255,0.04)', i: <window.Icons.Plus size={18}/> },
          ].map((p, i) => <window.PresetChip key={i} {...p} label={p.l} color={p.c} active={p.active} icon={p.i}/>)}
        </div>
      </window.Card>

      <window.Card title="Slots" subtitle={<span style={{ fontSize: 12, color: T.fgMute }}>What plays in each layer</span>} padded={false}
        action={<window.IconButton size="sm" title="Add slot"><window.Icons.Plus size={14}/></window.IconButton>}>
        <div>
          {slots.map((s, i) => (
            <div key={s.id} style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 1.2fr auto',
              alignItems: 'center', gap: T.s3,
              padding: `${T.s2}px ${T.s4}px`,
              borderTop: i > 0 ? `1px solid ${T.hairline}` : undefined,
              opacity: s.visible ? 1 : 0.5,
            }}>
              <button onClick={() => update(s.id, { visible: !s.visible })} title={s.visible ? 'Hide' : 'Show'} style={{
                background: 'transparent', border: 0, color: s.visible ? T.fg : T.fgFaint, cursor: 'pointer', padding: 2,
              }}>
                {s.visible ? <window.Icons.Eye size={14}/> : <window.Icons.EyeOff size={14}/>}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: T.fg, fontWeight: 500 }}>{s.label}</span>
                {s.locked && <window.Icons.Lock size={11} style={{ color: T.fgFaint }}/>}
              </div>
              <window.Select value={s.value} onChange={v => update(s.id, { value: v })} full
                options={s.options.map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))}/>
              <window.IconButton size="sm" title="Options"><window.Icons.Dots size={14}/></window.IconButton>
            </div>
          ))}
        </div>
      </window.Card>

      <window.Card title="Per-image overrides" padded={false}>
        <div style={{ padding: T.s3 }}>
          <window.Field label="Active image" hint="Image #4 of 8 — overrides apply only to this image">
            <div style={{ display: 'flex', alignItems: 'center', gap: T.s2 }}>
              <window.IconButton size="sm"><window.Icons.ChevL size={14}/></window.IconButton>
              <div style={{ width: 56, height: 32, borderRadius: T.r1, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', border: `1px solid ${T.border}` }}/>
              <window.IconButton size="sm"><window.Icons.ChevR size={14}/></window.IconButton>
            </div>
          </window.Field>
          <window.Field label="Override scene" hint="When on, this image uses its own slot config">
            <window.ToggleSwitch checked={true} onChange={() => {}}/>
          </window.Field>
          <window.Field label="Override looks" hint="Filters, color grade, FX">
            <window.ToggleSwitch checked={false} onChange={() => {}}/>
          </window.Field>
        </div>
        {mode === 'advanced' && (
          <window.CollapsibleGroup title="Advanced — per-image transforms" badge="ADV">
            <window.SliderRow label="Bass zoom" value={42} onChange={() => {}} unit="%" hint="0–100"/>
            <window.SliderRow label="Parallax depth" value={18} onChange={() => {}} unit="px"/>
            <window.SliderRow label="Auto-cycle (s)" value={12} onChange={() => {}} min={3} max={60}/>
          </window.CollapsibleGroup>
        )}
      </window.Card>
    </div>
  );
};

// ---- SPECTRUM TAB ----------------------------------------------------------
window.SpectrumTab = function SpectrumTab({ mode }) {
  const [style, setStyle] = useState('linear');
  const [colorMode, setColorMode] = useState('theme');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.s4 }}>
      <window.Card title="Style" padded={false}>
        <div style={{ padding: T.s3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: T.s2 }}>
          {[
            { v: 'linear', l: 'Linear', i: <window.Icons.Bars size={20}/> },
            { v: 'radial', l: 'Radial', i: <window.Icons.Circle size={20}/> },
            { v: 'tunnel', l: 'Tunnel', i: <window.Icons.Tunnel size={20}/> },
            { v: 'liquid', l: 'Liquid', i: <window.Icons.Drop size={20}/> },
            { v: 'wave',   l: 'Wave',   i: <window.Icons.Waves size={20}/> },
            { v: 'spectrogram', l: 'Spectrogram', i: <window.Icons.Grid size={20}/> },
          ].map(o => (
            <window.PresetChip key={o.v} label={o.l} icon={o.i} active={style === o.v}
              onClick={() => setStyle(o.v)}
              color={style === o.v ? 'linear-gradient(135deg, rgba(103,232,249,0.32), rgba(168,85,247,0.18))' : 'rgba(255,255,255,0.03)'}/>
          ))}
        </div>
      </window.Card>

      <window.Card title="Look" padded={false}>
        <div style={{ padding: T.s3 }}>
          <window.Field label="Intensity">
            <window.SliderRow label="" value={72} onChange={() => {}} unit="%"/>
          </window.Field>
          <window.SliderRow label="Sensitivity" value={58} onChange={() => {}} unit="%" onReset={() => {}}/>
          <window.SliderRow label="Smoothing"   value={36} onChange={() => {}} unit="%" onReset={() => {}}/>
          <window.SliderRow label="Bar count"   value={64} onChange={() => {}} min={8} max={256} step={8} onReset={() => {}}/>
        </div>

        {mode === 'advanced' && (
          <window.CollapsibleGroup title="Advanced — FFT" defaultOpen badge="ADV">
            <window.Field label="FFT size">
              <window.Select value={2048} onChange={() => {}}
                options={[512, 1024, 2048, 4096, 8192].map(n => ({ value: n, label: `${n} bins`, hint: `${(n/2)} freqs` }))}/>
            </window.Field>
            <window.SliderRow label="Min frequency" value={40}  onChange={() => {}} min={20} max={500} unit="Hz" hint="Hz"/>
            <window.SliderRow label="Max frequency" value={16000} onChange={() => {}} min={1000} max={22050} unit="Hz"/>
            <window.SliderRow label="Curve"         value={1.4} onChange={() => {}} min={0.5} max={3} step={0.05} unit="x"/>
            <window.Field label="Peak hold">
              <window.ToggleSwitch checked={true} onChange={() => {}}/>
            </window.Field>
          </window.CollapsibleGroup>
        )}
      </window.Card>

      <window.Card title="Color" subtitle={<span style={{ fontSize: 11, color: T.fgMute }}>Only one mode active — settings never leak between them</span>} padded={false}>
        <div style={{ padding: T.s3, display: 'flex', flexDirection: 'column', gap: T.s3 }}>
          <window.SegmentedControl full value={colorMode} onChange={setColorMode}
            options={[
              { value: 'theme',   label: 'Theme',   icon: <window.Icons.Wand size={12}/> },
              { value: 'image',   label: 'Image',   icon: <window.Icons.Images size={12}/> },
              { value: 'manual',  label: 'Manual',  icon: <window.Icons.Drop size={12}/> },
              { value: 'rainbow', label: 'Rainbow', icon: <window.Icons.Sparkles size={12}/> },
            ]}/>
          {colorMode === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: T.s2 }}>
              <div style={{ fontSize: 10, color: T.fgMute, fontFamily: T.fontMono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Custom palette</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: T.s2 }}>
                {[['#67e8f9','Accent'], ['#818cf8','Secondary'], ['#f472b6','Highlight'], ['#020617','Backdrop']].map(([c,l]) => (
                  <div key={c} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ aspectRatio: '1', borderRadius: T.r2, background: c, border: `1px solid ${T.borderHi}`, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}/>
                    <span style={{ fontSize: 9, color: T.fgMute, fontFamily: T.fontMono, textAlign: 'center' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {colorMode === 'theme' && (
            <div style={{ padding: T.s3, borderRadius: T.r2, background: 'linear-gradient(90deg, #67e8f9, #818cf8, #f472b6)', fontSize: 11, color: '#04141a', fontWeight: 600, fontFamily: T.fontMono, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
              <window.Icons.Wand size={14}/> Following editor theme · Neon
            </div>
          )}
          {colorMode === 'image' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: T.s3, padding: T.s2, borderRadius: T.r2, background: 'rgba(0,0,0,0.32)', border: `1px solid ${T.border}` }}>
              <div style={{ width: 48, height: 48, borderRadius: T.r1, background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', flexShrink: 0 }}/>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, color: T.fg }}>Extracted from image #4</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {['#ec4899','#a855f7','#3b82f6','#06b6d4','#1e293b'].map(c => <div key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: `1px solid ${T.border}` }}/>)}
                </div>
              </div>
            </div>
          )}
          {colorMode === 'rainbow' && (
            <div style={{ padding: T.s3, borderRadius: T.r2, background: 'linear-gradient(90deg, hsl(0,90%,60%), hsl(50,95%,56%), hsl(110,85%,44%), hsl(170,88%,46%), hsl(215,92%,60%), hsl(268,82%,64%), hsl(318,84%,62%), hsl(360,90%,60%))', fontSize: 11, color: '#fff', fontWeight: 600, fontFamily: T.fontMono, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              <window.Icons.Sparkles size={14}/> Animated spectrum sweep · 12s cycle
            </div>
          )}
        </div>
      </window.Card>

      {mode === 'advanced' && (
        <window.Card title="Reactivity" padded={false}>
          <div style={{ padding: T.s3 }}>
            <window.SliderRow label="Bass weight" value={1.4} onChange={() => {}} min={0} max={3} step={0.05} unit="x"/>
            <window.SliderRow label="Mid weight"  value={1.0} onChange={() => {}} min={0} max={3} step={0.05} unit="x"/>
            <window.SliderRow label="High weight" value={0.8} onChange={() => {}} min={0} max={3} step={0.05} unit="x"/>
            <window.SliderRow label="Attack (ms)" value={20}  onChange={() => {}} min={0} max={200}/>
            <window.SliderRow label="Decay (ms)"  value={140} onChange={() => {}} min={0} max={2000}/>
          </div>
        </window.Card>
      )}
    </div>
  );
};

// ---- HUD / MEDIA DOCK ------------------------------------------------------
window.MediaDock = function MediaDock({ playing, onPlay, time, dur, onSeek, accent }) {
  const pct = dur > 0 ? (time / dur) * 100 : 0;
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  return (
    <div style={{
      width: '100%',
      background: T.shell,
      border: `1px solid ${T.border}`,
      borderRadius: T.r4,
      padding: `${T.s3}px ${T.s4}px`,
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', gap: T.s2,
    }}>
      {/* Image strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: T.s2 }}>
        <window.IconButton size="sm" title="Previous image"><window.Icons.ChevL size={14}/></window.IconButton>
        <window.IconButton size="sm" active title="Freeze motion"><window.Icons.Snowflake size={14}/></window.IconButton>
        <window.IconButton size="sm" title="Next image"><window.Icons.ChevR size={14}/></window.IconButton>
        <window.IconButton size="sm" title="Slideshow"><window.Icons.Images size={14}/></window.IconButton>
        <span style={{
          fontSize: 10, padding: '3px 8px', borderRadius: T.r1,
          background: T.accentBg, color: accent || T.accent, border: `1px solid ${T.accentBd}`,
          fontFamily: T.fontMono, letterSpacing: '0.12em',
        }}>IMG 4/8</span>
        <div style={{ flex: 1 }}/>
        <window.IconButton size="sm" title="Source: file"><window.Icons.Music size={14}/></window.IconButton>
        <window.IconButton size="sm" title="Desktop audio"><window.Icons.Monitor size={14}/></window.IconButton>
        <window.IconButton size="sm" title="Microphone"><window.Icons.Mic size={14}/></window.IconButton>
      </div>

      {/* Transport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: T.s2 }}>
        <window.IconButton title="Prev track"><window.Icons.Prev size={14}/></window.IconButton>
        <window.IconButton active onClick={onPlay} title={playing ? 'Pause' : 'Play'} size="lg" style={{
          background: accent || T.accent, color: '#04141a', borderColor: 'transparent',
          boxShadow: `0 0 18px ${T.accentBg}`,
        }}>
          {playing ? <window.Icons.Pause size={16}/> : <window.Icons.Play size={16}/>}
        </window.IconButton>
        <window.IconButton title="Next track"><window.Icons.Next size={14}/></window.IconButton>
        <window.IconButton title="Repeat"><window.Icons.Repeat size={14}/></window.IconButton>
        <window.IconButton title="Shuffle"><window.Icons.Shuffle size={14}/></window.IconButton>
        <div style={{ flex: 1, minWidth: 0, padding: '0 8px' }}>
          <div style={{ fontSize: 12, color: T.fg, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Daft Cassette — Midnight Diffusion
          </div>
          <div style={{ fontSize: 10, color: T.fgFaint, fontFamily: T.fontMono, letterSpacing: '0.04em' }}>
            48 kHz · stereo · FFT 2048
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: T.s3 }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.fgMute, fontVariantNumeric: 'tabular-nums' }}>{fmt(time)}</span>
        <div onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSeek?.(((e.clientX - r.left) / r.width) * dur);
        }} style={{
          flex: 1, height: 8, position: 'relative', cursor: 'pointer',
          background: 'rgba(0,0,0,0.42)', borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, width: `${pct}%`,
            background: accent || T.accent,
            boxShadow: `0 0 12px ${T.accentBg}`,
            borderRadius: 999,
          }}/>
          <div style={{
            position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: '#fff', border: `2px solid ${accent || T.accent}`,
          }}/>
        </div>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.fgMute, fontVariantNumeric: 'tabular-nums' }}>-{fmt(dur - time)}</span>
      </div>
    </div>
  );
};

// ---- LOOKS / LAYERS / MOTION / AUDIO / ADVANCED preview (compact) ----------
window.QuickTab = function QuickTab({ kind }) {
  if (kind === 'looks') {
    return (
      <window.Card title="Filter look" padded={false}>
        <div style={{ padding: T.s3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: T.s2 }}>
          {[
            { l: 'Clean',   c: 'linear-gradient(135deg, #1e293b, #475569)' },
            { l: 'Bloom',   c: 'linear-gradient(135deg, #fde68a, #fb923c)', active: true },
            { l: 'CRT',     c: 'linear-gradient(135deg, #22d3ee, #6366f1)' },
            { l: 'Glitch',  c: 'linear-gradient(135deg, #f43f5e, #8b5cf6)' },
            { l: 'Noir',    c: 'linear-gradient(135deg, #18181b, #52525b)' },
            { l: 'Anime',   c: 'linear-gradient(135deg, #f0abfc, #38bdf8)' },
          ].map(o => <window.PresetChip key={o.l} label={o.l} active={o.active} color={o.c} icon={null}/>)}
        </div>
      </window.Card>
    );
  }
  if (kind === 'layers') {
    return (
      <window.Card title="Layers" padded={false}>
        {['Background', 'Spectrum', 'Logo', 'Particles', 'Overlay'].map((l, i) => (
          <div key={l} style={{
            display: 'flex', alignItems: 'center', gap: T.s2,
            padding: `${T.s2}px ${T.s4}px`, borderTop: i > 0 ? `1px solid ${T.hairline}` : 0,
          }}>
            <window.Icons.Eye size={13} style={{ color: T.fgMute }}/>
            <span style={{ flex: 1, fontSize: 13, color: T.fg }}>{l}</span>
            <window.SliderRow label="" value={70 + i * 4} onChange={() => {}} unit="%" />
          </div>
        ))}
      </window.Card>
    );
  }
  return null;
};
