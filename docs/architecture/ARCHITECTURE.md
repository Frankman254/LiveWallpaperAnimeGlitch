# Arquitectura — el contrato

> **Qué es este documento.** No describe cómo está el código; describe cómo
> **tiene que** estar. Cuando el código y este documento no coinciden, gana este
> documento y el código es deuda.
>
> Para "¿dónde edito X hoy?" usá
> [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) — ése es el mapa descriptivo.
> Para "¿dónde va lo nuevo?" y "¿qué puede importar qué?", usá éste.
>
> Verificado contra el árbol el **2026-09-02**: 590 archivos, ~134k LOC.
> Lo verifica `pnpm architecture:check` en CI.

---

## 1. El sistema en 60 segundos

LiveWallpaperAnimeGlitch es un **editor de escenas audiovisuales dirigido por un
documento de escena central**. Cinco flujos y ya lo entendés:

**1 · Arranque**

```
main.tsx → App.tsx → ruta (#/edit | #/present | #/preview)
         → pages/*Page.tsx → components/app/ (providers) → viewport
```

**2 · Estado → píxeles**

```
UI (components/controls/) ──acciones──▶ store/ (Zustand)
                                          │
                                   lib/layers.ts  (estado → capas)
                                          │
                             components/wallpaper/ (compositor)
                                          │
                    ┌─────────────────────┼─────────────────────┐
                 DOM/CSS             Canvas 2D              WebGL/R3F
                (overlays)        (imagen, audio)      (partículas, shaders)
```

Tres backends de render conviven **a propósito**: cada capa usa el más barato
que le sirve. Es la razón principal de que debuggear visual sea difícil — antes
de tocar algo, averiguá en qué backend vive.

**3 · Audio**

```
Desktop ─┐
Micro    ├─▶ IAudioSourceAdapter ─▶ analyser ─▶ bins / bands / amplitude
MP3      ─┘                                          │
                                            spectrum · logo · FX · lyrics
```

El spectrum **no sabe** de dónde vino el sonido. Ésta es la mejor abstracción
que ya tiene el proyecto; protegela.

**4 · Persistencia**

```
CONFIGURACIÓN → localStorage (Zustand persist, versionado)
ASSETS        → IndexedDB    (imágenes, audio, binarios)

persist → cerrar → abrir → migrate → rehydrate → restore assets → render
```

Toda key persistida nueva **obliga** a bumpear `STORE_PERSIST_VERSION` y a
escribir su migración. Sin eso queda `undefined` en producción y sólo se nota en
build, no en dev.

**5 · Escena**

`defaultSceneSlotId` + `resolveEffectiveSceneSlotId`: la escena efectiva gana
sobre los overrides por imagen (que son legacy). Las escenas se aplican
**explícitamente**, nunca por efecto lateral de editar.

---

## 2. Zonas y dirección de dependencias

`src/` tiene zonas. La primera carpeta bajo `src/` **es** la zona. Las flechas
apuntan hacia abajo y nunca hacia arriba.

```
  ┌──────────────────────────────────────────────┐
  │ app       App.tsx · main.tsx · pages/        │  ← rutas y shells
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ ui-layer  components/ · hooks/ · context/    │  ← React, presentación,
  │           runtime/                           │    orquestación
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ state     store/                             │  ← el documento de escena
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ domain    features/*                         │  ← motores por dominio
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ base      lib/ · ui/ · types/ · config/      │  ← hojas: sin React de
  │           utils/ · shaders/                  │    producto, sin store
  └──────────────────────────────────────────────┘

  dev/  vive fuera del grafo: sólo App.tsx puede montarlo (rutas lazy).
```

### Tabla de reglas (esto es lo que verifica el script)

