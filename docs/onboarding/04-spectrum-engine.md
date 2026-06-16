# Nivel 04 — El motor del espectro (el subsistema más grande)

> Requisitos: [Nivel 02](./02-pipeline-render.md) (cómo dibujan los lienzos)
> y [Nivel 03](./03-audio.md) (bins, canales, AudioSnapshot). El spectrum es
> el mayor consumidor de ambos.
>
> Números para situarte: `src/features/spectrum/` tiene **27 archivos y
> ~10.500 líneas**. Es, con diferencia, el subsistema más grande del
> proyecto. Pero tiene un mapa claro — vamos a dibujarlo.

---

## 0. Lo que vas a entender al terminar

1. Qué es el "spectrum" exactamente y por dónde entra al pipeline.
2. Las **6 familias** de visualización y el **registro** que las gobierna
   (el patrón más importante del subsistema).
3. Cómo se separan **ajustes** (settings) de **memoria de trabajo**
   (runtime), y por qué eso hace posible el clon.
4. Los **efectos de cuadro** (bloom, estelas, shockwaves) que se pintan
   alrededor de cualquier familia.
5. El **clon**, los **modos de drive** (incluido tocar el espectro con el
   teclado), y las transiciones suaves entre estilos.

---

## 1. Qué es y por dónde entra

El "spectrum" es la visualización del sonido: las barras que suben con la
música, el túnel que pulsa, la onda líquida… Recapitulando el pipeline:

```
AudioSnapshot (Nivel 03)
      │
AudioLayerCanvas (Nivel 02) — el lienzo full-screen de la capa 'spectrum'
      │  en cada cuadro llama a…
      ▼
drawSpectrum()  ←  src/components/audio/CircularSpectrum.ts (575 líneas)
      │  el "capataz" del motor: prepara todo y despacha a…
      ▼
src/features/spectrum/  ←  el motor: familias, renderers, runtime, efectos
```

Un apunte de nombres: `CircularSpectrum.ts` se llama así por razones
históricas (empezó siendo solo el espectro circular), pero hoy es **el
capataz de TODOS los estilos**, circulares o no. No te despiste el nombre.

---

## 2. Las 6 familias y el registro

Una **familia** es una forma fundamentalmente distinta de visualizar el
sonido. No es "otro color": es otro algoritmo de dibujo. Están declaradas en
`spectrumFamilyRegistry.ts` (394 líneas):

| Familia          | Qué dibuja                                                                                             | Particularidad                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **classic**      | Las barras/bloques/onda/puntos de toda la vida, en modo **lineal** (una fila) o **radial** (un anillo) | La única con dos modos de colocación; la más configurable                     |
| **oscilloscope** | La **onda cruda** del sonido, como un osciloscopio de laboratorio                                      | La única que consume `timeDomain` en vez de bins (Nivel 03)                   |
| **tunnel**       | Anillos concéntricos que se hunden en profundidad                                                      | Controles propios de túnel: nº de anillos, espaciado, paredes, pulso          |
| **liquid**       | Ondas senoidales apiladas que "respiran"                                                               | **3 capas independientes**, cada una con su opacidad/amplitud/velocidad/forma |
| **orbital**      | Partículas orbitando                                                                                   | La giratoria rápida                                                           |
| **spiral**       | Los bins brillando a lo largo de una espiral logarítmica                                               | Controles de vueltas, brazos, apriete                                         |

### El patrón registry (apréndetelo: aparece en todo el proyecto)

El comentario de cabecera del registro lo dice mejor que nadie: es la
**única fuente de la verdad de todo lo que depende de la familia**. Para cada
familia declara:

1. **Capacidades** (`spectrumFamilyCapabilities.ts`): qué controles aplican.
   ¿Tiene sentido "peak hold" en liquid? No → el panel de UI ni lo muestra.
   Así la interfaz se adapta sola a la familia elegida, sin un bosque de
   `if (familia === ...)` repartido por las pestañas.
2. **Categorías** (geometric/temporal/depth/generative/analytic): etiquetas
   para agrupar en el selector. Sin comportamiento.
