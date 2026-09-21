import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { data, error } = await supabase
      .from("asistentes_proclamacion")
      .select("adultos, infantiles, adultos_carne, adultos_pescado, infantiles_carne, infantiles_pescado, plato, tipo_buffet");

    if (error) throw error;

    const totalAdultos = data.reduce((total, item) => total + (item.adultos || 0), 0);
    const totalInfantiles = data.reduce((total, item) => total + (item.infantiles || 0), 0);
    const totalCarne = data.reduce((total, item) => total + (item.adultos_carne || 0) + (item.infantiles_carne || 0), 0);
    const totalPescado = data.reduce((total, item) => total + (item.adultos_pescado || 0) + (item.infantiles_pescado || 0), 0);

    return res.status(200).json({
      totalAdultos,
      totalInfantiles,
      totalCarne,
      totalPescado,
      buffetAdulto: data.filter(item => item.tipo_buffet === "adulto"),
      buffetInfantil: data.filter(item => item.tipo_buffet === "infantil")
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error obteniendo resumen de Proclamación" });
  }
}