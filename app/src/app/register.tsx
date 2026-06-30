import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type Step = "nome" | "email" | "password" | "idade" | "peso" | "altura" | "objetivo" | "pesoAlvo";
type WeightUnit = "kg" | "lbs";
type HeightUnit = "cm" | "in";

const objectives = [
  { id: "musculo", label: "Ganhar Músculo", icon: "barbell", color: "#0A84FF" },
  { id: "forca", label: "Ganhar Força", icon: "flash", color: "#10b981" },
  { id: "peso", label: "Perder Peso", icon: "flame", color: "#f59e0b" },
  { id: "atividade", label: "Manter Atividade", icon: "heart", color: "#d946ef" },
];

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;

interface PickerWheelProps {
  value: number;
  minValue: number;
  maxValue: number;
  step: number;
  onChange: (value: number) => void;
  unit: string;
  theme: any;
}

function PickerWheel({ value, minValue, maxValue, step, onChange, unit, theme }: PickerWheelProps) {
  const scrollRef = useRef<FlatList>(null);
  const items = Array.from({ length: Math.ceil((maxValue - minValue) / step) + 1 }, (_, i) => minValue + i * step);

  const handleScroll = (event: any) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffsetY / ITEM_HEIGHT);
    if (index >= 0 && index < items.length) {
      onChange(items[index]);
    }
  };

  const getItemStyle = (item: number) => {
    const currentIndex = items.indexOf(value);
    const itemIndex = items.indexOf(item);
    const diff = Math.abs(itemIndex - currentIndex);
    
    let opacity = 1;
    let scale = 1;
    
    if (diff === 0) {
      opacity = 1;
      scale = 1;
    } else if (diff === 1) {
      opacity = 0.4;
      scale = 0.85;
    } else if (diff === 2) {
      opacity = 0.2;
      scale = 0.75;
    } else {
      opacity = 0.1;
      scale = 0.7;
    }
    
    return { opacity, scale };
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ 
        height: ITEM_HEIGHT * VISIBLE_ITEMS, 
        overflow: "hidden", 
        width: 180,
        position: "relative",
      }}>
        {/* Fade superior */}
        <LinearGradient
          colors={[theme.background, 'transparent']}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
        
        {/* Fade inferior */}
        <LinearGradient
          colors={['transparent', theme.background]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: ITEM_HEIGHT * 2,
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        {/* Linhas de seleção */}
        <View style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 10,
          right: 10,
          height: ITEM_HEIGHT,
          borderTopColor: theme.border,
          borderBottomColor: theme.border,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          zIndex: 5,
          pointerEvents: "none",
        }} />

        <FlatList
          ref={scrollRef}
          data={items}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => {
            const { opacity, scale } = getItemStyle(item);
            return (
              <View style={{ 
                height: ITEM_HEIGHT, 
                justifyContent: "center", 
                alignItems: "center",
                opacity,
                transform: [{ scale }],
              }}>
                <Text style={{
                  fontSize: 38,
                  fontWeight: "600",
                  color: theme.text,
                }}>
                  {item}
                </Text>
              </View>
            );
          }}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      </View>
      
      {/* Unidade abaixo do picker */}
      <Text style={{ 
        fontSize: 16, 
        fontWeight: "600", 
        color: theme.textSecondary, 
        marginTop: 20,
        textTransform: "uppercase",
        letterSpacing: 2,
      }}>
        {unit}
      </Text>
    </View>
  );
}

