import React, { useState } from "react";
import {
  View,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../styles/theme";
import { radius, spacing } from "../../styles/tokens";
import { Text } from "./Text";

type InputProps = TextInputProps & {
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
  isPassword = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? (
        <Text variant="subhead" color="textSecondary">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderRadius: radius.lg,
          backgroundColor: theme.backgroundSecondary,
          borderColor: error ? theme.danger : isFocused ? theme.accent : theme.border,
          paddingHorizontal: spacing.md,
        }}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={isFocused ? theme.accent : theme.textTertiary}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}

        <TextInput
          {...props}
          style={[
            {
              flex: 1,
              color: theme.text,
              paddingVertical: spacing.md,
            },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
        />

        {isPassword ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar password" : "Mostrar password"}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text variant="footnote" color="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
