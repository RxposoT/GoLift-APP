import React, { useState, useEffect, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  PanResponder,
} from "react-native";
import { Text, Card, Button } from "../../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { metricsApi, userApi, planoApi, weightApi } from "../../services/api";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { MetricsScreenSkeleton } from "../../components/ui/SkeletonLoader";
import ProgressoTab from "../../components/metrics/ProgressoTab";
import CalendarioTab from "../../components/metrics/CalendarioTab";
import RecordesTab from "../../components/metrics/RecordesTab";
import WorkoutDetailModal from "../../components/metrics/WorkoutDetailModal";
import { spacing, radius } from "../../styles/tokens";
import { MODAL_BACKDROP } from "../../styles/colors";

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
  const [workoutsByDate, setWorkoutsByDate] = useState<{[key: string]: any}>({});
  const [selectedDayWorkout, setSelectedDayWorkout] = useState<any>(null);
  const [workoutDetails, setWorkoutDetails] = useState<any>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Tabs internas
  const [activeMetricsTab, setActiveMetricsTab] = useState<'progresso' | 'calendario' | 'recordes' | 'ia'>('progresso');
  const scrollViewRef = useRef<any>(null);

  // Meta semanal
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [goalMode, setGoalMode] = useState<'permanent' | 'weekly'>('permanent');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(4);
  const [goalModeDraft, setGoalModeDraft] = useState<'permanent' | 'weekly'>('permanent');
  const [goalModalIsNew, setGoalModalIsNew] = useState(false);
  const [weightHistory, setWeightHistory] = useState<Array<{ week: string; weight: number }>>([]);
  
  // Draggable modal state
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
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
    // Tentar carregar do backend primeiro
    if (user?.id) {
      try {
        const backend = await weightApi.getHistory(user.id);
        if (backend.length > 0) {
          setWeightHistory(backend);
          // Atualizar AsyncStorage como cache
          await AsyncStorage.setItem('@golift:weight_history', JSON.stringify(backend));
          return;
        }
      } catch {
        // Backend ainda sem tabela — fallback para AsyncStorage
      }
    }

    // Fallback: AsyncStorage local
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
    if (!profile?.peso || !user?.id) return;
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

    // Sync com backend (fire-and-forget — não bloqueia UI)
    weightApi.upsertEntry(user.id, currentWeek, Number(profile.peso)).catch(() => {});
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
      const [recordsData, historyData, statsData, profileData] = await Promise.all([
        metricsApi.getRecords(user!.id).catch(() => []),
        metricsApi.getHistory(user!.id).catch(() => []),
        metricsApi.getStats(user!.id).catch(() => null),
        userApi.getProfile(user!.id).catch(() => null),
      ]);

      setRecords(recordsData || []);
      
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
      
      const historyItems = historyData || [];
      setHistory(Array.isArray(historyItems) ? historyItems : []);
      
      const dates = new Set<string>();
      const workoutMap: {[key: string]: any} = {};
      
      (Array.isArray(historyItems) ? historyItems : []).forEach((item: any) => {
        const dateStr = item.data_inicio || item.data_treino || item.data;
        if (dateStr) {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateKey = `${year}-${month}-${day}`;
          
          dates.add(dateKey);
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
  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const jsDay = new Date(year, month, 1).getDay();
    const firstCol = jsDay;

    const days: (number | null)[] = [];
    for (let i = 0; i < firstCol; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
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

  const daysInMonth = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weeklyProgressData = useMemo(() => getWeeklyProgress(), [workoutDates]);
  const weightProgressData = useMemo(() => getWeightProgress(), [profile]);

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

  function getWeeklyProgress() {
    const targetWorkouts = weeklyGoal;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);
    
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

  function getWeightProgress() {
    if (!profile?.peso || !profile?.pesoAlvo) {
      return null;
    }

    const currentWeight = Number(profile.peso);
    const targetWeight = Number(profile.pesoAlvo);

    // Usar o primeiro registo do histórico como ponto de partida, ou o peso atual
    const startWeight = weightHistory.length >= 2
      ? Number(weightHistory[0].weight)
      : currentWeight;

    // Se está a perder peso (target < current)
    if (targetWeight < currentWeight) {
      const totalToLose = startWeight - targetWeight;
      const lostSoFar = startWeight - currentWeight;
      const pct = totalToLose > 0 ? Math.min((lostSoFar / totalToLose) * 100, 100) : 0;
      return {
        percentage: pct,
        difference: currentWeight - targetWeight,
        direction: "down" as const,
        message: `Faltam ${(currentWeight - targetWeight).toFixed(1)}kg`,
      };
    }

    // Se está a ganhar peso (target > current)
    if (targetWeight > currentWeight) {
      const totalToGain = targetWeight - startWeight;
      const gainedSoFar = currentWeight - startWeight;
      const pct = totalToGain > 0 ? Math.min((gainedSoFar / totalToGain) * 100, 100) : 0;
      return {
        percentage: pct,
        difference: targetWeight - currentWeight,
        direction: "up" as const,
        message: `Faltam ${(targetWeight - currentWeight).toFixed(1)}kg`,
      };
    }

    return {
      percentage: 100,
      difference: 0,
      direction: "none" as const,
      message: "Objetivo atingido!",
    };
  }

  function getWeeklyBarData(): { label: string; count: number }[] {
    const result: { label: string; count: number }[] = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
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
      <View style={{ paddingHorizontal: spacing.xxl, paddingTop: safeTop + 12, paddingBottom: spacing.lg }}>
        <Text variant="title1">Métricas</Text>
        <Text variant="callout" color="textSecondary" style={{ marginTop: spacing.xs }}>
          Acompanha o teu progresso
        </Text>
      </View>

      {/* ── Tab switcher ── */}
      <View style={{ flexDirection: "row", paddingHorizontal: spacing.xxl, gap: spacing.sm, marginBottom: spacing.xl }}>
        {([
          { key: 'progresso' as const, label: 'Progresso' },
          { key: 'calendario' as const, label: 'Calendário' },
          { key: 'recordes' as const, label: 'Recordes' },
          { key: 'ia' as const, label: '✦ IA' },
        ]).map((tab) => (
          <Button
            key={tab.key}
            variant={activeMetricsTab === tab.key ? "primary" : "secondary"}
            size="sm"
            style={{ flex: 1 }}
            onPress={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      {/* ── TAB: Progresso ── */}
      {activeMetricsTab === 'progresso' && (
        <ProgressoTab
          theme={theme}
          weekProgress={weekProgress}
          stats={stats}
          profile={profile}
          weightProg={weightProg}
          weightHistory={weightHistory}
          weeklyBarData={weeklyBarData}
          formatTime={formatTime}
          openGoalEdit={openGoalEdit}
          saveCurrentWeekWeight={saveCurrentWeekWeight}
        />
      )}

      {/* ── TAB: Recordes ── */}
      {activeMetricsTab === 'recordes' && (
        <RecordesTab
          theme={theme}
          records={records}
          formatDate={formatDate}
        />
      )}

      {/* ── TAB: Calendário ── */}
      {activeMetricsTab === 'calendario' && (
        <CalendarioTab
          theme={theme}
          currentMonth={currentMonth}
          daysInMonth={daysInMonth}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonth}
          onDayPress={handleDayPress}
          isWorkoutDay={isWorkoutDay}
          isToday={isToday}
        />
      )}

    </ScrollView>

    {/* ── Modal: Detalhes do Treino ── */}
    <WorkoutDetailModal
      theme={theme}
      visible={showWorkoutModal}
      onClose={() => setShowWorkoutModal(false)}
      selectedDayWorkout={selectedDayWorkout}
      workoutDetails={workoutDetails}
      loadingDetails={loadingDetails}
      formatTime={formatTime}
      formatDateTime={formatDateTime}
      panHandlers={panResponder.panHandlers}
      safeBottom={safeBottom}
    />

    {/* ── Modal: Meta Semanal ── */}
    <Modal
      visible={showGoalModal}
      transparent
      animationType="slide"
      onRequestClose={() => !goalModalIsNew && setShowGoalModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: MODAL_BACKDROP }}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Card padding={spacing.xxl} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: safeBottom + 20 }}>
            <View style={{ width: 36, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.xl }} />
            <Text variant="title3" style={{ marginBottom: spacing.xs }}>
              {goalModalIsNew ? "🎯 Nova semana!" : "Meta Semanal"}
            </Text>
            <Text variant="callout" color="textSecondary" style={{ marginBottom: spacing.xxl }}>
              {goalModalIsNew
                ? "Define quantos treinos queres fazer esta semana."
                : "Altera a tua meta de treinos por semana."}
            </Text>

            <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              Número de treinos
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: spacing.xxl, gap: spacing.xl }}>
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
              <Text variant="title1" style={{ fontSize: 40, minWidth: 60, textAlign: "center" }}>
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

            <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginBottom: 28 }}>
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
                  <Text variant="body" style={{ fontWeight: "600", color: goalDraft === n ? "#fff" : theme.textSecondary }}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="subhead" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              Repetição
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: 28 }}>
              <TouchableOpacity
                onPress={() => setGoalModeDraft("weekly")}
                style={{
                  flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                  backgroundColor: goalModeDraft === "weekly" ? theme.accent : theme.backgroundTertiary,
                  alignItems: "center",
                  borderWidth: goalModeDraft === "weekly" ? 0 : 1,
                  borderColor: theme.border,
                }}
              >
                <Text variant="subhead" style={{ fontWeight: "600", color: goalModeDraft === "weekly" ? "#fff" : theme.textSecondary }}>
                  🔄  Todas as semanas
                </Text>
                <Text variant="footnote" style={{ fontSize: 11, color: goalModeDraft === "weekly" ? "rgba(255,255,255,0.7)" : theme.textTertiary, marginTop: spacing.xxs }}>
                  Pergunta no início de cada semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGoalModeDraft("permanent")}
                style={{
                  flex: 1, padding: spacing.lg, borderRadius: radius.lg,
                  backgroundColor: goalModeDraft === "permanent" ? theme.accent : theme.backgroundTertiary,
                  alignItems: "center",
                  borderWidth: goalModeDraft === "permanent" ? 0 : 1,
                  borderColor: theme.border,
                }}
              >
                <Text variant="subhead" style={{ fontWeight: "600", color: goalModeDraft === "permanent" ? "#fff" : theme.textSecondary }}>
                  📌  Permanente
                </Text>
                <Text variant="footnote" style={{ fontSize: 11, color: goalModeDraft === "permanent" ? "rgba(255,255,255,0.7)" : theme.textTertiary, marginTop: spacing.xxs }}>
                  Mantém-se semana a semana
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {!goalModalIsNew && (
                <Button variant="ghost" style={{ flex: 1 }} onPress={() => setShowGoalModal(false)}>Cancelar</Button>
              )}
              <Button variant="primary" style={{ flex: 2 }} onPress={saveGoalSettings}>Guardar</Button>
            </View>
          </Card>
        </View>
      </View>
    </Modal>

    </View>
  );
}
