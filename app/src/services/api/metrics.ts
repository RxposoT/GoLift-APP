import { supabase } from "../../lib/supabase";

export const metricsApi = {
  getHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select(`
        id, data_fim, duracao_segundos,
        workout:workouts!inner(id, nome),
        workout_sets(count)
      `)
      .eq("workout.user_id", userId)
      .not("data_fim", "is", null)
      .order("data_fim", { ascending: false });

    if (error) return [];
    return (data || []).map((s: any) => ({
      id_sessao: s.id,
      id_treino: s.workout?.id,
      nome: s.workout?.nome || `Treino ${s.workout?.id}`,
      data_fim: s.data_fim,
      duracao_segundos: s.duracao_segundos,
      num_exercicios: (s as any).workout_sets?.[0]?.count || 0,
    }));
  },

  getRecords: async (userId: string) => {
    const { data, error } = await supabase
      .rpc("get_user_records", { p_user_id: userId })
      .order("data_serie", { ascending: false })
      .limit(3);

    if (error) return [];
    return (data || []).map((r: any) => ({
      nome_exercicio: r.exercise_name,
      peso: r.peso,
      data_serie: r.data_serie,
      exercise_id: r.exercise_id,
    }));
  },

  getExerciseHistory: async (userId: string, exercicioId: number) => {
    const { data, error } = await supabase
      .from("workout_sets")
      .select("peso, repeticoes, data_serie")
      .eq("exercise_id", exercicioId)
      .gt("peso", 0)
      .in("session_id", (
        await supabase
          .from("workout_sessions")
          .select("id")
          .eq("user_id", userId)
      ).data?.map((s) => s.id) || [])
      .order("data_serie");

    if (error) return [];
    return data || [];
  },

  getStreak: async (userId: string) => {
    const { data, error } = await supabase
      .rpc("get_user_streak", { p_user_id: userId });

    if (error) return { sucesso: false, streak: 0, maxStreak: 0, totalDays: 0 };
    return {
      sucesso: true,
      streak: data?.streak || 0,
      maxStreak: data?.maxStreak || 0,
      totalDays: 0,
    };
  },

  getSessionDetails: async (sessaoId: number) => {
    const { data: session, error: sErr } = await supabase
      .from("workout_sessions")
      .select(`
        id, workout_id, data_fim, duracao_segundos,
        workout:workouts!inner(nome)
      `)
      .eq("id", sessaoId)
      .single();

    if (sErr) throw sErr;

    const { data: sets } = await supabase
      .from("workout_sets")
      .select(`
        id, exercise_id, numero_serie, repeticoes, peso,
        exercise:exercises(nome, grupo_tipo, sub_tipo)
      `)
      .eq("session_id", sessaoId)
      .order("exercise_id")
      .order("numero_serie");

    const exercicios: any[] = [];
    const exercicioMap: any = {};

    (sets || []).forEach((set: any) => {
      if (!exercicioMap[set.exercise_id]) {
        exercicioMap[set.exercise_id] = {
          id_exercicio: set.exercise_id,
          nome_exercicio: set.exercise?.nome,
          grupo_tipo: set.exercise?.grupo_tipo,
          sub_tipo: set.exercise?.sub_tipo,
          series: [],
        };
        exercicios.push(exercicioMap[set.exercise_id]);
      }
      exercicioMap[set.exercise_id].series.push({
        id_serie: set.id,
        numero_serie: set.numero_serie,
        repeticoes: set.repeticoes,
        peso: set.peso,
      });
    });

    const w = Array.isArray(session.workout) ? session.workout[0] : session.workout;
    return {
      id_sessao: session.id,
      id_treino: session.workout_id,
      nome_treino: w?.nome,
      data_fim: session.data_fim,
      duracao_segundos: session.duracao_segundos,
      exercicios,
    };
  },

  getStats: async (userId: string) => {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("data_fim, duracao_segundos")
      .eq("user_id", userId)
      .not("data_fim", "is", null);

    const list = sessions || [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return {
      totalWorkouts: list.length,
      thisWeek: list.filter((s: any) => {
        const date = new Date(s.data_fim);
        return date >= startOfWeek;
      }).length,
      thisMonth: list.filter((s: any) => {
        const date = new Date(s.data_fim);
        return date >= startOfMonth;
      }).length,
      totalTime: list.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0),
      avgDuration: list.length > 0
        ? Math.round(list.reduce((acc: number, s: any) => acc + (s.duracao_segundos || 0), 0) / list.length)
        : 0,
    };
  },

  getMuscleBalance: async (userId: string) => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data, error } = await supabase
      .from("workout_sets")
      .select("repeticoes, exercise:exercises(grupo_tipo), session:workout_sessions!inner(user_id, data_fim)")
      .eq("session.user_id", userId)
      .gte("session.data_fim", since.toISOString())
      .not("session.data_fim", "is", null);

    if (error) return {};
    return (data || []).reduce((totals: Record<string, number>, set: any) => {
      const group = set.exercise?.grupo_tipo;
      if (!group || !["Peito", "Costas", "Ombros", "Pernas", "Abdominais", "Braços"].includes(group)) return totals;
      totals[group] = (totals[group] || 0) + Math.max(1, Number(set.repeticoes) || 0);
      return totals;
    }, {});
  },
};
