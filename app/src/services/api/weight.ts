import { supabase } from "../../lib/supabase";

export const weightApi = {
  async getHistory(userId: string): Promise<Array<{ week: string; weight: number }>> {
    const { data, error } = await supabase
      .from("weight_history")
      .select("week, weight")
      .eq("user_id", userId)
      .order("week", { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      week: row.week,
      weight: Number(row.weight),
    }));
  },

  async upsertEntry(userId: string, week: string, weight: number): Promise<void> {
    const { error } = await supabase.from("weight_history").upsert(
      { user_id: userId, week, weight },
      { onConflict: "user_id, week", ignoreDuplicates: false }
    );
    if (error) throw error;
  },

  async deleteEntry(userId: string, week: string): Promise<void> {
    const { error } = await supabase
      .from("weight_history")
      .delete()
      .eq("user_id", userId)
      .eq("week", week);
    if (error) throw error;
  },
};
