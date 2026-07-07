# Agente A — Testes (Unit + Integration)

> **Branch:** `feat/tests`
> **Base:** `main`
> **Prioridade:** Média

## Objetivo
Adicionar cobertura de testes ao GoLift usando Jest + React Native Testing Library.

## Setup
O projeto já tem Jest configurado? Verificar:
- `app/jest.config.js` ou `package.json` com configuração jest
- Se não existir, instalar: `jest`, `@testing-library/react-native`, `@testing-library/jest-native`, `jest-expo`, `react-test-renderer`
- Configurar `jest.config.js` com `preset: "jest-expo"`

## Tarefas

### 1. Testes Unitários (Helpers)
Criar `__tests__/` na raiz `app/` com:

| Ficheiro | Testes |
|----------|--------|
| `utils/imc.test.ts` | `calcularIMC(70, 1.75)` → valor esperado, classificação "Peso normal" |
| `utils/imc.test.ts` | IMC muito baixo / muito alto, valores limite |
| `utils/countries.test.ts` | Lista de países exportada corretamente, `getCountryByName()` |
| `utils/formatters.test.ts` | `formatTime(3661)` → "1h 01m", `formatTime(90)` → "01:30" (se existir) |

### 2. Testes de Contextos (Mock Supabase)
Usar `jest.mock()` para mockar o Supabase client:

| Ficheiro | Testes |
|----------|--------|
| `contexts/AuthContext.test.tsx` | `AuthProvider` renderiza children, login chama `supabase.auth.signInWithPassword`, logout, registo, session restore |
| `contexts/CommunitiesContext.test.tsx` | Criar comunidade, enviar mensagem, listar comunidades |

### 3. Testes de APIs (Mock Supabase)

| Ficheiro | Testes |
|----------|--------|
| `services/api/workouts.test.ts` | `saveSession()` chama o RPC correto, `getWorkouts()` retorna lista |
| `services/api/metrics.test.ts` | `getStats()` retorna dados formatados |
| `services/api/weight.test.ts` | `upsertEntry()` faz upsert correto |

### 4. Estrutura de Ficheiros a Criar/Modificar
```
app/
├── jest.config.js                ← NOVO (se não existir)
├── __tests__/
│   ├── utils/
│   │   ├── imc.test.ts           ← NOVO
│   │   ├── countries.test.ts     ← NOVO
│   │   └── formatters.test.ts    ← NOVO
│   ├── contexts/
│   │   ├── AuthContext.test.tsx   ← NOVO
│   │   └── CommunitiesContext.test.tsx ← NOVO
│   └── services/
│       └── api/
│           ├── workouts.test.ts  ← NOVO
│           ├── metrics.test.ts   ← NOVO
│           └── weight.test.ts    ← NOVO
├── src/
│   └── utils/
│       └── imc.ts                ← JÁ EXISTE (usar)
package.json                      ← MODIFICAR (scripts test)
```

## Critérios de Aceitação
- [ ] `npm test` corre sem erros
- [ ] Pelo menos 10 testes unitários
- [ ] Pelo menos 2 testes de contexto (com mock Supabase)
- [ ] Mocks do Supabase funcionam sem chamadas reais
- [ ] Cobertura mínima: helpers (80%), APIs (60%)

## Notas
- Usar `beforeEach` para limpar mocks
- Não testar componentes de UI (ecrãs) — só lógica
- `jest.fn()` para funções mock
- `renderHook` para testar hooks/contextos
