import React from "react";
import { View } from "react-native";
import { useTheme } from "../../styles/theme";

type DividerProps = {
  color?: keyof ReturnType<typeof useTheme>;
  marginHorizontal?: number;
};

export function Divider({
  color = "borderLight",
  marginHorizontal = 0,
}: DividerProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme[color],
        marginHorizontal,
      }}
    />
  );
}
