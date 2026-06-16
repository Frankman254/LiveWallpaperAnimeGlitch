# Nivel 02 — El pipeline de render (de los datos a los píxeles)

> Requisitos: [Nivel 00](./00-fundamentos.md) (la fábrica de 4 estaciones) y
> [Nivel 01](./01-estado-y-store.md) (el almacén). Hoy recorremos las
> estaciones 2, 3 y 4: cómo el estado se convierte en lo que ves.
>
> Como siempre: cero conocimientos asumidos, analogías al rescate.

---

## 0. Lo que vas a entender al terminar

1. Qué es exactamente una **capa** en el código (no en abstracto) y cómo se
   decide **qué va delante y qué detrás** (el famoso z-index).
2. Quién es el **traductor** (`layers.ts`) y por qué existe.
3. Quién es el **director** (`WallpaperViewport`) y cómo reparte el trabajo.
4. Cómo trabaja cada uno de los **tres dibujantes** de verdad: qué archivos
   son, cuántas veces por segundo dibujan, y cómo se les baja el ritmo cuando
   la máquina no da.
5. Por qué "más capas activas = más lento" es una propiedad arquitectónica y
   no un bug.

---

## 1. Antes de nada: dos conceptos de dibujo

### 1.1 El z-index: la pila de transparencias

Todo lo que se dibuja se apila. El **z-index** es un número que dice **a qué
altura de la pila** va cada capa: número más bajo = más al fondo, número más
alto = más al frente.

> **Analogía:** las **láminas transparentes** de los retroproyectores de
> colegio. Pones la del paisaje abajo, encima la del personaje, encima la del
> bocadillo de texto. Si cambias el orden, el personaje tapa al bocadillo.

Estos son los números **por defecto** del proyecto (de `layers.ts`):

```
 82  letras (lyrics)              ← lo más al frente
 80  título de la pista
 75  logo
 70  espectro
 30  partículas delanteras
 20  lluvia
 10  partículas traseras
  0  imagen de fondo              ← lo más al fondo
 (90+ las imágenes overlay que subes tú, cada una con el suyo)
```

Fíjate en un detalle con historia: el logo (75) va **encima** del espectro
(70). El comentario del código lo explica: cuando activas "espectro alrededor
del logo", las barras no deben enterrar la imagen del logo.

Estos números no están grabados en piedra: el estado tiene un cajón
`layerZIndices` que permite **reordenar capas** desde el editor; los valores
de arriba son el plan B si no has tocado nada.

### 1.2 El frame y el bucle de animación

La pantalla no se mueve de verdad: muestra **fotos quietas muy rápido**
(idealmente 60 por segundo). Cada foto es un **frame** (cuadro). Para animar,
el navegador ofrece una función llamada **`requestAnimationFrame`** que
significa: _"avísame justo antes de pintar el siguiente cuadro"_. Los
dibujantes de este proyecto viven dentro de ese aviso: en cada cuadro leen el
estado + los números del audio, borran su lienzo y lo pintan de nuevo.

> **Analogía:** un **folioscopio** (flipbook): dibujas una página por cuadro y
> al pasarlas rápido, se mueve. `requestAnimationFrame` es el dedo que pasa la
> página y te grita "¡dibuja la siguiente!".

---

## 2. Estación 2 — El traductor: `src/lib/layers.ts`

El almacén es un archivador de cientos de cajones planos (Nivel 01). Para
dibujar, eso es incómodo: el director quiere una **lista ordenada de fichas de
capa**, cada una con TODO lo necesario para dibujarla, sin tener que ir cajón
por cajón.

`layers.ts` (425 líneas) hace exactamente esa traducción, con **tres
constructores** según el tipo de capa:

### 2.1 `buildSceneLayers` — las capas de "escena"

Las que forman el mundo del fondo: la **imagen de fondo**, las **partículas
traseras**, la **lluvia** y las **partículas delanteras**. Para cada una arma
una ficha con: ¿está encendida?, z-index, opacidad, posición/escala/rotación,
modo de fusión, y su configuración de reacción al audio.

Detalle bonito: aquí ya se ve la **lógica de encendido**. Por ejemplo, la
lluvia solo existe si `rainEnabled` **y además** el modo de rendimiento no es
"low" — en máquinas flojas la lluvia se apaga sola. Y las partículas traseras
solo existen si el modo de capa de partículas es "background" o "both".

### 2.2 `buildOverlayLayers` — las capas de "encima"

Lo que flota sobre la escena: tus **imágenes overlay** (cada una con su ficha:
recorte, fundido de bordes, brillo de borde, reacción de opacidad al audio),
el **logo**, el **título de pista**, las **letras** y el **espectro**.

