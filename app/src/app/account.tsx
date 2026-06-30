import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { userApi } from "../services/api";

// ─── Row item ────────────────────────────────────────────────────────────────

interface ItemRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

function ItemRow({ icon, iconBg, label, onPress, destructive }: ItemRowProps) {
  const theme = useTheme();
  const tint = destructive ? "#EF4444" : iconBg;
  const textColor = destructive ? "#EF4444" : theme.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 17,
        marginBottom: 12,
      }}>
        <View style={{ width: 26, alignItems: "center", marginRight: 16 }}>
          <Ionicons name={icon} size={22} color={tint} />
        </View>
        <Text style={{ color: textColor, fontSize: 17, fontWeight: "500", flex: 1, letterSpacing: -0.3 }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Account() {
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
    } catch (error: any) {
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
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
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
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5, flex: 1 }}>
            Minha Conta
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

          {/* ── User card ── */}
          <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 36 }}>
            <View style={{
              width: 88, height: 88, borderRadius: 28,
              backgroundColor: theme.accent,
              justifyContent: "center", alignItems: "center",
              marginBottom: 16,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}>
              <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800" }}>
                {(user?.nome || "A").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.5 }}>
              {user?.nome || "Atleta"}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4 }}>
              {user?.email || ""}
            </Text>
            {isAdmin && (
              <View style={{ backgroundColor: "#EF444415", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 }}>
                <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>ADMIN</Text>
              </View>
            )}
          </View>

          {/* ── Perfil ── */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 14, letterSpacing: 1, textTransform: "uppercase" }}>Perfil</Text>
          <ItemRow icon="person-outline" iconBg="#0A84FF" label="Editar Perfil" onPress={openEditModal} />
          <ItemRow icon="settings-outline" iconBg="#636366" label="Definições" onPress={() => router.push("/settings")} />

          {/* ── Suporte ── */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 14, marginTop: 28, letterSpacing: 1, textTransform: "uppercase" }}>Suporte</Text>
          <ItemRow icon="help-circle-outline" iconBg="#F97316" label="Centro de Ajuda" onPress={() => Alert.alert("Ajuda", "Centro de ajuda em breve. Contacta-nos em suporte@golift.pt")} />
          <ItemRow icon="shield-checkmark-outline" iconBg="#10B981" label="Política de Privacidade" onPress={() => Alert.alert("Privacidade", "Política de privacidade disponível em golift.pt/privacidade")} />
          <ItemRow icon="document-text-outline" iconBg="#8B5CF6" label="Termos de Serviço" onPress={() => Alert.alert("Termos", "Termos de serviço disponíveis em golift.pt/termos")} />
          <ItemRow icon="information-circle-outline" iconBg="#0A84FF" label="Sobre o GoLift" onPress={() => Alert.alert("GoLift v1.0.0", "Desenvolvido com ❤️ para atletas que levam o treino a sério.")} />

          {/* ── Admin ── */}
          {isAdmin && (
            <>
              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, marginBottom: 14, marginTop: 28, letterSpacing: 1, textTransform: "uppercase" }}>Administração</Text>
              <ItemRow icon="shield-outline" iconBg="#EF4444" label="Painel de Admin" onPress={() => router.push("/admin")} />
            </>
          )}

          {/* ── Terminar Sessão ── */}
          <View style={{ marginTop: 28 }}>
            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Terminar Sessão"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14,
                paddingVertical: 17,
                alignItems: "center",
              }}>
                <Text style={{ color: "#EF4444", fontSize: 17, fontWeight: "500" }}>Terminar Sessão</Text>
              </View>
            </Pressable>
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
                borderTopLeftRadius: 28, borderTopRightRadius: 28,
                paddingBottom: 40,
              }}>
                <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 20 }}>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
                    Editar Perfil
                  </Text>
                  <Pressable
                    onPress={() => setShowEditModal(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                    style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: 12, padding: 8, opacity: pressed ? 0.7 : 1 })}
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
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {([
                      { label: "Nome", value: editNome, setter: setEditNome, placeholder: "O teu nome", icon: "person-outline" as const, keyboard: "default" as const },
                      { label: "Idade", value: editIdade, setter: setEditIdade, placeholder: "Ex: 25", icon: "calendar-outline" as const, keyboard: "numeric" as const },
                      { label: "Peso (kg)", value: editPeso, setter: setEditPeso, placeholder: "Ex: 70", icon: "scale-outline" as const, keyboard: "decimal-pad" as const },
                      { label: "Altura (cm)", value: editAltura, setter: setEditAltura, placeholder: "Ex: 175", icon: "resize-outline" as const, keyboard: "decimal-pad" as const },
                    ]).map((field) => (
                      <View key={field.label} style={{ marginBottom: 16 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                          {field.label}
                        </Text>
                        <View style={{
                          flexDirection: "row", alignItems: "center",
                          backgroundColor: theme.background, borderRadius: 14,
                          paddingHorizontal: 14, borderWidth: 1,
                          borderColor: theme.backgroundTertiary,
                        }}>
                          <Ionicons name={field.icon} size={18} color={theme.textSecondary} />
                          <TextInput
                            style={{ flex: 1, color: theme.text, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16 }}
                            placeholder={field.placeholder}
                            placeholderTextColor={theme.textTertiary}
                            value={field.value}
                            onChangeText={field.setter}
                            keyboardType={field.keyboard}
                            returnKeyType="next"
                          />
                        </View>
                      </View>
                    ))}

                    <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                      <Pressable
                        onPress={() => setShowEditModal(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Cancelar"
                        style={({ pressed }) => ({
                          flex: 1, backgroundColor: theme.background, paddingVertical: 16,
                          borderRadius: 16, alignItems: "center",
                          borderWidth: 1, borderColor: theme.backgroundTertiary,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text style={{ color: theme.text, fontWeight: "600", fontSize: 15 }}>Cancelar</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveProfile}
                        disabled={editSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Guardar alterações"
                        style={({ pressed }) => ({
                          flex: 2, backgroundColor: theme.accent, paddingVertical: 16,
                          borderRadius: 16, alignItems: "center",
                          flexDirection: "row", justifyContent: "center", gap: 8,
                          opacity: pressed || editSaving ? 0.8 : 1,
                        })}
                      >
                        {editSaving
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Ionicons name="checkmark" size={18} color="#fff" />
                        }
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                          {editSaving ? "A guardar..." : "Guardar"}
                        </Text>
                      </Pressable>
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
