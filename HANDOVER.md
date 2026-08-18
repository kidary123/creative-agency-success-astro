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

---

## 6. Despliegue

**No se pudo hacer desde el entorno de reconstrucción.** El mismo proxy que
bloquea `figma.com` bloquea también `vercel.com` y `api.vercel.com`, y la
sesión de GitHub está limitada al repositorio que tiene configurado
(`This GitHub API path is not available: sessions are bound to their configured
repositories`), así que no se pudo crear uno nuevo.

El repositorio local **ya está inicializado y con el primer commit hecho** en la
rama `main`. Desde tu máquina:

```bash
# 1. repo
gh repo create creative-agency-success-astro --public --source=. --remote=origin --push
#    (o crearlo a mano en github.com y luego:)
#    git remote add origin git@github.com:<usuario>/creative-agency-success-astro.git
#    git push -u origin main

# 2. Vercel — detecta Astro solo, sin configuración
npm i -g vercel
vercel login
vercel link --yes
vercel --prod
```

O más simple: importar el repo desde el panel de Vercel. Detecta Astro
automáticamente (`npm run build` → `dist/`) y deja el auto-deploy en cada push.

Los `.bat` de la raíz (`DEV.bat`, `DEPLOY-ME.bat`, `LOGIN-VERCEL.bat`,
`GET-ASSETS.bat`) siguen sirviendo en Windows una vez hecho el `vercel login`.

> `GET-ASSETS.bat` / `npm run assets` **no funcionará** mientras las URLs
> firmadas del manifest estén caducadas (7 días) o si tu red también bloquea
> `figma.com`. Para las fotos, la vía fiable es exportarlas a mano desde Figma
> a `public/assets/fotos/` con los ids de la tabla de la sección 1.

---

## 7. Ronda de ajustes (2026-08-18)

### Dos errores míos que conviene conocer

**1. Identificadores de imagen inventados.** La primera versión de `FOTOS.bat`
llevaba UUIDs que no consulté al archivo: solo unos pocos eran reales, el resto
me los inventé. Por eso fallaban casi todas las descargas y el "fondo" que se
veía tras el hombre del hero era en realidad el marcador rayado de
`Foto.astro`. Los 21 de la versión actual están consultados uno a uno con
`download_assets` / `get_design_context`. **Regla: ningún identificador de
asset se escribe de memoria.**

**2. La cuña #F4F1EF estaba una sección más abajo.** En el volcado de
`get_metadata`, el nodo `42:72` aparece con `x=1440, y=2764.99` — pero está
girado 180°, y lo que reporta es su **esquina inferior derecha**. Su origen real
es `x=0, y=1923`, o sea que es el fondo de *Collective Confidence*, no el de
*Agency Accelerator*, que va sobre el blanco del frame.

> **Trampa 12.** Un vector girado reporta en `get_metadata` una caja que no es
> su origen. Antes de anclar un fondo a una sección, confirma la caja con
> `absoluteBoundingBox` relativo al frame — es lo único fiable. Y el giro
> también invierte la inclinación: `42:72` tiene el borde recto arriba y el
> inclinado abajo (94.55% → 100%), no al revés.

### Cambios aplicados

| # | Qué | Dónde |
|---|---|---|
| 1 | Menú agrupado a la derecha (`justify-content: flex-end`, gap 34) | `Nav.astro` |
| 2 | El retrato del hero nunca lleva fondo propio; `object-fit: contain` | `Hero.astro` |
| 3 | Tira a sangre (`100vw`) y expansión horizontal que desplaza a las demás | `Historias.astro` |
| 4 | Cuña #F4F1EF de `42:72` con su inclinación real | `Confianza.astro` |
| 5 | Sin fondo en Servicios; insignia a 78.5% / 69% | `Servicios.astro` |
| 6 | Fuera `overflow: hidden`; padding+margen negativo para el arte al crecer | `CtaFinal.astro` |
| 7 | Logo del pie fijo: escudo blanco, letras azules | `Pie.astro` |
| 8 | Metadatos completos + JSON-LD `@graph` | `Base.astro`, `src/data/sitio.ts` |
| 9 | `/llms.txt`, `/catalog.txt`, `/sitemap.xml`, `robots.txt`, markdown, manifest, favicon, OG | `src/pages/*`, `public/` |
| 10 | En táctil, tarjetas apiladas sin hover ni expansión | `Historias.astro` |
| 11 | En táctil, los seis pasos pasan a lista numerada bajo la rueda | `Metodo.astro` |

