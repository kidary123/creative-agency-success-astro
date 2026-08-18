import type { APIRoute } from "astro";
import { sitio, secciones, servicios, metodoPasos, recursos } from "../data/sitio";

/**
 * /catalog.txt — inventario tabulado de todo lo direccionable del sitio.
 * Frente a llms.txt (prosa breve), esto es la lista completa y estable:
 * un registro por línea, campos separados por tabulador, cabecera en la
 * primera línea. Pensado para que se pueda parsear sin heurísticas.
 */
export const GET: APIRoute = () => {
  const u = (p: string) => new URL(p, sitio.url).href;
  const filas: string[][] = [];

  filas.push(["page", "home", sitio.titulo, u("/"), sitio.descripcion]);

  for (const s of secciones) {
    filas.push(["section", s.id, s.nombre, u(`/#${s.id}`), s.resumen]);
  }

  for (const s of servicios) {
    filas.push([
      "service",
      s.nombre.toLowerCase().replace(/\s+/g, "-"),
      `${s.nombre} (${s.etapa})`,
      u("/#servicios"),
      s.descripcion,
    ]);
  }

  metodoPasos.forEach((p, i) => {
    filas.push([
      "method-step",
      `step-${i + 1}`,
      p,
      u("/#metodo"),
      `Step ${i + 1} of The Scale Method`,
    ]);
  });

  for (const r of recursos) {
    filas.push([
      "resource",
      r.nombre.toLowerCase().replace(/\s+/g, "-"),
      r.nombre,
      u("/#recursos"),
      `Free resource — ${r.tipo}`,
    ]);
  }

  const docs = [
    ["index", "Home, full Markdown"],
    ["programs", "Agency Accelerator and Scale Partnership"],
    ["scale-method", "The six steps of The Scale Method"],
    ["resources", "Free library: group, books, trainings, podcast"],
    ["testimonials", "Client testimonials"],
  ];
  for (const [slug, titulo] of docs) {
    filas.push(["document", slug, titulo, u(`/content/${slug}.md`), "text/markdown"]);
  }

  filas.push(["feed", "llms", "llms.txt summary", u("/llms.txt"), "text/plain"]);
  filas.push(["feed", "sitemap", "XML sitemap", u("/sitemap.xml"), "application/xml"]);

  const escapa = (v: string) => v.replace(/[\t\r\n]+/g, " ").trim();
  const cuerpo =
    ["type", "id", "title", "url", "description"].join("\t") +
    "\n" +
    filas.map((f) => f.map(escapa).join("\t")).join("\n") +
    "\n";

  return new Response(cuerpo, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
