import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  Animated,
  Switch,
} from "react-native";
import { Text, Card, Button, SectionHeader } from "../../components/ui";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { userApi, metricsApi, planoApi } from "../../services/api";
import {
  registerForPushNotifications,
  scheduleWorkoutReminder,
  cancelAllScheduled,
} from "../../services/notifications";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { getIMCCategory } from "../../utils/imc";
import { formatTime, formatRelativeDate } from "../../utils/format";
import { generateStreakWeek, WeekDay } from "../../utils/streak";
import { ProfileScreenSkeleton } from "../../components/ui/SkeletonLoader";
import { IMC_COLORS, BADGE_COLORS, AMBER, MODAL_BACKDROP } from "../../styles/colors";
import { spacing, radius, iconSize } from "../../styles/tokens";

interface Badge {
  id: string;
  icon: string;
  color: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  lockHint: string;
}

const IMC_SEGMENTS: Array<{ color: string; from: number; to: number }> = [
  { color: IMC_COLORS.underweight, from: 14, to: 18.5 },
  { color: IMC_COLORS.normal, from: 18.5, to: 25 },
  { color: IMC_COLORS.borderline, from: 25, to: 27.5 },
  { color: IMC_COLORS.overweight, from: 27.5, to: 30 },
  { color: IMC_COLORS.obese1, from: 30, to: 35 },
  { color: IMC_COLORS.obese2, from: 35, to: 40 },
  { color: IMC_COLORS.obese3, from: 40, to: 42 },
];
const IMC_TOTAL = 42 - 14;

function computeBadges(
  totalWorkouts: number,
  maxStreak: number,
  totalTimeSec: number,
  recordsCount: number,
  planoTipo: "free" | "pago"
): Omit<Badge, "unlockedAt">[] {
  return [
    { id: "first_step",   icon: "flag",         color: BADGE_COLORS.common,     name: "Primeiro Passo",    description: "Completaste o teu primeiro treino",    unlocked: totalWorkouts >= 1,   lockHint: "Completa 1 treino" },
    { id: "perfect_week", icon: "flame",        color: BADGE_COLORS.streak,     name: "Semana Perfeita",    description: "7 dias consecutivos de treino",        unlocked: maxStreak >= 7,       lockHint: "Treina 7 dias seguidos" },
    { id: "unstoppable",  icon: "flash",        color: BADGE_COLORS.rare,       name: "Imparável",          description: "14 dias consecutivos de treino",       unlocked: maxStreak >= 14,      lockHint: "Treina 14 dias seguidos" },
    { id: "dedicated",    icon: "fitness",      color: BADGE_COLORS.accent,     name: "Dedicado",            description: "25 treinos completados",              unlocked: totalWorkouts >= 25,  lockHint: "Completa 25 treinos" },
    { id: "veteran",      icon: "trophy",       color: BADGE_COLORS.veteran,    name: "Veterano",            description: "50 treinos completados",              unlocked: totalWorkouts >= 50,  lockHint: "Completa 50 treinos" },
    { id: "centurion",    icon: "ribbon",       color: BADGE_COLORS.milestone,  name: "Centenário",          description: "100 treinos completados",             unlocked: totalWorkouts >= 100, lockHint: "Completa 100 treinos" },
    { id: "marathoner",   icon: "timer",        color: BADGE_COLORS.epic,       name: "Maratonista",         description: "50 horas de treino acumuladas",       unlocked: totalTimeSec >= 50 * 3600, lockHint: "Acumula 50h de treino" },
    { id: "elite",        icon: "medal",        color: BADGE_COLORS.legendary,  name: "Atleta de Elite",     description: "Primeiro recorde pessoal registado",  unlocked: recordsCount >= 1,    lockHint: "Regista um recorde pessoal" },
    { id: "progress",     icon: "trending-up",  color: BADGE_COLORS.progress,   name: "Em Progresso",        description: "3 recordes pessoais diferentes",      unlocked: recordsCount >= 3,    lockHint: "Regista 3 recordes diferentes" },
    { id: "pro",          icon: "star",         color: BADGE_COLORS.pro,        name: "Membro Pro",          description: "Subscrição GoLift Pro activa",         unlocked: planoTipo === "pago", lockHint: "Activa o GoLift Pro" },
  ];
}

