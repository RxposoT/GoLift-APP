import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import {
  CommunitiesProvider,
  useCommunities,
} from "../../src/contexts/CommunitiesContext";

// Mock useAuth to provide a test user
jest.mock("../../src/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", nome: "Test", email: "test@test.com" } }),
}));

// Mock communitiesApi
jest.mock("../../src/services/api", () => ({
  communitiesApi: {
    createCommunity: jest.fn(),
    sendMessage: jest.fn(),
    getCommunities: jest.fn(),
    getUserCommunities: jest.fn(),
    getCommunityMembers: jest.fn(),
  },
}));

// Mock supabase (for channel subscription)
jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

// Import mocks for local access
const { communitiesApi } = jest.requireMock("../../src/services/api");
const { supabase } = jest.requireMock("../../src/lib/supabase");

describe("CommunitiesContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: empty communities on load
    communitiesApi.getCommunities.mockResolvedValue([]);
    communitiesApi.getUserCommunities.mockResolvedValue([]);
    // Default channel mock
    supabase.channel.mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });
  });

  it("renders children and provides initial state", async () => {
    const { result } = renderHook(() => useCommunities(), {
      wrapper: CommunitiesProvider,
    });

    await waitFor(() => expect(communitiesApi.getCommunities).toHaveBeenCalled());

    expect(Array.isArray(result.current.communities)).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it("loads public communities on mount", async () => {
    const mockCommunities = [
      {
        id: 1,
        nome: "Comunidade Test",
        descricao: "Descrição",
        criador_id: "u1",
        criador_nome: "User1",
        membros: 5,
        verificada: true,
        criada_em: "2024-01-01",
      },
    ];
    communitiesApi.getCommunities.mockResolvedValue(mockCommunities);

    const { result } = renderHook(() => useCommunities(), {
      wrapper: CommunitiesProvider,
    });

    await waitFor(() => {
      expect(result.current.communities).toEqual(mockCommunities);
    });
  });

  it("createCommunity calls the API and reloads", async () => {
    communitiesApi.createCommunity.mockResolvedValue({
      sucesso: true,
      id: 10,
    });

    const { result } = renderHook(() => useCommunities(), {
      wrapper: CommunitiesProvider,
    });
    await waitFor(() => expect(communitiesApi.getCommunities).toHaveBeenCalled());

    // Reset call count
    communitiesApi.getCommunities.mockClear();

    await act(async () => {
      await result.current.createCommunity("Nova Comunidade", "Desc", "PT", false);
    });

    expect(communitiesApi.createCommunity).toHaveBeenCalledWith(
      "Nova Comunidade",
      "Desc",
      "PT",
      false,
    );
    expect(communitiesApi.getCommunities).toHaveBeenCalled();
  });

  it("sendMessage calls the API", async () => {
    communitiesApi.sendMessage.mockResolvedValue({ sucesso: true });

    const { result } = renderHook(() => useCommunities(), {
      wrapper: CommunitiesProvider,
    });
    await waitFor(() => expect(communitiesApi.getCommunities).toHaveBeenCalled());

    await act(async () => {
      await result.current.sendMessage(1, "Olá, comunidade!");
    });

    expect(communitiesApi.sendMessage).toHaveBeenCalledWith(1, "Olá, comunidade!");
  });

  it("sets up realtime channel on mount", async () => {
    renderHook(() => useCommunities(), {
      wrapper: CommunitiesProvider,
    });

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith("community_messages");
    });
  });
});
