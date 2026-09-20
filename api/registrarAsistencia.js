import supabase from "../lib/supabase.js";

console.log("API registrarAsistencia: SUPABASE_URL set?", Boolean(process.env.SUPABASE_URL));
console.log("API registrarAsistencia: SUPABASE_KEY set?", Boolean(process.env.SUPABASE_KEY));
console.log("API registrarAsistencia: SUPABASE_SERVICE_ROLE_KEY set?", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));

export default async function handler(req, res) {

  // SOLO POST

  if(req.method !== "POST"){

    return res.status(405).json({
      ok:false,
      error:"Método no permitido"
    });

  }

  try{

    const datos = req.body;

    console.log("Nuevo asistente:");
    console.log(datos);

        // VALIDACIONES

    if (!datos.nombre?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Nombre obligatorio"
      });
    }

    if (!datos.plato?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Debes indicar el plato que traerás"
      });
    }

    // Convertir cantidades a números
    const adultos = Number(datos.adultos);
    const infantiles = Number(datos.infantiles);
    const invitados = Number(datos.invitados);

    // Comprobar que las cantidades son válidas
    if (
      !Number.isInteger(adultos) ||
      !Number.isInteger(infantiles) ||
      !Number.isInteger(invitados)
    ) {
      return res.status(400).json({
        ok: false,
        error: "Las cantidades de asistentes deben ser números enteros"
      });
    }

    // No permitir cantidades negativas
    if (adultos < 0 || infantiles < 0 || invitados < 0) {
      return res.status(400).json({
        ok: false,
        error: "Adultos, infantiles e invitados no pueden ser negativos"
      });
    }

    // Debe haber al menos un adulto o un infantil.
    // Los invitados no pueden inscribirse solos.
    if (adultos === 0 && infantiles === 0) {
      return res.status(400).json({
        ok: false,
        error: "Debe haber al menos un adulto o un infantil. Los invitados no pueden inscribirse solos."
      });
    }

    // Si hay adultos y ningún infantil,
    // no pueden elegir buffet infantil.
    if (
      adultos > 0 &&
      infantiles === 0 &&
      datos.tipoBuffet === "infantil"
    ) {
      return res.status(400).json({
        ok: false,
        error: "No puedes elegir el buffet infantil si no hay ningún infantil"
      });
    }

    // Si solo hay infantiles,
    // obligatoriamente buffet infantil.
    if (
      adultos === 0 &&
      infantiles > 0 &&
      datos.tipoBuffet !== "infantil"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Si solo hay infantiles, solo pueden llevar algo para el buffet infantil"
      });
    }

    // INSERT EN SUPABASE

    const { data, error } =
      await supabase
      .from("asistentes")
      .insert([
        {
          nombre: datos.nombre.trim(),
          adultos: adultos,
          infantiles: infantiles,
          invitados: invitados,
          plato: datos.plato.trim(),

          tipo_buffet: datos.tipoBuffet || "adulto"
        }
      ])
      .select();

    // ERROR SUPABASE

    if(error){

      console.error(
        "Error Supabase:",
        error
      );

      return res.status(500).json({
        ok:false,
        error:error.message
      });

    }

    // OK

    return res.status(200).json({
      ok:true,
      mensaje:"Asistente guardado",
      data:data
    });

  } catch(error){

    console.error(
      "Error servidor:",
      error
    );

    return res.status(500).json({
      ok:false,
      error: error?.message || String(error) || "Error interno"
    });

  }

}