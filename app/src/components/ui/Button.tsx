import React, { useCallback } from "react";
import {
  Pressable,
  PressableProps,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../styles/theme";
import { Text } from "./Text";
import { radius, spacing, opacity, shadow } from "../../styles/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "duo";
type Size = "sm" | "md" | "lg" | "xl";

type ButtonProps = PressableProps & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  haptic?: boolean;
};

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; pressedBg: string; borderBottom?: string }> = {
  primary: { bg: "accent", text: "#FFFFFF", pressedBg: "primary" },
  secondary: { bg: "backgroundSecondary", text: "text", pressedBg: "backgroundTertiary" },
  ghost: { bg: "backgroundSecondary", text: "#FFFFFF", pressedBg: "backgroundTertiary" },
  danger: { bg: "#FF3B30", text: "#FFFFFF", pressedBg: "#D32F2F" },
  duo: { bg: "transparent", text: "accent", pressedBg: "transparent", borderBottom: "accent" },
};

const SIZE_STYLES: Record<Size, { px: number; py: number; iconSize: number }> = {
  sm: { px: spacing.lg, py: spacing.sm, iconSize: 16 },
  md: { px: spacing.xl, py: spacing.md, iconSize: 18 },
  lg: { px: spacing.xxl, py: spacing.lg, iconSize: 20 },
  xl: { px: spacing.xxl, py: spacing.xl, iconSize: 24 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  haptic = true,
  children,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const handlePress = useCallback(
    (e: any) => {
      if (haptic && !disabled && !loading) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    },
    [haptic, disabled, loading, onPress]
  );

  const containerStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: variant === "duo" ? "transparent" : ((theme[variantStyle.bg as keyof typeof theme] as string) || variantStyle.bg),
      paddingHorizontal: sizeStyle.px,
      paddingVertical: variant === "duo" ? sizeStyle.py + 4 : sizeStyle.py,
      borderRadius: variant === "duo" ? 16 : radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      opacity: disabled ? 0.4 : 1,
    },
    variant === "primary" || variant === "secondary"
      ? shadow(1, theme.background === "#080808")
      : null,
    style as ViewStyle,
  ];

  if (variant === "duo" || variant === "primary") {
    const shadowColor = theme.accent;
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          {
            backgroundColor: disabled ? "transparent" : shadowColor,
            borderRadius: 10,
            opacity: disabled ? 0.4 : 1,
            marginTop: pressed && !disabled ? 4 : 0,
            marginBottom: pressed && !disabled ? 0 : 4,
          },
          style as ViewStyle,
        ]}
        {...rest}
      >
        {({ pressed }) => (
          <View
            style={[
              {
                backgroundColor: theme.background,
                borderColor: shadowColor,
                borderWidth: 2,
                borderRadius: 10,
                paddingHorizontal: sizeStyle.px,
                paddingVertical: sizeStyle.py,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: spacing.sm,
                transform: [{ translateY: pressed && !disabled ? 0 : -4 }],
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={shadowColor} />
            ) : (
              <>
                {icon && <View style={{ width: sizeStyle.iconSize, height: sizeStyle.iconSize }}>{icon}</View>}
                {typeof children === "string" ? (
                  <Text
                    style={{
                      color: shadowColor,
                      fontWeight: "600",
                      fontSize: size === "sm" ? 13 : size === "md" ? 15 : size === "lg" ? 17 : 19,
                    }}
                  >
                    {children}
                  </Text>
                ) : (
                  children
                )}
              </>
            )}
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled && !loading && {
          backgroundColor: (theme[variantStyle.pressedBg as keyof typeof theme] as string) || variantStyle.pressedBg,
          opacity: opacity.pressed,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text} />
      ) : (
        <>
          {icon && <View style={{ width: sizeStyle.iconSize, height: sizeStyle.iconSize }}>{icon}</View>}
          {typeof children === "string" ? (
            <Text
              style={{
                color: variantStyle.text,
                fontWeight: "600",
                fontSize: size === "sm" ? 13 : size === "md" ? 15 : size === "lg" ? 17 : 19,
              }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}
