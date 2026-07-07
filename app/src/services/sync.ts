import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@golift:sync_queue";

export type SyncAction = {
  id: string;
  type: "create" | "update" | "delete";
  table: string;
  payload: Record<string, any>;
  timestamp: number;
};

export const syncQueue = {
  async add(action: Omit<SyncAction, "id" | "timestamp">): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getAll(): Promise<SyncAction[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    await AsyncStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(queue.filter((a) => a.id !== id))
    );
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async process(executor: (action: SyncAction) => Promise<void>): Promise<{ success: number; failed: number }> {
    const queue = await this.getAll();
    let success = 0;
    let failed = 0;

    for (const action of queue) {
      try {
        await executor(action);
        await this.remove(action.id);
        success++;
      } catch {
        failed++;
        // Manter na fila para tentar depois
      }
    }

    return { success, failed };
  },
};
