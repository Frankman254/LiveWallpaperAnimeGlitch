# V1 Alpha Scope — `0.3.0-alpha.1`

> **Propósito.** Congelar el alcance de la primera alpha pública. Este documento es
> la fuente de verdad sobre **qué entra** y **qué no entra**. Si una idea no está en
> "Entra", no se construye para esta versión — se anota en "No entra (todavía)" y se
> retoma después del release. Objetivo de la alpha: que la app sea usable por alguien
> que no es el autor.

_Última actualización: 2026-06-16._

---

## Objetivo de la alpha

`LiveWallpaperAnimeGlitch 0.3.0-alpha.1` debe ser **estable, coherente y distribuible**,
no más completo. El foco pasa de _features_ a:

- **Confianza** — tests de lógica pura + CI verde.
- **Consistencia** — versiones, docs e iconografía alineadas.
- **Distribución** — release publicada, repo presentable.
- **Presentación** — first-run claro, empty states, recovery.

No se añaden efectos ni subsistemas nuevos hasta cerrar la alpha.

---

## Entra ✅

Lo que ya está a nivel producto y forma parte de la alpha:

- **Editor** — compacto / maximizado, simple / advanced.
- **Proyectos** — nuevo, guardar, recargar.
- **Perfiles** — guardado e hidratación.
- **Escenas y setlists** — bindings explícitos, curaciones del pool.
- **Backgrounds** — transform serio (Keep Covered, Mirror Fill, rotación), slideshow.
- **Spectrum** — familias múltiples, radial / linear, instancias.
- **Logo** — overlay reactivo.
- **Particles** — profundidad, drift, envelope.
- **Stage FX** — lights, flash, camera, shake.
- **Audio** — track local, captura, multitrack/playlist, next/prev/seek.
- **Now Playing** — widget con cover / artista / título / progreso.
- **Lyrics** — import de bundle Lyrixa + estilo.
- **Import / Export** — proyectos y settings.
- **Persistencia local** — `localStorage` (estado ligero) + IndexedDB (assets).
- **i18n ES / EN.**
- **Performance modes** — low / medium / high.

## No entra (todavía) 🚫

Diferido explícitamente a después de la alpha. **No** se trabaja ahora:

- Backend / API propia.
- Login / cuentas.
- Cloud sync.
- Timeline pro / keyframing avanzado.
- Export MP4 offline / render headless.
- Compositor de layers ilimitadas.
- Marketplace de presets / assets.
- App nativa (Electron / móvil).
- Efectos o subsistemas visuales nuevos.

---

## Bloqueadores para llamarlo "producto"

Estado de los gates de release (ver fases en el plan de estabilización):

| #   | Bloqueador                               | Estado                            |
| --- | ---------------------------------------- | --------------------------------- |
| 1   | Tests automáticos (Vitest + lógica pura) | 🟡 en progreso (39 tests, Fase 3) |
| 2   | CI real (`.github/workflows/ci.yml`)     | ✅ Fase 4 (verde al primer push)  |
| 3   | Release publicada (`v0.3.0-alpha.1`)     | ⛔ pendiente (Fase 10)            |
| 4   | Docs públicas alineadas con la versión   | 🟡 en progreso (Fase 2)           |
| 5   | Raíz del repo limpia                     | ✅ Fase 2                         |
| 6   | `lint` + `format:check` verdes (pre-CI)  | ✅ 0 errores, repo formateado     |

---

## Definición de "hecho" para la alpha

La alpha se publica cuando:

1. Versión, `package.json`, README y docs dicen lo mismo (`0.3.0-alpha.1`).
2. Existe un golden path obvio: nuevo proyecto → imagen → audio → preset → preview → guardar.
3. ~30–50 tests de lógica pura pasan en local y en CI.
4. CI corre lint + typecheck + tests + build en cada push/PR.
5. Existe `RELEASE_CHECKLIST_0.3.0-alpha.1.md` con QA manual por dominio.
6. El repo tiene descripción, topics, LICENSE y una release con notas + known issues.
