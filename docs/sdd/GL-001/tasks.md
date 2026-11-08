# GL-001 — Tarefas rastreáveis

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado de todas as tarefas de produto: **pendente**. Esta lista é planeamento; caixas marcadas exigem evidência de implementação/verificação futura. Dono funcional A1; A0 gere reservas, integração e estado; A10 revê de forma independente.

| ID | Responsável e âmbito de escrita futuro | Dependências | Entrega verificável | Aceitação |
|---|---|---|---|---|
| GL001-T01 | A0 com A1/A5; manifesto/contratos | Nenhuma | Comparar checkout atual completo com review; publicar commit, diferenças relevantes, baseline e reserva por ficheiro | AC09; D3 |
| GL001-T02 | A1; inventário de autorização de teste | T01 | Inventário de colunas/tabelas/schemas expostos, ACL herdadas, policies, views, funções/overloads/owners/triggers/defaults; usar metadados locais até existir ambiente autorizado | AC06/07 |
| GL001-T03 | A1; testes SQL/Data API isolados | T01; ambiente descartável | Fixtures A/B/admin e casos negativos/positivos com falhas observáveis; sem contas reais | AC01–07 |
| GL001-T04 | A1; migração nova de autorização reservada por A0 | T02/T03; baseline A5 | Signup normal/free determinista, trigger com caminho fixo, autoridade sem metadata, ACL sem INSERT/DELETE cliente | AC01/02/06/09 |
| GL001-T05 | A1; mesma unidade SQL, sem autor concorrente | T04 | Revogar grants amplos/de coluna e regrantar allowlist; SELECT próprio não recursivo; UPDATE com USING/WITH CHECK; RLS/ACL IA/subscrições | AC02/03/06/07 |
| GL001-T06 | A1; três RPCs na unidade SQL | T02/T03/T05 | Assinaturas preservadas, invoker, guarda auth.uid/alvo, intervalos, ACL/overloads e defaults explícitos | AC05/06 |
| GL001-T07 | A1; `backend/src/middleware/adminAuth.js`, regressões/admin service apenas se necessário | T04/T05; reservas T01 | Autoridade lida no servidor, negação em erro, validação `0|1`, teste de despromoção/JWT antigo e ação privilegiada legítima | AC04 |
| GL001-T08 | A6; `AuthContext.tsx`, `api/auth.ts`, `api/user.ts`; A5 tipos | Contratos de spec; pode preparar antes T04–06 | Remover upsert pós-signup e uso de metadata para tipo; DTO allowlist; estado de erro não concede admin; signup com confirmação mantém perfil | AC01/02/03/04/10 |
| GL001-T09 | A4; `api/plano.ts` e serviços Stripe; A5 SQL de faturação | C-GL001-PREMIUM-v1; D2 | Remover escrita cliente na expiração; serviços trusted respeitam identidade/customer/subscrição e persistência sandbox | AC02/08/10 |
| GL001-T10 | A5 tipos; responsável dos consumidores de métricas com A7; A1 revisão | T06; contrato métricas v1 | Preservar retornos, propagar autorização negada sem a mascarar como vazio/sucesso; nenhum bypass para jobs | AC05/10; D4 |
| GL001-T11 | A5 baseline/README/caminho canónico; A1 revisão de segurança | T04–06; D3 | Reconciliar instalação e upgrade sem reintroduzir grants/policies inseguros; separar correções de sintaxe/arquivado/integridade | AC03/06/07/09 |
| GL001-T12 | A1 + A5; ambiente SQL isolado | T03–06/T11 | Aplicar caminhos limpo/upgrade, falha transacional, igualdade semântica e relatório por critério; recuperação sem reabrir falha | AC01–07/09 |
| GL001-T13 | A0/operador; runbook de acesso | D1 | Definir bootstrap de admin, origem de legitimidade e revisão controlada de papéis existentes; execução real fora deste planeamento | AC11 |
| GL001-T14 | A10; evidência independente staging/HTTP | T07–12; A3 ownership e A4 sandbox entregues | Repetir matriz direta de tabelas/RPC/backend, sem permissões de owner nos clientes; anexar sandbox A4; devolver defeitos aos donos | AC01–09 |
| GL001-T15 | A9 build; A10 iPhone; A0 candidato | T08–14; CI A2; acesso Apple/iPhone | Smoke do mesmo commit/migrações em TestFlight interno com staging; relatório de build/dispositivo/configuração | AC10/11 |
| GL001-T16 | A9 `push.service.js`/helper servidor; A1 grants/revisão | C-GL001-JOBS-v1; T06; integrar antes T14/T15 | Substituir RPC pública como serviço por SELECT direto filtrado e helper equivalente; erro sem envio; nenhuma nova entrada cliente | AC12 |
| GL001-T17 | A5/A7; transação de crédito e `workout/feedback.tsx` | Contrato de sessão/XP de A5; T05; integrar antes T14/T15 | Retirar UPDATE direto xp/nivel e consumir crédito autoritativo/idempotente para free/premium; não abrir exceção na allowlist | AC02/10 |
| GL001-T18 | A3 contrato/backend; A5 migração exclusiva; A1 revisão | GL-003; T02; D4; integrar antes T14 | Fixar assinaturas/transporte/ACL das RPCs internas, validar ator do JWT e repetir ownership/fencing na transação; clientes sem EXECUTE | AC06/12 |

