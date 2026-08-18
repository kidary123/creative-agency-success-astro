# HANDOVER — Creative Agency Success en Astro

Reconstrucción del frame `Desktop` (`21:7`) del archivo
`jXvZyzTAejZDdFwKlHIScm` en Astro estático. `design-manifest.json` es la única
fuente de verdad de medidas, colores, tiempos y curvas.

---

## 1. Lo que hay que saber antes de tocar nada

### El contenedor no puede descargar assets de Figma

Éste es el hallazgo que más condicionó el pipeline y **no está en
`references/04-trampas.md`**. Lo añado abajo con el formato de las trampas.

Resumen: el proxy de red del entorno de ejecución bloquea `figma.com` por
completo (`CONNECT tunnel failed, response 403`). `get_design_context` y
`download_assets` devuelven URLs firmadas que aquí **no se pueden descargar**,
así que `scripts/get-assets.mjs` no sirve tal cual.

**La salida fue exportar los vectores por el canal del plugin**, que no pasa por
la red del contenedor:

```js
const n = await figma.getNodeByIdAsync("85:816");
return await n.exportAsync({ format: "SVG_STRING" });   // texto, no URL
```

Los 22 SVG de `public/assets/` salieron así. Son bytes exportados por Figma, no
trazados escritos a mano.

### Los raster siguen pendientes

Un raster en base64 por el mismo canal cuesta cientos de KB de contexto por
imagen, así que no se trajeron. `src/components/Foto.astro` los resuelve en
tiempo de construcción: si el archivo existe en `public/assets/fotos/<id>.webp`
(o `.jpg` / `.png` / `.avif`) lo pinta; si no, deja un marcador con la **caja
exacta del diseño**, de modo que el layout ya es el definitivo y meter las fotos
no mueve nada.

Ids esperados (ver `design-manifest.json` → `rasterPendientes`):

| id | caja | nodo |
|---|---|---|
| `hero-retrato` | 388×365 | `1295:1565` |
| `retrato-1` … `retrato-7` | 180×348 | `82:206`…`82:218` |
| `prensa-forbes`, `prensa-abc`, `prensa-entrepreneur`, `prensa-nypost`, `prensa-regexseo`, `prensa-agencyhighway` | varias | `46:77`…`89:447` |
| `video-poster` | 922×492 | `89:442` |
| `metodo-foto` | 570×326 | `89:281` |
| `cta-foto` | 628×422 | `233:1878` |
| `recurso-1` … `recurso-4` | 298×210 | `89:331`, `189:220`, `189:229`, `189:238` |

`hero-retrato` y `cta-foto` deben exportarse **con fondo transparente**: van
recortadas sobre el arte vectorial.

Para conseguirlas: en Figma, seleccionar cada nodo → Export → WebP/PNG 1x, y
dejarlas en `public/assets/fotos/` con esos nombres. Después `npm run build`.

---

## 2. Decisiones tomadas

### Tipografía

El original usa **Arboria** (Fontfabric, de pago). Sustituta: **Hanken Grotesk
Variable**, auto-hospedada vía `@fontsource-variable/hanken-grotesk`. Es
geométrica-humanista con «a» de dos pisos, que es lo que más se acerca. Se
auto-hospeda a propósito: Google Fonts tampoco es accesible desde este entorno,
y así las capturas de verificación se hacen con la tipografía real.

Si se compra la licencia de Arboria, basta cambiar `--f-titulo` en
`src/styles/tokens.css` y añadir los `@font-face`. Nada más depende de ello.

### La escala tipográfica no era la que parecía

Medida sobre los nodos, no estimada sobre la captura:

| rol | valor real | nodo |
|---|---|---|
| h1 hero | 60px Bold | `175:447` |
| titular de sección | **36px Medium**, no bold | `42:70`, `42:15`, `85:514`, `89:444` |
| banda de tarjeta | 36px Medium | `57:633` |
| cuerpo / intro | 18px Regular | `42:16`, `34:3`, `57:655` |
| cifra | 32px Medium **#8686F2** | `85:667` |
| pie de cifra | 20px Book #021E46 | `85:668` |
| etiquetas de la rueda | 21px Book | `53:41` |

Las cifras en morado y los titulares en Medium son los dos que más cambian la
percepción del conjunto: con Bold y azul el bloque se ve mucho más pesado que
el original.

