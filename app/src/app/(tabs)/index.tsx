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

  // Gerar histórico de streak da semana (dom-sab)
  // Esta função cria um array com os 7 dias da semana atual (Seg-Dom)
  function generateStreakWeek() {
    const today = new Date();
    // Calcular a segunda-feira desta semana (dia 1 = segunda)
    const dayOfWeek = today.getDay(); // 0=Dom, 1=Seg...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    
    const weekDays = [];
    const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    
    // Criar um dia para cada dia da semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      // Usar data local (não UTC) para evitar problemas de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      weekDays.push({
        day: dayNames[i],
        date: `${year}-${month}-${day}`,
        completed: false
      });
    }
    
    return weekDays;
  }

  async function loadData() {
    try {
      const profileRes = await supabase
        .from("profiles").select("xp, nivel").eq("id", user!.id).maybeSingle();
      const profile = profileRes.data;

      const [workouts, statsData, streakData] = await Promise.all([
        workoutApi.getUserWorkouts(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        metricsApi.getStreak(user!.id).catch(() => null),
      ]);

      // Check-in check
      const hoje = new Date().toISOString().split("T")[0];
      const { data: checkinHoje } = await supabase
        .from("daily_readiness")
        .select("id")
        .eq("user_id", user!.id)
        .eq("data", hoje)
        .maybeSingle();
      setPrecisaCheckin(!checkinHoje);

      if (profile) {
        setXP(profile.xp ?? 0);
        setNivel(profile.nivel ?? 1);
      }
      
      // Obter histórico de treinos
      const historyItems: any[] = await metricsApi.getHistory(user!.id).catch(() => []);

      const recentSessions = [...historyItems]
        .filter((s: any) => s.id_treino && (s.data_inicio || s.data))
        .sort((a: any, b: any) => {
          const dateA = new Date(a.data_inicio || a.data).getTime();
          const dateB = new Date(b.data_inicio || b.data).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);

      if (recentSessions.length === 0) {
        const workoutsList = Array.isArray(workouts) ? workouts : [];
        const seenWorkouts = new Set<string>();
        const uniqueWorkouts = workoutsList.filter((w: any) => {
          const key = w.nome || w.name || w.id_treino;
          if (seenWorkouts.has(key)) return false;
          seenWorkouts.add(key);
          return true;
        });
        setRecentWorkouts(uniqueWorkouts.slice(0, 3));
      } else {
        setRecentWorkouts(recentSessions);
      }

      const weekDays = generateStreakWeek();
      const workoutDates = new Set(
        historyItems.map((item: any) => {
          const dateStr = item.data_inicio || item.data;
          if (dateStr) {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          return null;
        }).filter(Boolean) as string[]
      );
      
      weekDays.forEach((day) => {
        day.completed = workoutDates.has(day.date);
      });
      
      setStreakHistory(weekDays);
      
      if (statsData) {
        setStats(statsData);
      }
      if (streakData) {
        setStreak(streakData.streak || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleStartWorkout(workout: any) {
    const workoutName = workout.nome || workout.name || "Treino";
    
    Alert.alert(
      "Começar Treino",
      `Deseja começar: ${workoutName}?`,
      [
        {
          text: "Cancelar",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sim, começar",
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: "/workout/[id]",
                params: { id: workout.id_treino }
              });
            } catch (error) {
              Alert.alert("Erro", "Erro ao iniciar treino");
              console.error("Erro ao iniciar treino:", error);
            }
          },
          style: "default",
        },
      ]
    );
  }

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 19) return "Boa tarde";
    return "Boa noite";
  }

  function getStreakColor(streak: number): string {
    if (streak === 0) return theme.textTertiary;
    if (streak <= 5) return theme.accentBlue;
    if (streak <= 10) return theme.accentGreen;
    if (streak <= 15) return "#f59e0b";
    if (streak <= 20) return theme.accent;
    return "#d946ef";
  }

  function getStreakBackgroundColor(streak: number): string {
    const colorMap: { [key: string]: string } = {
      [theme.textTertiary]: theme.backgroundTertiary,
      [theme.accentBlue]: theme.backgroundTertiary,
      [theme.accentGreen]: theme.backgroundTertiary,
      "#f59e0b": theme.backgroundTertiary,
      [theme.accent]: theme.backgroundTertiary,
      "#d946ef": theme.backgroundTertiary,
    };
    return colorMap[getStreakColor(streak)] || theme.backgroundTertiary;
  }

  function formatSessionAge(dateStr: string): string {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} sem.`;
    return `Há ${Math.floor(diffDays / 30)} mês`;
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: safeBottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── HEADER ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 15, fontWeight: "500", marginBottom: 4 }}>
            {getGreeting()},
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: theme.text, fontSize: 34, fontWeight: "800", letterSpacing: -1.2, flex: 1 }}>
              {user?.nome
                ? user.nome.charAt(0).toUpperCase() + user.nome.slice(1)
                : "Atleta"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowStreakModal(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: theme.backgroundSecondary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color={streak > 0 ? "#FF9F0A" : theme.textTertiary} />
              <Text style={{ color: streak > 0 ? "#FF9F0A" : theme.textTertiary, fontWeight: "700", fontSize: 15 }}>
                {streak}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHECK-IN PROMPT ── */}
        {precisaCheckin ? (
          <TouchableOpacity
            onPress={() => router.push("/checkin")}
            style={{
              marginHorizontal: 20, marginBottom: 16,
              backgroundColor: theme.accent + "15",
              borderRadius: 18, padding: 16,
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
            activeOpacity={0.7}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.accent + "25",
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name="moon" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>
                Check-in Diário
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                Como dormiste? Conta-me como te sentes hoje
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {}}
            style={{
              marginHorizontal: 20, marginBottom: 16,
              backgroundColor: theme.accentGreen + "12",
              borderRadius: 18, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 10,
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.accentGreen} />
            <Text style={{ color: theme.accentGreen, fontWeight: "600", fontSize: 13 }}>
              Check-in de hoje feito
            </Text>
          </TouchableOpacity>
        )}

        {/* ── STREAK BAR (XP + Level) ── */}
        <StreakBar streak={streak} xp={xp} nivel={nivel} xpProximoNivel={nivel * 100} />

        {/* ── ATIVIDADE DA SEMANA (inline, sempre visível) ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700", letterSpacing: 0.2 }}>
              SEMANA
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              {streakHistory.filter(d => d.completed).length} de 7 dias
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {streakHistory.map((dayData, i) => {
              const isToday = dayData.date === (() => {
                const now = new Date();
                return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
              })();
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: isToday ? theme.accent : theme.textTertiary, letterSpacing: 0.3 }}>
                    {dayData.day.toUpperCase()}
                  </Text>
                  <View style={{
                    width: "100%",
                    aspectRatio: 1,
                    borderRadius: 10,
                    backgroundColor: dayData.completed
                      ? theme.accentGreen
                      : isToday
                        ? theme.accent + "30"
                        : theme.backgroundSecondary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isToday && !dayData.completed ? 1.5 : 0,
                    borderColor: theme.accent,
                  }}>
                    {dayData.completed && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          {/* Barra de progresso semanal */}
          <View style={{ marginTop: 14, height: 3, backgroundColor: theme.backgroundSecondary, borderRadius: 2, overflow: "hidden" }}>
            <View style={{
              height: 3,
              width: `${(streakHistory.filter(d => d.completed).length / 7) * 100}%`,
              backgroundColor: theme.accentGreen,
              borderRadius: 2,
            }} />
          </View>
        </View>

        {/* ── FRASE DO DIA ── */}
        {dailyPhrase ? (
          <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
            <View style={{
              backgroundColor: theme.accent + "12",
              borderRadius: 18,
              padding: 18,
              borderLeftWidth: 3,
              borderLeftColor: theme.accent,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <Ionicons name="sparkles" size={16} color={theme.accent} style={{ marginTop: 2 }} />
              <Text style={{ color: theme.text, fontSize: 14, lineHeight: 22, flex: 1, fontStyle: "italic", letterSpacing: 0.1 }}>
                {dailyPhrase}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── STATS ── */}
        <View style={{ paddingHorizontal: 24, gap: 12, marginBottom: 36 }}>
          {/* Hero stat */}
          <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
              Total de Treinos
            </Text>
            <Text style={{ fontSize: 58, fontWeight: "800", color: "#fff", letterSpacing: -2.5, lineHeight: 60 }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 8, fontWeight: "500" }}>
              sessões completadas
            </Text>
          </View>
          {/* Secondary */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 20 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                Esta Semana
              </Text>
              <Text style={{ fontSize: 38, fontWeight: "800", color: theme.text, letterSpacing: -1.5 }}>
                {stats.thisWeek}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 20 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
                Tempo Total
              </Text>
              <Text style={{ fontSize: 38, fontWeight: "800", color: theme.text, letterSpacing: -1.5 }}>
                {formatTime(stats.totalTime)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── TREINOS RECENTES ── */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.5 }}>
              Sessões Recentes
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")} activeOpacity={0.6}>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
                Ver todos
              </Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length === 0 ? (
            <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 24, padding: 36, alignItems: "center" }}>
              <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.backgroundTertiary, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="barbell-outline" size={32} color={theme.textTertiary} />
              </View>
              <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, marginBottom: 6 }}>
                Sem sessões ainda
              </Text>
              <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
                Faz o teu primeiro treino e vê o teu progresso aqui
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/workouts")}
                style={{ backgroundColor: theme.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                  Criar Treino
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {recentWorkouts.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id_sessao || workout.id_treino || index}
                  onPress={() => handleStartWorkout(workout)}
                  style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderRadius: 18,
                    overflow: "hidden",
                    flexDirection: "row",
                  }}
                  activeOpacity={0.7}
                >
                  {/* Accent stripe */}
                  <View style={{ width: 4, backgroundColor: theme.accent }} />
                  <View style={{ flex: 1, padding: 18, flexDirection: "row", alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.3, marginBottom: 4 }}>
                        {workout.nome || workout.nome_treino || workout.name || "Treino"}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                        {(workout.data_inicio || workout.data)
                          ? formatSessionAge(workout.data_inicio || workout.data)
                          : `${workout.num_exercicios ?? 0} exercícios`}
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
      <Modal
        visible={showStreakModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            paddingBottom: safeBottom + 24,
          }}>
            {/* handle */}
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 28 }} />

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
              <Ionicons name="flame" size={28} color="#FF9F0A" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, letterSpacing: -0.8 }}>
                  {streak} dias seguidos
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>
                  Continua assim — não quebres a sequência
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowStreakModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Dias da semana */}
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
              Esta Semana
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 28 }}>
              {streakHistory.map((dayData, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: theme.textTertiary }}>
                    {dayData.day}
                  </Text>
                  <View style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: dayData.completed ? theme.accentGreen : theme.backgroundTertiary,
                  }}>
                    {dayData.completed
                      ? <Ionicons name="checkmark" size={18} color="white" />
                      : <Text style={{ color: theme.textTertiary, fontWeight: "600", fontSize: 13 }}>{new Date(dayData.date).getDate()}</Text>
                    }
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowStreakModal(false)}
              style={{ backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Teste do Gorila — remover depois */}
      <View style={{ position: 'absolute', bottom: 100, right: 16, gap: 8 }}>
        <TouchableOpacity
          onPress={() => gorila.celebrar('Grande treino! 3 dias de streak! 🔥')}
          style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>🎉</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => gorila.say('Dormiste mal esta noite? Vou ajustar o treino.', 'concerned')}
          style={{ backgroundColor: '#FF9F0A', padding: 10, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>😟</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => gorila.show({
            estado: 'challenging',
            texto: 'Vamos aumentar a carga hoje! Estás pronto? 💪',
            acoes: [
              { label: 'Sim, bora!', primary: true, onPress: () => {} },
              { label: 'Hoje não', onPress: () => {} },
            ]
          })}
          style={{ backgroundColor: '#005CE6', padding: 10, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>💪</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
