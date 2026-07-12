import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { Text, Card, Divider, SectionHeader, ListItem } from "../components/ui";
import { useTheme, useThemePreference } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import type { ThemePreference } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { userApi, planoApi } from "../services/api";
import {
  registerForPushNotifications,
  scheduleWorkoutReminder,
  cancelAllScheduled,
} from "../services/notifications";
import { spacing, radius as R, iconSize } from "../styles/tokens";
import { MODAL_BACKDROP } from "../styles/colors";

// ─── Theme Pill ────────────────────────────────────────────────────────────────
type ThemePillProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: ThemePreference;
  current: ThemePreference;
  onSelect: (v: ThemePreference) => void;
};

function ThemePill({ label, icon, value, current, onSelect }: ThemePillProps) {
  const theme = useTheme();
  const active = current === value;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(value);
      }}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 14,
        borderRadius: R.lg,
        alignItems: "center",
        backgroundColor: active ? theme.accent : theme.backgroundTertiary,
        opacity: pressed ? 0.8 : 1,
        gap: 6,
      })}
    >
      <Ionicons name={icon} size={20} color={active ? "#fff" : theme.textSecondary} />
      <Text variant="caption" style={{ color: active ? "#fff" : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Page Header ───────────────────────────────────────────────────────────────
function PageHeader() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        paddingHorizontal: 24,
        paddingTop: safeTop + 16,
        paddingBottom: 24,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: R.lg,
          backgroundColor: theme.backgroundSecondary,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 14,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="arrow-back" size={20} color={theme.text} />
      </Pressable>
      <Text variant="title2" style={{ letterSpacing: -0.6, flex: 1, fontWeight: "800" }}>
        Definições
      </Text>
    </Animated.View>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { safeBottom } = useAndroidInsets();
  const { preference, setPreference } = useThemePreference();

  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Lembretes de Treino
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(18);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notifDicas, setNotifDicas] = useState(true);

  // Reload data on screen focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        planoApi.getUserPlan(user.id).then(d => setPlanoTipo(d.plano as "free" | "pago")).catch(() => {});
        userApi.getProfile(user.id).then(d => setProfile(d)).catch(() => {});
      }
    }, [user])
  );

  useEffect(() => {
    AsyncStorage.multiGet([
      "@golift:notifications:enabled",
      "@golift:notifications:hour",
      "@golift:notifications:minute",
    ]).then((entries) => {
      const map = Object.fromEntries(entries);
      const enabled = map["@golift:notifications:enabled"] === "true";
      const hour = map["@golift:notifications:hour"]
        ? Number(map["@golift:notifications:hour"])
        : 18;
      const minute = map["@golift:notifications:minute"]
        ? Number(map["@golift:notifications:minute"])
        : 0;
      setNotificationsEnabled(enabled);
      setReminderHour(hour);
      setReminderMinute(minute);
    }).catch(() => {});
  }, []);

  async function handleToggleNotifications(enable: boolean) {
    setNotificationsEnabled(enable);
    await AsyncStorage.setItem("@golift:notifications:enabled", String(enable)).catch(() => {});
    if (enable) {
      if (user?.id) {
        registerForPushNotifications(user.id).catch(() => {});
      }
      scheduleWorkoutReminder(reminderHour, reminderMinute).catch(() => {});
    } else {
      cancelAllScheduled().catch(() => {});
    }
  }

  async function handleTimeChange(hour: number, minute: number) {
    setReminderHour(hour);
    setReminderMinute(minute);
    await AsyncStorage.multiSet([
      ["@golift:notifications:hour", String(hour)],
      ["@golift:notifications:minute", String(minute)],
    ]).catch(() => {});
    if (notificationsEnabled) {
      scheduleWorkoutReminder(hour, minute).catch(() => {});
    }
  }

  async function handleManageSubscription() {
    if (!user?.id) return;
    Alert.alert("Gerir Subscrição", "Serás redirecionado para o portal Stripe.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Continuar",
        onPress: async () => {
          setCancelLoading(true);
          try {
            const data = await planoApi.createStripePortal(user.id);
            if (data.url) await WebBrowser.openBrowserAsync(data.url);
          } catch (err: any) {
            Alert.alert("Erro", err?.message || "Não foi possível abrir o portal.");
          } finally {
            setCancelLoading(false);
          }
        },
      },
    ]);
  }

  function handleLogout() {
    Alert.alert("Terminar Sessão", "Tens a certeza que queres sair da tua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Terminar Sessão", style: "destructive", onPress: logout },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert("Eliminar Conta", "Esta ação é permanente e irrevogável. Todos os teus dados serão apagados.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => Alert.alert("Em breve", "Contacta suporte@golift.pt para eliminares a tua conta.") },
    ]);
  }

  const userDisplayName = profile?.nome || user?.nome || "Atleta";
  const userDisplayEmail = profile?.email || user?.email || "";

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PageHeader />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 60 }}>
        
        {/* ── CONTA DO ATLETA ── */}
        <SectionHeader title="Conta" />
        <Card padding={spacing.lg} style={{ marginBottom: 24, flexDirection: "row", alignItems: "center" }}>
          <View style={{
            width: 52,
            height: 52,
            borderRadius: R.lg,
            backgroundColor: theme.accent,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 16,
          }}>
            <Text variant="title3" style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {userDisplayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="headline" style={{ color: theme.text, fontWeight: "700" }}>
              {userDisplayName}
            </Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              {userDisplayEmail}
            </Text>
          </View>
        </Card>

        <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          <ListItem
            icon="person-outline"
            iconBg="#0A84FF"
            label="Editar Perfil"
            subtitle="Idade, peso, altura e nome"
            onPress={() => router.push("/edit-profile")}
          />
        </Card>

        {/* ── APARÊNCIA ── */}
        <SectionHeader title="Aparência" />
        <Card padding={spacing.lg} style={{ marginBottom: 24 }}>
          <Text variant="footnote" color="textSecondary" style={{ marginBottom: 14 }}>
            Escolhe o tema da aplicação. "Sistema" segue as definições do dispositivo.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ThemePill label="Sistema" icon="phone-portrait-outline" value="system" current={preference} onSelect={setPreference} />
            <ThemePill label="Claro"   icon="sunny-outline"          value="light"  current={preference} onSelect={setPreference} />
            <ThemePill label="Escuro"  icon="moon-outline"           value="dark"   current={preference} onSelect={setPreference} />
          </View>
        </Card>

        {/* ── NOTIFICAÇÕES ── */}
        <SectionHeader title="Notificações" />
        <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          <ListItem
            icon="barbell-outline"
            iconBg="#0A84FF"
            label="Lembretes de Treino"
            subtitle="Recebe lembretes diários"
            rightEl={
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleToggleNotifications(val);
                }}
                trackColor={{ false: theme.backgroundTertiary, true: theme.accentGreen }}
                thumbColor="#fff"
                ios_backgroundColor={theme.backgroundTertiary}
              />
            }
          />
          {notificationsEnabled && (
            <>
              <Divider marginHorizontal={spacing.lg} />
              <ListItem
                icon="alarm-outline"
                iconBg="#30D158"
                label="Hora do Lembrete"
                subtitle={`${String(reminderHour).padStart(2, "0")}:${String(reminderMinute).padStart(2, "0")}`}
                onPress={() => setShowTimePicker(true)}
              />
            </>
          )}
          <Divider marginHorizontal={spacing.lg} />
          <ListItem
            icon="bulb-outline"
            iconBg="#F59E0B"
            label="Dicas de Treino"
            subtitle="Conteúdo personalizado"
            rightEl={
              <Switch
                value={notifDicas}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setNotifDicas(val);
                }}
                trackColor={{ false: theme.backgroundTertiary, true: theme.accent }}
                thumbColor="#fff"
                ios_backgroundColor={theme.backgroundTertiary}
              />
            }
          />
        </Card>

        {/* ── SUBSCRIÇÃO ── */}
        <SectionHeader title="Subscrição" />
        <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          {planoTipo === "pago" ? (
            <LinearGradient colors={[theme.accent + "10", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={{ paddingHorizontal: spacing.lg, paddingVertical: 14, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 34, height: 34, borderRadius: R.md, backgroundColor: "#F59E0B22", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
                  <Ionicons name="star" size={17} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: "600" }}>GoLift Pro</Text>
                  <Text variant="caption" color="textSecondary">Subscrição ativa</Text>
                </View>
                <View style={{ backgroundColor: "#10B98120", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text variant="caption" style={{ color: "#10B981" }}>Ativo</Text>
                </View>
              </View>
            </LinearGradient>
          ) : (
            <ListItem
              icon="sparkles-outline"
              iconBg="#8B5CF6"
              label="Desbloquear GoLift Pro"
              subtitle="IA · relatórios · planos personalizados"
              onPress={() => router.push("/upgrade")}
            />
          )}
          <Divider marginHorizontal={spacing.lg} />
          {planoTipo === "pago" && (
            <>
              <ListItem
                icon="card-outline"
                iconBg="#FF3B30"
                label="Gerir Subscrição"
                subtitle="Alterar ou cancelar no Stripe"
                onPress={handleManageSubscription}
                rightEl={cancelLoading ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
              />
              <Divider marginHorizontal={spacing.lg} />
            </>
          )}
          <ListItem
            icon="sparkles-outline"
            iconBg="#8B5CF6"
            label="Planos e Preços"
            subtitle="Compara os planos disponíveis"
            onPress={() => router.push("/upgrade")}
          />
        </Card>

        {/* ── SOBRE ── */}
        <SectionHeader title="Sobre" />
        <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          <ListItem icon="help-circle-outline" iconBg="#F97316" label="Centro de Ajuda" onPress={() => Alert.alert("Ajuda", "Centro de ajuda em breve. Contacta-nos em suporte@golift.pt")} />
          <Divider marginHorizontal={spacing.lg} />
          <ListItem icon="document-text-outline" iconBg="#8B5CF6" label="Política de Privacidade" onPress={() => Alert.alert("Privacidade", "Disponível em golift.pt/privacidade")} />
          <Divider marginHorizontal={spacing.lg} />
          <ListItem icon="shield-checkmark-outline" iconBg="#10B981" label="Termos de Serviço" onPress={() => Alert.alert("Termos", "Disponível em golift.pt/termos")} />
          <Divider marginHorizontal={spacing.lg} />
          <ListItem icon="information-circle-outline" iconBg="#0A84FF" label="Versão da App" rightEl={<Text variant="callout" color="textTertiary">1.0.0</Text>} />
        </Card>

        {/* ── AÇÕES CRÍTICAS ── */}
        <SectionHeader title="Ações" />
        <Card padding={0} style={{ overflow: "hidden", marginBottom: 24 }}>
          <ListItem
            icon="log-out-outline"
            iconBg="#FF3B30"
            label="Terminar Sessão"
            destructive
            onPress={handleLogout}
          />
          <Divider marginHorizontal={spacing.lg} />
          <ListItem
            icon="trash-outline"
            iconBg="#FF3B30"
            label="Eliminar Conta"
            subtitle="Remove todos os teus dados permanentemente"
            destructive
            onPress={handleDeleteAccount}
          />
        </Card>

      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={showTimePicker} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: MODAL_BACKDROP, justifyContent: "flex-end" }}>
          <Card padding={0} style={{ borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: safeBottom + 20 }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: spacing.md, marginBottom: spacing.xl }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg }}>
              <Text variant="title2" color="text">Hora do Lembrete</Text>
              <Pressable
                onPress={() => setShowTimePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: R.md, padding: spacing.sm, opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="close" size={iconSize.sm} color={theme.text} />
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: spacing.xl, gap: spacing.xl }}>
              <View style={{ alignItems: "center" }}>
                <Text variant="caption" color="textTertiary" style={{ marginBottom: spacing.sm }}>Hora</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleTimeChange((reminderHour + 1) % 24, reminderMinute);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ padding: spacing.sm, opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="chevron-up" size={R.xxl} color={theme.text} />
                </Pressable>
                <View style={{ backgroundColor: theme.background, borderRadius: R.lg, paddingHorizontal: R.xxl, paddingVertical: spacing.lg, marginVertical: spacing.sm }}>
                  <Text variant="display" style={{ color: theme.text, fontSize: 42 }}>
                    {String(reminderHour).padStart(2, "0")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleTimeChange(reminderHour === 0 ? 23 : reminderHour - 1, reminderMinute);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ padding: spacing.sm, opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="chevron-down" size={R.xxl} color={theme.text} />
                </Pressable>
              </View>

              <Text variant="display" style={{ color: theme.text, fontSize: 42, fontWeight: "300", marginBottom: 30 }}>:</Text>

              <View style={{ alignItems: "center" }}>
                <Text variant="caption" color="textTertiary" style={{ marginBottom: spacing.sm }}>Min</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleTimeChange(reminderHour, (reminderMinute + 5) % 60);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ padding: spacing.sm, opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="chevron-up" size={R.xxl} color={theme.text} />
                </Pressable>
                <View style={{ backgroundColor: theme.background, borderRadius: R.lg, paddingHorizontal: R.xxl, paddingVertical: spacing.lg, marginVertical: spacing.sm }}>
                  <Text variant="display" style={{ color: theme.text, fontSize: 42 }}>
                    {String(reminderMinute).padStart(2, "0")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleTimeChange(reminderHour, reminderMinute === 0 ? 55 : reminderMinute - 5);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ padding: spacing.sm, opacity: pressed ? 0.5 : 1 })}
                >
                  <Ionicons name="chevron-down" size={R.xxl} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowTimePicker(false);
              }}
              style={({ pressed }) => ({
                backgroundColor: theme.accent,
                paddingVertical: 16,
                borderRadius: R.xl,
                alignItems: "center",
                marginHorizontal: spacing.xxl,
                marginTop: spacing.md,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Confirmar</Text>
            </Pressable>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
