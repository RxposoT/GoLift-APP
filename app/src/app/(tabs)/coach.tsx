import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text, Card, Button } from "../../components/ui";
import { useTheme } from "../../styles/theme";
import { useAndroidInsets } from "../../hooks/useAndroidInsets";
import { useAuth } from "../../contexts/AuthContext";
import { planoApi, userApi } from "../../services/api";
import { spacing, radius as R, iconSize } from "../../styles/tokens";

type GorilaMood = "idle" | "sleeping" | "concerned" | "celebrating" | "talking" | "angry";
type ConversationState = "initial" | "input" | "analyzing" | "proposal" | "success";

const GORILA_IMAGES: Record<GorilaMood, any> = {
  idle: require("../../../assets/images/Gorila.png"),
  talking: require("../../../assets/images/Gorila_friendly.png"),
  celebrating: require("../../../assets/images/Gorila_celebrating.png"),
  concerned: require("../../../assets/images/Gorila_concerned.png"),
  sleeping: require("../../../assets/images/Gorila_sleeping.png"),
  angry: require("../../../assets/images/Gorila_angry.png"),
};

const MOOD_ANIMATIONS: Record<GorilaMood, { scale: number; rotate: string; translateY: number }> = {
  idle: { scale: 1, rotate: "0deg", translateY: 0 },
  talking: { scale: 1.03, rotate: "1.5deg", translateY: -3 },
  celebrating: { scale: 1.1, rotate: "-2deg", translateY: -8 },
  concerned: { scale: 0.95, rotate: "4deg", translateY: 4 },
  sleeping: { scale: 0.9, rotate: "8deg", translateY: 8 },
  angry: { scale: 1.08, rotate: "-3deg", translateY: -3 },
};

const RECOVERY_WORKOUTS: Record<string, Array<{ nome: string; series: number; repeticoes: string; observacao?: string }>> = {
  Peito: [
    { nome: "Alongamento de Peito na Parede", series: 3, repeticoes: "30 segundos", observacao: "Sentir alongamento suave" },
    { nome: "Aberturas com Halteres Leves (Fase Excêntrica Lenta)", series: 3, repeticoes: "15 repetições", observacao: "Carga mínima" },
    { nome: "Prancha com Toque no Ombro", series: 3, repeticoes: "10 repetições", observacao: "Estabilidade do core" },
  ],
  Costas: [
    { nome: "Prancha Isométrica", series: 3, repeticoes: "45 segundos", observacao: "Manter alinhamento lombar" },
    { nome: "Bird Dog", series: 3, repeticoes: "12 repetições", observacao: "Foco no equilíbrio" },
    { nome: "Cat-Cow Stretch", series: 3, repeticoes: "15 repetições", observacao: "Respiração lenta" },
    { nome: "Ponte de Glúteos", series: 3, repeticoes: "15 repetições", observacao: "Ativação de cadeia posterior" },
  ],
  Ombros: [
    { nome: "Rotação Externa com Banda", series: 3, repeticoes: "15 repetições", observacao: "Cotovelos colados ao corpo" },
    { nome: "Face Pull com Carga Mínima", series: 3, repeticoes: "15 repetições", observacao: "Puxar em direção à testa" },
    { nome: "Alongamento de Peitorais no Puxador", series: 3, repeticoes: "30 segundos", observacao: "Alongamento leve" },
  ],
  Braços: [
    { nome: "Alongamento Dinâmico de Flexores do Punho", series: 3, repeticoes: "20 segundos", observacao: "Sem forçar articulação" },
    { nome: "Flexão de Punho Leve", series: 3, repeticoes: "15 repetições", observacao: "Halter de 1-2kg" },
    { nome: "Extensão de Tríceps Neutra Lenta", series: 3, repeticoes: "12 repetições", observacao: "Movimento controlado" },
  ],
  Pernas: [
    { nome: "Elevação de Pernas Deitado", series: 3, repeticoes: "15 repetições", observacao: "Lento, sem pressa" },
    { nome: "Alongamento de Isquiotibiais Dinâmico", series: 3, repeticoes: "30 segundos", observacao: "Perna estendida suavemente" },
    { nome: "Rotação de Tornozelo", series: 3, repeticoes: "20 repetições", observacao: "10 rotações para cada lado" },
    { nome: "Extensão de Pernas Leve", series: 3, repeticoes: "15 repetições", observacao: "Carga mínima" },
  ],
  Glúteos: [
    { nome: "Alongamento do Piriforme Sentado", series: 3, repeticoes: "30 segundos", observacao: "Segurar a posição" },
    { nome: "Clamshells", series: 3, repeticoes: "15 repetições", observacao: "Ativação do glúteo médio" },
    { nome: "Ponte de Glúteos Unilateral", series: 3, repeticoes: "12 repetições", observacao: "Sem balançar ancas" },
  ],
  Core: [
    { nome: "Prancha Lateral", series: 3, repeticoes: "30 segundos", observacao: "Para cada lado" },
    { nome: "Deadbug", series: 3, repeticoes: "12 repetições", observacao: "Controlar lombar contra o chão" },
    { nome: "Alongamento Cobra", series: 3, repeticoes: "20 segundos", observacao: "Relaxar abdómen" },
  ],
};

