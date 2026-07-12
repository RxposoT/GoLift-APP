import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { userApi } from "../services/api";
import { Text, Button, Card, Input } from "../components/ui";
import * as Haptics from "expo-haptics";
import { spacing, radius as R, iconSize } from "../styles/tokens";

export default function EditProfile() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop, safeBottom } = useAndroidInsets();
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
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: safeBottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 24 }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: R.lg,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              marginRight: 14, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text variant="title2" style={{ flex: 1, letterSpacing: -0.5 }}>
            Editar Perfil
          </Text>
        </View>

        {/* Form Card */}
        <View style={{ paddingHorizontal: 24 }}>
          <Card padding={spacing.xl} style={{ marginBottom: 28 }}>
            <Input
              leftIcon="person-outline"
              label="Nome"
              placeholder="O teu nome"
              value={nome}
              onChangeText={setNome}
              containerStyle={{ marginBottom: spacing.lg }}
            />
            <Input
              leftIcon="calendar-outline"
              label="Idade"
              placeholder="Ex: 25"
              value={idade}
              onChangeText={setIdade}
              keyboardType="numeric"
              containerStyle={{ marginBottom: spacing.lg }}
            />
            <Input
              leftIcon="scale-outline"
              label="Peso (kg)"
              placeholder="Ex: 70"
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              containerStyle={{ marginBottom: spacing.lg }}
            />
            <Input
              leftIcon="resize-outline"
              label="Altura (cm)"
              placeholder="Ex: 175"
              value={altura}
              onChangeText={setAltura}
              keyboardType="decimal-pad"
              containerStyle={{ marginBottom: spacing.sm }}
            />
          </Card>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Button
              variant="secondary"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="lg"
              style={{ flex: 2 }}
              loading={saving}
              onPress={handleSave}
            >
              Guardar
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