### Los cuatro hover de arte son giros puros

Comparando nodo a nodo cada variante de reposo con la de hover, **los centros
coinciden con precisión decimal**. Las cajas (AABB) que crecen lo hacen solo
como consecuencia del giro. Verificado con la fórmula del AABB rotado:

```
w' = w·cos θ + h·sin θ        # 316.14·cos7.21 + 238.56·sin7.21 = 343.58 ✓
```

Es decir: **no hay escala ni desplazamiento en ninguno de los cuatro.** Si se
implementan como `scale()` derivando del AABB, sale mal.

| capa | nodo | reposo → hover | delta CSS |
|---|---|---|---|
| rayas | `85:783` | 0° → 7.21° | `rotate: 7.21deg` |
| contorno acelerador | `85:816` | 0° → −6.97° | `rotate: -6.97deg` |
| masa escala | `89:211` | −90° → −84.32° | `rotate: 5.68deg` |
| contorno escala | `89:212` | −90° → −98.74° | `rotate: -8.74deg` |
| masa rueda | `89:280` → `89:286` | 0° → −1.74° | trazado distinto → fundido cruzado |

El CTA (`233:1888`) sí escala: 501.31×446 → 527.57×467.52 = **1.0524 exacto** en
ambos ejes, más +4.04° en la máscara y −3.42° en el trazo.

### Duraciones y curvas: salen del archivo, no del gusto

Leídas de `node.reactions`. `EASE_IN_AND_OUT_BACK` →
`cubic-bezier(0.68, -0.55, 0.265, 1.55)`; `EASE_OUT` →
`cubic-bezier(0, 0, 0.58, 1)`. Todas viven en `tokens.css` como `--d-*`.

| elemento | ms | curva |
|---|---|---|
| enlaces de nav | 300 | back |
| botón secundario | 300 | out |
| botón principal | 350 | back |
| enlace de recurso · CTA | 500 | back · out |
| arte de las tarjetas | 600 | back |
| logo · testimonio (clic) | 700 | back |
| rueda | 800 | back |
| tira de historias | 950 | back |

### Los exports vienen ya girados

`exportAsync` devuelve el nodo **tal como se ve**, no su geometría sin girar.
Por eso las capas de `art13` van con `rotacion: 0` en `<Layer>` aunque en Figma
estén a −90°: volver a girarlas duplicaría el giro. El giro del hover sí es un
delta y se aplica encima.

`art13-contorno` se exporta a 389×328 cuando su caja es 386×325: es el sangrado
del trazo de 2.21px. Compensado con `sangrado={{ x: 1.00573, y: 1.0068 }}`.

### El logo no es un fundido cruzado

Entre `62:6` y `138:241` solo cambian dos rellenos (escudo `#021E46` ↔ blanco,
wordmark blanco ↔ `#021E46`); el borde degradado se queda igual. Por eso el SVG
va **en línea** en `Logo.astro` con los dos rellenos en custom properties — un
`<img>` no hereda variables CSS. Los ids del degradado se aleatorizan por
instancia para que cabecera y pie no se pisen la definición.

---

## 3. Pendiente de contenido

No son fallos: son cosas que el propio Figma deja sin cerrar.

- **Los seis testimonios acaban en `- Name`.** Faltan los nombres reales.
- **El formulario del boletín no tiene backend.** `<form novalidate>` sin
  `action`. Conectar a Mailchimp / ConvertKit / lo que use el cliente.
- **`Recurning Revenue`** (`53:46`) — errata en el original. Se ha respetado tal
  cual. También `The Journey To Your Sucess` (`42:70`) y `Sucess Stories` en el
  menú. Si se corrigen, corregirlos también en Figma.
- **Copyright ©2022.** Conviene actualizarlo.
- **Los enlaces del menú apuntan a anclas de esta misma página.** En Figma
  navegan a otras pantallas (`319:1165` Project Page, `414:1264` Resources,
  `319:533` Services, `271:805` About, `347:1199` Podcast, `275:1713` Contact),
  que no están en este alcance.
- **Dos historias se titulan «Control»** (`85:462` y `85:463`). Parece un
  descuido del original.

---

## 4. Trampa nueva, con el formato de `references/04-trampas.md`

