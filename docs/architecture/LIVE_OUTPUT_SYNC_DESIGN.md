# Live Output Synchronization Design

**Status:** Design only — V1 uses same-window Presentation Mode (`#/present`).

## Historical failure analysis (mini player / secondary window)

The legacy preview path (`#/preview`, Document PiP, popup window) used:

| Mechanism                               | Location                           | Issue                                                  |
| --------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `BroadcastChannel('lwag-preview-sync')` | `useWallpaperPreviewSync.ts`       | Partial state snapshots, not full runtime              |
| `partializeWallpaperStore`              | `wallpaperStorePersistence.ts`     | Strips blob URLs; receiver must rehydrate assets       |
| Polling / presence TTL                  | Preview sync                       | 3s ping, 10s TTL — stale window detection              |
| Separate window                         | `useWindowPresentationControls.ts` | **Duplicated React tree**, separate audio context risk |
| iframe to `#/preview?mini=1`            | PiP/popup                          | Third isolation boundary                               |

### Root causes of sync drift

1. **Copied state snapshots** — not a live shared store; editor changes batch via channel.
2. **Incomplete hydration** — asset URLs nulled in snapshots; timing gaps on restore.
3. **Duplicated playback clocks** — preview window runs its own `AudioDataProvider` / analyser loop.
4. **Incomplete event coverage** — no formal protocol for seek, scene load, profile patch ordering.
5. **No heartbeat recovery** — request/response snapshot exists but no version vectors for conflict detection.

## V1 architecture (implemented)

```
#/edit  → EditShell (full UI + render)
#/present → OutputShell (render only, same store, same tab)
```

- Single Zustand store instance per tab.
- Single audio engine.
- Runtime UI mode in **sessionStorage** (not project data).
- Recovery: `Ctrl+Shift+E`, `#/edit`, hot corner.

**No second window in V1.**

## V2 preferred architecture (future)

```
┌─────────────────────┐         BroadcastChannel / postMessage
│ Editor/controller    │◄──────────────────────────────────────►│ Presentation/output │
│ #/edit               │         typed protocol                  │ #/present (popup)   │
└─────────────────────┘                                         └─────────────────────┘
         │                                                                  │
         └─────────────── shared: project id, schema version ──────────────┘
```

### Message protocol (draft)

| Message                       | Direction           | Payload                                       |
| ----------------------------- | ------------------- | --------------------------------------------- |
| `STATE_SNAPSHOT`              | controller → output | Versioned partial store + asset manifest refs |
| `PATCH_SETTINGS`              | controller → output | Incremental Zustand patch                     |
| `PLAY` / `PAUSE` / `SEEK`     | both                | Transport position, track id                  |
| `NEXT_TRACK`                  | controller → output | Playlist index                                |
| `LOAD_SCENE` / `LOAD_PROJECT` | controller → output | Scene/setlist ids + hydration token           |
| `REQUEST_STATE`               | output → controller | Reason code                                   |
| `HEARTBEAT`                   | both                | Timestamp, mode, playing                      |

### Rules

1. **Controller is source of truth** for edits; output is read-only for settings.
2. Output may send transport commands if configured (optional remote control).
3. Every message includes `schemaVersion` + `snapshotId` monotonic counter.
4. Asset payloads reference **stable asset IDs**, never blob URLs.
5. Output window must **await asset hydration** before showing scene switch.

### Audio strategy (V2)

- **Option A (preferred):** controller plays audio; output is silent visual-only.
- **Option B:** shared AudioContext via AudioWorklet + MessagePort (high complexity).
- Avoid duplicating AnalyserNode graphs in two windows.

## Migration path

1. Ship V1 same-window Presentation Mode (done).
2. Stabilize snapshot schema (`PROJECT_SCHEMA_VERSION`, asset manifest).
3. Implement protocol types + channel adapter behind feature flag.
4. Popup output window with `REQUEST_STATE` on load only.
5. Deprecate iframe mini player once protocol covers transport.

## Non-goals for V2 design

- Electron multi-process
- Cloud relay (WebRTC/Supabase realtime) — local BroadcastChannel first
