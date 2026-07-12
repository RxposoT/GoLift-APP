import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Text } from "../ui";

type MuscleBalance = Record<string, number>;

interface MuscleBalanceMapProps {
  theme: any;
  values: MuscleBalance;
  locked?: boolean;
}

type MuscleZone = { group: "Ombros" | "Peito" | "Abdominais" | "Pernas" | "Costas" | "Braços"; d: string };

// Zonas anatómicas semânticas. Os SVG originais são ilustrações sem ids de músculo,
// por isso não é seguro colorir os seus paths por índice (a ordem pode mudar numa exportação).
const FRONT_ZONES: MuscleZone[] = [
  { group: "Ombros", d: "M28 39c-10 2-15 10-14 20l13 4 10-12-2-12h3zm44 0c10 2 15 10 14 20l-13 4-10-12 2-12h-3z" },
  { group: "Braços", d: "M20 59l-7 40 10-2-1-38zm60 0l7 40-10-2 1-38z" },
  { group: "Peito", d: "M34 51c7-4 15-4 21 1v19c-9 3-16 1-21-5zm32 1c6-5 14-5 21-1v15c-5 6-12 8-21 5z" },
  { group: "Abdominais", d: "M48 73h24l3 35-15 7-15-7z" },
  { group: "Pernas", d: "M43 113h15l-2 43-8 20-9-1-2-17zm19 0h15l6 45-2 17-9 1-8-20z" },
];

const BACK_ZONES: MuscleZone[] = [
  { group: "Ombros", d: "M27 39c-10 2-15 10-14 20l14 4 10-12-2-12h2zm45 0c10 2 15 10 14 20l-14 4-10-12 2-12h-2z" },
  { group: "Braços", d: "M20 59l-7 40 10-2-1-38zm60 0l7 40-10-2 1-38z" },
  { group: "Costas", d: "M34 51c8-4 18-4 26 1v37l-13 13-14-18zm26 1c8-5 18-5 26-1l1 33-14 18-13-13z" },
  { group: "Pernas", d: "M43 105h15l-2 49-8 22-9-1-2-20zm19 0h15l6 49-2 20-9 1-8-22z" },
];

function zoneColor(value: number, theme: any, locked: boolean) {
  if (locked || value <= 0) return theme.backgroundTertiary;
  if (value < 0.35) return theme.accent + "44";
  if (value < 0.7) return theme.accent + "99";
  return theme.accent;
}

function Body({ zones, values, max, theme, locked }: { zones: MuscleZone[]; values: MuscleBalance; max: number; theme: any; locked: boolean }) {
  return <Svg width={100} height={180} viewBox="0 0 100 180">
    <Circle cx="50" cy="20" r="13" fill={theme.backgroundTertiary} stroke={theme.border} strokeWidth={1.5} />
    <Path d="M38 35c4-5 20-5 24 0l7 76-8 8H39l-8-8z" fill={theme.backgroundSecondary} stroke={theme.border} strokeWidth={1.5} />
    {zones.map((zone, index) => <Path key={`${zone.group}-${index}`} d={zone.d} fill={zoneColor((values[zone.group] || 0) / max, theme, locked)} stroke={theme.border} strokeWidth={1.2} />)}
    <Path d="M43 113h15l-2 43-8 20-9-1-2-17zM62 113h15l6 45-2 17-9 1-8-20z" fill="transparent" stroke={theme.border} strokeWidth={1.5} />
  </Svg>;
}

export default function MuscleBalanceMap({ theme, values, locked = false }: MuscleBalanceMapProps) {
  const max = Math.max(1, ...Object.values(values));
  return <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 16 }}>
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 28 }}>
      <View style={{ alignItems: "center" }}><Body zones={FRONT_ZONES} values={values} max={max} theme={theme} locked={locked} /><Text variant="caption" color="textTertiary">Frente</Text></View>
      <View style={{ alignItems: "center" }}><Body zones={BACK_ZONES} values={values} max={max} theme={theme} locked={locked} /><Text variant="caption" color="textTertiary">Costas</Text></View>
    </View>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
      <Text variant="footnote" color="textTertiary">Menos trabalhado</Text>
      <Text variant="footnote" color="textTertiary">Mais trabalhado</Text>
    </View>
  </View>;
}
