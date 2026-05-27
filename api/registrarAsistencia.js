export default async function handler(req, res) {

  if(req.method !== "POST"){

    return res.status(405).json({
      error: "Método no permitido"
    });

  }

  try{

    const datos = req.body;

    console.log("Nuevo asistente:");
    //console.log("Nuevo registro:");

    console.log(datos);

    /*
      Aquí luego guardarás en BD

      Ejemplo futuro:
      await supabase
        .from("asistentes")
        .insert([datos]);
    */

    return res.status(200).json({
      ok: true,
      mensaje: "Asistente guardado"
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Error interno"
    });

  }

}