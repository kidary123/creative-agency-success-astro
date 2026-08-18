#!/usr/bin/env node
/**
 * Descarga los assets listados en assets.json a public/assets/originales/.
 *
 * assets.json lo genera la fase 1 con las URLs firmadas que devuelve el MCP de
 * Figma. Esas URLs caducan a los ~7 días: un 403 aquí no se repara a mano, se
 * regenera assets.json volviendo a la fase 1.
 *
 * Formato esperado:
 *   { "generadoEl": "...", "assets": [{ "nombre": "hero-figura.svg", "nodo": "85:783", "url": "https://..." }] }
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const RAIZ = process.cwd();
const MANIFIESTO = join(RAIZ, "assets.json");
const DESTINO = join(RAIZ, "public", "assets", "originales");
const CONCURRENCIA = 6;

const { assets = [] } = JSON.parse(await readFile(MANIFIESTO, "utf8"));

if (!assets.length) {
  console.error("assets.json no tiene entradas. Vuelve a la fase 1.");
  process.exit(1);
}

let ok = 0;
const fallos = [];

async function descargar({ nombre, url, nodo }) {
  const res = await fetch(url);
  if (res.status === 403) {
    fallos.push({ nombre, motivo: "URL firmada caducada (~7 días) — regenera assets.json" });
    return;
  }
  if (!res.ok) {
    fallos.push({ nombre, motivo: `HTTP ${res.status}` });
    return;
  }
  const destino = join(DESTINO, nombre);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, Buffer.from(await res.arrayBuffer()));
  ok++;
  console.log(`  ${nombre}${nodo ? `  (${nodo})` : ""}`);
}

const cola = [...assets];
await Promise.all(
  Array.from({ length: CONCURRENCIA }, async () => {
    while (cola.length) await descargar(cola.shift());
  })
);

console.log(`\nDescargados ${ok}/${assets.length} en public/assets/originales/`);
if (fallos.length) {
  console.error("\nFallos:");
  for (const f of fallos) console.error(`  ${f.nombre}: ${f.motivo}`);
  process.exit(1);
}
console.log("Siguiente paso obligatorio:  python3 scripts/optimize-images.py");
