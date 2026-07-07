import { useState, useMemo } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { Text, Button, Input } from "../components/ui";
import { authApi } from "../services/api";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { spacing, radius } from "../styles/tokens";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<"email" | "password" | null>(null);

  const emailError = useMemo(
    () => (touched === "email" && email.trim() && !EMAIL_RE.test(email) ? "Email inválido" : undefined),
    [email, touched]
  );
  const passwordError = useMemo(
    () => (touched === "password" && password.trim().length > 0 && password.length < 6 ? "Mínimo 6 caracteres" : undefined),
    [password, touched]
  );

  async function handleLogin() {
    setTouched("email");
    setTouched("password");
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preenche todos os campos");
      return;
    }
    if (emailError) {
      Alert.alert("Erro", emailError);
      return;
    }

    setLoading(true);
    try {
      const health = await authApi.testConnection();
      if (!health.sucesso) {
        Alert.alert(
          "Sem ligação ao servidor",
          `GET /api/health falhou:\n${health.mensagem}`
        );
        setLoading(false);
        return;
      }
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(`[${error.name || "Erro"}]`, error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
            paddingHorizontal: spacing.xxl,
            paddingTop: safeTop + 24,
            paddingBottom: 48,
          }}
        >
          {/* Brand */}
          <View>
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: theme.accent,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name="barbell" size={26} color="#fff" />
            </View>
            <Text variant="display" style={{ lineHeight: 46 }}>
              GoLift
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <Text variant="body" color="textSecondary">
                Bem-vindo de volta
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={{ gap: spacing.md }}>
            <Input
              label="Email"
              leftIcon="mail-outline"
              placeholder="exemplo@email.com"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched("email")}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched("password")}
              error={passwordError}
              isPassword
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={{ alignSelf: "flex-end" }}
              onPress={() => router.push("/forgot-password")}
            >
              <Text variant="callout" color="accent">
                Esqueceste a password?
              </Text>
            </TouchableOpacity>

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
            >
              Entrar
            </Button>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text variant="body" color="textSecondary">
              Não tens conta?{" "}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text variant="body" color="accent">
                  Criar conta
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
