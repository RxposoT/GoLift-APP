import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { Text } from "./Text";
import { radius, spacing } from "../../styles/tokens";

type InputProps = RNTextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  error,
  leftIcon,
  isPassword,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label && (
        <Text variant="subhead" color="textSecondary">
          {label}
        </Text>
      )}

      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.backgroundSecondary,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? theme.accent : theme.textTertiary}
            style={{ marginRight: spacing.sm }}
          />
        )}

        <RNTextInput
          style={[
            {
              flex: 1,
              color: theme.text,
              fontSize: 15,
              paddingVertical: spacing.md,
              outline: "none",
              outlineWidth: 0,
            } as any,
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={8}
            accessibilityLabel={showPassword ? "Ocultar password" : "Mostrar password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={theme.textTertiary}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text variant="footnote" color="textSecondary" style={{ color: theme.danger }}>
          {error}
        </Text>
      )}
    </View>
  );
}
