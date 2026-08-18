import type { APIRoute } from "astro";
import { sitio } from "../data/sitio";

export const GET: APIRoute = () => {
  const u = (p: string) => new URL(p, sitio.url).href;
  const paginas = ["/", "/content/index.md", "/content/programs.md", "/content/scale-method.md", "/content/resources.md", "/content/testimonials.md"];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas
  .map(
    (p) => `  <url>
    <loc>${u(p)}</loc>
    <changefreq>monthly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.6"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
