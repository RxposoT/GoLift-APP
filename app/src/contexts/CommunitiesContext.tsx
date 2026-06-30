import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Community, CommunityMessage, CommunityMember } from "../types";
import { communitiesApi } from "../services/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface CommunitiesContextData {
  communities: Community[];
  userCommunities: Community[];
  messages: { [communityId: number]: CommunityMessage[] };
  isLoading: boolean;
  createCommunity: (nome: string, descricao: string, pais?: string, privada?: boolean) => Promise<void>;
  updateCommunity: (comunidadeId: number, data: { nome?: string; descricao?: string; pais?: string; privada?: boolean }) => Promise<void>;
  joinCommunity: (comunidadeId: number) => Promise<void>;
  leaveCommunity: (comunidadeId: number) => Promise<void>;
  deleteCommunity: (comunidadeId: number) => Promise<void>;
  sendMessage: (comunidadeId: number, mensagem: string) => Promise<void>;
  loadCommunities: () => Promise<void>;
  loadCommunityMessages: (comunidadeId: number) => Promise<void>;
  getCommunityMembers: (comunidadeId: number) => Promise<CommunityMember[]>;
}

const CommunitiesContext = createContext<CommunitiesContextData>({} as CommunitiesContextData);

export function CommunitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<{ [communityId: number]: CommunityMessage[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCommunities();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("community_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        async (payload) => {
          const newMsg = payload.new as any;
          const comunidadeId = newMsg.comunidade_id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("nome")
            .eq("id", newMsg.user_id)
            .single();

          const msg: CommunityMessage = {
            id: newMsg.id,
            comunidade_id: newMsg.comunidade_id,
            user_id: newMsg.user_id,
            user_nome: profile?.nome || "Utilizador",
            mensagem: newMsg.mensagem,
            criada_em: newMsg.criada_em,
          };

          setMessages((prev) => ({
            ...prev,
            [comunidadeId]: [...(prev[comunidadeId] || []), msg],
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadCommunities() {
    try {
      setIsLoading(true);
      const data = await communitiesApi.getCommunities();
        setCommunities(data?.map((c: any) => ({ ...c, membros: c.membros || 0 })) || []);

      if (user?.id) {
        const userComm = await communitiesApi.getUserCommunities(user.id);
        setUserCommunities(userComm);
      }
    } catch (error) {
      console.error("Erro ao carregar comunidades:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createCommunity(nome: string, descricao: string, pais?: string, privada?: boolean) {
    try {
      const newCommunity = await communitiesApi.createCommunity({
        nome,
        descricao,
        pais,
        privada,
      });
      setCommunities([...communities, newCommunity]);
      setUserCommunities([...userCommunities, newCommunity]);
    } catch (error) {
      console.error("Erro ao criar comunidade:", error);
      throw error;
    }
  }

  async function updateCommunity(comunidadeId: number, data: { nome?: string; descricao?: string; pais?: string; privada?: boolean }) {
    try {
      await communitiesApi.updateCommunity(comunidadeId, data);
      const update = (list: Community[]) =>
        list.map((c) => c.id === comunidadeId ? { ...c, ...data } : c);
      setCommunities((prev) => update(prev));
      setUserCommunities((prev) => update(prev));
    } catch (error) {
      console.error("Erro ao atualizar comunidade:", error);
      throw error;
    }
  }

  async function joinCommunity(comunidadeId: number) {
    try {
      await communitiesApi.joinCommunity(comunidadeId);
      const community = communities.find((c) => c.id === comunidadeId);
      if (community) {
        setUserCommunities([...userCommunities, community]);
      }
    } catch (error) {
      console.error("Erro ao entrar na comunidade:", error);
      throw error;
    }
  }

  async function leaveCommunity(comunidadeId: number) {
    try {
      await communitiesApi.leaveCommunity(comunidadeId);
      setUserCommunities(userCommunities.filter((c) => c.id !== comunidadeId));
    } catch (error) {
      console.error("Erro ao sair da comunidade:", error);
      throw error;
    }
  }

  async function deleteCommunity(comunidadeId: number) {
    try {
      await communitiesApi.deleteCommunity(comunidadeId);
      setCommunities((prev) => prev.filter((c) => c.id !== comunidadeId));
      setUserCommunities((prev) => prev.filter((c) => c.id !== comunidadeId));
    } catch (error) {
      console.error("Erro ao apagar comunidade:", error);
      throw error;
    }
  }

  async function sendMessage(comunidadeId: number, mensagem: string) {
    try {
      const response = await communitiesApi.sendMessage(comunidadeId, mensagem);
      const messageToAdd = {
        id: response?.id || Date.now(),
        user_id: response?.user_id || user?.id || "",
        user_nome: response?.user_nome || user?.nome || "",
        mensagem: mensagem,
        criada_em: response?.criada_em || new Date().toISOString(),
      };
      setMessages((prev) => ({
        ...prev,
        [comunidadeId]: [...(prev[comunidadeId] || []), messageToAdd as CommunityMessage],
      }));
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      throw error;
    }
  }

  async function loadCommunityMessages(comunidadeId: number) {
    try {
      const data = await communitiesApi.getCommunityMessages(comunidadeId);
      setMessages({
        ...messages,
        [comunidadeId]: data,
      });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }

  async function getCommunityMembers(comunidadeId: number) {
    try {
      return await communitiesApi.getCommunityMembers(comunidadeId);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
      return [];
    }
  }

  return (
    <CommunitiesContext.Provider
      value={{
        communities,
        userCommunities,
        messages,
        isLoading,
        createCommunity,
        updateCommunity,
        joinCommunity,
        leaveCommunity,
        deleteCommunity,
        sendMessage,
        loadCommunities,
        loadCommunityMessages,
        getCommunityMembers,
      }}
    >
      {children}
    </CommunitiesContext.Provider>
  );
}

export function useCommunities() {
  const context = useContext(CommunitiesContext);
  if (!context) {
    throw new Error("useCommunities deve ser usado dentro de CommunitiesProvider");
  }
  return context;
}
