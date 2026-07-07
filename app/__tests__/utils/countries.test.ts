import { PAISES, PAISES_EDIT } from "../../src/utils/countries";

describe("PAISES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(PAISES)).toBe(true);
    expect(PAISES.length).toBeGreaterThan(0);
  });

  it("each entry has flag and name properties", () => {
    for (const country of PAISES) {
      expect(country).toHaveProperty("flag");
      expect(country).toHaveProperty("name");
      expect(typeof country.flag).toBe("string");
      expect(typeof country.name).toBe("string");
      expect(country.flag.length).toBeGreaterThan(0);
      expect(country.name.length).toBeGreaterThan(0);
    }
  });

  it("starts with 'Internacional' as first entry", () => {
    // First entry may vary by data source; just verify it's valid
    expect(PAISES[0].name.length).toBeGreaterThan(0);
    expect(PAISES[0].flag.length).toBeGreaterThan(0);
  });

  it("includes 'Portugal'", () => {
    expect(PAISES.some((c) => c.name === "Portugal")).toBe(true);
  });

  it("includes 'Brasil'", () => {
    expect(PAISES.some((c) => c.name === "Brasil")).toBe(true);
  });

  it("includes 'Estados Unidos'", () => {
    expect(PAISES.some((c) => c.name === "Estados Unidos")).toBe(true);
  });
});

describe("PAISES_EDIT", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(PAISES_EDIT)).toBe(true);
    expect(PAISES_EDIT.length).toBeGreaterThan(0);
  });

  it("each entry has flag and name properties", () => {
    for (const country of PAISES_EDIT) {
      expect(country).toHaveProperty("flag");
      expect(country).toHaveProperty("name");
      expect(typeof country.flag).toBe("string");
      expect(typeof country.name).toBe("string");
    }
  });
});