function detectMuscle(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("peito") || lower.includes("peitoral")) return "Peito";
  if (lower.includes("costas") || lower.includes("lombar") || lower.includes("dorsal")) return "Costas";
  if (lower.includes("ombro") || lower.includes("clavicula")) return "Ombros";
  if (lower.includes("braço") || lower.includes("bicep") || lower.includes("tricep") || lower.includes("cotovelo") || lower.includes("punho")) return "Braços";
  if (lower.includes("perna") || lower.includes("joelho") || lower.includes("tornozelo") || lower.includes("quadriceps") || lower.includes("femoral") || lower.includes("coxa")) return "Pernas";
  if (lower.includes("gluteo") || lower.includes("rabo") || lower.includes("anca")) return "Glúteos";
  if (lower.includes("barriga") || lower.includes("abdominal") || lower.includes("core")) return "Core";
  return "Pernas"; // default fallback
}

export default function GorilaCoach() {
  const { user } = useAuth();
  const theme = useTheme();
  const { safeTop, safeBottom } = useAndroidInsets();

  // State Machine
  const [step, setStep] = useState<ConversationState>("initial");
  const [chatType, setChatType] = useState<"dor" | "duvida" | null>(null);
  const [userText, setUserText] = useState("");
  const [speech, setSpeech] = useState("Olá! Sou o teu Gorila Coach. Como te sentes hoje? Escolhe um assunto para falarmos.");
  const [mood, setMood] = useState<GorilaMood>("idle");

  const [planoTipo, setPlanoTipo] = useState<"free" | "pago">("free");
  const [detectedMuscle, setDetectedMuscle] = useState("Pernas");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  // Sincronizar dados de subscrição
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        planoApi.getUserPlan(user.id)
          .then(d => setPlanoTipo(d.plano as "free" | "pago"))
          .catch(() => {});
      }
    }, [user])
  );

  // Trigger animations when mood changes
  useEffect(() => {
    const config = MOOD_ANIMATIONS[mood];
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: config.scale,
        damping: 10,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: config.translateY,
        damping: 10,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mood]);

  function startChat(type: "dor" | "duvida") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatType(type);
    setUserText("");
    if (type === "dor") {
      setMood("concerned");
      setSpeech("Onde sentes dor ou que lesão tiveste? Descreve-me detalhadamente o que sentes para que eu possa avaliar.");
    } else {
      setMood("talking");
      setSpeech("Que dúvida gostarias de esclarecer hoje? Podes perguntar sobre postura, carga, nutrição ou consistência.");
    }
    setStep("input");
  }

  function handleSubmit() {
    if (!userText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("analyzing");
    setMood("talking");
    setSpeech("Estou a analisar as tuas palavras e a rever o teu histórico de treinos...");

    // Simular o tempo de processamento do modelo/IA
    setTimeout(() => {
      const muscle = detectMuscle(userText);
      setDetectedMuscle(muscle);

      if (chatType === "dor") {
        setMood("concerned");
        setSpeech(`Entendi. Para dores ou lesões em ${muscle} devido a '${userText.substring(0, 30)}...', recomendo evitar esforço direto nessa área. Queres que crie um treino especial de reabilitação e mobilidade para ${muscle} e o adicione à tua rotina?`);
      } else {
        setMood("talking");
        setSpeech(`Interessante! Para melhorares em relação a '${userText.substring(0, 30)}...', sugiro ajustar o teu volume ou postura. Queres que crie uma rotina de mobilidade para ${muscle} para te ajudar?`);
      }
      setStep("proposal");
    }, 2200);
  }

  async function handleAcceptProposal() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (planoTipo !== "pago") {
      // Bloqueio de subscrição para utilizadores não pagos
      setMood("talking");
      setSpeech("A geração e adaptação automática de treinos de reabilitação é uma funcionalidade exclusiva do GoLift Pro! Subscreve para obteres rotinas geridas por mim.");
      return;
    }

    setIsSubmitting(true);
    try {
      const exercises = RECOVERY_WORKOUTS[detectedMuscle] || RECOVERY_WORKOUTS.Pernas;
      await planoApi.importPlanDay(
        user!.id,
        `Recuperação: ${detectedMuscle}`,
        `Mobilidade e Reabilitação de ${detectedMuscle}`,
        exercises
      );
      setMood("celebrating");
      setSpeech(`Perfeito! O treino 'Recuperação: ${detectedMuscle}' foi adicionado aos teus treinos ativos. Faz cada movimento com calma e sem pressas!`);
      setStep("success");
    } catch (err: any) {
      Alert.alert("Erro", "Não foi possível registar o teu treino. Tenta novamente.");
      setStep("proposal");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("initial");
    setChatType(null);
    setUserText("");
    setMood("idle");
    setSpeech("Olá! Sou o teu Gorila Coach. Como te sentes hoje? Escolhe um assunto para falarmos.");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      {/* Header */}
      <View style={{
        paddingHorizontal: 24,
        paddingTop: safeTop + 16,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}>
        {step !== "initial" && (
          <Pressable onPress={handleReset} style={{ marginRight: 16, padding: 4 }}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </Pressable>
        )}
        <Text variant="title2" style={{ letterSpacing: -0.6, flex: 1, fontWeight: "800" }}>
          Treinador
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", paddingBottom: safeBottom + 120 }}>
        
        {/* ─── CENTRAL MASCOT & SPEECH BUBBLE ─── */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: spacing.xl }}>
          
          {/* Dialogue Balloon */}
          <View style={{
            backgroundColor: theme.backgroundSecondary,
            borderRadius: R.xl,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: theme.border + "30",
            width: "100%",
            maxWidth: 340,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            position: "relative",
          }}>
            <Text variant="callout" style={{ color: theme.text, textAlign: "center", lineHeight: 21, fontWeight: "500" }}>
              {speech}
            </Text>
            {/* Balloon triangle tail */}
            <View style={{
              position: "absolute",
              bottom: -9,
              alignSelf: "center",
              width: 16,
              height: 16,
              backgroundColor: theme.backgroundSecondary,
              transform: [{ rotate: "45deg" }],
              borderBottomWidth: 1,
              borderRightWidth: 1,
              borderColor: theme.border + "30",
            }} />
          </View>

          <View style={{ position: "relative", alignItems: "center", justifyContent: "flex-end", zIndex: 1 }}>
            {/* Spotlight / Floor Shadow */}
            <Animated.View
              style={{
                position: "absolute",
                bottom: -60,
                width: 180,
                height: 180,
                backgroundColor: theme.text,
                opacity: 0.25,
                borderRadius: 90,
                transform: [
                  { scaleY: 0.35 },
                  {
                    scale: translateYAnim.interpolate({
                      inputRange: [-15, 0, 15],
                      outputRange: [0.75, 1, 1.1],
                    }),
                  },
                ],
              }}
            />

            {/* Gorilla Chibi Image */}
            <Animated.Image
              source={GORILA_IMAGES[mood]}
              style={{
                width: 230,
                height: 230,
                transform: [
                  { scale: scaleAnim },
                  { translateY: translateYAnim },
                ],
              }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ─── INTERACTION ZONE (STEP-BASED) ─── */}
        <View style={{ paddingHorizontal: 24, width: "100%", gap: spacing.md }}>
          
          {step === "initial" && (
            <View style={{ gap: spacing.md, width: "100%" }}>
              <Button
                variant="primary"
                size="lg"
                onPress={() => startChat("dor")}
                icon={<Ionicons name="heart-dislike-outline" size={20} color={theme.accent} />}
              >
                Tenho uma Dor ou Lesão
              </Button>

              <Button
                variant="primary"
                size="lg"
                onPress={() => startChat("duvida")}
                icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.accent} />}
              >
                Quero Tirar uma Dúvida
              </Button>
            </View>
          )}

          {step === "input" && (
            <View style={{ gap: spacing.md, width: "100%" }}>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder={chatType === "dor" ? "Ex: Torci o joelho direito a fazer agachamento..." : "Ex: Como progredir carga no supino?"}
                placeholderTextColor={theme.textSecondary + "70"}
                value={userText}
                onChangeText={setUserText}
                style={{
                  backgroundColor: theme.backgroundSecondary,
                  borderRadius: R.lg,
                  borderWidth: 1.5,
                  borderColor: theme.border + "50",
                  padding: spacing.md,
                  color: theme.text,
                  fontSize: 15,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
              <View style={{ gap: spacing.md, width: "100%" }}>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!userText.trim()}
                  style={{ width: "100%", opacity: userText.trim() ? 1 : 0.6 }}
                  onPress={handleSubmit}
                >
                  Submeter
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  style={{ width: "100%" }}
                  onPress={handleReset}
                >
                  Voltar
                </Button>
              </View>
            </View>
          )}

          {step === "analyzing" && (
            <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
              <ActivityIndicator color={theme.accent} size="large" />
            </View>
          )}

          {step === "proposal" && (
            <View style={{ gap: spacing.md, width: "100%" }}>
              {planoTipo === "pago" ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    onPress={handleAcceptProposal}
                  >
                    Sim, criar treino de recuperação
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={handleReset}
                  >
                    Não, manter treinos como estão
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push("/upgrade");
                    }}
                  >
                    Desbloquear GoLift Pro
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={handleReset}
                  >
                    Voltar
                  </Button>
                </>
              )}
            </View>
          )}

          {step === "success" && (
            <View style={{ width: "100%" }}>
              <Button
                variant="secondary"
                size="lg"
                onPress={handleReset}
              >
                Voltar ao Início
              </Button>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
