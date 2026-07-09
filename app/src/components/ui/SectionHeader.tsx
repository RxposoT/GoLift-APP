import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { Text } from "./Text";
import { spacing } from "../../styles/tokens";

type SectionHeaderProps = {
  title: string;
  style?: StyleProp<TextStyle>;
};

export function SectionHeader({ title, style }: SectionHeaderProps) {
  return (
    <Text
      variant="caption"
      color="textSecondary"
      style={[{ marginBottom: spacing.sm }, style]}
    >
      {title}
    </Text>
  );
}
