import supabase from "../lib/supabase.js";
import { obtenerEvento, obtenerEventoId } from "../lib/eventos.js";

function sumar(data, campo) {
  return data.reduce((total, item) => total + (Number(item[campo]) || 0), 0);
}

function extraerValoresDieteticos(valor, clave) {
  const salida = [];

  function anadir(v) {
    if (v === null || v === undefined) return;

    if (Array.isArray(v)) {
      v.forEach(anadir);
      return;
    }

    if (typeof v === "string") {
      const texto = v.trim();
      if (!texto || texto === "Ninguna" || texto === "null") return;

      try {
        const parsed = JSON.parse(texto);
        anadir(parsed);
        return;
      } catch {
        salida.push(texto);
        return;
      }
    }

    if (typeof v === "object") {
      if (Array.isArray(v[clave])) {
        v[clave].forEach(anadir);
        return;
      }

      if (v[clave] !== undefined && v[clave] !== null) {
        anadir(v[clave]);
        return;
      }

      if (v.persona && v.tipoDieta !== undefined) {
        anadir(v.tipoDieta);
        return;
      }

      if (v.persona && Array.isArray(v.alergias)) {
        v.alergias.forEach(anadir);
        return;
      }

      return;
    }

    const texto = String(v).trim();
    if (!texto || texto === "Ninguna" || texto === "null") return;
    salida.push(texto);
  }

  anadir(valor);
  return salida;
}

function contarDatosDieteticos(data, campo) {
  const resultado = {};
  const clave = campo === "tipo_dieta" ? "tipoDieta" : "alergias";

  data.forEach(item => {
    const valores = extraerValoresDieteticos(item[campo], clave);

    valores.forEach(valor => {
      const texto = String(valor).trim();
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
      respuesta.dieta = contarDatosDieteticos(data, "tipo_dieta");
      respuesta.alergias = contarDatosDieteticos(data, "alergias");
    }

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error("Error obteniendo resumen:", error);
    return res.status(500).json({ error: "Error obteniendo resumen" });
  }
}
