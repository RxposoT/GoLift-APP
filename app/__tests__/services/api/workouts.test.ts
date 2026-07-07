import { workoutApi } from "../../../src/services/api/workouts";

// --- Shared mock setup ---
const queryChain: any = {};
const buildQuery = (result: any) => {
  const q: any = {};
  const chain = ["select", "insert", "update", "delete", "eq", "order", "single", "rpc"];
  chain.forEach((m) => { q[m] = jest.fn().mockReturnValue(q); });
  q.then = (onFulfilled: any) => Promise.resolve(result).then(onFulfilled);
  return q;
};

let mockQueryResult: any = { data: [], error: null };
const mockFrom = jest.fn(() => buildQuery(mockQueryResult));

jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

describe("workoutApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResult = { data: [], error: null };
  });

  describe("getUserWorkouts", () => {
    it("returns mapped workout list", async () => {
      mockQueryResult = {
        data: [
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
        ],
        error: null,
      };

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

    it("throws on database error", async () => {
      mockQueryResult = { data: null, error: { message: "DB error" } };
      await expect(workoutApi.getUserWorkouts("user-1")).rejects.toThrow("DB error");
    });
  });

  describe("saveSession", () => {
    it("inserts session and returns id", async () => {
      // First query returns session with id, second is for sets
      mockQueryResult = { data: { id: 999 }, error: null };

      const result = await workoutApi.saveSession("user-1", 5, 1800, [
        { id_exercicio: 1, numero_serie: 1, repeticoes: 10, peso: 50 },
      ]);

      expect(mockFrom).toHaveBeenCalledWith("workout_sessions");
      expect(result).toEqual({ sucesso: true, id_sessao: 999 });
    });
  });
});
