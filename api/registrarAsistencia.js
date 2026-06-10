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

    // COMPROBAR NOMBRE DUPLICADO

    const { data: asistenteExistente, error: errorBusqueda } =
      await supabase
        .from("asistentes")
        .select("id")
        .ilike("nombre", datos.nombre.trim()) // ignora mayúsculas/minúsculas
        .limit(1);

    if (errorBusqueda) {
      return res.status(500).json({
        ok: false,
        error: errorBusqueda.message
      });
    }

    if (asistenteExistente.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "Esta persona ya está registrada"
      });
    }

    // INSERT EN SUPABASE

    const { data, error } =
      await supabase
      .from("asistentes")
      .insert([
        {
          nombre: datos.nombre.trim(),

          adultos: datos.adultos || 0,

          infantiles: datos.infantiles || 0,

          invitados: datos.invitados || 0,

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