## Checklist de conclusão por tarefa

- [ ] Contrato e ficheiros reservados publicados antes da edição.
- [ ] Alteração ligada ao commit e à migração efetivamente ensaiada.
- [ ] Comandos, versão das ferramentas, ambiente e resultado registados.
- [ ] Critérios associados indicados individualmente como passou/falhou/pendente, com evidência.
- [ ] Cenários negativos não leem nem escrevem dados de outra conta sintética e não produzem efeitos downstream.
- [ ] Consumidores dos contratos adaptados antes de integrar o candidato.
- [ ] Revisão independente recebida; uma prova do defeito antigo não conta como teste da correção.

## Casos negativos obrigatórios

| Caso | Pedido/ator | Resultado a provar | Critério |
|---|---|---|---|
| N01 | Signup com `tipo=1`, `plano=pago`, customer/data falsos; repetir com objetos/texto inválido | Perfil normal/free; nenhum admin/premium; metadata privilegiada não é convertida | AC01 |
| N02 | A altera metadata de `tipo` e reutiliza JWT no admin | 403; nenhuma consulta/alteração administrativa downstream | AC04 |
| N03 | A faz PATCH protegido ou PATCH misto `nome+tipo/plano` | Rejeição e transação sem alterações, incluindo `nome` | AC02 |
| N04 | A tenta INSERT, upsert com conflito, DELETE ou reatribuir `id` | Operação proibida; perfil existente preservado | AC02/03 |
| N05 | A faz SELECT/UPDATE a B e muda user_id/FK de filho para objeto B | Nenhuma linha/sentinela de B exposta ou alterada | AC03/07 |
| N06 | A chama cada RPC para B, UUID inexistente e NULL | `42501` genérico; não permite enumerar existência de B | AC05 |
| N07 | Anónimo chama todas as assinaturas/overloads; token inválido no gateway | Sem EXECUTE/acesso; JWT inválido rejeitado; nenhum dado privado | AC05/06 |
| N08 | Serviço sem sujeito chama RPC pública para B | Negado pela guarda; necessidade de job segue via interna explícita | AC05 |
| N09 | A envia `p_dias=NULL`, 0, negativo ou 367 | `22023` após autorização; 1, 30 e 366 próprios funcionam | AC05 |
| N10 | A escreve IA/subscrições/ledger ou lê dados B por REST/GraphQL exposto | Negado/sem linhas; GraphQL só é testado se exposto, sem assumir bypass de RLS | AC06/07 |
| N11 | A obtém sessão/customer sandbox de B e tenta verificar/portal | Rejeição sem mudar direitos; resultado e ausência de efeitos comprovados por A4 | AC08 |
| N12 | Falha de consulta de autoridade, admin demovido com token antigo | Nunca autoriza; pedido seguinte após despromoção não é admin | AC04 |
| N13 | Coluna nova/overload novo/default PUBLIC não revogado | Assertion falha e bloqueia integração, até contrato explícito | AC06/09 |
| N14 | Falha a meio da migração e tentativa de recuperação | Mudança parcial não é publicada; recuperação não restaura vulnerabilidade | AC09 |
| N15 | Agregação invoker com joins de A/B e tentativa de associação cruzada | Agregados completos de A, sem sentinelas B e sem recursão/permissões intermédias em falta; ligação inválida rejeitada | AC03/05/06 |
| N16 | Cliente tenta acionar helper de streak/rotina interna; DB falha durante job | Sem superfície HTTP/EXECUTE cliente; job não envia nem anuncia sucesso | AC12 |
| N17 | Backend com ator A e session/workout/plan/operation/fence de B nas RPCs A3 | Negado antes da escrita/IA; sem consumo da operação B ou conteúdo alheio | AC06/12 |

Casos positivos complementares: signup normal, A edita perfil permitido e campos descritivos de treino sem escrever XP, wizard preserva o pedido ao backend, A→A/B→B nas três RPCs com dados e sem dados, catálogo de exercícios legível conforme contrato, administrador provisionado legítimo, backend de A com JWT encaminhado, serviço sandbox autorizado, helper de job com streak equivalente e sem push real, instalação limpa/upgrade e smoke de login/restauro no iPhone. Testes de isolamento não são aprovados apenas porque todos os acessos falham.

## Artefactos futuros esperados

Migração gerada e ordenada; testes SQL/integração e fixtures; patch do backend; adaptações entregues por A4/A5/A6; relatório de matriz por AC; diff de autorização dos dois caminhos; runbook de revisão de privilégios; parecer A10 e evidência do candidato iPhone. Estado atual: estes artefactos de produto e execução **não existem por efeito deste planeamento**.

Decisões por resolver: D1 bootstrap/revisão de admins; D2 persistência/expiração premium; D3 baseline/ordem reconciliada; D4 integração do helper confirmado e transporte/grants das RPCs internas A3/A5. T16–T18 são pré-condições adicionais de T14/T15 apesar da numeração posterior. Responsáveis e efeito nas dependências constam de [plan.md](plan.md) e [spec.md](spec.md).
