import { supabase } from "../../lib/supabase";

export const communitiesApi = {
  getCommunities: async () => {
    const { data, error } = await supabase
      .from("communities")
      .select(`
        id, nome, descricao, criador_id, pais, linguas, categoria,
        privada, verificada, imagem_url, criada_em,
        profile:profiles!criador_id(nome),
        membros:community_members(count)
      `)
      .eq("verificada", 1)
      .order("criada_em", { ascending: false });

    if (error) throw error;
    return (data || []).map((c: any) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      criador_id: c.criador_id,
      criador_nome: c.profile?.nome,
      pais: c.pais,
      linguas: c.linguas,
      categoria: c.categoria,
      privada: !!c.privada,
      verificada: !!c.verificada,
      imagem_url: c.imagem_url,
      criada_em: c.criada_em,
      membros: (c as any).membros?.[0]?.count || 0,
    }));
  },

  getUserCommunities: async (userId: string) => {
    const { data: memberships } = await supabase
      .from("community_members")
      .select(`
        comunidade_id,
        community:communities!inner(
          id, nome, descricao, criador_id, pais, linguas, categoria,
          privada, verificada, imagem_url, criada_em,
          profile:profiles!criador_id(nome)
        )
      `)
      .eq("user_id", userId);

    return (memberships || []).map((m: any) => ({
      id: m.community?.id,
      nome: m.community?.nome,
      descricao: m.community?.descricao,
      criador_id: m.community?.criador_id,
      criador_nome: m.community?.profile?.nome,
      pais: m.community?.pais,
      linguas: m.community?.linguas,
      privada: !!m.community?.privada,
      verificada: !!m.community?.verificada,
      criada_em: m.community?.criada_em,
      membros: 0,
    }));
  },

  createCommunity: async (data: {
    nome: string;
    descricao: string;
    pais?: string;
    privada?: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from("communities")
      .insert({
        nome: data.nome,
        descricao: data.descricao,
        pais: data.pais,
        privada: data.privada ? 1 : 0,
        criador_id: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add creator as member
    if (result) {
      await supabase.from("community_members").insert({
        comunidade_id: result.id,
        user_id: user?.id,
      });
    }

    return result;
  },

  updateCommunity: async (
    comunidadeId: number,
    data: { nome?: string; descricao?: string; pais?: string; privada?: boolean }
  ) => {
    const { error } = await supabase
      .from("communities")
      .update(data)
      .eq("id", comunidadeId);
    if (error) throw error;
    return { sucesso: true };
  },

  joinCommunity: async (comunidadeId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("community_members")
      .insert({ comunidade_id: comunidadeId, user_id: user?.id });
    if (error) throw error;
    return { sucesso: true };
  },

  leaveCommunity: async (comunidadeId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("comunidade_id", comunidadeId)
      .eq("user_id", user?.id);
    if (error) throw error;
    return { sucesso: true };
  },

  sendMessage: async (comunidadeId: number, mensagem: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from("community_messages")
      .insert({
        comunidade_id: comunidadeId,
        user_id: user.id,
        mensagem,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      user_nome: user.user_metadata?.nome || "Utilizador",
    };
  },

  getCommunityMessages: async (comunidadeId: number) => {
    const { data, error } = await supabase
      .from("community_messages")
      .select(`
        id, comunidade_id, user_id, mensagem, criada_em,
        profile:profiles!user_id(nome)
      `)
      .eq("comunidade_id", comunidadeId)
      .order("criada_em");

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      comunidade_id: m.comunidade_id,
      user_id: m.user_id,
      user_nome: m.profile?.nome || "Utilizador",
      mensagem: m.mensagem,
      criada_em: m.criada_em,
    }));
  },

  getCommunityMembers: async (comunidadeId: number) => {
    const { data, error } = await supabase
      .from("community_members")
      .select(`
        id, comunidade_id, user_id, juntou_em,
        profile:profiles!user_id(nome, email)
      `)
      .eq("comunidade_id", comunidadeId)
      .order("juntou_em");

    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      comunidade_id: m.comunidade_id,
      user_id: m.user_id,
      user_nome: m.profile?.nome,
      email: m.profile?.email,
      juntou_em: m.juntou_em,
    }));
  },

  deleteCommunity: async (comunidadeId: number) => {
    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", comunidadeId);
    if (error) throw error;
    return { sucesso: true };
  },
};
