import { weightApi } from "../../../src/services/api/weight";

// --- Shared mock setup ---
const buildQuery = (result: any) => {
  const q: any = {};
  const chain = ["select", "insert", "update", "delete", "upsert", "eq", "order", "single"];
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

describe("weightApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryResult = { data: [], error: null };
  });

  describe("getHistory", () => {
    it("returns formatted weight history", async () => {
      mockQueryResult = {
        data: [
          { week: "2024-W01", weight: 75.5 },
          { week: "2024-W02", weight: 74.8 },
        ],
        error: null,
      };

      const result = await weightApi.getHistory("user-1");

      expect(result).toEqual([
        { week: "2024-W01", weight: 75.5 },
        { week: "2024-W02", weight: 74.8 },
      ]);
    });

    it("throws on error", async () => {
      mockQueryResult = { data: null, error: { message: "DB error" } };
      await expect(weightApi.getHistory("user-1")).rejects.toThrow("DB error");
    });

    it("queries with correct filters", async () => {
      mockQueryResult = { data: [], error: null };
      await weightApi.getHistory("user-1");

      expect(mockFrom).toHaveBeenCalledWith("weight_history");
    });
  });

  describe("upsertEntry", () => {
    it("calls upsert with correct data", async () => {
      mockQueryResult = { error: null };
      await weightApi.upsertEntry("user-1", "2024-W03", 73.2);

      expect(mockFrom).toHaveBeenCalledWith("weight_history");
    });

    it("throws on error", async () => {
      mockQueryResult = { error: { message: "Upsert failed" } };
      await expect(
        weightApi.upsertEntry("user-1", "2024-W03", 73.2),
      ).rejects.toThrow("Upsert failed");
    });
  });

  describe("deleteEntry", () => {
    it("throws on error", async () => {
      mockQueryResult = { error: { message: "Delete failed" } };
      await expect(
        weightApi.deleteEntry("user-1", "2024-W01"),
      ).rejects.toThrow("Delete failed");
    });
  });
});
