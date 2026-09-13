# El contrato Lyrixa, tal como lo consume LiveWallpaper

**Fecha:** 2026-09-06 · **Estado:** implementado · **Código:**
`src/features/lyrics/domain/`

Lyrixa es la herramienta de autoría; este proyecto es el **renderer**. El
bundle `.lyrixa.json` es la frontera entre los dos, y por eso se trata como un
**contrato externo estable**: se valida, se normaliza y recién entonces entra
al modelo interno. Nada fuera de `domain/` sabe cómo viene escrito el JSON.

```
archivo / URL / IPC   →  lyricsBundleLoader   (transporte)
                      →  lyrixaBundle.ts      (validar → normalizar)
                      →  LyrixaLyricsBundleEnvelope   (modelo interno)
                      →  lyricsLayerSelection (qué capas mostrar)
                      →  runtime/             (dibujar)
```

Cada flecha es un archivo distinto **a propósito**. La regla dura:
_ninguna lógica de importación dentro de un renderer, ninguna lógica de Lyrixa
dentro de un componente React._

---

## 1 · Qué preserva el parser

| Campo               | Dónde | Se preserva | Se usa hoy                     |
| ------------------- | ----- | ----------- | ------------------------------ |
| `role`              | capa  | ✅          | selección de capas             |
| `roleRaw`           | capa  | ✅          | etiquetado (rol desconocido)   |
| `language`          | capa  | ✅ (BCP-47) | selección por idioma           |
| `languageRaw`       | capa  | ✅          | etiquetado                     |
| `sourceId`          | clip  | ✅          | relacionar original ↔ variante |
| `originalText`      | clip  | ✅          | disponible al renderer         |
| `words[]`           | clip  | ✅          | **nada todavía** (ver §5)      |
| estilos / anim / fx | ambos | ✅          | render                         |

### Roles semánticos

```ts
type LyrixaLayerRole =
	| 'primary'
	| 'translation'
	| 'transliteration'
	| 'romanization'
	| 'backing'
	| 'fx'
	| 'annotation';
```

`transliteration` y `romanization` conviven en vez de colapsarse: el usuario que
elige una segunda línea sí distingue "romaji" de "transliteración genérica".
El código que sólo pregunta _"¿es el mismo texto en otra escritura?"_ usa
`LYRIXA_SCRIPT_ROLES` en lugar de comparar contra un literal.

**Un rol desconocido no se descarta.** Lyrixa avanza a su propio ritmo, así que
`role: 'karaoke'` desde un build más nuevo es el caso _esperado_, no dato
corrupto. Se guarda en `roleRaw` y `role` queda `undefined`. Antes se
descartaba, lo que era peor de lo que parece: la capa caía al camino legacy
basado en `layerType` y terminaba adivinando algo que el bundle **sí había
declarado**.

> Un test de 2026-08 celebraba explícitamente ese descarte
> (`'drops a role it does not understand'`). Se invirtió.

### La regla legacy, y cuándo deja de aplicar

Los bundles anteriores a los roles no tenían `role`, y el puente del
transcriptor ponía **las traducciones en el canal `backing`**. Por eso:

- si **ninguna** capa declara rol → `layerType: 'backing'` significa traducción;
- si **alguna** capa declara rol (aunque sea uno desconocido, vía `roleRaw`) →
  el bundle habla el idioma nuevo y `backing` vuelve a significar coros.

Esa inferencia vive en **una sola función** (`describeLyrixaLayers`). Ningún
otro archivo lee `layer.role` para decidir qué carga una capa.

### Idiomas

Se canonizan con `Intl.getCanonicalLocales` (`JA` → `ja`, `zh-hant` →
`zh-Hant`) porque el idioma va a ser un **selector**: quien elige "Español"
debe encontrar la capa tanto si dice `es` como `es-419`. Las etiquetas que
`Intl` rechaza (`ja_JP`) se conservan tal cual — una etiqueta rara sigue siendo
distinguible, y perderla fusionaría dos capas que el autor quiso separar.
El emparejado (`languageMatches`) compara el **subtag primario**.

---

## 2 · Relacionar original ↔ traducción ↔ romanización

`sourceId` es la única forma honesta de decir "esta línea en español es aquella
línea en japonés". Emparejar por posición en el array se rompe apenas un
traductor fusiona dos líneas en una, que es justo lo que hacen los traductores.

```ts
buildLyricsClipIndex(bundle); // → { byId, sourceOf, derivedFrom }
groupLyricsClipsBySource(bundle); // → [{ root, variants[] }]
```

Degradaciones cubiertas por tests: `sourceId` que apunta a un clip inexistente
(el clip pasa a ser su propia raíz), ausencia total de `sourceId` (un grupo por
clip) y **ciclos** `a → b → a` de un exportador con bug (se cortan, no cuelgan).

---

## 3 · Selección de capas

```ts
selectLyricsLayerIds(bundle, {
	primary: { roles: ['primary'] },
	secondary: { roles: ['romanization', 'transliteration'] }
});
```

