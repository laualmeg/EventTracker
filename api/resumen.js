app.get("/api/resumen", async (req, res) => {

  try {

    const { data, error } = await supabase
      .from("asistentes")
      .select("adultos, infantiles");

    if (error) {
      throw error;
    }

    const totalAdultos = data.reduce(
      (acc, item) => acc + (item.adultos || 0),
      0
    );

    const totalInfantiles = data.reduce(
      (acc, item) => acc + (item.infantiles || 0),
      0
    );

    res.json({
      totalAdultos,
      totalInfantiles
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error obteniendo resumen"
    });

  }

});