3. **La función renderer** y su **"render kind"**: qué función dibuja y qué
   argumentos espera (classic se desdobla en `classic-linear` y
   `classic-radial`).
4. **Presets opcionales** (los bundles de liquid y tunnel).

> **Analogía:** el registro es el **expediente de cada empleado** en RRHH:
> qué sabe hacer, en qué departamento está, a qué teléfono llamarlo. Cuando
> llega trabajo nuevo, nadie improvisa: se consulta el expediente. **Añadir
> una familia nueva = añadir un expediente**, no tocar tres sitios con
> condicionales.

Los renderers viven cada uno en su carpeta:
`renderers/{linear,radial,oscilloscope,tunnel,liquid,orbital,spiral}/`. Los
dos clásicos son los gordos (~860 líneas cada uno) porque cada uno implementa
4 estilos (bars/blocks/wave/dots) con espejo, peak hold, etc.

---

## 3. Settings vs. runtime: los planos y la mesa de trabajo

En `runtime/spectrumRuntime.ts` vive una separación crucial. El motor maneja
dos tipos de datos y NO los mezcla:

- **`SpectrumSettings`** — los **planos**: un subconjunto de ~119 cajones del
  store (todo lo `spectrum*`). Es de solo lectura para el motor: dice cómo
  debe verse.
- **`SpectrumRuntimeState`** — la **mesa de trabajo**: la memoria que el
  motor necesita _entre cuadro y cuadro_ para que el movimiento sea suave:
  las alturas actuales de cada barra (`pixelHeights`), los picos retenidos
  (`pixelPeaks`), el historial de frames para las estelas, los snapshots de
  transición… Nada de esto se guarda ni pasa por React: vive en un mapa en
  memoria.

Y aquí la clave: ese mapa se indexa por **`instanceKey`**
(`getSpectrumRuntimeState(instanceKey)`). Cada instancia del espectro pide su
propia mesa de trabajo por nombre: la principal usa `'primary'`, el clon usa
`'clone-circular'`. **Dos espectros = dos mesas independientes** = sus
animaciones no se contaminan entre sí. Así es como el clon existe sin
duplicar el motor.

> **Analogía:** la receta (settings) puede ser la misma, pero cada cocinero
> tiene **su propia mesa** con sus cacerolas a medio hacer (runtime). Si
> compartieran mesa, se pisarían las salsas.

`runtime/spectrumPlacement.ts` resuelve la geometría de colocación (dónde
queda el centro, el radio, el "sigue al logo"), y
`runtime/spectrumProfileHydrate.ts` rellena perfiles guardados con valores
por defecto cuando les faltan campos (el mismo espíritu del normalizador de
migraciones del Nivel 01).

---

## 4. El cuadro de un espectro, paso a paso

Qué hace `drawSpectrum()` en cada cuadro (simplificado pero fiel):

1. **Resuelve el drive:** ¿de dónde salen las alturas? (sección 6).
2. **Muestrea los bins** según el canal elegido
   (`lib/audio/spectrumBinSampling.ts`): reparte las franjas de frecuencia
   entre las N barras configuradas.
3. **Suaviza por barra** contra la mesa de trabajo (`pixelHeights`): cada
   barra persigue su valor objetivo con la suavidad configurada — por eso no
   tiemblan.
4. **Si es radial con espejo:** aplica el **fold** (`applyRadialMirrorFold`):
   pliega las alturas para que el anillo sea simétrico respecto al eje
   vertical. (Funciona para todas las familias de bins; el oscilloscope
   radial no está cubierto, y liquid "rígido" no aplica por diseño.)
5. **Pinta los efectos de fondo** (frame memory, sección 5).
6. **Despacha al renderer de la familia** vía el registro.
7. **Pinta los efectos de encima** (bloom, ribbons, shockwaves).
8. **Guarda memoria del cuadro** (`commitSpectrumFrameMemory`) para las
   estelas del cuadro siguiente, y publica datos de diagnóstico si el HUD
   está activo.

