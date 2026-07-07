import { supabase } from "../../lib/supabase";

export const pushApi = {
  saveToken: async (userId: string, token: string, platform: string) => {
    const { error } = await supabase.from("push_tokens").upsert(
      { user_id: userId, token, platform },
      { onConflict: "user_id, token" }
    );
    if (error) throw error;
  },

  getTokens: async (userId: string) => {
    const { data, error } = await supabase
      .from("push_tokens")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  removeToken: async (userId: string, token: string) => {
    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);
    if (error) throw error;
  },
};
