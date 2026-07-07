# GoLift — Plano de Desenvolvimento (Multi-Agente)

> **Atualizado:** 2026-07-07
> **Coordenador:** Terminal 1 (RxposoT)
> **Workflow:** Multi-terminal OpenClaude — cada agente no seu terminal independente

---

## 1. Estado Geral do Projeto

| Área | % | Responsável | Branch |
|------|---|-------------|--------|
| Auth & Onboarding | 100% | Concluído | `main` |
| Timer Treino Ativo | 100% | Concluído | `main` |
| **Exercícios Treino Ativo** | **100%** | **Concluído** | `main` |
| Biblioteca Treinos CRUD | 95% | Concluído | `main` |
| Métricas & Progresso | 92% | Concluído | `main` |
| Plano IA (Wizard) | 95% | Concluído | `main` |
| Relatório IA | 90% | Concluído | `main` |
| Comunidades (Chat RealTime) | 90% | Concluído | `main` |
| Perfil & Gamificação | 95% | Concluído | `main` |
| Sincronização Peso (Backend) | 100% | Concluído | `main` |
| UI/UX Polish (Skeletons, Animações) | 95% | Concluído | `main` |
| Notificações Push (Expo + Edge Functions) | **100%** | **Concluído** | `main` |
| Testes (Unit + API Mock) | **80%** | **Concluído** | `main` |
| CI/CD (GitHub Actions + EAS) | **100%** | **Concluído** | `main` |
| Offline-First (Cache + Sync) | **100%** | **Concluído** | `main` |

---

## 2. Tarefas Ativas

| Tarefa | Responsável | Branch | Estado |
|--------|-------------|--------|--------|
| Notificações | Coordenador | `main` | ✅ Framework + Edge Function + UI Perfil + Migration |
| Testes | Coordenador | `main` | ✅ 5 suites, 31 testes (helpers + APIs mock) |
| CI/CD | Coordenador | `main` | ✅ GitHub Actions + EAS dev/preview/prod |
| Offline-First | Coordenador | `main` | ✅ Cache layer + Sync queue + Banner |

---

## 3. Bugs Conhecidos (Prioridade)

| Bug | Ficheiro | Atribuído | Estado |
|-----|----------|-----------|--------|
| ~~Exercícios não renderizavam (placeholder comments)~~ | `workout/[id].tsx` | ✅ **Corrigido** | ✅ Resolvido |
| ~~Timer pause em closure stale~~ | `workout/[id].tsx` | ✅ **Corrigido** | ✅ Resolvido |

---

## 4. Próximos Marcos

1. **[AGENTE B] Notificações Push** — expo-notifications + Supabase Edge Functions
2. **[AGENTE A] Testes** — Jest + React Native Testing Library
3. CI/CD — GitHub Actions + EAS Build
4. Offline-First — expo-sqlite cache + sync queue

---

## 5. Git Workflow

```
main ──── merge ← feat/notifications ── merge ← feat/tests
    │                                          ↑
    └─── base para novas branches             paralelo
```

- Commits em PT-inglês (título EN, corpo pode ser PT)
- Cada branch de feature faz merge para `main` via PR local
- Coordenador faz review antes de merge