Todo esto está modulado por `lib/visual/performanceQuality.ts`: en modos de
rendimiento bajos se reduce la calidad (sobre todo el `shadowBlur`, el
difuminado caro que ya conoces del Nivel 02) y cada familia declara una
"pista de coste GPU".

---

## 5. Los efectos de cuadro (`spectrumFrameEffects.ts`, 876 líneas)

Efectos que se pintan **alrededor de cualquier familia** (por eso no viven en
los renderers):

- **Energy bloom** — un resplandor general que respira con la energía.
- **Peak ribbons** — cintas que dibujan los picos recientes.
- **Shockwaves** — ondas expansivas disparadas por golpes (con umbrales por
  banda configurables y su propia calibración en `shockwaveCalibration.ts`).
- **Frame memory** — la familia de efectos "fantasma": afterglow (rescoldo),
  motion trails (estelas) y ghost frames (ecos del pasado). Funcionan
  guardando copias de cuadros anteriores (con una profundidad de historial
  configurable) y repintándolas atenuadas debajo del cuadro actual.

> **Analogía:** la familia es el bailarín; estos efectos son la **iluminación
> y el humo del escenario**: funcionan igual sea quien sea el que baile.

---

## 6. Los modos de drive: ¿quién mueve las barras?

Normalmente las mueve el audio. Pero el estado tiene `spectrumDriveMode` con
**4 modos** (esto llegó con la feature de control manual, store v64):

| Modo     | Quién manda                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `audio`  | Solo el audio (lo normal).                                                                                |
| `manual` | Solo el teclado: el espectro se divide en hasta **12 secciones** y cada tecla asignada empuja su sección. |
| `max`    | El que sea mayor: audio o teclado. Tocas "encima" de la música.                                           |
| `add`    | Audio + teclado sumados.                                                                                  |

La parte interesante es **dónde vive** el estado de las teclas:
`manual/spectrumManualRuntime.ts` mantiene las secciones (objetivo y nivel
actual, con attack/release para que suban y bajen con cuerpo) en **memoria de
módulo, fuera del store**. El comentario del archivo explica por qué: las
teclas cambian a 60 Hz, y meterlas en Zustand provocaría cascadas de
redibujado de React. El oyente de teclado (`useSpectrumManualKeyboard`, que
vive enganchado en `WallpaperViewport`, ¿recuerdas?) escribe los objetivos, y
el bucle de render los lee. Mismo razonamiento que `getAudioSnapshot()` del
Nivel 03: **lo que cambia a velocidad de cuadro no pasa por React**.

Este runtime es deliberadamente reutilizable: mañana podría alimentarse de
MIDI u OSC en vez de teclado sin tocar el motor.

---

## 7. El clon: un segundo espectro completo

El proyecto permite **un segundo espectro independiente** (el "clone").
Cómo está montado de verdad (vale la pena, porque es fácil imaginárselo mal):

- **No hay una lista de N clones.** Hay exactamente **uno**, y no es un
  objeto aparte: son **212 claves `spectrumClone*`** en el estado plano
  (familia propia, opacidad, estilo, colores, sus capas liquid, su túnel…
  prácticamente un espejo completo de las claves principales).
- En el momento de dibujar, `overlayLayerRegistry.ts` (la pieza que prepara
  las capas de audio para el lienzo) construye un **estado disfrazado**
  (`getCloneSpectrumState`): toma el estado real y le superpone las claves
  del clon _renombradas a las claves principales_ (`spectrumFamily ←
spectrumCloneFamily`, etc.). El motor recibe ese disfraz y **no sabe que
  está dibujando un clon** — es el mismo `drawSpectrum()` con otra
  `instanceKey` (`'clone-circular'`) y por tanto otra mesa de trabajo.
- El clon se pinta **después** del principal **en el mismo lienzo**, y en
  modo radial se recorta a su anillo para que sus efectos de frame-memory
  (que son de pantalla completa) no manchen al principal.

