import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { spacing } from "../../styles/tokens";
import { Text } from "./Text";
import { Button } from "./Button";

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", gap: spacing.md }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.backgroundTertiary,
        }}
      >
        <Ionicons name={icon} size={26} color={theme.textTertiary} />
      </View>

      <View style={{ alignItems: "center", gap: spacing.xs }}>
        <Text variant="headline" style={{ textAlign: "center" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="callout" color="textSecondary" style={{ textAlign: "center" }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
