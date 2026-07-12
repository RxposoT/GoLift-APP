import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  AppState,
  Animated,
  Easing,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../styles/theme";
import { Text, Card } from "../../components/ui";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { workoutApi, metricsApi, planoApi } from "../../services/api";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

// ─────────────────────────────────────────────────────────────
// Linha de série — isolada num componente próprio para que o
// estado de foco de cada input não obrigue a re-renderizar a
// lista inteira de exercícios a cada toque de tecla.
// ─────────────────────────────────────────────────────────────
interface SerieRowProps {
  serie: Serie;
  index: number;
  exercicioNome: string;
  prevPeso: string;
  prevReps: string;
  hasPrevious: boolean;
  theme: any;
  onChangeValor: (campo: "peso" | "repeticoes", valor: string) => void;
  onToggleConcluida: () => void;
}

const SerieRow = memo(function SerieRow({
  serie,
  index,
  exercicioNome,
  prevPeso,
  prevReps,
  hasPrevious,
  theme,
  onChangeValor,
  onToggleConcluida,
}: SerieRowProps) {
  const [focusedPeso, setFocusedPeso] = useState(false);
  const [focusedReps, setFocusedReps] = useState(false);
  const checkScale = useRef(new Animated.Value(1)).current;

  function handleTogglePress() {
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 1.2,
        duration: 90,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onToggleConcluida();
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.background,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 4,
      }}
    >
      {/* Número da série */}
      <View style={{ width: 44, alignItems: "center" }}>
        <Text style={{ color: theme.textTertiary, fontSize: 14, fontWeight: "600" }}>
          {serie.numero || index + 1}
        </Text>
      </View>

      {/* Peso */}
      <View style={{ flex: 1, paddingRight: 6 }}>
        <TextInput
          style={{
            backgroundColor: theme.backgroundTertiary,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            color: theme.text,
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
            borderWidth: 1.5,
            borderColor: focusedPeso ? theme.accent : "transparent",
          }}
          placeholder={prevPeso}
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
          value={serie.peso}
          onChangeText={(val) => onChangeValor("peso", val)}
          onFocus={() => setFocusedPeso(true)}
          onBlur={() => setFocusedPeso(false)}
          accessibilityLabel={`Peso para série ${index + 1} de ${exercicioNome}`}
        />
        {hasPrevious && !serie.peso && (
          <Text style={{ color: theme.accent, fontSize: 9, textAlign: "center", marginTop: 2 }}>
            ↑{prevPeso}kg
          </Text>
        )}
      </View>

      {/* Repetições */}
      <View style={{ flex: 1, paddingHorizontal: 6 }}>
        <TextInput
          style={{
            backgroundColor: theme.backgroundTertiary,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            color: theme.text,
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
            borderWidth: 1.5,
            borderColor: focusedReps ? theme.accent : "transparent",
          }}
          placeholder={prevReps}
          placeholderTextColor={theme.textTertiary}
          keyboardType="number-pad"
          value={serie.repeticoes}
          onChangeText={(val) => onChangeValor("repeticoes", val)}
          onFocus={() => setFocusedReps(true)}
          onBlur={() => setFocusedReps(false)}
          accessibilityLabel={`Repetições para série ${index + 1} de ${exercicioNome}`}
        />
        {hasPrevious && !serie.repeticoes && (
          <Text style={{ color: theme.accent, fontSize: 9, textAlign: "center", marginTop: 2 }}>
            ↑{prevReps}
          </Text>
        )}
      </View>

      {/* Checkbox */}
      <Pressable
        onPress={handleTogglePress}
        accessibilityLabel={serie.concluida ? "Marcar como não concluída" : "Marcar como concluída"}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: serie.concluida }}
        style={{ width: 36, alignItems: "center", justifyContent: "center", paddingVertical: 4 }}
      >
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <Ionicons
            name={serie.concluida ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={serie.concluida ? theme.accentGreen || "#34C759" : theme.textTertiary}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Anel de descanso — arco SVG real (substitui a simulação por
// opacidade), animado suavemente a cada tick.
// ─────────────────────────────────────────────────────────────
function RestRing({ restTimer, restDefault }: { restTimer: number; restDefault: number }) {
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressAnim = useRef(new Animated.Value(restTimer / restDefault)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: restTimer / restDefault,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false, // strokeDashoffset não suporta native driver
    }).start();
  }, [restTimer, restDefault]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#007AFF33"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "bold", letterSpacing: -0.5 }}>
          {restTimer}
        </Text>
        <Text style={{ color: "#7AB8FF", fontSize: 12, fontWeight: "700", marginTop: -2 }}>
          seg
        </Text>
      </View>
    </View>
  );
}

