import React, { useState, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Modal,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, userApi, planoApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { MetricsScreenSkeleton } from "../../components/ui/SkeletonLoader";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Metrics() {
  const { user } = useAuth();
  const theme = useTheme();
  const { paddingTop: safeTop, paddingBottom: safeBottom } = useAndroidInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [records, setRecords] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalTime: 0,
    avgDuration: 0,
    thisMonth: 0,
  });
  
  // Estado do calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [workoutsByDate, setWorkoutsByDate] = useState<{[key: string]: any}>({}); // Armazenar treinos por data
  const [selectedDayWorkout, setSelectedDayWorkout] = useState<any>(null); // Treino selecionado
  const [workoutDetails, setWorkoutDetails] = useState<any>(null); // Detalhes completos do treino
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading para detalhes

  // Tabs internas
  const [activeMetricsTab, setActiveMetricsTab] = useState<'progresso' | 'calendario' | 'recordes' | 'ia'>('progresso');
  const scrollViewRef = useRef<any>(null);

  // Meta semanal
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [goalMode, setGoalMode] = useState<'permanent' | 'weekly'>('permanent');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(4);
  const [goalModeDraft, setGoalModeDraft] = useState<'permanent' | 'weekly'>('permanent');
  const [goalModalIsNew, setGoalModalIsNew] = useState(false); // true = prompted auto on new week
  const [weightHistory, setWeightHistory] = useState<Array<{ week: string; weight: number }>>([]);
  
  // Draggable modal state
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        // Handle drag movement
      },
      onPanResponderRelease: (event, gestureState) => {
        if (gestureState.dy > 100) {
          setShowWorkoutModal(false);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (user?.id) {
      loadData();
      loadGoalSettings();
    }
  }, [user]);

  function getCurrentWeekKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  async function loadGoalSettings() {
    const stored = await AsyncStorage.getItem('@golift:weekly_goal');
    if (stored) {
      const { target, mode, lastSetWeek } = JSON.parse(stored);
      setWeeklyGoal(target);
      setGoalMode(mode);
      setGoalDraft(target);
      setGoalModeDraft(mode);
      if (mode === 'weekly' && lastSetWeek !== getCurrentWeekKey()) {
        setGoalModalIsNew(true);
        setShowGoalModal(true);
      }
    } else {
      // Primeira vez — pedir ao user para definir a meta
      setGoalModalIsNew(true);
      setShowGoalModal(true);
    }
  }

  async function saveGoalSettings() {
    await AsyncStorage.setItem('@golift:weekly_goal', JSON.stringify({
      target: goalDraft,
      mode: goalModeDraft,
      lastSetWeek: getCurrentWeekKey(),
    }));
    setWeeklyGoal(goalDraft);
    setGoalMode(goalModeDraft);
    setShowGoalModal(false);
    setGoalModalIsNew(false);
  }

  async function loadWeightHistory(currentWeight?: number) {
    try {
      const stored = await AsyncStorage.getItem('@golift:weight_history');
      const parsed = stored ? JSON.parse(stored) : [];
      let list = Array.isArray(parsed) ? parsed : [];
      if (list.length === 0 && currentWeight) {
        list = [{ week: getCurrentWeekKey(), weight: Number(currentWeight) }];
        await AsyncStorage.setItem('@golift:weight_history', JSON.stringify(list));
      }
      setWeightHistory(list);
    } catch {
      setWeightHistory([]);
    }
  }

  async function saveCurrentWeekWeight() {
    if (!profile?.peso) return;
    const currentWeek = getCurrentWeekKey();
    const next = [...weightHistory];
    const index = next.findIndex((item) => item.week === currentWeek);
    if (index >= 0) {
      next[index] = { week: currentWeek, weight: Number(profile.peso) };
    } else {
      next.push({ week: currentWeek, weight: Number(profile.peso) });
    }
    const normalized = next
      .filter((item) => !!item.week && Number(item.weight) > 0)
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
      .slice(-8);
    setWeightHistory(normalized);
    await AsyncStorage.setItem('@golift:weight_history', JSON.stringify(normalized));
  }

  function handleTabChange(tab: 'progresso' | 'calendario' | 'recordes' | 'ia') {
    if (tab === 'ia') {
      router.push('/ai-report');
      return;
    }
    setActiveMetricsTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function openGoalEdit() {
    const stored = await AsyncStorage.getItem('@golift:weekly_goal');
    if (stored) {
      const { target, mode } = JSON.parse(stored);
      setGoalDraft(target);
      setGoalModeDraft(mode);
    } else {
      setGoalDraft(weeklyGoal);
      setGoalModeDraft(goalMode);
    }
    setGoalModalIsNew(false);
    setShowGoalModal(true);
  }



  async function loadData() {
    setLoading(true);
    planoApi.getUserPlan(user!.id).then(d => setPlanoTipo(d.plano as "free" | "pago")).catch(() => {});
    try {
      // Carregar dados em paralelo: métricas, perfil, histórico
      const [recordsData, historyData, statsData, profileData] = await Promise.all([
        metricsApi.getRecords(user!.id).catch(() => []),
        metricsApi.getHistory(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        userApi.getProfile(user!.id).catch(() => null), // Carregar perfil com peso e objetivo
      ]);

      setRecords(recordsData || []);
      
      // Processar perfil para obter peso e peso alvo
      if (profileData?.user) {
        setProfile({
          peso: profileData.user.weight,
          altura: profileData.user.height,
          idade: profileData.user.age,
          pesoAlvo: profileData.user.pesoAlvo,
          objetivo: profileData.user.objetivo,
        });
        await loadWeightHistory(profileData.user.weight);
      }
      
      // Processar histórico e datas para calendário
      const historyItems = historyData || [];
      setHistory(Array.isArray(historyItems) ? historyItems : []);
      
      // Extrair datas dos treinos para o calendário e mapear treinos por data
      const dates = new Set<string>();
      const workoutMap: {[key: string]: any} = {};
      
      (Array.isArray(historyItems) ? historyItems : []).forEach((item: any) => {
        const dateStr = item.data_inicio || item.data_treino || item.data;
        if (dateStr) {
          // Converter data para formato local (YYYY-MM-DD)
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          dates.add(dateKey);
          // Armazenar o primeiro treino dessa data (ou agrupá-los)
          if (!workoutMap[dateKey]) {
            workoutMap[dateKey] = [];
          }
          workoutMap[dateKey].push(item);
        }
      });
      
      setWorkoutDates(dates);
      setWorkoutsByDate(workoutMap);
      
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
  }
  
  // Funções do calendário
  // Gera a grelha do mês como semanas completas (cada semana = 7 células, Seg→Dom)
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Dia da semana do 1º do mês: JS usa 0=Dom,1=Seg...
    // Semana começa no Domingo, então Dom=0 → coluna 0, diretamente
    const jsDay = new Date(year, month, 1).getDay();
    const firstCol = jsDay; // Dom=0, Seg=1, ..., Sáb=6

    const days: (number | null)[] = [];
    // Células vazias antes do dia 1
    for (let i = 0; i < firstCol; i++) days.push(null);
    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // Preencher até múltiplo de 7 para não quebrar a grelha
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }
  
  function isWorkoutDay(day: number | null) {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutDates.has(dateStr);
  }
  
  function isToday(day: number | null) {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  }
  
  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  // Abrir modal ao clicar num dia com treino
  function handleDayPress(day: number | null) {
    if (!day) return;
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const workouts = workoutsByDate[dateStr];
    
    if (workouts && workouts.length > 0) {
      const workout = workouts[0];
      setSelectedDayWorkout(workout);
      setWorkoutDetails(null);
      setShowWorkoutModal(true);
      setLoadingDetails(true);
      
      // Carregar detalhes completos se tiver id_sessao válido
      if (workout.id_sessao && workout.id_sessao > 0) {
        metricsApi.getSessionDetails(workout.id_sessao)
          .then(details => {
            setWorkoutDetails(details);
          })
          .catch(err => {
            console.error(`Erro ao carregar detalhes:`, err);
          })
          .finally(() => {
            setLoadingDetails(false);
          });
      } else {
        setLoadingDetails(false);
      }
    }
  }

  // Memoizar cálculos de calendário
  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weeklyProgressData = useMemo(() => getWeeklyProgress(), [workoutDates]);
  const weightProgressData = useMemo(() => getWeightProgress(), [profile]);

  // Formatar hora para exibir no modal
  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // Calcular meta semanal de treinos (Segunda a Domingo)
  function getWeeklyProgress() {
    const targetWorkouts = weeklyGoal;
    const now = new Date();
    // Calcular a segunda-feira desta semana
    const dayOfWeek = now.getDay(); // 0=Dom, 1=Seg...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    // Contar treinos desta semana (Seg-Dom)
    let weekWorkouts = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (workoutDates.has(dateStr)) {
        weekWorkouts++;
      }
    }
    
    const percentage = Math.min((weekWorkouts / targetWorkouts) * 100, 100);
    return { weekWorkouts, targetWorkouts, percentage };
  }



  // Calcular progresso do peso alvo (comparação entre peso atual e peso alvo)
  // Nota: Para um cálculo preciso seria necessário ter o peso inicial registado no registo
  function getWeightProgress() {
    if (!profile?.peso || !profile?.pesoAlvo) {
      return null;
    }

    const currentWeight = profile.peso;
    const targetWeight = profile.pesoAlvo;
    
    // Calcular quanto falta para atingir o objetivo
    const weightDifference = Math.abs(currentWeight - targetWeight);
    
    // Se o objetivo é perder peso
    if (targetWeight < currentWeight) {
      // Mostrar 0% pois estamos a começar, precisa de histórico para progresso real
      return { 
        percentage: 0, 
        difference: weightDifference, 
        direction: "down",
        message: `Precisa perder ${weightDifference.toFixed(1)}kg`
      };
    }
    
    // Se o objetivo é ganhar peso
    if (targetWeight > currentWeight) {
      // Mostrar 0% pois estamos a começar, precisa de histórico para progresso real
      return { 
        percentage: 0, 
        difference: weightDifference, 
        direction: "up",
        message: `Precisa ganhar ${weightDifference.toFixed(1)}kg`
      };
    }
    
    // Se já atingiu o objetivo
    return { 
      percentage: 100, 
      difference: 0, 
      direction: "none",
      message: "Objetivo atingido!"
    };
  }

  // Últimas 8 semanas de atividade para bar chart
  function getWeeklyBarData(): { label: string; count: number }[] {
    const result: { label: string; count: number }[] = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      // Monday of each past week
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(now.getDate() - daysFromMonday - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      let count = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (workoutDates.has(key)) count++;
      }
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const label = w === 0 ? "Esta" : `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      result.push({ label, count });
    }
    return result;
  }

  const weekProgress = getWeeklyProgress();
  const weightProg = getWeightProgress();
  const weeklyBarData = useMemo(() => getWeeklyBarData(), [workoutDates]);
  const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#cd7f32"];

  if (loading) {
    return <MetricsScreenSkeleton />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: safeBottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 12, paddingBottom: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -1 }}>
          Métricas
        </Text>
        <Text style={{ color: theme.textSecondary, marginTop: 4, fontSize: 14 }}>
          Acompanha o teu progresso
        </Text>
      </View>

      {/* ── Tab switcher ── */}
      <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 8, marginBottom: 20 }}>
        {([ 
          { key: 'progresso', label: 'Progresso' },
          { key: 'calendario', label: 'Calendário' },
          { key: 'recordes', label: 'Recordes' },
          { key: 'ia', label: '✦ IA', accent: '#8B5CF6' },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: activeMetricsTab === tab.key
                ? ('accent' in tab ? tab.accent : theme.accent)
                : tab.key === 'ia'
                ? '#8B5CF620'
                : theme.backgroundSecondary,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: "700",
              color: activeMetricsTab === tab.key
                ? "#fff"
                : tab.key === 'ia'
                ? '#8B5CF6'
                : theme.textSecondary,
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── TAB: Progresso ── */}
      {activeMetricsTab === 'progresso' && (<>

      {/* ── Hero — Meta Semanal ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
        <View style={{ backgroundColor: theme.accent, borderRadius: 24, padding: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" }}>
                META SEMANAL
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
                <Text style={{ color: "#fff", fontSize: 52, fontWeight: "800", letterSpacing: -2, lineHeight: 56 }}>
                  {weekProgress.weekWorkouts}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 28, fontWeight: "700", letterSpacing: -1, marginBottom: 6, marginLeft: 4 }}>
                  /{weekProgress.targetWorkouts}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 }}>
                treino{weekProgress.weekWorkouts !== 1 ? "s" : ""} esta semana
              </Text>
            </View>
            <TouchableOpacity
              onPress={openGoalEdit}
              accessibilityLabel="Editar meta semanal"
              accessibilityRole="button"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10, marginTop: 2 }}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Barra de progresso */}
          <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 2, marginBottom: 10 }}>
            <View style={{
              height: 4,
              width: `${Math.min(weekProgress.percentage, 100)}%` as any,
              backgroundColor: weekProgress.percentage >= 100 ? "#30D158" : "#fff",
              borderRadius: 2,
            }} />
          </View>

          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" }}>
            {weekProgress.percentage >= 100
              ? "✓ Meta atingida esta semana!"
              : `${weekProgress.targetWorkouts - weekProgress.weekWorkouts} treino${weekProgress.targetWorkouts - weekProgress.weekWorkouts !== 1 ? "s" : ""} para a meta`}
          </Text>
        </View>
      </View>

      {/* ── Stats grid 2×2 ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Total
            </Text>
            <Text style={{ color: theme.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
              {stats.totalWorkouts}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>treinos</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Este Mês
            </Text>
            <Text style={{ color: theme.text, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
              {stats.thisMonth}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>treinos</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Tempo Total
            </Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
              {formatTime(stats.totalTime)}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>acumulado</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
              Duração Média
            </Text>
            <Text style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -1 }}>
              {stats.avgDuration ? formatTime(stats.avgDuration) : "—"}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>por treino</Text>
          </View>
        </View>

        {/* Objetivo de Peso */}
        {!!profile?.peso && !!profile?.pesoAlvo && !!weightProg && (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  OBJETIVO DE PESO
                </Text>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 }}>
                  {profile.peso}
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: "600" }}>kg</Text>
                  {"  →  "}
                  {profile.pesoAlvo}
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: "600" }}>kg</Text>
                </Text>
              </View>
              <View style={{
                backgroundColor: weightProg.direction === "down" ? "#FF3B30" + "18" : theme.accentGreen + "18",
                borderRadius: 10, padding: 8,
              }}>
                <Ionicons
                  name={weightProg.direction === "down" ? "trending-down" : "trending-up"}
                  size={20}
                  color={weightProg.direction === "down" ? "#FF3B30" : theme.accentGreen}
                />
              </View>
            </View>
            <View style={{ height: 4, backgroundColor: theme.backgroundTertiary, borderRadius: 2 }}>
              <View style={{ height: 4, width: `${Math.min(weightProg.percentage, 100)}%` as any, backgroundColor: theme.accentGreen, borderRadius: 2 }} />
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 10 }}>{weightProg.message}</Text>

            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Atualização Semanal
                </Text>
                <Pressable
                  onPress={saveCurrentWeekWeight}
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar peso desta semana"
                  style={({ pressed }) => ({
                    backgroundColor: theme.accent + "18",
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>Atualizar semana</Text>
                </Pressable>
              </View>

              {weightHistory.length >= 2 ? (
                <View>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 72 }}>
                    {(() => {
                      const maxWeight = Math.max(...weightHistory.map((w) => w.weight));
                      const minWeight = Math.min(...weightHistory.map((w) => w.weight));
                      const range = Math.max(maxWeight - minWeight, 1);
                      return weightHistory.map((item, idx) => {
                        const h = Math.max(10, ((item.weight - minWeight) / range) * 56 + 10);
                        const isLast = idx === weightHistory.length - 1;
                        return (
                          <View key={item.week} style={{ flex: 1, alignItems: "center" }}>
                            <View style={{ width: "100%", height: h, borderRadius: 6, backgroundColor: isLast ? theme.accent : theme.accent + "55" }} />
                          </View>
                        );
                      });
                    })()}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                    <Text style={{ color: theme.textTertiary, fontSize: 11 }}>
                      {new Date(weightHistory[0].week).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                      Atual: {weightHistory[weightHistory.length - 1].weight}kg
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                  Regista o peso semanal para acompanhar a evolução visual.
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Atividade Semanal (bar chart) ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Atividade por Semana
        </Text>
        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
          {(() => {
            const maxCount = Math.max(...weeklyBarData.map(w => w.count), 1);
            return (
              <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 80, gap: 4 }}>
                {weeklyBarData.map((week, i) => {
                  const isCurrentWeek = i === weeklyBarData.length - 1;
                  const pct = week.count / maxCount;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                      <View style={{
                        width: "100%",
                        height: Math.max(4, pct * 60),
                        borderRadius: 4,
                        backgroundColor: isCurrentWeek
                          ? theme.accent
                          : week.count > 0
                            ? theme.accent + "55"
                            : theme.backgroundTertiary,
                      }} />
                      <Text style={{ color: isCurrentWeek ? theme.accent : theme.textTertiary, fontSize: 9, fontWeight: isCurrentWeek ? "700" : "500" }}>
                        {week.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
            <Text style={{ color: theme.textTertiary, fontSize: 12 }}>Treinos por semana</Text>
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>
              Esta semana: {weeklyBarData[weeklyBarData.length - 1]?.count ?? 0}
            </Text>
          </View>
        </View>
      </View>

      </>
      )}
      {/* ── TAB: Recordes ── */}
      {activeMetricsTab === 'recordes' && (<>

      {/* ── Recordes Pessoais ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Recordes Pessoais
        </Text>

        {records.length === 0 ? (
          <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, paddingVertical: 36, alignItems: "center" }}>
            <Ionicons name="medal" size={40} color={theme.textSecondary} />
            <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 14 }}>
              Ainda não tens recordes registados
            </Text>
          </View>
        ) : (
          <View style={{ gap: 24 }}>
            {/* Agrupar recordes por exercício */}
            {Object.entries(
              records.reduce((acc: any, rec: any) => {
                const nome = rec.nome_exercicio || rec.exercicio || rec.exercise || "";
                if (!acc[nome]) acc[nome] = [];
                acc[nome].push(rec);
                return acc;
              }, {})
            ).map(([nome, recs]) => {
              const sorted = [...(recs as any[])].sort((a, b) => (b.peso || b.weight) - (a.peso || a.weight));
              return (
                <View key={nome} style={{ marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15, marginBottom: 8 }}>{nome}</Text>
                  {/* Ranking dos recordes */}
                  <View style={{ gap: 12 }}>
                    {sorted.map((record, idx) => {
                      const medalColors = ["#f59e0b", "#94a3b8", "#cd7f32"];
                      const color = idx < 3 ? medalColors[idx] : theme.textSecondary;
                      const exercicioId = record.id_exercicio || record.exercicio_id;
                      return (
                        <Pressable
                          key={record.id_serie || record.id || idx}
                          onPress={() => {
                            if (exercicioId) {
                              router.push({ pathname: "/exercise-progress/[id]", params: { id: String(exercicioId), nome } });
                            }
                          }}
                          accessibilityLabel={`Ver progressão de ${nome}`}
                          accessibilityRole="button"
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.backgroundSecondary,
                            borderRadius: 14,
                            paddingHorizontal: 18,
                            paddingVertical: 17,
                            opacity: pressed ? 0.6 : 1,
                          })}
                        >
                          {/* Medal Icon for top 3 */}
                          <View style={{ width: 26, alignItems: "center", marginRight: 16 }}>
                            {idx < 3 ? (
                              <Ionicons name="medal" size={22} color={color} />
                            ) : null}
                          </View>
                          {/* Date */}
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "500", letterSpacing: -0.3 }} numberOfLines={1}>
                              {record.peso || record.weight} kg
                            </Text>
                            {(record.data_serie || record.data) && (
                              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                                {formatDate(record.data_serie || record.data)}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      </>
      )}
      {/* ── TAB: Calendário ── */}
      {activeMetricsTab === 'calendario' && (<>

      {/* ── Calendário de Treinos ── */}
      <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: theme.textSecondary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
          Calendário de Treinos
        </Text>

        <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 18 }}>
          {/* Navegação do mês */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <TouchableOpacity
              onPress={previousMonth}
              accessibilityLabel="Mês anterior"
              accessibilityRole="button"
              style={{ padding: 8, borderRadius: 10, backgroundColor: theme.backgroundTertiary }}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, letterSpacing: -0.3 }}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              accessibilityLabel="Próximo mês"
              accessibilityRole="button"
              style={{ padding: 8, borderRadius: 10, backgroundColor: theme.backgroundTertiary }}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Dias da semana */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {DAYS.map((day, index) => (
              <View key={index} style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
                <Text style={{ color: theme.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>
                  {day.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid — renderizado por semana para alinhamento perfeito */}
          {Array.from({ length: Math.ceil(daysInMonth.length / 7) }, (_, weekIndex) => (
            <View key={weekIndex} style={{ flexDirection: "row" }}>
              {daysInMonth.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={{ flex: 1, height: 40, justifyContent: "center", alignItems: "center" }}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={isWorkoutDay(day) ? 0.7 : 1}
                >
                  {day !== null && (
                    <View style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isToday(day)
                        ? theme.accentGreen
                        : isWorkoutDay(day)
                          ? theme.accent
                          : "transparent",
                    }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: isToday(day) || isWorkoutDay(day) ? "700" : "400",
                        color: isToday(day) || isWorkoutDay(day)
                          ? "#fff"
                          : theme.textSecondary,
                      }}>
                        {day}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Legenda */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: theme.accentGreen }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Hoje</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Com treino</Text>
            </View>
          </View>
        </View>
      </View>

      </>
      )}

    </ScrollView>

    {/* ── Modal: Detalhes do Treino ── */}
    <Modal
      visible={showWorkoutModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowWorkoutModal(false)}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableOpacity
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)" }}
          activeOpacity={1}
          onPress={() => setShowWorkoutModal(false)}
        />

        <View style={{ backgroundColor: theme.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%" }}>
          {/* Handle */}
          <View {...panResponder.panHandlers} style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />

          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
                {workoutDetails?.nome_treino || selectedDayWorkout?.nome_treino || selectedDayWorkout?.nome || "Treino"}
              </Text>
              {(workoutDetails?.data_inicio || selectedDayWorkout?.data_inicio || selectedDayWorkout?.data) && (
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4 }}>
                  {formatDateTime(workoutDetails?.data_inicio || selectedDayWorkout?.data_inicio || selectedDayWorkout?.data)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowWorkoutModal(false)}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 12, padding: 8, marginLeft: 12 }}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Duração destaque */}
          {(workoutDetails?.duracao_segundos || selectedDayWorkout?.duracao_segundos) && (
            <View style={{ marginHorizontal: 24, marginBottom: 16, backgroundColor: theme.accent, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="timer" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 8 }}>
                {formatTime(workoutDetails?.duracao_segundos || selectedDayWorkout?.duracao_segundos)}
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: safeBottom + 20 }}>
            {loadingDetails && (
              <View style={{ justifyContent: "center", alignItems: "center", padding: 24 }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginTop: 12 }}>A carregar...</Text>
              </View>
            )}

            {workoutDetails?.exercicios && workoutDetails.exercicios.length > 0 ?
              workoutDetails.exercicios.map((ex: any, index: number) => (
                <View key={index} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.text, letterSpacing: -0.2, marginBottom: 4 }}>
                    {ex.nome_exercicio || `Exercício ${index + 1}`}
                  </Text>
                  {ex.grupo_tipo && (
                    <Text style={{ fontSize: 11, color: theme.textSecondary, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
                      {ex.grupo_tipo}{ex.sub_tipo ? ` · ${ex.sub_tipo}` : ""}
                    </Text>
                  )}
                  {ex.series && ex.series.length > 0 ? (
                    <View style={{ gap: 6 }}>
                      {ex.series.map((serie: any, serieIdx: number) => (
                        <View key={serieIdx} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundTertiary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                          <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: theme.accent, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{serie.numero_serie}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", gap: 20 }}>
                            {!!serie.repeticoes && (
                              <View>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: "700", letterSpacing: 0.5 }}>REPS</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text }}>{serie.repeticoes}</Text>
                              </View>
                            )}
                            {!!serie.peso && (
                              <View>
                                <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: "700", letterSpacing: 0.5 }}>PESO</Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.accentGreen }}>{serie.peso}kg</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 12, color: theme.textSecondary, fontStyle: "italic" }}>Nenhuma série registada</Text>
                  )}
                </View>
              ))
            : selectedDayWorkout?.exercicios?.length > 0 ?
              selectedDayWorkout.exercicios.map((ex: any, index: number) => (
                <View key={index} style={{ backgroundColor: theme.backgroundTertiary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text }}>{ex.nome || ex.exercicio || `Exercício ${index + 1}`}</Text>
                </View>
              ))
            : !loadingDetails ? (
              <Text style={{ color: theme.textSecondary, textAlign: "center", fontSize: 14 }}>Nenhum dado disponível</Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* ── Modal: Meta Semanal ── */}
    <Modal
      visible={showGoalModal}
      transparent
      animationType="slide"
      onRequestClose={() => !goalModalIsNew && setShowGoalModal(false)}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" }}>
        <View style={{
          backgroundColor: theme.backgroundSecondary,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          paddingBottom: safeBottom + 20,
        }}>
          <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
          {/* Título */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: theme.text, marginBottom: 4 }}>
            {goalModalIsNew ? "🎯 Nova semana!" : "Meta Semanal"}
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24 }}>
            {goalModalIsNew
              ? "Define quantos treinos queres fazer esta semana."
              : "Altera a tua meta de treinos por semana."}
          </Text>

          {/* Seletor de número */}
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 10 }}>
            Número de treinos
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, gap: 20 }}>
            <TouchableOpacity
              onPress={() => setGoalDraft(Math.max(1, goalDraft - 1))}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: theme.backgroundTertiary,
                justifyContent: "center", alignItems: "center",
              }}
            >
              <Ionicons name="remove" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 40, fontWeight: "700", color: theme.text, minWidth: 60, textAlign: "center" }}>
              {goalDraft}
            </Text>
            <TouchableOpacity
              onPress={() => setGoalDraft(Math.min(7, goalDraft + 1))}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: theme.backgroundTertiary,
                justifyContent: "center", alignItems: "center",
              }}
            >
              <Ionicons name="add" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Pontos rápidos */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setGoalDraft(n)}
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: goalDraft === n ? theme.accent : theme.backgroundTertiary,
                  justifyContent: "center", alignItems: "center",
                  borderWidth: goalDraft === n ? 0 : 1,
                  borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: goalDraft === n ? "#fff" : theme.textSecondary }}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Modo: Semanal vs Permanente */}
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 10 }}>
            Repetição
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => setGoalModeDraft("weekly")}
              style={{
                flex: 1, padding: 14, borderRadius: 14,
                backgroundColor: goalModeDraft === "weekly" ? theme.accent : theme.backgroundTertiary,
                alignItems: "center",
                borderWidth: goalModeDraft === "weekly" ? 0 : 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: goalModeDraft === "weekly" ? "#fff" : theme.textSecondary }}>
                🔄  Todas as semanas
              </Text>
              <Text style={{ fontSize: 11, color: goalModeDraft === "weekly" ? "rgba(255,255,255,0.7)" : theme.textTertiary, marginTop: 2 }}>
                Pergunta no início de cada semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGoalModeDraft("permanent")}
              style={{
                flex: 1, padding: 14, borderRadius: 14,
                backgroundColor: goalModeDraft === "permanent" ? theme.accent : theme.backgroundTertiary,
                alignItems: "center",
                borderWidth: goalModeDraft === "permanent" ? 0 : 1,
                borderColor: theme.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: goalModeDraft === "permanent" ? "#fff" : theme.textSecondary }}>
                📌  Permanente
              </Text>
              <Text style={{ fontSize: 11, color: goalModeDraft === "permanent" ? "rgba(255,255,255,0.7)" : theme.textTertiary, marginTop: 2 }}>
                Mantém-se semana a semana
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botões */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {!goalModalIsNew && (
              <TouchableOpacity
                onPress={() => setShowGoalModal(false)}
                style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: theme.backgroundTertiary, alignItems: "center" }}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={saveGoalSettings}
              style={{
                flex: 2, padding: 16, borderRadius: 16,
                backgroundColor: theme.accent, alignItems: "center",
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    </View>
  );
}
