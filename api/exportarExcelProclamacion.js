import ExcelJS from "exceljs";
import supabase from "../lib/supabase.js";

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from("asistentes_proclamacion")
      .select("*")
      .order("nombre");

    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Proclamación");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 20 },
      { header: "Adultos", key: "adultos", width: 10 },
      { header: "Infantiles", key: "infantiles", width: 12 },
      { header: "Adultos carne", key: "adultos_carne", width: 15 },
      { header: "Adultos pescado", key: "adultos_pescado", width: 17 },
      { header: "Infantiles carne", key: "infantiles_carne", width: 17 },
      { header: "Infantiles pescado", key: "infantiles_pescado", width: 19 },
      { header: "Plato", key: "plato", width: 20 },
      { header: "Alergias", key: "alergias", width: 35 },
      { header: "Necesidades especiales", key: "necesidades_especiales", width: 40 },
      { header: "Tipo de dieta", key: "tipo_dieta", width: 35 }
    ];

    data.forEach(item => worksheet.addRow({
      nombre: item.nombre,
      adultos: item.adultos,
      infantiles: item.infantiles,
      adultos_carne: item.adultos_carne,
      adultos_pescado: item.adultos_pescado,
      infantiles_carne: item.infantiles_carne,
      infantiles_pescado: item.infantiles_pescado,
      plato: item.plato,
      alergias: item.alergias,
      necesidades_especiales: item.necesidades_especiales,
      tipo_dieta: item.tipo_dieta
    }));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="proclamacion-2027.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}