import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Text, Card, Divider } from "../components/ui";
import { useTheme, useThemePreference } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { useFadeIn } from "../hooks/useAnimations";
import type { ThemePreference } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { spacing, radius as R } from "../styles/tokens";

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text variant="caption" color="textSecondary" style={{ marginBottom: 10, marginTop: 6 }}>
      {title.toUpperCase()}
    </Text>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────────
interface RowProps {
  label: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  index?: number;
  destructive?: boolean;
}

function Row({ label, subtitle, icon, iconBg, onPress, rightEl, index = 0, destructive }: RowProps) {
  const theme = useTheme();
  const { opacity, translateY } = useFadeIn(index);
  const tint = destructive ? theme.danger : iconBg;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
          opacity: pressed && onPress ? 0.7 : 1,
        })}
      >
        <View style={{
          width: 36, height: 36, borderRadius: R.md,
          backgroundColor: tint + "18",
          justifyContent: "center", alignItems: "center", marginRight: 14,
        }}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ color: destructive ? theme.danger : theme.text, fontWeight: "600" }}>
            {label}
          </Text>
          {subtitle && <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>{subtitle}</Text>}
        </View>
        {rightEl}
        {!rightEl && onPress && <Ionicons name="chevron-forward" size={15} color={theme.textTertiary} />}
      </Pressable>
    </Animated.View>
  );
}

// ─── Theme Pill ────────────────────────────────────────────────────────────────
function ThemePill({ label, icon, value, current, onSelect }: ThemePillProps) {
  const theme = useTheme();
  const active = current === value;

  return (
    <Pressable
      onPress={() => onSelect(value)}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        flex: 1, paddingVertical: 14, borderRadius: R.lg,
        alignItems: "center",
        backgroundColor: active ? theme.accent : theme.backgroundTertiary,
        opacity: pressed ? 0.8 : 1, gap: 6,
      })}
    >
      <Ionicons name={icon} size={20} color={active ? "#fff" : theme.textSecondary} />
      <Text variant="caption" style={{ color: active ? "#fff" : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ThemePillProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: ThemePreference;
  current: ThemePreference;
  onSelect: (v: ThemePreference) => void;
}

// ─── Page Header ───────────────────────────────────────────────────────────────
function PageHeader() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 16, flexDirection: "row", alignItems: "center" }}>
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
      <Text variant="title2" style={{ letterSpacing: -0.6, flex: 1 }}>Definições</Text>
    </Animated.View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { preference, setPreference } = useThemePreference();

  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [cancelLoading, setCancelLoading] = useState(false);

  const [notifTreinos, setNotifTreinos] = useState(true);
  const [notifComunidades, setNotifComunidades] = useState(false);
  const [notifDicas, setNotifDicas] = useState(true);

  useEffect(() => {
    if (user?.id) {
      planoApi.getUserPlan(user.id).then(d => setPlanoTipo(d.plano as "free" | "pago")).catch(() => {});
    }
  }, [user]);

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
          } finally { setCancelLoading(false); }
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert("Eliminar Conta", "Esta ação é permanente e irrevogável. Todos os teus dados serão apagados.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => Alert.alert("Em breve", "Contacta suporte@golift.pt para eliminares a tua conta.") },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PageHeader />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

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
          <Row
            icon="barbell-outline" iconBg="#0A84FF"
            label="Lembretes de Treino"
            subtitle="Recebe lembretes diários"
            rightEl={<Switch value={notifTreinos} onValueChange={setNotifTreinos} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
          />
          <Divider marginHorizontal={spacing.lg} />
          <Row
            icon="people-outline" iconBg="#10B981"
            label="Comunidades"
            subtitle="Novidades e publicações"
            rightEl={<Switch value={notifComunidades} onValueChange={setNotifComunidades} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
          />
          <Divider marginHorizontal={spacing.lg} />
          <Row
            icon="bulb-outline" iconBg="#F59E0B"
            label="Dicas de Treino"
            subtitle="Conteúdo personalizado"
            rightEl={<Switch value={notifDicas} onValueChange={setNotifDicas} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
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
            <Row
              icon="sparkles-outline" iconBg="#8B5CF6"
              label="Desbloquear GoLift Pro"
              subtitle="IA · relatórios · planos personalizados"
              onPress={() => router.push("/upgrade")}
            />
          )}
          <Divider marginHorizontal={spacing.lg} />
          {planoTipo === "pago" && (
            <>
              <Row
                icon="card-outline" iconBg="#FF3B30"
                label="Gerir Subscrição"
                subtitle="Alterar ou cancelar no Stripe"
                onPress={handleManageSubscription}
                rightEl={cancelLoading ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
              />
              <Divider marginHorizontal={spacing.lg} />
            </>
          )}
          <Row
            icon="sparkles-outline" iconBg="#8B5CF6"
            label="Planos e Preços"
            subtitle="Compara os planos disponíveis"
            onPress={() => router.push("/upgrade")}
          />
        </Card>

        {/* ── SOBRE ── */}
        <SectionHeader title="Sobre" />
        <Card padding={0} style={{ marginBottom: 24, overflow: "hidden" }}>
          <Row icon="document-text-outline" iconBg="#8B5CF6" label="Política de Privacidade" onPress={() => Alert.alert("Privacidade", "Disponível em golift.pt/privacidade")} />
          <Divider marginHorizontal={spacing.lg} />
          <Row icon="shield-checkmark-outline" iconBg="#10B981" label="Termos de Serviço" onPress={() => Alert.alert("Termos", "Disponível em golift.pt/termos")} />
          <Divider marginHorizontal={spacing.lg} />
          <Row icon="information-circle-outline" iconBg="#0A84FF" label="Versão da App" rightEl={<Text variant="callout" color="textTertiary">1.0.0</Text>} />
        </Card>

        {/* ── CONTA ── */}
        <SectionHeader title="Conta" />
        <Card padding={0} style={{ overflow: "hidden" }}>
          <Row icon="trash-outline" iconBg="#FF3B30" label="Eliminar Conta" subtitle="Remove todos os teus dados permanentemente" destructive onPress={handleDeleteAccount} />
        </Card>

      </ScrollView>
    </View>
  );
}
