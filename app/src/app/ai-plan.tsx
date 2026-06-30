import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { planoApi } from "../services/api";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";

interface Exercicio {
  nome: string;
  series: number;
  repeticoes: string;
  observacao?: string;
}

interface DiaPlano {
  dia: string;
  foco: string;
  exercicios: Exercicio[];
}

interface PlanoIA {
  descricao: string;
  split: DiaPlano[];
}

// ─── Wizard data ───────────────────────────────────────────────
const DIAS_OPTIONS = [3, 4, 5, 6, 7];

const TEMPO_OPTIONS = [
  { label: "30 min", value: 30, desc: "Treino rápido e focado" },
  { label: "45 min", value: 45, desc: "Sessão equilibrada" },
  { label: "60 min", value: 60, desc: "Treino completo" },
  { label: "90+ min", value: 90, desc: "Sessões longas intensas" },
];

const OBJETIVO_OPTIONS = [
  { id: "musculo", label: "Ganhar Músculo", icon: "barbell" as const, color: "#0A84FF" },
  { id: "forca",   label: "Ganhar Força",  icon: "flash"   as const, color: "#10b981" },
  { id: "peso",    label: "Perder Peso",   icon: "flame"   as const, color: "#f59e0b" },
  { id: "atividade", label: "Manter Atividade", icon: "heart" as const, color: "#d946ef" },
];

const TARGET_OPTIONS = [
  { id: "Peito",   icon: "body"         as const },
  { id: "Costas",  icon: "arrow-back"   as const },
  { id: "Ombros",  icon: "triangle"     as const },
  { id: "Braços",  icon: "barbell"      as const },
  { id: "Pernas",  icon: "footsteps"    as const },
  { id: "Glúteos", icon: "accessibility" as const },
  { id: "Core",    icon: "ellipse"      as const },
];

const DESCANSO_OPTIONS = [
  { label: "30s",  value: 30,  desc: "Muito intenso" },
  { label: "45s",  value: 45,  desc: "Intenso" },
  { label: "60s",  value: 60,  desc: "Moderado" },
  { label: "90s",  value: 90,  desc: "Standard" },
  { label: "120s", value: 120, desc: "Relaxado" },
  { label: "180s", value: 180, desc: "Muito relaxado" },
];

const WIZARD_STEPS = 6;

const FOCO_COLORS: Record<string, string> = {
  peito: "#f87171",
  costas: "#60a5fa",
  ombros: "#fb923c",
  braços: "#a78bfa",
  pernas: "#4ade80",
  glúteos: "#f472b6",
  core: "#facc15",
  cardio: "#34d399",
  default: "#687C88",
};

function getFocoColor(foco: string): string {
  const lower = foco.toLowerCase();
  for (const key of Object.keys(FOCO_COLORS)) {
    if (lower.includes(key)) return FOCO_COLORS[key];
  }
  return FOCO_COLORS.default;
}

