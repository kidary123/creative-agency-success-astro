#!/usr/bin/env node
/**
 * Captura los estados hover de la tabla reposo/hover del manifest.
 *
 * Las capturas estáticas no ven los hover, y es justo donde se rompe el
 * `transform` de una capa girada: si el giro del hover se escribiera dentro de
 * transform en vez de como propiedad `rotate` suelta, aquí se vería.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const url = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "http://localhost:4321";

const casos = [
  { n: "boton",        sel: "#hero .boton",                caja: "#hero .boton" },
  { n: "logo",         sel: ".cabecera .logo",             caja: ".cabecera" },
  { n: "nav-enlace",   sel: ".menu a",                     caja: ".cabecera" },
  { n: "tira-col1",    sel: ".tira .columna:nth-child(1)", caja: ".tira" },
  { n: "tira-col4",    sel: ".tira .columna:nth-child(4)", caja: ".tira" },
  { n: "arte-morado",  sel: "#servicios .tarjeta:nth-child(1)", caja: "#servicios .tarjeta:nth-child(1) .visual" },
  { n: "arte-verde",   sel: "#servicios .tarjeta:nth-child(2)", caja: "#servicios .tarjeta:nth-child(2) .visual" },
  { n: "rueda",        sel: "#metodo .rueda",              caja: "#metodo .diagrama" },
  { n: "recurso",      sel: "#recursos .tarjeta:nth-child(1)", caja: "#recursos .tarjeta:nth-child(1)" },
  { n: "cta-arte",     sel: "#cta-final .arte",            caja: "#cta-final .arte" },
  { n: "video",        sel: "#confianza .video",           caja: "#confianza .video" },
];

const salida = ".verificacion/hover";
await mkdir(salida, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium",
});
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 950 } });
await pagina.goto(url, { waitUntil: "networkidle" });

// Solo [data-animate] al estado final. NUNCA un comodín: anularía también las
// rotaciones del arte y la captura mentiría.
await pagina.addStyleTag({
  content: `[data-animate], [data-animate="stagger"] > * {
    opacity:1 !important; translate:0 0 !important; scale:1 !important;
    clip-path:none !important; transition-delay:0ms !important; }`,
});

for (const c of casos) {
  const disparador = pagina.locator(c.sel).first();
  const caja = pagina.locator(c.caja).first();
  if (!(await disparador.count())) { console.log(`  falta: ${c.n} (${c.sel})`); continue; }

  await disparador.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(150);
  await caja.screenshot({ path: `${salida}/${c.n}-reposo.png` });

  await disparador.hover();
  // Se espera a que termine la transición más larga del sitio (950ms).
  await pagina.waitForTimeout(1100);
  await caja.screenshot({ path: `${salida}/${c.n}-hover.png` });

  await pagina.mouse.move(0, 0);
  await pagina.waitForTimeout(1100);
  console.log(`  ok: ${c.n}`);
}

await navegador.close();
console.log(`\nEstados hover en ${salida}/`);
