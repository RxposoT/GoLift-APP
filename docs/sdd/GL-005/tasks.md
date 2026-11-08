# GL-005 — Tarefas verificáveis

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: planeamento Draft. Todas as caixas estão por executar; a elaboração destes documentos não as completa. Contratos/AC: [spec.md](spec.md). Sequência: [plan.md](plan.md).

## Contratos e baseline

- [ ] **T01 — A5/A0/A1/A3:** ratificar C-GL005-OPERACOES/MUTACOES/IA, tipos canónicos, erro único de feedback e transporte. Confirmar wrappers app auth.uid/definer vs IA service-only/invoker, sem service key cliente. Saída: decisão e matriz ACL, sem dependência das correções GL-001/003A. AC04/12/13.
- [ ] **T02 — A5/A7/A6/A0:** ratificar XP 20/25/15/10 como proposta observada, limites/decimais/tempo, calendário, 100 operações/1 MiB, idade 30 dias, logout/descarte e retenção. Saída: fixtures e política por conta/build, sem GC automático. AC05/07/09/14.
- [ ] **T03 — A5/A1:** inventariar schema/scripts/histórico/checksums e SQL ausente; definir baseline(s) suportadas e manifesto de colunas+segurança. Autorizar recolha futura de DDL à parte; não inferir equivalência com extrato parcial. AC01.
- [ ] **T04 — A5/A0:** reservar migrações/ficheiros por dono; documentar instalação/upgrade, retirar reset do upgrade e resolver 004 sem editar versão já aplicada. Após ratificar GL-004, reservar ledger billing separado, unicidades evento+ambiente, FKs/ACL e prova do commit local; A4 detém reconciliação Stripe, intenção de checkout e idempotency key externa. AC01/14.

## GL-005A — transações e autoridade

- [ ] **T05 — A5, depende T01/T03/T04:** preparar migrações aditivas: versões treino/plano, sessão UUID/crédito, prescrição, peso versão/tombstone, recibos privados e índices/FKs propostos. Sem purge/owner reassignment. AC01–05/09–13.
- [ ] **T06 — A5/A1/A10, depende T05:** diagnóstico sintético de relações inválidas, duplicados, sessões parciais, peso/semanas e XP; backfill apenas dos registos válidos, separado do DDL. Definir remediação dos inválidos antes de validar constraints. AC01/04/05.
- [ ] **T07 — A5, depende T01/T05/T06:** implementar recibo/hash/canonicalização/versionamento de schema, write_workout e CAS; efeito+resultado atómicos, rollback por fase e replay concorrente. AC02/04.
- [ ] **T08 — A5/A7, depende T02/T05–T07:** complete_workout_session com sessão UUID, pertença de exercícios, versão, séries, histórico anterior, lock perfil e crédito/regra. Persistir sessão+séries+XP+recibo integralmente. AC03–05.
- [ ] **T09 — A7/A1/A5, depende T08:** migrar saveSession/edição e resumos free/premium; retirar XP de mount/route params e writes diretos. Tratar todos os consumidores de delete/edição antes de fechar grants; nenhuma exceção para builds antigas sem decisão de compatibilidade. AC02–05.
- [ ] **T10 — A5/A10, depende T06–T09:** executar provas SQL isoladas com duas ligações/atores, falhas em cada escrita, timeout após commit, UUID/payload diferente e duas sessões distintas concorrentes. Anexar resultados e manifesto; mocks separados. AC01–05.

## GL-005B — local, fila e peso

- [ ] **T11 — A5/A6/A7, depende T02:** mapear todas as chaves privadas e namespaces uid/schema; invalidar legadas sem dono; AuthContext muda geração/cancela pedidos antes de mostrar outra conta. A6 é autor de AuthContext. AC06/14.
- [ ] **T12 — A5/A7, depende T02/T11:** rascunho por uid com UUID/treino/versão/séries/tempo; envelope conjunto com outbox, escrita serializada/confirmada e erro visível; restauro/descartar sem conclusão automática. AC07/08.
- [ ] **T13 — A5, depende T08/T12:** outbox tipada complete_session/set/delete_weight, mutex comum/processador único, ACK por ID, estados/retry/backoff, pausa 401 e conflito/erro terminal. Enforce limites/idade sem apagar trabalho pendente. AC07/08/14.
- [ ] **T14 — A5/A7, depende T01/T02/T05:** mutate_weight CAS com tombstone e versão; encadear alterações da mesma semana após ACK, nunca alterar payload já tentado. Migrar upsert/deleteEntry e fechar writes diretos que contornem versão. AC09.
- [ ] **T15 — A5/A7, depende T11/T13/T14:** integrar leituras/cache e overlay próprio, [] remoto autoritativo, TTL/refresh entregue ao consumidor e erro distinto de vazio. Peso/treino mostram pendente vs confirmado; XP offline por confirmar. AC06/07/09.
- [ ] **T16 — A6/A5, depende T11–T15:** logout limpa estado visível/cache, suspende processor e conserva intenções só para o uid original; eliminação de conta purga namespace e dados previstos; descarte explícito e política de build documentados. AC06/07/14.
- [ ] **T17 — A5/A10, depende T12–T16:** provar 100 adds, dois processadores, armazenamento cheio/erro/JSON inválido, crash após ACK antes da remoção, resposta tardia de A, JWT trocado, B vazia/offline, duas versões de peso e pendência antiga. AC06–09/14.

