# GL-001 — Autoridade de papéis, premium e acesso a dados

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: especificação proposta para revisão do coordenador; implementação e validação pendentes. Responsável: A1 — Segurança. Data: 2026-11-08. Idioma: PT-PT.

## Objetivo e âmbito

Impedir que um cliente escolha privilégios administrativos, altere direitos premium ou obtenha métricas de outra conta. O alvo é a beta interna para iPhone via TestFlight, com pagamentos sandbox e Coach apresentado como sugestões gerais. O mesmo isolamento é obrigatório em REST/RPC direto, independentemente da interface.

Abrange `handle_new_user`, autoridade de `profiles.tipo`, colunas de subscrição, grants/RLS de perfis e dados privados envolvidos, e `get_user_records`, `get_user_streak`, `get_corings`. Abrange contratos com A4/A5/A6 e regressões de autorização. Não implementa o Coach, pagamentos, offline, recovery, eliminação, push ou release; os respetivos responsáveis consomem estes contratos. Ownership dos objetos de IA no backend continua em A3 (BE-02/SEC-03).

Esta entrega contém apenas documentos. Não foram executadas migrações, consultas a dados de utilizadores, explorações, deploys nem alterações ao produto.

## Base e reconciliação

- Fonte analisada: commit `552f989b1d55adb22bee154a61d3f0062a8da207`, snapshot de texto, sem assumir que corresponde ao backend implantado. Antes de implementar, comparar com o checkout completo atual e preservar alterações posteriores.
- Relatório geral (fonte reservada da revisão histórica, `00-relatorio-geral.md`), Segurança (fonte reservada da revisão histórica, `01-seguranca.md`) e Dados (fonte reservada da revisão histórica, `03-dados.md`), incluindo notas live: SEC-01 e D01 estão confirmados nos metadados reconciliados; não foi demonstrada exploração de contas.
- `supabase-live-functions.json`: signup copia `raw_user_meta_data.tipo`; três RPCs métricas são `SECURITY DEFINER` sem comparação com `auth.uid()`.
- `supabase-live-profile-grants.json` e `supabase-live-policies.json`: INSERT/UPDATE de `tipo`/`plano` presentes; policies de escrita só vinculam o ID; nenhuma proteção de colunas identificada. Grants, isoladamente, não provam acesso anónimo a linhas.
- D02/D03 **não são falhas live atuais**: RLS de `ai_plans`, `ai_reports`, `user_subscriptions` está ativa; SELECT de `profiles` live é próprio e não recursivo. Permanecem riscos dos scripts. A ausência de uma tabela num extrato parcial de policies não significa ausência de policies.
- D09: `arquivado` já existe live; há quatro migrações de correção fora dos SQL locais. A5 detém a reconciliação global e A0 a ordem de integração.

## Regras de autoridade

