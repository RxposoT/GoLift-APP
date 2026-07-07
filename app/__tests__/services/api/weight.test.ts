import { weightApi } from "../../../src/services/api/weight";

// --- Mock Supabase with Promise-based chain ---
const mockFrom = jest.fn();

jest.mock("../../../src/lib/supabase", () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

function mockResolvedData(data: any, error: any = null) {
  const q = Promise.resolve({ data, error }) as any;
  const chain = ["select", "insert", "update", "delete", "upsert", "eq", "order", "single"];
  chain.forEach((m) => { q[m] = jest.fn().mockReturnValue(q); });
  return q;
}

describe("weightApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHistory", () => {
    it("returns formatted weight history", async () => {
      mockFrom.mockReturnValue(mockResolvedData([
        { week: "2024-W01", weight: 75.5 },
        { week: "2024-W02", weight: 74.8 },
      ]));

      const result = await weightApi.getHistory("user-1");
      expect(result).toEqual([
        { week: "2024-W01", weight: 75.5 },
        { week: "2024-W02", weight: 74.8 },
      ]);
    });

    it("queries weight_history table", async () => {
      mockFrom.mockReturnValue(mockResolvedData([]));

      await weightApi.getHistory("user-1");
      expect(mockFrom).toHaveBeenCalledWith("weight_history");
    });
  });

  describe("upsertEntry", () => {
    it("calls upsert with correct data", async () => {
      mockFrom.mockReturnValue(mockResolvedData(null));

      await weightApi.upsertEntry("user-1", "2024-W03", 73.2);
      expect(mockFrom).toHaveBeenCalledWith("weight_history");
    });
  });
});