export default function WorkoutActive() {
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const posthog = usePostHog();

  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercicios, setExercicios] = useState<ExercicioAtivo[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restDefault, setRestDefault] = useState(90);

  const tickRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);
  const timerPausedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const pausedDurationRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);

  // Animações
  const contentFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const restBannerAnim = useRef(new Animated.Value(0)).current;

  // Sync timerPaused state → ref so the interval closure always reads current value
  useEffect(() => {
    timerPausedRef.current = timerPaused;
  }, [timerPaused]);

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
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      sub.remove();
    };
  }, []);

  // Fade-in do conteúdo assim que o treino termina de carregar
  useEffect(() => {
    if (!loading) {
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  // Ponto pulsante junto ao timer — só ativo enquanto o treino corre
  useEffect(() => {
    if (!timerPaused) {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseLoopRef.current?.stop();
  }, [timerPaused]);

  // Entrada/saída animada do banner de descanso
  useEffect(() => {
    Animated.spring(restBannerAnim, {
      toValue: restTimer !== null ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [restTimer !== null]);

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
    if (state === "active") {
      if (pausedAtRef.current !== null) {
        pausedDurationRef.current += Date.now() - pausedAtRef.current;
        pausedAtRef.current = null;
      }
      setTempoDecorrido(getElapsed());
    } else if (state === "background" || state === "inactive") {
      if (!timerPausedRef.current && pausedAtRef.current === null) {
        pausedAtRef.current = Date.now();
      }
    }
  }

  async function loadWorkout() {
    try {
      const allWorkouts = await workoutApi.getUserWorkouts(user!.id).catch(() => []);
      const currentWorkout = allWorkouts.find((w: any) => w.id_treino === Number(id));
      if (currentWorkout) setWorkout(currentWorkout);

      const response = await workoutApi.getWorkoutExercises(Number(id)).catch(() => ({ exercicios: [] }));
      const exerciciosDoTreino: any[] = response?.exercicios || [];
      if (exerciciosDoTreino.length === 0) {
        Alert.alert("Aviso", "Este treino não tem exercícios definidos.");
      }

      let previousWorkoutData: any = null;
      const history = await metricsApi.getHistory(user!.id).catch(() => []);
      const thisTreinoSession = Array.isArray(history)
        ? history.find((s: any) => s.id_treino === Number(id))
        : null;
      if (thisTreinoSession?.id_sessao) {
        previousWorkoutData = await metricsApi.getSessionDetails(thisTreinoSession.id_sessao).catch(() => null);
      }

      const exerciciosAtivos: ExercicioAtivo[] = exerciciosDoTreino.map((ex: any) => {
        let previousSeries: Serie[] | undefined = undefined;

        if (previousWorkoutData?.exercicios) {
          const previousEx = previousWorkoutData.exercicios.find((pex: any) => pex.id === ex.id);
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

      posthog.capture("workout_started", {
        workout_id: Number(id),
        workout_name: currentWorkout?.nome || "Desconhecido",
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

  function ajustarRestTimer(delta: number) {
    setRestTimer((prev) => {
      if (prev === null) return prev;
      const next = Math.max(0, prev + delta);
      if (next === 0) {
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        return null;
      }
      return next;
    });
  }

  function formatarTempo(segundos: number) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
    }
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`;
  }

  function getPlaceholder(exercicioId: number, serieIndex: number, campo: "peso" | "repeticoes"): string {
    const exercicio = exercicios.find((ex: any) => ex.id === exercicioId);
    if (!exercicio?.previousSeries || !exercicio.previousSeries[serieIndex]) {
      return "-";
    }
    return campo === "peso" ? exercicio.previousSeries[serieIndex].peso : exercicio.previousSeries[serieIndex].repeticoes;
  }

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

  const atualizarSerie = useCallback(
    (exercicioId: number, serieIndex: number, campo: "repeticoes" | "peso", valor: string) => {
      setExercicios((prev) =>
        prev.map((ex: any) =>
          ex.id === exercicioId
            ? {
                ...ex,
                series: ex.series.map((s: any, i: number) => (i === serieIndex ? { ...s, [campo]: valor } : s)),
              }
            : ex
        )
      );
    },
    []
  );

  function toggleSerieConcluida(exercicioId: number, serieIndex: number) {
    const exercicio = exercicios.find((ex) => ex.id === exercicioId);
    const serieAtual = exercicio?.series[serieIndex];
    if (serieAtual && !serieAtual.concluida) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      startRestTimer();
    } else {
      skipRestTimer();
    }
    setExercicios((prev) =>
      prev.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: ex.series.map((s: any, i: number) => (i === serieIndex ? { ...s, concluida: !s.concluida } : s)),
            }
          : ex
      )
    );
  }

  function adicionarSerie(exercicioId: number) {
    setExercicios((prev) =>
      prev.map((ex: any) =>
        ex.id === exercicioId
          ? {
              ...ex,
              series: [
                ...ex.series,
                { numero: ex.series.length + 1, repeticoes: "", peso: "", concluida: false },
              ],
            }
          : ex
      )
    );
  }

  function cancelarTreino() {
    Alert.alert("Cancelar Treino", "Tens a certeza? Todo o progresso será perdido.", [
      { text: "Continuar Treino", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: () => {
          if (tickRef.current) clearInterval(tickRef.current);
          router.back();
        },
      },
    ]);
  }

  async function concluirTreino() {
    const temSeriesConcluidas = exercicios.some((ex: any) => ex.series.some((s: any) => s.concluida));
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

            const volume = todasAsSeries.reduce((acc, s) => acc + s.peso * s.repeticoes, 0);
            const exerciciosPayload = exercicios
              .map((ex) => ({
                nome: ex.nome,
                series: ex.series
                  .filter((s) => s.concluida)
                  .map((s) => ({ reps: parseInt(s.repeticoes) || 0, peso: parseFloat(s.peso) || 0 })),
              }))
              .filter((ex) => ex.series.length > 0);

            posthog.capture("workout_completed", {
              workout_id: Number(id),
              workout_nome: workout?.nome || "Treino",
              duracao_segundos: tempoDecorrido,
              total_series: todasAsSeries.length,
              volume_total: Math.round(volume),
              exercicios_count: exerciciosPayload.length,
            });

            if (tickRef.current) clearInterval(tickRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);

            router.replace({
              pathname: "/workout/feedback",
              params: {
                session_id: String(sessionResult?.id_sessao || ""),
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

  const totalSeries = exercicios.reduce((acc: number, ex: any) => acc + ex.series.length, 0);
  const seriesConcluidas = exercicios.reduce(
    (acc: number, ex: any) => acc + ex.series.filter((s: any) => s.concluida).length,
    0
  );
  const progressoPct = totalSeries > 0 ? seriesConcluidas / totalSeries : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressoPct,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width em % não suporta native driver
    }).start();
  }, [progressoPct]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
      <View
        style={{
          paddingTop: safeTop + 12,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: theme.backgroundSecondary,
          borderBottomWidth: 1,
          borderBottomColor: theme.backgroundTertiary,
        }}
      >
        <Pressable
          onPress={cancelarTreino}
          accessibilityLabel="Cancelar treino"
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View>
            <Ionicons name="time-outline" size={20} color={theme.accent} />
            {!timerPaused && (
              <Animated.View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.accentGreen || "#34C759",
                  opacity: pulseAnim,
                }}
              />
            )}
          </View>
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
          <Ionicons name={timerPaused ? "play" : "pause"} size={22} color={timerPaused ? "#fff" : theme.text} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: contentFade }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
      >
        {exercicios.map((exercicio: ExercicioAtivo) => {
          const concluidas = exercicio.series.filter((s: any) => s.concluida).length;
          const todasConcluidas = concluidas === exercicio.series.length && exercicio.series.length > 0;
          return (
            <View
              key={exercicio.id}
              style={{
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 20,
                marginHorizontal: 16,
                marginBottom: 14,
                overflow: "hidden",
                flexDirection: "row",
              }}
            >
              <View style={{ width: 4, backgroundColor: todasConcluidas ? theme.accentGreen : theme.accent }} />
              <View style={{ flex: 1, padding: 16 }}>
                {/* ── Exercise Header ── */}
                <Pressable
                  onPress={() => autoFillFromPrevious(exercicio.id, 0)}
                  accessibilityLabel={`${exercicio.nome}, ${concluidas} de ${exercicio.series.length} séries concluídas`}
                  accessibilityRole="header"
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}
                >
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700", flex: 1 }} numberOfLines={2}>
                    {exercicio.nome}
                  </Text>
                  <View
                    style={{
                      backgroundColor: todasConcluidas ? (theme.accentGreen || "#34C759") + "22" : theme.backgroundTertiary,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: todasConcluidas ? theme.accentGreen || "#34C759" : theme.textSecondary,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {concluidas}/{exercicio.series.length}
                    </Text>
                  </View>
                </Pressable>

                {/* ── Series Table ── */}
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, marginBottom: 2 }}>
                    <Text style={{ width: 44, color: theme.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                      SÉRIE
                    </Text>
                    <Text style={{ flex: 1, color: theme.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                      PESO (kg)
                    </Text>
                    <Text style={{ flex: 1, color: theme.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>
                      REPS
                    </Text>
                    <View style={{ width: 36 }} />
                  </View>

                  {exercicio.series.map((serie: Serie, sIndex: number) => {
                    const prevPeso = getPlaceholder(exercicio.id, sIndex, "peso");
                    const prevReps = getPlaceholder(exercicio.id, sIndex, "repeticoes");
                    const hasPrevious = prevPeso !== "-" && prevReps !== "-";
                    return (
                      <SerieRow
                        key={sIndex}
                        serie={serie}
                        index={sIndex}
                        exercicioNome={exercicio.nome}
                        prevPeso={prevPeso}
                        prevReps={prevReps}
                        hasPrevious={hasPrevious}
                        theme={theme}
                        onChangeValor={(campo, valor) => atualizarSerie(exercicio.id, sIndex, campo, valor)}
                        onToggleConcluida={() => {
                          autoFillFromPrevious(exercicio.id, sIndex);
                          toggleSerieConcluida(exercicio.id, sIndex);
                        }}
                      />
                    );
                  })}
                </View>

                {/* ── Add Series Button ── */}
                <Pressable
                  onPress={() => adicionarSerie(exercicio.id)}
                  accessibilityLabel={`Adicionar série a ${exercicio.nome}`}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 10,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: theme.backgroundTertiary,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons name="add-circle-outline" size={18} color={theme.accent} />
                  <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "700" }}>Adicionar Série</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* ── Barra de progresso global (animada) ── */}
      <View
        style={{
          height: 4,
          backgroundColor: theme.backgroundTertiary,
          marginHorizontal: 24,
          borderRadius: 2,
          marginBottom: 6,
          overflow: "hidden",
        }}
      >
        <Animated.View style={{ height: 4, width: progressWidth, backgroundColor: theme.accent, borderRadius: 2 }} />
      </View>

      {/* ── Banner de descanso ── */}
      {restTimer !== null && (
        <Animated.View
          style={{
            marginHorizontal: 24,
            marginTop: 10,
            marginBottom: 8,
            opacity: restBannerAnim,
            transform: [
              {
                translateY: restBannerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
              },
            ],
          }}
        >
          <Pressable
            onPress={skipRestTimer}
            accessibilityLabel={`Descanso: ${restTimer} segundos restantes. Toca para saltar.`}
            accessibilityRole="button"
            style={({ pressed }) => ({
              borderRadius: 24,
              backgroundColor: "#0B1E33",
              padding: 18,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#007AFF",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 18,
              elevation: 10,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <View style={{ marginBottom: 6 }}>
              <RestRing restTimer={restTimer} restDefault={restDefault} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="timer-outline" size={20} color="#7AB8FF" style={{ marginRight: 6 }} />
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.2 }}>Descanso</Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <TouchableOpacity
                  onPress={() => ajustarRestTimer(-15)}
                  accessibilityLabel="Tirar 15 segundos ao descanso"
                  hitSlop={8}
                  style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Text style={{ color: "#7AB8FF", fontSize: 13, fontWeight: "700" }}>-15s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => ajustarRestTimer(15)}
                  accessibilityLabel="Adicionar 15 segundos ao descanso"
                  hitSlop={8}
                  style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Text style={{ color: "#7AB8FF", fontSize: 13, fontWeight: "700" }}>+15s</Text>
                </TouchableOpacity>
                <Ionicons name="arrow-forward-circle" size={22} color="#fff" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Footer fixo ── */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 28,
          backgroundColor: theme.background,
          borderTopWidth: 1,
          borderTopColor: theme.backgroundTertiary,
        }}
      >
        <Pressable
          onPress={concluirTreino}
          accessibilityLabel="Concluir treino"
          accessibilityRole="button"
          style={({ pressed }) => [
            {
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
          ]}
        >
          <Ionicons name="checkmark-circle" size={26} color="#fff" style={{ marginRight: 2 }} />
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: -0.3 }}>Concluir Treino</Text>
          {totalSeries > 0 && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 2,
                marginLeft: 6,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700" }}>
                {seriesConcluidas}/{totalSeries}
              </Text>
            </View>
          )}
        </Pressable>

        {totalSeries > 0 && (
          <View style={{ height: 5, backgroundColor: theme.backgroundTertiary, borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
            <Animated.View style={{ height: 5, width: progressWidth, backgroundColor: theme.accent, borderRadius: 3 }} />
          </View>
        )}
      </View>
    </View>
  );
}