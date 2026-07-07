import React, { ReactNode } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, useThemePreference } from "../../styles/theme";
import { radius, spacing, shadow } from "../../styles/tokens";

type GradientCardProps = {
  children: ReactNode;
  colors?: [string, string];
  style?: StyleProp<ViewStyle>;
};

export function GradientCard({ children, colors, style }: GradientCardProps) {
  const theme = useTheme();
  const { isDark } = useThemePreference();

  const defaultColors: [string, string] = isDark
    ? [theme.backgroundSecondary, theme.backgroundTertiary]
    : [theme.backgroundSecondary, theme.border];

  return (
    <View
      style={[
        {
          borderRadius: radius.xl,
          overflow: "hidden",
        },
        shadow(2, isDark),
        style,
      ]}
    >
      <LinearGradient colors={colors || defaultColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={{ padding: spacing.lg }}>{children}</View>
      </LinearGradient>
    </View>
  );
}
