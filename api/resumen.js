import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {

    const { data, error } = await supabase
      .from("asistentes")
      .select("adultos, infantiles");

    if (error) {
      throw error;
    }

    const totalAdultos = data.reduce(
      (acc, item) => acc + (item.adultos || 0),
      0
    );

    const totalInfantiles = data.reduce(
      (acc, item) => acc + (item.infantiles || 0),
      0
    );

    return res.status(200).json({
      totalAdultos,
      totalInfantiles
    });

  } catch (error) {

    console.error(error);
    return res.status(500).json({
      error: "Error obteniendo resumen"
    });
  }
}
