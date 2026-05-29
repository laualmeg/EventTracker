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

    if(!datos.nombre){

      return res.status(400).json({
        ok:false,
        error:"Nombre obligatorio"
      });

    }

    // INSERT EN SUPABASE

    const { data, error } =
      await supabase
      .from("asistentes")
      .insert([
        {
          nombre: datos.nombre,

          adultos:
            datos.adultos || 0,

          infantiles:
            datos.infantiles || 0,

          plato:
            datos.plato || "",

          tipo_buffet:
            datos.tipoBuffet || "adulto"
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