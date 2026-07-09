import { supabase } from "../../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

async function backendRequest<T>(
  endpoint: string,
  options?: { method?: string; body?: any; timeout?: number }
): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  const controller = new AbortController();
  const timeout = options?.timeout ?? 10000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ erro: "Erro desconhecido" }));
      throw new Error(errData.erro || `HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export const planoApi = {
  getUserPlan: async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("plano, plano_ativo_ate")
      .eq("id", userId)
      .single();

    if (error) return { plano: "free" as const, ativo_ate: null };

    const agora = new Date();
    const ativo = data.plano === "pago" && (!data.plano_ativo_ate || new Date(data.plano_ativo_ate) > agora);

    if (data.plano === "pago" && !ativo) {
      await supabase.from("profiles").update({ plano: "free" }).eq("id", userId);
    }

    return { plano: ativo ? "pago" : "free", ativo_ate: data.plano_ativo_ate };
  },

  createCheckoutSession: (userId: string) =>
    backendRequest<{ sucesso: boolean; url: string; sessionId: string }>(
      "/api/stripe/checkout-session",
      { method: "POST", body: { userId }, timeout: 15000 }
    ),

  getReport: (userId: string) =>
    backendRequest<{
      sucesso: boolean;
      relatorio: {
        avaliacao: string;
        equilibrio: string;
        progressao: string;
        descanso: string;
        melhorias: string[];
      } | null;
      semana_inicio: string;
      cached: boolean;
      pode_gerar?: boolean;
    }>(`/api/ai/report/${userId}`, { timeout: 60000 }),

  getPlan: (userId: string) =>
    backendRequest<{
      sucesso: boolean;
      plano: {
        descricao: string;
        split: Array<{
          dia: string;
          foco: string;
          exercicios: Array<{
            nome: string;
            series: number;
            repeticoes: string;
            observacao?: string;
          }>;
        }>;
      } | null;
      mes: string;
      criado_em?: string;
      pode_gerar: boolean;
    }>(`/api/ai/plan/${userId}`),

  generatePlan: (
    userId: string,
    params: {
      diasPorSemana: number;
      tempoTreino: number;
      objetivo: string;
      targets: string[];
      condicoes: string;
      descansoEntreSeriesSegundos: number;
    }
  ) =>
    backendRequest<{ sucesso: boolean; plano: object; mes: string; descanso_segundos: number }>(
      `/api/ai/plan/${userId}/generate`,
      { method: "POST", body: params, timeout: 60000 }
    ),

  importPlanDay: (
    userId: string,
    dia: string,
    foco: string,
    exercicios: Array<{
      nome?: string;
      exercicio?: string;
      series: number;
      repeticoes: string;
      observacao?: string;
    }>
  ) =>
    backendRequest<{ sucesso: boolean; id_treino: number; nome: string }>(
      `/api/ai/plan/${userId}/import-day`,
      { method: "POST", body: { dia, foco, exercicios } }
    ),

  getDailyPhrase: async () => {
    try {
      return await backendRequest<{ frase: string; cached: boolean; mock?: boolean }>(
        "/api/daily-phrase"
      );
    } catch {
      return {
        frase: "O teu único limite és tu mesmo. Vai mais além.",
        cached: false,
        mock: true,
      };
    }
  },

  createStripePortal: (userId: string) =>
    backendRequest<{ url: string }>("/api/stripe/portal", { method: "POST", body: { userId } }),

  verifySession: (sessionId: string) =>
    backendRequest<{ sucesso: boolean; plano?: string; status?: string }>(
      "/api/stripe/verify-session",
      { method: "POST", body: { sessionId } }
    ),

  submitFeedback: (userId: string, feedback: {
    session_id: number;
    sentir_score: number | null;
    dor_zones: string[];
    dor_intensidade: number | null;
    energia_treino: number | null;
  }) =>
    backendRequest<{
      sucesso: boolean;
      mensagem: string;
      sugestao: string | null;
      feedback_dor: string | null;
    }>("/api/ai/feedback/" + userId, {
      method: "POST",
      body: feedback,
      timeout: 60000,
    }),

  adaptWorkout: (userId: string, workoutId: number) =>
    backendRequest<{
      sucesso: boolean;
      adaptado: boolean;
      nivel_adaptacao: string;
      motivo: string | null;
      modificacoes: Array<{
        exercicio: string;
        alteracao: string;
        motivo: string;
      }>;
    }>("/api/ai/adapt/" + userId, {
      method: "POST",
      body: { workout_id: workoutId },
      timeout: 60000,
    }),
};