export default function AIPlan() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop, safeBottom } = useAndroidInsets();
  const [plano, setPlano] = useState<PlanoIA | null>(null);
  const [mes, setMes] = useState<string>("");
  const [criadoEm, setCriadoEm] = useState<string | null>(null);
  const [podeGerar, setPodeGerar] = useState(false);
  const isAdmin = user?.tipo === 1;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [semPlano, setSemPlano] = useState(false);
  const [diaExpandido, setDiaExpandido] = useState<number | null>(null);
  const [importedDays, setImportedDays] = useState<Set<number>>(new Set());
  const [importingDay, setImportingDay] = useState<number | null>(null);

  // ── Wizard state ──────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState(1);
  const [wDias, setWDias] = useState(4);
  const [wTempo, setWTempo] = useState(60);
  const [wObjetivo, setWObjetivo] = useState<string>((user as any)?.objetivo || "musculo");
  const [wTargets, setWTargets] = useState<string[]>([]);
  const [wCondicoes, setWCondicoes] = useState("");
  const [wDescanso, setWDescanso] = useState(90);

  useEffect(() => {
    if (user?.id) loadPlan();
  }, [user]);

  // Pre-select user's objetivo when it loads
  useEffect(() => {
    if ((user as any)?.objetivo) setWObjetivo((user as any).objetivo);
  }, [user]);

  async function loadPlan() {
    setLoading(true);
    try {
      const data = await planoApi.getPlan(user!.id);
      if (data.plano) {
        setPlano(data.plano);
        setMes(data.mes || "");
        setCriadoEm(data.criado_em || null);
        setPodeGerar(isAdmin ? true : false);
        setDiaExpandido(0);
      } else {
        setPodeGerar(data.pode_gerar || isAdmin);
        setMes(data.mes || "");
      }
    } catch (err: any) {
      if (err?.status === 403) {
        setSemPlano(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleImportDay(dia: DiaPlano, idx: number) {
    if (importedDays.has(idx) || importingDay !== null) return;
    setImportingDay(idx);
    try {
      await planoApi.importPlanDay(user!.id, dia.dia, dia.foco, dia.exercicios);
      setImportedDays(prev => new Set([...prev, idx]));
      Alert.alert("Treino adicionado!", `"${dia.dia}" foi adicionado aos teus treinos.`);
    } catch (err: any) {
      Alert.alert("Erro", err?.message || "Não foi possível importar o treino.");
    } finally {
      setImportingDay(null);
    }
  }

  function handleWizardBack() {
    if (wizardStep > 1) setWizardStep(s => s - 1);
    else router.back();
  }

  function handleWizardNext() {
    if (wizardStep < WIZARD_STEPS) setWizardStep(s => s + 1);
    else handleGenerate();
  }

  function toggleTarget(id: string) {
    setWTargets(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    Alert.alert(
      "Gerar Plano Mensal",
      `Gerar plano para ${wDias} dias/semana, ${wTempo === 90 ? "90+" : wTempo} min?\n\nNota: Só podes gerar um plano por mês.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Gerar", onPress: generatePlan },
      ]
    );
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const data = await planoApi.generatePlan(user!.id, {
        diasPorSemana: wDias,
        tempoTreino: wTempo,
        objetivo: wObjetivo,
        targets: wTargets,
        condicoes: wCondicoes,
        descansoEntreSeriesSegundos: wDescanso,
      });
      if (data.plano) {
        setPlano(data.plano as PlanoIA);
        setMes(data.mes || "");
        setPodeGerar(false);
        setDiaExpandido(0);
      }
    } catch (err: any) {
      Alert.alert(
        err?.message?.includes("Limite") ? "IA Indisponível" : "Erro",
        err?.message || "Não foi possível gerar o plano. Tenta mais tarde."
      );
    } finally {
      setGenerating(false);
    }
  }

  function formatMes(mesStr: string) {
    if (!mesStr) return "";
    const [ano, m] = mesStr.split("-");
    const data = new Date(Number(ano), Number(m) - 1, 1);
    return data.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  }

  // ─── Wizard step labels ──────────────────────────────────────
  const STEP_TITLES = [
    "Quantos dias treinas?",
    "Duração do treino",
    "Qual é o teu objetivo?",
    "Grupos musculares",
    "Condições ou notas",
    "Descanso entre séries",
  ];

  const STEP_SUBTITLES = [
    "Sessões por semana",
    "Tempo médio por sessão",
    "Foco principal do plano",
    "Prioridades (opcional — vários)",
    "Lesões, limitações, preferências…",
    "Segundos de pausa entre séries",
  ];

  // Wizard is active only if user can generate, hasn't started generating, and has no plan
  const showWizard = podeGerar && !generating && !plano;

  // ─── Rendering ───────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (semPlano) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 14,
              backgroundColor: theme.backgroundSecondary,
              justifyContent: "center", alignItems: "center",
              marginRight: 14, opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
            Plano de Treino
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 36 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24,
            backgroundColor: theme.accent + "22",
            justifyContent: "center", alignItems: "center",
            marginBottom: 20,
          }}>
            <Ionicons name="sparkles" size={32} color={theme.accent} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text, textAlign: "center", letterSpacing: -0.5, marginBottom: 10 }}>
            Funcionalidade Pro
          </Text>
          <Text style={{ color: theme.textSecondary, textAlign: "center", lineHeight: 22, fontSize: 15, marginBottom: 28 }}>
            Subscreve o GoLift Pro para gerares planos de treino mensais personalizados com IA.
          </Text>
          <Pressable
            onPress={() => router.push("/upgrade")}
            style={({ pressed }) => ({
              backgroundColor: theme.accent, borderRadius: 14,
              paddingVertical: 14, paddingHorizontal: 32,
              flexDirection: "row", alignItems: "center", gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Ver Planos Pro</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Wizard full-screen ────────────────────────────────────────
  if (showWizard) {
    const isLastStep = wizardStep === WIZARD_STEPS;
    const canContinue =
      wizardStep === 3 ? !!wObjetivo :
      true; // steps 1,2,4,5,6 always allow continue

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={handleWizardBack}
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: theme.backgroundSecondary,
                justifyContent: "center", alignItems: "center",
                marginRight: 14, opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: theme.textSecondary }}>
                PASSO {wizardStep} DE {WIZARD_STEPS}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textTertiary, marginTop: 1 }}>
                {STEP_SUBTITLES[wizardStep - 1]}
              </Text>
            </View>
            <View style={{ backgroundColor: theme.accent + "18", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="sparkles" size={12} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>IA</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ height: 4, backgroundColor: theme.backgroundTertiary, borderRadius: 2 }}>
            <View style={{
              height: 4, borderRadius: 2,
              backgroundColor: theme.accent,
              width: `${(wizardStep / WIZARD_STEPS) * 100}%`,
            }} />
          </View>
        </View>

        {/* Step title */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, letterSpacing: -0.8 }}>
            {STEP_TITLES[wizardStep - 1]}
          </Text>
        </View>

        {/* Step content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">

          {/* Step 1 — Dias */}
          {wizardStep === 1 && (
            <View style={{ gap: 10 }}>
              {DIAS_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setWDias(d)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    borderRadius: 18,
                    backgroundColor: wDias === d ? theme.accent : theme.backgroundSecondary,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: wDias === d ? "rgba(255,255,255,0.2)" : theme.backgroundTertiary,
                    justifyContent: "center", alignItems: "center", marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: wDias === d ? "#fff" : theme.text }}>
                      {d}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: wDias === d ? "#fff" : theme.text }}>
                      {d} dias por semana
                    </Text>
                    <Text style={{ fontSize: 13, color: wDias === d ? "rgba(255,255,255,0.7)" : theme.textSecondary, marginTop: 2 }}>
                      {d <= 3 ? "Iniciante / manutenção" : d <= 4 ? "Intermediário" : d <= 5 ? "Avançado" : "Atleta / alta intensidade"}
                    </Text>
                  </View>
                  {wDias === d && (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 2 — Tempo */}
          {wizardStep === 2 && (
            <View style={{ gap: 10 }}>
              {TEMPO_OPTIONS.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setWTempo(t.value)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 18,
                    borderRadius: 18,
                    backgroundColor: wTempo === t.value ? theme.accent : theme.backgroundSecondary,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: wTempo === t.value ? "rgba(255,255,255,0.2)" : theme.backgroundTertiary,
                    justifyContent: "center", alignItems: "center", marginRight: 14,
                  }}>
                    <Ionicons name="time-outline" size={22} color={wTempo === t.value ? "#fff" : theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, color: wTempo === t.value ? "#fff" : theme.text }}>
                      {t.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: wTempo === t.value ? "rgba(255,255,255,0.7)" : theme.textSecondary, marginTop: 2 }}>
                      {t.desc}
                    </Text>
                  </View>
                  {wTempo === t.value && (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Step 3 — Objetivo */}
          {wizardStep === 3 && (
            <View style={{ gap: 10 }}>
              {OBJETIVO_OPTIONS.map((o) => {
                const selected = wObjetivo === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setWObjetivo(o.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 18,
                      borderRadius: 18,
                      backgroundColor: selected ? o.color : theme.backgroundSecondary,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: selected ? "rgba(255,255,255,0.2)" : o.color + "18",
                      justifyContent: "center", alignItems: "center", marginRight: 14,
                    }}>
                      <Ionicons name={o.icon} size={22} color={selected ? "#fff" : o.color} />
                    </View>
                    <Text style={{ flex: 1, fontWeight: "700", fontSize: 16, color: selected ? "#fff" : theme.text }}>
                      {o.label}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Step 4 — Targets (multi-select) */}
          {wizardStep === 4 && (
            <>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
                Seleciona os grupos que queres priorizar. Podes deixar vazio para um plano equilibrado.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {TARGET_OPTIONS.map((t) => {
                  const selected = wTargets.includes(t.id);
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => toggleTarget(t.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        backgroundColor: selected ? theme.accent : theme.backgroundSecondary,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Ionicons name={t.icon} size={16} color={selected ? "#fff" : theme.textSecondary} />
                      <Text style={{ fontWeight: "600", fontSize: 14, color: selected ? "#fff" : theme.text }}>
                        {t.id}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Step 5 — Condições */}
          {wizardStep === 5 && (
            <>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
                Indica lesões, limitações físicas, equipamento disponível ou qualquer preferência específica. Podes deixar vazio.
              </Text>
              <TextInput
                value={wCondicoes}
                onChangeText={setWCondicoes}
                placeholder="Ex: tendinite no joelho direito, sem acesso a máquinas, prefiro exercícios compostos…"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: 18,
                  padding: 16,
                  color: theme.text,
                  fontSize: 15,
                  lineHeight: 22,
                  minHeight: 140,
                }}
              />
            </>
          )}

          {/* Step 6 — Descanso */}
          {wizardStep === 6 && (
            <>
              <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 16 }}>
                O plano vai usar este valor como padrão entre séries. Podes ajustar durante o treino.
              </Text>
              <View style={{ gap: 10 }}>
                {DESCANSO_OPTIONS.map((d) => (
                  <Pressable
                    key={d.value}
                    onPress={() => setWDescanso(d.value)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      borderRadius: 18,
                      backgroundColor: wDescanso === d.value ? theme.accent : theme.backgroundSecondary,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <View style={{
                      width: 52, height: 44, borderRadius: 12,
                      backgroundColor: wDescanso === d.value ? "rgba(255,255,255,0.2)" : theme.backgroundTertiary,
                      justifyContent: "center", alignItems: "center", marginRight: 14,
                    }}>
                      <Text style={{ fontWeight: "800", fontSize: 15, color: wDescanso === d.value ? "#fff" : theme.text }}>
                        {d.label}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, color: wDescanso === d.value ? "rgba(255,255,255,0.8)" : theme.textSecondary }}>
                      {d.desc}
                    </Text>
                    {wDescanso === d.value && (
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </>
          )}

        </ScrollView>

        {/* Bottom button */}
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: safeBottom + 16 }}>
          <Pressable
            onPress={handleWizardNext}
            disabled={!canContinue}
            style={({ pressed }) => ({
              backgroundColor: canContinue ? theme.accent : theme.backgroundTertiary,
              borderRadius: 18,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              opacity: pressed ? 0.85 : 1,
              shadowColor: canContinue ? theme.accent : "transparent",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: canContinue ? 6 : 0,
            })}
          >
            {isLastStep ? (
              <>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                </View>
                <Text style={{ color: canContinue ? "#fff" : theme.textTertiary, fontWeight: "800", fontSize: 17, letterSpacing: -0.3 }}>
                  {isAdmin ? "Gerar novo plano" : "Gerar Plano com IA"}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: canContinue ? "#fff" : theme.textTertiary, fontWeight: "700", fontSize: 17 }}>
                  Continuar
                </Text>
                <Ionicons name="arrow-forward" size={18} color={canContinue ? "#fff" : theme.textTertiary} />
              </>
            )}
          </Pressable>
          {isLastStep && (
            <Text style={{ color: theme.textTertiary, fontSize: 11, textAlign: "center", marginTop: 10 }}>
              {isAdmin ? "Como admin, podes gerar quantos planos quiseres." : "Podes gerar um plano por mês."}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Generating state ─────────────────────────────────────────
  if (generating) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <View style={{
          width: 80, height: 80, borderRadius: 24,
          backgroundColor: theme.accent + "22",
          justifyContent: "center", alignItems: "center",
          marginBottom: 24,
        }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 20, marginBottom: 8, letterSpacing: -0.5 }}>
          A criar o teu plano...
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
          Pode demorar alguns segundos
        </Text>
      </View>
    );
  }

  // ── Plan display ─────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 16, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: theme.backgroundSecondary,
            justifyContent: "center", alignItems: "center",
            marginRight: 14, opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>
            Plano de Treino
          </Text>
          {mes && (
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 1 }}>
              {formatMes(mes)}
            </Text>
          )}
        </View>
        <View style={{ backgroundColor: theme.accent + "18", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Ionicons name="sparkles" size={12} color={theme.accent} />
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>IA</Text>
        </View>
      </View>

      {/* Plano gerado */}
      {plano && (
        <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
          {/* Método */}
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 20,
            padding: 18,
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.accent + "18", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="information-circle" size={18} color={theme.accent} />
              </View>
              <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15 }}>Método</Text>
            </View>
            <Text style={{ color: theme.textSecondary, lineHeight: 22, fontSize: 14 }}>{plano.descricao}</Text>
          </View>

          {/* Dias de treino */}
          {plano.split?.map((dia, idx) => {
            const cor = getFocoColor(dia.foco);
            const aberto = diaExpandido === idx;
            return (
              <View key={idx} style={{
                backgroundColor: aberto ? theme.backgroundTertiary : theme.backgroundSecondary,
                borderRadius: 20,
                marginBottom: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: aberto ? cor + "35" : theme.backgroundTertiary,
              }}>
                <Pressable
                  onPress={() => setDiaExpandido(aberto ? null : idx)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: cor + "22",
                      justifyContent: "center", alignItems: "center",
                    }}>
                      <Ionicons name="barbell-outline" size={18} color={cor} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: "700", color: theme.text, fontSize: 15 }}>{dia.dia}</Text>
                      <Text style={{ color: cor, fontSize: 12, marginTop: 1, fontWeight: "700", letterSpacing: 0.2 }}>{dia.foco}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>
                      {dia.exercicios?.length || 0} exercícios
                    </Text>
                    <Ionicons name={aberto ? "chevron-up" : "chevron-down"} size={16} color={theme.textTertiary} />
                  </View>
                </Pressable>

                {/* Exercícios */}
                {aberto && (
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.backgroundTertiary }}>
                    {dia.exercicios?.map((ex, ei) => (
                      <View key={ei} style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        borderBottomWidth: ei < dia.exercicios.length - 1 ? 1 : 0,
                        borderBottomColor: theme.backgroundTertiary,
                      }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <Text style={{ fontWeight: "600", color: theme.text, fontSize: 14, lineHeight: 20 }}>
                            {ex.nome}
                          </Text>
                          {!!ex.observacao && (
                            <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 4, lineHeight: 16 }} numberOfLines={2}>
                              {ex.observacao}
                            </Text>
                          )}
                        </View>
                        <View>
                          <View style={{
                            backgroundColor: cor + "22", borderRadius: 8,
                            paddingHorizontal: 10, paddingVertical: 4,
                          }}>
                            <Text style={{ color: cor, fontWeight: "700", fontSize: 12 }}>
                              {ex.series}×{ex.repeticoes}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Botão importar */}
                    <View style={{ padding: 16, paddingTop: 12 }}>
                      <Pressable
                        onPress={() => handleImportDay(dia, idx)}
                        disabled={importedDays.has(idx) || importingDay !== null}
                        style={({ pressed }) => ({
                          backgroundColor: importedDays.has(idx) ? "#22c55e18" : cor + "15",
                          borderRadius: 14,
                          paddingVertical: 12,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 8,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        {importingDay === idx ? (
                          <ActivityIndicator size="small" color={cor} />
                        ) : importedDays.has(idx) ? (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                            <Text style={{ color: "#22c55e", fontWeight: "600", fontSize: 14 }}>Adicionado aos treinos</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="add-circle-outline" size={16} color={cor} />
                            <Text style={{ color: cor, fontWeight: "600", fontSize: 14 }}>Adicionar aos meus treinos</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Footer info */}
          {criadoEm && (
            <View style={{
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 14, padding: 14,
              flexDirection: "row", alignItems: "center", gap: 8,
              marginTop: 8,
            }}>
              <Ionicons name="sparkles-outline" size={14} color={theme.textTertiary} />
              <Text style={{ color: theme.textTertiary, fontSize: 11, flex: 1, lineHeight: 16 }}>
                Gerado em {new Date(criadoEm).toLocaleDateString("pt-PT")} com IA.
                {" "}Próximo plano disponível em{" "}
                {new Date(new Date(criadoEm).getFullYear(), new Date(criadoEm).getMonth() + 1, 1).toLocaleDateString("pt-PT")}.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