1. `auth.users.id` validado identifica o ator. `profiles.tipo` protegido é a fonte de autoridade administrativa para esta beta: `0` utilizador, `1` administrador. Não se introduz uma segunda fonte concorrente em JWT/app_metadata. `user_metadata` nunca autoriza ações, incluindo na app.
2. O trigger cria exatamente um perfil por identidade, com `tipo=0`, `plano='free'`, `plano_ativo_ate=NULL` e `stripe_customer_id=NULL`, ignorando metadata para estes campos. Alterar metadata posteriormente também não altera autoridade. Dados descritivos de signup têm allowlist e validação; metadata privilegiada malformada não é convertida nem causa elevação.
3. O cliente não tem INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER nem UPDATE global em `profiles`. O perfil é criado pelo trigger. UPDATE é concedido apenas por coluna: `nome`, `idade`, `peso`, `altura`, `objetivo`, `peso_alvo`, `avatar_url`, `treino_dias_semana`, `treino_duracao`, `treino_equipamento`, `treino_nivel`, `treino_split`, `lesoes`, `preferencias_exercicios`. Os campos de treino/lesões são descritivos; `treino_nivel` é distinto do `nivel` derivado de XP. A5 confirma a existência/tipos destas colunas na baseline antes de gerar SQL. Nenhuma coluna futura entra automaticamente na allowlist.
4. `id`, `email`, `tipo`, `plano`, `plano_ativo_ate`, `stripe_customer_id`, `created_at`, `updated_at`, `xp`, `nivel`, `streak`, `streak_max` não são editáveis diretamente pelo cliente. Email segue apenas o fluxo Auth validado; timestamps são geridos no servidor; XP e derivados seguem o contrato de A5/A7. A lista deve ser adaptada às colunas realmente existentes, sem omitir campos privilegiados adicionais encontrados no inventário.
5. A4 é dono da escrita de subscrição: serviço confiável, identidade/customer/subscrição reconciliados e eventos sandbox verificados. O cliente só consulta o estado. Não pode sequer despromover `plano` para `free`; expiração é calculada para apresentação/autorizações e reconciliada no servidor. A definição temporal completa e persistência transacional são de A4/A5.
6. Alterar `tipo` exige uma operação administrativa autenticada no backend, com validação de inteiro `0|1`, leitura atual de autoridade e registo técnico da ação. Possuir um JWT normal, mudar metadata ou conhecer um UUID não concede acesso. O primeiro administrador é provisionado operacionalmente por um responsável autorizado, fora do signup público.
7. `service_role` é um domínio de confiança que pode contornar RLS; não é um utilizador administrativo da app. Não se distribui a chave no binário nem se aceita uma flag do pedido para simular este domínio. Os serviços continuam obrigados a validar ownership antes de agir em nome de uma conta (A3/A4).

## Matriz de acesso pretendida

Todas as permissões abaixo são cumulativas com grants e RLS; o papel funcional admin não dá acesso SQL transversal ao cliente.

| Superfície | Anónimo | Conta A | Conta B | Serviço interno autorizado |
|---|---|---|---|---|
| `profiles` SELECT | Negado | Só A | Só B | Apenas finalidade administrativa/operacional validada |
| `profiles` UPDATE | Negado | Só A, colunas permitidas | Só B, colunas permitidas | A4 subscrição; serviço admin papel; A5/A7 derivados |
| `profiles` INSERT/DELETE | Negado | Negado | Negado | Trigger/criação e fluxo de eliminação próprio de A6 |
| RPC métricas públicas | Sem EXECUTE | Só `p_user_id=A` | Só `p_user_id=B` | Sem exceção implícita; ver contrato RPC |
| `ai_plans`, `ai_reports` | Negado | SELECT próprio, sem escrita | SELECT próprio, sem escrita | A3 escreve após validar identidade/objetos |
| `user_subscriptions` e futuro ledger de pagamentos | Negado | Sem acesso direto | Sem acesso direto | A4/A5; cliente recebe resumo por perfil/API |
| Tabelas fonte de métricas | Negado | Só dados próprios e operações explicitamente necessárias | Idem B | Jobs com finalidade publicada |

Tabelas fonte: `workout_sessions`, `workout_sets`, `workout_feedback`, `daily_readiness`, e relações necessárias com `workouts`/`workout_exercises`. Policies de filhos seguem o proprietário da relação pai; um `user_id` autodeclarado não permite associar feedback/séries a sessões alheias. A5 detém as constraints e as RPCs de escrita transacional; A1 revê a matriz e os predicados. SELECT de catálogo de exercícios pode ser comum, sem expor dados privados. Acesso a outras tabelas expostas, views, funções e relações remanescentes é inventariado: nenhum objeto fica implicitamente autorizado por não constar desta tabela. Comunidades não são reintroduzidas.

