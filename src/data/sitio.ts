/**
 * Fuente única de los metadatos del sitio.
 *
 * Los valores marcados con REVISAR son suposiciones razonables, no datos
 * confirmados por el cliente: dominio, teléfono, redes y dirección no estaban
 * en el archivo de Figma. Cambiarlos aquí los propaga al <head>, al JSON-LD,
 * a llms.txt, a catalog.txt y al sitemap.
 */
export const sitio = {
  // REVISAR: dominio definitivo. Por defecto, el que asigna Vercel.
  url: "https://creative-agency-success-astro.vercel.app",
  nombre: "Creative Agency Success",
  nombreCorto: "CAS",
  titulo: "Creative Agency Success — Your Agency Vision Made Real",
  descripcion:
    "Coaching and scaling for creative agency owners. Impact, freedom and profit through Individual Clarity and Collective Confidence — the Agency Accelerator and Scale Partnership programs.",
  descripcionCorta:
    "Coaching y escalado para dueños de agencias creativas: impacto, libertad y rentabilidad.",
  idioma: "en",
  locale: "en_US",
  imagenOg: "/assets/og.png",
  fundador: "Robert Patin",
  // REVISAR: no aparecen en el Figma.
  telefono: null as string | null,
  correo: null as string | null,
  direccion: null as { calle: string; ciudad: string; region: string; cp: string; pais: string } | null,
  redes: [] as string[],
  fundacion: "2015",
  copyright: "©2022 Creative Agency Success All Rights Reserved",
};

export const secciones = [
  // En inglés: alimentan llms.txt y catalog.txt, que describen un sitio en inglés.
  { id: "hero",        nombre: "Your Agency Vision Made Real", resumen: "Impact, Freedom and Profit for creative agency owners. Individual Clarity and Collective Confidence is the path." },
  { id: "historias",   nombre: "The Journey To Your Sucess",   resumen: "Seven themes in an agency owner's journey: Freedom, Fulfillment, Passion, Purpose, Confidence and Control." },
  { id: "confianza",   nombre: "Collective Confidence",        resumen: "Community results: $3M revenue added in 90 days, 897% increase in 9 months, 83% efficiency gains." },
  { id: "servicios",   nombre: "Programs",                     resumen: "Agency Accelerator (5 to 6 figures) and Scale Partnership (6 to 7 figures)." },
  { id: "testimonios", nombre: "Testimonials",                 resumen: "Agency owners on retainers, pricing models and growth." },
  { id: "metodo",      nombre: "The Scale Method",             resumen: "Six steps: Positioning, Expertize, Specialization, Authority, Seamless Operation and Recurning Revenue." },
  { id: "recursos",    nombre: "Resources",                    resumen: "Facebook Group, books, free trainings and podcast." },
  { id: "cta-final",   nombre: "Paths To Success",             resumen: "Book a profitability accelerator call and get a custom step-by-step plan." },
];

export const servicios = [
  {
    nombre: "Agency Accelerator",
    etapa: "5 to 6 Figures",
    descripcion:
      "Scale your creative agency to 7-figures. We will help you build systems to consistently get a flow of new clients each month, streamline services to maximize profits, and do it all with the goal of giving you free time back again. Some of our clients work as little as 5 hours a week now while still increasing profits.",
  },
  {
    nombre: "Scale Partnership",
    etapa: "6 to 7 Figures",
    descripcion:
      "This is a premium group for agencies already at 7-figures that are ready to scale to $10M+ revenue per year. You gain access to business wisdom you can use to create sustainable growth for your creative agency. A tailored approach that will help you maximize profits, create a management structure that works for you, develop a long-term vision for your agency, and maximize valuation.",
  },
];

export const metodoPasos = [
  "Positioning",
  "Expertize",
  "Specialization",
  "Authority",
  "Seamless Operation",
  "Recurning Revenue",
];

export const recursos = [
  { nombre: "Facebook Group",  tipo: "Community" },
  { nombre: "Books",           tipo: "Book" },
  { nombre: "Free Trainings",  tipo: "Course" },
  { nombre: "Podcast",         tipo: "PodcastSeries" },
];
