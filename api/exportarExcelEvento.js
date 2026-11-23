
import ExcelJS from "exceljs";
import supabase from "../lib/supabase.js";
import { obtenerEvento, obtenerEventoId } from "../lib/eventos.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Metodo no permitido"
    });
  }

  const slug = req.query?.evento;
  const configuracion = obtenerEvento(slug);

  if (!configuracion) {
    return res.status(400).json({
      ok: false,
      error: "Evento no valido"
    });
  }

  try {
    const {
      id: eventoId,
      error: eventoError
    } = await obtenerEventoId(slug);

    if (eventoError || !eventoId) {
      throw eventoError || new Error("Evento no encontrado");
    }

    const { data, error } = await supabase
      .from("asistentes_eventos")
      .select("*")
      .eq("evento_id", eventoId)
      .order("nombre");

    if (error) throw error;

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Falla";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(
      configuracion.nombre.slice(0, 31)
    );

    // ==================================================
    // EXPORTACIÓN ESPECÍFICA DE NAVIDAD
    // ==================================================

    if (configuracion.tipo === "navidad") {

      worksheet.columns = [
        { header: "Responsable", key: "nombre", width: 25 },
        { header: "Adultos", key: "adultos", width: 10 },
        { header: "Adultos arroz", key: "adultosArroz", width: 15 },
        { header: "Adultos comida propia", key: "adultosPropia", width: 22 },
        { header: "Infantiles", key: "infantiles", width: 12 },
        { header: "Infantiles arroz", key: "infantilesArroz", width: 17 },
        { header: "Infantiles comida propia", key: "infantilesPropia", width: 25 },
        { header: "Total arroz", key: "totalArroz", width: 13 },
        { header: "Importe total (€)", key: "importe_total", width: 17 },
        { header: "Fecha inscripción", key: "created_at", width: 22 }
      ];

      data.forEach(item => {

        const comidas = item.comidas_navidad || {};

        const adultos = Array.isArray(comidas.adultos)
          ? comidas.adultos
          : [];

        const infantiles = Array.isArray(comidas.infantiles)
          ? comidas.infantiles
          : [];

        const adultosArroz = adultos.filter(
          comida => comida === "arroz" || comida === "arroz al horno"
        ).length;

        const adultosPropia = adultos.filter(
          comida => comida === "propia"
        ).length;

        const infantilesArroz = infantiles.filter(
          comida => comida === "arroz" || comida === "arroz al horno"
        ).length;

        const infantilesPropia = infantiles.filter(
          comida => comida === "propia"
        ).length;

        worksheet.addRow({
          nombre: item.nombre,
          adultos: item.adultos,
          adultosArroz,
          adultosPropia,
          infantiles: item.infantiles,
          infantilesArroz,
          infantilesPropia,
          totalArroz: adultosArroz + infantilesArroz,
          importe_total: Number(item.importe_total) || 0,
          created_at: item.created_at
            ? new Date(item.created_at).toLocaleString("es-ES")
            : ""
        });
      });

      // Fila de totales
      const totalFila = worksheet.addRow({
        nombre: "TOTALES",
        adultos: sumar(data, "adultos"),
        adultosArroz: sumarComidas(data, "adultos", "arroz"),
        adultosPropia: sumarComidas(data, "adultos", "propia"),
        infantiles: sumar(data, "infantiles"),
        infantilesArroz: sumarComidas(data, "infantiles", "arroz"),
        infantilesPropia: sumarComidas(data, "infantiles", "propia"),
        totalArroz: data.reduce((total, item) => {
          return total
            + contarComida(item.comidas_navidad?.adultos, "arroz")
            + contarComida(item.comidas_navidad?.infantiles, "arroz");
        }, 0),
        importe_total: data.reduce(
          (total, item) => total + (Number(item.importe_total) || 0),
          0
        )
      });

      totalFila.font = { bold: true };
      totalFila.getCell("importe_total").numFmt = '#,##0.00 "€"';

      worksheet.getColumn("importe_total").numFmt = '#,##0.00 "€"';
    }

    // ==================================================
    // EXPORTACIÓN DE LOS DEMÁS EVENTOS
    // SAN JUAN Y PROCLAMACIÓN
    // ==================================================

    else {

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

      data.forEach(item => {
        worksheet.addRow({
          ...item
        });
      });
    }

    // ==================================================
    // FORMATO GENERAL
    // ==================================================

    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: "FFFFFFFF" }
    };

    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center"
    };

    worksheet.getRow(1).height = 25;

    worksheet.views = [
      { state: "frozen", ySplit: 1 }
    ];

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

    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}


// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

function sumar(data, campo) {
  return data.reduce(
    (total, item) => total + (Number(item[campo]) || 0),
    0
  );
}

function contarComida(comidas, tipo) {
  if (!Array.isArray(comidas)) return 0;

  return comidas.filter(comida => {
    if (tipo === "arroz") {
      return comida === "arroz" || comida === "arroz al horno";
    }

    return comida === tipo;
  }).length;
}

function sumarComidas(data, grupo, tipo) {
  return data.reduce(
    (total, item) =>
      total + contarComida(item.comidas_navidad?.[grupo], tipo),
    0
  );
}
