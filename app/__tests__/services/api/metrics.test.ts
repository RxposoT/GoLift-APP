import { metricsApi } from "../../../src/services/api/metrics";

// --- Shared mock setup ---
const queryChain: any = {};
const buildQuery = (result: any) => {
  const q: any = {};
  const chain = ["select", "insert", "update", "delete", "eq", "order", "not", "gte", "gt", "in", "single"];
  chain.forEach((m) => { q[m] = jest.fn().mockReturnValue(q); });
  q.then = (onFulfilled: any) => Promise.resolve(result).then(onFulfilled);
  return q;
};

const mockRpc = jest.fn();
let mockFromResult: any = { data: [], error: null };
const mockFrom = jest.fn(() => buildQuery(mockFromResult));

jest.mock("../../../src/lib/supabase", () => ({
  supabase: {
    from: (...args: any[]) => (mockFrom as any)(...args),
    rpc: (...args: any[]) => (mockRpc as any)(...args),
  },
}));

describe("metricsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFromResult = { data: [], error: null };
  });

  describe("getHistory", () => {
    it("returns formatted session history", async () => {
      mockFromResult = {
        data: [
          {
            id: 1,
            data_fim: "2024-06-01",
            duracao_segundos: 3600,
            workout: { id: 10, nome: "Full Body" },
            workout_sets: [{ count: 5 }],
          },
        ],
        error: null,
      };

      const result = await metricsApi.getHistory("user-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id_sessao: 1,
        id_treino: 10,
        nome: "Full Body",
        data_fim: "2024-06-01",
        duracao_segundos: 3600,
        num_exercicios: 5,
      });
    });

    it("returns empty array on error", async () => {
      mockFromResult = { data: null, error: { message: "fail" } };
      const result = await metricsApi.getHistory("user-1");
      expect(result).toEqual([]);
    });
  });

  describe("getRecords", () => {
    it("calls RPC and maps response", async () => {
      mockRpc.mockResolvedValue({
        data: [
          { exercise_name: "Bench Press", peso: 100, data_serie: "2024-06-01" },
        ],
        error: null,
      });

      const result = await metricsApi.getRecords("user-1");

      expect(mockRpc).toHaveBeenCalledWith("get_user_records", { p_user_id: "user-1" });
      expect(result).toEqual([
        { nome_exercicio: "Bench Press", peso: 100, data_serie: "2024-06-01" },
      ]);
    });

    it("returns empty array on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });
      const result = await metricsApi.getRecords("user-1");
      expect(result).toEqual([]);
    });
  });

  describe("getStreak", () => {
    it("returns streak data from RPC", async () => {
      mockRpc.mockResolvedValue({
        data: { streak: 5, maxStreak: 10 },
        error: null,
      });

      const result = await metricsApi.getStreak("user-1");

      expect(mockRpc).toHaveBeenCalledWith("get_user_streak", { p_user_id: "user-1" });
      expect(result).toEqual({
        sucesso: true,
        streak: 5,
        maxStreak: 10,
        totalDays: 0,
      });
    });

    it("returns fallback values on error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "fail" } });

      const result = await metricsApi.getStreak("user-1");
      expect(result).toEqual({
        sucesso: false,
        streak: 0,
        maxStreak: 0,
        totalDays: 0,
      });
    });
  });

  describe("getStats", () => {
    it("returns aggregated stats from session data", async () => {
      mockFromResult = {
        data: [
          { data_fim: new Date().toISOString(), duracao_segundos: 1800 },
          { data_fim: new Date().toISOString(), duracao_segundos: 2700 },
        ],
        error: null,
      };

      const result = await metricsApi.getStats("user-1");

      expect(result.totalWorkouts).toBe(2);
      expect(result.totalTime).toBe(4500);
      expect(result.avgDuration).toBe(2250);
    });

    it("returns zeros when no sessions exist", async () => {
      mockFromResult = { data: [], error: null };

      const result = await metricsApi.getStats("user-1");

      expect(result.totalWorkouts).toBe(0);
      expect(result.totalTime).toBe(0);
      expect(result.avgDuration).toBe(0);
    });
  });
});
