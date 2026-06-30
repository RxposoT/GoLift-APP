import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";

interface HistoryEntry {
  peso: number;
  repeticoes: number;
  data_serie: string;
}

const CHART_H = 180;
const PAD = { left: 40, right: 20, top: 16, bottom: 36 };

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function LineChart({
  data,
  accent,
  bg,
  textSecondary,
}: {
  data: HistoryEntry[];
  accent: string;
  bg: string;
  textSecondary: string;
}) {
  const screenWidth = Dimensions.get("window").width;
  const chartW = screenWidth - 80;
  const plotW = chartW - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const weights = data.map((e) => e.peso);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const pts = data.map((entry, i) => ({
    x: PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    y: PAD.top + plotH - ((entry.peso - minW) / range) * plotH,
    entry,
  }));

  const segments = pts.slice(0, -1).map((p1, i) => {
    const p2 = pts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Position at the midpoint so rotation around center = rotation around p1..p2 axis
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    return { midX, midY, length, angle };
  });

  const yLabels = [minW, minW + range / 2, maxW];

  return (
    <View style={{ height: CHART_H, width: chartW }}>
      {yLabels.map((val, i) => {
        const y = PAD.top + plotH - ((val - minW) / range) * plotH;
        return (
          <View key={i} style={{ position: "absolute", left: 0, top: y, width: chartW, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ width: PAD.left - 8, textAlign: "right", color: textSecondary, fontSize: 10, fontWeight: "600" }}>
              {Math.round(val)}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: bg }} />
          </View>
        );
      })}

      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: s.midX - s.length / 2,
            top: s.midY - 1.5,
            width: s.length,
            height: 3,
            backgroundColor: accent,
            borderRadius: 2,
            transform: [{ rotate: `${s.angle}deg` }],
          }}
        />
      ))}

      {pts.map((p, i) => (
        <View key={i}>
          <View
            style={{
              position: "absolute",
              left: p.x - 5, top: p.y - 5,
              width: 10, height: 10,
              borderRadius: 5,
              backgroundColor: accent,
              borderWidth: 2, borderColor: "white",
            }}
          />
          {(i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1) && (
            <Text
              style={{
                position: "absolute",
                left: p.x - 22,
                top: PAD.top + plotH + 8,
                width: 44, textAlign: "center",
                color: textSecondary, fontSize: 10, fontWeight: "600",
              }}
            >
              {formatDate(p.entry.data_serie)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export default function ExerciseProgress() {
  const theme = useTheme();
  const { paddingTop } = useAndroidInsets();
  const { id, nome } = useLocalSearchParams<{ id: string; nome?: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function load() {
    setError(false);
    setLoading(true);
    metricsApi
      .getExerciseHistory(user!.id, Number(id))
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.data_serie).getTime() - new Date(b.data_serie).getTime()
        );
        setHistory(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.id && id) load();
  }, [user, id]);

  const exerciseName = nome || `Exercício #${id}`;
  const maxPeso = history.length > 0 ? Math.max(...history.map((e) => e.peso)) : 0;
  const lastEntry = history[history.length - 1];
  const firstEntry = history[0];
  const progress = history.length > 1 ? lastEntry.peso - firstEntry.peso : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: paddingTop + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.backgroundTertiary,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: theme.backgroundSecondary,
            alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.4 }} numberOfLines={1}>
            {exerciseName}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 1 }}>
            Progressão
          </Text>
        </View>

        {progress !== 0 && (
          <View
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
              backgroundColor: progress > 0 ? "#30D15820" : "#FF453A20",
            }}
          >
            <Text style={{ color: progress > 0 ? "#30D158" : "#FF453A", fontWeight: "700", fontSize: 13 }}>
              {progress > 0 ? "+" : ""}{progress.toFixed(1)} kg
            </Text>
          </View>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSecondary, marginTop: 14, fontSize: 14 }}>A carregar…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 12 }}>
            Não foi possível carregar os dados
          </Text>
          <Pressable
            onPress={load}
            accessibilityLabel="Tentar novamente"
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 20, backgroundColor: theme.accent,
              paddingHorizontal: 24, paddingVertical: 12,
              borderRadius: 14, opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : history.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: "600", textAlign: "center", marginTop: 12 }}>
            Ainda não há registos para este exercício
          </Text>
          <Text style={{ color: theme.textTertiary, fontSize: 14, textAlign: "center", marginTop: 6 }}>
            Completa um treino com {exerciseName} para ver o teu progresso
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Máximo", value: `${maxPeso} kg`, icon: "trophy" as const, color: "#FFD60A" },
              { label: "Sessões", value: String(history.length), icon: "calendar" as const, color: theme.accent },
              { label: "Último", value: lastEntry ? `${lastEntry.peso} kg` : "—", icon: "time-outline" as const, color: "#30D158" },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1, backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16, padding: 14,
                  alignItems: "center", gap: 4,
                }}
              >
                <Ionicons name={stat.icon} size={20} color={stat.color} />
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.4 }}>
                  {stat.value}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "600" }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Line chart */}
          {history.length > 1 && (
            <View
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20, padding: 16, marginBottom: 24,
              }}
            >
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, marginBottom: 12 }}>
                Evolução do Peso
              </Text>
              <LineChart
                data={history}
                accent={theme.accent}
                bg={theme.backgroundTertiary}
                textSecondary={theme.textSecondary}
              />
            </View>
          )}

          {/* Session list */}
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
            Histórico
          </Text>
          <View style={{ gap: 10 }}>
            {[...history].reverse().map((entry, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
                  flexDirection: "row", alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: theme.backgroundTertiary,
                    alignItems: "center", justifyContent: "center", marginRight: 14,
                  }}
                >
                  <Ionicons name="barbell" size={18} color={theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
                    {entry.peso} kg
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {entry.repeticoes} rep · {formatDate(entry.data_serie)}
                  </Text>
                </View>
                {index === 0 && (
                  <View style={{ backgroundColor: "#30D15820", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: "#30D158", fontSize: 11, fontWeight: "700" }}>ÚLTIMO</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
