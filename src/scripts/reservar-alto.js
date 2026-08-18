/**
 * Reserva la altura de un panel expandible sin dejar hueco muerto.
 *
 * Dos fallos que este patrón evita (trampas 6 y 7):
 *
 *  - Medir dentro de un solo requestAnimationFrame llega cuando la imagen aún
 *    está en su proporción anterior: reserva cientos de píxeles de más y deja
 *    medio scroll de vacío antes de la sección siguiente. Por eso se usa
 *    ResizeObserver sobre el slot y el panel.
 *  - Escribir el valor siempre realimenta al observador. Solo se escribe si
 *    cambió.
 *  - Un estilo en línea le gana a cualquier media query: en móvil, donde el
 *    layout ya no es el de escritorio, no hay que reservar NADA. De ahí la
 *    comprobación de display antes de tocar el estilo.
 */
export function reservarAlto(banda, panel, { layoutEscritorio = "flex" } = {}) {
  if (!banda || !panel) return () => {};

  const marcar = () => {
    if (getComputedStyle(banda).display !== layoutEscritorio) {
      if (banda.style.minBlockSize) banda.style.minBlockSize = "";
      return;
    }
    const objetivo = `${Math.ceil(panel.getBoundingClientRect().height)}px`;
    if (banda.style.minBlockSize !== objetivo) banda.style.minBlockSize = objetivo;
  };

  const observador = new ResizeObserver(marcar);
  observador.observe(panel);
  observador.observe(banda);
  addEventListener("resize", marcar, { passive: true });
  marcar();

  return () => {
    observador.disconnect();
    removeEventListener("resize", marcar);
  };
}
