import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  AppState,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { workoutApi, metricsApi, planoApi } from "../../services/api";

interface Serie {
  numero: number;
  repeticoes: string;
  peso: string;
  concluida: boolean;
}

interface ExercicioAtivo {
  id: number;
  nome: string;
  series: Serie[];
  previousSeries?: Serie[]; // Dados do treino anterior
}

export default function WorkoutActive() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercicios, setExercicios] = useState<ExercicioAtivo[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restDefault, setRestDefault] = useState(90);

  const timerPausedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const pausedDurationRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // Sync timerPaused state → ref so the interval closure always reads current value
  useEffect(() => {
    timerPausedRef.current = timerPaused;
  }, [timerPaused]);

  // Partilha de resultados — gerida no ecrã summary

  useEffect(() => {
    loadWorkout();
    planoApi
      .getPlan(user!.id)
      .then((d: any) => {
        if (d?.descanso_segundos) setRestDefault(d.descanso_segundos);
      })
      .catch(() => {});
    startTimeRef.current = Date.now();
    startTick();
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      sub.remove();
    };
  }, []);

  function getElapsed(): number {
    const now = Date.now();
    if (pausedAtRef.current !== null) {
      // Congelar no momento em que pausou
      return Math.floor((pausedAtRef.current - startTimeRef.current - pausedDurationRef.current) / 1000);
    }
    return Math.floor((now - startTimeRef.current - pausedDurationRef.current) / 1000);
  }

  function startTick() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!timerPausedRef.current) {
        setTempoDecorrido(getElapsed());
      }
    }, 1000) as unknown as number;
  }

  function handlePause() {
    pausedAtRef.current = Date.now();
    setTimerPaused(true);
  }

  function handleResume() {
    if (pausedAtRef.current !== null) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setTimerPaused(false);
    // Atualizar imediatamente ao retomar
    setTempoDecorrido(getElapsed());
  }

  function togglePause() {
    if (timerPausedRef.current) {
      handleResume();
    } else {
      handlePause();
    }
  }

  function handleAppStateChange(state: string) {
    if (state === 'active') {
      // App voltou ao primeiro plano
      if (pausedAtRef.current !== null) {
        pausedDurationRef.current += Date.now() - pausedAtRef.current;
        pausedAtRef.current = null;
      }
      // Atualizar tempo imediatamente ao voltar
      setTempoDecorrido(getElapsed());
    } else if (state === 'background' || state === 'inactive') {
      // App foi para background — pausar se não estava já pausado
      if (!timerPausedRef.current && pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
    }
  }

  async function loadWorkout() {
    try {
      // Carregar todos os treinos do utilizador
      const allWorkouts = await workoutApi.getUserWorkouts(user!.id).catch(() => []);
      
      // Encontrar e guardar o treino atual (Bug 1: setWorkout nunca era chamado)
      const currentWorkout = allWorkouts.find((w: any) => w.id_treino === Number(id));
      if (currentWorkout) setWorkout(currentWorkout);

      // Carregar exercícios diretamente (Bug 2: antes só carregava se exercicios_nomes não fosse vazio)
      const response = await workoutApi.getWorkoutExercises(Number(id)).catch(() => ({ exercicios: [] }));
      const exerciciosDoTreino: any[] = response?.exercicios || [];

      if (exerciciosDoTreino.length === 0) {
        Alert.alert("Aviso", "Este treino não tem exercícios definidos.");
      }

      // Bug 5: Buscar dados da última sessão DESTE treino específico para sugestões
      let previousWorkoutData: any = null;
      const history = await metricsApi.getHistory(user!.id).catch(() => []);
      const thisTreinoSession = Array.isArray(history)
        ? history.find((s: any) => s.id_treino === Number(id))
        : null;
      if (thisTreinoSession?.id_sessao) {
        previousWorkoutData = await metricsApi.getSessionDetails(thisTreinoSession.id_sessao).catch(() => null);
      }

      // Transformar exercícios para o formato ativo
      const exerciciosAtivos: ExercicioAtivo[] = exerciciosDoTreino.map((ex: any) => {
        let previousSeries: Serie[] | undefined = undefined;
        
        // Procurar dados do treino anterior
        if (previousWorkoutData?.exercicios) {
          const previousEx = previousWorkoutData.exercicios.find(
            (pex: any) => pex.id === ex.id
          );
          if (previousEx?.series) {
            previousSeries = previousEx.series.map((s: any) => ({
              numero: s.numero_serie,
              repeticoes: String(s.repeticoes ?? ""),
              peso: String(s.peso ?? ""),
              concluida: false,
            }));
          }
        }

        return {
          id: ex.id,
          nome: ex.nome,
          previousSeries,
          series: [
            { numero: 1, repeticoes: "", peso: "", concluida: false },
            { numero: 2, repeticoes: "", peso: "", concluida: false },
            { numero: 3, repeticoes: "", peso: "", concluida: false },
          ],
        };
      });
      
      setExercicios(exerciciosAtivos);
    } catch (error) {
      console.error("Erro ao carregar treino:", error);
      Alert.alert("Erro", "Não foi possível carregar o treino");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  function startRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(restDefault);
    restTimerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(restTimerRef.current!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return null;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  }

  function skipRestTimer() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(null);
  }

  function formatarTempo(segundos: number) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, "0")}:${segs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutos.toString().padStart(2, "0")}:${segs
      .toString()
      .padStart(2, "0")}`;
  }

  // Obter placeholder/sugestão do treino anterior
  function getPlaceholder(exercicioId: number, serieIndex: number, campo: "peso" | "repeticoes"): string {
    const exercicio = exercicios.find((ex: any) => ex.id === exercicioId);
    if (!exercicio?.previousSeries || !exercicio.previousSeries[serieIndex]) {
      return "-";
    }
    return campo === "peso" ? exercicio.previousSeries[serieIndex].peso : exercicio.previousSeries[serieIndex].repeticoes;
  }

  // Auto-preencher com dados anteriores quando clica no check
  function autoFillFromPrevious(exercicioId: number, serieIndex: number) {
    const exercicio = exercicios.find((ex: any) => ex.id === exercicioId);
    if (!exercicio?.previousSeries || !exercicio.previousSeries[serieIndex]) {
      return;
    }

    const previousSerie = exercicio.previousSeries[serieIndex];
    if (!exercicio.series[serieIndex].peso) {
      atualizarSerie(exercicioId, serieIndex, "peso", previousSerie.peso);
    }
    if (!exercicio.series[serieIndex].repeticoes) {
      atualizarSerie(exercicioId, serieIndex, "repeticoes", previousSerie.repeticoes);
    }
  }

  function toggleExpandir(_exercicioId: number) {
    // Exercícios sempre visíveis — função mantida por compatibilidade
  }

  function atualizarSerie(
    exercicioId: number,
    serieIndex: number,
    campo: "repeticoes" | "peso",
    valor: string
  ) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s: any, i: number) =>
                i === serieIndex ? { ...s, [campo]: valor } : s
              ),
            }
          : ex
      )
    );
  }

  function toggleSerieConcluida(exercicioId: number, serieIndex: number) {
    const exercicio = exercicios.find((ex) => ex.id === exercicioId);
    const serieAtual = exercicio?.series[serieIndex];
    if (serieAtual && !serieAtual.concluida) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startRestTimer();
    } else {
      skipRestTimer();
    }
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s: any, i: number) =>
                i === serieIndex ? { ...s, concluida: !s.concluida } : s
              ),
            }
          : ex
      )
    );
  }

  function adicionarSerie(exercicioId: number) {
    setExercicios(
      exercicios.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: [
                ...ex.series,
                {
                  numero: ex.series.length + 1,
                  repeticoes: "",
                  peso: "",
                  concluida: false,
                },
              ],
            }
          : ex
      )
    );
  }

  function cancelarTreino() {
    Alert.alert(
      "Cancelar Treino",
      "Tens a certeza? Todo o progresso será perdido.",
      [
        { text: "Continuar Treino", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => {
            // Bug 6: parar o timer ao cancelar
            if (tickRef.current) clearInterval(tickRef.current);
            router.back();
          },
        },
      ]
    );
  }

  async function concluirTreino() {
    const temSeriesConcluidas = exercicios.some((ex: any) =>
      ex.series.some((s: any) => s.concluida)
    );

    if (!temSeriesConcluidas) {
      Alert.alert("Atenção", "Completa pelo menos uma série antes de terminar.");
      return;
    }

    Alert.alert("Concluir Treino", "Queres terminar este treino?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Concluir",
        onPress: async () => {
          try {
            const todasAsSeries: { id_exercicio: number; numero_serie: number; repeticoes: number; peso: number }[] = [];
            for (const exercicio of exercicios) {
              for (const serie of exercicio.series.filter((s: any) => s.concluida)) {
                todasAsSeries.push({
                  id_exercicio: exercicio.id,
                  numero_serie: serie.numero,
                  repeticoes: parseInt(serie.repeticoes) || 0,
                  peso: parseFloat(serie.peso) || 0,
                });
              }
            }

            const sessionResult = await workoutApi.saveSession(user!.id, Number(id), tempoDecorrido, todasAsSeries);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (tickRef.current) clearInterval(tickRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);

            // Calcular volume total e navegar para feedback
            const volume = todasAsSeries.reduce((acc, s) => acc + s.peso * s.repeticoes, 0);
            const exerciciosPayload = exercicios
              .map((ex) => ({
                nome: ex.nome,
                series: ex.series
                  .filter((s) => s.concluida)
                  .map((s) => ({ reps: parseInt(s.repeticoes) || 0, peso: parseFloat(s.peso) || 0 })),
              }))
              .filter((ex) => ex.series.length > 0);

            router.replace({
              pathname: "/workout/feedback",
              params: {
                session_id: String(sessionResult?.id_sessao || ''),
                nome: workout?.nome || "Treino",
                duracao: String(tempoDecorrido),
                totalSeries: String(todasAsSeries.length),
                volume: String(Math.round(volume)),
                exercicios: JSON.stringify(exerciciosPayload),
              },
            });
          } catch (error) {
            console.error("Erro ao concluir treino:", error);
            Alert.alert("Erro", "Não foi possível guardar o treino");
          }
        },
      },
    ]);
  }

  // Calcular progresso global
  const totalSeries = exercicios.reduce((acc: number, ex: any) => acc + ex.series.length, 0);
  const seriesConcluidas = exercicios.reduce(
    (acc: number, ex: any) => acc + ex.series.filter((s: any) => s.concluida).length,
    0
  );
  const progressoPct = totalSeries > 0 ? seriesConcluidas / totalSeries : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 15 }}>A carregar treino...</Text>
      </View>
    );
  }

  return (

    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* ── Header: Timer + Pause ── */}
      <View style={{
        paddingTop: safeTop + 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.backgroundSecondary,
        borderBottomWidth: 1,
        borderBottomColor: theme.backgroundTertiary,
      }}>
        <Pressable
          onPress={cancelarTreino}
          accessibilityLabel="Cancelar treino"
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Ionicons name="time-outline" size={20} color={theme.accent} />
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {formatarTempo(tempoDecorrido)}
          </Text>
        </View>

        <Pressable
          onPress={togglePause}
          accessibilityLabel={timerPaused ? "Retomar treino" : "Pausar treino"}
          accessibilityRole="button"
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: timerPaused ? theme.accent : theme.backgroundTertiary,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Ionicons
            name={timerPaused ? "play" : "pause"}
            size={22}
            color={timerPaused ? "#fff" : theme.text}
          />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ...existing code for exercises... */}
        {exercicios.map((exercicio: ExercicioAtivo, index: number) => {
          const concluidas = exercicio.series.filter((s: any) => s.concluida).length;
          const todasConcluidas = concluidas === exercicio.series.length && exercicio.series.length > 0;
          return (
            <View key={exercicio.id} style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, marginBottom: 14, overflow: "hidden", flexDirection: "row" }}>
              <View style={{ width: 4, backgroundColor: todasConcluidas ? theme.accentGreen : theme.accent }} />
              <View style={{ flex: 1, padding: 16 }}>
                {/* ...existing code for exercise header, table, series, add series... */}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Barra de progresso global ── */}
      <View style={{ height: 4, backgroundColor: theme.backgroundTertiary, marginHorizontal: 24, borderRadius: 2, marginBottom: 6 }}>
        <View style={{ height: 4, width: `${progressoPct * 100}%`, backgroundColor: theme.accent, borderRadius: 2 }} />
      </View>

      {/* ── Banner de descanso ── */}
      {restTimer !== null && (
        <Pressable
          onPress={skipRestTimer}
          accessibilityLabel={`Descanso: ${restTimer} segundos restantes. Toca para saltar.`}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginHorizontal: 24,
            marginTop: 10,
            marginBottom: 8,
            borderRadius: 24,
            backgroundColor: '#173A5F',
            padding: 18,
            opacity: pressed ? 0.85 : 1,
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 18,
            elevation: 10,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {/* Circular Progress Indicator */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
            <View style={{ position: 'relative', width: 64, height: 64 }}>
              {/* Outer circle */}
              <View style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 64, height: 64,
                borderRadius: 32,
                borderWidth: 4,
                borderColor: '#007AFF33',
              }} />
              {/* Progress arc (simulate with inner circle proportional to time) */}
              <View style={{
                position: 'absolute',
                top: 4, left: 4,
                width: 56, height: 56,
                borderRadius: 28,
                backgroundColor: '#007AFF',
                opacity: 0.18 + 0.82 * (restTimer / restDefault),
              }} />
              {/* Timer value */}
              <View style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 64, height: 64,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', letterSpacing: -0.5 }}>
                  {restTimer}
                </Text>
                <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: '700', marginTop: -2 }}>
                  seg
                </Text>
              </View>
            </View>
          </View>
          {/* Info and skip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="timer-outline" size={20} color="#007AFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 }}>
                Descanso
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginRight: 8 }}>
                Toca para saltar
              </Text>
              <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
            </View>
          </View>
        </Pressable>
      )}

      {/* ── Footer fixo ── */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 28,
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.backgroundTertiary,
      }}>
        {/* ── Concluir Treino Button ── */}
        <Pressable
          onPress={concluirTreino}
          accessibilityLabel="Concluir treino"
          accessibilityRole="button"
          style={({ pressed }) => ([
            {
              // Gradient background (simulate with two colors if not using LinearGradient)
              backgroundColor: theme.accent,
              paddingVertical: 20,
              borderRadius: 24,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 12,
              opacity: pressed ? 0.92 : 1,
              shadowColor: theme.accent,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ])}
        >
          <Ionicons name="checkmark-circle" size={26} color="#fff" style={{ marginRight: 2 }} />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: -0.3 }}>
            Concluir Treino
          </Text>
          {totalSeries > 0 && (
            <View style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 2,
              marginLeft: 6,
            }}>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700" }}>
                {seriesConcluidas}/{totalSeries}
              </Text>
            </View>
          )}
        </Pressable>
        {/* Optional: Progress bar below button */}
        {totalSeries > 0 && (
          <View style={{ height: 5, backgroundColor: theme.backgroundTertiary, borderRadius: 3, marginTop: 12 }}>
            <View style={{ height: 5, width: `${progressoPct * 100}%`, backgroundColor: theme.accent, borderRadius: 3 }} />
          </View>
        )}
      </View>

    </View>
  );
}
