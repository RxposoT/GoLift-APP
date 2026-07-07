import React from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { Text } from "./Text";
import { spacing, radius } from "../../styles/tokens";

type ListItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
  rightEl?: React.ReactNode;
  locked?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ListItem({
  icon,
  iconBg,
  label,
  subtitle,
  onPress,
  destructive = false,
  rightEl,
  locked = false,
  style,
}: ListItemProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: iconBg,
          justifyContent: "center",
          alignItems: "center",
          marginRight: spacing.md,
        }}
      >
        <Ionicons
          name={locked ? "lock-closed" : icon}
          size={18}
          color="#FFFFFF"
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          variant="body"
          color={destructive ? "danger" : "text"}
          style={destructive ? undefined : { fontWeight: "500" }}
        >
          {label}
        </Text>
        {subtitle && (
          <Text variant="footnote" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightEl}
      {onPress && !rightEl && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.textTertiary}
          style={{ marginLeft: spacing.sm }}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