### Sobre el punto 11

El fallo no era solo que las etiquetas se pisaran: al pasar `.rueda` a
`position: static` en móvil, sus capas absolutas perdieron el bloque contenedor
y la foto se salía encima de la lista. Va con `position: relative`. Y la cuña
`::after` necesita `z-index: -1` para pintarse sobre el fondo de la sección
pero por debajo del contenido.

### Capa AI/SEO

- `/llms.txt` y `/catalog.txt` **se generan** desde `src/data/sitio.ts`
  (`src/pages/llms.txt.ts`, `catalog.txt.ts`). No se editan a mano: así no
  pueden desincronizarse de lo que se pinta.
- `/catalog.txt` es TSV con cabecera: `type · id · title · url · description`.
  29 registros: secciones, servicios, pasos del método, recursos y documentos.
- Markdown en `public/content/`: `index.md`, `programs.md`, `scale-method.md`,
  `resources.md`, `testimonials.md`. Están en el repo y además se sirven.
- JSON-LD: un `@graph` con `Organization`, `WebSite`, `WebPage`, un `ItemList`
  de servicios, un `HowTo` con los seis pasos y un `ItemList` de recursos.
  **Los campos que el Figma no aportaba se omiten en vez de inventarse** —
  teléfono, dirección y redes están a `null` en `sitio.ts`.
- HTML semántico: `header` / `nav` / `main` / `section` / `article` / `footer`,
  la lista del método como `<ol>`, las cifras como `<dl>`, los testimonios como
  `<blockquote>`, y un enlace "Skip to content".

### Lo que necesito de ti para cerrar los metadatos

Están puestos con valores por defecto razonables en `src/data/sitio.ts`, pero
estos cuatro no salen del Figma y **no me los he inventado**:

1. **Dominio definitivo** (ahora apunta al `.vercel.app`). Cambia `sitio.url`.
2. **Teléfono y correo** de contacto.
3. **Redes sociales** (van a `sameAs` del JSON-LD, que es lo que enlaza la
   marca con sus perfiles).
4. **Dirección postal**, si la empresa quiere aparecer como negocio local.

También conviene sustituir `public/assets/og.png`: el que hay lo generé yo con
los colores y la tipografía de marca, pero sin las fotos reales.

---

## 8. Segunda ronda (2026-08-18)

### La animación de la tira estaba mal medida

Tenía las alturas cambiadas de sitio: puse como altura **de reposo** lo que en
realidad es la altura **de la columna abierta**. En reposo las siete imágenes
miden lo mismo.

Medidas reales de las variantes:

| | reposo (85:464) | hover |
|---|---|---|
| ancho de columna | 192 (×7, gap 16) | **520** la abierta, **137.3** las otras seis |
| imagen | 192 × **348** en todas | 520 de ancho, alto 348/484/348/**246**/348/429/348 |
| desfase superior | 70 / 124 / 66 / 138 / 65 / 140 / 106 | el mismo |
| panel | — | x = el de la columna, **y = 376 siempre**, 520 de ancho, `#F4F1EF`, padding 32 |
| alto del bloque | 489 | 780 / 756 / 804 / **828** / 780 / 780 / 780 |

El reparto en flex sale de ahí, no de tantear: con `flex-basis: 0` y `gap: 16`,
el espacio libre es 1440−96 = 1344; `flex-grow: 3.788` para la abierta y `1`
para el resto da 520.1 y 137.3.

El panel arranca en y=376 en las siete variantes: el texto empieza siempre a la
misma altura aunque la imagen abierta acabe por encima o por debajo. Y es
`#F4F1EF`, no blanco, y sin sombra.

