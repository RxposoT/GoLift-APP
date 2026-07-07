/**
 * GoLift Color Constants
 *
 * Documented colors outside the theme palette.
 * These are semantic colors for badges, IMC health bar, and gamification
 * that intentionally use a multi-color palette (see DESIGN.md: "Badge & Tier Colors").
 */

/* ── IMC Health Bar (WHO scale) ── */
export const IMC_COLORS = {
  underweight: "#6b7280",
  normal: "#10b981",
  borderline: "#84cc16",
  overweight: "#f59e0b",
  obese1: "#f97316",
  obese2: "#ef4444",
  obese3: "#991b1b",
} as const;

/* ── Badge Tier Colors ── */
export const BADGE_COLORS = {
  common: "#10b981",
  accent: "#0A84FF",
  rare: "#8B5CF6",
  epic: "#a78bfa",
  legendary: "#FFD700",
  pro: "#8B5CF6",
  streak: "#f59e0b",
  milestone: "#FF9500",
  progress: "#FF6B6B",
  veteran: "#30D158",
} as const;

/* ── IMC label mapping ── */
export const IMC_LABELS: Array<{ max: number; label: string; color: string }> = [
  { max: 16, label: "Magreza severa", color: IMC_COLORS.obese2 },
  { max: 17, label: "Magreza moderada", color: IMC_COLORS.obese1 },
  { max: 18.5, label: "Abaixo do peso", color: IMC_COLORS.underweight },
  { max: 25, label: "Peso normal", color: IMC_COLORS.normal },
  { max: 27.5, label: "Ligeiramente acima do peso", color: IMC_COLORS.borderline },
  { max: 30, label: "Sobrepeso", color: IMC_COLORS.overweight },
  { max: 35, label: "Obesidade grau I", color: IMC_COLORS.obese1 },
  { max: 40, label: "Obesidade grau II", color: IMC_COLORS.obese2 },
  { max: Infinity, label: "Obesidade grau III", color: IMC_COLORS.obese3 },
];