RLS permanece ativa nas tabelas privadas. SELECT de perfil é `auth.uid()=id`, sem consulta recursiva a `profiles`. UPDATE usa `USING` e `WITH CHECK` por proprietário. Revogar só privilégios de coluna não remove um grant de tabela: a implementação tem de remover os grants amplos e herdados antes da allowlist ([PostgreSQL GRANT](https://www.postgresql.org/docs/current/sql-grant.html)).

### Inventário de consumidores do perfil no snapshot

Pesquisa em todos os `app/src` e `backend/src`, incluindo chamadas diretas e wrappers; este inventário deve ser repetido no commit de implementação.

| Consumidor real | Campos/operação atuais | Consequência do contrato |
|---|---|---|
| `app/src/services/api/auth.ts:51` | Upsert pós-signup de `id, idade, peso, altura, objetivo, peso_alvo`; metadata de signup também contém `nome` | Remover upsert em A6; trigger recebe os dados descritivos validados, mantendo confirmação de email |
| `app/src/app/edit-profile.tsx:67` → `api/user.ts` | UPDATE `nome, idade, peso, altura`; wrapper aceita `any` | Permitir estes campos próprios; substituir `any` pelo DTO allowlist com A5/A6 |
| `app/src/app/ai-plan.tsx:221` → `api/plano.ts` → `plan.service.js` | Wizard envia `diasPorSemana, tempoTreino, objetivo, targets, condicoes, descansoEntreSeriesSegundos` ao backend; **não grava profiles** neste snapshot | Manter pedido validado por A3; não inventar gravação implícita nem confundir `condicoes` com escrita de `lesoes` |
| `backend/src/services/ai/plan.service.js:58`, `adapt.service.js:20` | Leitura de `treino_*`, `lesoes`, `preferencias_exercicios` e dados descritivos; campos existem em migration-003 | Conservar allowlist descritiva acima e regressões do wizard/perfil; não autorizar XP/premium por semelhança de nome |
| `api/plano.ts:52` | UPDATE de `plano='free'` na expiração | Remover em A4; apenas leitura/cálculo de apresentação no cliente |
| `app/src/app/workout/feedback.tsx:218–247` | Leitura e UPDATE de `xp,nivel` ao montar resumo premium | Substituir por crédito autoritativo/idempotente A5/A7; bloqueia integração desse consumidor, sem exceção nos grants |
| `(tabs)/index.tsx:56`, `admin/_layout.tsx:16`, `api/user.ts` | Leitura própria de XP/nível, tipo e perfil completo | Preservar SELECT próprio; admin cliente não ganha SELECT transversal |
| `api/communities.ts` | Joins remanescentes a nome de perfil | Funcionalidade removida não justifica reabrir SELECT de perfis alheios nem reintroduzir comunidades |
| `admin.service.js`, `stripe/payment.service.js`, serviços IA/push | Escritas/leitura trusted por finalidade | Manter service role no servidor; A1/A3/A4/A9 validam fronteiras e erros |

## Contrato RPC C-GL001-METRICS-v1

Mantêm-se nomes, parâmetros e formato de retorno; evita-se uma mudança simultânea dos consumidores.

| Assinatura pública | Retorno preservado |
|---|---|
| `get_user_records(p_user_id uuid)` | Tabela `exercise_id bigint, exercise_name text, peso numeric, repeticoes integer, data_serie timestamptz` |
| `get_user_streak(p_user_id uuid)` | JSONB com `streak` e `maxStreak` |
| `get_corings(p_user_id uuid, p_dias integer DEFAULT 30)` | Tabela `data date, prontidao_score integer, sono_horas numeric, volume_total numeric, sentir_medio numeric, dor_count bigint` |

Decisão técnica proposta: as três RPCs passam a `SECURITY INVOKER`, com guarda de identidade **antes** da consulta. `auth.uid() IS NULL`, `p_user_id IS NULL` ou `p_user_id IS DISTINCT FROM auth.uid()` levantam SQLSTATE `42501`, com mensagem genérica em PT-PT. Este resultado não distingue um UUID existente de um inexistente. `p_dias` tem inteiro entre 1 e 366; NULL/fora do intervalo levanta `22023`. A guarda de autorização precede a validação do intervalo. A agregação e as fórmulas não mudam em GL-001.

EXECUTE é revogado a `PUBLIC`, `anon` e quaisquer grants diretos/overloads obsoletos; as três assinaturas são concedidas a `authenticated`. Cada função fixa `search_path=''` e qualifica relações/funções necessárias. O proprietário e ACL são explícitos, controlados por migração, sem ownership/DDL atribuídos a papéis cliente. RLS das fontes continua a filtrar os dados. Preferir invoker, fixar o caminho e restringir EXECUTE são medidas distintas ([Supabase Database functions](https://supabase.com/docs/guides/database/functions)).

O papel `service_role` sem identidade de utilizador também não usa estas RPCs para leitura arbitrária. Um backend que encaminhe um JWT validado de A pode usar a mesma via A→A. Jobs sem sessão seguem C-GL001-JOBS-v1 abaixo. Não acrescentar uma condição `OR service_role` à RPC pública por conveniência.

`handle_new_user` permanece um trigger privilegiado quando necessário para criar o perfil: proprietário controlado, caminho fixo, relações qualificadas e sem EXECUTE de cliente. Não confundir este trigger com uma RPC invoker. Inventariar também `calculate_readiness` e outras funções expostas; funções puras não justificam acesso a tabelas privadas. Defaults de EXECUTE devem ser fechados para os criadores de objetos relevantes, com allowlist para funções que precisem de acesso público; não depender de um REVOKE apenas por schema para remover o default global de `PUBLIC`.

## Contrato interno C-GL001-JOBS-v1

Há uma dependência **confirmada**, não hipotética: `backend/src/services/push.service.js:61` chama atualmente a RPC pública `get_user_streak` através de `supabaseAdmin`, sem sujeito de utilizador. A9 substitui essa chamada por um helper exclusivamente de servidor, proposto `getUserStreakForJob(userId: UUID, jobRunId: string): Promise<{streak: number; maxStreak: number}>`. Não é exportado por HTTP/Edge Function nem chamado a partir de parâmetros de um pedido cliente. O scheduler seleciona os destinatários a partir de tokens/preferências persistidos e gera o `jobRunId`; o ID alvo não vem de body/URL/metadata. Falha de leitura é erro de job, sem envio nem falso sucesso.

O helper usa o cliente `supabaseAdmin` já existente para SELECT direto de `workout_sessions(user_id,data_fim)` filtrado por `user_id`, descartando sessões incompletas e aplicando a mesma regra de streak da RPC, com fixtures de equivalência. Não usa RPC pública, não introduz ligação SQL/segredo adicional e não necessita de `auth.uid()` artificial. Grants exigidos para esta leitura: `USAGE` em `public` e `SELECT(user_id,data_fim)` em `workout_sessions` para `service_role`; não há EXECUTE novo. O serviço já tem capacidades mais amplas para outras operações, pelo que este contrato não afirma isolamento entre módulos que partilham essa chave. A1 inventaria os grants efetivos e não remove permissões exigidas por outras finalidades durante esta migração.

O scheduler mantém, separadamente, `SELECT` dos campos necessários de `push_tokens`/preferências e `profiles(id,plano,plano_ativo_ate)` para seleção elegível, e o writer de tokens tem as permissões de manutenção próprias; A9 documenta a projeção final e corrige os filtros `id_utilizador/criado_em` inválidos encontrados no review. Nenhum destes grants é atribuído a `anon`/`authenticated` como consequência do job. A9 detém `push.service.js`/scheduler; A1 não os edita em concorrência. Se push for retirado da beta, o job fica desativado e a migração não deve deixá-lo a chamar silenciosamente a RPC agora negada.

## Contrato de segurança das RPCs internas A3/A5

A3 propôs `begin_ai_operation(p_actor_id uuid,p_tipo text,p_operacao_id uuid,p_pedido jsonb)`, `commit_ai_plan(p_actor_id,p_operacao_id,p_fence,p_resultado jsonb)`, `import_ai_plan_day(p_actor_id,p_operacao_id,p_fence)` e `commit_ai_feedback(...,p_resultado jsonb)`. São propostas de contrato de GL-003, com nomes/tipos finais de A5; não são SQL implementado por GL-001.

Estas operações são `SECURITY INVOKER`, com EXECUTE revogado a `PUBLIC`, `anon` e `authenticated` (incluindo overloads); EXECUTE apenas para `service_role`, `USAGE` apenas no schema interno necessário e grants de dados mínimos para a operação. Preferir schema não exposto com chamada por canal interno suportado; se A5 precisar de Data API, publicar explicitamente o schema/wrapper service-only e testar a ACL, sem uma versão callable pelo utilizador. A escolha de transporte é de A0/A5 e não altera o contrato de negação ao cliente.

O backend obtém `p_actor_id` exclusivamente de `req.user.id` após validação do JWT, sem copiar a identidade de URL/body/metadata. A base repete predicados de ownership do ator, sessão/treino/plano, relações associadas e direito premium antes de ler/escrever; o fencing/idempotência vincula-se também ao ator e operação. Negação não grava feedback nem reserva/consome operação de outra conta, não chama IA e não revela conteúdo alheio. Uma futura variante para JWT de utilizador deriva o ator de `auth.uid()` e não aceita `p_actor_id`. O service role pode tecnicamente indicar qualquer ator: a integridade desta identidade depende da fronteira backend verificada e não é garantida só pelo parâmetro SQL.

## Contratos entre responsáveis

| Contrato | Dono | Consumidor e entrega necessária |
|---|---|---|
| C-GL001-AUTH-v1: ator validado, `tipo` de perfil protegido | A1 backend/SQL; A6 ciclo cliente | A6 remove `tipo` de `user_metadata` em login/restauro; perfil em erro não resulta em admin |
| C-GL001-PROFILE-v1: criação só por trigger; UPDATE por allowlist | A1 política; A5 tipos | A6 remove `upsert` pós-signup de `auth.ts`; `userApi.updateProfile` recebe tipo restrito definido com A5 |
| C-GL001-PREMIUM-v1: cliente consulta; escrita confiável | A1 controlo; A4 estado/eventos | A4 remove UPDATE de expiração em `app/src/services/api/plano.ts`; publica regras sandbox e erros de persistência; A5 cria ledger/constraints |
| C-GL001-METRICS-v1 | A1 assinatura/segurança; A5 tipos partilhados | Consumidores preservam retorno; não tratar autorização negada como sucesso vazio; A7 coordena UX de erro |
| C-GL001-JOBS-v1 | A1 grants/fronteira; A9 helper/scheduler | Substituir chamada service-role à RPC pública; SELECT direto filtrado, regra equivalente e falha sem envio |
| RPCs internas GL-003 | A3 contrato; A5 SQL/tipos; A1 revisão | Ator validado no backend, ownership repetido na transação, ACL service-only e transporte explícito |
| C-GL001-MIGRATION-v1 | A1 conteúdo de autorização; A5 baseline; A0 sequência | Um autor por migração; A5 não sobrescreve ACL/RLS novas ao reconciliar scripts; A10 revê integração |

`AuthContext.tsx` é de A6. Nenhuma alteração concorrente por A1. As adaptações em `auth.ts`/`user.ts` são entregues a A6; `plano.ts` a A4; tipos centrais a A5. A0 publica a reserva final de ficheiros antes da implementação.

## Critérios de aceitação

| ID | Resultado exigido |
|---|---|
| GL001-AC01 | Signup com `tipo=1`, `plano='pago'`, datas/customer arbitrários, incluindo metadata inválida, cria perfil normal/free sem direitos adicionais. Signup legítimo continua a funcionar com confirmação de email ligada/desligada. |
| GL001-AC02 | REST/SDK de A não consegue INSERT/upsert/DELETE de perfil nem alterar campos protegidos, isolados ou misturados com um campo permitido. A operação mista falha integralmente; o estado anterior mantém-se. |
| GL001-AC03 | A atualiza campos permitidos de A e lê o perfil; A→B, anónimo, alteração de ID/proprietário e troca de FKs não leem nem escrevem dados de B. Perfis não causam recursão em instalação limpa ou upgrade. |
| GL001-AC04 | Token ausente/inválido recebe 401 no backend; utilizador normal e metadata forjada recebem 403 nas rotas admin. Admin provisionado pode executar a ação legítima; erro de leitura de autoridade nunca autoriza. Demover admin afeta o pedido seguinte mesmo com JWT anterior. |
| GL001-AC05 | Para cada RPC/overload: A→A e B→B mantêm resultados esperados; A→B/A→UUID inexistente e NULL são negados sem devolver métricas; anónimo não tem EXECUTE; `service_role` sem sujeito não recebe acesso arbitrário pela RPC pública. |
| GL001-AC06 | ACL, proprietário, `prosecdef`, `proconfig/search_path`, defaults e RLS correspondem ao contrato; não subsistem overloads/views/funções expostas que contornem as mesmas proteções. RLS transitiva permite agregações legítimas com joins de A sem expor B. Testes diretos não dependem de esconder botões. |
| GL001-AC07 | `ai_plans`/`ai_reports` só têm leitura própria para cliente; escritas de cliente e qualquer acesso direto a `user_subscriptions`/ledger são negados. Serviços autorizados continuam a funcionar e não confiam em IDs autodeclarados. |
| GL001-AC08 | A4 demonstra escrita premium sandbox autorizada e rejeição de sessão/customer de B; cliente não altera premium nem na expiração. Integração não reconhece sucesso se a persistência falhar. |
| GL001-AC09 | Instalação vazia e upgrade de baseline reconciliada produzem a mesma superfície de autorização; migração é transacional, não destrutiva e não reatribui em massa papéis/direitos existentes. O rollback não reabre a falha. |
| GL001-AC10 | Login/restauro/signup/edição/métricas/premium funcionam no build iPhone candidato sem confiar em metadata para autoridade. Relatório associa commit, migrações e configuração de staging ao binário; A10 valida de forma independente. |
| GL001-AC11 | Revisão controlada de privilégios existentes tem responsável, fonte de legitimidade e procedimento de remediação definidos antes da abertura da beta. O relatório de planeamento não afirma que contas existentes são legítimas ou comprometidas. |
| GL001-AC12 | Job de streak autorizado mantém resultado equivalente por C-GL001-JOBS-v1; erro de leitura não envia push; cliente não aciona o helper nem recebe grants adicionais. As RPCs internas A3/A5 não são executáveis por cliente e rejeitam relações/operation IDs de B para ator A antes de efeitos. |

## Decisões pendentes e limites

- D1 — A0/operador: quem pode provisionar o primeiro admin e qual a fonte externa para validar os admins existentes? Não é possível inferir legitimidade a partir de `tipo` ou metadata, ambos influenciáveis no estado revisto. Nenhum reset de contas em massa é autorizado aqui.
- D2 — A4/A5: validar C-GL001-PREMIUM-v1, tabela/ledger e semântica de expiração. A4 mantém a responsabilidade de convergência e associação de eventos; GL-001 não resolve BE-01/03/04 isoladamente.
- D3 — A5/A0: identificar baseline suportada e sequência única perante as quatro migrações live ausentes. Os ficheiros SQL finais só são nomeados/gerados durante implementação, após inventário; não reutilizar números históricos.
- D4 — A0/A9 confirma integração do helper do job já identificado; A0/A5 escolhe o transporte das RPCs internas A3 sem ampliar ACL cliente. Não há RPC pública de métricas com bypass para jobs.

Estas decisões não impedem a preparação dos testes/documentos; a respetiva validação bloqueia apenas as tarefas dependentes. Cumprir GL-001 é necessário para a beta e não certifica os restantes domínios, a aprovação Apple ou a prontidão pública.

Referências técnicas adicionais: [RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) e [Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security). Changelog consultado em 2026-11-08 através da [página HTML](https://supabase.com/changelog), pois a variante `.md` não foi servida pelo leitor; a implementação deverá voltar a confirmar versão/PostgreSQL/CLI e alterações relevantes.
