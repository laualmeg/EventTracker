import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const datos = req.body;
    const nombre = datos.nombre?.trim();
    const adultos = Number(datos.adultos);
    const infantiles = Number(datos.infantiles);
    const adultosCarne = Number(datos.adultosCarne);
    const adultosPescado = Number(datos.adultosPescado);
    const infantilesCarne = Number(datos.infantilesCarne);
    const infantilesPescado = Number(datos.infantilesPescado);

    if (!nombre) {
      return res.status(400).json({ ok: false, error: "Nombre obligatorio" });
    }

    if (!datos.plato?.trim()) {
      return res.status(400).json({ ok: false, error: "Debes indicar el plato que traerás" });
    }

    if (
      ![adultos, infantiles, adultosCarne, adultosPescado, infantilesCarne, infantilesPescado]
        .every(Number.isInteger) ||
      adultos < 0 || infantiles < 0 ||
      adultosCarne < 0 || adultosPescado < 0 ||
      infantilesCarne < 0 || infantilesPescado < 0 ||
      adultosCarne + adultosPescado !== adultos ||
      infantilesCarne + infantilesPescado !== infantiles
    ) {
      return res.status(400).json({
        ok: false,
        error: "La elección de carne o pescado no coincide con el número de asistentes"
      });
    }

    if (adultos === 0 && infantiles === 0) {
      return res.status(400).json({
        ok: false,
        error: "Debe haber al menos un adulto o un infantil"
      });
    }

    const { data: existentes, error: errorBusqueda } = await supabase
      .from("asistentes_proclamacion")
      .select("id, nombre")
      .ilike("nombre", nombre)
      .limit(1);

    if (errorBusqueda) throw errorBusqueda;

    if (existentes?.length) {
      return res.status(409).json({
        ok: false,
        error: "Esta persona ya está registrada en Proclamación"
      });
    }

    const { data, error } = await supabase
      .from("asistentes_proclamacion")
      .insert([{
        nombre,
        adultos,
        infantiles,
        invitados: 0,
        plato: datos.plato.trim(),
        adultos_carne: adultosCarne,
        adultos_pescado: adultosPescado,
        infantiles_carne: infantilesCarne,
        infantiles_pescado: infantilesPescado,
        tipo_buffet: datos.tipoBuffet || "adulto"
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({ ok: true, mensaje: "Asistente guardado", data });
  } catch (error) {
    console.error("Error servidor:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Error interno" });
  }
}