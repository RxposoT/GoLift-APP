import { supabase } from "../../lib/supabase";

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return {
      sucesso: true,
      user: {
        id: data.user.id,
        nome: data.user.user_metadata?.nome || email,
        email: data.user.email || email,
        tipo: data.user.user_metadata?.tipo || 0,
      },
    };
  },

  register: async (data: {
    nome: string;
    email: string;
    password: string;
    idade?: number;
    peso?: number;
    altura?: number;
    objetivo?: string;
    pesoAlvo?: number;
  }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome: data.nome,
          idade: data.idade,
          peso: data.peso,
          altura: data.altura,
          objetivo: data.objetivo,
          peso_alvo: data.pesoAlvo,
        },
      },
    });
    if (error) throw new Error(error.message);

    // Update profile with extra data
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        idade: data.idade,
        peso: data.peso,
        altura: data.altura,
        objetivo: data.objetivo,
        peso_alvo: data.pesoAlvo,
      }).eq("id", user.id);
    }

    return { sucesso: true, message: "Conta criada com sucesso!" };
  },

  // Supabase handles forgot password natively
  requestPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    return { sucesso: true };
  },

  testConnection: async () => {
    try {
      const { data, error } = await supabase.from("daily_phrases").select("id").limit(1);
      if (error) throw error;
      return { sucesso: true, mensagem: "Servidor está online", resultado: data };
    } catch (error: any) {
      return { sucesso: false, mensagem: error.message, resultado: null };
    }
  },
};