| Zona                | NO puede importar                                                         | Por qué                                                                   |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `types/`            | todo lo demás                                                             | Es el vocabulario. Si depende de algo, deja de ser vocabulario.           |
| `config/`, `utils/` | `features` `components` `store` `context` `runtime` `pages` `hooks` `lib` | Helpers de hoja. Reusables en aislamiento o no sirven.                    |
| `ui/`               | `components` `features` `store` `context` `runtime` `pages`               | Design system. **No debe saber que este producto existe.**                |
| `lib/`              | `components` `context` `runtime` `pages` `hooks` `store` `features`       | Lógica y persistencia agnósticas de dominio.                              |
| `features/*`        | `components` `pages`                                                      | Un motor que importa su propia UI no se puede reusar ni testear headless. |
| `store/`            | `components` `context` `runtime` `pages` `hooks` `ui`                     | El estado posee datos, no presentación. **Ya está en cero — mantenelo.**  |
| `dev/`              | (nadie lo importa salvo `App.tsx`)                                        | Laboratorios, no producto.                                                |

**Ciclos en tiempo de ejecución: prohibidos.** Los ciclos sólo de tipos
(`import type`) los borra el compilador y no rompen nada, pero igual son señal
de que el vocabulario está mal repartido.

---

## 3. Ownership: una feature es dueña de lo suyo

Ésta es la regla que más le falta al proyecto hoy, y la que más va a cambiar la
sensación de "no encuentro nada".

**Un dominio = una carpeta.** Cuando alguien pregunte "¿dónde vive Spectrum?",
la respuesta debe ser una ruta, no un párrafo.

```
features/<dominio>/
├── index.ts          ← LA FACHADA. Lo único que otras zonas pueden importar.
├── domain/           ← modelo, tipos, invariantes del dominio (sin React)
├── runtime/          ← motor: cálculo por frame, hidratación de perfiles
├── renderers/        ← dibujo (canvas2d / webgl / dom)
├── effects/
├── controls/         ← la UI del editor de ESTE dominio
├── selectors/        ← lectura del store para ESTE dominio
├── presets/
└── *.test.ts
```

Dos consecuencias que hoy no se cumplen:

1. **Toda feature necesita `index.ts`.** Hoy es **1 de 18** (`logo`). Sin fachada, todo
   el mundo importa internals y cualquier movimiento interno rompe medio repo.
2. **La UI del dominio se muda al dominio.** `features/X` puede contener React;
   lo que no puede es importar `components/`.

### El estado real hoy (por qué se siente desordenado)

Medido el 2026-09-02. La columna que importa es la última:

| Dominio        |  Motor (`features/`) |   UI (`components/controls/`) | Extra disperso                            | ¿Motor = dominio? |
| -------------- | -------------------: | ----------------------------: | ----------------------------------------- | ----------------- |
| **background** |     2 arch · 896 LOC |   28 arch · 5.453 LOC (`bg/`) | 9 en `wallpaper/`, 4 en `lib/background*` | **10 %**          |
| **spectrum**   | 58 arch · 14.381 LOC |           17 arch · 3.736 LOC | 4 en `wallpaper/`, `lib/featureProfiles`  | ~70 %             |
| **lyrics**     |  10 arch · 2.882 LOC | 4 arch (`LyricsTabBody` 1.2k) | 2 en `components/audio/` (overlay 1.3k)   | ~60 %             |
| **logo**       | 7 arch · ~900 LOC ✅ |    1 arch (`LogoTab` 769 LOC) | — (migrado, ver §6.1)                     | **~55 %**         |
| **export**     |  15 arch · 1.828 LOC |           13 arch · 2.229 LOC | —                                         | ~45 %             |
| **motion**     |     1 arch · 159 LOC |    3 arch (`Particles*` 1.1k) | 2 en `wallpaper/`                         | **~10 %**         |

`components/controls/tabs/` acumula **31.640 LOC** que casi todo pertenece a
algún dominio. Ése es el material a repartir.

---

## 4. Árbol de decisión: "¿dónde pongo esto?"

```
¿Es un tipo compartido por varios dominios?               → types/
¿Es un token, primitiva visual o control genérico?        → ui/
   (si necesita el store o un dominio, NO va en ui/)
¿Es matemática / formato / helper sin dominio?            → lib/  o  utils/
¿Pertenece a UN dominio? (spectrum, lyrics, background…)  → features/<dominio>/
   ├─ ¿dibuja?                     → features/<d>/renderers/
   ├─ ¿calcula por frame?          → features/<d>/runtime/
   ├─ ¿es el modelo/las reglas?    → features/<d>/domain/
   └─ ¿es el panel del editor?     → features/<d>/controls/
¿Es estado global persistido?                             → store/slices/
   └─ ¿key nueva? → bumpear STORE_PERSIST_VERSION + migración. Sin excepción.
¿Es composición de la escena completa?                    → components/wallpaper/
¿Es shell, ruta o provider?                               → pages/ · components/app/
¿Es un laboratorio o harness?                             → dev/
```

