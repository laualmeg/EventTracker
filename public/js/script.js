const fechaLimite = new Date("2026-10-05T00:00:00");
const eventoProclamacion = document.getElementById("proclamation-event");

if (!eventoProclamacion) {
  throw new Error("No se encontró el contenedor del evento de Proclamación.");
}

//const estaDisponible = new Date() < fechaLimite;
const estaDisponible = true;
const tarjetaEvento = document.createElement(estaDisponible ? "a" : "div");
tarjetaEvento.className = estaDisponible ? "event" : "event event-unavailable";

if (estaDisponible) {
  tarjetaEvento.href = "/pages/proclamacion.html";
} else {
  tarjetaEvento.setAttribute("aria-disabled", "true");
}

const tituloEvento = document.createElement("div");
tituloEvento.className = "event-title";
tituloEvento.textContent = "👑 Proclamación Falleras Mayores 2026";

const descripcionEvento = document.createElement("div");
descripcionEvento.className = "event-description";
descripcionEvento.textContent = estaDisponible
  ? "Inscripciones hasta el 4 de octubre de 2026 a las 23:59"
  : "El registro ya no está disponible";

tarjetaEvento.append(tituloEvento, descripcionEvento);
eventoProclamacion.replaceWith(tarjetaEvento);
