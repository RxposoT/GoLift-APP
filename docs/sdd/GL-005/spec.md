# GL-005 — Integridade de dados e recuperação por conta

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **Draft para revisão da coordenação**, apenas planeamento. Responsável: A5 — Dados. Data: 2026-11-08. Fonte: `552f989b1d55adb22bee154a61d3f0062a8da207`. Destino: beta interna iPhone/TestFlight, pagamentos sandbox e Coach com sugestões gerais.

## Objetivo e fronteiras

Guardar treinos, sessões, séries e peso sem resultados parciais ou duplicação por reenvio; recuperar o treino em curso após terminar a app; impedir mistura de dados locais entre contas; tornar o caminho SQL reproduzível. O XP é creditado pelo servidor uma vez por sessão, para free e premium. Esta unidade fornece também as transações e o contrato comum de operações de GL-003B.

Este trabalho escreve apenas `spec.md`, `plan.md` e `tasks.md`. Não aplica SQL, não altera a app/backend, não instala ferramentas, não consulta contas/APIs reais e não publica builds. Não introduz sincronização genérica de todas as tabelas, CRDT, broker, histórico navegável de planos nem um novo serviço de IA. Convergência de pagamentos pertence a GL-004/A4: usa constraints e migrações A5, mas não reutiliza automaticamente o recibo de mutações da app como ledger Stripe.

As propostas técnicas abaixo estão alinhadas com A3; números operacionais e escolhas de produto assinalados continuam sujeitos à revisão A0. Não equivalem a implementação aprovada ou testes concluídos.

## Evidência e prioridade

| Achado | Interpretação para esta unidade |
|---|---|
| D01 / GL-001 | RPCs métricas privilegiadas sem guarda confirmadas nos metadados já recolhidos. Corrigir autorização em GL-001 sem esperar por offline/recibos. |
| D02/D03 | Não são falhas atuais confirmadas: RLS IA/subscrições está ativa e SELECT de profiles live não é recursivo. Corrigir a reprodução versionada, sem anunciar uma nova exposição live. |
| D04 | `workouts.ts` grava cabeçalho/séries em pedidos diferentes; edição apaga associações antes da substituição. O harness reproduziu sessão parcial e duplicada. |
| D05 | `metrics.tsx` usa peso/meta/badges globais; lista remota vazia pode ressuscitar o cache de A em B. |
| D06/D08 | Fila e cachedQuery não integram os percursos críticos. O helper global perde adds e executa duas vezes sob concorrência em mocks; é um defeito latente, não prova de utilização atual. |
| D07/D09 | Comentários `#` invalidam 004; a ordem incremental não cria tudo o que o backend consome. `arquivado` já existe no catálogo reconciliado; não está em falta no serviço observado. |
| APP-07 | XP calculado no cliente após gravar sessão e persistido ao montar apenas o resumo premium; reabrir pode creditar de novo e free não recebe o mesmo efeito. |
| BE-05/06 | UNIQUE mensal impede arquivo+nova linha; importação não é atómica e perde prescrição. GL-003B define wire; A5 define garantias de armazenamento. |

Fontes locais: relatório geral (fonte reservada da revisão histórica, `00-relatorio-geral.md`), dados (fonte reservada da revisão histórica, `03-dados.md`), `artefactos reservados da revisão/supabase-{migrations,live-schema,live-policies,live-functions}.json`, serviços locais de treino/peso/cache/sync e ecrãs `workout/[id].tsx`, `workout/feedback.tsx`, `metrics.tsx`. Os extratos de catálogo são parciais e datados: não descrevem integralmente a implantação nem autorizam novas consultas.

## Fatias de entrega

1. **GL-005A — conter perdas e drift:** inventário e caminho único de instalação/upgrade, isolamento imediato das chaves locais e respostas em voo, transações de treino/sessão com recibos e XP autoritativo. Integração coordenada com os consumidores de GL-001 e A7. Não implementar XP ainda pelo cliente para contornar os grants novos.
2. **GL-005B — recuperação beta:** rascunho durável, fila tipada por conta de conclusão de sessão e mutação de peso, estados explícitos, recuperação após reinício e rede intermitente. Não anunciar conclusão remota ao guardar apenas localmente.
3. **GL-005C — integridade IA:** versão/CAS do plano, prescrição importada, recibos com lease/fencing e feedback first-write de GL-003B. Pode ser retirada geração/importação da beta por decisão explícita A0 se incompleta; nunca manter a implementação parcial em utilização.

GL-001 e GL-003A fecham P0 de autorização independentemente destas fatias. Antes de abrir a beta, integridade e recuperação dos fluxos efetivamente disponíveis têm de estar demonstradas. Não classificar todos os passos de C como pré-requisitos da correção P0.

## Modelo e invariantes propostos

Nomes novos são propostas de implementação; tipos finais derivam da baseline e do contrato canónico, não de cópias manuais nas specs.

