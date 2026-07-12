import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "../ui";
import { CORPO_FRENTE_PATHS, CORPO_COSTAS_PATHS, AnatomyPath } from "../anatomy/AnatomyPaths";

type MuscleBalance = Record<string, number>;

interface MuscleBalanceMapProps {
  theme: any;
  values: MuscleBalance;
  locked?: boolean;
}

function zoneColor(value: number, theme: any, locked: boolean, defaultFill: string) {
  if (locked || value <= 0) {
    return theme.background === "#080808" ? "#222" : "#E5E5EA";
  }
  if (value < 0.35) return theme.accent + "50";
  if (value < 0.7) return theme.accent + "AA";
  return theme.accent;
}

function Body({ paths, values, max, theme, locked }: { paths: AnatomyPath[]; values: MuscleBalance; max: number; theme: any; locked: boolean }) {
  return (
    <Svg width={110} height={150} viewBox="0 0 1501 2000">
      {paths.map((p, idx) => {
        const isOutline = idx === 0 || idx === 1;
        let fillColor = p.fill;
        
        if (isOutline) {
          fillColor = idx === 0 ? "transparent" : theme.border;
        } else {
          const val = values[p.group] || 0;
          fillColor = zoneColor(val / max, theme, locked, p.fill);
        }
        
        return (
          <Path
            key={idx}
            d={p.d}
            fill={fillColor}
            stroke={isOutline ? "transparent" : theme.backgroundSecondary}
            strokeWidth={isOutline ? 0 : 0.8}
            transform={p.transform}
          />
        );
      })}
    </Svg>
  );
}

export default function MuscleBalanceMap({ theme, values, locked = false }: MuscleBalanceMapProps) {
  const max = Math.max(1, ...Object.values(values));
  return (
    <View style={{ backgroundColor: theme.backgroundSecondary, borderRadius: 20, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 28 }}>
        <View style={{ alignItems: "center" }}>
          <Body paths={CORPO_FRENTE_PATHS} values={values} max={max} theme={theme} locked={locked} />
          <Text variant="caption" color="textTertiary" style={{ marginTop: 8 }}>Frente</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Body paths={CORPO_COSTAS_PATHS} values={values} max={max} theme={theme} locked={locked} />
          <Text variant="caption" color="textTertiary" style={{ marginTop: 8 }}>Costas</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
        <Text variant="footnote" color="textTertiary">Menos trabalhado</Text>
        <Text variant="footnote" color="textTertiary">Mais trabalhado</Text>
      </View>
    </View>
  );
}
