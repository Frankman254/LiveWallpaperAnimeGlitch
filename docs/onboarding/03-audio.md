# Nivel 03 — El audio (cómo el sonido se vuelve números)

> Requisitos: [Nivel 00](./00-fundamentos.md) y, para la parte final,
> ayuda haber visto el [Nivel 02](./02-pipeline-render.md) (los dibujantes que
> consumen estos números).
>
> Este nivel explica el "oído" completo: de la onda de sonido a los números
> que hacen latir el logo y bailar las barras.

---

## 0. Lo que vas a entender al terminar

1. Qué hace el navegador con el sonido para convertirlo en números (FFT,
   bins) — sin matemáticas, con analogías.
2. Los **tres adaptadores** de entrada (escritorio, micrófono, archivo) y el
   contrato que comparten.
3. Los **6 canales** (kick, bass, vocal…) — qué son de verdad y qué NO son.
4. El **orquestador** (`AudioDataContext`) y la foto del sonido
   (`AudioSnapshot`) que consume todo el mundo.
5. La **playlist** con crossfade (`AudioMixEngine`), la sincronía entre
   pestañas, los **envelopes** y la **calibración**.

---

## 1. La física mínima: del aire a los números

El sonido es una vibración del aire. El micrófono (o la tarjeta de sonido) la
convierte en una **señal**: una lista larguísima de números que sube y baja
como la propia onda. A esa forma se le llama **dominio del tiempo** (time
domain): "¿cuánto vale la onda en este microinstante?".

Para los efectos visuales, esa forma cruda no es muy útil. Lo útil es saber
**cuánto grave y cuánto agudo** hay sonando AHORA. Para eso existe una
operación matemática famosa llamada **FFT** (transformada rápida de Fourier).
No hace falta entenderla por dentro; basta su resultado:

> **Analogía:** la FFT es un **prisma para el sonido**. Igual que un prisma
> separa la luz blanca en colores, la FFT separa el sonido en **franjas de
> frecuencia**: cuánta energía hay en los graves, cuánta en los medios,
> cuánta en los agudos. Cada franja es un **bin**.

El navegador trae esto de fábrica (la **Web Audio API**, el "oído" del Nivel
00): le conectas una fuente de sonido y te da, en cada momento:

- **`bins`**: un array de números 0–255, uno por franja de frecuencia
  (graves a la izquierda, agudos a la derecha). El ajuste **`fftSize`** del
  store decide cuántas franjas (más franjas = más detalle, más trabajo).
- **`timeDomain`**: la onda cruda (0–255, con 128 = silencio). Solo la
  consume el **oscilloscope** del spectrum (la familia que dibuja la onda
  literal, ver Nivel 04).

---

## 2. Los tres adaptadores: un contrato, tres orígenes

¿De dónde viene el sonido? De tres sitios posibles, y aquí el proyecto usa
uno de sus patrones más limpios: el **adaptador** (adapter).

El contrato vive en `src/lib/audio/types.ts`: la interfaz
**`IAudioSourceAdapter`**. Dice: "quien quiera ser fuente de audio debe saber
hacer esto": `start()`, `stop()`, `getFrequencyBins()`, `getAmplitude()`,
`getPeak()`, `getBands()`… y opcionalmente `getTimeDomainBins()`, pausar,
buscar una posición (`seek`), cambiar volumen, etc.

> **Analogía:** es un **enchufe estándar**. Da igual si la electricidad viene
> de la red, de un generador o de placas solares: el aparato solo conoce el
> enchufe. El resto de la app jamás pregunta "¿esto viene del micrófono?";
> solo dice "dame los bins".

Los tres enchufables, en `src/lib/audio/`:

| Adaptador | Origen | Cómo lo consigue |
|---|---|---|
| `DesktopAudioAnalyzer` (156 líneas) | **El sonido de tu computadora** (lo que sea que esté sonando: Spotify, un juego…) | `getDisplayMedia()`: el diálogo de "compartir pantalla" del navegador, pidiendo solo el audio. Por eso aparece ese popup — es una limitación del navegador, no se puede suprimir. |
| `MicrophoneAnalyzer` (123 líneas) | El **micrófono** | `getUserMedia()`: el permiso clásico de micrófono. |
| `FileAudioAnalyzer` (290 líneas) | Un **archivo de música** tuyo (MP3 etc.) | Crea un reproductor interno y conecta su salida al analizador. Es el único que sabe pausar, hacer seek, loop, volumen… porque es el único que *controla* la reproducción (al escritorio y al micro solo se les escucha). |

