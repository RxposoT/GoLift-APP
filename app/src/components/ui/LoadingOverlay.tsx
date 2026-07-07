import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../../styles/theme";
import { Text } from "./Text";
import { zIndex } from "../../styles/tokens";

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const theme = useTheme();
  if (!visible) return null;

  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: zIndex.loadingOverlay,
      }}
      pointerEvents="auto"
    >
      <View
        style={{
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 14,
          padding: 24,
          alignItems: "center",
          gap: 12,
          minWidth: 140,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        {message && (
          <Text variant="subhead" color="textSecondary">
            {message}
          </Text>
        )}
      </View>
    </View>
  );
}
