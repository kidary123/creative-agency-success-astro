import type { APIRoute } from "astro";
import { sitio, secciones, servicios, metodoPasos, recursos } from "../data/sitio";

/**
 * /llms.txt — resumen del sitio en Markdown plano para rastreadores de
 * modelos. Se genera desde src/data/sitio.ts para que no pueda desincronizarse
 * de lo que se pinta en la página.
 */
export const GET: APIRoute = () => {
  const u = (p: string) => new URL(p, sitio.url).href;

  const cuerpo = `# ${sitio.nombre}

> ${sitio.descripcion}

${sitio.nombre} works with creative agency owners who want to grow without
trading their life for it. The path is Individual Clarity and Collective
Confidence: two coaching programs, a six-step operating method, and a peer
community of agency owners.

## Programs

${servicios
  .map((s) => `- [${s.nombre}](${u("/#servicios")}) (${s.etapa}): ${s.descripcion}`)
  .join("\n")}

## The Scale Method

The six steps to scale a creative agency:

${metodoPasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Results reported by the community

- $3,000,000 revenue added in just 90 days
- $1,500,000 profit per partner per year
- 897% revenue increase in 9 months
- 83% efficiency gains

## Resources

${recursos.map((r) => `- [${r.nombre}](${u("/#recursos")}) — ${r.tipo}`).join("\n")}

## Page sections

${secciones.map((s) => `- [${s.nombre}](${u("/#" + s.id)}): ${s.resumen}`).join("\n")}

## Full text

- [Home, full Markdown](${u("/content/index.md")})
- [Programs](${u("/content/programs.md")})
- [The Scale Method](${u("/content/scale-method.md")})
- [Resources](${u("/content/resources.md")})
- [Testimonials](${u("/content/testimonials.md")})
- [Machine-readable catalog](${u("/catalog.txt")})

## Notes

- Founder: ${sitio.fundador}
- Audience: owners of creative, design, branding and marketing agencies
- Language: English
- ${sitio.copyright}
`;

  return new Response(cuerpo, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
