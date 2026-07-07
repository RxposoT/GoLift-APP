import { ViewStyle } from "react-native";

/* ── Espaçamento ── */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
} as const;

/* ── Border Radius ── */
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

/* ── Shadows (tema claro/escuro) ── */
export function shadow(elevation: 1 | 2 | 3, isDark: boolean): ViewStyle {
  const card = {
    shadowColor: isDark ? "#000" : "#000",
    shadowOffset: { width: 0, height: elevation === 1 ? 1 : elevation === 2 ? 2 : 4 },
    shadowOpacity: isDark ? 0.3 : elevation === 1 ? 0.06 : elevation === 2 ? 0.1 : 0.15,
    shadowRadius: elevation === 1 ? 2 : elevation === 2 ? 4 : 12,
    elevation,
  };
  return card;
}

/* ── Opacidades ── */
export const opacity = {
  pressed: 0.7,
  disabled: 0.4,
  inactive: 0.3,
  light: 0.08,
  medium: 0.15,
  heavy: 0.25,
} as const;

/* ── Tamanhos de ícones ── */
export const iconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;

/* ── Z-Index (semantic scale) ── */
export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modalBackdrop: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
  loadingOverlay: 700,
} as const;
