import React, { ReactNode } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import { useTheme, useThemePreference } from "../../styles/theme";
import { radius, shadow, spacing } from "../../styles/tokens";

type CardProps = {
  children: ReactNode;
  padding?: number;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padding = spacing.lg, elevated = false, style }: CardProps) {
  const theme = useTheme();
  const { isDark } = useThemePreference();

  return (
    <View
      style={[
        {
          backgroundColor: theme.backgroundSecondary,
          borderRadius: radius.xl,
          padding,
        },
        elevated ? shadow(2, isDark) : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