| Objeto | Regra de integridade |
|---|---|
| `workouts` | Proprietário imutável para cliente; `versao` inteira crescente, inicial 1 para linhas válidas. `UNIQUE(id,user_id)` suporta FK de propriedade da sessão. Edição verifica versão esperada, incrementa uma vez e substitui nome/associações integralmente. |
| `workout_exercises` | Mantém UNIQUE(workout_id,exercise_id), ordem explícita, sem repetição de exercício no mesmo treino nesta beta. Acrescentar `series_planeadas`, `repeticoes_planeadas` textual, `observacao` e `descanso_segundos`, nullable para treinos manuais/legados. Prescrição é distinta de séries executadas. |
| `workout_sessions` | FK composta `(workout_id,user_id)` para treino; UUID `sessao_local_id` estável gerado no início do rascunho, UNIQUE(user_id,sessao_local_id). Conclusão nova só existe com agregado válido e pelo menos uma série concluída. `xp_ganho` e versão da regra são geridos pelo servidor. Não exigir preenchimento retroativo artificial para sessões históricas. |
| `workout_sets` | FK para sessão; UNIQUE(session_id,exercise_id,numero_serie), numero_serie >= 1, repetições inteiras >= 1, peso decimal >= 0. Peso 0 permite exercícios sem carga externa. Exercícios devem integrar o treino/versão autorizado na conclusão. Limites superiores e precisão acordados com A7 antes da implementação. |
| `workout_feedback` | UNIQUE(session_id); FK `(session_id,user_id)` para sessão própria. Para GL-003B a primeira submissão vence; não existe edição nesta beta. Outra intenção recebe `FEEDBACK_JA_SUBMETIDO`, sem substituir a linha nem chamar modelo. |
| `ai_plans` | Conservar UNIQUE(user_id,mes), ID mensal estável, `versao>=1`, versão do schema do conteúdo e timestamps. Criar com versão esperada null; substituir só por CAS da versão lida. Não arquivar antes da geração nem criar segunda linha mensal. |
| Treino importado | Guarda plano_id/versão/dia_indice de origem e cópia da prescrição nas associações. A regeneração não altera a cópia já importada. Não usar FK para uma versão histórica que não existe; guardar a versão de origem como valor. |
| `weight_history` | Conservar UNIQUE(user_id,week). Semana canónica é segunda-feira `YYYY-MM-DD` em Europe/Lisbon, proposta comum de calendário. Acrescentar versão e tombstone de eliminação; linha eliminada não aparece no histórico mas conserva a versão para impedir recriação por pedido antigo. Peso nullable apenas quando eliminado, positivo quando ativo. |
| `private.operation_receipts` | Recibo comum de mutações, sem SELECT/INSERT cliente. Chave única `(actor_id,tipo,operacao_id)`, esquema/hash/pedido canónico, estado, resultado de domínio e referência ao recurso. Campos lease/fence apenas onde a chamada externa os exige. FK de conta com política de eliminação coordenada A6. |

Constraints e RPC repetem a igualdade de proprietários; não basta filtrar apenas no controller nem confiar num `user_id` recebido. Filhos sem user_id seguem o pai e policies transitivas. A FK simples de exercício não prova que pertence à versão do treino; a transação valida a pertença antes de inserir. Identidade de exercícios vem de ID, não de comparação de nomes.

Instalação/upgrade inventariam relações inválidas, duplicados, peso/semanas malformados, sessões sem séries e XP incompatível antes de validar constraints. Não apagar, reatribuir donos, completar sessões nem recalcular todos os saldos automaticamente. Produzir diagnóstico restrito e decisão explícita de remediação. Índices/constraints de linhas históricas só ficam validados depois dessa etapa. O perfil preserva os campos descritivos e protegidos publicados em [GL-001](../GL-001/spec.md); confirmar tipos/colunas treino_* na baseline.

## C-GL005-OPERACOES-v1 — recibos e reenvios

Uma intenção recebe UUID antes do primeiro envio; duplo toque/retry/reinício conservam esse UUID e o mesmo pedido. A conclusão conserva também `sessao_local_id`, mesmo perante erro de UI que tente criar outra operação. Nova cópia deliberada de importação recebe UUID novo. A chave inclui ator e tipo; conhecer um UUID de B não autoriza A.

O servidor valida e normaliza o pedido: allowlist fechada, Unicode/números/defaults segundo o contrato, propriedades de objeto em ordem determinística, arrays com ordem significativa preservada. O hash SHA-256 abrange o pedido canónico e a versão de esquema, excluindo tokens, request_id, lease e UUID da operação; não aceitar hash autodeclarado pelo cliente como prova. Não reutilizar o mesmo nome de tipo para um esquema incompatível. IA segue os refinamentos de GL-003 e o futuro `contracts/http/openapi.yaml`.

