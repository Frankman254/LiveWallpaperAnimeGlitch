# Sesión Claude — jerarquía de pestañas del editor

**Fecha:** 2026-06-05  
**Fuente:** terminal Cursor (`terminals/1.txt`, sesión `editor-tab-hierarchy-rules`)  
**Plan:** [PLAN_JERARQUIA_PESTANAS.md](./PLAN_JERARQUIA_PESTANAS.md)

---

## Resumen ejecutivo

Claude ejecutó el plan de jerarquía canónica para pestañas del editor: creó el scaffold de enforcement en `src/ui`, migró **Spectrum** como pestaña de referencia, y dejó el resto de pestañas pendientes de aplicar el mismo patrón.

Al cierre de la sesión: **tsc limpio**, **build verde**, Spectrum validada end-to-end como referencia visual.

---

## Plan original (texto de terminal)

> Reglas de jerarquía para todas las pestañas del editor (enforced)

### Context

El editor creció orgánicamente y cada pestaña organiza sus elementos a su manera: el switch maestro a veces va en el header (Spectrum) y a veces en el body; los slots de guardado a veces arriba (Motion, Logo) y a veces abajo (Spectrum, Looks, Track Title); el botón Reset a veces en el header (Logo, Track Title), a veces en el footer (Spectrum, Looks), a veces por-sección (Motion). El resultado es una UI inconsistente ("desordenada") donde cuesta encontrar cada cosa.

### Objetivo

Definir una jerarquía canónica para TODAS las pestañas y hacerla estructuralmente obligatoria mediante un scaffold compartido, de modo que sea imposible desordenar y que toda pestaña nueva nazca ordenada.

**Decisiones del usuario:** slots arriba (bajo el header) · reset en el footer · enforcement vía scaffold compartido.

### Reglas de jerarquía (anatomía canónica de una pestaña, de arriba a abajo)

1. **Header** — título de la pestaña + switch maestro (si lo hay) + controles inline opcionales (color-source / modo primario). Único lugar para el switch maestro.
2. **Saved Profiles (slots)** — directamente bajo el header, misma posición en todas.
3. **Body** — secciones de control en orden semántico: fuente/identidad → apariencia → reactividad de audio → avanzado. Primario en SectionCard (level 1); avanzado en CollapsibleSection (colapsado, envuelto en AdvancedOnly); ocultar-al-apagar con FeatureGate (ya hecho).
4. **Footer** — Reset / recovery, siempre al final, zona de acciones destructivas.

**Reglas duras:** el switch maestro va SOLO en el header; los slots SOLO en su posición superior; el reset SOLO en el footer. Nada de switches/reset sueltos en el body.

### Mecanismo de enforcement: scaffold compartido (nuevo, en src/ui)

`EditorTabLayout` renderiza los slots en orden fijo (header → savedProfiles → body → footer) con espaciado consistente. Cada `Modern*Tab` DEBE devolver este scaffold, así el orden queda garantizado por el componente, no por convención.

---

## Fases de implementación

### Fase A — Scaffold (completada)

Archivos creados en `src/ui/`:

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `EditorTabLayout.tsx` | 42 | Orden fijo header → slots → body → footer |
| `EditorTabHeader.tsx` | 59 | Título + switch maestro + controles inline |
| `EditorTabFooter.tsx` | 25 | Zona reset/recovery al final |

Exportados desde `src/ui/index.ts`.

**Validación:** `npx tsc --noEmit` ✓ (Phase A)

### Fase B — Spectrum como referencia (completada)

Cambios en `ModernSpectrumTab.tsx`:

- Switch maestro ya estaba en header ✓
- **Slots movidos de abajo → arriba** (bajo header) ✓
- **Reset/recovery movido al footer** ✓
- Cuerpo intacto: quick adjust → sections → view

Reconstrucción del `return` vía script Python para reubicar bloques sin retipear lógica. Imports actualizados: `EditorTabLayout`, `EditorTabHeader`, `EditorTabFooter`.

**Validación:** `npx tsc --noEmit` ✓ · `npm run build` ✓ (~2.3s)

---

## Estado al cierre de sesión

### Hecho

- Scaffold de enforcement en `src/ui`
- Spectrum migrada y compilando
- Reglas registradas en JSDoc de `EditorTabLayout` y en memoria del agente

### Pendiente (mismo patrón que Spectrum)

| Pestaña | Trabajo |
|---------|---------|
| Looks | slots abajo→arriba, reset→footer |
| Track Title | slots abajo→arriba, reset→footer |
| Logo | reset header→footer (slots ya arriba) |
| Motion | header + footer unificado; slots en fase aparte (reestructuración Motion) |
| Resto | Audio, Editor, Scene, Layers, Lyrics, Diagnostics, Perf, Export: header (título) + body + footer si tienen reset |

### Siguiente acción acordada

Usuario: *"sí, continúa con todas las pestañas"* — migrar Looks, Logo, Track Title y el resto con el scaffold probado en Spectrum.

---

## Criterios de aceptación (checklist de terminal)

1. `npx tsc --noEmit` limpio y `npm run build` ✓ tras cada fase.
2. App en marcha: en cada pestaña confirmar el mismo orden visual (header+switch arriba → slots → body → reset al fondo) en el editor compacto y en el maximizado (ambos usan los mismos `Modern*Tab`).
3. Regresión: apagar/encender switches y cargar/guardar slots sigue funcionando; ningún control desaparece ni cambia de comportamiento, solo de posición.

---

## Recap del agente (final de sesión)

> **Goal:** enforce consistent hierarchy across all editor tabs via a shared scaffold.  
> **Done:** scaffold built plus Spectrum migrated as reference (slots top, reset footer, switch header), building green.  
> **Next:** migrate Looks, Logo, and Track Title the same way.
