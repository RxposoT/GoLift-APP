import { useState, useEffect, useRef, useMemo } from "react";
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
import { router } from "expo-router";
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
    <View>
      <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: spacing.sm }}>
        {IMC_SEGMENTS.map((seg) => (
          <View
            key={seg.from}
            style={{ width: `${((seg.to - seg.from) / IMC_TOTAL) * 100}%` as any, backgroundColor: seg.color }}
          />
        ))}
      </View>
      <View style={{ position: "relative", height: 14, marginBottom: spacing.sm }}>
        <View style={{
          position: "absolute",
          left: `${pct}%` as any,
          transform: [{ translateX: -6 }],
          top: 0,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: imcCategory.color,
          borderWidth: 2,
          borderColor: theme.backgroundSecondary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="caption" color="textTertiary" style={{ fontSize: 10 }}>14</Text>
        <Text variant="footnote" style={{ color: imcCategory.color, fontWeight: "700" }}>
          {imc.toFixed(1)} — {imcCategory.label}
        </Text>
        <Text variant="caption" color="textTertiary" style={{ fontSize: 10 }}>42+</Text>
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

  useEffect(() => {
    if (user?.id) loadData();
  }, [user]);

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
            <Card padding={0} style={{ overflow: "hidden", flexDirection: "row" }}>
              <View style={{ width: 4, backgroundColor: theme.accentGreen }} />
              <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text variant="body" color="text" style={{ fontWeight: "700", marginBottom: spacing.xxs }}>
                    {lastSession.nome_treino || lastSession.nome || "Treino"}
                  </Text>
                  <Text variant="subhead" color="textSecondary">
                    {formatRelativeDate(lastSession.data_fim || lastSession.data_inicio)}
                    {(lastSession.duracao_segundos || 0) > 0 ? ` · ${formatTime(lastSession.duracao_segundos)}` : ""}
                  </Text>
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => lastSession.id_treino && router.push({ pathname: "/workout/[id]", params: { id: lastSession.id_treino } })}
                >
                  ▶ Recomeçar
                </Button>
              </View>
            </Card>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <SectionHeader title="Dados Físicos" />
          <Card padding={0} style={{ overflow: "hidden" }}>
            {[
              { label: "Idade",  value: profile?.idade  ? `${profile.idade} anos` : null },
              { label: "Peso",   value: profile?.peso   ? `${profile.peso} kg`    : null },
              { label: "Altura", value: profile?.altura ? `${profile.altura} cm`  : null },
            ].map((item) => (
              <View key={item.label} style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.backgroundTertiary,
              }}>
                <Text variant="callout" color="textSecondary" style={{ flex: 1 }}>{item.label}</Text>
                <Text variant="callout" style={{ color: item.value ? theme.text : theme.textTertiary, fontWeight: "600" }}>
                  {item.value ?? "Não definido"}
                </Text>
              </View>
            ))}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: imc ? spacing.lg : spacing.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: imc ? spacing.lg : 0 }}>
                <Text variant="callout" color="textSecondary" style={{ flex: 1 }}>IMC</Text>
                {!imc && (
                  <Text variant="subhead" style={{ color: theme.textTertiary, fontWeight: "600" }}>
                    Define peso e altura
                  </Text>
                )}
              </View>
              {imc ? <IMCBar imc={imc} /> : null}
            </View>
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <SectionHeader title="Melhores Recordes" />
            {records.length > 3 && (
              <Pressable onPress={() => setShowAllRecords(true)} accessibilityRole="button" accessibilityLabel="Ver todos os recordes">
                <Text variant="subhead" style={{ color: theme.accent, fontWeight: "600" }}>Ver todos ({records.length})</Text>
              </Pressable>
            )}
          </View>

          {records.length === 0 ? (
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
              {records.slice(0, 3).map((record, i) => {
                const medalColors = [AMBER, "#94a3b8", "#cd7f32"];
                const color = medalColors[i];
                const dateStr = formatRelativeDate(record.data_recorde || record.data || record.created_at);
                const nome = record.nome_exercicio || record.exercicio || record.exercise || "";
                const exercicioId = record.id_exercicio || record.exercicio_id;

                return (
                  <Card key={i} padding={0} style={{ overflow: "hidden" }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Recorde de ${nome}`}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (exercicioId) {
                          router.push({ pathname: "/exercise-progress/[id]", params: { id: String(exercicioId), nome } });
                        }
                      }}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.lg,
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <View style={{ width: 26, alignItems: "center", marginRight: spacing.lg }}>
                        <Ionicons name="medal" size={22} color={color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text variant="headline" color="text" style={{ fontWeight: "500" }} numberOfLines={1}>
                          {nome}
                        </Text>
                        {dateStr && (
                          <Text variant="footnote" color="textSecondary" style={{ marginTop: spacing.xxs }}>{dateStr}</Text>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text variant="title3" style={{ color, fontSize: 22 }}>
                          {record.peso || record.weight}
                        </Text>
                        <Text variant="caption" color="textSecondary" style={{ marginTop: -2 }}>kg</Text>
                      </View>
                    </Pressable>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg }}>
            <SectionHeader title="Conquistas" />
            <Text variant="footnote" color="textTertiary">
              {unlockedBadges.length}/{badges.length} desbloqueadas
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xxs, paddingVertical: spacing.xs }}
          >
            {orderedBadges.map((badge) => (
              <Pressable
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                accessibilityRole="button"
                accessibilityLabel={badge.name}
                style={({ pressed }) => ({
                  width: 100,
                  height: 120,
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: radius.lg,
                  paddingVertical: spacing.lg,
                  paddingHorizontal: spacing.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : badge.unlocked ? 1 : 0.4,
                })}
              >
                <View style={{ width: 48, height: 48, borderRadius: radius.lg, backgroundColor: badge.color + "18", justifyContent: "center", alignItems: "center", marginBottom: spacing.sm }}>
                  <Ionicons name={badge.icon as any} size={22} color={badge.color} />
                </View>
                <Text variant="caption" style={{ color: badge.unlocked ? theme.text : theme.textTertiary, textAlign: "center" }} numberOfLines={2}>
                  {badge.name}
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
                {records.map((record, i) => {
                  const mc = [AMBER, "#94a3b8", "#cd7f32"];
                  const dateStr = formatRelativeDate(record.data_recorde || record.data || record.created_at);
                  return (
                    <Pressable
                      key={i}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const exercicioId = record.id_exercicio || record.exercicio_id;
                        const nome = record.nome_exercicio || record.exercicio || record.exercise || "";
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
                        borderBottomWidth: i < records.length - 1 ? 1 : 0,
                        borderBottomColor: theme.backgroundSecondary,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <View style={{ width: 28, height: 28, borderRadius: spacing.sm, backgroundColor: (mc[i] || theme.accent) + "18", justifyContent: "center", alignItems: "center", marginRight: spacing.lg }}>
                        {i < 3 ? (
                          <Ionicons name="trophy" size={iconSize.xs} color={mc[i]} />
                        ) : (
                          <Text variant="footnote" style={{ color: theme.textSecondary, fontWeight: "800" }}>#{i + 1}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="callout" color="text" style={{ fontWeight: "500", marginBottom: spacing.xxs }}>
                          {record.nome_exercicio || record.exercicio || record.exercise}
                        </Text>
                        {dateStr && <Text variant="footnote" color="textTertiary">{dateStr}</Text>}
                      </View>
                      <View style={{ alignItems: "flex-end", marginRight: spacing.sm }}>
                        <Text variant="headline" style={{ color: mc[i] || theme.accent, fontWeight: "800" }}>
                          {record.peso || record.weight}
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
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: (selectedBadge?.color || "#888") + "18", justifyContent: "center", alignItems: "center", marginBottom: spacing.md }}>
                <Ionicons name={(selectedBadge?.icon as any) || "help"} size={36} color={selectedBadge?.color || "#888"} />
              </View>
              <Text variant="title3" color="text" style={{ marginBottom: spacing.sm, textAlign: "center" }}>
                {selectedBadge?.name}
              </Text>
              <Text variant="callout" color="textSecondary" style={{ textAlign: "center", lineHeight: 21, marginBottom: spacing.lg }}>
                {selectedBadge?.unlocked ? selectedBadge.description : selectedBadge?.lockHint}
              </Text>
              {selectedBadge?.unlocked && selectedBadge.unlockedAt && (
                <Text variant="footnote" color="textTertiary" style={{ marginBottom: spacing.md }}>
                  Desbloqueada {formatRelativeDate(selectedBadge.unlockedAt)}
                </Text>
              )}
              {!selectedBadge?.unlocked && (
                <View style={{ backgroundColor: theme.backgroundTertiary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
                  <Ionicons name="lock-closed" size={12} color={theme.textTertiary} />
                  <Text variant="footnote" color="textTertiary" style={{ fontWeight: "600" }}>Bloqueada</Text>
                </View>
              )}
              <Button variant="primary" size="md" onPress={() => setSelectedBadge(null)}>Fechar</Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>


    </>
  );
}
