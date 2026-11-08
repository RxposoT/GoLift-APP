# GL-003 — Tarefas e provas de aceitação

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado de execução: **Draft; todas as tarefas de implementação estão pendentes**. Requisitos/AC: [spec.md](spec.md). Sequência: [plan.md](plan.md). Contrato HTTP canónico futuro partilhado GL-003/GL-004: `contracts/http/openapi.yaml`; tipos/validadores/fixtures derivados. O TS da spec é ilustrativo, não normativo.

| ID | Fatia | Tarefa | Dependência | Resultado verificável / AC |
|---|---|---|---|---|
| GL003-T01 | A | Fixar ator JWT, regras de owner e fonte de direitos com GL-001 | GL-001/A1 | Não usar URL/body/metadata como autoridade. Sem aguardar novos DTOs/A5. AC01–03/AC12, semântica atual. |
| GL003-T02 | B | Ratificar os quatro RPCs Draft e máquina comum de operações/falhas/retenção com A5; limites/calendário/timeout com coordenação | GL-005/A5 + coordenação | Contrato único referenciado, grants restritos e decisões registadas; Draft encerrado antes da implementação B. AC07–11, AC15–16. |
| GL003-T03 | B | Fechar prescrição, catálogo e migração de versões/dados legados | T02 + GL-005 | Round-trip de ordem, séries, repetições, observação e descanso; inconsistências falham sem reatribuição. AC03, AC07, AC09. |
| GL003-T04 | B | Criar contracts/http/openapi.yaml após ratificação e gerar tipos/validadores/fixtures | T02 + GL-002 | Uma fonte normativa; testes de limites ±1/tipos/IDs/unknown keys/dor/coerência. AC04–05. Não bloqueia T06/T07. |
| GL003-T05 | B | Aplicar schemas completos às rotas/controllers e novo envelope de erro | T04 | Contrato HTTP ratificado, sem campos internos vindos do modelo. AC01, AC04, AC06. |
| GL003-T06 | A | Exigir ator e owner em queries de objetos/contexto; validar ID mínimo; ownership antes de leitura detalhada/escrita/modelo | T01 | A→B/inexistente: 404 indistinto; relações verificadas; zero conteúdo B/escrita/modelo. Preservar bodies e sucesso atuais. AC01–03 na camada serviço/HTTP, subconjunto mínimo AC04. |
| GL003-T07 | A | Tratar error/data e zero linhas inesperadas nas operações existentes | T01, T06 | Erro de perfil/contexto/cache/leitura/escrita nunca parece ausência de dados nem sucesso. Envelope legado preservado. AC06; sem alegar rollback transacional. |
| GL003-T08 | B | Validar modelo/cache e timeout/fallback completo com origem | T04, T07 | Saídas inválidas não passam; plano anterior preservado; respostas gerais explícitas. AC05, AC11, AC14. |
| GL003-T09 | B | Implementar consulta/regeneração com reserva e commit A5 | T02–03, T05, T08 + migrações GL-005 | Versão 1, CAS/incremento, sem arquivo antecipado; uma geração vence. AC07–08, AC10. |
| GL003-T10 | B | Implementar importação por plano_id/versao/dia_indice com transação A5 | T02–03, T05 + migrações GL-005 | Rejeita body antigo; rollback integral; resultado corresponde ao agregado. AC02–03, AC09–10, AC13. |
| GL003-T11 | B | Implementar feedback transacional first-write por sessão e replay | T02, T05, T08 + migrações GL-005 | Uma linha por sessão, owner imutável, outra intenção dá 409; resposta após commit, fallback persistido. AC03, AC10–11. |
| GL003-T12 | B | Adaptar relatório/adaptação a schemas, contexto mínimo e direito protegido | T05, T08 | Sem afirmações de progressão/equilíbrio sem dados; Coach sem novo fluxo IA. AC02, AC05–06, AC12, AC14. |
| GL003-T13 | B | Migrar planoApi e consumidores para UUID/versão/índice/erro tipado e versão mínima de build | T04–05, T09–12 | Retry/duplo toque conservam intenção; body incompatível migrado, apesar das rotas iguais. AC10, AC13. |
| GL003-T14 | B | Aplicar limites/calendário ratificados e logs sanitizados com request_id | T02, T05 | Replay/cache não consomem geração; Retry-After; relógio/período correto e logs sem dados privados. AC16. |
| GL003-T15 | A e B, provas separadas | Executar HTTP local com duas contas e modelo/Auth simulados | A: T01/T06/T07; B: T05/T08–14 | **A entrega já**: casos negativos/DB, wire atual, spies zero efeitos; não esperar B. **B depois**: matriz completa de contratos/erros novos. AC identificados por camada/fatia. |
| GL003-T16 | B | Provas SQL em BD isolada: instalação/upgrade, grants, owner, falhas, concorrência/replay | GL-005 pronto + T09–11 | Provas de rollback/CAS/um efeito e execução cliente RPC negada. AC03, AC07–11, AC15. |
| GL003-T17 | B | Ensaio iPhone beta, dados sintéticos e perda de rede após commit | A9/GL-010, build beta; GL-002 tooling; T13, T15-B, T16 | Duas contas isoladas, treino completo, retry único e plano anterior preservado. AC02, AC07, AC09–10, AC13. |

