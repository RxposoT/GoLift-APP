import { useEffect, useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { useAuth } from "../../contexts/AuthContext";
import { adminApi } from "../../services/api/admin";
import { Text } from "../../components/ui/Text";
import { spacing, radius } from "../../styles/tokens";

interface Stats {
  total_utilizadores: number;
  utilizadores_premium: number;
  total_treinos: number;
  treinos_hoje: number;
  total_frases: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background, paddingTop: safeTop }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background, paddingTop: safeTop }}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.danger} />
        <Text variant="body" style={{ color: theme.textSecondary, marginTop: spacing.sm, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  const cardBg = theme.backgroundSecondary;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text variant="title1" style={{ color: theme.text, fontWeight: "700" }}>Painel de Admin</Text>
        <Text variant="callout" style={{ color: theme.textSecondary, marginTop: spacing.xxs }}>
          Bem-vindo, {user?.nome}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={{ flexDirection: "row", paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md }}>
        <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" }}>
          <Ionicons name="people-outline" size={24} color={theme.accent} />
          <Text variant="title2" style={{ color: theme.text, marginTop: spacing.xs, fontWeight: "700" }}>
            {stats?.total_utilizadores ?? 0}
          </Text>
          <Text variant="caption" style={{ color: theme.textSecondary }}>Utilizadores</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" }}>
          <Ionicons name="fitness-outline" size={24} color="#34C759" />
          <Text variant="title2" style={{ color: theme.text, marginTop: spacing.xs, fontWeight: "700" }}>
            {stats?.total_treinos ?? 0}
          </Text>
          <Text variant="caption" style={{ color: theme.textSecondary }}>Treinos</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, alignItems: "center" }}>
          <Ionicons name="flash-outline" size={24} color="#FF9F0A" />
          <Text variant="title2" style={{ color: theme.text, marginTop: spacing.xs, fontWeight: "700" }}>
            {stats?.treinos_hoje ?? 0}
          </Text>
          <Text variant="caption" style={{ color: theme.textSecondary }}>Hoje</Text>
        </View>
      </View>

      {/* Secondary stats */}
      <View style={{ flexDirection: "row", paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="diamond-outline" size={20} color="#FFD60A" />
          <View>
            <Text variant="title3" style={{ color: theme.text, fontWeight: "700" }}>{stats?.utilizadores_premium ?? 0}</Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Premium</Text>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Ionicons name="chatbubble-outline" size={20} color={theme.accent} />
          <View>
            <Text variant="title3" style={{ color: theme.text, fontWeight: "700" }}>{stats?.total_frases ?? 0}</Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Frases</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
        <Text variant="headline" style={{ color: theme.text, marginBottom: spacing.xs }}>Gestão</Text>

        <Pressable
          onPress={() => router.push("/admin/users" as any)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", backgroundColor: cardBg,
            borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent + "20", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="people-outline" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: theme.text, fontWeight: "600" }}>Gerir Utilizadores</Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Ver, promover e remover utilizadores</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/admin/phrases" as any)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", backgroundColor: cardBg,
            borderRadius: radius.lg, padding: spacing.md, gap: spacing.md,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#34C75920", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="chatbubble-outline" size={20} color="#34C759" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: theme.text, fontWeight: "600" }}>Frases Diárias</Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Criar, editar e remover frases</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}
