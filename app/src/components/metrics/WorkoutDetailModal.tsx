import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutDetailModalProps {
  theme: any;
  visible: boolean;
  onClose: () => void;
  selectedDayWorkout: any;
  workoutDetails: any;
  loadingDetails: boolean;
  formatTime: (seconds: number) => string;
  formatDateTime: (dateString: string) => string;
  panHandlers: any;
  safeBottom: number;
}

export default function WorkoutDetailModal({
  theme, visible, onClose, selectedDayWorkout, workoutDetails,
  loadingDetails, formatTime, formatDateTime, panHandlers, safeBottom,
}: WorkoutDetailModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableOpacity
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" }}>
          {/* Handle */}
          <View {...panHandlers} style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />

          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
                {workoutDetails?.nome_treino || selectedDayWorkout?.nome_treino || selectedDayWorkout?.nome || "Treino"}
              </Text>
              {(workoutDetails?.data_inicio || selectedDayWorkout?.data_inicio || selectedDayWorkout?.data) && (
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                  {formatDateTime(workoutDetails?.data_inicio || selectedDayWorkout?.data_inicio || selectedDayWorkout?.data)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 12, padding: 8, marginLeft: 12 }}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Duração destaque */}
          {(workoutDetails?.duracao_segundos || selectedDayWorkout?.duracao_segundos) && (
            <View style={{ marginHorizontal: 24, marginBottom: 16, backgroundColor: theme.accent, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="timer" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 8 }}>
                {formatTime(workoutDetails?.duracao_segundos || selectedDayWorkout?.duracao_segundos)}
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}>
            {loadingDetails && (
              <View style={{ justifyContent: "center", alignItems: "center", padding: 24 }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>A carregar...</Text>
              </View>
            )}

            {workoutDetails?.exercicios && workoutDetails.exercicios.length > 0 ?
              workoutDetails.exercicios.map((ex: any, index: number) => (
                <View key={index} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, letterSpacing: -0.2, marginBottom: 4 }}>
                    {ex.nome_exercicio || `Exercício ${index + 1}`}
                  </Text>
                  {ex.grupo_tipo && (
                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
                      {ex.grupo_tipo}{ex.sub_tipo ? ` · ${ex.sub_tipo}` : ""}
                    </Text>
                  )}
                  {ex.series && ex.series.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      {ex.series.map((serie: any, serieIdx: number) => (
                        <View key={serieIdx} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundTertiary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{serie.numero_serie}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", gap: 20 }}>
                            {!!serie.repeticoes && (
                              <View>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: "700", letterSpacing: 0.5 }}>REPS</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{serie.repeticoes}</Text>
                              </View>
                            )}
                            {!!serie.peso && (
                              <View>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: "700", letterSpacing: 0.5 }}>PESO</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.accentGreen }}>{serie.peso}kg</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: "italic" }}>Nenhuma série registada</Text>
                  )}
                </View>
              ))
            : selectedDayWorkout?.exercicios?.length > 0 ?
              selectedDayWorkout.exercicios.map((ex: any, index: number) => (
                <View key={index} style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{ex.nome || ex.exercicio || `Exercício ${index + 1}`}</Text>
                </View>
              ))
            : !loadingDetails ? (
              <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14 }}>Nenhum dado disponível</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
