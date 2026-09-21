import supabase from "./supabase.js";

export const EVENTOS = {
  "san-juan": {
    nombre: "San Juan 2026",
    buffet: true,
    dieta: false
  },
  proclamacion: {
    nombre: "Proclamacion Falleras Mayores 2026",
    buffet: false,
    dieta: true
  }
};

export function obtenerEvento(slug) {
  return EVENTOS[slug] || null;
}

export async function obtenerEventoId(slug) {
  const evento = obtenerEvento(slug);

  if (!evento) {
    return { id: null, error: new Error("Evento no valido") };
  }

  const { data, error } = await supabase
    .from("eventos")
    .select("id")
    .eq("slug", slug)
    .single();

  return { id: data?.id || null, error };
}
