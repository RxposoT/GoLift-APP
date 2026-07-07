import { cache } from "../cache";
import { supabase } from "../../lib/supabase";

type QueryOptions = {
  from: string;
  select: string;
  eq?: [string, any];
  order?: [string, { ascending?: boolean }];
  single?: boolean;
};

const API_CACHE_PREFIX = "api:";

function cacheKey(opts: QueryOptions): string {
  return API_CACHE_PREFIX + `${opts.from}:${opts.select}:${JSON.stringify(opts.eq)}`;
}

/** Wrapper de queries Supabase com cache offline */
export const cachedQuery = {
  async fetch<T>(opts: QueryOptions, ttlMs = 5 * 60_000): Promise<T[]> {
    const key = cacheKey(opts);
    return cache.withCache<T[]>(
      key,
      async () => {
        let query = supabase.from(opts.from).select(opts.select);
        if (opts.eq) query = query.eq(opts.eq[0], opts.eq[1]);
        if (opts.order) query = query.order(opts.order[0], opts.order);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as T[];
      },
      ttlMs
    );
  },

  async fetchSingle<T>(opts: QueryOptions, ttlMs = 5 * 60_000): Promise<T | null> {
    const key = API_CACHE_PREFIX + `single:${cacheKey(opts)}`;
    return cache.withCache<T | null>(
      key,
      async () => {
        let query = supabase.from(opts.from).select(opts.select).maybeSingle();
        if (opts.eq) query = query.eq(opts.eq[0], opts.eq[1]);
        const { data, error } = await query;
        if (error) throw error;
        return (data || null) as T | null;
      },
      ttlMs
    );
  },
};
