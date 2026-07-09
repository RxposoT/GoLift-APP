import { useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Text, Button, Card, Input, SectionHeader, ListItem } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { userApi } from "../services/api";
import { spacing, radius } from "../styles/tokens";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Account() {
  const posthog = usePostHog();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const isAdmin = user?.tipo === 1;

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editIdade, setEditIdade] = useState("");
  const [editPeso, setEditPeso] = useState("");
  const [editAltura, setEditAltura] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  async function openEditModal() {
    setShowEditModal(true);
    setEditLoading(true);
    try {
      const res = await userApi.getProfile(user!.id);
      if (res?.user) {
        setEditNome(res.user.name || "");
        setEditIdade(res.user.age?.toString() || "");
        setEditPeso(res.user.weight?.toString() || "");
        setEditAltura(res.user.height?.toString() || "");
      }
    } catch {
      setEditNome(user?.nome || "");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!editNome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório.");
      return;
    }
    setEditSaving(true);
    try {
      await userApi.updateProfile(user!.id, {
        nome: editNome.trim(),
        idade: editIdade ? parseInt(editIdade) : null,
        peso: editPeso ? parseFloat(editPeso) : null,
        altura: editAltura ? parseFloat(editAltura) : null,
      });
      posthog.capture("profile_updated", {
        updated_age: Boolean(editIdade),
        updated_weight: Boolean(editPeso),
        updated_height: Boolean(editAltura),
      });
      posthog.identify(user!.id, {
        $set: {
          nome: editNome.trim(),
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
    } catch (error: any) {
      posthog.captureException(error as Error, {
        context: "profile_update",
      });
      Alert.alert("Erro", error.message || "Não foi possível guardar. Tenta novamente.");
    } finally {
      setEditSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert("Sair", "Tens a certeza que queres terminar a sessão?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: safeTop + 16, paddingBottom: spacing.lg, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: radius.lg,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              marginRight: spacing.lg, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text variant="title2" style={{ flex: 1 }}>
            Minha Conta
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xxl, paddingBottom: 60 }}>

          {/* ── User card ── */}
          <Card style={{ alignItems: "center", paddingTop: spacing.sm, paddingBottom: spacing.xxxl, marginBottom: spacing.sm }}>
            <View style={{
              width: 88, height: 88, borderRadius: radius.xxl,
              backgroundColor: theme.accent,
              justifyContent: "center", alignItems: "center",
              marginBottom: spacing.lg,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}>
              <Text variant="title1" style={{ color: "#fff", fontSize: 34 }}>
                {(user?.nome || "A").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text variant="title2">
              {user?.nome || "Atleta"}
            </Text>
            <Text variant="callout" color="textSecondary" style={{ marginTop: spacing.xs }}>
              {user?.email || ""}
            </Text>
            {isAdmin && (
              <View style={{ backgroundColor: "#FF3B3015", borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, marginTop: spacing.sm }}>
                <Text variant="caption" style={{ color: "#FF3B30" }}>ADMIN</Text>
              </View>
            )}
          </Card>

          {/* ── Perfil ── */}
          <SectionHeader title="Perfil" />
          <Card padding={0} style={{ overflow: "hidden", marginBottom: spacing.sm }}>
            <ListItem icon="person-outline" iconBg="#0A84FF" label="Editar Perfil" onPress={openEditModal} />
            <ListItem icon="settings-outline" iconBg="#636366" label="Definições" onPress={() => router.push("/settings")} />
          </Card>

          {/* ── Suporte ── */}
          <SectionHeader title="Suporte" />
          <Card padding={0} style={{ overflow: "hidden", marginBottom: spacing.sm }}>
            <ListItem icon="help-circle-outline" iconBg="#F97316" label="Centro de Ajuda" onPress={() => Alert.alert("Ajuda", "Centro de ajuda em breve. Contacta-nos em suporte@golift.pt")} />
            <ListItem icon="shield-checkmark-outline" iconBg="#10B981" label="Política de Privacidade" onPress={() => Alert.alert("Privacidade", "Política de privacidade disponível em golift.pt/privacidade")} />
            <ListItem icon="document-text-outline" iconBg="#8B5CF6" label="Termos de Serviço" onPress={() => Alert.alert("Termos", "Termos de serviço disponíveis em golift.pt/termos")} />
            <ListItem icon="information-circle-outline" iconBg="#0A84FF" label="Sobre o GoLift" onPress={() => Alert.alert("GoLift v1.0.0", "Desenvolvido com ❤️ para atletas que levam o treino a sério.")} />
          </Card>

          {/* ── Admin ── */}
          {isAdmin && (
            <>
              <SectionHeader title="Administração" />
              <Card padding={0} style={{ overflow: "hidden", marginBottom: spacing.sm }}>
                <ListItem icon="shield-outline" iconBg={theme.danger} label="Painel de Admin" onPress={() => router.push("/admin" as any)} />
              </Card>
            </>
          )}

          {/* ── Terminar Sessão ── */}
          <View style={{ marginTop: 28 }}>
            <Button variant="danger" onPress={handleLogout}>Terminar Sessão</Button>
          </View>

        </ScrollView>
      </View>

      {/* Modal — Editar Perfil */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
            onPress={() => !editSaving && setShowEditModal(false)}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: theme.backgroundSecondary,
                borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
                paddingBottom: 40,
              }}>
                <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: spacing.md, marginBottom: spacing.xl }} />

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xxl, marginBottom: spacing.xl }}>
                  <Text variant="title2">Editar Perfil</Text>
                  <Pressable
                    onPress={() => setShowEditModal(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: radius.md, padding: spacing.sm, opacity: pressed ? 0.7 : 1 })}
                  >
                    <Ionicons name="close" size={18} color={theme.text} />
                  </Pressable>
                </View>

                {editLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                  </View>
                ) : (
                  <ScrollView
                    contentContainerStyle={{ paddingHorizontal: spacing.xxl, paddingBottom: spacing.sm }}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Input
                      leftIcon="person-outline"
                      label="Nome"
                      placeholder="O teu nome"
                      value={editNome}
                      onChangeText={setEditNome}
                      containerStyle={{ marginBottom: spacing.lg }}
                    />
                    <Input
                      leftIcon="calendar-outline"
                      label="Idade"
                      placeholder="Ex: 25"
                      value={editIdade}
                      onChangeText={setEditIdade}
                      keyboardType="numeric"
                      containerStyle={{ marginBottom: spacing.lg }}
                    />
                    <Input
                      leftIcon="scale-outline"
                      label="Peso (kg)"
                      placeholder="Ex: 70"
                      value={editPeso}
                      onChangeText={setEditPeso}
                      keyboardType="decimal-pad"
                      containerStyle={{ marginBottom: spacing.lg }}
                    />
                    <Input
                      leftIcon="resize-outline"
                      label="Altura (cm)"
                      placeholder="Ex: 175"
                      value={editAltura}
                      onChangeText={setEditAltura}
                      keyboardType="decimal-pad"
                      containerStyle={{ marginBottom: spacing.lg }}
                    />

                    <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
                      <Button variant="ghost" style={{ flex: 1 }} onPress={() => setShowEditModal(false)}>Cancelar</Button>
                      <Button variant="primary" style={{ flex: 2 }} loading={editSaving} onPress={handleSaveProfile}>Guardar</Button>
                    </View>
                  </ScrollView>
                )}
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
