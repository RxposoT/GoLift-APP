import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../../src/contexts/AuthContext";

// Mocks
jest.mock("../../src/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("../../src/services/api", () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    testConnection: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

// Import mocks for local access
const { supabase } = jest.requireMock("../../src/lib/supabase");
const { authApi } = jest.requireMock("../../src/services/api");

describe("AuthContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    // Default: login succeeds (register() internally calls login())
    authApi.login.mockResolvedValue({ sucesso: true, user: { id: "1", nome: "Test User", email: "test@test.com", tipo: 0 } });
  });

  it("renders children and provides default unauthenticated state", async () => {
    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("login calls authApi.login and updates state", async () => {
    const fakeUser = {
      id: "1",
      nome: "Test User",
      email: "test@test.com",
      tipo: 0,
    };
    authApi.login.mockResolvedValue({ sucesso: true, user: fakeUser });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login("test@test.com", "password123");
    });

    expect(authApi.login).toHaveBeenCalledWith("test@test.com", "password123");
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login throws on invalid credentials", async () => {
    authApi.login.mockRejectedValue(new Error("Credenciais inválidas"));

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(
        result.current.login("wrong@test.com", "wrong"),
      ).rejects.toThrow("Credenciais inválidas");
    });
  });

  it("logout calls supabase.auth.signOut and clears user", async () => {
    // Start with an active session
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "1",
            email: "test@test.com",
            user_metadata: { nome: "Test" },
          },
        },
      },
      error: null,
    });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);

    supabase.auth.signOut.mockResolvedValue({ error: null });

    await act(async () => {
      await result.current.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("register calls authApi.register with correct data", async () => {
    authApi.register.mockResolvedValue({ sucesso: true });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const registerData = {
      nome: "New User",
      email: "new@test.com",
      password: "pass123",
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(authApi.register).toHaveBeenCalledWith(registerData);
  });

  it("restores session on mount if session exists", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "2",
            email: "existing@test.com",
            user_metadata: { nome: "Existing" },
          },
        },
      },
      error: null,
    });

    const { result } = await renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe("2");
    expect(result.current.user?.email).toBe("existing@test.com");
  });
});
