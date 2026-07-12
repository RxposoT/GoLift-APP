import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from "react-native";
import { typography, useTheme } from "../../styles/theme";

type Variant = keyof typeof typography;

type TextProps = RNTextProps & {
  variant?: Variant;
  color?: keyof ReturnType<typeof useTheme>;
  align?: TextStyle["textAlign"];
};

/** Aplicações da tipografia do GoLift com variant, cor e alinhamento. */
export function Text({
  variant = "body",
  color = "text",
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const typographyStyle = typography[variant as keyof typeof typography];

  const combinedStyle: StyleProp<TextStyle> = [
    typographyStyle,
    { color: theme[color as keyof ReturnType<typeof useTheme>] },
    align ? { textAlign: align } : null,
    style,
  ];

  return (
    <RNText style={combinedStyle} {...rest}>
      {children}
    </RNText>
  );
}
