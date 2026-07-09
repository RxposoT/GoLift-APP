import { supabase } from "../../lib/supabase";
import { posthog } from "../../lib/posthog";

export const workoutApi = {
  getUserWorkouts: async (userId: string) => {
    const { data, error } = await supabase
      .from("workouts")
      .select(`
        id, nome, data_treino, is_ia,
        workout_exercises!inner(
          exercise:exercises(id, nome, grupo_tipo)
        )
      `)
      .eq("user_id", userId)
      .order("data_treino", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw error;
    return (data || []).map((w: any) => ({
      id_treino: w.id,
      nome: w.nome,
      data_treino: w.data_treino,
      is_ia: w.is_ia || 0,
      num_exercicios: w.workout_exercises?.length || 0,
      exercicios_nomes: (w.workout_exercises || [])
        .map((we: any) => we.exercise?.nome)
        .filter(Boolean)
        .join(", "),
      grupo_tipo: [...new Set((w.workout_exercises || [])
        .map((we: any) => we.exercise?.grupo_tipo)
        .filter(Boolean))].join(", "),
    }));
  },

  createWorkout: async (userId: string, nome: string, exercicios: number[]) => {
    const { data: workout, error: wErr } = await supabase
      .from("workouts")
      .insert({ user_id: userId, nome })
      .select("id")
      .single();

    if (wErr) {
      posthog.captureException(wErr as Error, {
        context: "workout_create",
      });
      throw wErr;
    }

    if (exercicios.length > 0) {
      const { error: eErr } = await supabase.from("workout_exercises").insert(
        exercicios.map((exId) => ({
          workout_id: workout.id,
          exercise_id: exId,
        }))
      );
      if (eErr) {
        posthog.captureException(eErr as Error, {
          context: "workout_create_exercises",
        });
        throw eErr;
      }
    }

    posthog.capture("workout_created", {
      workout_id: workout.id,
      exercise_count: exercicios.length,
      is_ai_workout: false,
    });

    return { sucesso: true, id_treino: workout.id };
  },

  updateWorkout: async (userId: string, treinoId: number, nome: string, exercicios: number[]) => {
    const { error: nErr } = await supabase
      .from("workouts")
      .update({ nome })
      .eq("id", treinoId)
      .eq("user_id", userId);
    if (nErr) {
      posthog.captureException(nErr as Error, {
        context: "workout_update",
      });
      throw nErr;
    }

    const { error: deleteErr } = await supabase.from("workout_exercises").delete().eq("workout_id", treinoId);
    if (deleteErr) {
      posthog.captureException(deleteErr as Error, {
        context: "workout_update_delete_exercises",
      });
      throw deleteErr;
    }

    if (exercicios.length > 0) {
      const { error: eErr } = await supabase.from("workout_exercises").insert(
        exercicios.map((exId) => ({
          workout_id: treinoId,
          exercise_id: exId,
        }))
      );
      if (eErr) {
        posthog.captureException(eErr as Error, {
          context: "workout_update_exercises",
        });
        throw eErr;
      }
    }

    posthog.capture("workout_updated", {
      workout_id: treinoId,
      exercise_count: exercicios.length,
    });

    return { sucesso: true };
  },

  deleteWorkout: async (userId: string, treinoId: number) => {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", treinoId)
      .eq("user_id", userId);
    if (error) {
      posthog.captureException(error as Error, {
        context: "workout_delete",
      });
      throw error;
    }

    posthog.capture("workout_deleted", {
      workout_id: treinoId,
    });

    return { sucesso: true };
  },

  saveSession: async (
    userId: string,
    treinoId: number,
    duracao_segundos: number,
    series: { id_exercicio: number; numero_serie: number; repeticoes: number; peso: number }[]
  ) => {
    const { data: session, error: sErr } = await supabase
      .from("workout_sessions")
      .insert({
        workout_id: treinoId,
        user_id: userId,
        data_fim: new Date().toISOString(),
        duracao_segundos,
      })
      .select("id")
      .single();

    if (sErr) {
      posthog.captureException(sErr as Error, {
        context: "workout_session_save",
      });
      throw sErr;
    }

    if (series.length > 0) {
      const { error: setsErr } = await supabase.from("workout_sets").insert(
        series.map((s) => ({
          session_id: session.id,
          exercise_id: s.id_exercicio,
          numero_serie: s.numero_serie,
          repeticoes: s.repeticoes,
          peso: s.peso,
        }))
      );
      if (setsErr) {
        posthog.captureException(setsErr as Error, {
          context: "workout_session_sets_save",
        });
        throw setsErr;
      }
    }

    posthog.capture("workout_session_saved", {
      workout_id: treinoId,
      session_id: session.id,
      duration_seconds: duracao_segundos,
      set_count: series.length,
    });

    return { sucesso: true, id_sessao: session.id };
  },

  getWorkoutExercises: async (treinoId: number) => {
    const { data, error } = await supabase
      .from("workout_exercises")
      .select(`
        exercise:exercises(id, nome, descricao, grupo_tipo, sub_tipo)
      `)
      .eq("workout_id", treinoId);

    if (error) return { sucesso: false, exercicios: [] };
    return {
      sucesso: true,
      exercicios: (data || []).map((we: any) => ({
        id: we.exercise?.id,
        nome: we.exercise?.nome,
        descricao: we.exercise?.descricao,
        category: we.exercise?.grupo_tipo,
        subType: we.exercise?.sub_tipo,
      })),
    };
  },
};
