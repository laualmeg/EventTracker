import ExcelJS from "exceljs";
import supabase from "../lib/supabase.js";

export default async function handler(req, res) {

  try {

    const { data, error } =
      await supabase
        .from("asistentes")
        .select("*")
        .order("nombre");

    if (error) {
      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Asistentes");

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 20 },
      { header: "Adultos", key: "adultos", width: 10 },
      { header: "Infantiles", key: "infantiles", width: 12 },
      { header: "Invitados", key: "invitados", width: 12 },
      { header: "Plato", key: "plato", width: 15 },
      { header: "TipoBuffet", key: "tipo_buffet", width: 15 }
    ];

    data.forEach(item => {
      worksheet.addRow({
        nombre: item.nombre,
        adultos: item.adultos,
        infantiles: item.infantiles,
        invitados: item.invitados,
        plato: item.plato,
        tipo_buffet: item.tipo_buffet
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="san-juan-2026.xlsx"'
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

}