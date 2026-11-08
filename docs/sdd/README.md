# GoLift — Índice SDD

Registo operacional em 2026-11-08, mantido pelo A0. As cinco unidades documentais foram recuperadas em PRs separados.

O objetivo acordado é uma beta interna iPhone/TestFlight com staging isolado, pagamentos sandbox e Coach com sugestões gerais identificadas. Os documentos preservam o estado histórico Draft e as decisões propostas. Este índice regista o estado operacional de revisão, implementação e validação de cada unidade.

## Especificações e estado operacional

| Unidade e responsável | Documentos | Estado operacional à preparação |
|---|---|---|
| GL-001 Segurança — A1 | [Spec](GL-001/spec.md) · [Plano](GL-001/plan.md) · [Tarefas](GL-001/tasks.md) | Documentação integrada no PR #12. Contratos Draft, com dependências de autorização, dados e migrações por fechar. |
| GL-002 Toolchain e CI — A2 | [Spec](GL-002/spec.md) · [Plano](GL-002/plan.md) · [Tarefas](GL-002/tasks.md) | Toolchain/CI integradas nos PRs #8/#9. Evidência da base integrada com 37 testes app e 9 backend aprovados. Validação nativa e TestFlight pendentes. Documentação integrada no PR #13. |
| GL-003 Backend e contratos — A3 | [Spec](GL-003/spec.md) · [Plano](GL-003/plan.md) · [Tarefas](GL-003/tasks.md) | Fatia P0 GL-003A integrada no PR #18 com revisão A10, 29 testes backend e CI aprovada. GL-003B permanece Draft e depende de GL-001/GL-005. Documentação integrada no PR #14. |
| GL-004 Pagamentos sandbox — A4 | [Spec](GL-004/spec.md) · [Plano](GL-004/plan.md) · [Tarefas](GL-004/tasks.md) | Draft dependente da autoridade de direitos, ligação conta/customer/subscrição e persistência reconciliada. Documentação integrada no PR #15. |
| GL-005 Dados e offline — A5 | [Spec](GL-005/spec.md) · [Plano](GL-005/plan.md) · [Tarefas](GL-005/tasks.md) | Draft dependente de autorização, baseline de migrações e contratos de operações. Documentação integrada no PR #16. Baseline e validação BD acompanhadas na issue #17. |

Cada unidade contém critérios de aceitação, dependências e tarefas. Os estados operacionais evoluem mediante revisão e evidências anexadas ao PR. Integração documental, integração de código e validação da beta têm gates próprios.

GL-003A integrada no PR #18 cobre ownership e erros nos percursos existentes. A aceitação integral de GL-003 inclui ainda contratos, transações e validação integrada. O saneamento de caches de relatórios anteriores à correção é um gate da baseline de staging antes da beta.

## Coordenação e revisão

O A0 atribui as fatias, reserva ficheiros partilhados e coordena até três especialistas ativos. Cada tarefa usa a sua branch, worktree e PR. Um agente diferente do autor revê o head completo atual. As regras de desenvolvimento estão no [workflow do projeto](../WORKFLOW.md).

O relatório de revisão inclui `A0-REVIEW head=<sha> result=approved`, autor, agente revisor, critérios de aceitação, testes, bloqueios e confirmação A0. Um novo head exige revisão atualizada. A0 integra em develop depois da CI atual e dos gates operacionais. Main e produção dependem de aprovação explícita do utilizador.

As branches main/develop estão protegidas com PR, CI Gate, Workflow Governance, branch atualizada e conversas resolvidas. Main exige uma aprovação de review GitHub. O ambiente production usa `prevent_self_review=true` e `can_admins_bypass=false`. A identidade que inicia o deployment necessita de um reviewer elegível distinto para cumprir o gate.

## Ordem próxima

1. Manter os cinco conjuntos documentais reconciliados com as evidências de implementação.
2. Validar GL-003A em staging com PostgREST real, contas sintéticas A/B e revisão dos caches antigos antes da beta.
3. Fechar os contratos de autorização GL-001 e preparar a implementação em fatias pequenas, com dados sintéticos e validação isolada.
4. Resolver infraestrutura e orçamento de staging, concluir a validação nativa da toolchain e ensaiar o percurso TestFlight interno.
5. Ratificar e implementar GL-004 sandbox, seguido das dependências de integridade GL-005/GL-003B. Cada contrato partilhado tem um responsável e consumidores identificados.
6. Especificar GL-006 a GL-010, fechar as dependências de produto/privacidade e preparar a validação transversal antes de abrir a beta interna.

| Unidades a especificar | Responsável planeado | Entrega |
|---|---|---|
| GL-006 Conta e privacidade | A6 | Spec, plano e tarefas alinhados com autorização e dados |
| GL-007 Comportamento da app | A7 | Fluxos, estados e critérios de aceitação do produto |
| GL-008 UX iPhone | A8 | Experiência, acessibilidade e estados de falha |
| GL-009 Notificações e operação | A9 | Contratos, permissões e operação de staging |
| GL-010 Distribuição iOS | A9 | Build, QA e rollout TestFlight interno |

A10 faz a revisão transversal dos candidatos integrados e das evidências. Upload para QA, instalação no dispositivo e abertura ao grupo interno são gates distintos.

## Dependências externas registadas

- Infraestrutura isolada e orçamento de staging precisam de confirmação antes do provisionamento. Acompanhar na [issue #5](https://github.com/RxposoT/GoLift-APP/issues/5).
- A identidade de automação e a aprovação elegível de produção precisam de configuração antes da primeira release. Com uma única identidade, os gates de main/production continuam bloqueados. Acompanhar na [issue #6](https://github.com/RxposoT/GoLift-APP/issues/6).


## Validação e gates operacionais

- CI Gate inclui readiness SQL e bloqueia alterações de base de dados até concluir a [baseline #17](https://github.com/RxposoT/GoLift-APP/issues/17).
- A preparação iOS e os recibos de build constam do [runbook de release](../release-workflow.md), integrado pelos PRs #20/#21.
- Evidências locais e remotas incluem 37 testes app, 29 backend, 13 de governance, 7 de seleção CI e 8 guards de release.
- Lint mantém 101 warnings conhecidos. Validação nativa iPhone e configuração dos serviços de staging continuam pendentes.
