# Plan: potenciar los subsistemas que ya existen

**Fecha:** 2026-09-04 · **Estado:** propuesta, nada implementado

Este documento **no propone subsistemas nuevos**. Cada punto aprovecha máquina
que ya está escrita y probada en el repo. El criterio de orden es
_payoff / esfuerzo_, y cada afirmación de "esto ya existe" está verificada
contra el código, no recordada.

> Contexto: viene después de borrar Edge Glow y ~1.988 líneas muertas
> (§7 de `architecture/ARCHITECTURE.md`). La pregunta que responde es la
> contraria a la de esa limpieza: **qué tenemos construido que no estamos
> usando**.

---

## Resumen

| #   | Propuesta                              | Esfuerzo | Por qué es barato                          |
| --- | -------------------------------------- | -------- | ------------------------------------------ |
| 1   | Terminar el exportador offline         | Alto     | ~715 LOC ya escritas, sólo sin cablear     |
| 2   | Rain V2 = partículas de racha          | Medio    | TODO del propio código; borra un renderer  |
| 3   | Explotar el time-domain (waveform)     | Bajo     | Plumbing completo, **1 solo consumidor**   |
| 4   | Transiciones más allá del fade         | Medio    | Dominio + enum de 6 subsistemas ya existen |
| 5   | Cablear el adaptador remoto de sync    | Medio    | Backend Postgres + Express ya está         |
| 6   | Decidir el sistema de presets globales | Bajo     | Motor vivo, sin volante                    |

---

## 1 · Terminar el exportador offline

**Es el desbloqueo más grande del repo y ya está a cuatro quintos.**

Verificado: `OfflineExportSection` (UI viva) usa `offlineExportPlanner` y
`offlineAudioAnalysis` — o sea, la app **ya sabe planificar** una exportación:
resoluciones, fps, capacidades del navegador, plan de audio, diagnóstico de
problemas. Lo que no está cableado es la mitad que **dibuja**:

```
features/export/  (isla inalcanzable, ~715 LOC ya escritas)
  runOfflineRenderTest.ts        99   el runner
  renderFrame.ts                 26   dibuja el cuadro N
  renderFrameContext.ts          49   contexto por cuadro
  buildRenderContext.ts          60   arma el contexto
  renderSubsystem.ts             53   registro de subsistemas
  renderSubsystems/*            198   audioLayers + stubs + index
  offlineAudioLayerRenderer.ts  164   capas de audio fuera de pantalla
  getRenderStateSnapshot.ts      45   congela el estado
  debugRenderSync.ts             77   comparador live-vs-offline
```

Que exista `debugRenderSync` es la señal de que quien lo escribió ya estaba
pensando en el problema difícil: **que el cuadro offline sea idéntico al vivo**.
Y el trabajo de esta semana lo acerca: `drawSpectrum` ya no lee el store, recibe
`SpectrumRenderPolicy` — justo lo que necesita un exportador para elegir su
propia calidad sin tocar el estado en vivo.

**Qué falta**: registrar los subsistemas reales (hoy hay `stubs.ts`), decidir el
encoder (WebCodecs `VideoEncoder` es el camino), y conectar el runner al plan.

**Payoff**: todo lo que la app dibuja en vivo pasa a poder hornearse a vídeo
determinista. Para un producto de wallpapers reactivos, eso no es una feature
más: es la que convierte el editor en herramienta de entrega.

---

## 2 · Rain V2 = partículas de racha

El propio código lo pide, en la línea 2 del archivo:

```
src/components/wallpaper/RainLayer.tsx:2
// TODO (V2): fold into the Particles emitter path (streak particles).
```

Hoy la lluvia está **deliberadamente congelada en "clásica"**: tipos de gota,
color sólido o arcoíris, y se acabó. Al lado, el emisor de partículas tiene
drift (velocity/offset/burst), depth flow con 4 comportamientos y 6 orígenes de
spawn, 9 formas, rotación, 4 modos de color y filtros propios.

**Convertir la lluvia en un preset del emisor de partículas** le regala todo eso
de golpe, sin inventar un concepto nuevo, y **elimina un renderer entero** más
sus shaders. La lluvia pasa a ser "partículas alargadas con gravedad y viento",
que es lo que siempre fue.

**Cuidado**: `rainProfileSlots` está persistido y hay escenas ligadas. Necesita
migración que convierta cada slot de lluvia en un slot de partículas — hay
precedente exacto en `wallpaperStoreMigrations` (v96 ya rescató el bundle legacy
de Motion hacia slots de particles + rain).

---

## 3 · Explotar el time-domain — lo más barato de la lista

**Este es el hallazgo que más me sorprendió al medir.** La forma de onda cruda
está cableada de punta a punta:

```
getTimeDomainBins()  →  FileAudioAnalyzer, MicrophoneAnalyzer,
                        DesktopAudioAnalyzer, AudioMixEngine
                     →  useAudioSnapshotRuntime → AudioDataContext
                     →  el snapshot que recibe TODO renderer
```

Y la consume **un solo renderer**: `oscilloscopeRenderer`. Todo lo demás en la
app dibuja a partir de la FFT (barras por banda). La onda ya viaja en cada
cuadro, gratis, y casi nadie la mira.

Ideas que no necesitan plumbing nuevo:

