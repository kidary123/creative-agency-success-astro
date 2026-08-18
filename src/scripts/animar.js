/**
 * Activa los elementos [data-animate] al entrar en viewport.
 *
 * Se ejecuta después de que el layout esté validado — la animación es una capa
 * encima, nunca mezclada con el maquetado: si no, cada diferencia con Figma es
 * ambigua entre un fallo de layout y uno de motion.
 */
const reducido = matchMedia("(prefers-reduced-motion: reduce)");

export function animar() {
  const nodos = document.querySelectorAll("[data-animate]");

  if (reducido.matches) {
    nodos.forEach((n) => n.setAttribute("data-visible", ""));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute("data-visible", "");
        observador.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  nodos.forEach((n) => observador.observe(n));
}

if (typeof document !== "undefined") {
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", animar, { once: true })
    : animar();
}
