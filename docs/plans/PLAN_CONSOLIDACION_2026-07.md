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

## Fase X — Consolidación selectiva ✅ (ejecutada julio 2026, store v103)

Decisión del usuario: podar los 2 candidatos legacy + **solo la UI** de las capas Lyrixa (el renderer conserva soporte multi-capa de bundles).

1. **`motionProfileSlots` eliminado**: la migración v103 divide cada slot guardado en entradas de `particlesProfileSlots` + `rainProfileSlots` (sin pérdida) y elimina la key. `MotionProfilesSection` (componente muerto, sin montar) borrado; acciones CRUD del slice y preservación en `reset()` eliminadas.
2. **`spectrumSecondOverride` per-image eliminado**: la migración v103 preserva cada override como slot con nombre (`S2 · <imagen>`) en `spectrumSecondProfileSlots` y elimina la key de cada imagen. UI (OverrideRow del BG tab, fila spectrum2 del panel per-image del HUD) y setters removidos.
3. **UI de overrides por capa Lyrixa eliminada** (~280 líneas de LyricsTabBody): sliders por layer de posición/escala/opacidad/blur/glow/colores + Clean Imported Styling + Reset. Store keys y aplicación en renderer intactos (bundles existentes siguen viéndose igual). Toggle de render mode conservado e i18n'd.

Tests de regresión: conversión de Motion slots, no-reconversión en v103+, y preservación de overrides S2 (`wallpaperStoreMigrations.test.ts`).

**Fuera de la poda (confirmado):** render multi-capa de bundles Lyrixa, glow independiente de cada spectrum, Calibration synthetic como dev-tool efímera.

---

## Fase U — Usabilidad del editor (parcial ✅ julio 2026)

Hecho:

1. ✅ **i18n**: ~45 keys nuevas en en/es — targets de Looks (`FILTER_TARGET_LABELS`), modos de scanline, títulos de secciones del Spectrum ("Radial rotation", "Retro pixel / LED"), labels de overrides per-image del BG tab, panel per-image del HUD completo (`qa_pi_*`), y render mode de Lyrics.
2. ✅ **FeatureGates**: al auditar en detalle, el patrón switch-off YA estaba implementado en todos los tabs vía renders condicionales (los hallazgos originales eran stale). SpectrumTab y LogoTab se alinearon al wrapper canónico `FeatureGate` (LogoTab ahora muestra hint al estar apagado); las secciones de MotionTab ya gateaban individualmente (no tiene switch maestro por diseño).
3. ✅ **Hook `useTabViewState`** (`src/hooks/useTabViewState.ts`): unifica la persistencia de sub-vista que estaba triplicada en SpectrumTab/LogoTab/TrackTitleTab. **TabFade** agregado al view-switching del Spectrum.
4. ✅ **Dead code**: `LegacyTabAdapter` (sin imports) eliminado; `CalibrationTab` verificado alcanzable (Advanced → calibration); `controlTabsLazy` vivo (Suspense wrapper).

5. ✅ **Mega-tabs canonicalizados** (jul 2026): al auditar de cerca, ambos ya tenían `EditorTabLayout` (hallazgo original stale). Trabajo real: **Lyrics** — el master switch salió del body al `EditorTabHeader` (patrón estricto), color shortcuts + sección de estilo tras `FeatureGate` con hint; el flujo de bundle/target/preview queda accesible con la capa apagada (excepción documentada: el import auto-enciende). **Track Info** — bloques de vista envueltos en `FeatureGate` (la card de metadata quedaba visible con todo apagado) + `TabFade` en el cambio content/style/layout.

Pendiente:

6. **"Audio routing" visible**: la reactividad de audio vive en 3 tabs; agregar sección de resumen/atajos en AudioTab.

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
P ✅ → B ✅ → L ✅ → X ✅ → U ✅ (solo falta audio routing) → K (backend prep) → T parcial → W (WebGL)
```

T puede intercalarse en cualquier momento (idealmente junto a B). L puede adelantarse si el tema visual urge — no depende de nada.
