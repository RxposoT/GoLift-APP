import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@golift:cache:";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Silently fail — cache é best-effort
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch {
      // Silently fail
    }
  },

  /** Retorna dados do cache se existirem, ou executa e guarda o fetch */
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000 // 5 minutos default
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      // Assíncrono: atualizar cache em background se expirado
      this.fetchAndCache(key, fetcher, ttlMs).catch(() => {});
      return cached;
    }
    return this.fetchAndCache(key, fetcher, ttlMs);
  },

  private static async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    try {
      const data = await fetcher();
      await this.set(key, data);
      return data;
    } catch {
      // Se o fetch falhar, tentar cache (mesmo que velho)
      const stale = await this.get<T>(key);
      if (stale !== null) return stale;
      throw new Error(`Offline: no data for ${key}`);
    }
  },
};
