import { useEffect, useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { adminApi } from "../../services/api/admin";
import { Text } from "../../components/ui/Text";
import { Button } from "../../components/ui";
import { spacing, radius } from "../../styles/tokens";

interface Stats {
  total_utilizadores: number;
  utilizadores_premium: number;
  total_treinos: number;
  treinos_hoje: number;
}

interface GrowthPoint {
  month: string;
  count: number;
}

interface GrowthData {
  users: GrowthPoint[];
  workouts: GrowthPoint[];
}

function AreaChart({
  data,
  width,
  height,
  color,
  placeholderColor,
}: {
  data: GrowthPoint[];
  width: number;
  height: number;
  color: string;
  placeholderColor: string;
}) {
  // Build 6 placeholder bars when no data
  const displayData = data.length
    ? data
    : Array.from({ length: 6 }, (_, i) => ({ month: `${i + 1}`, count: 0 }));

  const max = Math.max(...displayData.map((d) => d.count), 1);
  const pad = 10;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = displayData.map((d, i) => ({
    x: pad + (i / Math.max(displayData.length - 1, 1)) * w,
    y: pad + h - (d.count / max) * h,
  }));

  const areaPath = [
    `M ${points[0].x} ${height - pad}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height - pad}`,
    "Z",
  ].join(" ");

  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill={data.length ? `url(#grad-${color})` : "transparent"} />
      <Path
        d={linePath}
        fill="none"
        stroke={data.length ? color : placeholderColor}
        strokeWidth={2}
        strokeDasharray={data.length ? undefined : "4,4"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AdminDashboard() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [s, g] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getGrowth().catch(() => ({ users: [], workouts: [] })),
      ]);
      setStats(s);
      setGrowth(g);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
          paddingTop: safeTop,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
          paddingTop: safeTop,
          paddingHorizontal: spacing.xxl,
        }}
      >
        <Ionicons name="alert-circle-outline" size={40} color={theme.danger} />
        <Text
          variant="body"
          style={{
            color: theme.textSecondary,
            marginTop: spacing.sm,
            textAlign: "center",
          }}
        >
          {error || "Erro ao carregar"}
        </Text>
      </View>
    );
  }

  const today = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const chartWidth = screenWidth - spacing.xxl * 2 - spacing.md * 2;
  const chartHeight = 160;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background, paddingTop: safeTop }}
      contentContainerStyle={{ paddingBottom: spacing.huge }}
    >
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xxl,
          paddingTop: spacing.xxl,
          paddingBottom: spacing.lg,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            variant="title2"
            style={{ color: theme.text, fontWeight: "700", letterSpacing: -0.3 }}
          >
            Dashboard
          </Text>
          <Text variant="footnote" style={{ color: theme.textTertiary, marginTop: 2 }}>
            {today}
          </Text>
        </View>
      </View>

      {/* ── KPI Row ── */}
      <View style={{ flexDirection: "row", paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" style={{ color: theme.textTertiary }}>
            UTILIZADORES
          </Text>
          <Text variant="title1" style={{ color: theme.text, fontWeight: "700", marginTop: spacing.xxs }}>
            {stats.total_utilizadores.toString()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" style={{ color: theme.textTertiary }}>
            TREINOS HOJE
          </Text>
          <Text variant="title1" style={{ color: theme.text, fontWeight: "700", marginTop: spacing.xxs }}>
            {stats.treinos_hoje.toString()}
          </Text>
        </View>
      </View>

      {/* ── Growth Charts ── */}
      <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
        <Text variant="caption" style={{ color: theme.textTertiary, marginBottom: spacing.sm }}>
          CRESCIMENTO DE UTILIZADORES
        </Text>
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <AreaChart data={growth?.users || []} width={chartWidth} height={chartHeight} color={theme.accent} placeholderColor={theme.backgroundTertiary} />
        </View>

        <Text variant="caption" style={{ color: theme.textTertiary, marginBottom: spacing.sm }}>
          TREINOS POR MÊS
        </Text>
        <View
          style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: radius.lg,
            padding: spacing.md,
          }}
        >
          <AreaChart data={growth?.workouts || []} width={chartWidth} height={chartHeight} color="#34C759" placeholderColor={theme.backgroundTertiary} />
        </View>
      </View>

      {/* ── Premium & total treinos ── */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: spacing.xxl,
          gap: spacing.sm,
          marginBottom: spacing.xxl,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: radius.lg,
            padding: spacing.lg,
          }}
        >
          <Text variant="caption" style={{ color: theme.textTertiary }}>
            PREMIUM
          </Text>
          <Text variant="title3" style={{ color: theme.text, fontWeight: "700", marginTop: spacing.xs }}>
            {stats.utilizadores_premium.toString()}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: radius.lg,
            padding: spacing.lg,
          }}
        >
          <Text variant="caption" style={{ color: theme.textTertiary }}>
            TOTAL TREINOS
          </Text>
          <Text variant="title3" style={{ color: theme.text, fontWeight: "700", marginTop: spacing.xs }}>
            {stats.total_treinos.toString()}
          </Text>
        </View>
      </View>

      {/* ── Users action ── */}
      <View style={{ paddingHorizontal: spacing.xxl, alignItems: "center", marginTop: spacing.sm }}>
        <Button
          variant="ghost"
          size="md"
          style={{ width: "100%" }}
          onPress={() => router.push("/admin/users" as any)}
        >
          Gerir utilizadores
        </Button>
      </View>
    </ScrollView>
  );
}