import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../styles/theme";

interface StreakBarProps {
  streak: number;
  xp: number;
  nivel: number;
  xpProximoNivel: number;
}

export default function StreakBar({ streak, xp, nivel, xpProximoNivel }: StreakBarProps) {
  const theme = useTheme();
  const progresso = xpProximoNivel > 0 ? xp / xpProximoNivel : 0;

  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: theme.backgroundSecondary, borderRadius: 20,
      padding: 14, marginHorizontal: 20, marginBottom: 16,
    }}>
      {/* Streak */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name="flame" size={22} color="#FF9500" />
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 18, letterSpacing: -0.5 }}>
          {streak}
        </Text>
      </View>

      <View style={{ width: 1, height: 28, backgroundColor: theme.backgroundTertiary }} />

      {/* Level */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700" }}>
            Nível {nivel}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
            {xp}/{xpProximoNivel} XP
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: theme.backgroundTertiary, borderRadius: 3, overflow: "hidden" }}>
          <View style={{
            height: 6, width: `${Math.min(progresso * 100, 100)}%`,
            backgroundColor: theme.accent, borderRadius: 3,
          }} />
        </View>
      </View>
    </View>
  );
}