export default function Register() {
  const { register } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [step, setStep] = useState<Step>("nome");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [idade, setIdade] = useState(25);
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(175);
  const [objetivo, setObjetivo] = useState<string>("");
  const [pesoAlvo, setPesoAlvo] = useState(70);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  // Inicializar peso alvo quando vai para o step pesoAlvo
  useEffect(() => {
    if (step === "pesoAlvo" && pesoAlvo === 70 && peso !== 70) {
      setPesoAlvo(peso);
    }
  }, [step]);

  // Steps dinâmicos baseados no objetivo
  const needsTargetWeight = objetivo === "musculo" || objetivo === "peso";
  const baseSteps: Step[] = ["nome", "email", "password", "idade", "peso", "altura", "objetivo"];
  const steps: Step[] = needsTargetWeight ? [...baseSteps, "pesoAlvo"] : baseSteps;
  const stepIndex = steps.indexOf(step);
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  const stepTitles: Record<Step, string> = {
    nome: "Como te chamas?",
    email: "Qual é o teu email?",
    password: "Cria uma password",
    idade: "Qual é a tua idade?",
    peso: "Qual é o teu peso?",
    altura: "Qual é a tua altura?",
    objetivo: "Qual é o teu objetivo?",
    pesoAlvo: objetivo === "musculo" ? "Qual peso queres atingir?" : "Qual é o teu peso alvo?",
  };

  function handleNextStep() {
    if (step === "nome" && !nome.trim()) {
      Alert.alert("Erro", "Insere o teu nome");
      return;
    }
    if (step === "email" && (!email.trim() || !email.includes("@"))) {
      Alert.alert("Erro", "Insere um email válido");
      return;
    }
    if (step === "password" && password.length < 8) {
      Alert.alert("Erro", "A password deve ter pelo menos 8 caracteres");
      return;
    }
    if (step === "password" && !/\d/.test(password)) {
      Alert.alert("Atenção", "A password deve incluir pelo menos um número");
      return;
    }
    if (step === "objetivo" && !objetivo) {
      Alert.alert("Erro", "Escolhe um objetivo");
      return;
    }
    
    // Se estamos no objetivo e precisa de peso alvo, vai para pesoAlvo
    if (step === "objetivo" && (objetivo === "musculo" || objetivo === "peso")) {
      setStep("pesoAlvo");
      return;
    }
    
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < steps.length) {
      setStep(steps[nextStepIndex]);
    }
  }

  async function handleRegister() {
    setLoading(true);
    try {
      // Converter para unidades padrão (kg e cm)
      const pesoKg = weightUnit === "lbs" ? peso * 0.453592 : peso;
      const alturaCm = heightUnit === "in" ? altura * 2.54 : altura;

      await register({
        nome,
        email,
        password,
        idade,
        peso: pesoKg,
        altura: alturaCm,
        objetivo,
        pesoAlvo: needsTargetWeight ? (weightUnit === "lbs" ? pesoAlvo * 0.453592 : pesoAlvo) : undefined,
      });
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  function handlePrevStep() {
    const prevStepIndex = stepIndex - 1;
    if (prevStepIndex >= 0) {
      setStep(steps[prevStepIndex]);
    }
  }

  const renderContent = () => {
    switch (step) {
      case "nome":
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="person-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 15, paddingHorizontal: 12, fontSize: 16 }}
                placeholder="O teu nome"
                placeholderTextColor={theme.textSecondary}
                value={nome}
                onChangeText={setNome}
                autoFocus
              />
            </View>
          </View>
        );

      case "email":
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 15, paddingHorizontal: 12, fontSize: 16 }}
                placeholder="exemplo@email.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
            </View>
          </View>
        );

      case "password":
        const pwStrength = (() => {
          if (password.length === 0) return 0;
          let score = 0;
          if (password.length >= 8) score++;
          if (/\d/.test(password)) score++;
          if (/[A-Z]/.test(password)) score++;
          if (/[^a-zA-Z0-9]/.test(password)) score++;
          return score;
        })();
        const strengthLabel = pwStrength === 0 ? "" : pwStrength <= 1 ? "Fraca" : pwStrength <= 2 ? "Média" : "Forte";
        const strengthColor = pwStrength <= 1 ? "#ef4444" : pwStrength === 2 ? "#f59e0b" : "#10b981";
        return (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.backgroundSecondary,
              borderRadius: 16,
              borderColor: theme.border,
              borderWidth: 1,
              paddingHorizontal: 18,
            }}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={{ flex: 1, color: theme.text, paddingVertical: 15, paddingHorizontal: 12, fontSize: 16 }}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {/* Indicador de força */}
            {password.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                  {[1, 2, 3, 4].map((level) => (
                    <View key={level} style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: pwStrength >= level ? strengthColor : theme.backgroundTertiary,
                    }} />
                  ))}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: strengthColor, fontSize: 13, fontWeight: "600" }}>
                    {strengthLabel}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {password.length < 8 && `${8 - password.length} caracteres em falta`}
                    {password.length >= 8 && !/\d/.test(password) && "Adiciona um número"}
                    {password.length >= 8 && /\d/.test(password) && !/[A-Z]/.test(password) && "Add maiúsculas para mais força"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        );

      case "idade":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <PickerWheel
              value={idade}
              minValue={15}
              maxValue={100}
              step={1}
              onChange={setIdade}
              unit="Anos"
              theme={theme}
            />
          </View>
        );

      case "peso":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: weightUnit === "kg" ? theme.text : theme.backgroundSecondary,
                  borderColor: weightUnit === "kg" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "kg" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: weightUnit === "lbs" ? theme.text : theme.backgroundSecondary,
                  borderColor: weightUnit === "lbs" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "lbs" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  LBS
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={peso}
                minValue={weightUnit === "kg" ? 40 : 88}
                maxValue={weightUnit === "kg" ? 200 : 440}
                step={1}
                onChange={setPeso}
                unit={weightUnit === "kg" ? "Quilogramas" : "Libras"}
                theme={theme}
              />
            </View>
          </View>
        );

      case "altura":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setHeightUnit("cm")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: heightUnit === "cm" ? theme.text : theme.backgroundSecondary,
                  borderColor: heightUnit === "cm" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: heightUnit === "cm" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  CM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setHeightUnit("in")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: heightUnit === "in" ? theme.text : theme.backgroundSecondary,
                  borderColor: heightUnit === "in" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: heightUnit === "in" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  IN
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={altura}
                minValue={heightUnit === "cm" ? 140 : 55}
                maxValue={heightUnit === "cm" ? 230 : 90}
                step={1}
                onChange={setAltura}
                unit={heightUnit === "cm" ? "Centímetros" : "Polegadas"}
                theme={theme}
              />
            </View>
          </View>
        );

      case "objetivo":
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
            {objectives.map((obj) => (
              <TouchableOpacity
                key={obj.id}
                onPress={() => setObjetivo(obj.id)}
                style={{
                  backgroundColor: objetivo === obj.id ? theme.text : theme.backgroundSecondary,
                  borderColor: objetivo === obj.id ? theme.text : theme.border,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: objetivo === obj.id ? theme.background + "22" : theme.background,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <Ionicons
                    name={obj.icon as any}
                    size={22}
                    color={objetivo === obj.id ? obj.color : theme.text}
                  />
                </View>
                <Text style={{
                  color: objetivo === obj.id ? theme.background : theme.text,
                  fontSize: 16,
                  fontWeight: "600",
                  flex: 1,
                }}>
                  {obj.label}
                </Text>
                {objetivo === obj.id && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case "pesoAlvo":
        return (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: weightUnit === "kg" ? theme.text : theme.backgroundSecondary,
                  borderColor: weightUnit === "kg" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "kg" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: weightUnit === "lbs" ? theme.text : theme.backgroundSecondary,
                  borderColor: weightUnit === "lbs" ? theme.text : theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: weightUnit === "lbs" ? theme.background : theme.textSecondary, fontWeight: "700", fontSize: 13 }}>
                  LBS
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <PickerWheel
                value={pesoAlvo}
                minValue={weightUnit === "kg" ? 40 : 88}
                maxValue={weightUnit === "kg" ? 200 : 440}
                step={1}
                onChange={setPesoAlvo}
                unit={weightUnit === "kg" ? "Quilogramas" : "Libras"}
                theme={theme}
              />
            </View>
            <Text style={{ textAlign: "center", color: theme.textSecondary, fontSize: 14, marginTop: 16 }}>
              {objetivo === "musculo" ? "Peso que pretendes ganhar" : "Peso que pretendes atingir"}
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={{ flex: 1 }}>
        {/* Conteúdo Principal */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: safeTop + 12 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{
              width: 56,
              height: 56,
              backgroundColor: theme.accent + "18",
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}>
              <Ionicons name="barbell" size={30} color={theme.accent} />
            </View>
            <Text style={{ fontSize: 26, fontWeight: "800", color: theme.text, textAlign: "center", letterSpacing: -0.5 }}>
              {stepTitles[step]}
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 6, fontSize: 13 }}>
              Passo {stepIndex + 1} de {steps.length}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={{
            height: 3,
            backgroundColor: theme.backgroundSecondary,
            borderRadius: 2,
            marginBottom: 24,
            overflow: "hidden",
          }}>
            <View
              style={{
                height: "100%",
                backgroundColor: theme.accent,
                width: `${progressPercent}%`,
                borderRadius: 2,
              }}
            />
          </View>

          {/* Conteúdo do Step */}
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {renderContent()}
          </ScrollView>
        </View>

        {/* Botões Fixos na Base */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.background }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {stepIndex > 0 && (
              <TouchableOpacity
                onPress={handlePrevStep}
                style={{
                  flex: 1,
                  backgroundColor: theme.backgroundSecondary,
                  paddingVertical: 11,
                  borderRadius: 14,
                  alignItems: "center",
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>Voltar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={(step === "objetivo" && !needsTargetWeight) || step === "pesoAlvo" ? handleRegister : handleNextStep}
              disabled={loading}
              style={{
                flex: stepIndex > 0 ? 1 : undefined,
                width: stepIndex === 0 ? "100%" : undefined,
                backgroundColor: theme.accent,
                paddingVertical: 11,
                borderRadius: 14,
                alignItems: "center",
                opacity: loading ? 0.7 : 1,
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  {(step === "objetivo" && !needsTargetWeight) || step === "pesoAlvo" ? "Criar Conta" : "Continuar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Link Login */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 14 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Já tens conta?{" "}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 13 }}>
                  Fazer Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
