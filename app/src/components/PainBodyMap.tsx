import { View, Text, Pressable } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

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

const BASE = 24;
const COR_FILL = "#FF3B30";
const COR_STROKE = "#555";

const ZONES_FRONT: { id: string; d: string }[] = [
  { id: "cabeca",    d: `M${BASE+26} ${BASE+2} c0-3,3-6,6-6 h4 c3,0,6,3,6,6 v8 c0,3-3,6-6,6 h-4 c-3,0-6-3-6-6 z` },
  { id: "ombro_e",   d: `M${BASE+8} ${BASE+18} h18 v14 h-8 c-3,0-6-2-8-5 z` },
  { id: "ombro_d",   d: `M${BASE+42} ${BASE+18} h18 v14 h-8 c-3,0-6-2-8-5 z` },
  { id: "braco_e",   d: `M${BASE+8} ${BASE+34} h10 v24 h-10 z` },
  { id: "braco_d",   d: `M${BASE+50} ${BASE+34} h10 v24 h-10 z` },
  { id: "peito",     d: `M${BASE+20} ${BASE+20} h28 v24 h-28 z` },
  { id: "abdominais",d: `M${BASE+22} ${BASE+48} h24 v24 h-24 z` },
  { id: "quadriceps_e", d: `M${BASE+14} ${BASE+76} h16 v32 h-6 c-3,0-6-4-8-8 z` },
  { id: "quadriceps_d", d: `M${BASE+38} ${BASE+76} h16 v32 h-6 c-3,0-6-4-8-8 z` },
  { id: "joelho_e",  d: `M${BASE+16} ${BASE+110} h12 v14 h-12 z` },
  { id: "joelho_d",  d: `M${BASE+40} ${BASE+110} h12 v14 h-12 z` },
  { id: "gemeos_e",  d: `M${BASE+16} ${BASE+126} h12 v22 h-12 z` },
  { id: "gemeos_d",  d: `M${BASE+40} ${BASE+126} h12 v22 h-12 z` },
];

const ZONES_BACK: { id: string; d: string }[] = [
  { id: "cabeca",    d: `M${BASE+26} ${BASE+2} c0-3,3-6,6-6 h4 c3,0,6,3,6,6 v8 c0,3-3,6-6,6 h-4 c-3,0-6-3-6-6 z` },
  { id: "costas_sup", d: `M${BASE+18} ${BASE+18} h32 v26 h-32 z` },
  { id: "braco_e",   d: `M${BASE+8} ${BASE+34} h10 v24 h-10 z` },
  { id: "braco_d",   d: `M${BASE+50} ${BASE+34} h10 v24 h-10 z` },
  { id: "lombar",    d: `M${BASE+20} ${BASE+48} h28 v22 h-28 z` },
  { id: "gluteos",   d: `M${BASE+18} ${BASE+72} h32 v20 h-32 z` },
  { id: "isquiotibiais_e", d: `M${BASE+14} ${BASE+94} h16 v30 h-8 c-3,0-6-2-8-5 z` },
  { id: "isquiotibiais_d", d: `M${BASE+38} ${BASE+94} h16 v30 h-8 c-3,0-6-2-8-5 z` },
  { id: "gemeos_e",  d: `M${BASE+16} ${BASE+126} h12 v22 h-12 z` },
  { id: "gemeos_d",  d: `M${BASE+40} ${BASE+126} h12 v22 h-12 z` },
];

export default function PainBodyMap({ selected, onToggle, view }: PainBodyMapProps) {
  const zones = view === "front" ? ZONES_FRONT : ZONES_BACK;
  const titulo = view === "front" ? "Vista Frontal" : "Vista Posterior";

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{
        fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase",
        color: "#8E8E93", marginBottom: 12,
      }}>
        {titulo}
      </Text>
      <Svg width={BASE * 2 + 64} height={BASE * 2 + 150} viewBox={`0 0 ${BASE*2+64} ${BASE*2+150}`}>
        {zones.map((z) => {
          const isSel = selected.includes(z.id);
          return (
            <G key={z.id} onPress={() => onToggle(z.id)}>
              <Path
                d={z.d}
                fill={isSel ? COR_FILL : "transparent"}
                fillOpacity={isSel ? 0.5 : 0}
                stroke={isSel ? COR_FILL : COR_STROKE}
                strokeWidth={1.5}
              />
              <Path
                d={z.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth={12}
                onPress={() => onToggle(z.id)}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
