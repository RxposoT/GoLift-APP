# Database migrations (ordem oficial)

## Fluxo incremental (produção)
Executar nesta ordem:

1. `database/supabase-schema.sql`
2. `database/migration-002-feedback-readiness.sql`
3. `database/migration-004-weight-history.sql`
4. `database/migration-005-push-tokens.sql`

## Fluxo de reset completo (destrutivo)
`database/migration-003-fix-schema.sql` recria o schema base (inclui lógica da migration 002).

Depois do reset, executar apenas as migrations posteriores:

1. `database/migration-004-weight-history.sql`
2. `database/migration-005-push-tokens.sql`