El modo activo se guarda en el store (`audioSourceMode`:
none/desktop/microphone/file).

---

## 3. De bins a canales: los 6 "instrumentos"

Los bins crudos son demasiado finos para la mayoría de efectos ("quiero que
el logo lata con el bombo", no "con el bin 7"). El archivo
`src/lib/audio/audioChannels.ts` (291 líneas) destila los bins en **6
canales** con nombre musical:

| Canal | Qué intenta capturar | De qué franjas sale (aprox.) |
|---|---|---|
| `full` | La energía total de la mezcla | 35–16000 Hz |
| `kick` | El **bombo** (el "punch" grave) | pico en 35–105 Hz + transitorio |
| `bass` | El cuerpo del **bajo** | 70–190 Hz + algo de bombo |
| `instrumental` | "Todo lo que no es voz" | mezcla ancha menos el canal vocal |
| `hihat` | Platillos / brillo agudo | 5200–15000 Hz + transitorio |
| `vocal` | La **voz** | 300–4200 Hz con contraste contra el bajo |

⚠️ **Honestidad importante** (el propio código lo aclara en un comentario):
estos canales son **aproximaciones espectrales, no separación real de
pistas**. "Vocal" no extrae la voz de la canción; mide la energía en las
franjas donde suele vivir la voz y le resta lo que parece bajo o aire. Para
mover efectos visuales es más que suficiente; para un karaoke, no.

Dos refinamientos que explican por qué se siente "musical":

- **Transitorios:** para `kick` y `hihat` no solo se mide cuánta energía hay,
  sino cuánto **subió de golpe** respecto al instante anterior. Un golpe de
  bombo es un salto brusco; eso es lo que dispara el efecto.
- **Suavizado EMA:** cada canal pasa por una media móvil exponencial (el
  nuevo valor pesa poco, la historia pesa mucho) controlada por el slider de
  suavizado. Sin esto, todo parpadearía como estroboscopio.

### El canal `auto` (y por qué es pegajoso)

Casi todos los efectos pueden elegir canal, y existe la opción **`auto`**:
la función `resolveAudioChannelValue` decide por ti. Su lógica: si hay bombo
fuerte, usa `kick` (y se queda en kick un ratito aunque pare — el "hold" — para
no parpadear entre golpes); si no, elige el canal con más energía, con un
**margen de pegajosidad**: no abandona el canal actual a menos que otro lo
supere claramente. Cambiar de canal a cada frame se vería nervioso.

Cada efecto recibe dos lecturas: `value` (suavizada — para UI y cosas
estables) e `instantLevel` (cruda del frame — para movimiento con pegada).

---

## 4. El orquestador: `AudioDataContext`

`src/context/AudioDataContext.tsx` (307 líneas) es el **provider** (servicio
de fondo, paso 3 del arranque) que junta todas las piezas. Él solito no hace
casi nada: delega en cuatro hooks especializados de `src/context/audioData/`:

```
AudioDataProvider
├── useAudioSnapshotRuntime    → fabrica la "foto del sonido" cada frame
├── useAudioCaptureController  → enciende/apaga/cambia los adaptadores
├── useAudioPlaylistController → la playlist (siguiente, cola, crossfade)
└── useAudioPlaybackEffects    → vigilancia: recuperación automática,
                                  restaurar la pista al arrancar, etc.
```

> **Analogía:** el **jefe de sonido** del teatro. No toca ningún instrumento:
> tiene un técnico de micrófonos (capture), un DJ (playlist), un asistente de
> contingencias (playback effects) y un chico que cada instante apunta en una
> pizarra "así está el sonido AHORA" (snapshot).

### 4.1 La pizarra: `AudioSnapshot`

La pieza más importante de todo el subsistema. Es la "foto del sonido" que
cualquier dibujante pide en cada cuadro vía `getAudioSnapshot()`:

```ts
AudioSnapshot = {
  bins,          // el arcoíris de frecuencias (0–255 por franja)
  timeDomain?,   // la onda cruda (solo local; solo la usa el oscilloscope)
  amplitude,     // volumen general
  peak,          // el pico retenido
  channels,      // los 6 canales ya destilados
  timestampMs    // cuándo se tomó la foto
}
```

Fíjate en el patrón de consumo (lo viste en `AudioLayerCanvas`, Nivel 02):
los dibujantes NO se suscriben a React para el audio — **llaman a
`getAudioSnapshot()` dentro de su bucle de cuadros**. El audio cambia 60
veces por segundo; pasarlo por el sistema de redibujado de React lo
ahogaría. Por eso es una función-que-te-da-la-foto y no un estado de React.

### 4.2 Sincronía entre pestañas

Caso real: tienes el **editor en una pestaña y el preview en otra**. ¿Quién
captura el audio? Solo una. La que captura **transmite** su snapshot ~30
veces por segundo por un canal de difusión del navegador
(`BroadcastChannel` llamado `lwag-audio-sync`), y las demás pestañas lo
reciben como **réplica remota**. Detalles finos: la réplica caduca a los
250 ms sin noticias (para no quedarse bailando con música fantasma), y el
`timeDomain` **no se transmite** (pesa mucho y solo lo usa el oscilloscope —
si quieres oscilloscope, hazlo en la pestaña que captura).

---

## 5. La playlist y el crossfade: `AudioMixEngine`

Cuando la fuente es "archivo", no hay solo un archivo: hay una **playlist**
(`audioTracks` en el store, gestionada por `audioPlaylistSlice`).

La estrella es **`AudioMixEngine`** (`src/lib/audio/AudioMixEngine.ts`, 419
líneas): un motor que mantiene **dos reproductores a la vez** para poder
hacer **crossfade** (fundido cruzado): mientras la pista A se apaga
gradualmente, la B ya está sonando y subiendo. Como un DJ con dos platos.

Cosas que el sistema sabe de cada pista (mira el tipo `AudioPlaylistTrack` en
`types/wallpaper.ts`):

- **Huella anti-duplicados:** `nombre::tamaño::fechaModificación` — si
  arrastras dos veces el mismo MP3, lo detecta.
- **Análisis offline al importar** (`analyzeTrackEnergy`,
  `analyzeTrackContent`): puntuaciones de energía/bajo/densidad, **detección
  de silencios** al inicio y final (`contentStartMs`/`contentEndMs` — para no
  reproducir 8 segundos de nada), sugerencias de punto de mezcla
  (`mixInStartMs`/`mixOutStartMs`, corregibles a mano), BPM estimado,
  loudness.
- **Estilos de transición** (`AudioTransitionStyle`): linear / smooth /
  quick / early-blend / late-blend — la curva con la que se cruzan los dos
  platos.

El flujo de fin de pista: `FileAudioAnalyzer`/el motor avisa `onTrackEnd` →
el playlist controller decide la siguiente (con `selectNextTrack`, que
respeta el setlist activo si lo hay y evita repetir las recientes) → si el
crossfade está activado, encola en el segundo plato en vez de cortar.

---

## 6. Envelopes: de "número" a "movimiento con cuerpo"

Un canal te da un número 0–1 por frame. Si escalas el logo directamente con
él, se ve **eléctrico y nervioso**. La solución del proyecto es el
**envelope** (envolvente): `src/utils/audioEnvelope.ts`
(`createAudioEnvelope()`), un procesador reutilizable que convierte el número
crudo en un movimiento con forma física:

- **attack** — qué tan rápido SUBE al recibir un golpe.
- **release** — qué tan rápido BAJA al volver el silencio.
- **peak window / floor** — memoria adaptativa: recuerda cuán fuerte ha
  estado sonando la canción últimamente y normaliza contra eso (así una
  canción bajita también llena el rango del efecto).
- **punch** — un extra de pegada en los golpes secos.

> **Analogía:** el número crudo es alguien gritándote "¡AHORA! ¡ahora no!
> ¡AHORA!". El envelope es un **amortiguador de coche**: el golpe entra, la
> carrocería sube con fuerza pero baja con elegancia. Attack y release son la
> dureza del amortiguador en cada dirección.

Cada elemento visual crea **su propia instancia** (el logo una, el zoom de
fondo otra…), así que no se pisan. Lo usan: logo, zoom de fondo (los presets
Classic/Smooth/Punchy de `imageBassZoomProfiles`), spectrum y edge glow.

---

## 7. Calibración: afinar sin adivinar

`src/features/calibration/` existe porque "¿qué attack pongo?" es imposible
de responder a ciegas:

- `calibrationConfig.ts` — el catálogo de parámetros calibrables agrupados
  (qué grupos hay, sus rangos, y **valores sugeridos** de punto de partida).
- `EnvelopeWaveformPreview.tsx` — una vista que **dibuja la curva** del
  envelope resultante, para que veas qué hace tu configuración antes de
  oírla.
- `syntheticDrive.ts` — el truco bonito: un **bombo sintético a 120 BPM**
  (`syntheticKickValue`: subida brusca, caída exponencial, un pulso cada
  medio segundo). Sirve para calibrar **sin música**: el mismo pulso
  matemático alimenta a la vez la curva del preview y el efecto real en
  pantalla, así lo que ves en la gráfica y lo que late en el wallpaper es
  exactamente la misma señal.

> **Analogía:** es el **metrónomo del afinador**: en vez de calibrar con una
> canción que cambia todo el rato, golpeas con un patrón perfecto y conocido
> hasta que el efecto responde como quieres. Luego pones música real.

---

## 8. Glosario nuevo de este nivel

- **Dominio del tiempo (time domain):** la onda cruda del sonido instante a
  instante. La consume solo el oscilloscope.
- **FFT:** el "prisma" que separa el sonido en franjas de frecuencia.
- **Bin:** una franja de ese prisma (un número 0–255 de energía).
- **`fftSize`:** cuántas franjas pide el análisis (resolución del prisma).
- **Canal (audio):** un destilado con nombre musical de varios bins (kick,
  bass, vocal…). Aproximación, no separación real.
- **Transitorio:** el salto brusco de energía (el golpe), distinto del nivel
  sostenido.
- **EMA / suavizado:** media que mezcla el valor nuevo con la historia para
  quitar nervios.
- **Canal `auto` pegajoso:** elige canal por ti y evita cambiar a cada frame.
- **`AudioSnapshot`:** la foto del sonido por frame: bins + canales +
  amplitud + pico.
- **`BroadcastChannel`:** el walkie-talkie entre pestañas del navegador
  (canal `lwag-audio-sync`, ~30 Hz).
- **Crossfade:** fundido cruzado entre dos pistas (dos "platos" a la vez).
- **Envelope (envolvente):** el amortiguador attack/release/peak/punch que
  convierte números crudos en movimiento con cuerpo.
- **Drive sintético:** el bombo matemático a 120 BPM para calibrar sin
  música.

---

## 9. Resumen en una frase

> Una de tres fuentes (escritorio/micro/archivo) entra por **el mismo
> enchufe** (`IAudioSourceAdapter`); la Web Audio API la pasa por el **prisma
> FFT** (bins); `audioChannels` destila los bins en **6 canales musicales
> aproximados** con suavizado y canal `auto` pegajoso; el **orquestador**
> (`AudioDataContext`) publica todo como una **foto por frame**
> (`AudioSnapshot`) que los dibujantes piden directamente en su bucle (y se
> retransmite entre pestañas); la playlist mezcla pistas con **dos platos**
> (`AudioMixEngine`), y los **envelopes** + la **calibración con bombo
> sintético** convierten esos números en movimiento con cuerpo.

---

**Siguiente:** [`04-spectrum-engine.md`](./04-spectrum-engine.md) — el mayor
consumidor de todo esto: el motor del espectro, con sus 6 familias de
visualización.
