import { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { planoApi } from "../../services/api";
import PainBodyMap from "../../components/PainBodyMap";

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
  { value: 5, emoji: "💥", label: "Cheio de energia" },
];

export default function WorkoutFeedback() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { user } = useAuth();
  const posthog = usePostHog();
  const params = useLocalSearchParams();

  const sessionId = Number(params.session_id);
  const nome = (params.nome as string) ?? "Treino";

  const [passo, setPasso] = useState(0);
  const [sentirScore, setSentirScore] = useState<number | null>(null);
  const [energiaTreino, setEnergiaTreino] = useState<number | null>(null);
  const [dorZones, setDorZones] = useState<string[]>([]);
  const [dorIntensidade, setDorIntensidade] = useState<number | null>(null);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkPremium();
  }, []);

  async function checkPremium() {
    try {
      const plan = await planoApi.getUserPlan(user!.id);
      setIsPremium(plan?.plano === "pago");
    } catch {
      setIsPremium(false);
    }
  }

  function toggleDor(zone: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDorZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  async function submitFeedback() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await planoApi.submitFeedback(user!.id, {
        session_id: sessionId,
        sentir_score: sentirScore,
        dor_zones: dorZones,
        dor_intensidade: dorIntensidade,
        energia_treino: energiaTreino,
      });
      setAiResponse(data);
      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Track workout feedback submitted
      posthog.capture("workout_feedback_submitted", {
        session_id: sessionId,
        workout_nome: nome,
        sentir_score: sentirScore,
        energia_treino: energiaTreino,
        dor_zones_count: dorZones?.length || 0,
        dor_intensidade: dorIntensidade,
        is_premium: isPremium,
        has_ai_response: !!data?.mensagem,
      });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  function goToSummary() {
    router.replace({
      pathname: "/workout/summary",
      params: {
        nome: params.nome,
        duracao: params.duracao,
        totalSeries: params.totalSeries,
        volume: params.volume,
        exercicios: params.exercicios,
        feedback_ai: aiResponse ? JSON.stringify(aiResponse) : "",
      },
    });
  }

  const pulse = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ alignItems: "center", paddingTop: safeTop + 40, paddingHorizontal: 24 }}>
          <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1, textAlign: "center" }}>
            Treino Concluído!
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 15, marginTop: 6, textAlign: "center" }}>
            {nome}
          </Text>
        </View>

        {submitted && aiResponse && isPremium ? (
          <>
            {/* AI Response */}
            <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
              <View style={{
                backgroundColor: theme.accent + "15",
                borderRadius: 24, padding: 24,
                borderWidth: 1, borderColor: theme.accent + "25",
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Ionicons name="sparkles" size={18} color={theme.accent} />
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>
                    INSIGHT IA
                  </Text>
                </View>
                <Text style={{ color: theme.text, fontSize: 17, lineHeight: 26, fontWeight: "500" }}>
                  {aiResponse.mensagem}
                </Text>
                {aiResponse.sugestao && (
                  <View style={{
                    marginTop: 16, padding: 14, borderRadius: 14,
                    backgroundColor: theme.backgroundSecondary,
                    flexDirection: "row", gap: 10,
                  }}>
                    <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
                    <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 }}>
                      {aiResponse.sugestao}
                    </Text>
                  </View>
                )}
                {aiResponse.feedback_dor && (
                  <View style={{
                    marginTop: 10, padding: 14, borderRadius: 14,
                    backgroundColor: "#FF3B3015",
                    flexDirection: "row", gap: 10,
                  }}>
                    <Ionicons name="fitness-outline" size={18} color="#FF3B30" />
                    <Text style={{ color: "#FF3B30", fontSize: 14, lineHeight: 20, flex: 1 }}>
                      {aiResponse.feedback_dor}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Pressable
                onPress={goToSummary}
                style={{
                  backgroundColor: theme.accent, borderRadius: 20,
                  paddingVertical: 18, alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                  Ver Resumo do Treino
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Step 0: How was the workout? */}
            {passo === 0 && (
              <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>
                  Como te sentiste neste treino?
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  {EMOJI_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => { setSentirScore(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                      style={{
                        alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 6,
                        borderRadius: 16,
                        backgroundColor: sentirScore === opt.value ? theme.accent + "18" : "transparent",
                        borderWidth: 2,
                        borderColor: sentirScore === opt.value ? theme.accent : "transparent",
                        minWidth: 60,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{opt.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: sentirScore === opt.value ? theme.accent : theme.textSecondary, textAlign: "center" }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 1: Pain */}
            {passo === 1 && (
              <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, textAlign: "center" }}>
                  Sentiste alguma dor ou desconforto?
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20, textAlign: "center" }}>
                  Toca nas zonas onde sentiste dor
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 }}>
                  <Pressable
                    onPress={() => setBodyView("front")}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20,
                      backgroundColor: bodyView === "front" ? theme.accent : theme.backgroundSecondary,
                    }}
                  >
                    <Text style={{ color: bodyView === "front" ? "#fff" : theme.textSecondary, fontWeight: "600", fontSize: 13 }}>
                      Frontal
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setBodyView("back")}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20,
                      backgroundColor: bodyView === "back" ? theme.accent : theme.backgroundSecondary,
                    }}
                  >
                    <Text style={{ color: bodyView === "back" ? "#fff" : theme.textSecondary, fontWeight: "600", fontSize: 13 }}>
                      Posterior
                    </Text>
                  </Pressable>
                </View>

                <PainBodyMap selected={dorZones} onToggle={toggleDor} view={bodyView} />

                {dorZones.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                      Intensidade da dor (1-5)
                    </Text>
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
                          <Text style={{ color: dorIntensidade === v ? "#fff" : theme.textSecondary, fontWeight: "700", fontSize: 15 }}>
                            {v}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Step 2: Energy */}
            {passo === 2 && (
              <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>
                  Nível de energia durante o treino
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  {ENERGY_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => { setEnergiaTreino(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                      style={{
                        alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 6,
                        borderRadius: 16,
                        backgroundColor: energiaTreino === opt.value ? theme.accent + "18" : "transparent",
                        borderWidth: 2,
                        borderColor: energiaTreino === opt.value ? theme.accent : "transparent",
                        minWidth: 60,
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>{opt.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: energiaTreino === opt.value ? theme.accent : theme.textSecondary, textAlign: "center" }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step indicator */}
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 40 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{
                  width: i === passo ? 24 : 8, height: 8, borderRadius: 4,
                  backgroundColor: i === passo ? theme.accent : theme.backgroundTertiary,
                }} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom buttons */}
      {!submitted && (
        <View style={{
          position: "absolute", bottom: 32, left: 20, right: 20, gap: 12,
        }}>
          {passo < 2 ? (
            <Pressable
              onPress={() => setPasso((p) => Math.min(p + 1, 2))}
              style={{
                backgroundColor: theme.accent, borderRadius: 20, paddingVertical: 18,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                Continuar
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={submitFeedback}
              disabled={loading || !sentirScore}
              style={{
                backgroundColor: sentirScore ? theme.accent : theme.backgroundTertiary,
                borderRadius: 20, paddingVertical: 18, alignItems: "center",
                flexDirection: "row", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name={isPremium ? "sparkles" : "checkmark-circle"} size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                    {isPremium ? "Gerar Insight IA" : "Guardar Feedback"}
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {!isPremium && passo === 2 && (
            <Pressable
              onPress={() => router.replace("/upgrade")}
              style={{ paddingVertical: 8, alignItems: "center" }}
            >
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>
                💪 Remove limitações com o Pro
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
