import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { authApi } from "../services/api";
import { useAndroidInsets } from "../hooks/useAndroidInsets";


export default function Login() {
  const { login } = useAuth();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preenche todos os campos");
      return;
    }

    setLoading(true);
    try {
      // 1) Teste de conectividade GET simples
      const health = await authApi.testConnection();
      if (!health.sucesso) {
        Alert.alert(
          "Sem ligação ao servidor",
          `GET /api/health falhou:\n${health.mensagem}\n\nO Android pode estar a bloquear HTTP.`
        );
        setLoading(false);
        return;
      }

      // 2) Login real
      await login(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        `[${error.name || "Erro"}]`,
        `${error.message}`
      );
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
        <View style={{ flex: 1, justifyContent: "space-between", paddingHorizontal: 28, paddingTop: safeTop + 24, paddingBottom: 48 }}>

          {/* Brand */}
          <View>
            <View style={{
              width: 48,
              height: 48,
              backgroundColor: theme.accent,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}>
              <Ionicons name="barbell" size={26} color="#fff" />
            </View>
            <Text style={{ fontSize: 42, fontWeight: "800", color: theme.text, letterSpacing: -1.5, lineHeight: 46 }}>
              GoLift
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 17, lineHeight: 24 }}>
              Bem-vindo de volta
            </Text>
          </View>

          {/* Form */}
          <View>
            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" }}>
                Email
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14,
                paddingHorizontal: 18,
              }}>
                <TextInput
                  style={{ flex: 1, color: theme.text, paddingVertical: 16, fontSize: 16 }}
                  placeholder="exemplo@email.com"
                  placeholderTextColor={theme.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: theme.textSecondary, marginBottom: 8, fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" }}>
                Password
              </Text>
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.backgroundSecondary,
                borderRadius: 14,
                paddingHorizontal: 18,
              }}>
                <TextInput
                  style={{ flex: 1, color: theme.text, paddingVertical: 16, fontSize: 16 }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Esqueceu password */}
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 32 }}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "600" }}>
                Esqueceste a password?
              </Text>
            </TouchableOpacity>

            {/* Botão Login */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: theme.accent,
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17, letterSpacing: -0.3 }}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: theme.textSecondary, fontSize: 15 }}>
              Não tens conta?{" "}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 15 }}>
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
