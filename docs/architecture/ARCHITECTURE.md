# Arquitectura — el contrato

> **Qué es este documento.** No describe cómo está el código; describe cómo
> **tiene que** estar. Cuando el código y este documento no coinciden, gana este
> documento y el código es deuda.
>
> Para "¿dónde edito X hoy?" usá
> [CODEBASE_STRUCTURE.md](CODEBASE_STRUCTURE.md) — ése es el mapa descriptivo.
> Para "¿dónde va lo nuevo?" y "¿qué puede importar qué?", usá éste.
>
> Verificado contra el árbol el **2026-09-05**: 604 archivos, ~135k LOC,
> 2.451 imports, **10 aristas de deuda y 0 ciclos de runtime**.
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
  │ services  services/                          │  ← guardar, cargar,
  │                                              │    restaurar, sincronizar
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
  │ chrome    editor/                            │  ← muebles del editor,
  │                                              │    conectados al store
  └───────────────────────┬──────────────────────┘
                          ▼
  ┌──────────────────────────────────────────────┐
  │ base      lib/ · ui/ · types/ · config/      │  ← hojas: sin React de
  │           utils/ · shaders/                  │    producto, sin store
  └──────────────────────────────────────────────┘

  dev/  vive fuera del grafo: sólo App.tsx puede montarlo (rutas lazy).
