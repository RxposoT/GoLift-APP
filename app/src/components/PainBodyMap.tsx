import { View, Text, Pressable } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { useTheme } from "../styles/theme";
import { CORPO_FRENTE_PATHS, CORPO_COSTAS_PATHS } from "./anatomy/AnatomyPaths";

export type ZonaDor =
  | "cabeca"
  | "ombro_e" | "ombro_d"
  | "braco_e" | "braco_d"
  | "peito"
  | "costas_sup"
  | "lombar"
  | "abdominais"
  | "gluteos"
  | "quadriceps_e" | "quadriceps_d"
  | "isquiotibiais_e" | "isquiotibiais_d"
  | "joelho_e" | "joelho_d"
  | "gemeos_e" | "gemeos_d";

export const ZONAS: Record<string, { label: string; lado?: "E" | "D" }> = {
  cabeca: { label: "Cabeça/Pescoço" },
  ombro_e: { label: "Ombro", lado: "E" },
  ombro_d: { label: "Ombro", lado: "D" },
  braco_e: { label: "Braço", lado: "E" },
  braco_d: { label: "Braço", lado: "D" },
  peito: { label: "Peito" },
  costas_sup: { label: "Costas" },
  lombar: { label: "Lombar" },
  abdominais: { label: "Abdominais" },
  gluteos: { label: "Glúteos" },
  quadriceps_e: { label: "Quadríceps", lado: "E" },
  quadriceps_d: { label: "Quadríceps", lado: "D" },
  isquiotibiais_e: { label: "Isquiotibiais", lado: "E" },
  isquiotibiais_d: { label: "Isquiotibiais", lado: "D" },
  joelho_e: { label: "Joelho", lado: "E" },
  joelho_d: { label: "Joelho", lado: "D" },
  gemeos_e: { label: "Gémeos", lado: "E" },
  gemeos_d: { label: "Gémeos", lado: "D" },
};

interface PainBodyMapProps {
  selected: string[];
  onToggle: (zone: string) => void;
  view: "front" | "back";
}

export default function PainBodyMap({ selected, onToggle, view }: PainBodyMapProps) {
  const theme = useTheme() as any;
  const paths = view === "front" ? CORPO_FRENTE_PATHS : CORPO_COSTAS_PATHS;
  const titulo = view === "front" ? "Vista Frontal" : "Vista Posterior";

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        color: theme.textSecondary,
        marginBottom: 16,
      }}>
        {titulo}
      </Text>
      
      <View style={{
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 24,
        padding: 20,
        borderWidth: 2,
        borderColor: theme.backgroundTertiary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}>
        <Svg width={180} height={240} viewBox="0 0 1501 2000">
          {paths.map((p, idx) => {
            const isOutline = idx === 0 || idx === 1;
            const isSel = selected.includes(p.zone);
            
            // Base colors from theme
            let fillColor = p.fill;
            if (isOutline) {
              // Outline gets theme-matched color
              fillColor = idx === 0 ? "transparent" : theme.border;
            } else {
              // Muscle colors: if selected, turn bright red, else use beautiful low-poly fill
              if (isSel) {
                fillColor = "#FF3B30";
              } else {
                // Slightly dim unselected muscles for contrast in dark mode
                fillColor = theme.background === "#080808" ? p.fill : p.fill + "CC";
              }
            }

            if (isOutline || p.zone === "default") {
              return (
                <Path
                  key={idx}
                  d={p.d}
                  fill={fillColor}
                  stroke={isOutline && idx === 1 ? theme.border : "transparent"}
                  strokeWidth={isOutline ? 2 : 0}
                  transform={p.transform}
                />
              );
            }

            return (
              <G key={idx} onPress={() => onToggle(p.zone)}>
                <Path
                  d={p.d}
                  fill={fillColor}
                  stroke={isSel ? "#FF3B30" : theme.background}
                  strokeWidth={isSel ? 3 : 0.8}
                  transform={p.transform}
                />
              </G>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}
