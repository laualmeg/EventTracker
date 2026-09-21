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
      { header: "Plato", key: "plato", width: 15 },
      { header: "Tipo buffet", key: "tipo_buffet", width: 15 }
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
      tipo_buffet: item.tipo_buffet
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