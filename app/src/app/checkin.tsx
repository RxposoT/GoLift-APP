import { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, Animated, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePostHog } from "posthog-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../styles/theme";
import { useAndroidInsets } from "../hooks/useAndroidInsets";
import { supabase } from "../lib/supabase";
import PainBodyMap from "../components/PainBodyMap";

const SLEEP_OPTIONS = [
  { value: 3, emoji: "😴", label: "< 5h" },
  { value: 5, emoji: "😪", label: "5-6h" },
  { value: 7, emoji: "🙂", label: "7-8h" },
  { value: 8.5, emoji: "😊", label: "8-9h" },
  { value: 10, emoji: "😌", label: "9h+" },
];

export default function DailyCheckin() {
  const posthog = usePostHog();
  const theme = useTheme();
  const { safeTop } = useAndroidInsets();
  const { user } = useAuth();

  const [passo, setPasso] = useState(0);
  const [sonoHoras, setSonoHoras] = useState<number | null>(null);
  const [sonoQualidade, setSonoQualidade] = useState<number | null>(null);
  const [energia, setEnergia] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [musculoDolorido, setMusculoDolorido] = useState<string[]>([]);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  function toggleDor(zone: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMusculoDolorido((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  async function handleSave() {
    if (!user) return;
    setLoading(true);
    const hoje = new Date().toISOString().split("T")[0];
    const score = Math.round(
      ((sonoQualidade || 3) * 2 +
        (energia || 3) * 2 +
        Math.min((sonoHoras || 7) / 8 * 2, 2) +
        (6 - (stress || 3)) * 2) / 1
    );

    try {
      await supabase.from("daily_readiness").upsert({
        user_id: user.id,
        data: hoje,
        sono_horas: sonoHoras,
        sono_qualidade: sonoQualidade,
        energia,
        stress,
        musculo_dolorido: musculoDolorido,
        prontidao_score: Math.max(1, Math.min(score, 10)),
      }, { onConflict: "user_id,data" });

      posthog.capture("daily_checkin_completed", {
        sleep_hours: sonoHoras,
        sleep_quality: sonoQualidade,
        energy_level: energia,
        stress_level: stress,
        soreness_zone_count: musculoDolorido.length,
        readiness_score: Math.max(1, Math.min(score, 10)),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch (err) {
      posthog.captureException(err as Error, {
        context: "daily_checkin_save",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: theme.background, opacity: fadeAnim }}>
      <View style={{ paddingHorizontal: 24, paddingTop: safeTop + 60, alignItems: "center" }}>
        <View style={{
          width: 56, height: 56, borderRadius: 16,
          backgroundColor: theme.accent + "18",
          justifyContent: "center", alignItems: "center",
          marginBottom: 16,
        }}>
          <Ionicons name="moon" size={24} color={theme.accent} />
        </View>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: "800", letterSpacing: -1, textAlign: "center" }}>
          Check-in Diário
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 6, textAlign: "center" }}>
          {passo === 0 && "Quantas horas dormiste?"}
          {passo === 1 && "Qualidade do sono?"}
          {passo === 2 && "Nível de energia hoje?"}
          {passo === 3 && "Nível de stress?"}
          {passo === 4 && "Músculos doloridos?"}
        </Text>
      </View>

      {passo === 0 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {SLEEP_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setSonoHoras(opt.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                style={{
                  alignItems: "center", gap: 6, paddingVertical: 14, paddingHorizontal: 8,
                  borderRadius: 16,
                  backgroundColor: sonoHoras === opt.value ? theme.accent + "18" : "transparent",
                  borderWidth: 2,
                  borderColor: sonoHoras === opt.value ? theme.accent : "transparent",
                  minWidth: 64,
                }}
              >
                <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: sonoHoras === opt.value ? theme.accent : theme.textSecondary }}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {passo === 1 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable
                key={v}
                onPress={() => setSonoQualidade(v)}
                style={{
                  width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
                  backgroundColor: sonoQualidade === v ? theme.accent : theme.backgroundTertiary,
                }}
              >
                <Text style={{ color: sonoQualidade === v ? "#fff" : theme.textSecondary, fontWeight: "700", fontSize: 18 }}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 12, textAlign: "center" }}>
            1 = Péssimo &nbsp;&nbsp;&nbsp; 5 = Excelente
          </Text>
        </View>
      )}

      {passo === 2 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable
                key={v}
                onPress={() => setEnergia(v)}
                style={{
                  width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
                  backgroundColor: energia === v ? theme.accent : theme.backgroundTertiary,
                }}
              >
                <Text style={{ color: energia === v ? "#fff" : theme.textSecondary, fontWeight: "700", fontSize: 18 }}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 12, textAlign: "center" }}>
            1 = Cansado &nbsp;&nbsp;&nbsp; 5 = Cheio de energia
          </Text>
        </View>
      )}

      {passo === 3 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable
                key={v}
                onPress={() => setStress(v)}
                style={{
                  width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
                  backgroundColor: stress === v ? theme.accent : theme.backgroundTertiary,
                }}
              >
                <Text style={{ color: stress === v ? "#fff" : theme.textSecondary, fontWeight: "700", fontSize: 18 }}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 12, textAlign: "center" }}>
            1 = Calmo &nbsp;&nbsp;&nbsp; 5 = Muito stress
          </Text>
        </View>
      )}

      {passo === 4 && (
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20, textAlign: "center" }}>
            Toca nas zonas onde sentes desconforto
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <Pressable
              onPress={() => setBodyView("front")}
              style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: bodyView === "front" ? theme.accent : theme.backgroundSecondary }}
            >
              <Text style={{ color: bodyView === "front" ? "#fff" : theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Frontal</Text>
            </Pressable>
            <Pressable
              onPress={() => setBodyView("back")}
              style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: bodyView === "back" ? theme.accent : theme.backgroundSecondary }}
            >
              <Text style={{ color: bodyView === "back" ? "#fff" : theme.textSecondary, fontWeight: "600", fontSize: 13 }}>Posterior</Text>
            </Pressable>
          </View>
          <PainBodyMap selected={musculoDolorido} onToggle={toggleDor} view={bodyView} />
        </View>
      )}

      {/* Steps indicator */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 40 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{
            width: i === passo ? 24 : 8, height: 8, borderRadius: 4,
            backgroundColor: i === passo ? theme.accent : theme.backgroundTertiary,
          }} />
        ))}
      </View>

      {/* Bottom button */}
      <View style={{ position: "absolute", bottom: 40, left: 24, right: 24 }}>
        {passo < 4 ? (
          <Pressable
            onPress={() => setPasso((p) => p + 1)}
            style={{
              backgroundColor: theme.accent, borderRadius: 20, paddingVertical: 18, alignItems: "center",
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>Continuar</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={{
              backgroundColor: theme.accent, borderRadius: 20, paddingVertical: 18, alignItems: "center",
              flexDirection: "row", justifyContent: "center", gap: 8,
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>Guardar e Começar</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