GL-003A fecha T01/T06/T07 e a prova A de T15 sem esperar T02–T05, B ou a máquina A5. As constraints/grants diretos e provas concorrentes de BD continuam a ser gates complementares GL-001/GL-005 para a beta. GL-003B fecha as restantes tarefas e a prova B de T15; não marcar toda a unidade concluída após a correção P0.

## Casos mínimos a materializar nas provas

- **Autorização:** A premium→A, A premium→B, A→inexistente, JWT ausente/inválido, URL B com JWT A, A free→treino A/B, perfil/direito com erro. Verificar counters antes de aceitar qualquer 404/403.
- **Relações:** sessão A/treino B e filhos fora do agregado; alteração entre leitura e commit; tentativa direta de feedback com user_id próprio e session_id alheio. A escrita direta é rejeitada pela camada GL-001/GL-005.
- **Modelos:** JSON escalar, array onde se espera objeto, propriedade desconhecida, `sucesso/status` injetados, split vazio, séries fora dos limites, exercício de adaptação que não pertence ao treino, timeout e resultado em cache inválido. O teste confirma os dados efetivamente persistidos/apresentados.
- **Transações:** falhar criação de treino, criação/seleção de catálogo, associação n.º 1 e n.º N, prescrição, gravação de resultado idempotente e commit. Sem efeitos parciais, incluindo linhas novas no catálogo.
- **Concorrência:** geração com mesma versão e chaves distintas; dois envios da mesma chave; chave reutilizada com outro payload; timeout logo depois de commit; lease expirado e worker antigo com fencing obsoleto; feedback concorrente para a mesma sessão com primeira escrita preservada; segunda intenção após commit rejeitada antes do modelo.
- **Calendário:** fim/início de mês, segunda-feira, domingo, mudança de hora Europe/Lisbon e retry de geração iniciado no mês anterior. O relógio é controlado, sem aguardar o tempo real.
- **Compatibilidade:** todos os consumidores novos passam pelo mesmo contrato; versão cliente antiga é rejeitada antes de qualquer efeito e não recebe importação parcial. Validar mensagens de «um por mês» contra a decisão final de coordenação.

## Dependências a entregar ao coordenador

1. **GL-001/A1:** autorizar objetos antes de escrita/modelo e proteger escrita REST direta em feedback/IA; autoridade de premium protegida; service role só no backend; política dos RPCs internos.
2. **GL-005/A5:** unidade transacional e constraints de owner; substituição mensal com versão; prescrição persistida; operações por ator/tipo/UUID, hash, resultado durável, lease/fencing, encerramento de falhas e retenção; migrações limpas e upgrade.
3. **GL-002/A2/operação:** Node/tooling/lockfiles e confirmação de rate/timeout. **A9/GL-010:** build/entrega e validação iPhone beta. Nenhuma dependência de pagamentos reais; GL-004 permanece independente.

## Condição de conclusão futura

Fechar A com evidência P0 própria antes de esperar por B; fechar T01–T17 e ambas as provas T15 para concluir GL-003 integralmente. Desvios devem ser ratificados antes da implementação. A beta não expõe importação/regeneração enquanto AC07–10/15 dependerem apenas de mocks. Não usar «testes antigos passaram» como prova de correção. Nesta entrega documental os gates de implementação/beta continuam por executar.
