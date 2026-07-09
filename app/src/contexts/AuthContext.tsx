import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { router } from "expo-router";
import { usePostHog } from "posthog-react-native";
import { supabase } from "../lib/supabase";
import { authApi } from "../services/api";
import { User } from "../types";

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  nome: string;
  email: string;
  password: string;
  idade?: number;
  peso?: number;
  altura?: number;
  objetivo?: string;
  pesoAlvo?: number;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const posthog = usePostHog();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const restoredUser = {
          id: session.user.id,
          nome: session.user.user_metadata?.nome || session.user.email || "",
          email: session.user.email || "",
          tipo: session.user.user_metadata?.tipo || 0,
        };
        setUser(restoredUser);
        posthog.identify(session.user.id, {
          $set: {
            email: session.user.email || "",
            nome: restoredUser.nome,
            tipo: restoredUser.tipo,
          },
          $set_once: {
            first_login_at: new Date().toISOString(),
          },
        });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const nextUser = {
          id: session.user.id,
          nome: session.user.user_metadata?.nome || session.user.email || "",
          email: session.user.email || "",
          tipo: session.user.user_metadata?.tipo || 0,
        };
        setUser(nextUser);
        posthog.identify(session.user.id, {
          $set: {
            email: session.user.email || "",
            nome: nextUser.nome,
            tipo: nextUser.tipo,
          },
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [posthog]);

  async function login(email: string, password: string) {
    try {
      const response = await authApi.login(email, password);

      if (response.sucesso && response.user) {
        const userData: User = {
          id: response.user.id,
          nome: response.user.nome,
          email: response.user.email,
          tipo: response.user.tipo,
        };
        setUser(userData);
        posthog.identify(userData.id, {
          $set: {
            email: userData.email,
            nome: userData.nome,
            tipo: userData.tipo,
          },
          $set_once: {
            first_login_at: new Date().toISOString(),
          },
        });
        posthog.capture("user_logged_in", {
          login_method: "email",
          user_type: userData.tipo,
        });
        router.replace("/(tabs)");
      } else {
        throw new Error("Erro ao iniciar sessão");
      }
    } catch (error) {
      throw error;
    }
  }

  async function register(data: RegisterData) {
    try {
      const response = await authApi.register(data);

      if (response.sucesso) {
        posthog.capture("user_registered", {
          signup_method: "email",
          objective: data.objetivo ?? null,
          has_target_weight: Boolean(data.pesoAlvo),
        });
        await login(data.email, data.password);
      } else {
        throw new Error(response.message || "Erro ao registar");
      }
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      posthog.reset();
      setUser(null);
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
