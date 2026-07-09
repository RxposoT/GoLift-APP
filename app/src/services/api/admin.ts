import { supabase } from "../../lib/supabase";

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

async function request<T>(endpoint: string, options?: { method?: string; body?: any }): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ erro: "Erro desconhecido" }));
    throw new Error(errData.erro || `HTTP ${response.status}`);
  }

  return await response.json();
}

export const adminApi = {
  getDashboard: () => request<{
    total_utilizadores: number;
    utilizadores_premium: number;
    total_treinos: number;
    treinos_hoje: number;
    total_frases: number;
  }>("/api/admin/dashboard"),

  getUsers: () => request<Array<{
    id: string; email: string; nome: string; tipo: number;
    plano: string; criado_em: string;
  }>>("/api/admin/users"),

  updateUserTipo: (userId: string, tipo: number) =>
    request<{ sucesso: boolean }>(`/api/admin/users/${userId}/tipo`, {
      method: "PATCH", body: { tipo },
    }),

  deleteUser: (userId: string) =>
    request<{ sucesso: boolean }>(`/api/admin/users/${userId}`, {
      method: "DELETE",
    }),

  getPhrases: () => request<Array<{
    id: number; data: string; frase: string; criado_em: string;
  }>>("/api/admin/phrases"),

  createPhrase: (data: string, frase: string) =>
    request<{ sucesso: boolean }>("/api/admin/phrases", {
      method: "POST", body: { data, frase },
    }),

  updatePhrase: (id: number, frase: string) =>
    request<{ sucesso: boolean }>(`/api/admin/phrases/${id}`, {
      method: "PUT", body: { frase },
    }),

  deletePhrase: (id: number) =>
    request<{ sucesso: boolean }>(`/api/admin/phrases/${id}`, {
      method: "DELETE",
    }),
};
