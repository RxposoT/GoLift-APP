# Agente B — Notificações Push (Continuação)

> **Branch:** `feat/notifications`
> **Base:** `main`
> **Já implementado (60%):** registerForPushNotifications, scheduleWorkoutReminder, cancelAllScheduled, pushApi CRUD, handler _layout.tsx, UI Perfil (toggle + hora + time picker), migration-005-push-tokens.sql

## O que falta (40%)

### 1. Supabase Edge Function: send-push
Criar `supabase/functions/send-push/index.ts`:
- Recebe `{ user_id, title, body, data }`
- Busca tokens em `push_tokens`
- Envia via Expo Push API (`https://exp.host/--/api/v2/push/send`)
- Trata erros (tokens expirados → apagar)

### 2. Notificações Server-Side
No `services/notifications.ts`, adicionar:
- `sendPushNotification(userId, title, body, data)` — chama Edge Function
- Verificar se a Edge Function existe no projeto Supabase

### 3. Notificações Automáticas
Implementar no backend (ou via scheduler):
- **Streak em risco** — verificar diariamente se user treinou, enviar às 20h
- **Relatório IA pronto** — enviar segunda 09h

### 4. Testar fluxo completo
- Pedir permissão → registar token → agendar lembrete → Edge Function enviar
- Cancelar notificações
- Reset ao fazer logout

## Ficheiros a tocar
```
app/
├── src/services/notifications.ts   ← MODIFICAR (sendPushNotification, scheduler)
├── src/services/api/push.ts        ← JÁ EXISTE
├── src/app/(tabs)/profile.tsx      ← JÁ EXISTE (UI completa)
supabase/
└── functions/send-push/index.ts   ← NOVO
database/
└── migration-005-push-tokens.sql  ← JÁ EXISTE
```

## Critérios
- [ ] Edge Function send-push funcional
- [ ] Notificação streak em risco
- [ ] Notificação relatório IA
- [ ] Testar fluxo completo
