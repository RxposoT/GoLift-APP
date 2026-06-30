import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
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
  const [showPassword, setShowPassword] = useState(false);

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
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: safeTop + 12 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{
            width: 56, height: 56, backgroundColor: theme.accent + "18", borderRadius: 16,
            alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Ionicons name="barbell" size={30} color={theme.accent} />
          </View>
          {step === "conta" && <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>Cria a tua conta</Text>}
          {step === "perfil" && <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>O teu perfil</Text>}
          {step === "objetivo" && <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, letterSpacing: -0.5 }}>O teu objetivo</Text>}
          <Text style={{ color: theme.textSecondary, marginTop: 6, fontSize: 13 }}>Passo {stepIndex + 1} de 3</Text>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 3, backgroundColor: theme.backgroundSecondary, borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
          <View style={{ height: "100%", backgroundColor: theme.accent, width: `${progressPercent}%`, borderRadius: 2 }} />
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, gap: 16 }}>
          {/* STEP 1: CONTA */}
          {step === "conta" && (
            <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
              <InputField
                icon="person-outline" placeholder="O teu nome" value={nome} onChangeText={setNome}
                theme={theme} autoFocus
              />
              <InputField
                icon="mail-outline" placeholder="exemplo@email.com" value={email} onChangeText={setEmail}
                theme={theme} keyboardType="email-address" autoCapitalize="none"
              />
              <View>
                <InputField
                  icon="lock-closed-outline" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword}
                  theme={theme} secureTextEntry={!showPassword}
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightPress={() => setShowPassword(!showPassword)}
                />
                {password.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                      {[1, 2, 3, 4].map((l) => (
                        <View key={l} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          backgroundColor: pwStrength >= l
                            ? pwStrength <= 1 ? "#ef4444" : pwStrength === 2 ? "#f59e0b" : "#10b981"
                            : theme.backgroundTertiary,
                        }} />
                      ))}
                    </View>
                    <Text style={{ color: pwStrength <= 1 ? "#ef4444" : pwStrength === 2 ? "#f59e0b" : "#10b981", fontSize: 13, fontWeight: "600" }}>
                      {pwStrength <= 1 ? "Fraca" : pwStrength === 2 ? "Média" : "Forte"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* STEP 2: PERFIL */}
          {step === "perfil" && (
            <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.backgroundSecondary, borderRadius: 16, borderColor: theme.border, borderWidth: 1, paddingHorizontal: 18 }}>
                    <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                    <TextInput
                      style={{ flex: 1, color: theme.text, paddingVertical: 15, paddingHorizontal: 12, fontSize: 16 }}
                      placeholder="Idade" placeholderTextColor={theme.textSecondary}
                      value={idade} onChangeText={setIdade} keyboardType="number-pad" autoFocus
                    />
                  </View>
                </View>
                <UnitToggle value={weightUnit} onChange={setWeightUnit} theme={theme} />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <InputField
                    icon="scale-outline" placeholder={weightUnit === "kg" ? "Peso (kg)" : "Peso (lbs)"}
                    value={peso} onChangeText={setPeso} theme={theme} keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    icon="resize-outline" placeholder="Altura (cm)"
                    value={altura} onChangeText={setAltura} theme={theme} keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: OBJETIVO */}
          {step === "objetivo" && (
            <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
              {objectives.map((obj) => (
                <TouchableOpacity
                  key={obj.id}
                  onPress={() => setObjetivo(obj.id)}
                  style={{
                    backgroundColor: objetivo === obj.id ? theme.primary : theme.backgroundSecondary,
                    borderColor: objetivo === obj.id ? theme.primary : theme.border,
                    borderWidth: 1.5, borderRadius: 16, padding: 14,
                    flexDirection: "row", alignItems: "center",
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: objetivo === obj.id ? "#ffffff33" : theme.backgroundTertiary,
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <Ionicons name={obj.icon} size={22} color={objetivo === obj.id ? "#fff" : theme.text} />
                  </View>
                  <Text style={{ color: objetivo === obj.id ? "#fff" : theme.text, fontSize: 16, fontWeight: "600", flex: 1 }}>
                    {obj.label}
                  </Text>
                  {objetivo === obj.id && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                </TouchableOpacity>
              ))}

              {needsTargetWeight && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 8 }}>
                    {objetivo === "musculo" ? "Peso que queres ganhar (kg)" : "Peso que queres atingir (kg)"}
                  </Text>
                  <InputField
                    icon="trending-up-outline" placeholder="Peso alvo"
                    value={pesoAlvo} onChangeText={setPesoAlvo} theme={theme} keyboardType="decimal-pad"
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Buttons */}
        <View style={{ paddingVertical: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {stepIndex > 0 && (
              <TouchableOpacity
                onPress={() => setStep(step === "perfil" ? "conta" : "perfil")}
                style={{ flex: 1, backgroundColor: theme.backgroundSecondary, paddingVertical: 11, borderRadius: 14, alignItems: "center", borderColor: theme.border, borderWidth: 1 }}
              >
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>Voltar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={step === "objetivo" ? handleRegister : handleNext}
              disabled={loading}
              style={{
                flex: stepIndex > 0 ? 1 : undefined, width: stepIndex === 0 ? "100%" : undefined,
                backgroundColor: theme.primary, paddingVertical: 11, borderRadius: 14,
                alignItems: "center", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  {step === "objetivo" ? "Criar Conta" : "Continuar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Já tens conta? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>Fazer Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Helpers ── */

function InputField({
  icon, placeholder, value, onChangeText, theme, secureTextEntry,
  keyboardType, autoCapitalize, autoFocus, rightIcon, onRightPress,
}: {
  icon: string; placeholder: string; value: string; onChangeText: (t: string) => void;
  theme: any; secureTextEntry?: boolean; keyboardType?: any; autoCapitalize?: any;
  autoFocus?: boolean; rightIcon?: string; onRightPress?: () => void;
}) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme.backgroundSecondary, borderRadius: 16,
      borderColor: theme.border, borderWidth: 1, paddingHorizontal: 18,
    }}>
      <Ionicons name={icon as any} size={20} color={theme.textSecondary} />
      <TextInput
        style={{ flex: 1, color: theme.text, paddingVertical: 15, paddingHorizontal: 12, fontSize: 16 }}
        placeholder={placeholder} placeholderTextColor={theme.textSecondary}
        value={value} onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress}>
          <Ionicons name={rightIcon as any} size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function UnitToggle({ value, onChange, theme }: { value: WeightUnit; onChange: (v: WeightUnit) => void; theme: any }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: theme.backgroundSecondary, borderRadius: 12, borderColor: theme.border, borderWidth: 1 }}>
      {(["kg", "lbs"] as WeightUnit[]).map((u) => (
        <TouchableOpacity
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
        </TouchableOpacity>
      ))}
    </View>
  );
}
