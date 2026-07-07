/**
 * Utilitário de cálculo e categorização de IMC (Índice de Massa Corporal)
 * Escala WHO com 9 categorias
 */

import { IMC_LABELS } from "../styles/colors";

export function getIMCCategory(imc: number): { label: string; color: string } {
  for (const cat of IMC_LABELS) {
    if (imc < cat.max) return { label: cat.label, color: cat.color };
  }
  return { label: "Obesidade grau III", color: IMC_LABELS[IMC_LABELS.length - 1].color };
}