## GL-005C — contratos IA com A3

- [ ] **T18 — A5/A3/A1, depende T01/T05–T07:** begin_ai_operation e finish_ai_operation_failure com alvo/hash/período reservados, lease 120 s no relógio BD, fence monotónico, falhas transitórias/terminais e replay. ACL service-only e schema privado; finish nunca desfaz completed. AC04/12.
- [ ] **T19 — A5/A3, depende T18:** commit_ai_plan usa mesma linha mensal/CAS; validar plano legado antes do backfill de versão; duas gerações têm um vencedor, falha conserva plano anterior. AC10/12.
- [ ] **T20 — A5/A3, depende T05/T18/T19:** import_ai_plan_day resolve versão/dia, catálogo e prescrição inteira numa transação; guarda origem/ordem/contagem e replay. Inventariar ambiguidades de nomes antes de índice normalizado. Sem round-trip, manter função indisponível por decisão A0. AC11/12.
- [ ] **T21 — A5/A3, depende T18:** reserva exclusiva de intenção feedback por sessão antes do modelo e commit first-write; UNIQUE de sessão/FK owner; outra intenção recebe FEEDBACK_JA_SUBMETIDO, sem upsert. AC04/13.
- [ ] **T22 — A3/A5/A6, depende T11/T18–T21:** migrar clientes ao contrato canónico GL-003B; persistir UUID/pedido necessário de intenção IA antes do POST; retoma explícita com mesma chave, sem motor de retry offline IA. Remover cópias redundantes de notas/pedido após resultado confirmado e coordenar retenção/eliminação. AC12–14.
- [ ] **T23 — A5/A3/A10, depende T18–T22:** provar fence antigo/lease expirada/commit desconhecido/finish atrasado, mesmo UUID com payload diferente, mês/DST, catálogo concorrente/rollback e feedback simultâneo com spies de modelo. SQL isolado demonstra efeito único; não prometer chamada única ao fornecedor. AC10–13.

## Integração e gate beta

- [ ] **T24 — A5/A1/A10, depende tarefas SQL aplicáveis:** instalação limpa + upgrades de todas as baselines suportadas produzem manifesto equivalente de schema/ACL/RLS/funções/triggers/defaults; overloads/grants antigos não contornam as RPCs. Anexar checksums/versões/exclusões e ensaio de rollback forward. AC01/04.
- [ ] **T25 — A4/A5/A1/A10, depende GL-004 ratificado:** esquema/ACL billing separado de recibos IA/offline; eventos duplicados/fora de ordem, subscrição S1 vs ponteiro S2, fence expirado, crash/resultado Stripe ambíguo e falha de commit. Um único direito consistente e worker antigo sem efeito; usar mocks, sem credenciais reais. AC01/14.
- [ ] **T26 — A2/A5/A7/A10, depende consumidores alterados:** checks e testes relevantes da app/backend/contratos no runtime suportado, incluindo REST/RPC direto com anon/A/B/backend; registar SHA e limites. Não confundir harness de defeito com prova de correção. AC02–14 aplicáveis.
- [ ] **T27 — A9/A7/A10/A5, depende T10/T17/T23/T24/T25/T26 conforme âmbito:** build restrita QA autorizada, instalar no iPhone, ensaiar treino/encerramento/modo avião/peso/retoma/logout A→B e confirmação uma vez. Ligação SHA/schema/backend registada; só depois avaliar abertura da beta ao grupo. AC15.
- [ ] **T28 — A0 com donos:** decidir inclusão explícita de funcionalidades inacabadas, fechar pendências XP/calendário/retenção/baseline e publicar critério de recuperação de builds retiradas. Não abrir fluxos parciais nem reativar permissões vulneráveis. Todos os AC dos fluxos incluídos têm evidência ou permanecem abertos.

Esta lista não autoriza SQL remoto, acesso a dados reais, fornecedor IA/Stripe, instalação, deploy ou publicação. A execução é uma etapa futura após revisão do plano.

