import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useTheme, useThemePreference } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import type { ThemePreference } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text style={{
      fontSize: 11, fontWeight: "700", color: theme.textSecondary,
      letterSpacing: 1, textTransform: "uppercase",
      marginBottom: 12, marginTop: 4,
    }}>
      {title}
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
  isLast?: boolean;
  destructive?: boolean;
}

function Row({ label, subtitle, icon, iconBg, onPress, rightEl, isLast, destructive }: RowProps) {
  const theme = useTheme();
  const textColor = destructive ? "#EF4444" : theme.text;
  const tint = destructive ? "#EF4444" : iconBg;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "none"}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 18, paddingVertical: 15,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.backgroundTertiary,
        opacity: pressed && onPress ? 0.7 : 1,
      })}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 11,
        backgroundColor: tint + "18",
        justifyContent: "center", alignItems: "center", marginRight: 14,
      }}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: textColor, fontSize: 15, fontWeight: "600" }}>{label}</Text>
        {subtitle && <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {rightEl}
      {!rightEl && onPress && (
        <Ionicons name="chevron-forward" size={15} color={theme.textTertiary} />
      )}
    </Pressable>
  );
}

// ─── Theme Pill ────────────────────────────────────────────────────────────────
interface ThemePillProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: ThemePreference;
  current: ThemePreference;
  onSelect: (v: ThemePreference) => void;
}

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
        flex: 1, paddingVertical: 14, borderRadius: 16,
        alignItems: "center",
        backgroundColor: active ? theme.accent : theme.backgroundTertiary,
        opacity: pressed ? 0.8 : 1, gap: 6,
      })}
    >
      <Ionicons name={icon} size={20} color={active ? "#fff" : theme.textSecondary} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : theme.textSecondary }}>
        {label}
      </Text>
    </Pressable>
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
    Alert.alert(
      "Gerir Subscrição",
      "Serás redirecionado para o portal Stripe.",
      [
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
      ]
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Eliminar Conta",
      "Esta ação é permanente e irrevogável. Todos os teus dados serão apagados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => Alert.alert("Em breve", "Contacta suporte@golift.pt para eliminares a tua conta."),
        },
      ]
    );
  }

  return (
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
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.6, flex: 1 }}>
          Definições
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

        {/* ── APARÊNCIA ── */}
        <SectionHeader title="Aparência" />
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 14 }}>
            Escolhe o tema da aplicação. "Sistema" segue as definições do dispositivo.
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ThemePill label="Sistema" icon="phone-portrait-outline" value="system" current={preference} onSelect={setPreference} />
            <ThemePill label="Claro"   icon="sunny-outline"          value="light"  current={preference} onSelect={setPreference} />
            <ThemePill label="Escuro"  icon="moon-outline"           value="dark"   current={preference} onSelect={setPreference} />
          </View>
        </View>

        {/* ── NOTIFICAÇÕES ── */}
        <SectionHeader title="Notificações" />
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", marginBottom: 24 }}>
          <Row
            icon="barbell-outline" iconBg="#0A84FF"
            label="Lembretes de Treino"
            subtitle="Recebe lembretes diários"
            rightEl={<Switch value={notifTreinos} onValueChange={setNotifTreinos} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
          />
          <Row
            icon="people-outline" iconBg="#10B981"
            label="Comunidades"
            subtitle="Novidades e publicações"
            rightEl={<Switch value={notifComunidades} onValueChange={setNotifComunidades} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
          />
          <Row
            icon="bulb-outline" iconBg="#F59E0B"
            label="Dicas de Treino"
            subtitle="Conteúdo personalizado"
            isLast
            rightEl={<Switch value={notifDicas} onValueChange={setNotifDicas} trackColor={{ false: theme.backgroundTertiary, true: theme.accent }} thumbColor="#fff" />}
          />
        </View>

        {/* ── SUBSCRIÇÃO ── */}
        <SectionHeader title="Subscrição" />
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", marginBottom: 24 }}>
          {planoTipo === "pago" ? (
            <>
              <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.backgroundTertiary, flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: "#F59E0B22", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
                  <Ionicons name="star" size={17} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>GoLift Pro</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Subscrição ativa</Text>
                </View>
                <View style={{ backgroundColor: "#10B98120", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "700" }}>Ativo</Text>
                </View>
              </View>
              <Row
                icon="card-outline" iconBg="#EF4444"
                label="Gerir Subscrição"
                subtitle="Alterar ou cancelar no Stripe"
                isLast
                onPress={handleManageSubscription}
                rightEl={cancelLoading ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
              />
            </>
          ) : (
            <Row
              icon="sparkles-outline" iconBg="#8B5CF6"
              label="Desbloquear GoLift Pro"
              subtitle="IA · relatórios · planos personalizados"
              isLast
              onPress={() => router.push("/upgrade")}
            />
          )}
        </View>

        {/* ── SOBRE ── */}
        <SectionHeader title="Sobre" />
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", marginBottom: 24 }}>
          <Row
            icon="document-text-outline" iconBg="#8B5CF6"
            label="Política de Privacidade"
            onPress={() => Alert.alert("Privacidade", "Disponível em golift.pt/privacidade")}
          />
          <Row
            icon="shield-checkmark-outline" iconBg="#10B981"
            label="Termos de Serviço"
            onPress={() => Alert.alert("Termos", "Disponível em golift.pt/termos")}
          />
          <Row
            icon="information-circle-outline" iconBg="#0A84FF"
            label="Versão da App"
            isLast
            rightEl={<Text style={{ color: theme.textTertiary, fontSize: 13 }}>1.0.0</Text>}
          />
        </View>

        {/* ── CONTA ── */}
        <SectionHeader title="Conta" />
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", marginBottom: 8 }}>
          <Row
            icon="trash-outline" iconBg="#EF4444"
            label="Eliminar Conta"
            subtitle="Remove todos os teus dados permanentemente"
            destructive isLast
            onPress={handleDeleteAccount}
          />
        </View>

      </ScrollView>
    </View>
  );
}