Si dudás entre dos, elegí **la más abajo** en la pila. Bajar después es fácil;
subir rompe a todos los que ya lo importaban.

---

## 5. Deuda congelada

`pnpm architecture:check` tolera exactamente estas violaciones y **ninguna
más**. La lista sólo puede achicarse; si borrás una y no la sacás del baseline,
el check también falla.

| Grupo                            | Aristas | Qué la causa                                                                                              |
| -------------------------------- | ------: | --------------------------------------------------------------------------------------------------------- |
| `types/` → dominios              |       5 | `types/wallpaper.ts` usa `import('...').Foo` inline. Sólo tipos: **se borra en build**, no es ciclo real. |
| `ui/` → producto                 |       4 | `ConnectedColorInput` y `ProfileSlotsEditor` hablan con el store; `CollapsibleSection` con `workspace`.   |
| `lib/` → `store` / `hooks`       |       6 | `projectSettings`, `i18n`, `wallpaperPersistenceCoordinator` son servicios de app, no librería.           |
| `lib/` → `features/`             |      15 | `lib/constants.ts` y `lib/featureProfiles.ts` arman defaults tomándolos de los dominios.                  |
| `features/export` → `components` |       7 | El render offline reusa `CircularSpectrum` / `audioLayerFrameRenderer` de la UI viva.                     |
| **Total**                        |  **37** | 0,8 % de las aristas del grafo.                                                                           |

**Ciclos de runtime conocidos: 2.**

- `ui/index.ts → ui/ProfileSlotsEditor → components/controls/ui/DialogProvider → ui/index.ts`
  Se rompe importando los miembros de `ui` directo en `DialogProvider`, sin el barrel.
- `lib/constants.ts → lib/featureProfiles.ts → features/spectrum/runtime/spectrumProfileHydrate.ts → lib/constants.ts`
  Se rompe cuando los defaults de dominio vivan en `features/*` y `constants` sólo los componga.

> **Lectura honesta:** la dirección de dependencias del proyecto está **casi
> bien** — 39 aristas malas sobre ~4.800. El problema no es acoplamiento
> descontrolado, es **dispersión de ownership** (sección 3). Esa distinción
> cambia el plan: no hay que reconstruir nada, hay que mudar UI a su dominio.

---

## 6. Plan de migración

Sin features nuevas mientras esto corre.

| Fase                        | Qué                                                                                                                                    | Estado    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **1 · Arqueología**         | Grafo real, imports cruzados, ciclos, dispersión por dominio.                                                                          | ✅ hecho  |
| **2 · Contrato**            | Este documento.                                                                                                                        | ✅ hecho  |
| **3 · Guardrail**           | `scripts/check-architecture.mjs` + `pnpm architecture:check` con baseline congelado.                                                   | ✅ hecho  |
| **4a · Quick wins**         | Bajar la deuda barata: sacar `store` de `ui/` (2 archivos), romper el ciclo del barrel, mover los defaults de dominio fuera de `lib/`. | pendiente |
| **4b · Fachadas**           | `index.ts` en las 18 features, empezando por las 3 más importadas. Luego prohibir importar internals entre features.                   | pendiente |
| **4c · Migración vertical** | Un dominio por vez. **`logo` ✅ hecho** — es la plantilla (§6.1). Siguen `lyrics`, `spectrum`, `background`.                           | en curso  |
| **5 · Simplificación**      | Retirar duplicados y conceptos repetidos que la migración deje a la vista.                                                             | pendiente |

**Reglas de la migración**

- Un dominio por PR. Nunca dos en paralelo.
- Mover archivos **sin editar su contenido** en un commit; arreglar imports en
  otro. Así el diff es legible y `git log --follow` sobrevive.
