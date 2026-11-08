# GL-001 — Plano técnico e de verificação

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: planeado; nenhum passo de implementação executado. Responsável A1; integração A0; revisão independente A10. Ver [spec.md](spec.md) para contratos e critérios.

## Sequência e fronteiras

1. **Fixar baseline e contratos (A0/A1/A5).** Obter checkout completo do commit de implementação, comparar com `552f989`, identificar alterações que invalidem evidência e reservar ficheiros. Usar os JSON já reconciliados como ponto de partida, sem novas consultas a dados de contas. A1 publica os contratos C-GL001; A4/A5/A6 confirmam consumidores. A5 mantém o único caminho de instalação/upgrade.
2. **Preparar testes isolados antes de fechar o desenho (A1).** Criar contas sintéticas A/B, administrador provisionado e objetos privados distintos numa base de teste descartável. Executar testes como `anon`/`authenticated` com claims equivalentes ao gateway e como serviço interno; não executar todos como owner. Cobrir também Auth/REST real em staging para não confundir simulação de claims SQL com validação de JWT.
3. **Preparar migração de autorização (A1, após baseline A5).** Criação de perfil determinista; grants mínimos; policies próprias não recursivas; RPCs invoker com guardas; ACL de funções e proprietários; defaults. A0 atribui ordem única. Sem reset destrutivo, `DROP ... CASCADE` ou edição da história já aplicada.
4. **Adaptar consumidores em sequência (A6/A4/A5/A7/A9).** Remover o upsert pós-signup, tipo de metadata, despromoção de plano e crédito XP pelo cliente; restringir DTO de edição e tratar erro de autorização de métricas. A9 substitui a chamada de streak do scheduler pelo helper C-GL001-JOBS-v1. Preparar estes patches antes de disponibilizar o candidato com as novas permissões. A beta anterior que dependa de escrita proibida deixa de ser candidata; não abrir permissões para a suportar.
5. **Validar backend privilegiado (A1/A3/A4/A5).** Manter `requireAdmin` baseado em leitura atual de `profiles.tipo`, validando erro/ausência com negação de acesso. Confirmar que o endpoint de papel valida valores e que apenas o backend autorizado escreve. A3 valida objetos alheios antes de chamadas IA; A4 valida ownership de sessões/customers e persistência sandbox. A1 revê com A5 as RPCs internas propostas em GL-003: ator de JWT validado no backend, predicados repetidos dentro da transação, ACL/overloads service-only, fencing vinculado ao ator e transporte publicado sem abrir EXECUTE ao cliente.
6. **Ensaiar instalação/upgrade e integração (A1/A5/A10).** Executar as migrações nos dois caminhos sintéticos, comparar a superfície de autorização, repetir matriz negativa e positiva pelo Data API e backend. A10 revê um commit integrado imutável. A9/A10 executam o smoke no iPhone do mesmo candidato.

## Desenho da migração

Os nomes abaixo são unidades lógicas, **não nomes de ficheiros SQL já criados**. Durante implementação, descobrir o CLI por `--help`, confirmar a versão e gerar migrações pela ferramenta suportada. A0/A5 atribuem timestamps e autores únicos. Preferir uma unidade transacional de autorização para não publicar grants sem policies ou novas funções com EXECUTE público.

### M-GL001-AUTH — Unidade de autorização

