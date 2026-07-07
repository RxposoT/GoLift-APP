import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from "react-native";
import { typography } from "../../styles/themes";
import { useTheme } from "../../styles/theme";

type TextVariant = keyof typeof typography;
type ThemeColor = keyof ReturnType<typeof useTheme>;

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ThemeColor;
  style?: StyleProp<TextStyle>;
};

export function Text({
  variant = "body",
  color = "text",
  style,
  ...props
}: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      {...props}
      style={[
        typography[variant],
        { color: theme[color] },
        style,
      ]}
    />
  );
}
