import { useState } from "react";
import {
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { Text, Button, Input } from "../components/ui";
import { spacing, radius } from "../styles/tokens";
import { IMC_COLORS, AMBER } from "../styles/colors";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { Ionicons } from "@expo/vector-icons";

type Step = "conta" | "perfil" | "objetivo";
type WeightUnit = "kg" | "lbs";

const objectives = [
  { id: "musculo", label: "Ganhar Músculo", icon: "barbell" as const },
  { id: "forca", label: "Ganhar Força", icon: "flash" as const },
  { id: "peso", label: "Perder Peso", icon: "flame" as const },
  { id: "atividade", label: "Manter Atividade", icon: "heart" as const },
];

export default function Register() {
  const { register } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [step, setStep] = useState<Step>("conta");
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [objetivo, setObjetivo] = useState<string>("");
  const [pesoAlvo, setPesoAlvo] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");

  const stepIndex = ["conta", "perfil", "objetivo"].indexOf(step);
  const progressPercent = ((stepIndex + 1) / 3) * 100;
  const needsTargetWeight = objetivo === "musculo" || objetivo === "peso";

  function validateStep1(): boolean {
    if (!nome.trim()) { Alert.alert("Erro", "Insere o teu nome"); return false; }
    if (!email.trim() || !email.includes("@")) { Alert.alert("Erro", "Insere um email válido"); return false; }
    if (password.length < 8) { Alert.alert("Erro", "A password deve ter pelo menos 8 caracteres"); return false; }
    if (!/\d/.test(password)) { Alert.alert("Atenção", "A password deve incluir pelo menos um número"); return false; }
    return true;
  }

  function validateStep2(): boolean {
    if (!idade || isNaN(Number(idade)) || Number(idade) < 10 || Number(idade) > 120) {
      Alert.alert("Erro", "Insere uma idade válida (10-120)");
      return false;
    }
    if (!peso || isNaN(Number(peso)) || Number(peso) < 20) {
      Alert.alert("Erro", "Insere um peso válido");
      return false;
    }
    if (!altura || isNaN(Number(altura)) || Number(altura) < 50) {
      Alert.alert("Erro", "Insere uma altura válida");
      return false;
    }
    return true;
  }

  function handleNext() {
    if (step === "conta" && validateStep1()) setStep("perfil");
    else if (step === "perfil" && validateStep2()) setStep("objetivo");
  }

  async function handleRegister() {
    if (!objetivo) { Alert.alert("Erro", "Escolhe um objetivo"); return; }
    setLoading(true);
    try {
      const pesoKg = weightUnit === "lbs" ? Number(peso) * 0.453592 : Number(peso);
      await register({
        nome,
        email,
        password,
        idade: Number(idade),
        peso: pesoKg,
        altura: Number(altura),
        objetivo,
        pesoAlvo: needsTargetWeight
          ? (weightUnit === "lbs" ? Number(pesoAlvo) * 0.453592 : Number(pesoAlvo))
          : undefined,
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/\d/.test(password)) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.xxl, paddingTop: safeTop + 12 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
          <View style={{
            width: 56, height: 56, backgroundColor: theme.accent + "18", borderRadius: radius.lg,
            alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Ionicons name="barbell" size={30} color={theme.accent} />
          </View>
          {step === "conta" && <Text variant="title1">Cria a tua conta</Text>}
          {step === "perfil" && <Text variant="title1">O teu perfil</Text>}
          {step === "objetivo" && <Text variant="title1">O teu objetivo</Text>}
          <Text variant="subhead" color="textSecondary" style={{ marginTop: 6 }}>Passo {stepIndex + 1} de 3</Text>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 3, backgroundColor: theme.backgroundSecondary, borderRadius: 2, marginBottom: spacing.xxl, overflow: "hidden" }}>
          <View style={{ height: "100%", backgroundColor: theme.accent, width: `${progressPercent}%`, borderRadius: 2 }} />
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, gap: spacing.lg }}>
          {/* STEP 1: CONTA */}
          {step === "conta" && (
            <View style={{ flex: 1, justifyContent: "center", gap: spacing.md }}>
              <Input
                leftIcon="person-outline" placeholder="O teu nome" value={nome} onChangeText={setNome}
                autoFocus
              />
              <Input
                leftIcon="mail-outline" placeholder="exemplo@email.com" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none"
              />
              <View>
                <Input
                  leftIcon="lock-closed-outline" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword}
                  isPassword
                />
                {password.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: spacing.sm }}>
                      {[1, 2, 3, 4].map((l) => (
                        <View key={l} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          backgroundColor: pwStrength >= l
                            ? pwStrength <= 1 ? IMC_COLORS.obese2 : pwStrength === 2 ? AMBER : IMC_COLORS.normal
                            : theme.backgroundTertiary,
                        }} />
                      ))}
                    </View>
                    <Text variant="subhead" style={{ color: pwStrength <= 1 ? IMC_COLORS.obese2 : pwStrength === 2 ? AMBER : IMC_COLORS.normal, fontWeight: "600" }}>
                      {pwStrength <= 1 ? "Fraca" : pwStrength === 2 ? "Média" : "Forte"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* STEP 2: PERFIL */}
          {step === "perfil" && (
            <View style={{ flex: 1, justifyContent: "center", gap: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Input
                    leftIcon="calendar-outline" placeholder="Idade" value={idade} onChangeText={setIdade}
                    keyboardType="number-pad" autoFocus
                  />
                </View>
                <UnitToggle value={weightUnit} onChange={setWeightUnit} theme={theme} />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Input
                    leftIcon="scale-outline" placeholder={weightUnit === "kg" ? "Peso (kg)" : "Peso (lbs)"}
                    value={peso} onChangeText={setPeso} keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    leftIcon="resize-outline" placeholder="Altura (cm)"
                    value={altura} onChangeText={setAltura} keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: OBJETIVO */}
          {step === "objetivo" && (
            <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
              {objectives.map((obj) => (
                <Pressable
                  key={obj.id}
                  onPress={() => setObjetivo(obj.id)}
                  style={{
                    backgroundColor: objetivo === obj.id ? theme.primary : theme.backgroundSecondary,
                    borderColor: objetivo === obj.id ? theme.primary : theme.border,
                    borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md,
                    flexDirection: "row", alignItems: "center",
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: objetivo === obj.id ? "#ffffff33" : theme.backgroundTertiary,
                    alignItems: "center", justifyContent: "center", marginRight: spacing.md,
                  }}>
                    <Ionicons name={obj.icon} size={22} color={objetivo === obj.id ? "#fff" : theme.text} />
                  </View>
                  <Text variant="headline" style={{ color: objetivo === obj.id ? "#fff" : theme.text, flex: 1 }}>
                    {obj.label}
                  </Text>
                  {objetivo === obj.id && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                </Pressable>
              ))}

              {needsTargetWeight && (
                <View style={{ marginTop: spacing.sm }}>
                  <Text variant="callout" color="textSecondary" style={{ textAlign: "center", fontWeight: "500", marginBottom: spacing.sm }}>
                    {objetivo === "musculo" ? "Peso que queres ganhar (kg)" : "Peso que queres atingir (kg)"}
                  </Text>
                  <Input
                    leftIcon="trending-up-outline" placeholder="Peso alvo"
                    value={pesoAlvo} onChangeText={setPesoAlvo} keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={{ paddingVertical: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {stepIndex > 0 && (
              <Button variant="secondary" onPress={() => setStep(step === "perfil" ? "conta" : "perfil")} style={{ flex: 1 }}>
                Voltar
              </Button>
            )}
            <Button
              variant="primary"
              loading={loading}
              onPress={step === "objetivo" ? handleRegister : handleNext}
              style={{ flex: stepIndex > 0 ? 1 : undefined, width: stepIndex === 0 ? "100%" : undefined }}
            >
              {step === "objetivo" ? "Criar Conta" : "Continuar"}
            </Button>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text variant="footnote" color="textSecondary">Já tens conta? </Text>
            <Link href="/login">
              <Text variant="footnote" color="accent" style={{ fontWeight: "700" }}>Fazer Login</Text>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Helpers ── */

function UnitToggle({ value, onChange, theme }: { value: WeightUnit; onChange: (v: WeightUnit) => void; theme: any }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
      {(["kg", "lbs"] as WeightUnit[]).map((u) => (
        <Pressable
          key={u}
          onPress={() => onChange(u)}
          style={{
            paddingHorizontal: 14, paddingVertical: 15,
            backgroundColor: value === u ? theme.text : "transparent",
            borderRadius: value === u ? 11 : 0,
          }}
        >
          <Text style={{
            color: value === u ? theme.background : theme.textSecondary,
            fontWeight: "700", fontSize: 13,
          }}>{u.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}
