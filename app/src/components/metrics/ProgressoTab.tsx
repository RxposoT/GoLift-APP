import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WeekProgress {
  weekWorkouts: number;
  targetWorkouts: number;
  percentage: number;
}

interface WeightProgress {
  percentage: number;
  difference: number;
  direction: "down" | "up" | "none";
  message: string;
}

interface Stats {
  totalWorkouts: number;
  totalTime: number;
  avgDuration: number;
  thisMonth: number;
}

interface ProgressoTabProps {
  theme: any;
  weekProgress: WeekProgress;
  stats: Stats;
  profile: any;
  weightProg: WeightProgress | null;
  weightHistory: Array<{ week: string; weight: number }>;
  weeklyBarData: { label: string; count: number }[];
  formatTime: (seconds: number) => string;
  openGoalEdit: () => void;
  saveCurrentWeekWeight: () => void;
}

export default function ProgressoTab({
  theme, weekProgress, stats, profile, weightProg,
  weightHistory, weeklyBarData, formatTime,
  openGoalEdit, saveCurrentWeekWeight,
}: ProgressoTabProps) {
  return (
    <View>
      {/* ── Hero — Meta Semanal ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
        <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                META SEMANAL
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
                <Text style={{ color: "#fff", fontSize: 52, fontWeight: "800", letterSpacing: -2, lineHeight: 56 }}>
                  {weekProgress.weekWorkouts}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 28, fontWeight: "700", letterSpacing: -1, marginBottom: 6, marginLeft: 4 }}>
                  /{weekProgress.targetWorkouts}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                treino{weekProgress.weekWorkouts !== 1 ? "s" : ""} esta semana
              </Text>
            </View>
            <TouchableOpacity
              onPress={openGoalEdit}
              accessibilityLabel="Editar meta semanal"
              accessibilityRole="button"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10, marginTop: 2 }}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Barra de progresso */}
          <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2, marginBottom: 10 }}>
            <View style={{
              height: 4,
              width: `${Math.min(weekProgress.percentage, 100)}%` as any,
              backgroundColor: weekProgress.percentage >= 100 ? "#30D158" : "#fff",
              borderRadius: 2,
            }} />
          </View>

          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>
            {weekProgress.percentage >= 100
              ? "✓ Meta atingida esta semana!"
              : `${weekProgress.targetWorkouts - weekProgress.weekWorkouts} treino${weekProgress.targetWorkouts - weekProgress.weekWorkouts !== 1 ? "s" : ""} para a meta`}
          </Text>
        </View>
      </View>

      {/* ── Stats grid 2×2 ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Total
            </Text>
            <Text style={{ color: theme.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>treinos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Este Mês
            </Text>
            <Text style={{ color: theme.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
              {stats.thisMonth}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>treinos</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Tempo Total
            </Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
              {formatTime(stats.totalTime)}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>acumulado</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Duração Média
            </Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
              {stats.avgDuration ? formatTime(stats.avgDuration) : "—"}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>por treino</Text>
          </View>
        </View>

        {/* Objetivo de Peso */}
        {!!profile?.peso && !!profile?.pesoAlvo && !!weightProg && (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  OBJETIVO DE PESO
                </Text>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 }}>
                  {profile.peso}
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: "600" }}>kg</Text>
                  {"  →  "}
                  {profile.pesoAlvo}
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: "600" }}>kg</Text>
                </Text>
              </View>
              <View style={{
                backgroundColor: weightProg.direction === "down" ? "#FF3B30" + "18" : theme.accentGreen + "18",
                borderRadius: 10, padding: 8,
              }}>
                <Ionicons
                  name={weightProg.direction === "down" ? "trending-down" : "trending-up"}
                  size={20}
                  color={weightProg.direction === "down" ? "#FF3B30" : theme.accentGreen}
                />
              </View>
            </View>
            <View style={{ height: 4, backgroundColor: theme.backgroundTertiary, borderRadius: 2 }}>
              <View style={{ height: 4, width: `${Math.min(weightProg.percentage, 100)}%` as any, backgroundColor: theme.accentGreen, borderRadius: 2 }} />
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 10 }}>{weightProg.message}</Text>

            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Atualização Semanal
                </Text>
                <Pressable
                  onPress={saveCurrentWeekWeight}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar peso desta semana"
                  style={({ pressed }) => ({
                    backgroundColor: theme.accent + "18",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>Atualizar semana</Text>
                </Pressable>
              </View>

              {weightHistory.length >= 2 ? (
                <View>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 72 }}>
                    {(() => {
                      const maxWeight = Math.max(...weightHistory.map((w) => w.weight));
                      const minWeight = Math.min(...weightHistory.map((w) => w.weight));
                      const range = Math.max(maxWeight - minWeight, 1);
                      return weightHistory.map((item, idx) => {
                        const h = Math.max(10, ((item.weight - minWeight) / range) * 56 + 10);
                        const isLast = idx === weightHistory.length - 1;
                        return (
                          <View key={item.week} style={{ flex: 1, alignItems: "center" }}>
                            <View style={{ width: "100%", height: h, borderRadius: 6, backgroundColor: isLast ? theme.accent : theme.accent + "55" }} />
                          </View>
                        );
                      });
                    })()}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                      {new Date(weightHistory[0].week).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                      Atual: {weightHistory[weightHistory.length - 1].weight}kg
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Regista o peso semanal para acompanhar a evolução visual.
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Atividade Semanal (bar chart) ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Atividade por Semana
        </Text>
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
          {(() => {
            const maxCount = Math.max(...weeklyBarData.map(w => w.count), 1);
            return (
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80, gap: 4 }}>
                {weeklyBarData.map((week, i) => {
                  const isCurrentWeek = i === weeklyBarData.length - 1;
                  const pct = week.count / maxCount;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                      <View style={{
                        width: "100%",
                        height: Math.max(4, pct * 60),
                        borderRadius: 4,
                        backgroundColor: isCurrentWeek
                          ? theme.accent
                          : week.count > 0
                            ? theme.accent + "55"
                            : theme.backgroundTertiary,
                      }} />
                      <Text style={{ color: isCurrentWeek ? theme.accent : theme.textTertiary, fontSize: 9, fontWeight: isCurrentWeek ? "700" : "500" }}>
                        {week.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>Treinos por semana</Text>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>
              Esta semana: {weeklyBarData[weeklyBarData.length - 1]?.count ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
