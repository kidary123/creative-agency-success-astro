# Reglas de este repo

Reconstrucción de un archivo de Figma en Astro. `design-manifest.json` es la
única fuente de verdad: si una medida no está ahí, no se inventa — se vuelve a
extraer del archivo.

## Antes de tocar layout

1. **Toda primitiva reutilizable lleva su propio `<style>`**, aunque esté casi
   vacío. Astro solo añade `data-astro-cid-…` a los componentes con estilos
   propios; sin él, las reglas del padre se compilan contra un atributo que no
   existe y "el CSS no hace efecto" sin ningún error.
2. **Insets por capa, en % del bloque contenedor**, nunca la caja del
   componente entero. Los SVG exportados llevan `preserveAspectRatio="none"` y
   se estiran. Usa `<Layer>`.
3. **Capas giradas**: `container-type: size`, ejes intercambiados
   (`100cqh`/`100cqw`), y centrado **solo con `translate: -50% -50%`**.
   `translate` y `rotate` como propiedades sueltas, nunca dentro de
   `transform` — ahí vive el hover.
4. **`minmax(0, 1fr)`** en cualquier pista de rejilla con formularios dentro, y
   `min-inline-size: 0` en el input. Un `<input>` trae ~20 caracteres de ancho
   preferido que ninguna regla de `width` le quita, y eso da scroll horizontal
   a toda la página.
5. **En táctil, apaga el patrón de escritorio de verdad**: la proporción de la
   imagen, los `:hover` (repetidos dentro de la media query, misma
   especificidad, más abajo) y cualquier estilo en línea que escriba el JS — un
   estilo en línea le gana a la media query.
6. **Reservar altura**: `ResizeObserver`, no `requestAnimationFrame`, y escribe
   solo si el valor cambió. Ver `src/scripts/reservar-alto.js`.

## Imágenes

`npm run assets` descarga y optimiza en un solo paso. La optimización es
idempotente vía `.optimized.json` (versionado a propósito): WebP tiene pérdida
y recomprimir su propia salida degrada las imágenes de forma acumulativa.
Nunca borres solo el registro.

## Animación

Todo pasa por `data-animate`. El script de verificación congela exactamente ese
atributo; una transición suelta en CSS sobrevive al congelado y sale movida en
la captura. Y nunca uses `* { transform: none }` para capturar: también anula
las rotaciones del arte y la captura miente.

## Caducidades

- Sesión de Vercel: muere cada pocas horas → `LOGIN-VERCEL.bat`.
- URLs firmadas de Figma en `assets.json`: ~7 días → regenerar el manifest.
