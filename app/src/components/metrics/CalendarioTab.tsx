import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface CalendarioTabProps {
  theme: any;
  currentMonth: Date;
  daysInMonth: (number | null)[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDayPress: (day: number | null) => void;
  isWorkoutDay: (day: number | null) => boolean;
  isToday: (day: number | null) => boolean;
}

export default function CalendarioTab({
  theme, currentMonth, daysInMonth,
  onPreviousMonth, onNextMonth, onDayPress,
  isWorkoutDay, isToday,
}: CalendarioTabProps) {
  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Calendário de Treinos
      </Text>

      <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
        {/* Navegação do mês */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <TouchableOpacity
            onPress={onPreviousMonth}
            accessibilityLabel="Mês anterior"
            accessibilityRole="button"
            style={{ padding: 8, borderRadius: 10, backgroundColor: theme.backgroundTertiary }}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.3 }}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={onNextMonth}
            accessibilityLabel="Próximo mês"
            accessibilityRole="button"
            style={{ padding: 8, borderRadius: 10, backgroundColor: theme.backgroundTertiary }}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Dias da semana */}
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {DAYS.map((day, index) => (
            <View key={index} style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
              <Text style={{ color: theme.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                {day.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Grid — renderizado por semana para alinhamento perfeito */}
        {Array.from({ length: Math.ceil(daysInMonth.length / 7) }, (_, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: "row" }}>
            {daysInMonth.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={{ flex: 1, height: 40, justifyContent: "center", alignItems: "center" }}
                onPress={() => onDayPress(day)}
                activeOpacity={isWorkoutDay(day) ? 0.7 : 1}
              >
                {day !== null && (() => {
                  const workout = isWorkoutDay(day);
                  const today = isToday(day);
                  
                  let bgColor = "transparent";
                  let borderColor = "transparent";
                  let textColor = theme.textSecondary;
                  let borderWidth = 0;
                  
                  if (workout) {
                    bgColor = theme.accentGreen || "#30D158";
                    textColor = "#fff";
                    if (today) {
                      borderColor = theme.accent;
                      borderWidth = 2;
                    }
                  } else if (today) {
                    borderColor = theme.border;
                    borderWidth = 2;
                    textColor = theme.accent;
                  }

                  return (
                    <View style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderWidth: borderWidth,
                    }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: today || workout ? "700" : "400",
                        color: textColor,
                      }}>
                        {day}
                      </Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Legenda */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, borderWidth: 1.5, borderColor: theme.border, backgroundColor: "transparent" }} />
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Hoje</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: theme.accentGreen || "#30D158" }} />
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Com treino</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