### 2.3 `buildControllerLayers` — capas que NO dibujan

Aquí hay una idea sutil: el **slideshow** (pase de diapositivas) se modela
como capa… pero no pinta nada. Es una **capa controladora**: existe en la
lista para tener orden y encendido como las demás, pero su trabajo es _cambiar
cuál imagen está activa cada X segundos_. Solo se enciende si el slideshow
está activado **y** hay más de una imagen en el pool.

> **Analogía:** en la lista de cue cards del teatro hay una que no es un
> actor ni un foco: es la nota "**cada 5 minutos, cambiar el telón de
> fondo**". Está en la lista porque sigue el mismo flujo, pero no sale a
> escena.

### 2.4 Tres cosas que conviene notar

1. **Cada constructor ordena su lista por z-index** antes de entregarla
   (función `sortLayers`). El director recibe las cue cards ya ordenadas.
2. **`layers.ts` no sabe dibujar.** Solo traduce. Esto es a propósito: si
   mañana cambias cómo se dibuja la lluvia, este archivo no se entera.
3. Las fichas están **tipadas** en `src/types/layers.ts`: ahí está la "ficha
   técnica" de qué campos tiene cada tipo de capa (`SceneLayer`,
   `OverlayLayer`, `ControllerLayer`).

---

## 3. Estación 3 — El director: `WallpaperViewport.tsx`

`src/components/wallpaper/WallpaperViewport.tsx` (233 líneas — corto, porque
dirigir no es actuar). Hace cuatro trabajos:

### 3.1 Lee del almacén SOLO lo que necesita

Las primeras ~100 líneas son dos selectores grandes con `useShallow` (¿lo
recuerdas del Nivel 01?): uno con los cajones que alimentan las capas de
escena y otro con los de las capas overlay. Así el director solo se redibuja
cuando cambia algo que de verdad afecta a la composición — mover un slider de
otra cosa no lo molesta.

### 3.2 Llama al traductor y clasifica el reparto

Con ese estado llama a `buildSceneLayers` y `buildOverlayLayers`, y separa el
resultado en dos grupos:

- **`renderableLayers`** → fondo, partículas, lluvia, overlays. Cada una se
  monta como su propio componente.
- **`audioLayers`** → logo, espectro, título, letras. Estas cuatro van a un
  dibujante especializado (el lienzo de audio, sección 4.2).

### 3.3 Monta el escenario en el orden correcto

La estructura que monta, de fuera hacia dentro:

```
<main>  (ocupa toda la pantalla, recorta lo que sobresale)
│
├── CameraFxStage          ← el "temblor de cámara" envuelve SOLO esto
│   ├── GlobalBackgroundView          (el fondo global, detrás de todo)
│   ├── StageLightsCanvas             (luces de concierto, si están on)
│   ├── ...renderableLayers...        (fondo, partículas, lluvia, overlays)
│   ├── ...audioLayers...             (logo, espectro, título, letras)
│   └── FlashLightCanvas              (flashes de pico, si están on)
│
├── OverlayInteractionStage  ← SOLO en modo editor: las cajitas de arrastrar
├── DiagnosticsHudStack       (paneles de diagnóstico, si los activas)
├── CanvasFpsOverlay           (el contador de FPS)
└── QuickActionsPanel          (acciones rápidas)
```

Hay una decisión de diseño importante escondida ahí: **`CameraFxStage`
(el efecto de sacudida de cámara) envuelve únicamente las capas visuales del
wallpaper**. El HUD, los paneles de diagnóstico y los controles del editor
quedan FUERA, así cuando la "cámara" tiembla con el bajo, tus botones no
tiemblan contigo.

### 3.4 Editor y preview: la diferencia real

