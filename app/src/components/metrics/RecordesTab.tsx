import React, { useState } from "react";
import { View, Pressable, Modal, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { metricsApi } from "../../services/api";
import { Text, Card, Button } from "../ui";
import { spacing, radius } from "../../styles/tokens";

interface RecordesTabProps {
  theme: any;
  records: any[];
  formatDate: (dateString: string) => string;
  userId: string;
}

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32"];

export default function RecordesTab({ theme, records, formatDate, userId }: RecordesTabProps) {
  const [selectedEx, setSelectedEx] = useState<{ id: number; nome: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Group records by exercise to find top weights
  const exercisesGrouped = React.useMemo(() => {
    return Object.entries(
      records.reduce((acc: any, rec: any) => {
        const nome = rec.nome_exercicio || rec.exercicio || rec.exercise || "";
        if (!acc[nome]) acc[nome] = [];
        acc[nome].push(rec);
        return acc;
      }, {})
    ).map(([nome, recs]) => {
      const sorted = [...(recs as any[])].sort((a, b) => (b.peso || b.weight) - (a.peso || a.weight));
      // Max record
      const best = sorted[0];
      return {
        nome,
        id_exercicio: best.id_exercicio || best.exercicio_id,
        peso: best.peso || best.weight,
        data: best.data_serie || best.data,
      };
    }).sort((a, b) => b.peso - a.peso);
  }, [records]);

  async function handleExerciseClick(id_exercicio: number, nome: string) {
    if (!id_exercicio) return;
    setSelectedEx({ id: id_exercicio, nome });
    setShowModal(true);
    setLoadingHistory(true);
    try {
      const data = await metricsApi.getExerciseHistory(userId, id_exercicio);
      // Group by date or keep all points sorted
      const sortedData = [...(data || [])].sort(
        (a, b) => new Date(a.data_serie).getTime() - new Date(b.data_serie).getTime()
      );
      setHistory(sortedData);
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Draw custom Svg Line Chart
  const chartWidth = 280;
  const chartHeight = 140;
  const paddingLeft = 35;
  const paddingTop = 15;
  const plotWidth = chartWidth - paddingLeft - 10;
  const plotHeight = chartHeight - paddingTop - 25;

  const chartPoints = React.useMemo(() => {
    if (history.length === 0) return [];
    
    // Find unique dates or aggregate maximum weight per date to avoid duplicates at same X
    const aggregatedMap = new Map<string, number>();
    history.forEach(h => {
      const dateStr = formatDate(h.data_serie);
      const current = aggregatedMap.get(dateStr) || 0;
      if (h.peso > current) {
        aggregatedMap.set(dateStr, h.peso);
      }
    });

    const list = Array.from(aggregatedMap.entries()).map(([dateLabel, peso]) => ({
      dateLabel,
      peso,
    }));

    // limit to 7 points for readable chart space
    const subset = list.slice(-6);

    const weights = subset.map(s => s.peso);
    const maxWeight = Math.max(...weights, 10);
    const minWeight = Math.min(...weights, 0);
    
    const range = maxWeight - minWeight || 10;
    const yMin = minWeight - range * 0.1 > 0 ? Math.floor(minWeight - range * 0.1) : 0;
    const yMax = Math.ceil(maxWeight + range * 0.1);
    const yRange = yMax - yMin;

    const points = subset.map((s, idx) => {
      const x = paddingLeft + (idx * plotWidth) / (subset.length - 1 || 1);
      const y = paddingTop + plotHeight - ((s.peso - yMin) / yRange) * plotHeight;
      return { x, y, weight: s.peso, label: s.dateLabel };
    });

    return { points, yMin, yMax };
  }, [history]);

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Recordes Pessoais
      </Text>

      {exercisesGrouped.length === 0 ? (
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, paddingVertical: 36, alignItems: "center" }}>
          <Ionicons name="medal" size={40} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
            Ainda não tens recordes registados
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {exercisesGrouped.map((ex, idx) => {
            const medalColor = MEDAL_COLORS[idx] ?? theme.textSecondary;
            return (
              <Card
                key={ex.nome}
                onPress={() => handleExerciseClick(ex.id_exercicio, ex.nome)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderWidth: 2,
                  borderColor: theme.backgroundTertiary,
                }}
              >
                {/* Achievement Badge */}
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: idx < 3 ? medalColor + "18" : theme.backgroundTertiary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}>
                  <Ionicons
                    name={idx < 3 ? "trophy" : "medal-outline"}
                    size={22}
                    color={idx < 3 ? medalColor : theme.textSecondary}
                  />
                </View>

                {/* Ex info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
                    {ex.nome}
                  </Text>
                  {ex.data && (
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                      Superado a {formatDate(ex.data)}
                    </Text>
                  )}
                </View>

                {/* Record display */}
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.accent, fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }}>
                    {ex.peso} kg
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 10, marginTop: 2, fontWeight: "600" }}>
                    RECORD
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Modal - Histórico de Recorde com Gráfico Vetorial */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}>
          <View style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 8,
            paddingBottom: 36,
            maxHeight: "85%",
          }}>
            {/* Drag indicator */}
            <View style={{
              width: 40,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: theme.backgroundTertiary,
              alignSelf: "center",
              marginBottom: 20,
            }} />

            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 16 }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.accent, letterSpacing: 1, textTransform: "uppercase" }}>
                  Histórico de Recordes
                </Text>
                <Text variant="title2" style={{ fontSize: 20, marginTop: 2 }}>
                  {selectedEx?.nome}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: theme.backgroundTertiary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {loadingHistory ? (
              <View style={{ height: 260, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            ) : (
              <ScrollView style={{ paddingHorizontal: 24 }}>
                {history.length === 0 ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text color="textSecondary">Sem histórico disponível.</Text>
                  </View>
                ) : (
                  <>
                    {/* SVG Line Chart */}
                    <View style={{
                      backgroundColor: theme.backgroundSecondary,
                      borderRadius: 20,
                      padding: 16,
                      borderWidth: 2,
                      borderColor: theme.backgroundTertiary,
                      alignItems: "center",
                      marginBottom: 24,
                    }}>
                      {chartPoints.points && chartPoints.points.length > 1 ? (
                        <View style={{ width: chartWidth, height: chartHeight }}>
                          <Svg width={chartWidth} height={chartHeight}>
                            {/* Grid Lines */}
                            {[0, 0.5, 1].map((r, idx) => {
                              const y = paddingTop + r * plotHeight;
                              const val = Math.round(chartPoints.yMax - r * (chartPoints.yMax - chartPoints.yMin));
                              return (
                                <React.Fragment key={idx}>
                                  <Line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={chartWidth - 10}
                                    y2={y}
                                    stroke={theme.backgroundTertiary}
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                  />
                                  <SvgText
                                    x={paddingLeft - 8}
                                    y={y + 4}
                                    fill={theme.textTertiary}
                                    fontSize={9}
                                    fontWeight="bold"
                                    textAnchor="end"
                                  >
                                    {val}k
                                  </SvgText>
                                </React.Fragment>
                              );
                            })}

                            {/* Draw continuous line */}
                            <Path
                              d={chartPoints.points.reduce((pathStr, p, idx) => {
                                return idx === 0 ? `M ${p.x} ${p.y}` : `${pathStr} L ${p.x} ${p.y}`;
                              }, "")}
                              fill="none"
                              stroke={theme.accent}
                              strokeWidth={3}
                            />

                            {/* Circular Markers */}
                            {chartPoints.points.map((p, idx) => (
                              <React.Fragment key={idx}>
                                <Circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={5}
                                  fill={theme.accent}
                                  stroke={theme.background}
                                  strokeWidth={2}
                                />
                                <SvgText
                                  x={p.x}
                                  y={chartHeight - 6}
                                  fill={theme.textSecondary}
                                  fontSize={9}
                                  textAnchor="middle"
                                >
                                  {p.label}
                                </SvgText>
                              </React.Fragment>
                            ))}
                          </Svg>
                        </View>
                      ) : (
                        <View style={{ height: chartHeight, justifyContent: "center" }}>
                          <Text variant="footnote" color="textTertiary">
                            Séries registadas adicionais são necessárias para gerar o progresso.
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Progress details list */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
                      Histórico de Cargas
                    </Text>
                    <View style={{ gap: 8 }}>
                      {[...history].reverse().map((h, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: theme.backgroundSecondary,
                            borderRadius: 12,
                            padding: 14,
                            borderWidth: 1,
                            borderColor: theme.backgroundTertiary,
                          }}
                        >
                          <View>
                            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>
                              {h.peso} kg
                            </Text>
                            <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 2 }}>
                              {h.repeticoes} repetições
                            </Text>
                          </View>
                          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                            {formatDate(h.data_serie)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