- `pnpm architecture:check` verde antes y después de cada paso.
- Cada dominio migrado tacha sus líneas del baseline.

### 6.1 · La plantilla: cómo se migró `logo`

Se eligió `logo` de ensayo y no `spectrum` porque `spectrum` son 14k LOC de las
que depende todo lo demás: si el patrón falla ahí, el costo es enorme.

**Antes** — 6 archivos en 4 zonas distintas:

```
features/logo/logoPositionGrid.ts                       (132 LOC)
components/audio/ReactiveLogo.ts                        (242)  ← el motor
components/wallpaper/LogoDiagnosticsHud.tsx             (155)
components/wallpaper/quickActions/QuickActionsLogo…tsx  (209)
lib/debug/logoDiagnosticsTelemetry.ts                    (65)
features/presets/logoProfiles.ts                         (55)
```

**Después** — un dominio, una carpeta, una puerta:

```
features/logo/
├── index.ts                                    ← la fachada
├── domain/logoPositionGrid.ts (+ .test.ts)
├── runtime/ReactiveLogo.ts
├── presets/logoProfiles.ts
├── diagnostics/logoDiagnosticsTelemetry.ts
├── diagnostics/LogoDiagnosticsHud.tsx
└── controls/QuickActionsLogoPositionGrid.tsx
```

**Los pasos, en este orden:**

1. Inventariar el dominio (`find -iname '*logo*'`) y listar **todos** los
   importadores antes de tocar nada.
2. Revisar qué importa cada archivo. **El que importa `components/` no se puede
   mover todavía** — moverlo crearía una violación nueva.
3. `git mv` puro, sin editar contenido.
4. Reescribir las rutas de import en los importadores.
5. Escribir `index.ts` con la superficie pública real (mirar los `export` de
   cada módulo, no adivinar).
6. Redirigir a los importadores externos a la fachada; los internos usan rutas
   relativas — un archivo del dominio **nunca** importa su propia fachada.
7. `npx tsc -b`, después `pnpm architecture:check`, después el resto.
8. Tachar del baseline las líneas que la migración eliminó.

**Resultado:** 12 sitios de import actualizados, deuda 39 → 37 aristas (el
render offline de `features/export` ya no baja a `components/audio` a buscar el
logo), 0 violaciones nuevas, 982 tests verdes.

**Trampas que aparecieron** (van a repetirse en los otros dominios):

- Un `sed` masivo hizo que los archivos internos importaran su propia fachada
  → ciclo. Excluir la carpeta del dominio al reescribir imports.
- `LogoDiagnosticsHud` y `QuickActionsLogoPositionGrid` eran `export default`;
  la fachada los expone como **named**. Hay que arreglar cada sitio de import.
- Buscar por nombre da falsos positivos: `logoDiagnosticsHud` también es una key
  del store. Filtrar por `from '...'`, no por el nombre suelto.

**Lo que quedó fuera, a propósito:** `components/controls/tabs/main/LogoTab.tsx`
(769 LOC). Depende de chrome compartido del editor — `UIMode`, `DialogProvider`,
`advancedControls` — que usan ~20 tabs. Moverlo haría que `features/` importara
`components/`, justo lo que el contrato prohíbe. **Ese chrome compartido es la
fase 4a-bis**, y desbloquea la mudanza de la UI de todos los dominios a la vez.
`store/slices/logoSlice.ts` se queda en `store/` — es correcto por §2.

---

## 7. Cómo se verifica

```bash
pnpm architecture:check   # límites de zona + ciclos de runtime
pnpm structure:check      # naming legacy (no vuelve "modern"/"v2")
pnpm docs:check           # drift de documentación
```

`architecture:check` falla si:

1. aparece una arista de zona prohibida que no está en el baseline;
2. aparece un ciclo de runtime nuevo;
3. una entrada del baseline ya no existe (hay que borrarla);
4. falta este documento.

Para agregar una zona o cambiar una regla se edita `FORBIDDEN` en
`scripts/check-architecture.mjs` **y** la sección 2 de este documento. Las dos
cosas o ninguna.
