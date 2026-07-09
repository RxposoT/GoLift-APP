import { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { Text, Card, Button } from "../components/ui";
import { useFadeIn } from "../hooks/useAnimations";
import { radius as R, iconSize as I } from "../styles/tokens";

interface Relatorio {
  avaliacao: string;
  equilibrio: string;
  progressao: string;
  descanso: string;
  melhorias: string[];
}

interface ReportSection {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

// ─── Animated Section Card ──────────────────────────────────────────────────────
function SectionCard({ icon, label, value, color, index }: ReportSection & { index: number }) {
  const theme = useTheme();
  const { opacity, translateY } = useFadeIn(index);
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotate, {
      toValue: 1, friction: 6, tension: 100, delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  const rotateInterp = rotate.interpolate({ inputRange: [0, 1], outputRange: ["-15deg", "0deg"] });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
          <Animated.View
            style={{
              width: 36, height: 36, borderRadius: R.md,
              backgroundColor: color + "18",
              justifyContent: "center", alignItems: "center",
              transform: [{ rotate: rotateInterp }],
            }}
          >
            <Ionicons name={icon} size={I.sm} color={color} />
          </Animated.View>
          <Text variant="headline" style={{ color: theme.text }}>{label}</Text>
        </View>
        <Text variant="body" color="textSecondary" style={{ lineHeight: 22 }}>
          {value}
        </Text>
      </Card>
    </Animated.View>
  );
}

// ─── Empty / Loading / Plan states ─────────────────────────────────────────────
function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button" accessibilityLabel="Voltar"
      style={({ pressed }) => ({
        width: 40, height: 40, borderRadius: R.lg,
        backgroundColor: theme.backgroundSecondary,
        justifyContent: "center", alignItems: "center",
        marginRight: 14, opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="arrow-back" size={20} color={theme.text} />
    </Pressable>
  );
}

function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  const { safeTop } = useAndroidInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
      <BackButton onPress={onBack} />
      <View style={{ flex: 1 }}>
        <Text variant="title2" style={{ letterSpacing: -0.5 }}>{title}</Text>
        {subtitle && <Text variant="footnote" color="textSecondary" style={{ marginTop: 1 }}>{subtitle}</Text>}
      </View>
    </Animated.View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AIReport() {
  const posthog = usePostHog();
  const { user } = useAuth();
  const theme = useTheme();
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [semanaInicio, setSemanaInicio] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [semPlano, setSemPlano] = useState(false);
  const heroAnim = useRef(new Animated.Value(0)).current;
  const suggestionsFade = useFadeIn(relatorio?.melhorias?.length ? 4 : 0);

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (user?.id) loadReport();
  }, [user]);

  async function loadReport() {
    setLoading(true);
    try {
      const data = await planoApi.getReport(user!.id);
      setRelatorio(data.relatorio);
      setSemanaInicio(data.semana_inicio || "");
      if (!data.relatorio && !data.cached) {
        autoGenerate();
      }
    } catch (err: any) {
      if (err?.message?.includes("PLANO_NECESSARIO") || err?.status === 403) setSemPlano(true);
    } finally { setLoading(false); }
  }

  async function autoGenerate() {
    if (new Date().getDay() === 1) await generateReport();
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const data = await planoApi.getReport(user!.id);
      if (data.relatorio) {
        setRelatorio(data.relatorio);
        setSemanaInicio(data.semana_inicio || "");
        posthog.capture("ai_report_generated", {
          source: relatorio ? "manual_refresh" : "initial_generation",
          week_start: data.semana_inicio || null,
          suggestion_count: data.relatorio.melhorias?.length ?? 0,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Relatório", "Ainda não há dados suficientes na semana passada.");
      }
    } catch (err: any) {
      posthog.captureException(err as Error, {
        context: "ai_report_generate",
      });
      Alert.alert(
        err?.message?.includes("Limite") ? "IA Indisponível" : "Erro",
        err?.message || "Tenta mais tarde."
      );
    } finally { setGenerating(false); }
  }

  function handleManualGenerate() {
    Alert.alert("Gerar Relatório", "Gerar com base nos treinos da semana passada?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Gerar", onPress: generateReport },
    ]);
  }

  function formatSemana(dataStr: string) {
    if (!dataStr) return "";
    const inicio = new Date(dataStr);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
    return `${inicio.toLocaleDateString("pt-PT", opts)} – ${fim.toLocaleDateString("pt-PT", opts)}`;
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // ── Sem Plano ──
  if (semPlano) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Relatório Semanal" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 36 }}>
          <Animated.View style={{ transform: [{ scale: heroAnim }] }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.accent + "22", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
              <Ionicons name="bar-chart" size={32} color={theme.accent} />
            </View>
          </Animated.View>
          <Text variant="title1" style={{ textAlign: "center", marginBottom: 10 }}>Funcionalidade Pro</Text>
          <Text variant="body" color="textSecondary" style={{ textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
            Subscreve o GoLift Pro para acederes a relatórios semanais gerados por IA.
          </Text>
          <Button variant="primary" size="lg" onPress={() => router.push("/upgrade")} icon="star">
            Ver Planos Pro
          </Button>
        </View>
      </View>
    );
  }

  const sections: ReportSection[] = relatorio ? [
    { icon: "trophy-outline", label: "Avaliação Geral", value: relatorio.avaliacao, color: "#FF9500" },
    { icon: "body-outline", label: "Equilíbrio Muscular", value: relatorio.equilibrio, color: theme.accent },
    { icon: "trending-up-outline", label: "Progressão", value: relatorio.progressao, color: "#5856D6" },
    { icon: "moon-outline", label: "Descanso & Recuperação", value: relatorio.descanso, color: "#5AC8FA" },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Header
        title="Relatório Semanal"
        subtitle={semanaInicio ? formatSemana(semanaInicio) : undefined}
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Hero icon + IA badge */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Animated.View style={{ transform: [{ scale: heroAnim }] }}>
            <View style={{
              width: 64, height: 64, borderRadius: R.xl,
              backgroundColor: theme.accent + "18",
              justifyContent: "center", alignItems: "center",
              marginBottom: 8,
            }}>
              <Ionicons name="analytics" size={28} color={theme.accent} />
            </View>
          </Animated.View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={{ backgroundColor: theme.accent + "18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="sparkles" size={11} color={theme.accent} />
              <Text variant="caption" style={{ color: theme.accent }}>IA</Text>
            </View>
            {relatorio && (
              <Pressable
                onPress={handleManualGenerate}
                disabled={generating}
                accessibilityLabel="Gerar novo relatório"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                {generating
                  ? <ActivityIndicator size="small" color={theme.accent} />
                  : <Ionicons name="refresh-outline" size={18} color={theme.textTertiary} />
                }
              </Pressable>
            )}
          </View>
        </View>

        {/* Generando */}
        {generating && !relatorio && (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.accent + "22", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
            <Text variant="headline" style={{ marginBottom: 6 }}>A analisar os teus treinos...</Text>
            <Text variant="footnote" color="textSecondary">Pode demorar alguns segundos</Text>
          </View>
        )}

        {/* Sem relatório */}
        {!relatorio && !generating && (
          <View style={{ paddingHorizontal: 24 }}>
            <Card style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: R.lg, backgroundColor: theme.accent + "18", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                  <Ionicons name="analytics" size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="textSecondary">ANÁLISE SEMANAL</Text>
                  <Text variant="title3" style={{ marginTop: 2 }}>A IA analisa a tua semana</Text>
                </View>
              </View>
              <Text variant="body" color="textSecondary" style={{ lineHeight: 21 }}>
                Desempenho, equilíbrio muscular, progressão e sugestões personalizadas.
              </Text>
            </Card>

            <Text variant="body" color="textSecondary" style={{ textAlign: "center", lineHeight: 22, marginBottom: 24 }}>
              O relatório é gerado automaticamente às segundas-feiras.{"\n"}
              Podes também gerar manualmente.
            </Text>

            <Button variant="primary" size="lg" icon="sparkles" onPress={generateReport} style={{ borderRadius: R.xl }}>
              Gerar Relatório
            </Button>
          </View>
        )}

        {/* Com relatório */}
        {relatorio && !generating && (
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            {sections.map((s, i) => (
              <SectionCard key={i} {...s} index={i} />
            ))}

            {/* Sugestões */}
            {relatorio.melhorias?.length > 0 && (
              <Animated.View style={{ opacity: suggestionsFade.opacity }}>
                <Card style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: R.md, backgroundColor: "#f59e0b18", justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name="bulb" size={18} color="#f59e0b" />
                    </View>
                    <Text variant="headline">Sugestões para esta semana</Text>
                  </View>
                  {relatorio.melhorias.map((m: string, i: number) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: i < relatorio!.melhorias.length - 1 ? 12 : 0 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#f59e0b22", justifyContent: "center", alignItems: "center", marginRight: 10, marginTop: 1, flexShrink: 0 }}>
                        <Text variant="caption" style={{ color: "#f59e0b" }}>{i + 1}</Text>
                      </View>
                      <Text variant="body" color="textSecondary" style={{ flex: 1, lineHeight: 22 }}>{m}</Text>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Footer note */}
            <View style={{ marginTop: 16, marginBottom: 8, padding: R.lg, borderRadius: R.lg, backgroundColor: theme.backgroundSecondary, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="sparkles-outline" size={14} color={theme.textTertiary} />
              <Text variant="caption" color="textTertiary" style={{ flex: 1, lineHeight: 16 }}>
                Relatório gerado por IA com base nos teus treinos. Atualiza às segundas-feiras.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