El director acepta una prop `editorMode`. La única diferencia entre la
pantalla de edición y la vista limpia es que en modo editor se monta además
`OverlayInteractionStage` (la capa invisible que te deja arrastrar el logo,
los overlays, etc.). **El resto del montaje es idéntico** — esta es la
garantía técnica del principio WYSIWYG del proyecto ("lo que ves en el editor
es lo que sale").

También arranca aquí `SlideshowManager` (la capa controladora hecha
componente) y el oyente de teclado del spectrum manual — cosas que "dirigen"
pero no pintan.

---

## 4. Estación 4 — Los tres dibujantes, ahora con nombres y apellidos

En el Nivel 00 dijimos "hay tres formas de dibujar". Ahora veamos los
archivos concretos y cómo trabaja cada equipo.

### 4.1 Equipo 1 — Las imágenes (DOM/Canvas de imagen)

**Quién:** la carpeta `src/components/wallpaper/layers/`.

- `BackgroundImageLayerView` → es solo un envoltorio fino que delega en…
- `ImageLayerCanvas` → el dibujante real de la imagen de fondo, apoyado por
  una familia entera de módulos `imageCanvas*` en la misma carpeta:
  transiciones del slideshow (`imageCanvasBackgroundTransitions`), efectos
  posteriores (`imageCanvasBackgroundPostEffects`), estado de audio
  (`imageCanvasAudioState`), etc.
- `OverlayImageLayerView` → dibuja cada imagen overlay tuya (con su recorte,
  bordes fundidos, brillo).
- `GlobalBackgroundView` (en `components/wallpaper/`) → el fondo global, una
  pieza aparte que vive detrás de todo.

¿Por qué la imagen de fondo necesita tanto aparato? Porque ya no es "una
imagen quieta": hace zoom con el bajo, transiciona entre diapositivas con
efectos, respeta "Keep Screen Covered", hace mirror fill… Todo eso se pinta
cuadro a cuadro en un lienzo.

### 4.2 Equipo 2 — El lienzo de audio (Canvas 2D): `AudioLayerCanvas`

**Quién:** `src/components/audio/layers/AudioLayerCanvas.tsx`.

Este es el dibujante de las cuatro capas que bailan con la música: logo,
espectro, título y letras. Funciona así, y vale la pena entenderlo porque es
el patrón de TODO el dibujo cuadro-a-cuadro del proyecto:

1. **Cada capa de audio recibe SU PROPIO lienzo** del tamaño de toda la
   pantalla. Si tienes logo + espectro + letras encendidos, hay tres lienzos
   completos apilados. (Apunta esto: es el coste arquitectónico del que habla
   el Nivel 06.)
2. Dentro corre un **bucle `requestAnimationFrame`**: en cada cuadro pide al
   "oído" la foto del sonido (`getAudioSnapshot`), lee el estado del store, y
   llama al renderer de su capa (el del espectro, el del logo…).
3. **Limita su propio ritmo según `performanceMode`:** 30 cuadros/segundo en
   "low", 45 en "medium", 60 en "high". En pantallas de 120Hz esto ahorra la
   mitad del trabajo sin que se note (un visualizador se ve igual a 60 que a
   120).
4. **Sabe pausarse:** si `motionPaused` o el modo reposo (`sleepModeActive`)
   están activos, el bucle sigue vivo pero no pinta — listo para despertar al
   instante.

> **Analogía:** cada capa de audio tiene su **pintor con su propio cristal
> del tamaño del escaparate**. Todos pintan a la vez, cada uno en su cristal,
> y tú ves los cristales superpuestos. Es flexible… pero cada cristal nuevo
> es un escaparate entero más que pintar 60 veces por segundo.

### 4.3 Equipo 3 — La GPU (WebGL): `SceneLayerCanvas`

**Quién:** `src/components/wallpaper/layers/SceneLayerCanvas.tsx` +
`sceneLayerRegistry.tsx`.

Para partículas y lluvia, pintar "a mano" miles de puntitos sería lentísimo.
Aquí entra **Three.js** con **React Three Fiber** (R3F, la forma de usar
Three.js desde React):

- `SceneLayerCanvas` monta un lienzo 3D (`<Canvas>` de R3F). Importante: lo
  monta en modo **`frameloop="demand"`** — la GPU NO dibuja sola en bucle,
  sino solo cuando alguien se lo pide. Un ayudante interno
  (`FrameRateLimiter`) hace de metrónomo y pide cuadros al mismo ritmo
  30/45/60 según `performanceMode`. Mismo truco de ahorro que el lienzo de
  audio.
- `sceneLayerRegistry.tsx` es un **registro**: una tablita que dice "capa de
  tipo `particle-background` → componente `ParticlesBackground`; tipo `rain`
  → `RainLayer`…". Añadir un tipo de capa GPU nuevo = añadir una línea aquí.
- Los componentes finales (`ParticlesBackground`, `ParticlesForeground`,
  `RainLayer`) preparan geometrías y **shaders** (programitas que corren
  dentro de la GPU, archivos `.glsl` en `src/shaders/`). Los desmenuzamos en
  el Nivel 05.

> **Analogía del registro:** la centralita del teatro: "¿efecto de nieve?
> extensión 12; ¿lluvia? extensión 14". El director no necesita saber cómo se
> hace la lluvia, solo a qué extensión llamar.

### 4.4 Los modos de fusión (blend modes)

En las fichas de capa viste `blendMode: 'additive'` (partículas) o
`'screen'` (lluvia, espectro). Un **modo de fusión** es la regla de cómo se
mezcla una capa con lo que tiene debajo:

- **normal** → tapa lo de abajo (una pegatina opaca).
- **screen / additive** → _suma luz_: lo negro se vuelve invisible y los
  colores claros brillan. Como proyectar una diapositiva sobre otra: las
  luces se acumulan.

Por eso las partículas y el espectro "brillan" sobre el fondo en vez de
taparlo con rectángulos negros.

---

## 5. El viaje completo de un cuadro (resumen animado)

Qué pasa en UN cuadro de la animación, juntando todo:

```
(1/60 de segundo, ¡empieza el cuadro!)

  requestAnimationFrame dispara a cada dibujante
       │
       ├── AudioLayerCanvas (×1 por capa de audio encendida)
       │     ¿me toca según mi cap de FPS? ¿no estoy pausado?
       │     → pide getAudioSnapshot() al oído
       │     → lee el estado del store
       │     → borra su lienzo y pinta su capa (espectro, logo, ...)
       │
       ├── ImageLayerCanvas
       │     → ¿hay zoom de bajo? ¿transición de slideshow en curso?
       │     → pinta la imagen de fondo con su transformación
       │
       └── FrameRateLimiter (GPU)
             → invalidate(): "GPU, dibuja partículas y lluvia ahora"

  El navegador apila todos los lienzos por z-index,
  aplica los modos de fusión... y eso es lo que ves.

(fin del cuadro; en 1/60 s, otra vez)
```

Mientras tanto, **fuera del bucle de cuadros**, React solo interviene cuando
cambias un ajuste: el store avisa, el director recalcula la lista de capas, y
monta/desmonta los dibujantes necesarios. **React arma el escenario; los
bucles de cuadro lo animan.** Esa división del trabajo es clave para el
rendimiento: redibujar React 60 veces por segundo sería carísimo.

---

## 6. Por qué "fullscreen va más lento" no es un bug

Ahora puedes razonarlo tú: cada lienzo es de **pantalla completa**, y pintar
cuesta **proporcional al número de píxeles × número de lienzos**. Pasar de
una ventana a 4K multiplica los píxeles; cada capa de audio encendida añade
un lienzo entero más. Súmale efectos caros como `shadowBlur` (el difuminado
de sombras de Canvas 2D, que es notoriamente lento) y tienes la conclusión
del audit de rendimiento del proyecto: _el cuello de botella es
arquitectónico (N lienzos full-screen + blur), no un error puntual_. Las
palancas que existen: el `performanceMode` (baja el ritmo a 30/45), apagar
capas (las apagadas **no calculan nada**), y reducir efectos de blur/glow.

---

## 7. Glosario nuevo de este nivel

- **z-index:** la altura en la pila de transparencias. Más alto = más al
  frente.
- **Frame / cuadro:** una de las fotos quietas que, en secuencia, forman la
  animación.
- **`requestAnimationFrame`:** el aviso del navegador "vas a pintar el
  siguiente cuadro, hazlo ahora".
- **FPS:** cuadros por segundo. El proyecto apunta a 60 y se autolimita a
  30/45 en modos de rendimiento bajos.
- **Capa controladora:** una capa que no dibuja; ejecuta lógica (el
  slideshow).
- **Registro (registry):** una tabla "tipo → quién lo maneja", para añadir
  casos nuevos sin tocar la lógica central.
- **Blend mode / modo de fusión:** la regla de mezcla de una capa con lo de
  abajo (normal tapa; screen/additive suman luz).
- **Three.js / React Three Fiber (R3F):** la librería 3D y su adaptador a
  React. `frameloop="demand"` = la GPU solo dibuja cuando se lo piden.
- **Shader:** programa pequeño que corre dentro de la GPU (archivos `.glsl`).
- **HUD:** los paneles informativos flotantes (diagnósticos, FPS). Viven
  fuera del temblor de cámara.

---

## 8. Resumen en una frase

> `layers.ts` traduce el archivador a **tres listas de fichas ordenadas por
> z-index** (escena, overlay, controladoras); `WallpaperViewport` las monta en
> orden — con el temblor de cámara envolviendo SOLO lo visual y las
> herramientas de editor aparte — y reparte cada ficha a su dibujante: lienzos
> de imagen, **un lienzo full-screen por capa de audio** a 30/45/60 FPS, y la
> GPU bajo demanda para partículas y lluvia. React arma el escenario; los
> bucles de cuadro lo animan.

---

**Siguiente:** [`03-audio.md`](./03-audio.md) — el "oído" del sistema: cómo el
sonido se convierte en los números que todos estos dibujantes consumen.
