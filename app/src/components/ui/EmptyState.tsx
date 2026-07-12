import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { Text } from "./Text";
import { Button } from "./Button";
import { spacing } from "../../styles/tokens";

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = "barbell-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.huge, paddingHorizontal: spacing.xxl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.backgroundTertiary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Ionicons name={icon} size={28} color={theme.textTertiary} />
      </View>

      <Text variant="title3" align="center" style={{ marginBottom: spacing.sm }}>
        {title}
      </Text>

      {subtitle && (
        <Text variant="body" color="textSecondary" align="center" style={{ marginBottom: spacing.xl }}>
          {subtitle}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}
