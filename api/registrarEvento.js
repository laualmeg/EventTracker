import supabase from "../lib/supabase.js";
import { obtenerEvento, obtenerEventoId } from "../lib/eventos.js";

function esEnteroNoNegativo(valor) {
  return Number.isInteger(valor) && valor >= 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Metodo no permitido" });
  }

  const slug = req.query?.evento;
  const configuracion = obtenerEvento(slug);

  if (!configuracion) {
    return res.status(400).json({ ok: false, error: "Evento no valido" });
  }

  try {
    const datos = req.body;
    const nombre = datos.nombre?.trim();
    const adultos = Number(datos.adultos);
    const infantiles = Number(datos.infantiles);
    const invitados = Number(datos.invitados || 0);

    if (!nombre) {
      return res.status(400).json({ ok: false, error: "Nombre obligatorio" });
    }

    if (![adultos, infantiles, invitados].every(Number.isInteger) ||
        ![adultos, infantiles, invitados].every(esEnteroNoNegativo)) {
      return res.status(400).json({
        ok: false,
        error: "Las cantidades deben ser numeros enteros no negativos"
      });
    }

    if (adultos === 0 && infantiles === 0) {
      return res.status(400).json({
        ok: false,
        error: "Debe haber al menos un adulto o un infantil"
      });
    }

    const registro = {
      nombre,
      adultos,
      infantiles,
      invitados: configuracion.buffet ? invitados : 0,
      adultos_carne: 0,
      adultos_pescado: 0,
      infantiles_carne: 0,
      infantiles_pescado: 0,
      asistentes_dieteticos: [],
      tipo_dieta: "Ninguna",
      alergias: "Ninguna",
      necesidades_especiales: "Ninguna",
      plato: null,
      tipo_buffet: null
    };

    if (configuracion.buffet) {
      const plato = datos.plato?.trim();
      const tipoBuffet = datos.tipoBuffet;

      if (!plato) {
        return res.status(400).json({ ok: false, error: "Debes indicar el plato que traeras" });
      }

      if (!["adulto", "infantil"].includes(tipoBuffet)) {
        return res.status(400).json({ ok: false, error: "Tipo de buffet no valido" });
      }

      registro.plato = plato;
      registro.tipo_buffet = tipoBuffet;
    } else {
      const adultosCarne = Number(datos.adultosCarne);
      const adultosPescado = Number(datos.adultosPescado);
      const infantilesCarne = Number(datos.infantilesCarne);
      const infantilesPescado = Number(datos.infantilesPescado);
      const asistentesDieteticos = datos.asistentesDieteticos;

      if (![adultosCarne, adultosPescado, infantilesCarne, infantilesPescado]
        .every(esEnteroNoNegativo) ||
        adultosCarne + adultosPescado !== adultos ||
        infantilesCarne + infantilesPescado !== infantiles) {
        return res.status(400).json({
          ok: false,
          error: "La eleccion de carne o pescado no coincide con los asistentes"
        });
      }

      if (!Array.isArray(asistentesDieteticos) ||
          asistentesDieteticos.length !== adultos + infantiles) {
        return res.status(400).json({
          ok: false,
          error: "La informacion dietetica no coincide con los asistentes"
        });
      }

      registro.adultos_carne = adultosCarne;
      registro.adultos_pescado = adultosPescado;
      registro.infantiles_carne = infantilesCarne;
      registro.infantiles_pescado = infantilesPescado;
      registro.asistentes_dieteticos = asistentesDieteticos;
      registro.tipo_dieta = datos.tipoDieta || "Ninguna";
      registro.alergias = datos.alergias?.trim() || "Ninguna";
      registro.necesidades_especiales = datos.necesidadesEspeciales?.trim() || "Ninguna";
    }

    const { id: eventoId, error: eventoError } = await obtenerEventoId(slug);
    if (eventoError || !eventoId) throw eventoError || new Error("Evento no encontrado");

    const { data: existentes, error: busquedaError } = await supabase
      .from("asistentes_eventos")
      .select("id")
      .eq("evento_id", eventoId)
      .ilike("nombre", nombre)
      .limit(1);

    if (busquedaError) throw busquedaError;

    if (existentes?.length) {
      return res.status(409).json({ ok: false, error: "Esta persona ya esta registrada en este evento" });
    }

    const { data, error } = await supabase
      .from("asistentes_eventos")
      .insert([{ evento_id: eventoId, ...registro }])
      .select();

    if (error) throw error;

    return res.status(200).json({ ok: true, mensaje: "Asistente guardado", data });
  } catch (error) {
    console.error("Error registrando asistencia:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Error interno" });
  }
}
