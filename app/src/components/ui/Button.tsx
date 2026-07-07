import React from "react";
import {
  Pressable,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../styles/theme";
import { radius, spacing, opacity } from "../../styles/tokens";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number }> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, { backgroundColor: string; borderColor: string; textColor: string }> = {
    primary: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
      textColor: "#FFFFFF",
    },
    secondary: {
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.border,
      textColor: theme.text,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: theme.accent,
    },
    danger: {
      backgroundColor: theme.danger,
      borderColor: theme.danger,
      textColor: "#FFFFFF",
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.lg,
          borderWidth: 1,
          gap: spacing.sm,
          ...sizeStyles[size],
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
          opacity: isDisabled ? opacity.disabled : pressed ? opacity.pressed : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={currentVariant.textColor} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text variant="headline" style={{ color: currentVariant.textColor, fontWeight: "700" }}>
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}
