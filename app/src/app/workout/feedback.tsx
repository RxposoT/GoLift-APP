import { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { planoApi, metricsApi } from "../../services/api";
import PainBodyMap from "../../components/PainBodyMap";
import { Button, Text } from "../../components/ui";
import { spacing, radius } from "../../styles/tokens";

// ─── Constantes de UI ────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  { value: 1, emoji: "😫", label: "Muito Mau" },
  { value: 2, emoji: "😕", label: "Mau" },
  { value: 3, emoji: "😐", label: "Razoável" },
  { value: 4, emoji: "😊", label: "Bom" },
  { value: 5, emoji: "🔥", label: "Excelente!" },
];

const ENERGY_OPTIONS = [
  { value: 1, emoji: "🪫", label: "Sem energia" },
  { value: 2, emoji: "😴", label: "Pouca" },
  { value: 3, emoji: "🙂", label: "Normal" },
  { value: 4, emoji: "⚡", label: "Bastante" },
  { value: 5, emoji: "💥", label: "Cheio!" },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Barra de progresso de volume ─────────────────────────────────────────────

function VolumeBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const theme = useTheme() as any;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>{label}</Text>
        <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700" }}>
          {value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value}kg`}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: theme.backgroundTertiary, borderRadius: 4, overflow: "hidden" }}>
        <Animated.View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }}
        />
      </View>
    </View>
  );
}

// ─── Ecrã Simples (Free) ──────────────────────────────────────────────────────

function FreeSummary({ nome, duracao, totalSeries, volume, exerciciosData }: any) {
  const theme = useTheme() as any;
  const { safeTop, paddingBottom: safeBottom } = useAndroidInsets();
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true,
    }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <Animated.View
          style={{
            alignItems: "center",
            paddingTop: safeTop + 48,
            paddingHorizontal: 24,
            opacity: entryAnim,
            transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }}
        >
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: "#30D158",
            alignItems: "center", justifyContent: "center", marginBottom: 24,
            shadowColor: "#30D158", shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
          }}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>

          <Text variant="title1" style={{ textAlign: "center" }}>Treino Concluído!</Text>
          <Text variant="callout" color="textSecondary" style={{ marginTop: 6, textAlign: "center" }}>{nome}</Text>
        </Animated.View>

        {/* Stats grid */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{
              flex: 1, backgroundColor: theme.backgroundSecondary,
              borderRadius: radius.xl, padding: 20, alignItems: "center",
              borderWidth: 2, borderColor: theme.backgroundTertiary,
              shadowColor: theme.backgroundTertiary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1, shadowRadius: 0, elevation: 4,
            }}>
              <Text variant="caption" color="textSecondary" style={{ marginBottom: 6 }}>DURAÇÃO</Text>
              <Text variant="title2">{formatTime(duracao)}</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: theme.backgroundSecondary,
              borderRadius: radius.xl, padding: 20, alignItems: "center",
              borderWidth: 2, borderColor: theme.backgroundTertiary,
              shadowColor: theme.backgroundTertiary, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1, shadowRadius: 0, elevation: 4,
            }}>
              <Text variant="caption" color="textSecondary" style={{ marginBottom: 6 }}>SÉRIES</Text>
              <Text variant="title2">{totalSeries}</Text>
            </View>
          </View>

          {volume > 0 && (
            <View style={{
              backgroundColor: theme.accent, borderRadius: radius.xl, padding: 20,
              borderWidth: 2, borderBottomWidth: 6,
              borderColor: theme.primary,
            }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                VOLUME TOTAL
              </Text>
              <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -1.5 }}>
                {volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}kg`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: "absolute", bottom: safeBottom + 16, left: 20, right: 20 }}>
        <Button variant="duo" size="lg" onPress={() => router.replace("/")} style={{ width: "100%" }}>
          Continuar
        </Button>
      </View>
    </View>
  );
}

// ─── Ecrã Premium (Duolingo-style) ────────────────────────────────────────────

