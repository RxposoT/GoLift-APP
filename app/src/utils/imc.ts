/**
 * Utilitário de cálculo e categorização de IMC (Índice de Massa Corporal)
 * Escala WHO com 9 categorias
 */

export function getIMCCategory(imc: number): { label: string; color: string } {
  if (imc < 16)   return { label: "Magreza severa",             color: "#ef4444" };
  if (imc < 17)   return { label: "Magreza moderada",           color: "#f97316" };
  if (imc < 18.5) return { label: "Abaixo do peso",             color: "#6b7280" };
  if (imc < 25)   return { label: "Peso normal",                color: "#10b981" };
  if (imc < 27.5) return { label: "Ligeiramente acima do peso", color: "#84cc16" };
  if (imc < 30)   return { label: "Sobrepeso",                  color: "#f59e0b" };
  if (imc < 35)   return { label: "Obesidade grau I",           color: "#f97316" };
  if (imc < 40)   return { label: "Obesidade grau II",          color: "#ef4444" };
  return           { label: "Obesidade grau III",               color: "#991b1b" };
}
