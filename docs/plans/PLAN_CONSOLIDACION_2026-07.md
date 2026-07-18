# Plan de Consolidación — Julio 2026

Roadmap por fases para cubrir las áreas flojas detectadas en la [Auditoría Técnica 2026-07](../audits/AUDITORIA_TECNICA_2026-07.md). Respeta la directiva de consolidación del proyecto: **una feature a la vez, sin expansión de scope, identificar el subsistema dueño antes de tocar nada.**

Orden de fases = orden recomendado de ejecución. Cada fase es un sprint corto e independiente; ninguna bloquea a la siguiente salvo donde se indica.

---

## Fase P — Performance de lyrics ✅ (ejecutada julio 2026)

**Problema:** lag perceptible cuando la lyric tiene muchos efectos (glow alto + glow-pulse + varias líneas + treatments). Causa: `shadowBlur` por glifo por frame + `measureText` por carácter + gradientes recreados (auditoría §2.1).

**Solución aplicada:** portar a `LyricsOverlay.ts` el patrón de cache que ya existía en `TrackTitleOverlay.ts` (render del texto con glow UNA vez a offscreen canvas, blit por frame; glow-pulse modula alpha en vez de radio de blur; cache LRU de wrapping).

**Resultado esperado:** pase de lyrics de decenas de ms → ~2 `drawImage` por línea. Verificar con Chrome DevTools Performance.

---

## Fase B — Bugs críticos ✅ (ejecutada julio 2026)

Resultado del contraste y la implementación:

1. **S1 — Backfill Spectrum 2:** ya existía correctamente mediante merge con `createDefaultSpectrumInstance()`; se añadió una regresión que verifica todas las keys actuales sin duplicar migración.
2. **S5 — Persistencia:** `safeStorage` publica el fallo y el editor muestra un aviso traducido, persistente y descartable que recomienda exportar antes de recargar.
3. **S2 — Lyrics:** al borrar una pista se elimina su lyric por `assetId` solo si ningún otro track comparte ese asset; también se limpian referencias active/queued.
4. **R2/R3/R4/R5:** guard 0×0 añadido a Spectrum; R3 quedó en Fase P; R4 y R5 se descartaron al comprobar que callbacks/cleanup ya eran estables.
5. **S3/S4 — Audio:** cargas activas y queued usan generaciones para descartar resultados obsoletos; `ended` de la pista saliente no avanza durante crossfade; errores de setup liberan analyzer, grafo y objectURL.

**Regresiones:** 5 archivos nuevos, 11 casos focalizados para migración, persistencia, lyrics y lifecycle/carreras de audio.

---

## Fase L — Fidelidad del liquid glass ✅ (ejecutada julio 2026)

**Problema:** el efecto lupa no se ve como el de macOS (magnificación uniforme con corte abrupto; sin Fresnel ni aberración).

**Trabajo aplicado** (helper Canvas compartido por lyrics + NowPlayingWidget):

1. Rim adaptativo de 2/3/4 bandas para low/medium/high con magnificación decreciente.
2. Fresnel aproximado mediante peso de tinte decreciente hacia el centro.
3. Speculars con gradientes direccionales en vez de hairlines uniformes.
4. Aberración cromática rojo/cian sutil solo en performance high.
5. Tests unitarios de cantidad de bandas, insets, magnificación y Fresnel monotónicos.

**Pendiente visual:** calibración del usuario sobre fondos con detalle fino. La refracción continua por shader queda como mejora futura, no como deuda del helper Canvas actual.

---

## Fase X — Consolidación selectiva (~130 LOC candidatas)

⚠️ Cada ítem se confirma con el usuario ANTES de remover, y requiere migración que limpie las keys persistidas (bump de `STORE_PERSIST_VERSION`).

| Orden | Candidata                          | LOC | Condición de entrada                                                        |
| ----- | ---------------------------------- | --- | --------------------------------------------------------------------------- |
| 1     | `motionProfileSlots` legacy        | ~80 | Auditar JSON antiguos y cubrir importación/migración sin pérdida            |
| 2     | `spectrumSecondOverride` per-image | ~50 | Migrar lossless a scene-first y probar formalmente la precedencia de estado |

**Fuera de la poda:** se conservan las capas Lyrixa para lead/backing vocals, el glow independiente de cada spectrum y Calibration synthetic como dev-tool efímera.

**Beneficio:** menos superficie legacy sin degradar capacidades explícitas del producto.

---

## Fase U — Usabilidad del editor

Objetivo: que la app sea "fácil de usar". En orden de impacto/esfuerzo:

1. **i18n de strings hardcodeadas** (20–40 keys: `LooksTab.tsx:52-71`, `SpectrumFxPanel`, treatments en LyricsTabBody). Bajo esfuerzo, alto impacto para usuarios en español.
2. **FeatureGates faltantes** en SpectrumTab/LogoTab/MotionTab (patrón ya establecido en `src/ui`).
3. **Hook `useTabViewState(key, default)`** compartido — elimina duplicación en LogoTab/TrackTitleTab + TabFade en SpectrumTab.
4. **Refactor de los 2 mega-tabs** a `EditorTabLayout`: LyricsTabBody (1322 líneas) y TrackTitleTab (1377), preservando capas y overrides de Lyrixa.
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

## Fase T — Tests de regresión mínimos (iniciada junto a Fase B)

1. **Suite de migraciones v91–v102:** ya existe el primer fixture transversal de Spectrum 2; faltan fixtures por cada versión clave.
2. **AudioMixEngine:** cubiertas cargas fuera de orden, queued fuera de orden, `onEnded` durante crossfade y fin de pista tras promoción; faltan curvas y finalización completa.
3. **FileAudioAnalyzer:** cubierto revoke cuando falla el setup; falta autoplay bloqueado y stop idempotente.

---

## Fase W — Largo plazo: layer WebGL unificado

Migrar spectrum + lyrics + title a un solo canvas WebGL con glow por shader. Elimina de raíz: shadowBlur (bottleneck #1), N canvases full-screen, snapshot copies, pixelate multi-canvas. Es el único camino a 4K/120Hz con todo activado. **No empezar hasta cerrar Fases B y X** (menos superficie que portar).

---

## Resumen de secuencia

```
P ✅ → B ✅ → L ✅ → X (consolidación selectiva) → U (usabilidad) → K (backend prep) → T parcial → W (WebGL)
```

T puede intercalarse en cualquier momento (idealmente junto a B). L puede adelantarse si el tema visual urge — no depende de nada.
