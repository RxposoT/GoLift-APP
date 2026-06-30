import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userApi, metricsApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { getIMCCategory } from "../../utils/imc";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

export default function UserProfile() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { id, nome: nomeParam } = useLocalSearchParams<{ id: string; nome?: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");

  useEffect(() => {
    if (id) loadProfile();
  }, [id]);

  async function loadProfile() {
    setLoading(true);
    try {
      const [profileData, recordsData] = await Promise.all([
        userApi.getProfile(id).catch(() => null),
        metricsApi.getRecords(id).catch(() => []),
      ]);
      planoApi.getUserPlan(id).then(d => setPlanoTipo(d.plano as "free" | "pago")).catch(() => {});
      const u = profileData?.user || profileData;
      setProfile({
        id: Number(id),
        nome: u?.name || u?.nome || nomeParam || "Utilizador",
        email: u?.email,
        idade: u?.age ?? u?.idade,
        peso: u?.weight ?? u?.peso,
        altura: u?.height ?? u?.altura,
        objetivo: u?.objetivo,
      });
      setRecords(recordsData || []);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setProfile({ id: Number(id), nome: nomeParam || "Utilizador" });
    } finally {
      setLoading(false);
    }
  }

  function calculateIMC(peso: number, altura: number) {
    if (!peso || !altura) return null;
    return (peso / Math.pow(altura / 100, 2)).toFixed(1);
  }

  const imc = calculateIMC(profile?.peso, profile?.altura);
  const imcCategory = imc ? getIMCCategory(parseFloat(imc)) : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: safeTop + 16,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center", alignItems: "center",
            marginRight: 14, opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>
          {loading ? "Perfil" : profile?.nome || "Perfil"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar + nome */}
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 26,
                backgroundColor: theme.backgroundSecondary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: planoTipo === "pago" ? "#f59e0b" : theme.accent, fontSize: 40, fontWeight: "800" }}>
                {(profile?.nome || "?")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }}>
              {profile?.nome}
            </Text>
            {planoTipo === "pago" ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, backgroundColor: "#f59e0b18", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                <Ionicons name="star" size={13} color="#f59e0b" style={{ marginRight: 5 }} />
                <Text style={{ color: "#f59e0b", fontWeight: "700", fontSize: 13 }}>GoLift Pro</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ color: theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Free</Text>
              </View>
            )}
          </View>

          {/* Dados físicos */}
          {(profile?.idade || profile?.peso || profile?.altura) && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}
              >
                Dados Fisicos
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {!!profile?.idade && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: (profile?.peso || profile?.altura) ? 0.5 : 0,
                      borderBottomColor: theme.backgroundTertiary,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="calendar" size={18} color={theme.accent} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Idade</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.idade} anos
                    </Text>
                  </View>
                )}
                {!!profile?.peso && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: profile?.altura ? 0.5 : 0,
                      borderBottomColor: theme.backgroundTertiary,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="scale" size={18} color={theme.accent} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Peso</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.peso} kg
                    </Text>
                  </View>
                )}
                {!!profile?.altura && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: theme.backgroundTertiary,
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="resize" size={18} color={theme.accent} />
                    </View>
                    <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>Altura</Text>
                    <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
                      {profile.altura} cm
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* IMC */}
          {imc && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="heart" size={18} color={theme.accent} />
                </View>
                <Text style={{ color: theme.textSecondary, flex: 1, fontSize: 14 }}>IMC</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>{imc}</Text>
                  {imcCategory && (
                    <Text style={{ color: imcCategory.color, fontSize: 11, marginTop: 2 }}>
                      {imcCategory.label}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Objetivo */}
          {!!profile?.objetivo && (
            <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}
              >
                Objetivo
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 20,
                  padding: 18,
                }}
              >
                <Text style={{ color: theme.text, fontSize: 14, lineHeight: 22 }}>
                  {profile.objetivo}
                </Text>
              </View>
            </View>
          )}

          {/* Recordes */}
          {records.length > 0 && (
            <View style={{ paddingHorizontal: 24 }}>
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase" }}
              >
                Melhores Recordes
              </Text>
              <View
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {records.slice(0, 3).map((record, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: index < Math.min(records.length, 3) - 1 ? 0.5 : 0,
                      borderBottomColor: theme.backgroundTertiary,
                    }}
                  >
                    <View style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: MEDAL_COLORS[index] + "22",
                      justifyContent: "center", alignItems: "center",
                      marginRight: 12,
                    }}>
                      <Ionicons name="trophy" size={16} color={MEDAL_COLORS[index]} />
                    </View>
                    <Text style={{ color: theme.text, flex: 1, fontSize: 14, fontWeight: "500" }}>
                      {record.nome_exercicio || record.exercicio || record.exercise}
                    </Text>
                    <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 14 }}>
                      {record.peso || record.weight} kg
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
