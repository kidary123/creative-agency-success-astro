#!/usr/bin/env node
/**
 * Normaliza la salida cruda del MCP de Figma a design-manifest.json.
 *
 * Uso:
 *   node scripts/build-manifest.mjs --crudo .figma-ref/metadata.json --out design-manifest.json
 *
 * "Crudo" es lo que devuelve get_metadata, volcado tal cual a un archivo.
 * Este script hace tres cosas que a mano se olvidan:
 *   1. ordena las secciones por la Y del TITULAR, no por la del fondo
 *   2. calcula el inset de cada capa en % de su contenedor y conserva la rotación
 *   3. deja huecos explícitos (revisar: true) donde no pudo inferir, para que
 *      el agente los complete en vez de que pasen desapercibidos
 */
import { readFile, writeFile } from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith("--") ? [...acc, [v.slice(2), a[i + 1]]] : acc), [])
);
const crudo = JSON.parse(await readFile(args.crudo ?? ".figma-ref/metadata.json", "utf8"));

const nid = (id) => String(id).replace("-", ":");
const esTitular = (n) =>
  n.type === "TEXT" && (n.absoluteBoundingBox?.height ?? 0) >= 28 && /h1|h2|title|titular|heading/i.test(n.name ?? "");

function aplanar(nodo, salida = []) {
  salida.push(nodo);
  for (const h of nodo.children ?? []) aplanar(h, salida);
  return salida;
}

function insetPorcentual(caja, contenedor) {
  return {
    x: +(((caja.x - contenedor.x) / contenedor.width) * 100).toFixed(4),
    y: +(((caja.y - contenedor.y) / contenedor.height) * 100).toFixed(4),
    w: +((caja.width / contenedor.width) * 100).toFixed(4),
    h: +((caja.height / contenedor.height) * 100).toFixed(4),
  };
}

const raiz = crudo.document ?? crudo;
const secciones = (raiz.children ?? [])
  .filter((n) => (n.absoluteBoundingBox?.height ?? 0) > 120)
  .map((sec) => {
    const planos = aplanar(sec);
    const titular = planos.find(esTitular);
    const caja = sec.absoluteBoundingBox ?? { x: 0, y: 0, width: 1, height: 1 };

    const capas = planos
      .filter((n) => n !== sec && /vector|ellipse|rectangle|star|polygon|art|figura|shape/i.test(`${n.type} ${n.name}`))
      .map((n) => ({
        nombre: n.name,
        nodo: nid(n.id),
        inset: insetPorcentual(n.absoluteBoundingBox ?? caja, caja),
        rotacion: Math.round(((n.rotation ?? 0) * 180) / Math.PI) || 0,
        sangrado: null, // se rellena al exportar si el bbox del SVG excede el del nodo
      }));

    return {
      nombre: (sec.name ?? "seccion").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      nodo: nid(sec.id),
      yTitular: titular?.absoluteBoundingBox?.y ?? null,
      revisar: titular ? undefined : "sin titular detectado: ordenar a mano",
      altura: Math.round(caja.height),
      capas,
      variantes: [], // se rellena a mano desde las variantes de componente (no están en el canvas)
      assets: [],
    };
  })
  .sort((a, b) => (a.yTitular ?? a.altura * 1e6) - (b.yTitular ?? b.altura * 1e6))
  .map((s, i) => ({ orden: i + 1, ...s }));

const manifest = {
  fileKey: args["file-key"] ?? crudo.fileKey ?? null,
  rootNode: nid(raiz.id ?? "0:1"),
  extraidoEl: new Date().toISOString(),
  tokens: { color: {}, space: {}, radius: {}, type: {} },
  tipografia: [],
  secciones,
  descartadas: [],
};

await writeFile(args.out ?? "design-manifest.json", JSON.stringify(manifest, null, 2));

const sinCapas = secciones.filter((s) => !s.capas.length).map((s) => s.nombre);
const sinTitular = secciones.filter((s) => s.revisar).map((s) => s.nombre);
console.log(`${secciones.length} secciones → ${args.out ?? "design-manifest.json"}`);
if (sinTitular.length) console.warn(`  Ordenar a mano (sin titular): ${sinTitular.join(", ")}`);
if (sinCapas.length) console.warn(`  Sin capas de arte — confirma contra el screenshot: ${sinCapas.join(", ")}`);
console.warn("  Las variantes reposo/hover NO están en el canvas: complétalas desde las variantes de componente.");
