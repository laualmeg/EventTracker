import supabase from "../lib/supabase.js";
import { obtenerEvento, obtenerEventoId } from "../lib/eventos.js";

function sumar(data, campo) {
  return data.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
}

function contarValores(data, campo) {
  const resultado = {};

  data.forEach(item => {
    let valores = item[campo];

    if (typeof valores === "string") {
      try {
        valores = JSON.parse(valores);
      } catch {
        valores = [valores];
      }
    }

    if (!Array.isArray(valores)) valores = [valores];

    valores.forEach(valor => {
      const texto = valor?.toString().trim() || "Ninguna";
      resultado[texto] = (resultado[texto] || 0) + 1;
    });
  });

  return resultado;
}

function contarDatosDieteticos(data, campo) {
  const resultado = {};

  data.forEach(item => {
    let valores = item[campo];
    if (valores === null || valores === undefined) return;
    if (!Array.isArray(valores)) valores = [valores];

    valores.forEach(valor => {
      const texto = String(valor ?? "").trim();
      if (!texto || texto === "Ninguna" || texto === "null") return;
      resultado[texto] = (resultado[texto] || 0) + 1;
    });
  });

  return resultado;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const slug = req.query?.evento;
  const configuracion = obtenerEvento(slug);

  if (!configuracion) {
    return res.status(400).json({ error: "Evento no valido" });
  }

  try {
    const { id: eventoId, error: eventoError } = await obtenerEventoId(slug);
    if (eventoError || !eventoId) throw eventoError || new Error("Evento no encontrado");

    const { data, error } = await supabase
      .from("asistentes_eventos")
      .select("adultos, infantiles, invitados, adultos_carne, adultos_pescado, tipo_dieta, alergias, plato, tipo_buffet")
      .eq("evento_id", eventoId);

    if (error) throw error;

    const respuesta = {
      totalAdultos: sumar(data, "adultos"),
      totalInfantiles: sumar(data, "infantiles"),
      totalInvitados: sumar(data, "invitados"),
      totalCarne: sumar(data, "adultos_carne"),
      totalPescado: sumar(data, "adultos_pescado")
    };

    if (configuracion.buffet) {
      respuesta.buffetAdulto = data.filter(item => item.tipo_buffet === "adulto");
      respuesta.buffetInfantil = data.filter(item => item.tipo_buffet === "infantil");
    }

    if (configuracion.dieta) {
      respuesta.dieta = contarDatosDieteticos(data, "tipoDieta");
      respuesta.alergias = contarDatosDieteticos(data, "alergias");
    }

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error("Error obteniendo resumen:", error);
    return res.status(500).json({ error: "Error obteniendo resumen" });
  }
}