- Pré-condições apenas de catálogo: tabelas/colunas esperadas, todos os overloads e donos das funções, triggers, policies, ACL globais/de coluna, heranças de papéis, schemas expostos e defaults dos criadores. Falhar de forma explícita perante baseline não suportada, em vez de aplicar metade da alteração.
- Substituir o corpo de `handle_new_user`, preservando a ligação ao trigger Auth e as colunas descritivas necessárias. Usar defaults explícitos para os campos protegidos, `search_path` fixo e referências qualificadas. O trigger privilegiado recebe o mínimo necessário, sem callable API de cliente.
- Revogar grants de escrita de tabela e coluna, incluindo grants por `PUBLIC`/herança, antes de conceder UPDATE apenas na allowlist. Revogar criação/eliminação de perfil no cliente; manter SELECT próprio por compatibilidade com `getProfile('*')`. Não introduzir uma view que leia perfis à margem de RLS.
- Recriar policies de perfil com `TO authenticated`, SELECT próprio e UPDATE próprio com `USING`/`WITH CHECK`. Remover policies permissivas antigas que se combinem por OR e reabram acesso. O cliente admin segue a mesma restrição SQL de um utilizador normal; operações transversais passam pelo backend.
- Preservar/assegurar RLS nas tabelas privadas, leitura própria de IA e ausência de escrita cliente. `user_subscriptions`/ledger são exclusivamente internos; os grants e policies sobrepostos não podem fornecer uma segunda via. Políticas de filhos validam o proprietário da sessão/treino referenciado em ambos os estados relevantes; constraints ficam coordenadas com A5.
- Converter as três RPCs para invoker com verificação de sujeito/alvo antes de agregar. Manter assinaturas/resultados, limitar `p_dias`, fixar caminho e qualificar dependências. Remover permissões de todos os overloads não aprovados.
- Fechar EXECUTE de `PUBLIC`/`anon` e conceder apenas o necessário. Verificar defaults **globais** de funções para cada criador relevante, além de grants por schema; um REVOKE apenas `IN SCHEMA` não elimina o default global. Inventariar funções autorizadas que precisem de grant explícito para não causar regressões de catálogo/health. Não alterar objetos geridos de extensões sem necessidade.
- Catalogar owner, ACL, RLS, definitions e configurações esperadas como assertions de teste. O binário não inclui service key e o cliente não é dono de objetos SQL.
- Preservar a via interna de leitura do job: `service_role` tem `USAGE` em `public` e `SELECT(user_id,data_fim)` em `workout_sessions` para o helper, além dos grants já necessários às restantes funções do serviço. Nenhum EXECUTE novo ou grant de cliente nasce desta compatibilidade. A9 faz a substituição em `push.service.js` e testa erro sem envio.

### Integração service-only GL-003/A5

As funções propostas por A3 (`begin_ai_operation`, `commit_ai_plan`, `import_ai_plan_day`, `commit_ai_feedback`) não entram na allowlist de RPC de cliente. A5 fixa as assinaturas completas e transporte; A1 revê `SECURITY INVOKER`, EXECUTE exclusivo `service_role`, USAGE no schema interno e grants de dados por finalidade, revogando PUBLIC/anon/authenticated e overloads não aprovados. Se o transporte for Data API, testar o wrapper/schema service-only escolhido; não assumir que um schema não exposto funciona com `.rpc()` por omissão. Sem esse contrato final, a tarefa fica pendente, sem introduzir credenciais SQL ad hoc.

Fixtures A→objeto B devem falhar dentro da transação mesmo quando o backend envia um `p_actor_id` válido de A. A1/A5 verificam sessão/treino/plano, relações filhas e vínculo ator/operação/fence; A3 testa que o ator só provém do JWT validado e que a rejeição precede IA e escrita. Uma flag `is_service`, `p_actor_id` de body ou metadata não serve como prova de autoridade.

### M-GL001-RECONCILE — Entrega ao baseline de A5

A5 incorpora o contrato de autorização no caminho canónico de instalação e numa atualização da baseline suportada. SQL completos/reset antigos deixam de ser instruções de instalação publicáveis se reintroduzirem signup inseguro, SELECT recursivo ou tabelas privadas sem RLS. A5 trata separadamente sintaxe de migration-004, `arquivado`, integridade/offline e outras alterações de dados. Nenhum SQL de A5 pode repor grants amplos após M-GL001-AUTH.

Não reconstruir as quatro migrações live ausentes por suposição. Registar a lacuna e reconciliar definições/metadados num ambiente isolado. Comparação deve normalizar nomes/timestamps e comparar semântica de policies, privileges, constraints, colunas e funções; igualdade textual de dumps não é o objetivo.

## Verificação planeada