function PremiumFlow({ sessionId, nome, duracao, totalSeries, volume, exerciciosData, userId, posthog }: any) {
  const theme = useTheme() as any;
  const { safeTop, paddingBottom: safeBottom } = useAndroidInsets();

  // passos: 0=feeling, 1=energia, 2=dor, 3=resultado
  const [passo, setPasso] = useState(0);
  const [sentirScore, setSentirScore] = useState<number | null>(null);
  const [energiaTreino, setEnergiaTreino] = useState<number | null>(null);
  const [dorZones, setDorZones] = useState<string[]>([]);
  const [dorIntensidade, setDorIntensidade] = useState<number | null>(null);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [previousVolume, setPreviousVolume] = useState<number>(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const gorillaBounce = useRef(new Animated.Value(0)).current;

  // Carregar volume anterior para comparação
  useEffect(() => {
    metricsApi.getHistory(userId).then((h: any[]) => {
      if (!Array.isArray(h)) return;
      const sorted = h
        .filter((s: any) => s.id_treino && s.volume_total)
        .sort((a: any, b: any) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
      if (sorted.length > 1) setPreviousVolume(Number(sorted[1]?.volume_total || 0));
    }).catch(() => {});
  }, []);

  function animateGorilla() {
    Animated.sequence([
      Animated.timing(gorillaBounce, { toValue: -16, duration: 200, useNativeDriver: true }),
      Animated.spring(gorillaBounce, { toValue: 0, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
  }

  function goToNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = passo + 1;
    if (next === 3) {
      // Disparar AI automaticamente ao chegar ao passo final
      submitAndLoadAI();
    }
    setPasso(next);
    animateGorilla();
  }

  async function submitAndLoadAI() {
    if (!sessionId) return;
    setAiLoading(true);
    try {
      const data = await planoApi.submitFeedback(userId, {
        session_id: sessionId,
        sentir_score: sentirScore,
        dor_zones: dorZones,
        dor_intensidade: dorIntensidade,
        energia_treino: energiaTreino,
      });
      setAiResponse(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      posthog?.capture("workout_feedback_submitted", {
        session_id: sessionId,
        workout_nome: nome,
        sentir_score: sentirScore,
        energia_treino: energiaTreino,
        is_premium: true,
        has_ai_response: !!data?.mensagem,
      });
    } catch {
      setAiResponse({ mensagem: "Ótimo esforço! Continua assim no próximo treino." });
    } finally {
      setAiLoading(false);
      animateGorilla();
    }
  }

  function toggleDor(zone: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDorZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  const maxVol = Math.max(volume, previousVolume, 1);

  // ── Passo 0: Feeling ──────────────────────────────────────────────────────
  if (passo === 0) return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        {/* Gorila */}
        <Animated.Image
          source={require("../../../assets/images/Gorila.png")}
          style={{ width: 120, height: 120, transform: [{ translateY: gorillaBounce }], marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text variant="title2" style={{ textAlign: "center", marginBottom: 8 }}>Como te sentiste?</Text>
        <Text variant="callout" color="textSecondary" style={{ textAlign: "center", marginBottom: 40 }}>{nome}</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 4 }}>
          {EMOJI_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { setSentirScore(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              style={{
                flex: 1, alignItems: "center", gap: 6, paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: sentirScore === opt.value ? theme.accent + "18" : theme.backgroundSecondary,
                borderWidth: 2,
                borderColor: sentirScore === opt.value ? theme.accent : "transparent",
              }}
            >
              <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: sentirScore === opt.value ? theme.accent : theme.textSecondary, textAlign: "center" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Indicadores de passo */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: i === passo ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === passo ? theme.accent : theme.backgroundTertiary }} />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: safeBottom + 16 }}>
        <Button variant="duo" size="lg" onPress={goToNext} disabled={!sentirScore} style={{ width: "100%" }}>
          Continuar
        </Button>
      </View>
    </View>
  );

  // ── Passo 1: Energia ──────────────────────────────────────────────────────
  if (passo === 1) return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Animated.Image
          source={require("../../../assets/images/Gorila.png")}
          style={{ width: 120, height: 120, transform: [{ translateY: gorillaBounce }], marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text variant="title2" style={{ textAlign: "center", marginBottom: 8 }}>Nível de energia?</Text>
        <Text variant="callout" color="textSecondary" style={{ textAlign: "center", marginBottom: 40 }}>Como te sentiste durante o treino?</Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 4 }}>
          {ENERGY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { setEnergiaTreino(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              style={{
                flex: 1, alignItems: "center", gap: 6, paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: energiaTreino === opt.value ? theme.accent + "18" : theme.backgroundSecondary,
                borderWidth: 2,
                borderColor: energiaTreino === opt.value ? theme.accent : "transparent",
              }}
            >
              <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
              <Text style={{ fontSize: 10, fontWeight: "600", color: energiaTreino === opt.value ? theme.accent : theme.textSecondary, textAlign: "center" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: i === passo ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === passo ? theme.accent : theme.backgroundTertiary }} />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: safeBottom + 16 }}>
        <Button variant="duo" size="lg" onPress={goToNext} disabled={!energiaTreino} style={{ width: "100%" }}>
          Continuar
        </Button>
      </View>
    </View>
  );

  // ── Passo 2: Dor ──────────────────────────────────────────────────────────
  if (passo === 2) return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: safeTop + 20, paddingBottom: 120 }}>
        <Text variant="title2" style={{ textAlign: "center", marginBottom: 4 }}>Sentiste alguma dor?</Text>
        <Text variant="callout" color="textSecondary" style={{ textAlign: "center", marginBottom: 20 }}>Toca nas zonas onde sentiste desconforto</Text>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          {["front", "back"].map((v) => (
            <Pressable
              key={v}
              onPress={() => setBodyView(v as "front" | "back")}
              style={{
                paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20,
                backgroundColor: bodyView === v ? theme.accent : theme.backgroundSecondary,
              }}
            >
              <Text style={{ color: bodyView === v ? "#fff" : theme.textSecondary, fontWeight: "600", fontSize: 13 }}>
                {v === "front" ? "Frontal" : "Posterior"}
              </Text>
            </Pressable>
          ))}
        </View>

        <PainBodyMap selected={dorZones} onToggle={toggleDor} view={bodyView} />

        {dorZones.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: 10 }}>INTENSIDADE DA DOR (1–5)</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setDorIntensidade(v)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
                    backgroundColor: dorIntensidade === v ? "#FF3B30" : theme.backgroundTertiary,
                  }}
                >
                  <Text style={{ color: dorIntensidade === v ? "#fff" : theme.textSecondary, fontWeight: "700", fontSize: 15 }}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: i === passo ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === passo ? theme.accent : theme.backgroundTertiary }} />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: safeBottom + 16, gap: 10 }}>
        <Button variant="duo" size="lg" onPress={goToNext} style={{ width: "100%" }}>
          {dorZones.length === 0 ? "Sem dores, continuar" : "Registar e continuar"}
        </Button>
        <Pressable onPress={goToNext} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: theme.textTertiary, fontSize: 13 }}>Saltar</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Passo 3: Resultado final ───────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ alignItems: "center", paddingTop: safeTop + 32, paddingHorizontal: 24 }}>
          <Animated.Image
            source={require("../../../assets/images/Gorila.png")}
            style={{ width: 140, height: 140, transform: [{ translateY: gorillaBounce }], marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text variant="title1" style={{ textAlign: "center" }}>
            {(sentirScore || 3) >= 4 ? "Fantástico! 🔥" : "Bom trabalho! 💪"}
          </Text>
          <Text variant="callout" color="textSecondary" style={{ marginTop: 4, textAlign: "center" }}>{nome}</Text>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, marginTop: 24, flexDirection: "row", gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: radius.xl, padding: 16, alignItems: "center",
            borderWidth: 2, borderBottomWidth: 5, borderColor: theme.backgroundTertiary,
          }}>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>DURAÇÃO</Text>
            <Text variant="title3">{formatTime(duracao)}</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: radius.xl, padding: 16, alignItems: "center",
            borderWidth: 2, borderBottomWidth: 5, borderColor: theme.backgroundTertiary,
          }}>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>SÉRIES</Text>
            <Text variant="title3">{totalSeries}</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: theme.accent, borderRadius: radius.xl, padding: 16, alignItems: "center",
            borderWidth: 2, borderBottomWidth: 5, borderColor: theme.primary,
          }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 }}>VOLUME</Text>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
              {volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}kg`}
            </Text>
          </View>
        </View>

        {/* Gráfico de progresso de volume */}
        {(volume > 0 || previousVolume > 0) && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View style={{
              backgroundColor: theme.backgroundSecondary, borderRadius: radius.xl, padding: 20,
              borderWidth: 2, borderBottomWidth: 5, borderColor: theme.backgroundTertiary,
            }}>
              <Text variant="headline" style={{ marginBottom: 16 }}>Progresso de Volume</Text>
              <VolumeBar label="Treino anterior" value={previousVolume} max={maxVol} color={theme.backgroundTertiary} />
              <VolumeBar label="Hoje" value={volume} max={maxVol} color={theme.accent} />
              {volume > previousVolume && previousVolume > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <Ionicons name="trending-up" size={16} color="#30D158" />
                  <Text style={{ color: "#30D158", fontSize: 13, fontWeight: "700" }}>
                    +{Math.round(volume - previousVolume)}kg vs. treino anterior
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Insight de IA */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{
            backgroundColor: aiLoading ? theme.backgroundSecondary : theme.accent + "15",
            borderRadius: radius.xl, padding: 20,
            borderWidth: 1, borderColor: aiLoading ? theme.backgroundTertiary : theme.accent + "30",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              {aiLoading
                ? <ActivityIndicator size="small" color={theme.accent} />
                : <Ionicons name="sparkles" size={18} color={theme.accent} />
              }
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
                {aiLoading ? "O Gorila está a analisar…" : "INSIGHT GORILA"}
              </Text>
            </View>

            {aiLoading ? (
              <View style={{ gap: 8 }}>
                {[0.9, 0.7, 0.5].map((w, i) => (
                  <View key={i} style={{ height: 14, borderRadius: 7, backgroundColor: theme.backgroundTertiary, width: `${w * 100}%` }} />
                ))}
              </View>
            ) : (
              <>
                <Text style={{ color: theme.text, fontSize: 16, lineHeight: 24, fontWeight: "500" }}>
                  {aiResponse?.mensagem || "Ótimo esforço! Continua assim no próximo treino."}
                </Text>
                {aiResponse?.sugestao && (
                  <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: theme.backgroundSecondary, flexDirection: "row", gap: 8 }}>
                    <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 }}>
                      {aiResponse.sugestao}
                    </Text>
                  </View>
                )}
                {aiResponse?.feedback_dor && (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: "#FF3B3015", flexDirection: "row", gap: 8 }}>
                    <Ionicons name="fitness-outline" size={16} color="#FF3B30" />
                    <Text style={{ color: "#FF3B30", fontSize: 13, lineHeight: 19, flex: 1 }}>
                      {aiResponse.feedback_dor}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: "absolute", bottom: safeBottom + 16, left: 20, right: 20 }}>
        <Button variant="duo" size="lg" onPress={() => router.replace("/")} style={{ width: "100%" }}>
          Continuar
        </Button>
      </View>
    </View>
  );
}

// ─── Ecrã principal de roteamento ─────────────────────────────────────────────

export default function WorkoutFeedback() {
  const { user } = useAuth();
  const posthog = usePostHog();
  const params = useLocalSearchParams();

  const sessionId = Number(params.session_id);
  const nome = (params.nome as string) ?? "Treino";
  const duracao = Number(params.duracao ?? 0);
  const totalSeries = Number(params.totalSeries ?? 0);
  const volume = Number(params.volume ?? 0);
  const exerciciosRaw = (params.exercicios as string) ?? "[]";

  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  let exerciciosData: any[] = [];
  try { exerciciosData = JSON.parse(exerciciosRaw); } catch { exerciciosData = []; }

  useEffect(() => {
    planoApi.getUserPlan(user!.id)
      .then(({ plano }) => setIsPremium(plano === "pago"))
      .catch(() => setIsPremium(false));
  }, []);

  if (isPremium === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isPremium) {
    return (
      <FreeSummary
        nome={nome} duracao={duracao}
        totalSeries={totalSeries} volume={volume}
        exerciciosData={exerciciosData}
      />
    );
  }

  return (
    <PremiumFlow
      sessionId={sessionId} nome={nome}
      duracao={duracao} totalSeries={totalSeries}
      volume={volume} exerciciosData={exerciciosData}
      userId={user!.id} posthog={posthog}
    />
  );
}
