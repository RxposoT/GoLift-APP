import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../styles/theme";
import { useCommunities } from "../../contexts/CommunitiesContext";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

export default function WorkoutSummary() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const params = useLocalSearchParams();
  const { userCommunities, sendMessage } = useCommunities();

  const nome = (params.nome as string) ?? "Treino";
  const duracao = Number(params.duracao ?? 0);
  const totalSeries = Number(params.totalSeries ?? 0);
  const volume = Number(params.volume ?? 0);
  const exerciciosRaw = (params.exercicios as string) ?? "[]";

  let exerciciosData: Array<{ nome: string; series: Array<{ reps: number; peso: number }> }> = [];
  try {
    exerciciosData = JSON.parse(exerciciosRaw);
  } catch {
    exerciciosData = [];
  }

  const [showShare, setShowShare] = useState(false);
  const [sharing, setSharing] = useState(false);

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleShare(community: any) {
    if (sharing) return;
    setSharing(true);
    try {
      const payload = JSON.stringify({
        tipo: "resultado",
        nome,
        duracao,
        exercicios: exerciciosData,
      });
      await sendMessage(community.id, `\u{1F3CB}\uFE0F__SHARE__${payload}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowShare(false);
      router.replace("/");
    } catch {
      setShowShare(false);
      router.replace("/");
      setSharing(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero ── */}
        <View style={{ alignItems: "center", paddingTop: safeTop + 24, paddingBottom: 36, paddingHorizontal: 24 }}>
          {/* Checkmark circle */}
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#30D158",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            shadowColor: "#30D158",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 12,
          }}>
            <Ionicons name="checkmark" size={52} color="#fff" />
          </View>

          <Text style={{ color: theme.text, fontSize: 30, fontWeight: "800", letterSpacing: -1, textAlign: "center" }}>
            Treino Concluído!
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 6, textAlign: "center" }}>
            {nome}
          </Text>
        </View>

        {/* ── Stats ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Duração */}
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Duração
              </Text>
              <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
                {formatTime(duracao)}
              </Text>
            </View>
            {/* Séries */}
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 20, alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Séries
              </Text>
              <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
                {totalSeries}
              </Text>
            </View>
          </View>

          {volume > 0 && (
            <View style={{ marginTop: 12, backgroundColor: theme.accent, borderRadius: 20, padding: 20 }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Volume Total
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: "#fff", fontSize: 42, fontWeight: "800", letterSpacing: -1.5, lineHeight: 44 }}>
                  {volume >= 1000 ? `${(volume / 1000).toFixed(1)}` : volume}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
                  {volume >= 1000 ? "t" : "kg"}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4 }}>
                levantados nesta sessão
              </Text>
            </View>
          )}
        </View>

        {/* ── Exercícios resumo ── */}
        {exerciciosData.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              Exercícios Realizados
            </Text>
            {exerciciosData.map((ex, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16,
                  marginBottom: 8,
                  overflow: "hidden",
                  flexDirection: "row",
                }}
              >
                <View style={{ width: 4, backgroundColor: "#30D158" }} />
                <View style={{ flex: 1, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{ex.nome}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                    {ex.series.length} série{ex.series.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── CTA buttons ── */}
      <View style={{ position: "absolute", bottom: 32, left: 20, right: 20, gap: 12 }}>
        {userCommunities.length > 0 && (
          <Pressable
            onPress={() => setShowShare(true)}
            accessibilityLabel="Partilhar resultados"
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="share-outline" size={20} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
              Partilhar na Comunidade
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.replace("/")}
          accessibilityLabel="Fechar e ir para a home"
          accessibilityRole="button"
          style={({ pressed }) => ({
            backgroundColor: theme.accent,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: pressed ? 0.85 : 1,
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 8,
          })}
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
            Ir para a Home
          </Text>
        </Pressable>
      </View>

      {/* ── Share bottom sheet ── */}
      {showShare && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "70%" }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />

            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.6, paddingHorizontal: 24, marginBottom: 6 }}>
              Partilhar Resultados
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, paddingHorizontal: 24, marginBottom: 20, lineHeight: 20 }}>
              Escolhe uma comunidade para partilhar o teu treino
            </Text>

            <FlatList
              data={userCommunities}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleShare(item)}
                  disabled={sharing}
                  accessibilityLabel={`Partilhar com ${item.nome}`}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: 16,
                    padding: 14,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.accent + "18", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                    <Ionicons name="people" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>{item.nome}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{item.membros} membros</Text>
                  </View>
                  {sharing ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Ionicons name="send" size={18} color={theme.accent} />
                  )}
                </Pressable>
              )}
            />

            <View style={{ paddingHorizontal: 24, paddingBottom: 36, paddingTop: 8 }}>
              <Pressable
                onPress={() => setShowShare(false)}
                accessibilityLabel="Cancelar partilha"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: theme.backgroundTertiary,
                })}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 15 }}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