| Situação | Resultado |
|---|---|
| Chave ausente e pedido válido/autorizado | Executar/reservar conforme tipo; o domínio e o recibo de sucesso são confirmados na mesma transação. |
| Chave existente, mesmo hash, sucesso confirmado | Devolver o mesmo resultado de domínio, IDs e código de sucesso; não repetir mutação/modelo/XP. `request_id` de transporte pode ser novo. |
| Mesma chave, hash diferente | 409 `CHAVE_REUTILIZADA`, sem efeito. Não corrigir o payload silenciosamente para passar. |
| Recurso alheio/inexistente ou ownership revogado | Negação uniforme conforme GL-003; não revelar o recibo de outra conta nem ressuscitar recursos eliminados. Reautenticar/reautorizar antes do replay. |
| Resultado desconhecido após timeout | Reenviar mesma chave/pedido para consultar o recibo; nunca concluir que houve rollback nem gerar automaticamente UUID novo. |
| Conflito de versão | 409 `VERSAO_DESATUALIZADA`; preservar intenção local, recarregar e pedir reconciliação. Um pedido revisto é outra intenção/chave. |

Escritas sem fornecedor externo decorrem numa única chamada/transação: constraints únicas e bloqueio do recibo serializam envios concorrentes. Não precisam de lease nem de um worker de recuperação. Erro SQL aborta o domínio e o recibo; erro de negócio devolve resultado estável sem efetuar mudanças parciais. Não capturar uma exceção SQL e devolver sucesso após ter aplicado parte do agregado. [Transações PostgreSQL](https://www.postgresql.org/docs/current/tutorial-transactions.html) fundamentam a garantia integral; [INSERT/ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html) suporta a arbitragem por constraint, sem substituir a transação do agregado.

Retenção proposta para a beta: **sem limpeza automática de recibos**. Conservar enquanto qualquer build/rascunho/fila suportado possa reenviar; retirar a build e drenar/expirar explicitamente os retries antes de definir GC. Eliminação de conta continua a remover dados privados pelo contrato A6; uma nova identidade não herda recibos. Não guardar JWT/chaves no recibo nem copiar notas/resultados de saúde para logs. Guardar pedido bruto apenas enquanto necessário para executar/retomar a operação; após completed/failed terminal, conservar hash/esquema/referências e resultado necessário ao replay, removendo a cópia redundante de notas/condições. O resultado privado tem acesso restrito e a mesma política de eliminação. Recibos com referências apagadas nunca recriam o recurso no replay. A6/A0 ratificam a política de retenção antes da beta; a escolha não é autorização para retenção indefinida.

## C-GL005-MUTACOES-v1 — RPCs da app

Proposta de transporte mínimo: Supabase Data API existente, wrappers `public` explicitamente expostos. As RPCs da app derivam o ator de `auth.uid()` e **não aceitam `p_actor_id`** nem um dono no payload; auth.uid null é negado antes de qualquer consulta privada. Invoker não basta aqui sem conceder ao cliente escrita em XP/recibos, precisamente as permissões que se pretende fechar. Por isso são `SECURITY DEFINER` restritas, proprietário controlado sem login e privilégios mínimos, `search_path=''`, nomes qualificados, EXECUTE só `authenticated`, revogado a PUBLIC/anon e overloads antigos. Cada corpo verifica explicitamente ator/owner/relações mesmo quando o contexto privilegiado contorna RLS. A1 revê cada wrapper; não conceder acesso cliente ao schema privado e ativar RLS nas tabelas privadas segundo a matriz de grants/policies ratificada. Não copiar estas características para as RPCs métricas invoker de GL-001.

| Assinatura de intenção | Efeito/retorno confirmado |
|---|---|
| `write_workout(p_operacao_id uuid,p_pedido jsonb)` | Ação criar/editar/eliminar; editar/eliminar requerem ID/versão esperada, criar/editar requerem nome e lista ordenada validada. Retorna treino_id/versao/contagem ou confirmação de eliminação. Toda a edição, incluindo DELETE+INSERT de associações, está numa transação. Eliminação mantém a semântica de domínio existente após inventário das cascades; não credita/devolve XP e o recibo não ressuscita o treino. |
| `complete_workout_session(p_operacao_id uuid,p_pedido jsonb)` | Pedido contém sessao_local_id, treino_id/versão, início/fim/duração e séries concluídas validadas; não contém xp/nível/dono. Grava sessão+séries+XP+recibo e retorna sessão_id, xp_ganho, xp e nivel confirmados. |
| `mutate_weight(p_operacao_id uuid,p_pedido jsonb)` | Semana canónica, ação set/delete, peso quando set e versao_esperada (0 se nunca existiu). CAS incrementa versão também no delete. Retorna semana/versão/estado confirmado. |

Os payloads e resultados concretos serão publicados num contrato canónico de dados acordado A3/A7/A2 antes de implementar tipos. Esta tabela fixa as garantias, não cria um segundo contrato HTTP concorrente. IDs bigint expostos como números têm de ser inteiros seguros, alinhados com GL-003; rejeitar conversões com perda de precisão. Entrada PT-PT converte vírgula decimal para número validado no cliente; o servidor não interpreta strings livres como números.

Todas as referências/versões são revalidadas no commit. Treino editado/eliminado desde o rascunho dá conflito/objeto indisponível e conserva rascunho; não descartar séries nem associá-las automaticamente a outro treino. Respostas Supabase com error ou zero linhas inesperadas são falhas, não sucesso vazio. Leituras legítimas vazias são sucesso.

Após migração dos consumidores, revogar as escritas REST diretas que possam contornar estes agregados, versões e XP: treinos, sessões, séries, associações, peso e feedback. Leituras próprias continuam protegidas por RLS; edição descritiva de perfil segue allowlist GL-001. Inventariar também eliminações: nenhum endpoint/DELETE antigo pode continuar a modificar silenciosamente a mesma versão. A implementação tem de migrar os consumidores existentes necessários, ou fechar explicitamente a ação na beta; não revogar grants antes de existir o caminho funcional correspondente.

## C-GL005-XP-v1 — autoridade e concorrência

O servidor calcula o crédito dentro da conclusão da sessão com histórico **anterior à sessão**, por ID do exercício. Referência observada: `app/src/app/workout/[id].tsx:637–665` calcula 20/25/15/10 no cliente; `feedback.tsx:218–247` grava xp/nivel ao montar o resumo premium. Proposta de continuidade, ainda não ratificada como regra de negócio: por exercício com séries válidas, 20 XP se nunca executado; senão 25 se carga máxima supera o recorde anterior; senão 15 se supera a carga máxima da última sessão anterior desse exercício e esta era >0; nos restantes casos 10. A primeira condição aplicável vence. Somar exercícios, sem XP por séries incompletas; não aceitar sessão nova vazia apenas para obter o mínimo. Free e premium recebem exatamente a mesma regra. A7/A0 ratificam estes números e os casos sem carga antes da implementação, sem os tratar como já aprovados. Fixtures distinguem primeiro exercício, recorde, aumento face à última sessão sem recorde, carga igual/inferior e zero, múltiplos exercícios, mudança de nível e retry.

Bloquear a linha de perfil do ator durante o cálculo/crédito, e usar ordem de locks uniforme entre RPCs (recibo, perfil, agregado por ID). Duas conclusões distintas da mesma conta serializam histórico/XP e não perdem incrementos. Guardar `xp_ganho` e `xp_regra_versao` na sessão é o registo mínimo de crédito; não criar um ledger genérico de gamificação para esta beta. UNIQUE de sessão local evita novo crédito com outra operation key para a mesma sessão; se os dados diferirem, devolver conflito.

Manter semântica atual do perfil: xp é o resto do nível, não total vitalício; ao atingir `nivel*100`, subtrair esse limiar e incrementar nível, repetindo. O cálculo usa saldo válido bloqueado; perfil com estado legado inválido exige remediação, sem reset silencioso. O replay devolve o saldo observado no commit original; a app não o usa para sobrescrever um perfil mais recente e pode recarregar o saldo atual. Não recalcular créditos antigos nem devolvê-los por eliminação de treino nesta entrega; preservar evidência mínima de sessão/recibo conforme a política de eliminação final.

Retirar efeitos de escrita ao montar `PremiumFlow`, cálculo de autoridade a partir de route params e qualquer update cliente de xp/nivel. O resumo mostra o crédito da confirmação; offline mostra XP por confirmar. `streak` e métricas continuam derivados de sessões confirmadas próprias; não alterar fórmulas/prontidão nesta unidade.

## C-GL005-IA-v1 — contrato comum com GL-003B

A3 confirmou este desenho em revisão: quatro RPCs propostas e finalização de falhas, feedback first-write, CAS mensal, prescrição integral e sem GC na beta. A0 mantém a ratificação final.

O backend usa `.rpc()` pelo canal Data API já existente: wrappers `public` `SECURITY INVOKER`, service-only, com tabelas/helpers `private`. REVOKE EXECUTE a PUBLIC/anon/authenticated e concessão explícita a service_role; grants internos mínimos por finalidade. Schema privado não é exposto na Data API. Não presumir que uma função não exposta pode ser chamada por `.rpc()`; os wrappers tornam o transporte concreto sem adicionar driver/segredo. [Funções Supabase](https://supabase.com/docs/guides/database/functions) documentam invoker/definer e controlo de EXECUTE. Service role pode contornar RLS: as funções repetem ator/proprietário/relações/direitos e nunca confiam em campos do resultado do modelo para os escolher.

| RPC | Contrato ratificado entre A3/A5, Draft para A0 |
|---|---|
| `begin_ai_operation(p_actor_id uuid,p_tipo text,p_operacao_id uuid,p_pedido jsonb)` | Ator só do JWT validado no backend. Revalidar referências/direitos antes de reservar; fixar pedido/hash, versão, mês e instante iniciais. Retorno interno discriminado: acquired + fence + pedido reservado; replay + HTTP/body; busy + retry_after; ou erro de domínio. Não executar IA. |
| `commit_ai_plan(p_actor_id uuid,p_operacao_id uuid,p_fence text,p_resultado jsonb)` | Tipo fixo generate. Validar resultado e fence vigente, repetir owner/direito; criação com CAS ausente ou update da mesma linha/versão. Guardar nova versão e PlanoResposta no mesmo commit. |
| `import_ai_plan_day(p_actor_id uuid,p_operacao_id uuid,p_fence text)` | Tipo fixo import. Relê plano próprio na versão reservada; resolve dia e catálogo no servidor, copia prescrição integral, cria agregado+resultado atomicamente. Nunca recebe exercícios livres nem IA dentro da transação. |
| `commit_ai_feedback(p_actor_id uuid,p_operacao_id uuid,p_fence text,p_resultado jsonb)` | Tipo fixo feedback. Revalidar sessão concluída própria/relação treino/direito; inserir primeira linha+resultado da operação no mesmo commit, sem upsert. Outra intenção na mesma sessão dá 409 FEEDBACK_JA_SUBMETIDO. |
| `finish_ai_operation_failure(p_actor_id uuid,p_tipo text,p_operacao_id uuid,p_fence text,p_codigo text,p_recuperavel boolean)` | Só backend, códigos em allowlist que determinam recuperabilidade. Não aceita mensagem/SQL livre. Com fence atual, marca falha terminal ou tentativa transitória recuperável; nunca altera operação completed, resultado ou domínio. |

Estados mínimos do recibo IA: running, completed, failed; failed guarda código e se permite nova tentativa. Lease proposta de **120 s** no relógio da BD, superior ao orçamento HTTP/modelo de GL-003; não renovar com timer distribuído nesta beta. A reserva nova/retoma incrementa fence monotónico e devolve-o como texto opaco. Running com lease válida dá 409 OPERACAO_EM_CURSO/Retry-After; expirada pode ser adquirida atomicamente por outro worker com novo fence. Só o fence atual com lease válida pode confirmar/finalizar falha. Worker antigo nunca grava após retoma; IA decorre fora da transação e pode ter sido chamada mais de uma vez após crash.

Falha transitória mantém a chave/hash/pedido/período e permite retoma com fence novo; terminal devolve o mesmo erro de domínio sem modelo. Se não for possível persistir a falha, o recibo running fica recuperável por expiração. Se o commit remoto for desconhecido, o backend consulta/reenvia a mesma operação; não chama finish para a libertar às cegas. finish atrasado num completed é no-op/retorno de completed. Atomicidade garante um efeito de domínio; não promete uma só invocação/cobrança do fornecedor.

Feedback também precisa de exclusão entre intenções diferentes para a mesma sessão **antes do modelo**: ao reservar, bloquear a sessão e procurar feedback ou outra reserva running/transitoriamente recuperável do mesmo alvo. A primeira intenção fica dona desse alvo até terminar ou falhar terminalmente; retoma usa a mesma operação. UNIQUE(session_id) é a última defesa no commit. Não manter lock SQL durante a chamada externa. Uma reserva abandonada é retomada/finalizada por política explícita; não dar licença a outro UUID só porque o HTTP terminou. A ausência de editor atual permite evitar CAS adicional de feedback; futuras edições exigem novo contrato.

Importação: nomes de catálogo normalizados deterministamente, sem fuzzy matching nem reescrita de catálogo existente; resolução/criação e junction fazem parte da mesma transação. Concorrência usa a constraint única real e relê a linha vencedora; não ignorar erro de insert. Inventariar variantes legadas por caixa/espaços antes de criar índice de normalização. Colisão ambígua é erro explícito, sem treino parcial. Importado conserva ordem, séries, intervalo textual de repetições, observação e descanso; retorno verifica contagem real. Se não houver round-trip integral, não disponibilizar importação na beta.

## C-GL005-LOCAL-v1 — rascunhos, fila e cache

Namespace privado proposto: `@golift:v2:<uid>:<recurso>`. O envelope confirma também uid/schemaVersion; não confiar apenas na chave. Recursos: peso, metas/badges privados, cache, rascunhos e pendências. Tema/preferências comprovadamente globais podem ficar fora. Dados antigos em chaves globais sem owner conhecido são removidos/invalidados, **nunca atribuídos à conta que iniciar sessão a seguir**.

AuthContext é de A6: na mudança de identidade, incrementar geração de sessão, cancelar/ignorar pedidos antigos e limpar memória/listeners/cache visível antes de apresentar B. Cada pedido/processor guarda uid+geração e valida-os antes de enviar, receber ou publicar resultado. O pedido usa Authorization ligado à sessão A capturada em memória e validada para o uid dessa intenção; não lê automaticamente um JWT B posterior do singleton durante o envio. Refresh exige o mesmo uid e nova validação da geração; o token nunca é persistido na fila. Um pedido A já enviado pode terminar remotamente sob A, mas a confirmação local aguarda reautenticação A/replay e não publica dados em B. Uma resposta tardia de A não escreve o estado/cache de B. Não confiar em userId capturado por closure com um JWT que entretanto mudou.

Rascunho contém uid, UUID da sessão, treino/versão e cópia necessária dos exercícios/prescrição, séries com valores textuais e estado concluído, ordem, início e tempo decorrido/instante de pausa, atualização e versão do schema. Persistir após alterações significativas com debounce curto controlado; confirmar a última gravação ao marcar série/concluir e ao sair quando possível. O evento de background é complementar: o iOS pode terminar a app sem o executar. Ao retomar, mostrar escolha de continuar/descartar, não concluir automaticamente nem contar horas com app encerrada como treino ativo. A7 fecha o comportamento temporal e os limites; não guardar tokens no rascunho.

Para sessão, rascunho e outbox são um envelope por uid, atualizado sob a mesma secção crítica, para eliminar o intervalo entre apagar o rascunho e criar a pendência. Persistir a pendência e esperar pelo sucesso local **antes** de limpar o estado do ecrã. Se houver erro de armazenamento, manter os dados em memória/ecrã e mostrar falha; não usar o cache best-effort que engole setItem. Após confirmação remota, retirar a operação por ID numa nova escrita serializada; crash antes dessa remoção resulta em replay seguro. Reabertura valida envelope e isola conteúdo corrompido; não transformar erro de leitura/JSON em fila vazia bem-sucedida.

Outbox tipada apenas para complete_session e set/delete_weight, com uid, UUID, schema, payload congelado antes do primeiro envio, estado pendente/a_enviar/erro/conflito, tentativas e próximo retry. Um único processador e mutex partilhado por runtime serializam **todas** as leituras-modificações-escritas e os callbacks de confirmação. No arranque, a_enviar volta a pendente com o mesmo UUID. Retry com backoff limitado/jitter para timeout/429/5xx transitório; 401 pausa até reautenticação da mesma conta; 403/404/422 e conflito exigem ação, sem loop. Verificar `error` Supabase, não só Promise resolvida. Processar a conta autenticada; sem autenticação, nada é enviado.

Limites locais propostos, a fechar A6/A7/A0: até 100 operações pendentes e 1 MiB serializado de outbox por conta, verificados antes de aceitar nova intenção; até 1 MiB de rascunho. Ao atingir limite/falhar armazenamento, conservar o rascunho e indicar que a nova conclusão ainda não ficou guardada; nunca apagar a operação mais antiga para abrir espaço. Pendência com mais de 30 dias fica pausada para revalidar versão/identidade e decisão explícita antes de envio; não é apagada nem ganha UUID novo automaticamente. Nenhum prazo elimina trabalho pendente sem descarte explícito ou eliminação da conta. Retirar uma build exige plano de drenagem/recuperação destas intenções. Não guardar histórico completo no rascunho.

GL-003 mantém, no mesmo namespace por uid, um registo mínimo durável da intenção IA em curso: UUID/tipo/alvo/pedido necessário ao retry, antes do primeiro POST. Não integra IA no processador offline nem chama o modelo automaticamente ao voltar a rede. Retoma explícita conserva a chave; após confirmação remove o pedido bruto/notas duplicadas e guarda só a referência necessária. O registo está sujeito aos mesmos limites/eliminação e não contém tokens. Isto permite recuperar feedback reservado após crash sem inventar outra intenção para a mesma sessão.

AsyncStorage e o runtime atual bastam para a beta se estas provas passarem; não introduzir SQLite/worker de fundo por antecipação. Esta escolha assume um único runtime escritor. Se existir segundo processo/extensão/tarefa de fundo que grave os mesmos dados, o mutex JS deixa de bastar e a implementação tem de rever o armazenamento antes de ativar esse escritor.

Peso: uma mutação em voo por semana. Novas alterações locais nessa semana aguardam o ACK anterior; só então fixam versão esperada/payload da operação seguinte antes do primeiro envio. Não mudar o payload de uma operação já tentada. Outro dispositivo pode ter alterado a versão: conflito preserva valor local e remoto para decisão; não usar relógio do dispositivo para vencer. Tombstone evita que a antiga versão 0 recrie uma semana já eliminada. UI distingue valor pendente e confirmado.

Leitura remota `[]` é autoritativa e substitui a base em cache; depois aplicar apenas o overlay pendente da mesma conta. Falha de rede pode mostrar cache próprio como desatualizado; erro de autorização não é licença para manter dados privados visíveis. TTL é usado para frescura/refresh e o resultado atualizado chega ao consumidor; cache de permissões não autoriza premium/admin offline. Falha remota não produz histórico vazio, zero XP ou treino sem séries como sucesso.

Logout limpa memória e caches derivados privados; guarda rascunhos/pendências por uid de forma inacessível à próxima conta e suspende o processador. O mesmo uid pode recuperá-los ao reautenticar. Descarte exige intenção explícita; não apagar automaticamente trabalho pendente. Eliminação da conta remove estes dados locais e recibos/remotos conforme A6. Tokens nunca passam para a fila. A6/A7 ratificam a mensagem e o controlo de pendências antes de concluir o logout na beta.

## Dependência GL-004 — ledger de pagamentos

A4 fechou a proposta de domínio para pagamentos sandbox; a autorização continua condicionada à ratificação A0/GL-004. O ledger Stripe é **separado** de `private.operation_receipts` IA e da outbox local: identificadores, retenção, estados e recuperação não se misturam. GL-005 reserva apenas integração de migrações, constraints e ACL após o contrato GL-004 estar fechado; A5 não redefine a semântica de billing.

Contrato A4 a refletir quando GL-004/spec estiver disponível: chave de evento inclui `event.id` e ambiente; registo de billing tem estados de processamento/aplicado/erro e deduplicação própria. Reserva/reconciliação por conta/subscrição usa lease e fencing propostos de 120 s antes de consultar Stripe; conclusão antiga com fence obsoleto não altera bindings, subscrição nem projeção `profiles`. Commit aplica evento, binding/subscrição e projeção de direito de forma atómica. `event.created` não é ordem suficiente: reler o estado vigente no fornecedor; cancelamento/deleção de S1 não substitui nem revoga o ponteiro S2 mais recente. Persistir intenção de checkout antes da chamada, usar idempotency key do fornecedor e reconciliar resultado ambíguo; não afirmar atomicidade entre PostgreSQL e Stripe.

As rotinas são service-only, sem escrita cliente de plano/customer. A1 revê ACL/projeção de autoridade; A4 possui handlers, estados e reconciliação; A5 possui migração, unicidades, FKs e prova de rollback/replay. Ledger separado não significa transação única com chamada Stripe. Sem SQL/schema GL-004 ratificado, nomes e constraints físicos de billing ficam por definir. A instalação/upgrade valida os direitos atuais sem os alterar em massa; qualquer reparação segue a decisão A4/A0.

## C-GL005-MIGRACOES-v1 — reprodução sem reset

O histórico local contém baseline, 002, 004, 005 e scripts completos/destrutivos. O extrato live regista `20260630034008 migration-003-fix-schema` e quatro correções ausentes: `20260630053540 fix-exercises-rls`, `20260630053633 fix-missing-rls-policies`, `20260630054147 fix-community-rls-recursion`, `20260630054604 fix-all-community-rls-self-reference`. Estes nomes não fornecem o SQL integral. Não inventar o respetivo conteúdo nem inferir reprodução só por igualdade de nomes.

Durante a implementação, obter uma baseline autorizada de **metadados/DDL**, com checksums e versões do histórico, sem dados de utilizadores. Até lá preparar fixture sintética a partir dos extratos, identificada como incompleta. Um caminho canónico futuro usa migrações ordenadas/imutáveis e separa baseline de instalação vazia dos upgrades suportados. SQL realmente aplicado não é editado retroativamente. Para 004, usar nova migração/caminho corrigido conforme prova de aplicação; não renomear/reutilizar versão live. Retirar o reset destrutivo do caminho de upgrade e documentá-lo apenas para bases descartáveis.

Separar DDL, diagnóstico/backfill e validação final de constraints. Versões iniciais de planos/treinos válidos recebem backfill explícito; não fabricar créditos ou operation IDs de ações antigas. Índices em tabelas existentes dimensionam-se com dados sintéticos representativos; se exigirem CONCURRENTLY, executam fora do bloco transacional com deteção de índice inválido/retry. A decisão depende da dimensão/bloqueio medidos, não de aplicar concurrent a tudo. Grants/RLS/funções de A1 são a referência e não são sobrescritos por um schema completo antigo.

Comparar instalação limpa e upgrade por manifesto normalizado: tabelas/colunas/tipos/defaults/checks/FKs/índices, policies/RLS, proprietários/ACL/default privileges, funções/assinaturas/corpos/search_path, triggers e schemas expostos. Excluir diferenças ambientais justificadas e manter relatório dessas exclusões; comparar apenas colunas não prova equivalência de segurança. Jobs/pagamentos dependentes têm contratos dos respetivos donos. Backup/restauro e aprovação de aplicação pertencem à futura operação, não a esta tarefa.

Rollback funcional conserva migrações aditivas e recibos: desativar o fluxo novo se necessário e manter leituras válidas; correção SQL por migração forward. Não reabrir grants vulneráveis nem devolver o cliente à sequência de inserts parciais. Não apagar dados/versões para fazer passar a comparação.

## Critérios de aceitação e dependências

| ID | Resultado exigido em implementação futura |
|---|---|
| GL005-AC01 | Instalação vazia e upgrade de cada baseline suportada terminam com manifesto de schema/autorização equivalente; SQL sem edição manual, reset ou regressão GL-001. Baseline desconhecida para com diagnóstico. |
| GL005-AC02 | Criar/editar treino com falha injetada em cada escrita conserva estado anterior ou agregado inteiro; versão antiga dá conflito sem apagar associações. |
| GL005-AC03 | Conclusão com falhas antes/depois de cabeçalho, séries, XP e recibo não deixa sessão parcial; retry/duplo toque/timeout após commit dá uma sessão e um crédito. Outra operation key para o mesmo sessao_local_id também não duplica. |
| GL005-AC04 | Ator A não associa sessão/feedback a treino/sessão B, muda dono ou chama wrapper service-only; REST/SDK direto não contorna as garantias. A→B e inexistente não revelam conteúdo. |
| GL005-AC05 | Duas sessões distintas concorrentes da mesma conta preservam ambos os créditos e aplicam histórico pré-sessão serializado; free/premium e reabrir resumo não alteram a regra. xp/nivel cliente negados. |
| GL005-AC06 | A/B no mesmo iPhone: B vazia/com dados/offline nunca mostra peso/meta/badges/rascunho/fila de A; resposta tardia e troca JWT durante envio não contaminam B. |
| GL005-AC07 | Modo avião: rascunho e conclusão/peso pendentes sobrevivem a encerrar/reabrir; retorno à rede confirma uma vez. Falha de armazenamento/limite impede falso guardado sem descartar dados; pendências antigas pausam sem eliminação. Logout preserva pendências para o mesmo uid e nunca as envia sob outro. |
| GL005-AC08 | 100 adds concorrentes preservam 100 intenções; dois processadores não causam perda; crash após sucesso remoto/antes da remoção local apenas repete recibo. JSON corrompido não se torna fila vazia. |
| GL005-AC09 | Peso com set/delete/retry atrasado/dois dispositivos respeita CAS/tombstone; conflito guarda intenção; [] remoto limpa base antiga e overlay próprio continua pendente até ACK. |
| GL005-AC10 | Duas regenerações da mesma versão têm um vencedor; outra dá 409. Falha de IA/DB conserva plano anterior; mês é o reservado mesmo em retry atravessando mês. |
| GL005-AC11 | Importação preserva ordem/prescrição/descanso/origem e contagem; falha em catálogo/junction/recibo reverte tudo. Replay mantém treino_id; UUID novo cria cópia deliberada. |
| GL005-AC12 | Reserva IA concorrente, lease expirada, fence antigo, falha transitória/terminal e commit desconhecido não duplicam domínio nem perdem recibo; replay não chama modelo após commit. Não afirmar exactly-once do fornecedor. |
| GL005-AC13 | Feedback first-write/session bloqueia intenção concorrente antes do modelo; mesma chave repete resultado, outra dá FEEDBACK_JA_SUBMETIDO. Sem upsert de owner ou substituição de feedback confirmado. |
| GL005-AC14 | Envelope local, resultado de erro, logs e recibos seguem privacidade A6; eliminação de conta purga namespace e dados previstos. Retenção/builds/janela de retries documentadas antes de qualquer GC. Ledger billing permanece separado e segue eliminação/retenção ratificadas GL-004/A6. |
| GL005-AC15 | iPhone candidato liga SHA/schema/backend compatíveis e repete treino/forçar encerramento/contas/rede intermitente com dados sintéticos. Prova SQL isolada e execução nativa são evidências distintas. |

Os testes acima estão **planeados, não executados**. Mocks/harnesses antigos reproduzem defeitos e não demonstram transações nem persistência em iOS. A10 revê as provas SQL/contratuais e A9 coordena o binário QA.

Dependências finais: A1 revê ACL/FKs/RLS e wrappers definer da app; A3 consome C-GL005-IA-v1 e mantém o contrato HTTP canónico; A4 fornece ledger/constraints de pagamentos separadamente; A6 controla AuthContext/logout/eliminação; A7 ratifica limites/XP/tempo/UX de conflitos e implementa consumidores; A2 fornece testes/toolchain; A0 decide baseline/calendário/retenção e ordem; A10 valida transversalmente. Os campos/assinaturas novos não são gerados sem estes contratos estarem fechados. O acesso a um ambiente ligado, migrações e distribuição continuam fora da autorização desta entrega.


