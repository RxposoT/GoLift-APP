# GL-004 — Tarefas rastreáveis

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **planeamento; todas as tarefas de implementação/verificação pendentes**. A4 detém comportamento billing, A5 o SQL, A1 autoridade/ACL, A3 o contrato HTTP comum; A0 reserva ficheiros/integração e A10 revê provas. Requisitos/AC: [spec.md](spec.md). Sequência: [plan.md](plan.md).

## GL-004A — correção urgente compatível

| ID | Responsável / dependência | Entrega verificável | Aceitação |
|---|---|---|---|
| GL004-T01 | A0/A4; sem dependência de DDL novo | Fixar commit completo, diferenças face ao review, reservas e fluxos que ficam contidos até B; inventariar provas de binding existentes sem consultar contas reais nesta fase | AC01/02/08/13 |
| GL004-T02 | A4/A1; T01, JWT validado GL-001 | `verify-session` compara dono e valida cadeia antes de escrever; customer/profile legado não prova owner; sessão alheia 403, prova ausente recusa explícita | AC01/02 |
| GL004-T03 | A4; T01/T02 | Portal só com customer próprio comprovado, sem email/body customer; nenhuma criação externa em negação/falha de leitura | AC08 |
| GL004-T04 | A4; T02/T03 | Tratar error/data/zero linhas em todas as leituras/escritas e não devolver ACK/sucesso prematuro; conter mutação sem mecanismo seguro de estado/período/concorrência | AC03, parte AC07 |
| GL004-T05 | A4 `plano.ts`; A1 grants; A3/A5/A9 consumidores | Retirar UPDATE plano do cliente; erro de leitura explícito; predicado backend/SQL/jobs exige fim finito válido, sem premium por null | AC07/11/12 |
| GL004-T06 | A4 retorno HTML; A7/A6 consumo UI | Query/fecho do browser não anunciam ativação; confirmação vem do servidor; troca A→B invalida resultado antigo; preservar contrato de sucesso A | AC12 |
| GL004-T07 | A4/A10; T02–T06; runtime A2 | Provas locais HTTP/serviço A/B/ID ausente/binding adverso/DB error/zero linhas/retorno falso e spies de escrita/portal; identificar contenção vs fluxo feliz e lacunas B | Subconjuntos AC01/03/08/11/12 |

## GL-004B — contrato e persistência

| ID | Responsável / dependência | Entrega verificável | Aceitação |
|---|---|---|---|
| GL004-T08 | A0/A4/A1/A5/A6; pode preparar após T01 | Ratificar ambiente beta isolado, política active+período pago/sem trial/grace, lease, retenção, conta eliminada e disponibilidade dos fluxos | AC02/07/14/15 |
| GL004-T09 | A3 integra A4; T08 | Operações Stripe no único `contracts/http/openapi.yaml`, estados/header/IDs/null/erros/refinamentos; tipos, validadores e fixtures derivados | AC13 |
| GL004-T10 | A5/A4/A1; T08, baseline GL-005 | Inventário metadados/constraints e plano de classificação legado; binding/intenção/subscription/ledger/lease privados; não backfill por email/perfil adulterável | AC02/08/11/15 |
| GL004-T11 | A5 autor SQL, A1 revisão; T10 | Nova migração aditiva e wrappers service-only invoker/ACL/overloads/defaults; UNIQUE/FK de owner e subscription vigente; instalação limpa+upgrade sem reset | AC03/06/11 |
| GL004-T12 | A4/A2; T09 | Adaptador Stripe com versão SDK/API fixada, eventos/formatos suportados, estado e período elegível validados; fixtures de item/prorrata/ambiente/meses e docs oficiais na implementação | AC02/05/07/09 |
| GL004-T13 | A4+A5; T09/T11/T12 | Intenção checkout durável, UUID estável/provider idempotency e criação controlada customer/sessão; resposta só após binding persistido; recuperação crash/timeout/webhook precoce | AC02/10 |
| GL004-T14 | A4+A5; T11/T12/T13 | Ledger evento único/hash, máquina pending/processing/terminal, lease/fence por conta antes fetch, commit billing+projeção+evento atómico; verify usa mesma exclusão | AC03–06 |
| GL004-T15 | A4 com A3 parser; T14 | Raw body assinado antes JSON, secret/ambiente corretos, limites e erros sanitizados; ACK só terminal durável; retry/quarantine/unsupported com política explícita | AC03/09/15 |
| GL004-T16 | A4; T12–T15 | Reconciliar estado atual/ponteiro vigente; S1 antigo não afeta S2; sem now+30/event.created como ordem única; lease perdida exige fetch novo; trabalho recém-chegado não se perde | AC04–07 |
| GL004-T17 | A4 portal, A6/A9 retorno; T11/T12 | Binding próprio comprovado antes da criação, customer eliminado/ambiguidade em erro, cancelado próprio gerível; return URL allowlisted suportada no iPhone | AC08/14 |

## Consumidores, provas e gate beta

