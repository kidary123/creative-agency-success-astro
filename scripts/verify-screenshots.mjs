#!/usr/bin/env node
/**
 * Capturas de verificación a 390 / 768 / 1440.
 *
 * Congela SOLO los elementos con [data-animate], forzándolos a su estado final.
 * Un `* { transform: none }` global también anularía las rotaciones del arte y
 * la captura mentiría sobre un layout que en realidad está bien.
 *
 * Uso:
 *   node scripts/verify-screenshots.mjs --url http://localhost:4321 [--seccion hero]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith("--") ? [...acc, [v.slice(2), a[i + 1]]] : acc), [])
);
const url = args.url ?? "http://localhost:4321";
const anchos = [390, 768, 1440];
const salida = ".verificacion";
await mkdir(salida, { recursive: true });

const CONGELAR = `
  /* Estado FINAL de la animación, forzado solo sobre [data-animate] y sus
     hijos en cascada. Nada de comodines: un * { transform: none } también
     anularía las rotaciones del arte y la captura mentiría. */
  [data-animate],
  [data-animate="stagger"] > * {
    opacity: 1 !important;
    translate: 0 0 !important;
    scale: 1 !important;
    clip-path: none !important;
    animation: none !important;
    transition: none !important;
    transition-delay: 0ms !important;
  }
`;

const navegador = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium",
});

for (const ancho of anchos) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: 900 } });
  await pagina.goto(url, { waitUntil: "networkidle" });
  await pagina.addStyleTag({ content: CONGELAR });
  await pagina.waitForTimeout(300);

  const diag = await pagina.evaluate(() => ({
    anchoDoc: document.documentElement.scrollWidth,
    anchoVista: document.documentElement.clientWidth,
    secciones: [...document.querySelectorAll("section[id], [data-seccion]")].map((s) => ({
      nombre: s.id || s.dataset.seccion,
      alto: Math.round(s.getBoundingClientRect().height),
    })),
  }));

  const desborde = diag.anchoDoc - diag.anchoVista;
  console.log(`\n${ancho}px`);
  if (desborde > 0)
    console.log(`  SCROLL HORIZONTAL: +${desborde}px — busca primero el <input> más cercano (trampa 8)`);
  for (const s of diag.secciones) {
    const aviso = ancho === 390 && s.alto > 5000 ? "  ← patrón de escritorio vivo en táctil (trampa 6)" : "";
    console.log(`  ${s.nombre}: ${s.alto}px${aviso}`);
  }

  const objetivo = args.seccion ? pagina.locator(`#${args.seccion}, [data-seccion="${args.seccion}"]`) : pagina;
  await objetivo.screenshot({
    path: `${salida}/${args.seccion ?? "pagina"}-${ancho}.png`,
    fullPage: !args.seccion,
  });
  await pagina.close();
}

await navegador.close();
console.log(`\nCapturas en ${salida}/ — compara con .figma-ref/`);
