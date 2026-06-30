import { supabase } from "../../lib/supabase";

export const userApi = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  },

  updateProfile: async (userId: string, data: any) => {
    const { data: result, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return result;
  },
};