```

**Por qué existe `editor/`.** Se estaban confundiendo dos cosas. `ui/` es el
design system: presentación pura, no sabe que este producto existe, se podría
llevar a otra app tal cual. Pero el editor tiene muebles propios —el gate
simple/avanzado, el servicio de diálogos de confirmación, el slider atado a los
defaults de fábrica, el resolvedor de tema— que **necesitan el store**, así que
no pueden vivir en `ui/`, y que usan todos los tabs, así que tampoco pueden
vivir en un dominio. Esa zona faltaba, y su ausencia era exactamente lo que
impedía mover la UI de cada dominio a su carpeta.

`editor/` es la única zona que `features/*` puede importar hacia arriba, y es a
propósito: así un dominio puede ser dueño de su panel del editor sin tocar
`components/`.

**Por qué existe `services/`.** Mismo error, otra capa. `lib/` decía ser
"lógica agnóstica de dominio", pero adentro vivían `projectSettings`,
`wallpaperPersistenceCoordinator` y todo `sync/`: código cuyo trabajo es
_leer y escribir el documento de escena_. Una librería pura no llama a
`useWallpaperStore.getState()`. Esas cinco aristas de deuda no eran descuido,
eran la zona equivocada — y el arreglo no era esconder el import, era admitir
que un servicio de aplicación está **por encima** del store, no por debajo.

`services/` orquesta estado y persistencia, y no renderiza nada: por eso tiene
prohibido `components/`, `pages/`, `ui/` y `context/`. Si algo ahí adentro
necesita JSX, está en la zona equivocada.

### Tabla de reglas (esto es lo que verifica el script)

| Zona                | NO puede importar                                                                       | Por qué                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `types/`            | todo lo demás                                                                           | Es el vocabulario. Si depende de algo, deja de ser vocabulario.           |
| `config/`, `utils/` | `features` `components` `store` `context` `runtime` `pages` `hooks` `lib`               | Helpers de hoja. Reusables en aislamiento o no sirven.                    |
| `ui/`               | `components` `features` `store` `context` `runtime` `pages` `editor`                    | Design system. **No debe saber que este producto existe.**                |
| `editor/`           | `components` `features` `context` `runtime` `pages`                                     | Chrome compartido. Ve el store, nunca un dominio ni la app.               |
| `lib/`              | `components` `context` `runtime` `pages` `hooks` `store` `features` `editor` `services` | Lógica agnóstica de dominio. **Ya no hace persistencia de proyecto.**     |
| `services/`         | `components` `pages` `ui` `context` `editor`                                            | Guardan y cargan el proyecto. Orquestan el store; no dibujan nada.        |
| `features/*`        | `components` `pages`                                                                    | Un motor que importa su propia UI no se puede reusar ni testear headless. |
| `store/`            | `components` `context` `runtime` `pages` `hooks` `ui`                                   | El estado posee datos, no presentación. **Ya está en cero — mantenelo.**  |
| `dev/`              | (nadie lo importa salvo `App.tsx`)                                                      | Laboratorios, no producto.                                                |

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
├── index.ts          ← FACHADA DEL MODELO. Sin React, sin store.
├── render.ts         ← (opcional) el camino de dibujo en canvas
├── ui.ts             ← (opcional) la superficie React del dominio
├── domain/           ← modelo, tipos, invariantes (puro)
├── runtime/          ← motor: cálculo por frame, hidratación de perfiles
├── renderers/        ← dibujo (canvas2d / webgl / dom)
├── effects/
├── controls/         ← la UI del editor de ESTE dominio
├── presets/
└── *.test.ts
```

Tres reglas:

1. **Toda feature necesita fachada.** Nadie de afuera importa un archivo
   interno. Así el interior se puede reordenar sin reescribir medio repo.
2. **La UI del dominio se muda al dominio.** `features/X` puede contener React;
   lo que no puede es importar `components/`.
3. **Un dominio puede tener más de una entrada, pero sólo entradas.**
   Y la separación NO es cosmética — ver abajo.

### 3.1 · Por qué las fachadas se parten en tres

Ésta es la lección más cara de la migración, y las dos mitades se descubrieron
rompiendo cosas, no razonando:

- Poner el **tab del editor** en `index.ts` hizo que `store/featureProfiles` —que
  sólo quiere unos defaults puros— arrastrara el árbol de componentes entero a
  su grafo de módulos. Inicialización circular: **18 suites reventaron al
  importar**, con `DEFAULT_STATE` en `undefined`.
- Poner **`drawSpectrum`** en `index.ts` metió al `store/` en un ciclo consigo
  mismo, porque el renderer lee política de render (`performanceMode`) del
  store: `store → slice → barrel de spectrum → CircularSpectrum → store`.

De ahí las tres entradas, definidas por **quién consume qué**:

| Entrada    | Contiene                             | Quién la importa                     |
| ---------- | ------------------------------------ | ------------------------------------ |
| `./index`  | el modelo. Sin React **y sin store** | `lib/`, `store/`, migraciones, tests |
| `./render` | el camino de dibujo en canvas        | capas del wallpaper, exportador      |
| `./ui`     | la superficie React                  | los shells del editor                |

Regla práctica: **si un módulo alcanza el store, no va en `./index`.** Se
verifica igual que todo lo demás — el ciclo de runtime hace fallar
`architecture:check`.

Corolario incómodo pero honesto: `store/defaultState.ts`, `store/featureProfiles.ts` y
`features/scenes/sceneSlot.ts` importan módulos **profundos** de spectrum a
propósito, saltándose la fachada.

**Resuelto (2026-09-03).** La causa raíz era que la porción spectrum de
`DEFAULT_STATE` vivía en `lib/` en vez de en el dominio. Ahora el dominio es
dueño de sus defaults (`features/spectrum/domain/spectrumDefaults.ts`),
`store/defaultState` los compone en una sola dirección, y los siete imports profundos
son dos aristas normales de fachada. El ciclo desapareció.

Nota: `./render` **no** se fundió de vuelta en `./index`, aunque el ciclo que lo
originó ya no existe. La razón que sobrevive es el peso: `renderers/`,
`geometry/` y `effects/` son ~6.800 LOC que necesitan 7 call sites, mientras
`./index` lo importan 21 — incluido `store/defaultState`, que importa medio proyecto.
Fundirlos haría que todo consumidor de `DEFAULT_STATE` cargue el renderer, que
es exactamente el barrel gordo que rompió 18 suites. El split es **por
consumidor**, no por accidente.

### El estado hoy (2026-09-05)

| Dominio        | Motor + UI en su carpeta | Fachada | Estado                                         |
| -------------- | -----------------------: | :-----: | ---------------------------------------------- |
| **spectrum**   |       80 arch · ~18k LOC |  ✅ ×3  | **migrado** — index + render + ui              |
| **background** |      37 arch · ~8,4k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **lyrics**     |      16 arch · ~3,9k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **stageFx**    |      12 arch · ~2,7k LOC |  ✅ ×1  | **migrado** — sólo ui (ver abajo)              |
| **logo**       |      10 arch · ~1,7k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **particles**  |       4 arch · ~1,4k LOC |  ✅ ×2  | **migrado** — index + ui                       |
| **rain**       |        2 arch · ~340 LOC |  ✅ ×1  | **migrado** — sólo ui (no tiene modelo propio) |
| **export**     |      28 arch · ~4,1k LOC |  ✅ ×2  | **migrado** — index + ui                       |

`components/controls/tabs/` bajó de **31.640 a ~13.100 LOC** — menos de la
mitad. Lo que queda ahí son los _shells_ de composición (`MotionTab`,
`LayersTab`, `SceneTab`, `ExportTabBody`…), que sí pertenecen al editor: apilan
secciones de varios dominios y son dueños del layout de su pestaña, no del
motor de nadie.

**`features/motion/` ya no existe.** Nunca fue un dominio: era el nombre de una
pestaña que apilaba cuatro cosas distintas. Se repartió en `particles`, `rain`
y `stageFx` (§6.4).

**Por qué `stageFx` y `rain` no tienen `index.ts`:**

- `rain` no tiene todavía nada de modelo puro — lo que no es UI es estado del
  store o `components/wallpaper/RainLayer`, que es una capa registrada del motor
  de escena. Cuando aparezca lógica pura, se agrega el `index.ts` y se deja React
  afuera.
- `stageFx` sí tiene modelo (`stageFxConfig.ts`), pero lo importan **~80
  posiciones de tipo inline** `import('...')` desde `types/wallpaper.ts` y
  `store/wallpaperStoreTypes.ts`. Pasarlas por una fachada sería churn sobre
  declaraciones que se borran en build, y tener dos caminos para el mismo
  vocabulario es peor que uno solo claro. Queda deep-import a propósito.

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

| Grupo                          | Aristas | Qué la causa                                                                                              |
| ------------------------------ | ------: | --------------------------------------------------------------------------------------------------------- |
| `types/` → dominios            |       5 | `types/wallpaper.ts` usa `import('...').Foo` inline. Sólo tipos: **se borra en build**, no es ciclo real. |
| `lib/i18n` → `store`           |       1 | El proveedor de idioma lee el locale del store.                                                           |
| `editor/` → `features/stageFx` |       1 | `MotionSharedControls` lleva un control de stageFx adentro.                                               |
| `features/*` → `components`    |       3 | El render offline y flashEdge reusan renderers que viven en la UI viva.                                   |
| **Total**                      |  **10** | 0,4 % de las aristas del grafo.                                                                           |

**Ciclos de runtime conocidos: 0.** ✅ `KNOWN_CYCLES` está vacío en el script y
la idea es que siga así: si vas a agregar una entrada ahí, mové los valores
compartidos al dominio en vez.

### De 37 a 10

| Momento                       | Aristas | Qué la bajó                                             |
| ----------------------------- | ------: | ------------------------------------------------------- |
| Baseline inicial (2026-09-02) |      37 | —                                                       |
| Tras logo/spectrum/lyrics     |      22 | fachadas + `editor/` + defaults propios de cada dominio |
| Tras export (§6.5-1)          |      20 | `controlPanelResetKeys` → `config/`                     |
| Tras `services/` (§6.5-2)     |      15 | persistencia de proyecto fuera de `lib/`                |
| Tras `DEFAULT_STATE` (§6.5-3) |  **10** | el documento de fábrica a `store/`                      |

**Ninguno de esos saltos fue contabilidad.** Cada uno movió un archivo a la zona
que de verdad le corresponde, y la arista desapareció como consecuencia. Un
baseline se puede "arreglar" agregando líneas; eso no es lo que pasó acá.

### Las 10 que quedan, y por qué

Las cinco de `types/` son posiciones de tipo, erased en build. Una de ellas
**no se arregla moviendo archivos**, y conviene saberlo antes de intentarlo:
los tipos de perfil son `Pick<WallpaperState, typeof CIERTAS_KEYS[number]>`,
derivados de la misma interfaz que después los guarda en sus campos de slot.
Los arrays de keys son valores de runtime (manejan extract/build), así que no
pueden vivir en `types/`, y `WallpaperState` no puede describir un slot sin
ellos. Es circularidad de vocabulario, no de código.

Las tres de `features/* → components` son el exportador offline reusando
`audioLayerFrameRenderer`, más `flashEdge` reusando `imageCanvasShared`.
Desenredarlas significa **promover las capas de audio a dominio propio**, porque
`overlayLayerRegistry` dibuja a través de `TrackTitleOverlay` y
`NowPlayingWidget`. Ése es el próximo dominio de la lista, no un parche.

> **Lectura honesta:** la dirección de dependencias ya está **bien** — 10
> aristas malas sobre 2.451 imports, y las que quedan tienen cada una un motivo
> escrito. El problema nunca fue acoplamiento descontrolado sino **dispersión de
> ownership** (§3).

---

## 6. Plan de migración

Sin features nuevas mientras esto corre.

| Fase                        | Qué                                                                                                  | Estado   |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| **1 · Arqueología**         | Grafo real, imports cruzados, ciclos, dispersión por dominio.                                        | ✅ hecho |
| **2 · Contrato**            | Este documento.                                                                                      | ✅ hecho |
| **3 · Guardrail**           | `scripts/check-architecture.mjs` + `pnpm architecture:check` con baseline congelado.                 | ✅ hecho |
| **4a · Zona `editor/`**     | Extraer el chrome compartido (§2). Desbloqueó todo lo demás.                                         | ✅ hecho |
| **4b · Fachadas**           | Los ocho dominios grandes tienen fachada. Las features chicas siguen con deep-import a propósito.    | ✅ hecho |
| **4c · Migración vertical** | `logo`, `spectrum`, `lyrics`, `background`, `particles`, `rain`, `stageFx` y `export` en su carpeta. | ✅ hecho |
| **4d · Zonas correctas**    | Nace `services/`; `DEFAULT_STATE`, `featureProfiles`, `presets` y `backgroundImages` van a su zona.  | ✅ hecho |
| **5 · Simplificación**      | Edge Glow + huérfanos borrados (§7). Queda una decisión de producto: los presets globales (§7.5).    | ✅ hecho |

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

**Lo que quedó fuera en la primera pasada:** `LogoTab.tsx` (769 LOC), porque
dependía del chrome compartido. Al crear `editor/` (§2) dejó de estar bloqueado
y se movió. `store/slices/logoSlice.ts` se queda en `store/` — correcto por §2.

### 6.2 · `spectrum` y `lyrics` (2026-09-03)

Mismo procedimiento, dos escalas distintas.

**spectrum** — 46 archivos movidos en dos pasos: primero la UI
(`tabs/spectrum/**` + `SpectrumTab` + los 3 HUD + `CircularSpectrum`), después
los 24 archivos sueltos de la raíz del dominio a `domain/` y `presets/`.
Resultado: `features/spectrum/` con 10 subcarpetas y tres fachadas.

**lyrics** — 16 archivos. `LyricsOverlay.ts` (1.334 LOC) vivía en
`components/audio/`; los helpers de texto en canvas que compartía con
TrackTitle (`trackTextTreatment`, `textRenderCache`, `trackFonts`,
`trackTitleOptions`) eran genéricos y bajaron a `lib/canvasText/`.

**Trampas nuevas** (además de las de §6.1):

- El codemod reescribe las aristas que **entran** a un archivo movido, pero no
  las rutas relativas que **salen** de él hacia archivos que no se movieron.
  Rompió 9 imports en spectrum. Hay un `fix_relatives` para eso; correlo
  siempre después de mover.
- Dos tests leen archivos fuente **por ruta**, no por import
  (`spectrumHudTarget.test.ts`, `spectrumPanelKeyCoverage.test.ts`). Ningún
  codemod los arregla: hay que editar los literales a mano.
- La partición de fachadas de §3.1 se descubrió acá, a los golpes.

### 6.3 · Cierre de spectrum (2026-09-03)

Los dos ítems que quedaban del dominio más grande, hechos antes de las mudanzas
grandes — a propósito: **primero se aprieta el guardrail, después se mueve**.

**Defaults al dominio.** `DEFAULT_SPECTRUM_STATE` ahora vive en
`features/spectrum/domain/spectrumDefaults.ts` y `store/defaultState` lo _compone_ en
una sola dirección. Eso mató el último ciclo de runtime y colapsó 7 imports
profundos en 2 aristas de fachada.

> Hallazgo del camino: **ocho keys de rotación de spectrum estaban tiradas al
> final de `DEFAULT_STATE`**, bajo un título "Task 1", a ~140 líneas del
> `spectrumRotationSpeed` que modifican. Nadie las iba a encontrar ahí. Ahora
> están con el resto.

**El renderer ya no lee el store.** `drawSpectrum` recibe un
`SpectrumRenderPolicy` en vez de llamar a `useWallpaperStore.getState()`. Nada
bajo el camino de dibujo importa `store/`, así que el renderer es una función
pura de sus argumentos y el exportador offline puede elegir su propia calidad sin
tocar el estado vivo.

**`render.ts` se queda igual.** El plan decía fundirlo de vuelta en `index.ts`,
pero al hacer el trabajo quedó claro que el ciclo era sólo _una_ de sus dos
razones. La otra —el peso— sigue viva. Ver §3.1.

### 6.4 · `background` y `motion` (2026-09-03)

**`background`** siguió la plantilla de §6.1 sin sorpresas: 36 archivos, con
`domain/` (la matemática de encuadre), `slideshow/` (playback + el controlador
montado) y `controls/` (las 28 pantallas de `tabs/bg/`). Tres aristas de deuda
desaparecieron en vez de mudarse.

Lo interesante fue **lo que decidí no mover**, porque es la parte que se olvida:

| Candidato                                       | Por qué se queda afuera                                                                                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallpaper/layers/imageCanvasBackground*`       | Dibujan el fondo, pero son _plugins_ del motor de capas (`imageCanvasShared`), que también sirve a los overlays. Moverlos cambia una arista `components → features` por una `features → components`.                          |
| `lib/backgroundPalette`, `useBackgroundPalette` | Se llaman "background" pero 18 y 10 módulos los usan como **fuente de color**, desde stageFx hasta lyrics. Infraestructura compartida, no estado del dominio.                                                                 |
| ~~`lib/backgroundImages`~~                      | **Desbloqueado y movido** (§6.6). Estaba trabado porque cuatro consumidores colgaban de `lib/projectSettings`; en cuanto ése se fue a `services/`, la arista dejó de existir y el archivo pudo irse a `features/background/`. |

**`motion` se repartió, no se movió.** Nunca fue un dominio: era el nombre de una
pestaña que apilaba partículas, rain, stage lights y camera fx. Cada sección se
fue a su dueño real y `features/motion/` dejó de existir. Su único archivo,
`motionRandomizer.ts`, era en realidad un randomizador de **partículas** — su
propio comentario dice que rain y stage FX quedan intactos.

`MotionTab.tsx` se queda en `tabs/main/`: una pestaña que compone tres dominios
es un _shell_, no un dominio, y ahora trae cada sección por la fachada de su
dueño. Esa es la regla general para las pestañas que quedan ahí.

### 6.6 · `export` y las zonas correctas (2026-09-05)

La última ronda cerró los tres items que quedaban del roadmap, y las tres
tienen la misma forma: **el archivo estaba en la zona equivocada, y la arista
de deuda era el síntoma, no la enfermedad.**

**`export`.** Doce archivos salen de `tabs/export/` a
`features/export/controls/`, con fachadas `index` (modelo puro: selección,
plan, nombres de archivo) y `ui` (los ocho paneles y sus cuatro hooks).
`ExportTabBody` pasa de once imports a dos. El shell se queda en `tabs/`
porque componer secciones **es** trabajo de editor.

De paso, `controlPanelResetKeys.ts` —684 líneas de "qué keys del store son de
qué pestaña", un solo `import type`, cero React— se fue a `config/`. Vivía bajo
`components/` sólo porque el panel de control fue su primer consumidor, y por
eso `features/export` tenía que subir a `components/` a buscar una tabla de
constantes.

**`services/`.** `lib/` decía ser "lógica y persistencia agnósticas de
dominio", pero adentro vivían `projectSettings`,
`wallpaperPersistenceCoordinator` y todo `sync/`: código cuyo trabajo es leer y
escribir el documento de escena. Una librería pura no llama a
`useWallpaperStore.getState()`.

Ahí también salió a la luz que `restoreWallpaperAssets` **nunca fue un hook**:
era una función async de 200 líneas compartiendo archivo con el efecto de cinco
líneas que la llama. Tres consumidores queriendo esa función era toda la razón
por la que `lib/` subía a `hooks/`.

**`DEFAULT_STATE`.** `lib/constants.ts` es ahora `store/defaultState.ts`. El
nombre importa: no era una bolsa de constantes, era **el documento de escena de
fábrica**, armado con los defaults de cada dominio. Como `store/` sí puede
importar dominios, las cinco aristas se evaporaron sin tocar una línea de
lógica. Con él se movieron `featureProfiles` (a `store/`), `factoryDefaults` (a
`store/`), `presets` (a `features/presets/`) y `backgroundImages` (a
`features/background/`, desbloqueado por fin).

**Deuda 22 → 10.** Verificado en vivo además de en CI: el store hidrata con 767
keys en v108, los slots de perfil se construyen desde su nueva ubicación, y las
ocho secciones de Export montan por la fachada nueva sin un error de consola.
Esa verificación no era opcional — mover `DEFAULT_STATE` toca el orden de
inicialización, que es exactamente lo que una vez rompió 18 suites de test.

---

### 6.5 · Lo que sigue

Los tres items que encabezaban esta lista están **hechos** (2026-09-05):

1. ~~`export`~~ — último dominio grande sin fachada. Ahora tiene `index` + `ui`,
   y `controlPanelResetKeys` se fue a `config/`, que es lo que siempre fue.
2. ~~Sacar `projectSettings` y `wallpaperPersistenceCoordinator` de `lib/`~~ —
   nació `services/` (§2) y se llevó también todo `sync/`.
3. ~~`DEFAULT_STATE` fuera de `lib/`~~ — `lib/constants.ts` es ahora
   `store/defaultState.ts`, con el nombre que le correspondía: no es una bolsa
   de constantes, es el documento de escena de fábrica.

Lo que sigue de verdad, en orden:

1. **Promover las capas de audio a dominio.** `components/audio/layers/` es un
   motor de canvas completo —`audioLayerFrameRenderer`, `overlayLayerRegistry`,
   `coverImageCache`— viviendo en zona de presentación. Es la causa de las
   últimas 3 aristas `features/* → components` y un bloqueo real del exportador
   offline, que hoy tiene que importar hacia arriba para dibujar un cuadro.
   El nudo: `overlayLayerRegistry` dibuja a través de `TrackTitleOverlay` y
   `NowPlayingWidget`, así que el dominio se lleva esos dos.
2. **Decidir los presets globales** (§7.5). `features/presets/presets.ts` ya
   está en el dominio correcto; lo que falta es producto, no arquitectura.
3. **`MotionSharedControls`** — partir `FxBandThresholdControls` hacia
   `features/stageFx/controls` borra la única arista `editor/ → features`.

---

## 7. Hallazgos: código muerto — resueltos y pendientes

Auditoría re-medida el 2026-09-04 con **alcance real desde los puntos de
entrada** (`src/main.tsx` + los 78 tests), no por coincidencia de nombres. Ese
cambio de método corrigió un error de la pasada anterior — ver 7.4.

### 7.1 · Edge Glow: BORRADO ✅

Un subsistema completo que nada podía alcanzar, reemplazado en su día por
"Flash Edge" y nunca retirado. Se eliminó entero:

| Pieza                              |     LOC | Destino                 |
| ---------------------------------- | ------: | ----------------------- |
| `EdgeGlowSection.tsx`              |     360 | borrado                 |
| `edgeGlowRenderer.ts`              |     317 | borrado                 |
| `edgeGlowDefaults.ts` / `Types.ts` |      90 | borrado                 |
| `bgEdgeGlow*` / `logoEdgeGlow*`    | 28 keys | borradas + migración    |
| setters                            |      28 | borrados                |
| bloque de migración                |     116 | borrado                 |
| `sfx_edge_glow_*` + ruta de audio  | 20 keys | borradas de `en` y `es` |

**La fila que mentía también se fue.** `AudioRoutingSection` —panel vivo—
listaba "BG Edge Glow" con estado sacado de `bgEdgeGlowEnabled` y mandaba al
usuario al tab Presets. Ninguna UI podía encender ese flag y ningún renderer lo
leía: la fila estaba **siempre** apagada y apuntaba a un control inexistente.

**Lo que NO se tocó, a propósito:** `flashEdgeRenderer` + `FlashEdgeSection`
(vivos, montados en Background y Logo → Finish) y `layer.edgeGlow`, el número
por capa que `OverlayInspector` sí lee. Sus etiquetas `sfx_edge_glow` y
`label_edge_glow` se conservan.

`features/edgeGlow/` pasó a llamarse **`features/flashEdge/`**: con Edge Glow
fuera, la carpeta sólo contiene Flash Edge.

### 7.2 · Otros huérfanos borrados ✅

Superseded por algo vivo, verificado caso por caso:

| Archivo                             | LOC | Lo reemplazó                        |
| ----------------------------------- | --: | ----------------------------------- |
| `TimestampTimeline.tsx`             | 412 | `ActiveWallpaperSection` (inline)   |
| `AudioOverlay.tsx`                  | 126 | `WallpaperViewport` + registry      |
| `lib/textures.ts`                   |  76 | nada carga texturas THREE           |
| `ImageUploader.tsx`                 |  44 | el pool de imágenes                 |
| `AudioTabSections.tsx`              |  37 | envoltorios de `TabSection` sin uso |
| `discovery/recentIds` + `constants` |  15 | nunca se cablearon                  |
| `spectrumFxTypes.ts`                |   6 | alias de tipo sin uso               |
| `scanlineFragment.glsl`             |   — | shader huérfano (Looks usa canvas)  |
| `rgbSplitFragment.glsl`             |   — | shader huérfano                     |

**Keys persistidas borradas** (setter sin lector, viajaban en cada proyecto):
`particleScanlineIntensity` / `Spacing` / `Thickness` — `ParticleField` nunca
supo qué es una scanline; las de _Looks_ (`scanlineIntensity`, sin prefijo) son
otra cosa y siguen vivas —, `audioSelectedChannelSmoothing` y
`quickEditHudEnabled`.

Todo eso se limpia de los proyectos guardados en la migración **v107 → v108**,
verificada en navegador sembrando un blob v107 real, no sólo en unit test.

### 7.3 · Se QUEDA: andamiaje de backend y exportador (~890 LOC)

Inalcanzable hoy, pero **no es basura**: es trabajo a medio terminar que el
proyecto va a necesitar. No borrar.

- **`lib/sync/remoteSyncRepository.ts` (175 LOC)** — la mitad remota del
  contrato `SyncRepository`. Tiene backend real detrás: `backend/schema/001_init.sql`
  (Postgres), `backend/server/` (Express) y `docker-compose.yml`. El adaptador
  local de IndexedDB ya mueve la librería de proyectos; falta cablear el remoto.
- **La isla del exportador offline (~715 LOC)** — `runOfflineRenderTest`,
  `renderFrame`, `renderSubsystem(s)/`, `buildRenderContext`,
  `offlineAudioLayerRenderer`, `getRenderStateSnapshot`, `debugRenderSync`. El
  **planificador** sí está vivo (`OfflineExportSection` usa `offlineExportPlanner`);
  lo que falta cablear es la mitad que dibuja los cuadros.
- **`utils/debug.ts` (98 LOC)** — logger dev-only con coste cero en producción.
  Herramienta, no producto: se queda hasta que alguien decida que no la quiere.
- **`spectrum/effects/spectrumDrawOrder.ts` (27 LOC)** — es **documentación con
  forma de código**: define el contrato de orden de pasadas de Classic Wave y
  `echoTrace` lo cita por nombre. Borrarlo por métrica de LOC sería tirar
  conocimiento.
- `vite-env.d.ts` — tipos ambientales; nunca se importa por diseño.

### 7.4 · Corrección de la auditoría anterior

**`editor/MotionSharedControls.tsx` NO está muerto.** La pasada anterior lo dio
por "cero importadores en todo el repo" y lo señaló como el borrado más seguro
de la lista. Es falso: **lo importan 13 archivos** —las secciones de particles,
rain, stageFx y flashEdge— y es el proveedor vivo de `MotionSlider`,
`SwitchRow`, `OptionButtonGroup` y `ProfileSlotsGrid`.

El error vino del método: se buscó por nombre en vez de resolver el grafo de
imports. Por eso esta pasada se hizo con alcance real desde los puntos de
entrada. La lección vale más que el hallazgo: **una lista de código muerto que
no se calcula sobre el grafo no es evidencia, es una corazonada**.

Con eso cae también el punto de "duplicación" del §7.4 viejo: `advancedControls`
y `MotionSharedControls` no son una copia viva y otra muerta — son dos módulos
vivos con solapamiento parcial. Unificarlos sigue valiendo la pena, pero es
refactor, no limpieza.

`performanceModeBeforeSafe` tampoco estaba muerto: `systemSlice` lo escribe al
entrar en modo seguro y lo lee al salir.

### 7.5 · Pendiente de decisión: el sistema de presets globales

`components/controls/PresetSelector.tsx` (205 LOC) no lo monta nadie, **pero el
sistema que hay debajo sigue vivo**: `usePresetDirtyTracker` corre, `systemSlice`
mantiene `applyPreset` / `saveCustomPreset`, y `activePreset` / `isPresetDirty`
se persisten y se resetean en `projectSettings`.

Es la categoría opuesta a Edge Glow: allí no había ni UI ni renderer; aquí hay
**motor vivo sin volante**. Borrar el selector dejaría el sistema inalcanzable
para siempre — que es exactamente cómo nació Edge Glow. Las dos salidas honestas
son montarlo otra vez o retirar el sistema entero a conciencia. Es decisión de
producto, no de arquitectura.

Igual con **167 keys i18n sin referencia directa** (`en.ts` y `es.ts` mantienen
paridad exacta, ahora 1.730 cada uno): el conteo no cubre accesos dinámicos
`t[variable]`, así que verificar antes de borrar.

---

## 8. Cómo se verifica

```bash
pnpm dead:check           # módulos que nada alcanza (grafo, no grep)
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
