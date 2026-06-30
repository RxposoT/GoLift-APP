import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIHub() {
  const theme = useTheme();
  const { user } = useAuth();
  const { paddingTop: safeTop } = useAndroidInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isAdmin = user?.tipo === 1;

  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    if (user?.id) loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const [planData, reportData] = await Promise.all([
        planoApi.getPlan(user!.id).catch(() => null),
        planoApi.getReport(user!.id).catch(() => null),
      ]);
      const userPlan = await planoApi.getUserPlan(user!.id).catch(() => null);
      if (userPlan?.plano) {
        setPlanoTipo(userPlan.plano as "free" | "pago");
      }
      if (planData?.plano) {
        setPlanStatus(planData.mes ? formatMes(planData.mes) : "Ativo");
      } else {
        setPlanStatus(planData?.pode_gerar ? "Disponível" : null);
      }
      if (reportData?.relatorio) {
        setReportStatus("Disponível");
      } else {
        setReportStatus(null);
      }
    } catch { }
    finally { setLoading(false); }
  }

  function formatMes(mesStr: string) {
    if (!mesStr) return "";
    const [ano, m] = mesStr.split("-");
    const d = new Date(Number(ano), Number(m) - 1, 1);
    return d.toLocaleDateString("pt-PT", { month: "long" }).replace(/^./, (c) => c.toUpperCase());
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 34, fontWeight: "800", color: theme.text, letterSpacing: -1.2 }}>
          Assistente IA
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 15, marginTop: 6, lineHeight: 22 }}>
          O diferencial do teu treino.
        </Text>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card — Estado IA */}
        <View style={{
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 24,
          padding: 22,
          marginBottom: 24,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: theme.accent + "18",
              justifyContent: "center", alignItems: "center",
              marginRight: 12,
            }}>
              <Ionicons name="sparkles" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: theme.textSecondary }}>
                INTELIGÊNCIA ARTIFICIAL
              </Text>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, letterSpacing: -0.3, marginTop: 2 }}>
                Potenciado por IA
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 21 }}>
            Planos de treino mensais e relatórios semanais criados à medida com inteligência artificial, adaptados ao teu nível e objetivos.
          </Text>
        </View>

        {/* Section Label */}
        <Text style={{
          fontSize: 11, fontWeight: "700", letterSpacing: 1,
          textTransform: "uppercase", color: theme.textSecondary, marginBottom: 12,
        }}>
          FUNCIONALIDADES
        </Text>

        {/* Card — Plano Mensal */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isAdmin && planoTipo !== "pago") {
              router.push("/upgrade");
              return;
            }
            router.push("/ai-plan");
          }}
          accessibilityRole="button"
          accessibilityLabel="Gerar Plano Mensal com IA"
          style={({ pressed }) => ({
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: theme.accent + "18",
              justifyContent: "center", alignItems: "center",
              marginRight: 14,
            }}>
              <Ionicons name="calendar" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, letterSpacing: -0.3 }}>
                  Plano Mensal
                </Text>
                {!loading && planStatus && (
                  <View style={{ backgroundColor: theme.accent + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: theme.accent }}>{planStatus}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Treino completo criado à medida dos teus objetivos e disponibilidade.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ marginLeft: 8 }} />
          </View>
        </Pressable>

        {/* Card — Relatório Semanal */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isAdmin && planoTipo !== "pago") {
              router.push("/upgrade");
              return;
            }
            router.push("/ai-report");
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver Relatório Semanal com IA"
          style={({ pressed }) => ({
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: theme.accent + "18",
              justifyContent: "center", alignItems: "center",
              marginRight: 14,
            }}>
              <Ionicons name="bar-chart" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, letterSpacing: -0.3 }}>
                  Relatório Semanal
                </Text>
                {!loading && reportStatus && (
                  <View style={{ backgroundColor: theme.accent + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: theme.accent }}>{reportStatus}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
                Análise de progresso, equilíbrio muscular e sugestões de melhoria.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} style={{ marginLeft: 8 }} />
          </View>
        </Pressable>

        {/* Quick Stats */}
        <Text style={{
          fontSize: 11, fontWeight: "700", letterSpacing: 1,
          textTransform: "uppercase", color: theme.textSecondary, marginBottom: 12,
        }}>
          RESUMO
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Plano
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 8 }} />
            ) : (
              <>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                  {planStatus || "—"}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {planStatus && planStatus !== "Disponível" ? "ativo" : "sem plano"}
                </Text>
              </>
            )}
          </View>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Relatório
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 8 }} />
            ) : (
              <>
                <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
                  {reportStatus || "—"}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {reportStatus ? "esta semana" : "sem dados"}
                </Text>
              </>
            )}
          </View>
        </View>


      </Animated.ScrollView>
    </View>
  );
}