> **Trampa 13. Especificidad al escribir "el hermano con hover" y "los demás".**
> `.tira:hover .columna` es (0,3,0) y `.columna:hover` es (0,2,0): la regla de
> *los demás* le gana a la de *la que tiene el puntero encima*, así que la
> columna no crecía nada aunque el panel sí apareciera — un fallo que parece de
> flexbox y es de cascada. La abierta hay que escribirla anidada
> (`.tira:hover .columna:hover`) para subirla a (0,4,0).

### El retrato del hero salía opaco

`exportAsync` sobre `1295:1565` devuelve un PNG **sin un solo píxel
transparente**, con el fondo relleno de `#E5E5E5`: al exportar un nodo suelto,
Figma le compone el gris del lienzo. Verificado sobre el archivo descargado —
canal alfa presente (colortype 6) pero con `min = max = 255`.

El PNG recortado va **dentro del paquete**, en `public/assets/fotos/`, y
`ACTUALIZAR.bat` ya no lo vuelve a descargar. El recorte se hizo con relleno
por difusión desde los bordes (no un reemplazo global de color) para no
agujerear el gris que hay dentro de la camisa, y con alfa proporcional en el
contorno para que no quede orla.

> Si hay que regenerarlo: exportar desde Figma con el fondo de página en
> transparente, o usar el `rawImage` del fill en lugar del export del nodo.

### El botón de Scale Partnership

`57:650` se llama "Component 2" pero es el mismo componente que el resto con el
relleno sobrescrito: **`#8686F2` con el texto en blanco**, no verde. El hover
sigue siendo el de la variante compartida `38:162` (`#021E46` + `#32E0A5`).

---

## 9. La expansión de la tira iba lenta por una razón que no era la duración

Bajar los 950 ms de Figma no bastaba: medido fotograma a fotograma, el **alto**
del bloque arrancaba a los 40 ms del hover y el **ancho** no se movía hasta
**307 ms después**, con el mismo disparador. La duración estaba bien; la
transición no había empezado.

La causa es la cascada de entrada. En `global.css`, el escalonado usaba
`transition-delay`:

```css
[data-animate="stagger"][data-visible] > *:nth-child(4) { transition-delay: 270ms; }
```

Especificidad **(0,3,0)** — dos selectores de atributo más `:nth-child` — frente
a **(0,2,0)** de la regla del componente. Gana la de la cascada, y ese
`transition-delay` **se queda pegado al elemento para siempre**, no solo durante
la entrada. Así que el hover de esa misma tarjeta arrancaba con 270 ms de
retraso muerto. Y no era igual en todas: la columna 1 iba a 0 ms y la 7 a
**540 ms**, que es justo la sensación de "unas responden y otras no".

> **Trampa 14. Un `transition-delay` de entrada contamina todas las
> transiciones posteriores del elemento.** Si el escalonado se hace con
> `transition-delay` por `nth-child`, cualquier hover de ese mismo elemento
> hereda el retraso. Hazlo con `animation` + `animation-delay`, que no toca las
> transiciones. Síntoma engañoso: parece que la animación es lenta cuando lo
> que pasa es que todavía no ha empezado.

Medido después del cambio, idéntico en las siete columnas:

| | antes | ahora |
|---|---|---|
| retraso hasta arrancar | 267 ms (col 4) · 540 ms (col 7) | **16 ms** (un fotograma) |
| 90% del recorrido | ~600 ms | **133 ms** |
| curva | `EASE_IN_AND_OUT_BACK` (retrocede al arrancar) | `cubic-bezier(0.22, 1, 0.36, 1)` |

La duración vive en un solo sitio, `src/styles/tokens.css`:

```css
--d-tira: 380ms;        /* expansión */
--d-tira-panel: 240ms;  /* entrada del texto */
--e-expandir: cubic-bezier(0.22, 1, 0.36, 1);
```

Es una desviación deliberada del archivo (Figma declara 950 ms con
`EASE_IN_AND_OUT_BACK`): a ese ancho, el retroceso del *back* se lee como
pereza. El resto de tiempos del sitio siguen siendo los de Figma.
