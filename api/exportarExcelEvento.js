import ExcelJS from "exceljs";
import supabase from "../lib/supabase.js";
import { obtenerEvento, obtenerEventoId } from "../lib/eventos.js";

export default async function handler(req, res) {
  const slug = req.query?.evento;
  const configuracion = obtenerEvento(slug);

  if (!configuracion) {
    return res.status(400).json({ ok: false, error: "Evento no valido" });
  }

  try {
    const { id: eventoId, error: eventoError } = await obtenerEventoId(slug);
    if (eventoError || !eventoId) throw eventoError || new Error("Evento no encontrado");

    const { data, error } = await supabase
      .from("asistentes_eventos")
      .select("*")
      .eq("evento_id", eventoId)
      .order("nombre");

    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(configuracion.nombre.slice(0, 31));

    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 25 },
      { header: "Adultos", key: "adultos", width: 10 },
      { header: "Infantiles", key: "infantiles", width: 12 },
      { header: "Invitados", key: "invitados", width: 12 },
      { header: "Adultos carne", key: "adultos_carne", width: 15 },
      { header: "Adultos pescado", key: "adultos_pescado", width: 17 },
      { header: "Plato", key: "plato", width: 25 },
      { header: "Tipo buffet", key: "tipo_buffet", width: 15 },
      { header: "Alergias", key: "alergias", width: 35 },
      { header: "Tipo de dieta", key: "tipo_dieta", width: 35 }
    ];

    data.forEach(item => worksheet.addRow({
      ...item
    }));

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${slug}-2026.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
  } catch (error) {
    console.error("Error exportando Excel:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