| ID | Responsável / dependência | Entrega verificável | Aceitação |
|---|---|---|---|
| GL004-T18 | A4/A3 com autor único `plano.ts`; A7/A6; T09/T13–T17 | Consumidor B derivado do contrato, header estável em retry, estados confirmado/pendente/erro, sem UPDATE/URLs em logs; contratos IA mantidos; gate de build quando necessário | AC10–13 |
| GL004-T19 | A5/A10/A4; T11/T13–T16 | Provar em BD descartável falha em cada etapa, timeout após commit, replay concorrente/dia seguinte, lease/fence e verify vs webhook; manifesto limpo/upgrade/ACL | AC03–06/10/11 |
| GL004-T20 | A4/A10; T12/T16/T17 | Matriz de permutações S1/S2, cancelamento final/imediato, faturas antigas/atual, ambientes, períodos/UTC e prova de não-vazamento de portal | AC01/02/04/05/07–09 |
| GL004-T21 | A4/A9/A6/A10; T14–T20 | Runbook e testes sintéticos de pendentes/quarantine/reprocessamento, alerta e commit desconhecido; retenção/eliminação, rollback que conserva ledger e nunca reabre falha | AC03/06/09/15 |
| GL004-T22 | A2/A3/A4/A10; T18–T21 | Checks relevantes no runtime suportado e provider/consumer contra contrato comum; evidência por critério ligada ao SHA/schema/configuração | AC13 |
| GL004-T23 | A0 autoriza etapa futura; A9/A10/A4; T19–T22 | Ensaio Stripe sandbox com contas sintéticas e binário QA interno no iPhone, backend/BD teste isolados, retorno/portal/rede e troca A/B; testes locais e teste fornecedor registados separadamente | AC12–14 |
| GL004-T24 | A0 com A1/A3/A4/A5/A6/A9/A10; T07, T19–T23 para fluxos incluídos | Rever critérios; abrir só billing demonstrado ou desativar explicitamente os percursos incompletos; documentar decisão sem anunciar P0/beta aceites por contenção apenas | Todos aplicáveis |

## Matriz mínima de provas adversas

| Caso | Resultado esperado |
|---|---|
| Sessão B paga apresentada por A; body userId B/metadata adulterada | 403/negação, sem escrita/portal/dados de B. |
| Perfil A com customer B ou customer legado sem evidência | Não criar portal nem transferir binding; diagnóstico restrito. |
| Mesma sessão/evento repetidos após um dia, IDs de evento distintos para a mesma renovação | Prazo inalterado salvo novo período atual comprovado; sem duplicação de domínio. |
| deleted S1 depois de S2 ativa; checkout S1 depois de cancelada; invoice S1 antiga | Reconciliar estado atual; S2 mantém-se, S1 não reativa. |
| Provider read anterior lento, lease expira e worker novo confirma | Fence antigo recusado; não sobrescreve projeção nova nem limpa lease alheia. |
| Evento chega durante processamento/antes de limpar pending | Fica trabalho recuperável e é reconciliado; não recebe ACK prematuro por estar processing. |
| DB falha em binding/subscription/perfil/terminal; resposta do commit perde-se | Estado integral ou rollback; sem sucesso antecipado; retry consulta/repete recibo. |
| Fim de período null, data inválida, prorrata/item não elegível, trial/past_due | Sem direito inventado; sem now+30 ou premium ilimitado. |
| Assinatura inválida/raw alterado/live event em beta | Não concede direitos; erro sanitizado e zero mutação de billing. |
| Criação externa ocorreu, gravação falhou, app repetiu ou webhook chegou cedo | Recuperar mesma intenção/cadeia; não criar checkout/customer adicional às cegas. |
| Chave com payload/ator diferente; intenção antiga de resultado desconhecido | Isolamento por ator/conflito e reconciliação explícita; sem criação nova cega. |
| Retorno status=sucesso sem pagamento; fechar browser; rede após commit | Nenhum sucesso por redirect; confirmação/retry próprios e efeitos únicos. |
| Logout A→B com resposta/URL A em voo | B não vê URL/plano/dados de A; resultado invalidado. |
| Webhook tardio após eliminação da conta | Não recria perfil/direitos; política mínima de retenção/tombstone A6 aplicada. |

## Checklist de evidência futura

- [ ] Donos/contratos e reservas fechados antes de alterações concorrentes.
- [ ] Cada teste identifica fatia A/B, critério, commit, schema, runtime e ambiente.
- [ ] Nenhum harness de defeito é apresentado como correção aprovada.
- [ ] Atomicidade/ACL verificadas em BD isolada com anon/A/B/backend reais desse ambiente; mocks identificados como tal.
- [ ] Fornecedor sandbox e iPhone só em etapa posterior autorizada, separados dos testes locais; nenhuma operação live.
- [ ] Logs/relatórios sem segredos, URLs temporárias ou dados de pagamento/pessoas reais.
- [ ] Pendências/falhas/rollback ensaiados e critérios abertos mantidos visíveis.

Esta lista não autoriza execução de SQL, instalações, APIs reais, deploy, compras ou distribuição. As caixas permanecem por marcar nesta entrega documental.
