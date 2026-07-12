# Agente A — Testes (Continuação)

> **Branch:** `feat/tests`
> **Base:** `main`
> **Já implementado (30%):** jest.config.js, AuthContext.test.tsx, CommunitiesContext.test.tsx, metrics.test.ts, weight.test.ts, workouts.test.ts, imc.test.ts, countries.test.ts

## O que falta (70%)

### 1. Fazer os testes compilarem sem erros
- Adicionar `@types/jest` ao devDependencies (`npm i --save-dev @types/jest`)
- Adicionar `jest` ao `scripts` em `package.json`: `"test": "jest --passWithNoTests"`
- Correr `npm test` e corrigir erros

### 2. Completar testes existentes que estão incompletos
- Verificar se todos os ficheiros de teste têm testes reais
- Adicionar `describe` + `it` blocks onde faltam

### 3. Adicionar mais testes unitários
- `utils/formatters.test.ts` — testar funções de formatação de data/tempo
- Qualquer outro helper em `src/utils/`

### 4. Testes de API adicionais
- `services/api/user.test.ts` — getProfile, updateProfile
- `services/api/exercises.test.ts` — CRUD exercícios

## Ficheiros a tocar
```
app/
├── __tests__/                     ← MODIFICAR (completar existentes)
│   ├── utils/
│   │   ├── imc.test.ts           ← JÁ EXISTE
│   │   ├── countries.test.ts     ← JÁ EXISTE
│   │   └── formatters.test.ts    ← NOVO
│   ├── contexts/
│   │   ├── AuthContext.test.tsx   ← JÁ EXISTE
│   │   └── CommunitiesContext.test.tsx ← JÁ EXISTE
│   └── services/api/
│       ├── workouts.test.ts      ← JÁ EXISTE
│       ├── metrics.test.ts       ← JÁ EXISTE
│       ├── weight.test.ts        ← JÁ EXISTE
│       └── user.test.ts          ← NOVO
├── jest.config.js                ← JÁ EXISTE
├── package.json                  ← MODIFICAR (scripts, @types/jest)
```

## Critérios
- [ ] `npm test` corre sem erros
- [ ] Pelo menos 15 testes no total
- [ ] Cobertura: helpers (80%), APIs (60%)
