import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, workoutApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import StreakBar from "../../components/StreakBar";
import { supabase } from "../../lib/supabase";
import { useGorila } from "../../components/gorila/GorilaContext";
import { typography } from "../../styles/themes";

const T = typography;

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
  const [precisaCheckin, setPrecisaCheckin] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
    planoApi.getDailyPhrase().then(d => setDailyPhrase(d.frase)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!gorila || !user) return;
    const timer = setTimeout(() => {
      gorila.say('Bom dia! Pronto para mais um treino? Vamos nisso! 💪', 'greeting')
    }, 800)
    return () => clearTimeout(timer)
  }, [user])

  function generateStreakWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    const weekDays = [];
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      weekDays.push({ day: dayNames[i], date: `${year}-${month}-${day}`, completed: false });
    }
    return weekDays;
  }

  async function loadData() {
    try {
      const profileRes = await supabase.from("profiles").select("xp, nivel").eq("id", user!.id).maybeSingle();
      const profile = profileRes.data;
      const [workouts, statsData, streakData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        metricsApi.getStreak(user!.id).catch(() => null),
      ]);
      const hoje = new Date().toISOString().split("T")[0];
      const { data: checkinHoje } = await supabase.from("daily_readiness").select("id").eq("user_id", user!.id).eq("data", hoje).maybeSingle();
      setPrecisaCheckin(!checkinHoje);
      if (profile) { setXP(profile.xp ?? 0); setNivel(profile.nivel ?? 1); }
      const historyItems: any[] = await metricsApi.getHistory(user!.id).catch(() => []);
      const recentSessions = [...historyItems].filter((s: any) => s.id_treino && (s.data_inicio || s.data))
        .sort((a: any, b: any) => new Date(b.data_inicio || b.data).getTime() - new Date(a.data_inicio || a.data).getTime())
        .slice(0, 3);
      if (recentSessions.length === 0) {
        const workoutsList = Array.isArray(workouts) ? workouts : [];
        const seenWorkouts = new Set<string>();
        setRecentWorkouts(workoutsList.filter((w: any) => { const k = w.nome || w.name || w.id_treino; if (seenWorkouts.has(k)) return false; seenWorkouts.add(k); return true; }).slice(0, 3));
      } else { setRecentWorkouts(recentSessions); }
      const weekDays = generateStreakWeek();
      const workoutDates = new Set(historyItems.map((item: any) => { const ds = item.data_inicio || item.data; if (ds) { const d = new Date(ds); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; } return null; }).filter(Boolean) as string[]);
      weekDays.forEach(d => { d.completed = workoutDates.has(d.date); });
      setStreakHistory(weekDays);
      if (statsData) setStats(statsData);
      if (streakData) setStreak(streakData.streak || 0);
    } catch (error) { console.error("Erro ao carregar dados:", error); }
  }

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

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

  function formatSessionAge(dateStr: string): string {
    if (!dateStr) return "";
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} sem.`;
    return `Há ${Math.floor(diffDays / 30)} mês`;
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: safeBottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── HEADER ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8 }}>
          <Text style={[T.callout, { color: theme.textSecondary, marginBottom: 4 }]}>
            {getGreeting()},
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[T.title1, { color: theme.text, flex: 1 }]}>
              {user?.nome ? user.nome.charAt(0).toUpperCase() + user.nome.slice(1) : "Atleta"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStreakModal(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.backgroundSecondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color={streak > 0 ? "#FF9F0A" : theme.textTertiary} />
              <Text style={[{ color: streak > 0 ? "#FF9F0A" : theme.textTertiary }, T.body, { fontWeight: "700" }]}>
                {streak}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHECK-IN PROMPT ── */}
        {precisaCheckin ? (
          <TouchableOpacity
            onPress={() => router.push("/checkin")}
            style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.accent + "15", borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
            activeOpacity={0.7}
          >
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: theme.accent + "25", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="moon" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.headline, { color: theme.text }]}>Check-in Diário</Text>
              <Text style={[T.subhead, { color: theme.textSecondary }]}>Como dormiste? Conta-me como te sentes hoje</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {}}
            style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: theme.accentGreen + "12", borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.accentGreen} />
            <Text style={[{ color: theme.accentGreen }, T.subhead]}>Check-in de hoje feito</Text>
          </TouchableOpacity>
        )}

        {/* ── STREAK BAR ── */}
        <StreakBar streak={streak} xp={xp} nivel={nivel} xpProximoNivel={nivel * 100} />

        {/* ── ATIVIDADE DA SEMANA ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={[T.caption, { color: theme.text }]}>SEMANA</Text>
            <Text style={[T.subhead, { color: theme.textSecondary }]}>{streakHistory.filter(d => d.completed).length} de 7 dias</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {streakHistory.map((dayData, i) => {
              const isToday = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })() === dayData.date;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <Text style={[T.footnote, { fontWeight: "600", color: isToday ? theme.accent : theme.textTertiary }]}>{dayData.day.toUpperCase()}</Text>
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
          <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
            <View style={{ backgroundColor: theme.accent + "12", borderRadius: 18, padding: 18, borderLeftWidth: 3, borderLeftColor: theme.accent, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <Ionicons name="sparkles" size={16} color={theme.accent} style={{ marginTop: 2 }} />
              <Text style={[T.callout, { color: theme.text, flex: 1, fontStyle: "italic" }]}>{dailyPhrase}</Text>
            </View>
          </View>
        ) : null}

        {/* ── STATS ── */}
        <View style={{ paddingHorizontal: 24, gap: 12, marginBottom: 36 }}>
          <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 24 }}>
            <Text style={[T.caption, { color: "rgba(255,255,255,0.55)", marginBottom: 8 }]}>Total de Treinos</Text>
            <Text style={[T.display, { color: "#fff" }]}>{stats.totalWorkouts}</Text>
            <Text style={[T.subhead, { color: "rgba(255,255,255,0.45)", marginTop: 8 }]}>sessões completadas</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 20 }}>
              <Text style={[T.caption, { color: theme.textSecondary, marginBottom: 8 }]}>Esta Semana</Text>
              <Text style={[T.title1, { color: theme.text }]}>{stats.thisWeek}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 20 }}>
              <Text style={[T.caption, { color: theme.textSecondary, marginBottom: 8 }]}>Tempo Total</Text>
              <Text style={[T.title1, { color: theme.text }]}>{formatTime(stats.totalTime)}</Text>
            </View>
          </View>
        </View>

        {/* ── TREINOS RECENTES ── */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <Text style={[T.title3, { color: theme.text }]}>Sessões Recentes</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")} activeOpacity={0.6}>
              <Text style={[T.headline, { color: theme.accent }]}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length === 0 ? (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 36, alignItems: "center" }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.backgroundTertiary, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="barbell-outline" size={32} color={theme.textTertiary} />
              </View>
              <Text style={[T.headline, { color: theme.text, marginBottom: 6 }]}>Sem sessões ainda</Text>
              <Text style={[T.callout, { color: theme.textSecondary, textAlign: "center" }]}>Faz o teu primeiro treino e vê o teu progresso aqui</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")} style={{ backgroundColor: theme.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 24 }}>
                <Text style={[{ color: "white" }, T.headline]}>Criar Treino</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id_sessao || workout.id_treino || index}
                  onPress={() => handleStartWorkout(workout)}
                  style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 18, overflow: "hidden", flexDirection: "row" }}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 4, backgroundColor: theme.accent }} />
                  <View style={{ flex: 1, padding: 18, flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[T.headline, { color: theme.text, marginBottom: 4 }]}>
                        {workout.nome || workout.nome_treino || workout.name || "Treino"}
                      </Text>
                      <Text style={[T.subhead, { color: theme.textSecondary }]}>
                        {(workout.data_inicio || workout.data) ? formatSessionAge(workout.data_inicio || workout.data) : `${workout.num_exercicios ?? 0} exercícios`}
                        {(workout.duracao_segundos || 0) > 0 ? ` · ${formatTime(workout.duracao_segundos)}` : ""}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: theme.accent, borderRadius: 12, padding: 8 }}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── MODAL STREAK ── */}
      <Modal visible={showStreakModal} transparent animationType="slide" onRequestClose={() => setShowStreakModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: safeBottom + 24 }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 28 }} />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
              <Ionicons name="flame" size={28} color="#FF9F0A" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[T.title1, { color: theme.text, fontSize: 26 }]}>{streak} dias seguidos</Text>
                <Text style={[T.callout, { color: theme.textSecondary, marginTop: 2 }]}>Continua assim — não quebres a sequência</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStreakModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[T.caption, { color: theme.textSecondary, marginBottom: 14 }]}>Esta Semana</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 28 }}>
              {streakHistory.map((dayData, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                  <Text style={[T.caption, { fontWeight: "600", color: theme.textTertiary }]}>{dayData.day}</Text>
                  <View style={{ width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: dayData.completed ? theme.accentGreen : theme.backgroundTertiary }}>
                    {dayData.completed ? <Ionicons name="checkmark" size={18} color="white" /> : <Text style={[T.subhead, { color: theme.textTertiary }]}>{new Date(dayData.date).getDate()}</Text>}
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => setShowStreakModal(false)} style={{ backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}>
              <Text style={[{ color: "white" }, T.headline]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Teste do Gorila */}
      <View style={{ position: 'absolute', bottom: 100, right: 16, gap: 8 }}>
        <TouchableOpacity onPress={() => gorila.celebrar('Grande treino! 3 dias de streak! 🔥')} style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 12 }}>
          <Text style={[{ color: '#fff' }, T.caption]}>🎉</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => gorila.say('Dormiste mal esta noite? Vou ajustar o treino.', 'concerned')} style={{ backgroundColor: '#FF9F0A', padding: 10, borderRadius: 12 }}>
          <Text style={[{ color: '#fff' }, T.caption]}>😟</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => gorila.show({ estado: 'challenging', texto: 'Vamos aumentar a carga hoje! Estás pronto? 💪', acoes: [{ label: 'Sim, bora!', primary: true, onPress: () => {} }, { label: 'Hoje não', onPress: () => {} }] })} style={{ backgroundColor: '#005CE6', padding: 10, borderRadius: 12 }}>
          <Text style={[{ color: '#fff' }, T.caption]}>💪</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
