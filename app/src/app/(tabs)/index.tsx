import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { Text, Card, Button, EmptyState } from "../../components/ui";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, workoutApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { formatTime, formatRelativeDate } from "../../utils/format";
import { generateStreakWeek } from "../../utils/streak";
import StreakBar from "../../components/StreakBar";
import { supabase } from "../../lib/supabase";
import { useGorila } from "../../components/gorila/GorilaContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, radius } from "../../styles/tokens";
import { STREAK_ORANGE, MODAL_BACKDROP } from "../../styles/colors";

export default function Home() {
  const { user } = useAuth();
  const theme = useTheme();
  const { paddingTop: safeTop, paddingBottom: safeBottom } = useAndroidInsets();
  const gorila = useGorila();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xp, setXP] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [streakHistory, setStreakHistory] = useState<Array<{day: string, date: string, completed: boolean}>>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalTime: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [dailyPhrase, setDailyPhrase] = useState<string | null>(null);
  const dailyCheckinRef = useRef({ sonoHoras: 7, sonoQualidade: 3, energia: 3, stress: 3 });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    planoApi.getDailyPhrase().then(d => setDailyPhrase(d.frase)).catch(() => {});
  }, [user]);

  async function loadData() {
    try {
      const profileRes = await supabase.from("profiles").select("xp, nivel").eq("id", user!.id).maybeSingle();
      const profile = profileRes.data;
      const [workouts, statsData, streakData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        metricsApi.getStreak(user!.id).catch(() => null),
      ]);
      const hoje = getTodayKey();
      const { data: checkinHoje } = await supabase.from("daily_readiness").select("id").eq("user_id", user!.id).eq("data", hoje).maybeSingle();
      await mostrarGorilaDoDia(Boolean(checkinHoje));
      if (profile) { setXP(profile.xp ?? 0); setNivel(profile.nivel ?? 1); }
      const historyItems: any[] = await metricsApi.getHistory(user!.id).catch(() => []);
      const recentSessions = [...historyItems].filter((s: any) => s.id_treino && (s.data_fim || s.data_inicio || s.data))
        .sort((a: any, b: any) => new Date(b.data_inicio || b.data).getTime() - new Date(a.data_inicio || a.data).getTime())
        .slice(0, 3);
      if (recentSessions.length === 0) {
        const workoutsList = Array.isArray(workouts) ? workouts : [];
        const seenWorkouts = new Set<string>();
        setRecentWorkouts(workoutsList.filter((w: any) => { const k = w.nome || w.name || w.id_treino; if (seenWorkouts.has(k)) return false; seenWorkouts.add(k); return true; }).slice(0, 3));
      } else { setRecentWorkouts(recentSessions); }
      const weekDays = generateStreakWeek();
      const workoutDates = new Set(historyItems.map((item: any) => { const ds = item.data_fim || item.data_inicio || item.data; if (ds) { const d = new Date(ds); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; } return null; }).filter(Boolean) as string[]);
      weekDays.forEach(d => { d.completed = workoutDates.has(d.date); });
      setStreakHistory(weekDays);
      if (statsData) setStats(statsData);
      if (streakData) setStreak(streakData.streak || 0);
    } catch (error) { console.error("Erro ao carregar dados:", error); }
  }

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  function getTodayKey() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  }

  async function mostrarGorilaDoDia(checkinConcluido: boolean) {
    if (!user?.id) return;
    const hoje = getTodayKey();
    const chave = `@golift:gorila:abertura:${user.id}`;
    const ultimaAbertura = await AsyncStorage.getItem(chave).catch(() => null);
    if (ultimaAbertura === hoje) return;

    // Marcar antes de abrir evita que o gorila reapareça ao navegar ou reabrir a app.
    await AsyncStorage.setItem(chave, hoje).catch(() => {});
    setTimeout(() => {
      if (checkinConcluido) {
        gorila.say(`${getGreeting()}! O teu diagnóstico de hoje já está registado.`, 'greeting');
      } else {
        iniciarDiagnosticoDiario();
      }
    }, 700);
  }

  function iniciarDiagnosticoDiario() {
    dailyCheckinRef.current = { sonoHoras: 7, sonoQualidade: 3, energia: 3, stress: 3 };
    perguntarSono();
  }

  function perguntarSono() {
    gorila.show({
      estado: 'greeting', texto: `${getGreeting()}! Antes do treino, como dormiste?`, presentation: 'choices',
      acoes: [
        { label: 'Menos de 5 horas', onPress: () => { dailyCheckinRef.current.sonoHoras = 3; perguntarQualidadeSono(); } },
        { label: 'Entre 5 e 6 horas', onPress: () => { dailyCheckinRef.current.sonoHoras = 5; perguntarQualidadeSono(); } },
        { label: 'Entre 7 e 8 horas', primary: true, onPress: () => { dailyCheckinRef.current.sonoHoras = 7; perguntarQualidadeSono(); } },
        { label: 'Mais de 8 horas', onPress: () => { dailyCheckinRef.current.sonoHoras = 9; perguntarQualidadeSono(); } },
      ],
    });
  }

  function perguntarQualidadeSono() {
    gorila.show({
      estado: 'talking', texto: 'E a qualidade do sono?', presentation: 'choices',
      acoes: [1, 2, 3, 4, 5].map((valor) => ({
        label: valor === 1 ? 'Péssima' : valor === 5 ? 'Excelente' : `${valor} de 5`, primary: valor === 3,
        onPress: () => { dailyCheckinRef.current.sonoQualidade = valor; perguntarEnergia(); },
      })),
    });
  }

  function perguntarEnergia() {
    gorila.show({
      estado: 'talking', texto: 'Quanta energia tens neste momento?', presentation: 'choices',
      acoes: [1, 2, 3, 4, 5].map((valor) => ({
        label: valor === 1 ? 'Muito pouca' : valor === 5 ? 'Muita energia' : `${valor} de 5`, primary: valor === 3,
        onPress: () => { dailyCheckinRef.current.energia = valor; perguntarStress(); },
      })),
    });
  }

  function perguntarStress() {
    gorila.show({
      estado: 'concerned', texto: 'E o stress hoje?', presentation: 'choices',
      acoes: [1, 2, 3, 4, 5].map((valor) => ({
        label: valor === 1 ? 'Estou calmo' : valor === 5 ? 'Muito elevado' : `${valor} de 5`, primary: valor === 3,
        onPress: () => { dailyCheckinRef.current.stress = valor; guardarDiagnosticoDiario(); },
      })),
    });
  }

  async function guardarDiagnosticoDiario() {
    if (!user?.id) return;
    const { sonoHoras, sonoQualidade, energia, stress } = dailyCheckinRef.current;
    const score = Math.round(sonoQualidade * 2 + energia * 2 + Math.min((sonoHoras / 8) * 2, 2) + (6 - stress) * 2);
    const prontidao = Math.max(1, Math.min(score, 10));
    const { error } = await supabase.from("daily_readiness").upsert({
      user_id: user.id, data: getTodayKey(), sono_horas: sonoHoras, sono_qualidade: sonoQualidade,
      energia, stress, musculo_dolorido: [], prontidao_score: prontidao,
    }, { onConflict: "user_id,data" });

    if (error) {
      gorila.say('Não consegui guardar o diagnóstico. Tenta novamente mais tarde.', 'concerned');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    gorila.show({
      estado: prontidao >= 7 ? 'celebrating' : prontidao <= 4 ? 'sad' : 'talking',
      texto: prontidao >= 7 ? `Boa base para hoje. Diagnóstico: ${prontidao}/10.` : `Registei ${prontidao}/10. Ajusta o ritmo ao teu corpo.`,
      autoFechar: 4500,
    });
  }

  async function handleStartWorkout(workout: any) {
    Alert.alert("Começar Treino", `Deseja começar: ${workout.nome || workout.name || "Treino"}?`, [
      { text: "Cancelar", onPress: () => {}, style: "cancel" },
      { text: "Sim, começar", onPress: async () => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: "/workout/[id]", params: { id: workout.id_treino } }); } catch (error) { Alert.alert("Erro", "Erro ao iniciar treino"); console.error(error); } }, style: "default" },
    ]);
  }

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Bom dia";
    if (h >= 12 && h < 19) return "Boa tarde";
    return "Boa noite";
  }

  function getStreakColor(s: number): string {
    if (s === 0) return theme.textTertiary;
    if (s <= 5) return theme.accentBlue;
    if (s <= 10) return theme.accentGreen;
    if (s <= 15) return "#f59e0b";
    if (s <= 20) return theme.accent;
    return "#d946ef";
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: safeBottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── HEADER ── */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: safeTop + spacing.lg, paddingBottom: spacing.sm }}>
          <Text variant="callout" color="textSecondary" style={{ marginBottom: spacing.xs }}>
            {getGreeting()},
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="title1" style={{ flex: 1 }}>
              {user?.nome ? user.nome.charAt(0).toUpperCase() + user.nome.slice(1) : "Atleta"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStreakModal(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: spacing.sm, borderRadius: 20 }}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color={streak > 0 ? STREAK_ORANGE : theme.textTertiary} />
              <Text variant="body" style={{ color: streak > 0 ? STREAK_ORANGE : theme.textTertiary, fontWeight: "700" }}>
                {streak}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STREAK BAR ── */}
        <StreakBar streak={streak} xp={xp} nivel={nivel} xpProximoNivel={nivel * 100} />

        {/* ── ATIVIDADE DA SEMANA ── */}
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xl, marginBottom: spacing.huge }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text variant="caption">SEMANA</Text>
            <Text variant="subhead" color="textSecondary">{streakHistory.filter(d => d.completed).length} de 7 dias</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {streakHistory.map((dayData, i) => {
              const isToday = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })() === dayData.date;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <Text variant="footnote" style={{ fontWeight: "600", color: isToday ? theme.accent : theme.textTertiary }}>{dayData.day.toUpperCase()}</Text>
                  <View style={{ width: "100%", aspectRatio: 1, borderRadius: 10, backgroundColor: dayData.completed ? theme.accentGreen : isToday ? theme.accent + "30" : theme.backgroundSecondary, alignItems: "center", justifyContent: "center", borderWidth: isToday && !dayData.completed ? 1.5 : 0, borderColor: theme.accent }}>
                    {dayData.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ marginTop: 14, height: 3, backgroundColor: theme.backgroundSecondary, borderRadius: 2, overflow: "hidden" }}>
            <View style={{ height: 3, width: `${(streakHistory.filter(d => d.completed).length / 7) * 100}%`, backgroundColor: theme.accentGreen, borderRadius: 2 }} />
          </View>
        </View>

        {/* ── FRASE DO DIA ── */}
        {dailyPhrase ? (
          <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.huge }}>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>NOTA DO DIA</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Text variant="display" style={{ color: theme.accent, lineHeight: 40, marginRight: spacing.sm }}>“</Text>
              <Text variant="title3" style={{ flex: 1, lineHeight: 27 }}>{dailyPhrase}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: theme.border, marginTop: spacing.lg, marginLeft: 34 }} />
          </View>
        ) : null}

        {/* ── STATS ── */}
        <View style={{ paddingHorizontal: spacing.xxl, gap: spacing.md, marginBottom: 36 }}>
          <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: spacing.xxl }}>
            <Text variant="caption" style={{ color: "rgba(255,255,255,0.55)", marginBottom: spacing.sm }}>Total de Treinos</Text>
            <Text variant="display" style={{ color: "#fff" }}>{stats.totalWorkouts}</Text>
            <Text variant="subhead" style={{ color: "rgba(255,255,255,0.45)", marginTop: spacing.sm }}>sessões completadas</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Card elevated={false} padding={spacing.xl} style={{ flex: 1 }}>
              <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>Esta Semana</Text>
              <Text variant="title1">{stats.thisWeek}</Text>
            </Card>
            <Card elevated={false} padding={spacing.xl} style={{ flex: 1 }}>
              <Text variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>Tempo Total</Text>
              <Text variant="title1">{formatTime(stats.totalTime)}</Text>
            </Card>
          </View>
        </View>

        {/* ── TREINOS RECENTES ── */}
        <View style={{ paddingHorizontal: spacing.xxl }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <Text variant="title3">Sessões Recentes</Text>
            <Button variant="ghost" size="sm" onPress={() => router.push("/(tabs)/workouts")}>Ver todos</Button>
          </View>

          {recentWorkouts.length === 0 ? (
            <Card padding={36}>
              <EmptyState
                icon="barbell-outline"
                title="Sem sessões ainda"
                subtitle="Faz o teu primeiro treino e começa a acompanhar o teu progresso!"
                actionLabel="Criar Treino"
                onAction={() => router.push("/(tabs)/workouts")}
              />
            </Card>
          ) : (
            <View>
              {recentWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id_sessao || workout.id_treino || index}
                  onPress={() => handleStartWorkout(workout)}
                  style={{ flexDirection: "row", alignItems: "stretch", paddingVertical: spacing.md, borderBottomWidth: index === recentWorkouts.length - 1 ? 0 : 1, borderBottomColor: theme.border }}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 42, alignItems: "center", paddingTop: 2 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: index === 0 ? theme.accent : theme.backgroundSecondary, justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name={index === 0 ? "barbell" : "time-outline"} size={16} color={index === 0 ? "#fff" : theme.textSecondary} />
                    </View>
                    {index !== recentWorkouts.length - 1 && <View style={{ width: 1, flex: 1, minHeight: 18, marginTop: 6, backgroundColor: theme.border }} />}
                  </View>
                  <View style={{ flex: 1, paddingLeft: spacing.sm, flexDirection: "row", alignItems: "center", minHeight: 54 }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="headline" style={{ marginBottom: spacing.xs }}>
                        {workout.nome || workout.nome_treino || workout.name || "Treino"}
                      </Text>
                      <Text variant="subhead" color="textSecondary">
                        {(workout.data_inicio || workout.data) ? formatRelativeDate(workout.data_inicio || workout.data) : `${workout.num_exercicios ?? 0} exercícios`}
                        {(workout.duracao_segundos || 0) > 0 ? ` · ${formatTime(workout.duracao_segundos)}` : ""}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color={theme.textTertiary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL STREAK ── */}
      <Modal visible={showStreakModal} transparent animationType="slide" onRequestClose={() => setShowStreakModal(false)}>
        <View style={{ flex: 1, backgroundColor: MODAL_BACKDROP, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xxxl, paddingBottom: safeBottom + spacing.xxl }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.huge }} />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.huge }}>
              <Ionicons name="flame" size={28} color={STREAK_ORANGE} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text variant="title1" style={{ fontSize: 26 }}>{streak} dias seguidos</Text>
                <Text variant="callout" color="textSecondary" style={{ marginTop: 2 }}>Continua assim — não quebres a sequência</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStreakModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text variant="caption" color="textSecondary" style={{ marginBottom: 14 }}>Esta Semana</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: spacing.huge }}>
              {streakHistory.map((dayData, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center", gap: spacing.sm }}>
                  <Text variant="caption" color="textTertiary" style={{ fontWeight: "600" }}>{dayData.day}</Text>
                  <View style={{ width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: dayData.completed ? theme.accentGreen : theme.backgroundTertiary }}>
                    {dayData.completed ? <Ionicons name="checkmark" size={18} color="white" /> : <Text variant="subhead" color="textTertiary">{new Date(dayData.date).getDate()}</Text>}
                  </View>
                </View>
              ))}
            </View>
            <Button variant="primary" onPress={() => setShowStreakModal(false)}>Fechar</Button>
          </View>
        </View>
      </Modal>

    </>
  );
}
