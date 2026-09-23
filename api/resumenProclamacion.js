import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { data, error } = await supabase
      .from("asistentes_proclamacion")
      .select(`
        adultos,
        infantiles,
        adultos_carne,
        adultos_pescado,
        infantiles_carne,
        infantiles_pescado,
        plato,
        tipo_dieta,
        alergias
      `);

    if (error) throw error;

    // -----------------------------------------
    // TOTALES DE ASISTENTES
    // -----------------------------------------

    const totalAdultos = data.reduce(
      (total, item) => total + (item.adultos || 0),
      0
    );

    const totalInfantiles = data.reduce(
      (total, item) => total + (item.infantiles || 0),
      0
    );

    // -----------------------------------------
    // TOTALES DE PLATOS
    // -----------------------------------------

    const totalCarne = data.reduce(
      (total, item) => total + (item.adultos_carne || 0),
      0
    );

    const totalPescado = data.reduce(
      (total, item) => total + (item.adultos_pescado || 0),
      0
    );

    // -----------------------------------------
    // FUNCIÓN PARA CONTAR OPCIONES
    // -----------------------------------------

    function contarOpciones(campo) {
      const resultado = {};

      data.forEach(item => {
        let valor = item[campo];

        if (!valor || !String(valor).trim()) {
          valor = "Ninguna";
        } else {
          valor = String(valor).trim();
        }

        resultado[valor] = (resultado[valor] || 0) + 1;
      });

      return resultado;
    }

    // -----------------------------------------
    // RESUMEN DIETÉTICO
    // -----------------------------------------

    const dieta = contarOpciones("tipo_dieta");
    const alergias = contarOpciones("alergias");

    // -----------------------------------------
    // RESPUESTA
    // -----------------------------------------

    return res.status(200).json({
      totalAdultos,
      totalInfantiles,
      totalCarne,
      totalPescado,

      dieta,
      alergias
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error obteniendo resumen de Proclamación"
    });
  }
}