- **Onda como máscara del fondo.** El wallpaper ya sabe cubrir la pantalla
  (`resolveCoveredImageTransform`); usar la onda como desplazamiento por columna
  hace que **la imagen misma ondule** con el audio, en vez de tener barras
  encima. Es un look que hoy no existe en la app.
- **Onda en el backdrop de las letras.** Lyrics ya tiene backdrop con 5 modos de
  color; recortarlo con la onda ata la letra al sonido sin añadir una capa.
- **Fase-scope**: la onda contra una copia retrasada de sí misma dibuja figuras
  tipo Lissajous. Un Lissajous **estéreo** de verdad sí costaría —
  `getTimeDomainBins()` devuelve un `Uint8Array` mono y haría falta un segundo
  analizador— pero la versión con retardo es gratis y se parece.
- **Onda dentro del `echoTrace` del spectrum.** El rastro por cuadros ya está
  implementado; alimentarlo con la onda da un look de cinta/delay.

**Por qué lo pongo tercero y no primero**: es el de mejor relación
resultado/esfuerzo, pero 1 y 2 cambian lo que el producto _puede hacer_, no sólo
cómo se ve.

---

## 4 · Transiciones más allá del fade

`features/visualTransition/` ya es un dominio con coordinador propio y test. El
tipo ya está preparado para más de lo que hace:

```ts
type VisualTransitionSubsystem =
	'spectrum' | 'particles' | 'rain' | 'looks' | 'logo' | 'scene';

type VisualTransitionSnapshot = {
	…  durationMs: number;  easing: 'smoothstep';
	subsystems: VisualTransitionSubsystem[];
};
```

Seis subsistemas declarados, **un solo easing**, y lo único implementado es
`useVisualTransitionFade`. Transiciones que reutilizan matemática que ya existe:

- **Zoom-through** — reusa la envolvente de bass zoom + el transform de cobertura.
- **Mirror-wipe** — reusa el camino de clones de Mirror Fill (`seamOverlap=1px`,
  eje Y) para barrer de un fondo al siguiente.
- **Glitch-slice** — reusa la pasada de RGB split que ya tiene el spectrum.

Encaja con el modelo scene-first (`defaultSceneSlotId`): cambiar de escena deja
de ser un corte y pasa a ser parte del show.

---

## 5 · Cablear el adaptador remoto de sync

`backend/` no es una carpeta de intenciones: tiene `schema/001_init.sql`
(Postgres, proyectos como `jsonb` versionado + metadatos de assets con hash de
contenido), `server/` en Express con rutas de proyectos y de SceneIntent, y
`docker-compose.yml`. Del lado app, `SyncRepository` está definido, el adaptador
local de IndexedDB **ya mueve la librería de proyectos**, y
`remoteSyncRepository.ts` implementa el mismo contrato — sólo que nadie lo
instancia todavía.

El propio archivo deja escrita la frontera honesta: hasta elegir un object
storage, `getAsset` devuelve `null` y `putAsset` sólo registra metadatos, así que
**los bytes siguen viniendo del repositorio local**. Eso hay que resolverlo antes
de prometer "mis proyectos en la nube".

Lo que falta antes de enchufarlo: autenticación (en AI Director sigue siendo un
stub), object storage para los blobs, y política de merge/conflicto por encima
del repositorio, no dentro.

---

## 6 · Decidir el sistema de presets globales

`PresetSelector.tsx` (205 LOC) no lo monta nadie, **pero el motor debajo está
vivo**: `usePresetDirtyTracker` corre, `systemSlice` mantiene `applyPreset` /
`saveCustomPreset` / `duplicatePreset` / `revertToActivePreset`, y
`activePreset` / `isPresetDirty` se persisten y se resetean al importar.

Es la categoría **opuesta** a Edge Glow: allí no había ni UI ni renderer; aquí
hay motor sin volante. Y ojo —

> Borrar la única UI de un sistema vivo es **exactamente** cómo nació Edge Glow.

Dos salidas honestas, ninguna es "dejarlo así":

1. **Montarlo otra vez**, seguramente dentro de Scene, donde el usuario ya piensa
   en "estados guardados del wallpaper".
2. **Retirar el sistema entero** a conciencia — selector, acciones, tracker y
   keys — asumiendo que Scenes + Setlists ya cubren esa necesidad.

La sospecha razonable es que Scenes lo reemplazó de hecho pero nunca de derecho.
Mientras no se decida, `usePresetDirtyTracker` sigue comparando estado contra
presets que nadie puede aplicar.

---

## Lo que NO propongo, y por qué

- **Unificar `advancedControls` con `MotionSharedControls`.** Se solapan, pero
  los dos están vivos (13 archivos importan el segundo). Es refactor de
  ergonomía, no limpieza, y no cambia nada para el usuario.
- **Una envolvente de audio compartida.** Ya la hay y ya está adoptada:
  `createAudioEnvelope` la usan partículas, logo, spectrum, calibración y el
  zoom de fondo. Es de las cosas que salieron bien.
- **Un tercer spectrum.** El modelo es un array con ids, así que técnicamente
  cabe — pero la UI de ownership S1/S2 costó tres sprints y sumar S3 multiplica
  esa superficie antes de que nadie haya pedido S3.