### 9. La red del entorno puede bloquear figma.com aunque el MCP funcione

**Síntoma.** `get_design_context` y `get_metadata` responden perfectamente, pero
`curl` sobre cualquier URL de `figma.com/api/mcp/asset/...` devuelve
`curl: (56) CONNECT tunnel failed, response 403`, y `WebFetch` responde
`ROBOTS_DISALLOWED`. Parece un problema de las URLs firmadas —caducan a los 7
días— y no lo es: son válidas, lo que no hay es salida de red.

**Causa.** El MCP de Figma viaja por un canal distinto al del proxy HTTP del
contenedor. Que el MCP conteste no dice nada sobre si `figma.com` está en la
lista blanca del proxy. `scripts/get-assets.mjs` da por hecho que sí.

**Remedio.** Comprobarlo **en la fase 1**, antes de planificar los assets:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" --max-time 10 https://www.figma.com/favicon.ico
```

Si sale `000`, no reintentar la descarga: sacar los vectores por el plugin con
`exportAsync({ format: "SVG_STRING" })`, que devuelve texto por el canal del
MCP. Exportar antes los **tamaños** de todos los nodos en una sola llamada para
planificar los lotes: un nodo con una foto incrustada puede pesar 11 MB de SVG
(el `data:` en base64 dentro), y hay que bajar a sus hijos vectoriales.

Los raster no tienen salida por este camino y hay que pedírselos al usuario.
Conviene que el componente de imagen los resuelva en build y deje un marcador
con la caja exacta mientras tanto: así el layout se termina igual y la
sustitución posterior no mueve nada.

### 10. Reservar la altura máxima también deja hueco muerto

**Síntoma.** El acordeón ya no salta al abrirse, pero en reposo hay medio scroll
de vacío. La trampa 7 resuelta al revés.

**Causa.** Reservar siempre la altura del panel más alto es correcto para no
saltar, pero en Figma el frame **solo** crece mientras el puntero está encima
(variantes `85:457`…`85:463`, de 756 a 828px, frente a 489 en reposo).

**Remedio.** Nada de JS: las alturas de las variantes son constantes conocidas,
así que van en CSS con `:has()`, con la transición en `min-block-size`.

```css
.tira { min-block-size: 489px; transition: min-block-size .95s var(--e-back); }
@media (min-width: 62rem) {
  .tira:has(.columna:nth-child(4):hover) { min-block-size: 828px; }
}
```

La sección pasó de 2389px a 1235px en reposo, sin perder la apertura.

### 11. En móvil, siete tarjetas apiladas siguen siendo el patrón de escritorio

**Síntoma.** A 390px la sección medía 4936px. Sin `:hover` pegado, sin estilos
en línea, sin proporción heredada — las tres causas de la trampa 6 descartadas.

**Causa.** El error era anterior: apilar es una decisión de layout que el
original no toma. Figma tiene un componente de móvil aparte (`195:664`,
375×324, seis variantes) que es un carrusel.

**Remedio.** Buscar siempre si existe el componente de móvil antes de inventar
el responsive. Aquí, `scroll-snap-type: x mandatory` con
`flex: 0 0 min(86%, 420px)`: 4936px → 1177px.

---

## 5. Operación

```bash
npm install
npm run dev        # o DEV.bat
npm run build
npm run verificar  # capturas a 390 / 768 / 1440 + diagnóstico de desbordes
node scripts/verify-hovers.mjs   # estados hover, que las capturas estáticas no ven
```

`scripts/verify-screenshots.mjs` y `verify-hovers.mjs` apuntan al Chromium
preinstalado vía `PW_CHROMIUM` (por defecto `/opt/pw-browsers/chromium`). En una
máquina normal, `npx playwright install chromium` y quitar `executablePath`.

Ambos scripts congelan **solo** `[data-animate]`. Un `* { transform: none }`
anularía también las rotaciones del arte y la captura mentiría sobre un layout
que está bien.

### Estado de la verificación (última pasada)

Sin scroll horizontal en 390 / 768 / 1440. Alturas por sección a 1440:
hero 572 · historias 1235 · confianza 744 · servicios 1084 · testimonios 445 ·
metodo 1025 · recursos 919 · cta-final **520** (el original: 520 exactos).