> **Analogía:** no contratamos otro motor: le damos al mismo cocinero **una
> segunda comanda con otra receta y otra mesa**. El truco del "disfraz" evita
> duplicar 10.000 líneas; el precio es esas 212 claves espejo en el estado
> (tema del Nivel 06).

La UI del clon es `SpectrumCloneSection.tsx` (1.125 líneas — una de las
pestañas más grandes, precisamente porque reexpone casi todo el espectro).

---

## 8. Transiciones: que cambiar de estilo no dé un latigazo

Dos mecanismos de suavidad cuando cambias ajustes:

1. **Crossfade entre familias/modos:** el motor captura cada ~200 ms una
   copia del cuadro actual en un lienzo de respaldo. Cuando cambias de
   familia, funde de esa copia al estilo nuevo en ~320 ms. (La copia puede
   tener hasta 200 ms de antigüedad: imperceptible, y capturar a 5 Hz en vez
   de 60 ahorra mucho, porque copiar pantalla completa es caro.)
2. **Morph de presets** (`spectrumPresetTransition.ts`): al aplicar un
   preset, los valores numéricos viajan gradualmente hasta el destino. Si en
   medio aplicas OTRO preset, `invalidateSpectrumPresetMorph()` cancela el
   viaje anterior (las slices del store lo llaman al pisar el estado) para
   que no lleguen dos animaciones contradictorias.

---

## 9. Piezas de apoyo (visita rápida)

- `geometry/radialGeometry.ts` — las **27 formas radiales** prefabricadas
  (círculo, estrellas, corazón, flores…): el "molde" sobre el que el modo
  radial coloca las barras. `ShapePreview.tsx` las previsualiza en la UI.
- `color/spectrumColor.ts` — los modos de color (sólido / degradado /
  arcoíris / rotación).
- `spectrumStateTransforms.ts` (861 líneas) — transformaciones de estado al
  servicio de la UI: los "macros" (un slider que mueve varios ajustes
  coherentemente), el randomizador de perfiles, y la normalización de
  ajustes.
- `spectrumLiquidLayers.ts` / `*Presets.ts` — la definición de las 3 capas
  liquid y los bundles de presets de liquid/tunnel/frame-memory.

---

## 10. Glosario nuevo de este nivel

- **Familia:** un algoritmo de visualización completo (classic, liquid…).
  No confundir con "estilo" (bars/blocks/wave/dots son estilos DE classic).
- **Registry (expediente):** la tabla única familia → capacidades +
  renderer + presets. Añadir familia = añadir entrada.
- **Capacidades:** qué controles aplican a una familia; la UI se adapta sola.
- **Settings vs. runtime:** los planos (del store, solo lectura) vs. la mesa
  de trabajo (memoria entre cuadros, fuera de React).
- **`instanceKey`:** el nombre de cada mesa de trabajo ('primary',
  'clone-circular'). Lo que hace posibles instancias independientes.
- **Fold / espejo radial:** plegar las alturas para simetría en el anillo.
- **Frame memory:** efectos basados en recordar cuadros anteriores
  (afterglow, trails, ghosts).
- **Drive mode:** quién mueve las barras (audio / manual / max / add).
- **Morph de preset:** la animación de los valores hacia un preset, con su
  token de cancelación.

---

## 11. Resumen en una frase

> `AudioLayerCanvas` llama cada cuadro a `drawSpectrum()` (el capataz), que
> muestrea bins según el **drive** (audio y/o teclado), los suaviza contra la
> **mesa de trabajo** de su instancia, y despacha el dibujo a una de **6
> familias** vía el **registro** (capacidades + renderer + presets en una
> sola tabla); alrededor de cualquier familia se pintan los **efectos de
> cuadro** (bloom, estelas, shockwaves), y el **clon** es el mismo motor con
> un estado disfrazado y otra mesa — por eso 212 claves espejo y cero código
> duplicado.

---

**Siguiente:** [`05-subsistemas.md`](./05-subsistemas.md) — la vuelta por
todo lo demás: letras (Lyrixa), luces y cámara (Stage FX), partículas y
lluvia, escenas y setlists, export, y el design system.
