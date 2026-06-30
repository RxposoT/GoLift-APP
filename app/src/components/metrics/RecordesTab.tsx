import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface RecordesTabProps {
  theme: any;
  records: any[];
  formatDate: (dateString: string) => string;
}

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32"];

export default function RecordesTab({ theme, records, formatDate }: RecordesTabProps) {
  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Recordes Pessoais
      </Text>

      {records.length === 0 ? (
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, paddingVertical: 36, alignItems: "center" }}>
          <Ionicons name="medal" size={40} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
            Ainda não tens recordes registados
          </Text>
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          {/* Agrupar recordes por exercício */}
          {Object.entries(
            records.reduce((acc: any, rec: any) => {
              const nome = rec.nome_exercicio || rec.exercicio || rec.exercise || "";
              if (!acc[nome]) acc[nome] = [];
              acc[nome].push(rec);
              return acc;
            }, {})
          ).map(([nome, recs]) => {
            const sorted = [...(recs as any[])].sort((a, b) => (b.peso || b.weight) - (a.peso || a.weight));
            return (
              <View key={nome} style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, marginBottom: 8 }}>{nome}</Text>
                {/* Ranking dos recordes */}
                <View style={{ gap: 12 }}>
                  {sorted.map((record, idx) => {
                    const color = MEDAL_COLORS[idx] ?? theme.textSecondary;
                    const exercicioId = record.id_exercicio || record.exercicio_id;
                    return (
                      <Pressable
                        key={record.id_serie || record.id || idx}
                        onPress={() => {
                          if (exercicioId) {
                            router.push({ pathname: "/exercise-progress/[id]", params: { id: String(exercicioId), nome } });
                          }
                        }}
                        accessibilityLabel={`Ver progressão de ${nome}`}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: theme.backgroundSecondary,
                          borderRadius: 14,
                          paddingHorizontal: 18,
                          paddingVertical: 17,
                          opacity: pressed ? 0.6 : 1,
                        })}
                      >
                        {/* Medal Icon for top 3 */}
                        <View style={{ width: 26, alignItems: "center", marginRight: 16 }}>
                          {idx < 3 ? (
                            <Ionicons name="medal" size={22} color={color} />
                          ) : null}
                        </View>
                        {/* Date */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 17, fontWeight: "500", letterSpacing: -0.3 }} numberOfLines={1}>
                            {record.peso || record.weight} kg
                          </Text>
                          {(record.data_serie || record.data) && (
                            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                              {formatDate(record.data_serie || record.data)}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
