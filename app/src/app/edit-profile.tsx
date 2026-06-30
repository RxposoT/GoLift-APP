import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { userApi } from "../services/api";
import * as Haptics from "expo-haptics";

export default function EditProfile() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!user?.id) return;

    try {
      const profile = await userApi.getProfile(user.id);
      if (profile) {
        setNome(profile.nome || "");
        setIdade(profile.idade?.toString() || "");
        setPeso(profile.peso?.toString() || "");
        setAltura(profile.altura?.toString() || "");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setNome(user.nome || "");
      setIdade(user.idade?.toString() || "");
      setPeso(user.peso?.toString() || "");
      setAltura(user.altura?.toString() || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      await userApi.updateProfile(user!.id, {
        nome: nome.trim(),
        idade: idade ? parseInt(idade) : null,
        peso: peso ? parseFloat(peso) : null,
        altura: altura ? parseFloat(altura) : null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 24 }}>
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
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, flex: 1, letterSpacing: -0.5 }}>
            Editar Perfil
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
              Nome
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="O teu nome"
                placeholderTextColor={theme.textTertiary}
                value={nome}
                onChangeText={setNome}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
              Idade
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="Ex: 25"
                placeholderTextColor={theme.textTertiary}
                value={idade}
                onChangeText={setIdade}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
              Peso (kg)
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="scale-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="Ex: 70"
                placeholderTextColor={theme.textTertiary}
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
              Altura (cm)
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14,
              paddingHorizontal: 16,
            }}>
              <Ionicons name="resize-outline" size={18} color={theme.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                }}
                placeholder="Ex: 175"
                placeholderTextColor={theme.textTertiary}
                value={altura}
                onChangeText={setAltura}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: theme.backgroundSecondary,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: theme.text, fontWeight: "600" }}>
                Cancelar
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Guardar alterações"
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: theme.accent,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                opacity: pressed || saving ? 0.8 : 1,
              })}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Guardar
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
