# Plan de Consolidación — Julio 2026

Roadmap por fases para cubrir las áreas flojas detectadas en la [Auditoría Técnica 2026-07](../audits/AUDITORIA_TECNICA_2026-07.md). Respeta la directiva de consolidación del proyecto: **una feature a la vez, sin expansión de scope, identificar el subsistema dueño antes de tocar nada.**

Orden de fases = orden recomendado de ejecución. Cada fase es un sprint corto e independiente; ninguna bloquea a la siguiente salvo donde se indica.

---

## Fase P — Performance de lyrics ✅ (ejecutada julio 2026)

**Problema:** lag perceptible cuando la lyric tiene muchos efectos (glow alto + glow-pulse + varias líneas + treatments). Causa: `shadowBlur` por glifo por frame + `measureText` por carácter + gradientes recreados (auditoría §2.1).

**Solución aplicada:** portar a `LyricsOverlay.ts` el patrón de cache que ya existía en `TrackTitleOverlay.ts` (render del texto con glow UNA vez a offscreen canvas, blit por frame; glow-pulse modula alpha en vez de radio de blur; cache LRU de wrapping).

**Resultado esperado:** pase de lyrics de decenas de ms → ~2 `drawImage` por línea. Verificar con Chrome DevTools Performance.

---

## Fase B — Bugs críticos (siguiente prioridad)

En orden:

1. **S1 — Backfill de instancias Spectrum 2 en migración** (`wallpaperStoreMigrations.ts`). Riesgo real de crash en saves viejos. Patrón ya conocido (caso spectrumScale v91).
2. **S5 — Aviso de almacenamiento lleno** (`wallpaperStore.ts:39-51`): toast + sugerencia de export cuando `setItem` falla por quota. Previene pérdida de sesión silenciosa.
3. **S2 — Limpieza de lyrics al borrar track**: borrar entry de `audioLyricsByTrackAssetId` si ningún track vivo usa el assetId.
4. **R2/R3/R4 — Guards de render**: NaN con canvas 0×0 (`CircularSpectrum.ts:403-408`), listeners resize acumulados (`AudioLayerCanvas.tsx` + `useCallback` en `useAudioData`), fallback de liquidGlass. (R3 ya quedó corregido en Fase P.)
5. **S3/S4 — Audio engine**: guard en `maybeStartCrossfade()`, try/finally de objectUrl en `FileAudioAnalyzer`.

**Estimación:** 1–2 sesiones. Todos tienen fix puntual documentado en la auditoría §3–4.

---

## Fase L — Fidelidad del liquid glass

**Problema:** el efecto lupa no se ve como el de macOS (magnificación uniforme con corte abrupto; sin Fresnel ni aberración).

**Trabajo** (todo en `liquidGlass.ts`, beneficia a lyrics + NowPlayingWidget + UI a la vez):
1. Rim en 3–4 bandas concéntricas con magnificación decreciente (curva de lente) — elimina el corte abrupto. **La mejora más visible.**
2. Fresnel aproximado: gradiente radial de alpha en el tinte del rim.
3. Speculars con gradiente en vez de hairlines duras.
4. (Opcional, solo perf high) aberración cromática sutil: blit desplazado 1px en `screen` a baja alpha.

**Verificación:** comparación lado a lado con Control Center de macOS sobre fondos con detalle fino. Es iterativo por gusto visual — presupuestar 2–3 rondas de feedback del usuario.

---

## Fase X — Poda de features no usadas (~460 LOC)

⚠️ Cada ítem se confirma con el usuario ANTES de remover, y requiere migración que limpie las keys persistidas (bump de `STORE_PERSIST_VERSION`).

| Orden | Feature | LOC | Riesgo |
|-------|---------|-----|--------|
| 1 | `lyrixaLayerOverrides` + render mode dual — los canales extra de lyrics nunca usados | ~250 | Bajo (usuario confirmó no usarlos) |
| 2 | `motionProfileSlots` legacy (solo migración) | ~80 | Muy bajo |
| 3 | `spectrumSecondOverride` per-image | ~50 | Bajo |
| 4 | Manual glow color decoupling (6 keys v92) | ~50 | Medio — verificar uso real antes |
| 5 | Calibration synthetic | ~30 | Decidir si se queda (es dev-tool) |

**Beneficio:** menos superficie de bugs, menos migraciones futuras, editor de lyrics más simple (se elimina UI de layers).

---

## Fase U — Usabilidad del editor

Objetivo: que la app sea "fácil de usar". En orden de impacto/esfuerzo:

1. **i18n de strings hardcodeadas** (20–40 keys: `LooksTab.tsx:52-71`, `SpectrumFxPanel`, treatments en LyricsTabBody). Bajo esfuerzo, alto impacto para usuarios en español.
2. **FeatureGates faltantes** en SpectrumTab/LogoTab/MotionTab (patrón ya establecido en `src/ui`).
3. **Hook `useTabViewState(key, default)`** compartido — elimina duplicación en LogoTab/TrackTitleTab + TabFade en SpectrumTab.
4. **Refactor de los 2 mega-tabs** a `EditorTabLayout`: LyricsTabBody (1322 líneas — más simple después de la Fase X) y TrackTitleTab (1377).
5. **"Audio routing" visible**: la reactividad de audio vive en 3 tabs; agregar sección de resumen/atajos en AudioTab.
6. Verificar dead code: `LegacyTabAdapter`, `controlTabsLazy`, alcanzabilidad de CalibrationTab.

---

## Fase K — Preparación para backend

Prerequisito conceptual: decidir qué se sincroniza (¿solo settings/escenas? ¿también imágenes/audio?). Trabajo de cliente independiente del servidor elegido:

1. **Slots por UUID** (bloqueante #1): migrar `spectrumProfileSlots` y todas las familias de slots a IDs estables; escenas referencian por ID. Migración grande — hacerla ANTES de acumular más features sobre slots.
2. **Deprecar overrides per-image** a favor de scene-first (v98 ya apunta ahí) — elimina el conflicto de precedencia en merges.
3. **Metadata de assets**: hash + versión en los blobs de IndexedDB; bundles Lyrixa como asset records separados.
4. **Payload de sync versionado**: incluir `STORE_PERSIST_VERSION` + migraciones aplicables server-side.
5. Recién entonces: elegir backend (un simple sync de JSON versionado + asset store cubre el 90%).

---

## Fase T — Tests de regresión mínimos

1. **Suite de migraciones v91–v102**: fixture de save viejo por versión clave → migrar → asserts de keys presentes (habría atrapado el bug S1 y el caso spectrumScale).
2. **AudioMixEngine**: crossfade + next manual (race S3), onEnded durante crossfade.
3. **FileAudioAnalyzer**: lifecycle de objectURL (create/revoke en todos los paths).

---

## Fase W — Largo plazo: layer WebGL unificado

Migrar spectrum + lyrics + title a un solo canvas WebGL con glow por shader. Elimina de raíz: shadowBlur (bottleneck #1), N canvases full-screen, snapshot copies, pixelate multi-canvas. Es el único camino a 4K/120Hz con todo activado. **No empezar hasta cerrar Fases B y X** (menos superficie que portar).

---

## Resumen de secuencia

```
P (hecha) → B (bugs) → L (liquid glass) → X (poda) → U (usabilidad) → K (backend prep) → T (tests) → W (WebGL)
```

T puede intercalarse en cualquier momento (idealmente junto a B). L puede adelantarse si el tema visual urge — no depende de nada.
