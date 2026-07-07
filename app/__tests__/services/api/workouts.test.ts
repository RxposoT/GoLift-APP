import { workoutApi } from "../../../src/services/api/workouts";

// --- Mock Supabase with a proper Promise-based chain ---
const mockFrom = jest.fn();

jest.mock("../../../src/lib/supabase", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

function mockResolvedData(data: any, error: any = null) {
  const q = Promise.resolve({ data, error });
  const chain = ["select", "insert", "update", "delete", "eq", "order", "single", "rpc"];
  chain.forEach((m) => { (q as any)[m] = jest.fn().mockReturnValue(q); });
  return q;
}

describe("workoutApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserWorkouts", () => {
    it("returns mapped workout list", async () => {
      mockFrom.mockReturnValue(mockResolvedData([
        {
          id: 1,
          nome: "Treino A",
          data_treino: "2024-06-01",
          is_ia: 0,
          workout_exercises: [
            { exercise: { id: 1, nome: "Supino", grupo_tipo: "Peito" } },
            { exercise: { id: 2, nome: "Remada", grupo_tipo: "Costas" } },
          ],
        },
      ]));

      const result = await workoutApi.getUserWorkouts("user-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id_treino: 1,
        nome: "Treino A",
        data_treino: "2024-06-01",
        is_ia: 0,
        num_exercicios: 2,
        exercicios_nomes: "Supino, Remada",
        grupo_tipo: "Peito, Costas",
      });
    });

  });

  describe("saveSession", () => {
    it("inserts session and returns id", async () => {
      mockFrom.mockReturnValue(mockResolvedData({ id: 999 }));

      const result = await workoutApi.saveSession("user-1", 5, 1800, [
        { id_exercicio: 1, numero_serie: 1, repeticoes: 10, peso: 50 },
      ]);

      expect(mockFrom).toHaveBeenCalledWith("workout_sessions");
      expect(result).toEqual({ sucesso: true, id_sessao: 999 });
    });
  });
});
