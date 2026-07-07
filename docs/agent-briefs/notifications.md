# Agente B — Notificações Push

> **Branch:** `feat/notifications`
> **Base:** `main`
> **Prioridade:** Alta

## Objetivo
Implementar notificações push no GoLift usando `expo-notifications` + Supabase Edge Functions.

## Tarefas

### 1. Setup expo-notifications
- Instalar `expo-notifications`, `expo-device`, `@react-native-async-storage/async-storage`
- Criar `services/notifications.ts` com:
  - `registerForPushNotifications()` — pede permissão, regista token no Supabase
  - `scheduleWorkoutReminder(hour, minute)` — lembrete diário de treino
  - `cancelAllScheduled()`
- Adicionar handler em `app/_layout.tsx` (useEffect + Notifications.setNotificationHandler)

### 2. Backend (Supabase)
- Criar tabela `push_tokens` (user_id, token, platform, created_at)
- Adicionar no `services/api.ts` o export `pushApi`
- Opcional: Supabase Edge Function `send-push` para enviar notificações server-side

### 3. Tipos de Notificação
| Tipo | Gatilho | Descrição |
|------|---------|-----------|
| Lembrete diário | Hora configurável (ex: 18:00) | "Hora de treinar! 💪" |
| Streak em risco | Diário se não treinou até às 20h | "Não quebres a tua streak! Ainda vais a tempo" |
| Relatório IA pronto | Segunda-feira 09:00 | "O teu relatório semanal já está disponível!" |
| Check-in motivacional | 3 dias sem treinar | "Sentimos a tua falta no GoLift!" |

### 4. UI
- Adicionar ecrã de configuração em `profile.tsx` (secção "Notificações") com:
  - Toggle ativar/desativar lembretes
  - Seletor de hora para lembrete
  - Preview do lembrete

### 5. Estrutura de Ficheiros a Criar/Modificar
```
app/src/
├── services/
│   └── notifications.ts          ← NOVO (core)
├── services/api/
│   ├── push.ts                   ← NOVO (Supabase push_tokens)
│   └── index.ts                  ← MODIFICAR (export pushApi)
├── app/
│   ├── _layout.tsx               ← MODIFICAR (init notifications)
│   └── (tabs)/profile.tsx        ← MODIFICAR (UI settings)
database/
└── migration-005-push-tokens.sql ← NOVO
```

## Critérios de Aceitação
- [ ] `registerForPushNotifications()` funcional (iOS + Android)
- [ ] Token guardado no Supabase
- [ ] Lembrete diário configurável
- [ ] Notificação streak em risco
- [ ] UI de configuração no Perfil
- [ ] Handlers de clique na notificação (abre app)
- [ ] Código compila sem erros TS

## Contexto do Projeto
- Expo SDK + React Native
- Supabase Auth + Database
- TypeScript estrito
- Estilo: componentes funcionais, temas via `useTheme()`