| Nível | Execução futura e evidência | Critérios |
|---|---|---|
| Catálogos SQL | Assertions sobre RLS/policies, `has_table_privilege`/`has_column_privilege`, ACL efetiva, donos/overloads, `prosecdef`/`proconfig` e defaults; depois chamadas efetivas | AC02/03/06/07/09 |
| Integração SQL | Fixtures A/B/admin, gravação mista permitida+protegida, FKs alheias, NULLs, invoker e sessão vazia; comparar estado antes/depois sem ler contas reais | AC01/02/03/05/07 |
| Auth + Data API staging | Signup metadata maliciosa, confirmação ligada/desligada; REST direto sem SDK UI, token normal/admin/inválido e RPCs por assinatura | AC01–07 |
| Backend | Suites Node suportado + testes HTTP de admin; stub de falha da consulta; despromoção e reutilização do JWT; nenhuma ação downstream em rejeição | AC04/06 |
| Faturação sandbox | Escrita trusted legítima, sessão/customer alheios, erro DB, replay/ordem; anexar evidência de A4, sem contar mocks como integração | AC08 |
| Jobs/RPCs internas | Helper streak igual à RPC em fixtures, falha sem envio, cliente sem entrada HTTP/EXECUTE; transações A3 negam relações/IDs alheios e vinculação errada de fence/operação | AC12 |
| Migrações | Base vazia e clone de baseline sintética reconciliada; aplicação com falha injetada e transação revertida; diff de superfície de autorização | AC09 |
| iPhone candidato | Signup/login/restauro/edição permitida/métricas e consulta premium no build TestFlight de staging; registar iPhone/iOS/build/commit | AC10 |
| Revisão operacional | Aprovar origem de admins e procedimento controlado de revisão; nenhum utilizador real consultado durante esta fase | AC11 |

Matriz mínima por RPC: A→A, B→B, A→B, B→A, A→UUID inexistente, alvo NULL, anónimo, token inválido, serviço sem sujeito, backend com JWT próprio encaminhado e `p_dias` limite/NULL/fora do intervalo para `get_corings`. Resultado vazio legítimo tem de ser distinto de autorização negada no consumidor; manter fórmula da métrica para não confundir mudança de resultado com segurança.

Matriz de tabelas: SELECT/INSERT/UPDATE/DELETE como A/B/anónimo/serviço para perfis, IA e subscrições; testes de ownership de relações para as fontes de métricas, incluindo tentativa de reatribuição. Testar explicitamente a cadeia RLS `workout_sets → workout_sessions → workouts`, `workout_feedback → workout_sessions` e o catálogo de exercícios sob papel authenticated: joins legítimos mantêm agregados completos de A; não passam linhas de B nem falham por falta de SELECT intermédio/recursão. Tentar criar a associação cruzada deve ser rejeitado; se uma baseline de teste contiver uma associação histórica inválida, a leitura não pode revelar o conteúdo de B. Registar zero alterações quando a autorização falha, incluindo requests multirow. Fixtures com B têm valores sentinela que não podem aparecer em respostas, erros ou logs de A.

## Recuperação e promoção

- A migração não altera em massa `tipo`/premium existentes. Revisão de legitimidade é uma operação separada, controlada por A0/operador, com plano de acesso e remediação; não foi autorizada nesta entrega.
- Falha dentro da unidade transacional mantém o estado anterior; o ensaio deve demonstrar a atomicidade da mudança de segurança. Antes de staging, preparar backup e plano de recuperação do ambiente de teste.
- Depois de corrigir, não executar um down que restaure metadata privilegiada, EXECUTE público ou escrita livre. Recuperar com correção incremental que preserve as restrições; se o candidato falhar, suspender a beta afetada até à correção. Não resolver incompatibilidade cliente reabrindo privilégios.
- A0 promove apenas após evidência AC01–AC12 aplicável. Ausência de Postgres/CLI, credenciais staging ou iPhone é registada como teste pendente específico; não transforma análise/mocks em validação. Defeitos de outros domínios continuam nos respetivos gates.

## Decisões e riscos a resolver

| Decisão | Responsável | Momento que bloqueia |
|---|---|---|
| D1: bootstrap/revisão de admins e fonte de legitimidade | A0/operador | Provisionamento e abertura da beta |
| D2: escrita premium, ledger e expiração | A4/A5 | Integração AC08 |
| D3: baseline e ordem das migrações reconciliadas | A0/A5 | Escrita/ensaio da migração final |
| D4: integração do helper confirmado e transporte/ACL das RPCs A3 | A0/A9/A5, revisão A1 | Scheduler de streak e transações internas |

Riscos concretos: `auth.ts` faz upsert pós-signup; `AuthContext.tsx` e login derivam `tipo` de metadata; `plano.ts` tenta UPDATE de `plano` na expiração; `workout/feedback.tsx` escreve XP/nível; `push.service.js:61` chama streak público como serviço; wrappers de métricas convertem erros em resultados vazios; baseline SQL difere do live. Os campos descritivos `treino_*`, `lesoes` e `preferencias_exercicios` mantêm allowlist própria, sem confundir nível de treino com nível de XP. O inventário de consumidores está em spec.md e tem de ser repetido no commit novo. Os responsáveis devem adaptar estes consumidores e testar antes de fechar GL-001. A revisão de A10 é independente do autor.
