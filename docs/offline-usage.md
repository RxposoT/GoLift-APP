### Offline-First — Como usar

## Cache de Queries
```ts
import { cachedQuery } from "../services/cachedQuery";

// Em vez de fazer supabase.from().select() diretamente:
const workouts = await cachedQuery.fetch<Workout>({
  from: "workouts",
  select: "id, nome, data_treino",
  eq: ["user_id", userId],
  order: ["data_treino", { ascending: false }],
});
```

## Cache + Sync Manual
```ts
import { cache } from "../services/cache";

// Guardar resposta de API
await cache.set("dashboard_stats", stats);

// Ler com fallback
const data = await cache.withCache("dashboard_stats", () => fetchStats());
```

## Sync Queue
```ts
import { syncQueue } from "../services/sync";

// Adicionar mutação à fila quando offline
await syncQueue.add({
  type: "create",
  table: "workout_logs",
  payload: { user_id: userId, ...data },
});

// Processar fila quando online
const result = await syncQueue.process(async (action) => {
  await supabase.from(action.table).insert(action.payload);
});
// → { success: 5, failed: 0 }
```
