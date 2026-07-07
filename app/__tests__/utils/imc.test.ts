import { getIMCCategory } from "../../src/utils/imc";

describe("getIMCCategory", () => {
  it("returns 'Peso normal' for IMC 22.5", () => {
    const result = getIMCCategory(22.5);
    expect(result.label).toBe("Peso normal");
    expect(result.color).toBe("#10b981");
  });

  it("returns 'Magreza severa' for very low IMC", () => {
    expect(getIMCCategory(10).label).toBe("Magreza severa");
    expect(getIMCCategory(15).label).toBe("Magreza severa");
    expect(getIMCCategory(15).color).toBe("#ef4444");
  });

  it("returns 'Magreza moderada' for IMC between 16 and 17", () => {
    expect(getIMCCategory(16.5).label).toBe("Magreza moderada");
    expect(getIMCCategory(16.5).color).toBe("#f97316");
  });

  it("returns 'Abaixo do peso' for IMC between 17 and 18.5", () => {
    expect(getIMCCategory(18).label).toBe("Abaixo do peso");
  });

  it("returns 'Ligeiramente acima do peso' for IMC between 25 and 27.5", () => {
    expect(getIMCCategory(26).label).toBe("Ligeiramente acima do peso");
  });

  it("returns 'Sobrepeso' for IMC between 27.5 and 30", () => {
    expect(getIMCCategory(28).label).toBe("Sobrepeso");
  });

  it("returns 'Obesidade grau I' for IMC between 30 and 35", () => {
    expect(getIMCCategory(32).label).toBe("Obesidade grau I");
  });

  it("returns 'Obesidade grau II' for IMC between 35 and 40", () => {
    expect(getIMCCategory(37).label).toBe("Obesidade grau II");
  });

  it("returns 'Obesidade grau III' for IMC 40 or above", () => {
    expect(getIMCCategory(40).label).toBe("Obesidade grau III");
    expect(getIMCCategory(45).label).toBe("Obesidade grau III");
    expect(getIMCCategory(40).color).toBe("#991b1b");
  });

  it("handles boundary values correctly", () => {
    expect(getIMCCategory(16).label).toBe("Magreza moderada");
    expect(getIMCCategory(17).label).toBe("Abaixo do peso");
    expect(getIMCCategory(18.5).label).toBe("Peso normal");
    expect(getIMCCategory(25).label).toBe("Ligeiramente acima do peso");
    expect(getIMCCategory(27.5).label).toBe("Sobrepeso");
    expect(getIMCCategory(30).label).toBe("Obesidade grau I");
    expect(getIMCCategory(35).label).toBe("Obesidade grau II");
    expect(getIMCCategory(40).label).toBe("Obesidade grau III");
  });
});
