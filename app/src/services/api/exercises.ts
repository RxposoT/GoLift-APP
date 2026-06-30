import { supabase } from "../../lib/supabase";

export const exerciseApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("id, nome, descricao, video, grupo_tipo, sub_tipo")
      .order("nome");
    if (error) throw error;
    return (data || []).map((e: any) => ({
      ...e,
      category: e.grupo_tipo,
      subType: e.sub_tipo,
    }));
  },
};
