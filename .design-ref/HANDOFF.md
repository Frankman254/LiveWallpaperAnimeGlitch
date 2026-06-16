# LWAG editor remaster — developer handoff

## 1. File map → integration

| Prototype file                  | Lands as                                                                             | Notes                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `tokens.jsx`                    | `src/components/controls/ui/tokens.ts` + `src/components/controls/ui/primitives.tsx` | Split: tokens to `.ts`, primitives to `.tsx`. Replaces ad-hoc styling in `editorTheme.ts` overrides. |
| `panels.jsx` → `SceneTab`       | `src/components/controls/tabs/SceneTab.tsx`                                          | New tab, replaces parts of `BgTab` + `LayersTab` interaction.                                        |
| `panels.jsx` → `SpectrumTab`    | `src/components/controls/tabs/SpectrumTab.tsx`                                       | Replaces current spectrum portion of `AudioTab.tsx`.                                                 |
| `panels.jsx` → `MediaDock`      | `src/components/controls/MediaDock.tsx`                                              | Drop-in replacement — same `ImageNavProps` + same store reads.                                       |
| `editor.jsx` → `CompactEditor`  | `src/components/controls/CompactEditor.tsx`                                          | New component; wraps tabs from `controlTabsLazy.tsx`.                                                |
| `editor.jsx` → `ExpandedEditor` | `src/components/controls/ExpandedEditor.tsx`                                         | Replaces `ControlPanel.tsx` shell + `EditorOverlay.tsx`.                                             |

## 2. Token mapping

The single new CSS var `--lwag-accent` aliases the existing `--editor-accent-color` from `editorTheme.ts`. Add one line to the theme setter:

```ts
vars['--lwag-accent'] = chromaAccent; // alongside --editor-accent-color
```

No other CSS vars change. `--editor-shell-bg`, `--editor-radius-md`, `--editor-tag-*` etc. continue to power existing surfaces.

## 3. Zustand → UI

Every primitive is a controlled component (`value` + `onChange`). Wire to the store directly:

```tsx
const fft = useWallpaperStore(s => s.fftSize);
const setFft = useWallpaperStore(s => s.setFftSize);
<Select value={fft} onChange={setFft} options={FFT_OPTIONS} full />;
```

`SliderRow.onReset` should call your existing `controlPanelResetKeys.ts` per-key reset.

## 4. Mode handling

- `mode: 'simple' | 'advanced'` — already in `UIMode.tsx`. Pass it down. The `CollapsibleGroup` blocks render only when `mode === 'advanced'`. Banner under the tab strip surfaces the active mode.
- `colorSource: 'theme' | 'image' | 'manual' | 'rainbow'` — maps to existing `ThemeColorSource` + adds `'rainbow'`. Only the active branch renders, so theme/manual/image/rainbow state can never bleed.

## 5. Tabs

```
Scene · Spectrum · Looks · Layers · Motion · Audio · Advanced
```

Each tab follows the same anatomy:

1. **Section header** — `<Card title=… subtitle=… />`
2. **Presets / slots** — `PresetChip` grid
3. **Core controls** — `SliderRow`, `Select`, `ToggleSwitch`, `SegmentedControl`
4. **Advanced disclosure** — `<CollapsibleGroup badge="ADV">` (only mounted in Advanced mode)

## 6. Compact vs Expanded roles

|                   | Compact                    | Expanded                    |
| ----------------- | -------------------------- | --------------------------- |
| Width             | 360px floating             | full viewport, two-column   |
| Density           | sm controls, sm IconButton | md controls, md IconButton  |
| Preview pane      | no                         | yes (right column)          |
| Performance card  | no                         | yes                         |
| Theme panel       | no (in expanded only)      | yes                         |
| Footer media dock | floating below shell       | embedded inside shell       |
| Search ⌘K         | no                         | yes                         |
| Use case          | mid-session tweaks, mobile | full editing, multi-monitor |

## 7. Mobile

- IconButton minimum 32×32 (touch); md size = 32 already meets 32px tap target. The dropdown menu items are 34px tall.
- Compact editor full-width below 480px (parent should set `width: '100%'`).
- Tab strip horizontally scrolls when overflowed (`overflow-x: auto`).

## 8. Icon system

All icons are 24×24 viewBox SVG, stroke 1.75, line-cap round. Chrome icons render at 14px, preset chips at 18–20px, transport play button at 16px. To swap for lucide-react in the real app, the API matches: `<Play size={14} strokeWidth={1.75}/>`.

## 9. What is NOT in scope of this remaster

- Slot/scene architecture (`sceneSlot.ts`) — unchanged
- Audio pipeline, FFT, WebGL renderers — unchanged
- Persistence model (`lwag-state` localStorage + IndexedDB images) — unchanged
- HashRouter routes — unchanged

The remaster touches only the UI layer.
