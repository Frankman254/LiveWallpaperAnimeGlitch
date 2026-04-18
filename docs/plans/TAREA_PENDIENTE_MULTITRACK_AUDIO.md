# Tarea Pendiente: Sistema Multi-Track / Mix Automático

> Estado del documento: backlog activo de mediano plazo.
> Prioridad sugerida: despues de cerrar estabilidad de viewport/HUD.

## Objetivo

Permitir que el proyecto cargue varias canciones y funcione más como un mini DJ/mixer:

- playlist de varios tracks
- transiciones de audio entre canciones
- mezcla automática simple
- futura mezcla inteligente por energía/beat

---

## Qué tan factible es

Es **viable**, pero conviene hacerlo por fases.

La parte fácil:

- cargar varias pistas
- reproducir una lista
- hacer `crossfade` entre una canción y otra
- guardar esa playlist dentro del proyecto
- mostrar qué track está activo y cuál viene después

La parte media:

- normalizar volumen entre canciones
- decidir automáticamente cuándo pasar a la siguiente
- hacer transiciones suaves sin cortes

La parte difícil:

- sincronizar canciones por BPM real
- detectar downbeat/compases de forma confiable en navegador
- hacer beatmatch tipo DJ de verdad
- time-stretch / pitch-shift de alta calidad en tiempo real

Conclusión:

1. **Sí** es buena idea.
2. **Sí** vale la pena.
3. Pero primero conviene hacer una versión “musicalmente suave” y no intentar beatmatching perfecto desde el día 1.

---

## Propuesta por fases

## Fase 1 — Playlist persistente

Agregar al proyecto:

- `audioTracks[]`
- track activo
- nombre
- assetId
- duración
- volumen base
- loop por track

Capacidades:

- cargar múltiples MP3
- reordenarlos
- borrar tracks
- reproducir siguiente / anterior
- guardar todo dentro del `.lwag`

Valor:

- ya convierte la app en un visualizador con playlist real

---

## Fase 2 — Crossfade automático

Agregar:

- duración de crossfade
- iniciar mezcla N segundos antes del final
- curva de salida/entrada

Capacidades:

- track A baja volumen
- track B sube volumen
- sin silencio duro entre canciones

Valor:

- mejora gigante de UX con complejidad moderada

---

## Fase 3 — Auto-mix por energía

Usar el análisis ya existente para estimar:

- energía media del track
- intensidad de graves
- densidad percusiva

Capacidades:

- elegir siguiente track por compatibilidad simple
- no saltar de una canción suave a una extremadamente agresiva
- mantener una “curva de energía”

Valor:

- sensación de mezcla más inteligente sin necesitar BPM perfecto

---

## Fase 4 — Pre-análisis offline por track

Cuando el usuario carga un MP3, calcular y guardar:

- waveform resumido
- picos
- energía por secciones
- posible BPM aproximado
- puntos sugeridos de entrada/salida

Valor:

- reduce cálculos durante reproducción
- prepara la base para mezcla más avanzada

---

## Fase 5 — Beat-aware transitions

Esto ya sería la versión avanzada:

- estimación de BPM
- entrada de track siguiente en un beat razonable
- alineación aproximada de compás

Riesgo:

- alto costo de implementación
- mayor probabilidad de resultados “raros” si el análisis falla

Mi recomendación:

- no empezar por aquí

---

## Riesgos técnicos

## 1. Uso de memoria

Varias canciones cargadas significan:

- más blobs en IndexedDB
- más objetos `File`
- más buffers de audio si se preanalizan

Mitigación:

- no decodificar todos los tracks completos al mismo tiempo
- mantener solo el activo y el siguiente listos para transición

## 2. CPU / AudioContext

Si abrimos demasiados analizadores o elementos `audio` a la vez:

- sube uso de CPU
- pueden aparecer desfases

Mitigación:

- máximo dos tracks activos al mismo tiempo durante crossfade
- un solo motor de mix

## 3. Sincronización con el sistema reactivo

Logo, spectrum, BG y partículas dependen del audio actual.

Pregunta clave:

- durante crossfade, ¿la reactividad sigue al track A, al B o a una mezcla?

Mi recomendación:

- usar una mezcla de ambos durante la transición
- fuera del crossfade, usar solo el track activo

## 4. Restricciones del navegador

En web:

- autoplay puede bloquear restauración automática
- algunos navegadores limitan AudioContext
- procesos en ventanas separadas pueden comportarse diferente

Mitigación:

- mantener el editor como fuente de verdad
- el motor de audio debe vivir en una sola ventana principal siempre que sea posible

---

## Arquitectura recomendada

Crear un módulo nuevo separado:

- `audioPlaylistSlice`
- `audioMixEngine`
- `audioTrackPersistence`

Separación sugerida:

- `AudioDataContext`
  - análisis del audio vivo
  - snapshot para reactividad
- `audioMixEngine`
  - reproducción de playlist
  - crossfade
  - volumen
  - track actual / siguiente
- store
  - solo metadatos y configuración persistente

---

## Estado recomendado del proyecto futuro

```ts
audioTracks: Array<{
  id: string;
  assetId: string;
  name: string;
  mimeType: string;
  volume: number;
  loop: boolean;
  enabled: boolean;
}>

activeAudioTrackId: string | null
queuedAudioTrackId: string | null
audioCrossfadeEnabled: boolean
audioCrossfadeSeconds: number
audioAutoAdvance: boolean
audioMixMode: 'manual' | 'sequential' | 'energy-aware'
```

---

## Orden recomendado de implementación

1. Playlist persistente con múltiples tracks
2. Export/import de esos tracks dentro del `.lwag`
3. Crossfade simple entre track actual y siguiente
4. Reactividad de audio mezclada durante crossfade
5. Pre-análisis por track
6. Auto-mix por energía
7. Beat-aware transitions

---

## Recomendación final

La mejor ruta no es intentar “mezcla DJ completa” de una vez.

La mejor ruta es:

1. convertir el sistema actual de un solo MP3 en una playlist real
2. luego añadir crossfade
3. después hacer inteligencia musical gradual

Así conseguimos valor visible rápido, sin romper la estabilidad del proyecto.
