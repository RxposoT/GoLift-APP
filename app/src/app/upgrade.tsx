import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";

const FREE_FEATURES = [
  "Registo de treinos ilimitado",
  "Histórico de métricas",
  "Comunidades públicas",
  "Exercícios da biblioteca",
];

const PRO_FEATURES = [
  "Tudo do plano Free",
  "Relatório semanal com IA",
  "Plano de treino mensal com IA",
  "Análise de progressão avançada",
  "Sugestões personalizadas",
];

export default function Upgrade() {
  const posthog = usePostHog();
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [plano, setPlano] = useState<"free" | "pago">("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [ativoAte, setAtivoAte] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) loadPlan();
  }, [user]);

  async function loadPlan() {
    try {
      const data = await planoApi.getUserPlan(user!.id);
      setPlano(data.plano as "free" | "pago");
      setAtivoAte(data.ativo_ate);
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout() {
    if (!user?.id) return;
    setCheckoutLoading(true);
    try {
      const data = await planoApi.createCheckoutSession(user.id);
      posthog.capture("subscription_checkout_started", {
        source: "upgrade_screen",
        current_plan: plano,
      });

      if (data.url) {
        const result = await WebBrowser.openBrowserAsync(data.url);
        let verificationStatus: string | null = null;

        if (data.sessionId) {
          try {
            const verification = await planoApi.verifySession(data.sessionId);
            verificationStatus = verification.status ?? verification.plano ?? null;

            if (verification.sucesso) {
              posthog.capture("subscription_checkout_completed", {
                source: "upgrade_screen",
                verification_status: verificationStatus,
                browser_result: result.type,
              });
            }
          } catch (error) {
            posthog.captureException(error as Error, {
              context: "subscription_verification",
            });
          }
        }
        loadPlan();
      }
    } catch (err: any) {
      posthog.captureException(err as Error, {
        context: "subscription_checkout",
      });
      Alert.alert("Erro", err?.message || "Não foi possível iniciar o pagamento. Tenta mais tarde.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const isPro = plano === "pago";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 20, paddingTop: safeTop + 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>Planos GoLift</Text>
      </View>

      {/* Status atual */}
      {isPro && (
        <View style={{
          marginHorizontal: 20,
          borderRadius: 20,
          backgroundColor: theme.accentGreen + "18",
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
          paddingVertical: 16,
          paddingHorizontal: 16,
        }}>
          <View style={{ width: 4, position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: theme.accentGreen }} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={{ color: theme.accentGreen, fontWeight: "700", fontSize: 15, letterSpacing: 0.2 }}>
              ✓ Plano GoLift Pro ativo
            </Text>
            {ativoAte && (
              <Text style={{ color: theme.accentGreen + "CC", fontSize: 12, marginTop: 3 }}>
                Válido até {new Date(ativoAte).toLocaleDateString("pt-PT")}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Hero */}
      <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: theme.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
          GoLift Pro
        </Text>
        <Text style={{ fontSize: 52, fontWeight: "800", color: theme.text, letterSpacing: -2, lineHeight: 56 }}>
          4,99€
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>/mês · cancela quando quiseres</Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
          Relatórios e planos de treino gerados por IA{"\n"}personalizados para os teus objetivos.
        </Text>
      </View>

      {/* Comparação Free vs Pro */}
      <View style={{ paddingHorizontal: 16, gap: 12, marginBottom: 28 }}>
        {/* Free */}
        <View style={{ borderRadius: 20, padding: 20, backgroundColor: theme.backgroundSecondary }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>FREE</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textSecondary }}>0€</Text>
          </View>
          {FREE_FEATURES.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: theme.textTertiary, marginRight: 10 }}>○</Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pro */}
        <View style={{ borderRadius: 20, padding: 20, backgroundColor: theme.accent + "15", overflow: "hidden" }}>
          <View style={{ width: 4, position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: theme.accent }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.accent, letterSpacing: 1, textTransform: "uppercase" }}>PRO</Text>
              <View style={{ backgroundColor: theme.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.5 }}>RECOMENDADO</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>4,99€</Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginLeft: 2, marginBottom: 2 }}>/mês</Text>
            </View>
          </View>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: theme.accent, marginRight: 10 }}>●</Text>
              <Text style={{ fontSize: 13, color: theme.text, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botão upgrade */}
      {!isPro && (
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={handleCheckout}
            disabled={checkoutLoading}
            accessibilityLabel="Subscrever GoLift Pro"
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: theme.accent,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed || checkoutLoading ? 0.7 : 1,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
            })}
          >
            {checkoutLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                  Subscrever GoLift Pro
                </Text>
                <Text style={{ color: "#ffffff88", fontSize: 15 }}>→</Text>
              </>
            )}
          </Pressable>
          <Text style={{ textAlign: "center", fontSize: 11, color: theme.textTertiary, marginTop: 12 }}>
            Pagamento seguro via Stripe · Cancela quando quiseres
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