Dos slots y no una lista arbitraria porque es la forma de lo que la gente pide
—"original + romaji", "original + traducción"— y porque apilar más de dos
líneas deja de leerse.

**Estado:** el módulo existe, está probado y exportado por la fachada. La UI
sigue usando el switch binario `audioLyricsShowTranslation`. Cambiar eso
implica una key persistida nueva (⇒ bump de `STORE_PERSIST_VERSION` + migración)
y es una fase aparte: ver §6.

---

## 4 · Cargar el bundle (transporte)

`lyricsBundleLoader.ts` separa _de dónde vienen los bytes_ de _qué son_:

```ts
loadLyricsBundleFromFile(file); // hoy: el input del tab
loadLyricsBundleFromText(text, origin); // cola compartida
loadLyricsBundleFromUrl(url, { fetchImpl }); // servicio local / URL
registerLyricsBundleProvider(provider); // futuro: IPC del desktop
```

Todos devuelven `{ bundle, origin }`. El error es un `LyricsBundleLoadError`
con `reason: 'read' | 'parse' | 'invalid'` — distinguir "no pude leer el
archivo" de "no es un bundle" es lo que permite un mensaje útil.

El registro de providers **no tiene ningún provider registrado hoy**. Existe
para que agregar IPC del suite de escritorio sea registrar una función al
arrancar, no tocar la UI de lyrics.

> Antes, `handleImportLyrixaBundle` hacía `JSON.parse(await file.text())`
> **dentro de un componente React**: el componente era dueño del transporte.
> Con dos transportes eso se vuelve una rama; con IPC, un componente React que
> sabe de IPC.

---

## 5 · `words[]`: preservado, no dibujado

```ts
interface LyrixaLyricWord {
	text: string;
	startTime: number; // segundos desde el inicio del track, igual que el clip
	endTime: number;
	score?: number; // confianza del transcriptor 0–1
}
```

**Nada los dibuja.** Se parsean igualmente porque la alternativa es que el
usuario importe un bundle con timing por palabra, guarde el proyecto y los
timings desaparezcan sin que nada lo diga: un import silenciosamente lossy.

Las palabras inservibles (sin texto, tiempos no finitos) se descartan una por
una, nunca la línea entera — un transcriptor que emite una palabra mala no
debería costarle al usuario el verso completo.

Lo que esto habilita cuando alguien lo construya: highlight palabra a palabra,
karaoke, glow progresivo, glitch por palabra, animación atada a la pronunciación.
`hasWordTimings(bundle)` responde si vale la pena ofrecer ese modo.

---

## 5b · Posición de un clip: preset gana a `coords`

Lyrixa lo declara en `core/types/clip.ts`: _"Named position preset; wins over
`coords` when both are present"_. `'center'` es el valor con el que nace todo
clip, así que cuenta como "sin preset".

| `position`            | `coords` | Dónde se dibuja                            |
| --------------------- | -------- | ------------------------------------------ |
| ausente o `'center'`  | sí       | En `coords` (fracción 0–1 del canvas)      |
| ausente o `'center'`  | no       | `renderSettings.positionPreset` de la capa |
| cualquier otro preset | sí / no  | El preset del clip; `coords` se ignora     |

Hasta 2026-09-13 los dos renderers de Vibrix hacían lo contrario (`coords`
ganaba). Ahora ambos pasan por `resolveClipCoords(clip)`
(`src/features/lyrics/domain/lyrixaBundle.ts`). Hoy ni Lyrixa ni el
Transcriptor emiten `coords`; la regla existe para que no diverjan cuando
alguien lo haga.

---

## 6 · Lo que queda para una fase siguiente

1. **UI de selección primaria/secundaria.** El motor está; falta la key
   persistida (`audioLyricsLayerSelection`), su migración y el reemplazo del
   toggle binario. Es un cambio de producto, no de parser.
2. **Renderer word-sync.** Hoy `LyricsOverlay` y `lyrixaBundleRenderer` dibujan
   por clip. Un modo por palabra necesita decidir cómo interactúa con los modos
   de color rotatorios ya existentes.
3. **Provider de IPC**, cuando exista el shell de escritorio (ver
   `docs/plans/DESKTOP_SUITE_READINESS.md`).
4. **`schemaVersion` 2.** Hoy el parser rechaza todo lo que no sea `1`. Cuando
   Lyrixa suba de versión hay que decidir si se acepta hacia adelante con
   degradación o se sigue rechazando.

---

## Tests

`lyrixaBundleContract.test.ts` (25) y `lyricsBundleLoader.test.ts` (7) cubren:
bundles legacy · roles declarados · roles desconocidos · casing de roles ·
idiomas canonizados · idiomas inválidos · `sourceId` (directo, colgante,
ausente, cíclico) · N capas (6) · `words[]` presente/ausente/parcialmente
inválido · resiliencia del parser (no-objeto, arrays sucios, proyecto vacío) ·
selección por rol y por idioma · los tres modos de fallo del loader ·
alta y baja de un provider.
