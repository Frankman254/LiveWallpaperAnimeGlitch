# Reglas de jerarquía para todas las pestañas del editor (enforced)

**Estado:** plan aprobado · enforcement vía scaffold compartido en `src/ui`  
**Decisión de producto:** slots arriba (bajo el header) · reset en el footer · orden garantizado por componente, no por convención

---

## Contexto

El editor creció orgánicamente y cada pestaña organiza sus elementos a su manera:

- El **switch maestro** a veces va en el header (Spectrum) y a veces en el body.
- Los **slots de guardado** a veces arriba (Motion, Logo) y a veces abajo (Spectrum, Looks, Track Title).
- El botón **Reset** a veces en el header (Logo, Track Title), a veces en el footer (Spectrum, Looks), a veces por sección (Motion).

El resultado es una UI inconsistente donde cuesta encontrar cada cosa.

## Objetivo

Definir una **jerarquía canónica para TODAS las pestañas** y hacerla **estructuralmente obligatoria** mediante un scaffold compartido, de modo que:

1. Sea imposible desordenar una pestaña existente.
2. Toda pestaña nueva nazca ordenada por construcción.

---

## Anatomía canónica (de arriba a abajo)

### 1. Header

Título de la pestaña + switch maestro (si lo hay) + controles inline opcionales (color-source / modo primario).

**Único lugar permitido para el switch maestro.**

Componente: `EditorTabHeader` (`src/ui/EditorTabHeader.tsx`).

### 2. Saved Profiles (slots)

Directamente bajo el header, **misma posición en todas** las pestañas que tengan perfiles guardados.

Slot del scaffold: `savedProfiles` en `EditorTabLayout`.

### 3. Body

Secciones de control en **orden semántico**:

```
fuente / identidad → apariencia → reactividad de audio → avanzado
```

| Tipo de sección   | Componente                       | Notas                                         |
| ----------------- | -------------------------------- | --------------------------------------------- |
| Primario          | `SectionCard` (level 1)          | Siempre visible cuando la feature está activa |
| Avanzado          | `CollapsibleSection` (colapsado) | Envuelto en `AdvancedOnly`                    |
| Ocultar al apagar | `FeatureGate`                    | Ya implementado en pestañas existentes        |

Slot del scaffold: `children` en `EditorTabLayout`.

### 4. Footer

Reset / recovery, **siempre al final**. Zona de acciones destructivas.

Componente: `EditorTabFooter` (`src/ui/EditorTabFooter.tsx`).

---

## Reglas duras

| Elemento         | Dónde va                           | Prohibido                  |
| ---------------- | ---------------------------------- | -------------------------- |
| Switch maestro   | Solo header                        | En el body o suelto        |
| Slots de perfil  | Solo `savedProfiles` (bajo header) | Abajo del body o mezclados |
| Reset / recovery | Solo footer                        | Header, body o por sección |

Nada de switches ni reset sueltos en el body.

---

## Mecanismo de enforcement

Scaffold compartido en `src/ui`:

| Componente        | Responsabilidad                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `EditorTabLayout` | Renderiza slots en orden fijo: `header` → `savedProfiles` → `children` → `footer`, con espaciado consistente |
| `EditorTabHeader` | Título + switch maestro + controles inline opcionales                                                        |
| `EditorTabFooter` | Reset / recovery al final                                                                                    |

Cada `Modern*Tab` **DEBE** devolver este scaffold. El orden queda garantizado por el componente, no por convención ni por disciplina del autor.

```tsx
<EditorTabLayout
  header={<EditorTabHeader ... />}
  savedProfiles={<ProfileSlotsEditor ... />}
  footer={<EditorTabFooter ... />}
>
  {/* body: secciones en orden semántico */}
</EditorTabLayout>
```

La documentación inline en `EditorTabLayout.tsx` es la fuente de verdad en código.

---

## Migración por pestaña (checklist)

| Pestaña                                                         | Slots → arriba  | Reset → footer  | Switch → header  | Notas                                           |
| --------------------------------------------------------------- | --------------- | --------------- | ---------------- | ----------------------------------------------- |
| Spectrum                                                        | ✓ (referencia)  | ✓               | ✓                | Primera migración completa                      |
| Looks                                                           | pendiente       | pendiente       | N/A              |                                                 |
| Track Title                                                     | pendiente       | pendiente       | revisar          |                                                 |
| Logo                                                            | N/A (ya arriba) | pendiente       | revisar          |                                                 |
| Motion                                                          | fase aparte     | pendiente       | pendiente        | Unificación de slots en reestructuración Motion |
| Audio, Editor, Scene, Layers, Lyrics, Diagnostics, Perf, Export | según aplique   | si tienen reset | si tienen switch | Header (título) + body + footer mínimo          |

---

## Verificación

Tras cada fase o pestaña migrada:

1. `npx tsc --noEmit` limpio y `npm run build` ✓
2. En cada pestaña, confirmar el mismo orden visual en editor compacto y maximizado (ambos usan los mismos `Modern*Tab`):
    - header + switch arriba → slots → body → reset al fondo
3. Regresión: apagar/encender switches y cargar/guardar slots sigue funcionando; ningún control desaparece ni cambia de comportamiento, **solo de posición**.
