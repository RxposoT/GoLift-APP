# Base de dados GoLift — baseline pendente

Os ficheiros desta pasta são fontes históricas. A sequência anteriormente descrita como «ordem oficial» aguarda reconciliação e ensaio numa base isolada antes de servir como instalação ou upgrade. O trabalho é acompanhado na [issue #17](https://github.com/RxposoT/GoLift-APP/issues/17).

O [inventário GL-005A-1](../docs/sdd/GL-005A-1.md) regista os oito SQL, os checksums dos bytes versionados, as lacunas conhecidas e os gates de validação.

## Percursos históricos a reconciliar

| Percurso documentado anteriormente | Estado verificado |
|---|---|
| `supabase-schema.sql` → `migration-002-feedback-readiness.sql` → `migration-004-weight-history.sql` → `migration-005-push-tokens.sql` | A 004 começa com dois comentários `#` inválidos em PostgreSQL. Este percurso também deixa `ai_plans.arquivado` por criar. |
| `migration-003-fix-schema.sql` → 004 → 005 | A 003 executa `DROP TABLE ... CASCADE` e recria objetos. É um reset destrutivo, reservado a bases descartáveis num ensaio aprovado. |
| `golift-schema-completo.sql` | Variante combinada histórica, com políticas e trigger que precisam de reconciliação com GL-001. |
| `golift-drop-all.sql` | Limpeza destrutiva de tabelas, funções e trigger. Reservada a bases descartáveis num ensaio aprovado. |
| `seed-exercises.sql` | Dados de catálogo a ensaiar depois da baseline estrutural ratificada. |

Os schemas históricos incluem criação de perfil a partir de metadata privilegiada e uma policy recursiva de `profiles`. O manifesto descreve esses ficheiros e os respetivos defeitos, sem concluir o estado atual de uma implantação.

## Gate para instalação e upgrade

A5 reconcilia as fontes com DDL/metadados autorizados e fixa uma baseline de instalação vazia e os upgrades suportados. A1 revê grants, RLS, funções e criação de perfil. A0 integra depois de validar ambos os caminhos com fixtures sintéticas A/B/anon e anexar as evidências à issue #17.

Os SQL já aplicados mantêm a sua história. Correções seguem migrações incrementais novas, depois de confirmar os estados de partida suportados. As rotinas administrativas e os dados existentes têm planos próprios de provisionamento ou remediação.

O gate `Database readiness` continua a bloquear alterações SQL/configuração Supabase até existir a suite BD ratificada. A [GL-005](../docs/sdd/GL-005/spec.md) e a [GL-001](../docs/sdd/GL-001/spec.md) mantêm os contratos e decisões de segurança por fechar.
