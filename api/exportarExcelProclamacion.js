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
      { header: "Tipo de dieta", key: "tipo_dieta", width: 35 },
      { header: "Alergias", key: "alergias", width: 35 }
    ];

    data.forEach(item => worksheet.addRow({
      nombre: item.nombre,
      adultos: item.adultos,
      infantiles: item.infantiles,
      adultos_carne: item.adultos_carne,
      adultos_pescado: item.adultos_pescado,
      tipo_dieta: item.tipo_dieta,
      alergias: item.alergias
    }));

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="proclamacion-2026.xlsx"'
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