function IMCBar({ imc }: { imc: number }) {
  const theme = useTheme();
  const clamped = Math.max(14, Math.min(42, imc));
  const pct = ((clamped - 14) / IMC_TOTAL) * 100;
  const imcCategory = getIMCCategory(imc);

  return (
    <View style={{ marginTop: spacing.xs }}>
      <View style={{ height: 20, justifyContent: "center", position: "relative" }}>
        {/* Continuous track */}
        <View style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", width: "100%" }}>
          {IMC_SEGMENTS.map((seg) => (
            <View
              key={seg.from}
              style={{ width: `${((seg.to - seg.from) / IMC_TOTAL) * 100}%` as any, backgroundColor: seg.color }}
            />
          ))}
        </View>
        {/* Glow indicator node */}
        <View style={{
          position: "absolute",
          left: `${pct}%` as any,
          transform: [{ translateX: -6 }],
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: theme.backgroundSecondary,
          borderWidth: 3,
          borderColor: imcCategory.color,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 3,
        }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
        <Text variant="caption" color="textTertiary" style={{ fontSize: 9 }}>14 (Mín.)</Text>
        <Text variant="caption" color="textTertiary" style={{ fontSize: 9 }}>42 (Máx.)</Text>
      </View>
    </View>
  );
}

function WeekStrip({ weekDays }: { weekDays: WeekDay[] }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
      {weekDays.map((d, i) => (
        <View key={i} style={{ alignItems: "center", gap: spacing.xs }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: d.completed ? theme.accentGreen : theme.backgroundTertiary,
          }} />
          <Text variant="caption" style={{ color: theme.textTertiary, fontSize: 9 }}>
            {d.day.charAt(0)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { paddingTop: safeTop, paddingBottom: safeBottom } = useAndroidInsets();
  const isAdmin = user?.tipo === 1;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalTime: 0, thisMonth: 0 });
  const [streakData, setStreakData] = useState({ streak: 0, maxStreak: 0 });
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [weekDays, setWeekDays] = useState<WeekDay[]>(generateStreakWeek());
  const [lastSession, setLastSession] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadData();
    }, [user?.id])
  );

  async function loadData() {
    setLoading(true);
    try {
      const profileData = await userApi.getProfile(user!.id).catch(() => null);
      const [recordsData, statsData, streakResp, historyData, planData] =
        await Promise.all([
          metricsApi.getRecords(user!.id).catch(() => []),
          metricsApi.getStats(user!.id).catch(() => null),
          metricsApi.getStreak(user!.id).catch(() => null),
          metricsApi.getHistory(user!.id).catch(() => null),
          planoApi.getUserPlan(user!.id).catch(() => ({ plano: "free" as const, ativo_ate: null })),
        ]);

      const mapped = profileData
        ? { id: profileData.id, nome: profileData.nome, email: profileData.email, idade: profileData.idade, peso: profileData.peso, altura: profileData.altura }
        : user;
      setProfile(mapped);

      const recs = recordsData || [];
      setRecords(recs);

      const sd = { streak: streakResp?.streak || 0, maxStreak: streakResp?.maxStreak || 0 };
      setStreakData(sd);

      const tipo = (planData?.plano as "free" | "pago") || "free";
      setPlanoTipo(tipo);

      if (statsData) {
        setStats({ totalWorkouts: statsData.totalWorkouts || 0, totalTime: statsData.totalTime || 0, thisMonth: statsData.thisMonth || 0 });
      }

      const sessoesList: any[] = historyData || [];
      const workoutDatesSet = new Set<string>(
        sessoesList.map((s: any) => {
          const raw = s.data_fim || s.data_inicio || s.data;
          if (!raw) return null;
          const d = new Date(raw);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        }).filter(Boolean) as string[]
      );
      const week = generateStreakWeek();
      week.forEach((w) => { w.completed = workoutDatesSet.has(w.date); });
      setWeekDays(week);

      if (sessoesList.length > 0) setLastSession(sessoesList[0]);

      const allBadges = computeBadges(statsData?.totalWorkouts || 0, sd.maxStreak, statsData?.totalTime || 0, recs.length, tipo);
      const storedRaw = await AsyncStorage.getItem("@golift:badges").catch(() => null);
      const stored: Record<string, string> = storedRaw ? JSON.parse(storedRaw) : {};
      const now = new Date().toISOString();
      const updates: Record<string, string> = {};
      const finalBadges: Badge[] = allBadges.map((b) => {
        if (b.unlocked && !stored[b.id]) updates[b.id] = now;
        return { ...b, unlockedAt: stored[b.id] || (b.unlocked ? now : undefined) };
      });
      if (Object.keys(updates).length > 0) {
        await AsyncStorage.setItem("@golift:badges", JSON.stringify({ ...stored, ...updates })).catch(() => {});
      }
      setBadges(finalBadges);

    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setProfile(user);
    } finally {
      setLoading(false);
      Animated.timing(heroOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }



  const contextualSubtitle = useMemo(() => {
    const { streak } = streakData;
    if (streak >= 7) return `Em chamas · ${streak} dias seguidos 🔥`;
    if (streak >= 3) return `${streak} dias consecutivos · continua assim`;
    if (streak === 0 && lastSession) {
      const ago = formatRelativeDate(lastSession.data_fim || lastSession.data_inicio);
      return ago ? `Último treino ${ago}` : "Volta ao ritmo";
    }
    if (!lastSession) return "Começa hoje — o primeiro passo é o mais difícil";
    return `${streak} dia consecutivo`;
  }, [streakData, lastSession]);

  const imc = useMemo(() => {
    if (!profile?.peso || !profile?.altura) return null;
    const h = profile.altura / 100;
    return profile.peso / (h * h);
  }, [profile]);

  const exercisesGrouped = useMemo(() => {
    return Object.entries(
      records.reduce((acc: any, rec: any) => {
        const nome = rec.nome_exercicio || rec.exercicio || rec.exercise || "";
        if (!acc[nome]) acc[nome] = [];
        acc[nome].push(rec);
        return acc;
      }, {})
    ).map(([nome, recs]) => {
      const sorted = [...(recs as any[])].sort((a, b) => (b.peso || b.weight) - (a.peso || a.weight));
      const best = sorted[0];
      return {
        nome,
        id_exercicio: best.exercise_id || best.id_exercicio || best.exercicio_id,
        peso: best.peso || best.weight,
        data: best.data_serie || best.data || best.created_at,
      };
    }).sort((a, b) => b.peso - a.peso);
  }, [records]);

  if (loading) {
    return <ProfileScreenSkeleton />;
  }

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const orderedBadges = [...badges.filter((b) => b.unlocked), ...badges.filter((b) => !b.unlocked)];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: safeBottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: safeTop + spacing.md, paddingBottom: spacing.sm, flexDirection: "row", alignItems: "center" }}>
          <Text variant="title1" color="text" style={{ flex: 1 }}>
            Perfil
          </Text>
          {isAdmin && (
            <Pressable
              onPress={() => router.push("/admin" as any)}
              accessibilityRole="button"
              accessibilityLabel="Painel Admin"
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: radius.lg,
                backgroundColor: theme.accent,
                justifyContent: "center", alignItems: "center",
                opacity: pressed ? 0.7 : 1,
                marginRight: spacing.xxxl,
              })}
            >
              <Ionicons name="terminal" size={iconSize.sm} color="#FFFFFF" />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityRole="button"
            accessibilityLabel="Definições da conta"
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: radius.lg,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="settings-outline" size={iconSize.sm} color={theme.text} />
          </Pressable>
        </View>

        <Animated.View style={{ opacity: heroOpacity, alignItems: "center", paddingHorizontal: spacing.xxl, marginBottom: radius.xxl, paddingTop: spacing.lg }}>
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 26,
            backgroundColor: theme.accent,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
            elevation: 8,
          }}>
            <Text variant="title1" style={{ color: "#fff", fontSize: 34 }}>
              {(profile?.nome || user?.nome || "A").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="title2" color="text" style={{ marginTop: spacing.lg, textAlign: "center" }}>
            {profile?.nome || "Atleta"}
          </Text>
          <Text variant="callout" color="textSecondary" style={{ marginTop: 5, textAlign: "center" }}>
            {contextualSubtitle}
          </Text>
          {planoTipo === "pago" && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm, backgroundColor: AMBER + "22", paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.xl }}>
              <Ionicons name="star" size={11} color={AMBER} style={{ marginRight: 5 }} />
              <Text variant="footnote" style={{ color: AMBER, fontWeight: "800" }}>GoLift Pro</Text>
            </View>
          )}
          <WeekStrip weekDays={weekDays} />
        </Animated.View>

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.md }}>
          <View style={{ backgroundColor: theme.accent, borderRadius: radius.xxl, padding: spacing.xxl }}>
            <Text variant="caption" style={{ color: "rgba(255,255,255,0.55)", marginBottom: spacing.sm }}>
              Total de Treinos
            </Text>
            <Text variant="display" style={{ color: "#fff", fontSize: 64, lineHeight: 66 }}>
              {stats.totalWorkouts}
            </Text>
            <Text variant="subhead" style={{ color: "rgba(255,255,255,0.45)", marginTop: spacing.sm }}>
              sessões completadas
            </Text>
          </View>
        </View>

        {planoTipo !== "pago" && (
          <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xl }}>
            <Pressable
              onPress={() => router.push("/upgrade")}
              accessibilityLabel="Desbloquear GoLift Pro"
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: theme.accent,
                borderRadius: radius.xl,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text variant="headline" style={{ color: "#fff" }}>Desbloquea GoLift Pro ⭐</Text>
                <Text variant="subhead" style={{ color: "rgba(255,255,255,0.7)", marginTop: spacing.xxs }}>IA · relatórios · planos personalizados</Text>
              </View>
              <Ionicons name="chevron-forward" size={iconSize.sm} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.xxl, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: radius.xxl }}>
          {([
            { label: "Tempo Total",    value: formatTime(stats.totalTime) },
            { label: "Melhor Streak",  value: `${streakData.maxStreak}d` },
            { label: "Este Mês",       value: `${stats.thisMonth}` },
            { label: "Recordes",       value: `${records.length}` },
          ] as const).map((s) => (
            <Card key={s.label} style={{ flex: 1, minWidth: "45%" }}>
              <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                {s.label}
              </Text>
              <Text variant="title1" style={{ color: theme.text, fontSize: 28 }}>
                {s.value}
              </Text>
            </Card>
          ))}
        </View>

        {lastSession && (
          <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
            <SectionHeader title="Última Sessão" />
            <Card padding={0} style={{ overflow: "hidden" }}>
              <View style={{ padding: spacing.lg, flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: theme.accent + "15",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: spacing.md,
                }}>
                  <Ionicons name="barbell-outline" size={24} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" color="text" style={{ fontWeight: "700", marginBottom: spacing.xxs }}>
                    {lastSession.nome_treino || lastSession.nome || "Treino"}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                      <Text variant="subhead" color="textSecondary">
                        {formatRelativeDate(lastSession.data_fim || lastSession.data_inicio)}
                      </Text>
                    </View>
                    {(lastSession.duracao_segundos || 0) > 0 && (
                      <>
                        <Text variant="subhead" color="textSecondary">·</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                          <Text variant="subhead" color="textSecondary">
                            {formatTime(lastSession.duracao_segundos)}
                          </Text>
                        </View>
                      </>
                    )}
                    {(lastSession.num_exercicios || 0) > 0 && (
                      <>
                        <Text variant="subhead" color="textSecondary">·</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Ionicons name="fitness-outline" size={12} color={theme.textSecondary} />
                          <Text variant="subhead" color="textSecondary">
                            {lastSession.num_exercicios} séries
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => lastSession.id_treino && router.push({ pathname: "/workout/[id]", params: { id: lastSession.id_treino } })}
                >
                  Repetir
                </Button>
              </View>
            </Card>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <SectionHeader title="Dados Físicos" />
          
          <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }}>
            <Card padding={spacing.md} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.backgroundTertiary, justifyContent: "center", alignItems: "center", marginBottom: spacing.sm }}>
                <Ionicons name="scale-outline" size={18} color={theme.textSecondary} />
              </View>
              <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.xxs }}>Peso</Text>
              <Text variant="title3" style={{ color: theme.text }}>
                {profile?.peso ? `${profile.peso} kg` : "—"}
              </Text>
            </Card>

            <Card padding={spacing.md} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.backgroundTertiary, justifyContent: "center", alignItems: "center", marginBottom: spacing.sm }}>
                <Ionicons name="resize-outline" size={18} color={theme.textSecondary} />
              </View>
              <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.xxs }}>Altura</Text>
              <Text variant="title3" style={{ color: theme.text }}>
                {profile?.altura ? `${profile.altura} cm` : "—"}
              </Text>
            </Card>

            <Card padding={spacing.md} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.backgroundTertiary, justifyContent: "center", alignItems: "center", marginBottom: spacing.sm }}>
                <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              </View>
              <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.xxs }}>Idade</Text>
              <Text variant="title3" style={{ color: theme.text }}>
                {profile?.idade ? `${profile.idade} anos` : "—"}
              </Text>
            </Card>
          </View>

          {imc && (
            <Card padding={spacing.lg} style={{ marginTop: spacing.xs }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
                <View>
                  <Text variant="subhead" color="textSecondary">Índice de Massa Corporal (IMC)</Text>
                  <Text variant="title2" style={{ color: theme.text, marginTop: spacing.xxs }}>
                    {imc.toFixed(1)}
                  </Text>
                </View>
                <View style={{
                  backgroundColor: getIMCCategory(imc).color + "18",
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.md,
                }}>
                  <Text variant="subhead" style={{ color: getIMCCategory(imc).color, fontWeight: "700" }}>
                    {getIMCCategory(imc).label}
                  </Text>
                </View>
              </View>
              <IMCBar imc={imc} />
            </Card>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <SectionHeader title="Melhores Recordes" />
            {exercisesGrouped.length > 3 && (
              <Pressable onPress={() => setShowAllRecords(true)} accessibilityRole="button" accessibilityLabel="Ver todos os recordes">
                <Text variant="subhead" style={{ color: theme.accent, fontWeight: "600" }}>Ver todos ({exercisesGrouped.length})</Text>
              </Pressable>
            )}
          </View>

          {exercisesGrouped.length === 0 ? (
            <Card padding={spacing.xxxl} style={{ alignItems: "center" }}>
              <Ionicons name="medal" size={iconSize.xxl} color={theme.textSecondary} style={{ marginBottom: spacing.md }} />
              <Text variant="headline" color="text" style={{ marginBottom: spacing.sm, textAlign: "center" }}>Ainda sem recordes</Text>
              <Text variant="callout" color="textSecondary" style={{ textAlign: "center", lineHeight: 20, marginBottom: spacing.xl }}>
                Regista séries no treino activo para este espaço ganhar vida
              </Text>
              <Button variant="primary" size="md" onPress={() => router.push("/(tabs)/workouts")}>
                Ir Treinar
              </Button>
            </Card>
          ) : (
            <View style={{ gap: spacing.md }}>
              {exercisesGrouped.slice(0, 3).map((record, i) => {
                const medalColors = [AMBER, "#8E8E93", "#cd7f32"];
                const color = medalColors[i] || theme.textSecondary;
                const dateStr = formatRelativeDate(record.data);
                const nome = record.nome;
                const exercicioId = record.id_exercicio;

                return (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Recorde de ${nome}`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (exercicioId) {
                        router.push({ pathname: "/exercise-progress/[id]", params: { id: String(exercicioId), nome } });
                      }
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <Card
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 16,
                        borderWidth: 2,
                        borderColor: theme.backgroundTertiary,
                      }}
                    >
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: color + "18",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 16,
                      }}>
                        <Ionicons name="trophy" size={22} color={color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                          {nome}
                        </Text>
                        {dateStr && (
                          <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                            Superado a {dateStr}
                          </Text>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: theme.accent, fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }}>
                          {record.peso} kg
                        </Text>
                        <Text style={{ color: theme.textTertiary, fontSize: 10, marginTop: 2, fontWeight: "600" }}>
                          RECORD
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xs }}>
            <SectionHeader title="Conquistas" />
            <Text variant="footnote" color="textSecondary" style={{ fontWeight: "600" }}>
              {unlockedBadges.length}/{badges.length}
            </Text>
          </View>
          
          {/* Unlocked progress bar */}
          <View style={{ height: 6, backgroundColor: theme.backgroundTertiary, borderRadius: 3, overflow: "hidden", marginBottom: spacing.lg }}>
            <View style={{
              width: `${(unlockedBadges.length / badges.length) * 100}%`,
              height: "100%",
              backgroundColor: theme.accent,
              borderRadius: 3,
            }} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.xxs, paddingVertical: spacing.xs }}
          >
            {orderedBadges.map((badge) => (
              <Pressable
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                accessibilityRole="button"
                accessibilityLabel={badge.name}
                style={({ pressed }) => ({
                  width: 96,
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: radius.xl,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xs,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: badge.unlocked ? badge.color : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: badge.unlocked ? 0.15 : 0,
                  shadowRadius: 6,
                  elevation: badge.unlocked ? 2 : 0,
                })}
              >
                {badge.unlocked ? (
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: badge.color + "12",
                    borderWidth: 2,
                    borderColor: badge.color,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                    shadowColor: badge.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Ionicons name={badge.icon as any} size={24} color={badge.color} />
                  </View>
                ) : (
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.backgroundTertiary,
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: spacing.sm,
                    position: "relative",
                  }}>
                    <Ionicons name={badge.icon as any} size={24} color={theme.textTertiary} style={{ opacity: 0.6 }} />
                    <View style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      backgroundColor: theme.backgroundSecondary,
                      borderRadius: 8,
                      width: 16,
                      height: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: theme.border,
                    }}>
                      <Ionicons name="lock-closed" size={10} color={theme.textTertiary} />
                    </View>
                  </View>
                )}
                <Text variant="subhead" style={{ color: badge.unlocked ? theme.text : theme.textTertiary, textAlign: "center", fontWeight: "600" }} numberOfLines={1}>
                  {badge.name.split(" ")[0]}
                </Text>
                <Text variant="footnote" style={{ color: theme.textTertiary, textAlign: "center", fontSize: 10 }} numberOfLines={1}>
                  {badge.name.split(" ").slice(1).join(" ") || " "}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Text variant="caption" color="textTertiary" style={{ textAlign: "center", marginTop: spacing.xl, marginBottom: spacing.sm }}>
          GoLift v1.0.0
        </Text>
      </ScrollView>

      <Modal visible={showAllRecords} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: MODAL_BACKDROP, justifyContent: "flex-end" }}>
          <Card padding={0} style={{ borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: safeBottom + spacing.xl, maxHeight: "85%" }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: spacing.md, marginBottom: spacing.xl }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg }}>
              <Text variant="title2" color="text">Todos os Recordes</Text>
              <Pressable
                onPress={() => setShowAllRecords(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                style={({ pressed }) => ({ backgroundColor: theme.backgroundTertiary, borderRadius: radius.md, padding: spacing.sm, opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="close" size={iconSize.sm} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xxl, paddingBottom: spacing.lg }}>
              <Card padding={0} style={{ overflow: "hidden" }}>
                {exercisesGrouped.map((record, i) => {
                  const mc = [AMBER, "#8E8E93", "#cd7f32"];
                  const color = mc[i] || theme.textSecondary;
                  const dateStr = formatRelativeDate(record.data);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const exercicioId = record.id_exercicio;
                        const nome = record.nome;
                        if (exercicioId) {
                          router.push({ pathname: "/exercise-progress/[id]", params: { id: String(exercicioId), nome } });
                          setShowAllRecords(false);
                        }
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.md,
                        borderBottomWidth: i < exercisesGrouped.length - 1 ? 1 : 0,
                        borderBottomColor: theme.backgroundSecondary,
                        backgroundColor: pressed ? theme.backgroundTertiary : "transparent",
                      })}
                    >
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: color + (i < 3 ? "15" : "05"),
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: spacing.md,
                        borderWidth: 1.5,
                        borderColor: i < 3 ? color + "30" : "transparent",
                      }}>
                        {i < 3 ? (
                          <Ionicons name="trophy" size={14} color={color} />
                        ) : (
                          <Text variant="subhead" style={{ color: theme.textSecondary, fontWeight: "700" }}>{i + 1}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="callout" color="text" style={{ fontWeight: "600", marginBottom: spacing.xxs }}>
                          {record.nome}
                        </Text>
                        {dateStr && <Text variant="footnote" color="textTertiary">{dateStr}</Text>}
                      </View>
                      <View style={{ alignItems: "flex-end", marginRight: spacing.sm }}>
                        <Text variant="headline" style={{ color: i < 3 ? color : theme.text, fontWeight: "800" }}>
                          {record.peso}
                        </Text>
                        <Text variant="footnote" color="textSecondary">kg</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={iconSize.xs} color={theme.textTertiary} />
                    </Pressable>
                  );
                })}
              </Card>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      <Modal visible={!!selectedBadge} animationType="fade" transparent>
        <Pressable
          style={{ flex: 1, backgroundColor: MODAL_BACKDROP, justifyContent: "center", alignItems: "center", padding: spacing.xxxl }}
          onPress={() => setSelectedBadge(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={{ alignItems: "center", width: 280, padding: radius.xxl }}>
              <View style={{
                backgroundColor: selectedBadge?.unlocked ? theme.accentGreen + "15" : theme.backgroundTertiary,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}>
                <Ionicons
                  name={selectedBadge?.unlocked ? "checkmark-circle" : "lock-closed"}
                  size={12}
                  color={selectedBadge?.unlocked ? theme.accentGreen : theme.textSecondary}
                />
                <Text variant="caption" style={{ color: selectedBadge?.unlocked ? theme.accentGreen : theme.textSecondary, fontSize: 10 }}>
                  {selectedBadge?.unlocked ? "Desbloqueado" : "Bloqueado"}
                </Text>
              </View>

              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: (selectedBadge?.color || "#888") + "12",
                borderWidth: 2,
                borderColor: selectedBadge?.unlocked ? selectedBadge.color : theme.border,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: spacing.lg,
                shadowColor: selectedBadge?.unlocked ? selectedBadge.color : "transparent",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: selectedBadge?.unlocked ? 0.25 : 0,
                shadowRadius: 10,
                elevation: selectedBadge?.unlocked ? 6 : 0,
              }}>
                <Ionicons
                  name={(selectedBadge?.icon as any) || "help"}
                  size={36}
                  color={selectedBadge?.unlocked ? selectedBadge.color : theme.textTertiary}
                  style={{ opacity: selectedBadge?.unlocked ? 1 : 0.6 }}
                />
              </View>

              <Text variant="title3" color="text" style={{ marginBottom: spacing.sm, textAlign: "center" }}>
                {selectedBadge?.name}
              </Text>
              
              <Text variant="callout" color="textSecondary" style={{ textAlign: "center", lineHeight: 21, marginBottom: spacing.xl }}>
                {selectedBadge?.unlocked ? selectedBadge.description : selectedBadge?.lockHint}
              </Text>

              {selectedBadge?.unlocked && selectedBadge.unlockedAt && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xl }}>
                  <Ionicons name="calendar-outline" size={12} color={theme.textTertiary} />
                  <Text variant="footnote" color="textTertiary">
                    Conquistada {formatRelativeDate(selectedBadge.unlockedAt)}
                  </Text>
                </View>
              )}

              <Button variant="primary" size="md" style={{ width: "100%" }} onPress={() => setSelectedBadge(null)}>
                Fechar
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>


    </>
  );
}
