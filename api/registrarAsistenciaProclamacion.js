import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const datos = req.body;
    const nombre = datos.nombre?.trim();
    const adultos = Number(datos.adultos);
    const infantiles = Number(datos.infantiles ?? 0);
    const adultosCarne = Number(datos.adultosCarne);
    const adultosPescado = Number(datos.adultosPescado);
    const asistentesDieteticos = Array.isArray(datos.asistentesDieteticos) ? datos.asistentesDieteticos : [];

    if (!nombre) {
      return res.status(400).json({ ok: false, error: "Nombre y apellidos obligatorios" });
    }

    if (datos.adultos === undefined || datos.adultos === null || String(datos.adultos).trim() === "") {
      return res.status(400).json({ ok: false, error: "El número de adultos es obligatorio" });
    }

    if (!Number.isInteger(adultos) || adultos < 0) {
      return res.status(400).json({ ok: false, error: "El número de adultos debe ser un entero no negativo" });
    }

    if (!Number.isInteger(infantiles) || infantiles < 0) {
      return res.status(400).json({ ok: false, error: "El número de infantiles no puede ser negativo" });
    }

    if (
      ![adultos, infantiles, adultosCarne, adultosPescado]
        .every(Number.isInteger) ||
      adultos < 0 || infantiles < 0 ||
      adultosCarne < 0 || adultosPescado < 0 ||
      adultosCarne + adultosPescado !== adultos
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

    if (
      !Array.isArray(asistentesDieteticos) ||
      asistentesDieteticos.length !== adultos + infantiles ||
      !asistentesDieteticos.every(item => item && typeof item === "object")
    ) {
      return res.status(400).json({
        ok: false,
        error: "La información dietética no coincide con el número de asistentes"
      });
    }

    const asistentesDieteticosValidados = asistentesDieteticos.map(item => {
      const alergias = Array.isArray(item.alergias) ? item.alergias : [item.alergias];
      const alergiasFiltradas = alergias
        .filter(Boolean)
        .map(valor => String(valor).trim())
        .filter(valor => valor !== "Ninguna");

      const tipoDieta = typeof item.tipoDieta === "string" ? item.tipoDieta.trim() : "";

      return {
        ...item,
        alergias: alergiasFiltradas,
        tipoDieta: tipoDieta && tipoDieta !== "Ninguna" ? tipoDieta : null,
        observaciones: item.observaciones ?? ""
      };
    });

    const alergiasGenerales = (() => {
      const valor = typeof datos.alergias === "string" ? datos.alergias.trim() : "";
      if (!valor || valor === "Ninguna") return null;

      try {
        const parsed = JSON.parse(valor);
        const lista = Array.isArray(parsed)
          ? parsed
          : [parsed];

        const filtradas = lista
          .flatMap(item => Array.isArray(item?.alergias) ? item.alergias : [item?.alergias])
          .filter(Boolean)
          .map(item => String(item).trim())
          .filter(item => item !== "Ninguna");

        return filtradas.length ? filtradas.join(", ") : null;
      } catch {
        return valor !== "Ninguna" ? valor : null;
      }
    })();

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
        adultos_carne: adultosCarne,
        adultos_pescado: adultosPescado,
        tipo_dieta: (() => {
          const valor = typeof datos.tipoDieta === "string" ? datos.tipoDieta.trim() : "";
          return valor && valor !== "Ninguna" ? valor : null;
        })(),
        alergias: alergiasGenerales
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({ ok: true, mensaje: "Asistente guardado", data });
  } catch (error) {
    console.error("Error servidor:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Error interno" });
  }
}