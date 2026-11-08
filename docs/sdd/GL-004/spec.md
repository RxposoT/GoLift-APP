# GL-004 — Faturação sandbox vinculada à conta

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **Draft para revisão da coordenação**, apenas planeamento. Responsável: A4 — Billing. Data: 2026-11-08. Base: `552f989b1d55adb22bee154a61d3f0062a8da207`. Destino: beta interna iPhone/TestFlight, com pagamentos exclusivamente sandbox.

## Objetivo e âmbito

Garantir que só a conta proprietária de uma sessão/subscrição pode reconciliar os respetivos direitos ou abrir o portal do seu customer; que nenhuma falha de persistência é anunciada como sucesso; e que duplicados, atrasos e concorrência convergem para o estado e período atuais do fornecedor. Abrange os fluxos Stripe já existentes e a leitura de plano pela app. Não cria preços, produtos, níveis, compras reais, novo fornecedor ou regras comerciais para lançamento público.

Esta entrega escreve somente `spec.md`, `plan.md` e `tasks.md` em GL-004. Não altera produto/código/SQL, não instala ferramentas, não aplica migrações, não chama APIs reais e não publica builds. A implementação futura usa primeiro dublos e BD descartável; um ensaio sandbox ligado exige uma etapa operacional futura explicitamente autorizada. TestFlight e Stripe sandbox são superfícies distintas: este plano não presume uma compra App Store, aprovação da Apple ou elegibilidade comercial por mercado.

## Evidência e dependências

| Fonte local | Problema e efeito a corrigir |
|---|---|
| Relatório geral (fonte reservada da revisão histórica, `00-relatorio-geral.md`), backend (fonte reservada da revisão histórica, `02-backend.md`), BE-01; `payment.service.js:124–139` | `verifySession` aceita uma sessão paga sem comparar o proprietário e grava o customer no perfil do ator. |
| BE-03; `payment.service.js:87–119,131–139` | Resultados Supabase não são inspecionados; erros de escrita recebem sucesso/ACK. |
| BE-04; `payment.service.js:82–115` | Sem ledger; validade calculada por entrega + 30 dias; cancelamento filtra só customer e pode revogar uma subscrição posterior. |
| `payment.service.js:39–55`; `plano.ts:148` | Portal usa apenas `profiles.stripe_customer_id`; o userId enviado pelo cliente não é prova de propriedade. |
| `app/src/services/api/plano.ts:40–55` | Leitura transforma erro em free e tenta escrever `plano='free'` ao expirar; null é tratado como premium ilimitado. |
| `payment.controller.js`, `paymentReturnPage` | Query `status=sucesso` anuncia subscrição ativa sem verificar pagamento/persistência. |
| `database/migration-003-fix-schema.sql:198–206`; metadados reconciliados | `user_subscriptions` existe e tem RLS ativa, mas o modelo local não prova unicidade, vínculo de subscription, ledger ou proteção suficiente. RLS ativa não resolve validações service role. |
| [GL-001](../GL-001/spec.md), C-GL001-PREMIUM-v1 | `plano`, `plano_ativo_ate`, customer e autoridade não são editáveis pelo cliente; nem a despromoção pode vir da app. |
| [GL-003](../GL-003/spec.md), [GL-005](../GL-005/spec.md) | A3 detém contrato HTTP comum; A5 detém baseline, migrações/constraints e implementação transacional. Ledger billing é distinto dos recibos IA/offline. |

Os harnesses existentes reproduzem defeitos com mocks. Não demonstram uma correção nem que o backend implantado execute este commit. A baseline atual e o checkout completo têm de ser reconciliados antes de implementar; não inferir conteúdo de migrações só pelo nome.

## Duas fatias de entrega

**GL-004A — contenção P0 e correção compatível:** preservar rotas, bodies tolerados e respostas de sucesso atuais; validar o ator e a cadeia existente antes de qualquer escrita/portal, tratar erros/zero linhas e eliminar a escrita cliente de plano. Conservar o envelope legado `{erro:...}` nas recusas. Uma ligação legada sem prova confiável, estado/período indisponível ou falta de mecanismo seguro de atualização é recusada; não se inventa uma ligação a partir de email/customer editável. Se ainda não houver base durável para atualizar sem corrida, manter checkout/reconciliação mutante/portal indisponíveis conforme o risco, com falha explícita e webhook recuperável. Pode fechar o caminho de exploração antes do ledger completo; **não fecha BE-04 nem autoriza abrir billing na beta**.

**GL-004B — integridade e evolução do contrato:** depois de ratificação A0/A1/A3/A5, introduzir binding durável, intenção de checkout, ledger de eventos e reconciliação serializada/fenced com transação atómica. Formalizar erros/estados e migrar consumidores. Não atrasar a contenção A por novos UUIDs/OpenAPI/DDL. A beta só disponibiliza os fluxos de billing cujos critérios B estejam demonstrados; caso contrário, ficam explicitamente desativados, sem fallback vulnerável.

Fonte HTTP canónica futura: **`contracts/http/openapi.yaml`**, a criar na evolução GL-003B e a ampliar com estas operações por A3/A4. Este ficheiro ainda não é criado nesta entrega. As tabelas seguintes são propostas de semântica, não uma segunda fonte normativa de DTOs. Tipos, validadores, mocks e testes contratuais derivam desse único ficheiro.

## C-GL004-IDENTIDADE-v1 — cadeia e ambiente

1. O ator das rotas autenticadas é exclusivamente `req.user.id`, obtido do JWT verificado. `userId`, plano, customer, subscription, price, URLs de retorno e flags de ambiente recebidos do cliente nunca autorizam nada. Não existe bypass administrativo implícito.
2. O ambiente de billing é fixado pelo servidor. A beta usa conta/configuração Stripe de teste e backend/BD de teste isolados de direitos reais; `livemode=false` tem de coincidir em evento e objetos recuperados. Misturar identificadores test/live é recusado. Um prefixo de chave ou ID, isoladamente, não prova isolamento. O servidor beta recusa configuração live em vez de aceitar uma flag do pedido.
3. Criar uma intenção durável de checkout vinculada ao ator antes da chamada externa. Associar intenção, sessão, customer e subscription apenas após recuperar e validar os objetos do fornecedor: modo subscription, preço de teste já configurado/allowlist, customer correspondente e identificadores consistentes. Metadata de sessão/subscrição gerada pelo servidor inclui referência à intenção/conta; a intenção persistida e a cadeia recuperada são obrigatórias em B. Email nunca resolve identidade.
4. IDs do fornecedor são strings opacas. Um customer por conta/ambiente e um dono por customer; uma sessão e uma subscription não mudam de conta. Uma conta pode conservar histórico de várias subscriptions do mesmo customer, mas no máximo uma é a subscription vigente para a projeção. Sessão antiga não altera esse ponteiro. Duas subscriptions elegíveis em simultâneo são conflito a reconciliar, sem escolher arbitrariamente pela data de chegada ou pelo maior ID.
5. `verify-session` compara o dono da sessão com o ator **antes de qualquer escrita**; sessão alheia dá 403 genérico, sem devolver customer/subscription/conta. Sessão desconhecida no fornecedor dá 404 genérico. Body inválido dá 422 em B. Nenhuma dessas falhas cria binding, concede direitos ou abre portal. Uma sessão própria antiga pode desencadear leitura do estado vigente da própria conta; nunca ativa a sua subscription cancelada nem substitui a atual.
6. Um `profiles.stripe_customer_id` legado, potencialmente alterável pelo cliente antes de GL-001, não é fonte suficiente para o portal ou um backfill. Inventariar só em ambiente autorizado, validar com evidência do servidor/fornecedor e classificar válidos/órfãos/ambíguos. Ambiguidade não é corrigida por transferência automática entre contas. Perfis sem linha esperada dão erro explícito.

### Intenção de checkout e fronteira externa

Checkout B recebe um UUID estável de intenção por header `Idempotency-Key`, definido no OpenAPI; A tolera o body legado sem confiar nele. Persistir a intenção do ator com chave/hash/estado, usar chaves de idempotência do fornecedor estáveis e distintas por criação de customer e sessão, e devolver URL/ID apenas após persistir a associação. Impedir dois checkouts abertos concorrentes ou nova compra enquanto existe subscription elegível; repetir a mesma intenção recupera a sessão existente, se ainda utilizável. Uma sessão expirada exige intenção nova explícita após confirmação do estado anterior.

Não há transação distribuída entre Stripe e BD. Crash depois da criação externa/antes do commit retoma a mesma intenção e reconcilia o objeto, sem gerar outra sessão por mero timeout. Depois da janela de idempotência suportada pelo fornecedor, uma intenção de resultado desconhecido exige reconciliação comprovada; não repetir criação às cegas com nova chave. Webhook precoce usa a intenção persistida e metadata do servidor para completar o binding sob as mesmas constraints. Intenção ausente/inconsistente nunca é criada a partir do evento de uma conta arbitrária.

## C-GL004-DIREITOS-v1 — estado, período e apresentação

`profiles.plano`/`plano_ativo_ate` são uma projeção protegida para compatibilidade, escrita por A4 na mesma transação que o estado billing. Não são um segundo ledger. Uma subscription apenas paga no passado não concede premium atual. Datas são instantes UTC derivados do período relevante no fornecedor; o timezone do iPhone e o instante de entrega não alteram o período.

Proposta conservadora para ratificação A0: premium exige subscription vigente `active`, preço de teste permitido e período corrente com pagamento liquidado comprovado para essa mesma subscription. O intervalo de direito é a interseção consistente do período pago elegível com o período corrente do item/subscrição que o adaptador validou; não extrair o fim de uma linha de imposto/prorrata/item não elegível. Não usar `max` de períodos históricos. Objetos de API com formato/versão desconhecidos ou múltiplos itens ambíguos são recusados, sem substituir campos em falta por now+30 dias.

| Estado reconciliado | Direito efetivo proposto |
|---|---|
| `active` + período pago válido, início ≤ relógio servidor < fim | `pago` até esse fim, que tem de ser finito e não null. |
| `active` + cancelamento agendado no fim do período | Mantém o direito comprovado até ao fim; agendamento não equivale a cancelamento já efetivo. |
| `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused`, `past_due`, `trialing` ou estado não suportado | Sem novo direito premium; não introduzir trial ou tolerância comercial nesta correção. A0 ratifica a política antes de B. |
| Pagamento pendente ou estado próprio ainda não reconciliado | Sem concessão nova; resposta pendente, nunca «subscrição ativa». |
| Falha do fornecedor/BD/validação de contexto | Erro/indisponível; não transformar em confirmação, free persistido ou novo prazo. |

Cancelamento imediato confirmado retira acesso segundo o estado atual; cancelamento histórico de S1 não revoga S2 vigente. Um pagamento atrasado de fatura antiga não reativa uma subscription já cancelada. Evento de renovação elegível atualiza **plano e prazo** coerentemente após validação, não apenas a data.

Autorizações premium no backend/RPC usam o mesmo predicado protegido e o relógio do servidor/BD; em todos os serviços IA de A3 e seleções de jobs relevantes, `plano='pago'` com fim null/inválido/expirado não autoriza. A1 protege as colunas, A5 revalida o direito no commit quando aplicável. Direitos sandbox só valem no ambiente beta isolado. A leitura da app deixa de fazer UPDATE de `plano`; erro de leitura é «não foi possível confirmar», não uma alteração de plano. Cache/relógio local servem a apresentação e não autorizam capacidades privadas offline. A6 invalida respostas antigas na troca de conta.

## C-GL004-LEDGER-v1 — replay, ordem e persistência

O contrato funcional e a máquina de estados billing vivem nesta secção; A5 implementa modelo físico, migrações e constraints, sem copiar a máquina dos recibos IA. Nomes de tabelas são propostas a adaptar à baseline.

| Recurso interno | Invariantes mínimos |
|---|---|
| Binding de conta/customer | UNIQUE(ambiente, user_id) e UNIQUE(ambiente, customer_id); proprietário imutável; referência à intenção/evidência validada. |
| Intenção/sessão | UNIQUE(ambiente, user_id, chave_intencao) e UNIQUE(ambiente, session_id) quando atribuído; hash canónico, estado/IDs e resultado de criação durável. |
| Subscriptions | UNIQUE(ambiente, subscription_id), FK para o mesmo binding/customer/conta; estado, período validado, instante de reconciliação e referência de subscription vigente sob exclusão por conta. |
| Ledger de eventos | UNIQUE(ambiente, conta_fornecedor, event_id); tipo, IDs mínimos, hash do envelope assinado, estado/resultado técnico e tentativas. Mesmo ID com conteúdo divergente é incidente, sem reaplicar. Não guardar body integral por defeito. |
| Reserva de reconciliação da conta | Uma lease/fence por conta/ambiente, versão da projeção e indicador de trabalho pendente; relógio BD. Verify e webhook partilham a mesma exclusão. |

Estados do evento: `pending` (recebido duravelmente), `processing` (associado a lease/fence válido), `applied`, `ignored` (tipo sem efeito ou evento histórico reconciliado sem mudança) e `quarantined` (contradição terminal com diagnóstico durável e alerta). Falha transitória mantém trabalho recuperável com código/tentativas; não avança para terminal. Lease proposta **120 s**, sujeita a confirmação A0/operação. Retoma incrementa fence monotónico; o fence antigo nunca confirma nem liberta o novo. Não se mantém uma transação SQL aberta durante chamada externa.

Percurso de processamento:

1. Obter raw body pela rota específica antes do parser JSON; verificar assinatura com secret de teste correto e tolerância temporal do SDK, limites de tamanho e ambiente antes de confiar no evento. Não devolver mensagens do SDK/secret no erro. Anónimo só alcança webhook/retorno; assinatura inválida dá 400 e zero mutação de billing.
2. Registar evento único e resolver a conta por binding/intenção comprovados. Um evento não tratado pode terminar `ignored` com recibo mínimo durável. Referência necessária ainda ausente é recuperável; contradição de identidade é quarantined apenas se puder ser registada de forma durável, sem reatribuir dados ou conceder premium.
3. Adquirir lease por conta **antes de consultar o estado atual no fornecedor**, para serializar também `verify-session`. Duplicados terminais devolvem o ACK guardado sem alterar períodos. Concorrente em curso recebe falha recuperável, nunca sucesso só por existir uma linha `processing`.
4. Recuperar a subscription vigente e os objetos necessários da mesma cadeia; validar estado/período pago. Evento é um sinal para reconciliar, não um comando para atribuir now+30 dias. Não usar apenas `event.created`, que não fornece uma ordem total, nem payload antigo como estado atual. Um evento de S1 não move o ponteiro S2; se houver nova intenção S2, a mudança exige validar essa intenção e a elegibilidade atual, sem duas subscriptions efetivas.
5. Num único commit, revalidar binding, subscription vigente, lease/fence e versão; gravar snapshot normalizado de billing, projeção `profiles` e resultado terminal do evento. Supabase `error`, zero linhas inesperadas, constraint ou commit desconhecido impedem sucesso prematuro. Falha reverte o conjunto; não gravar `applied` numa chamada separada da concessão/revogação.
6. Se expirar a lease ou mudar a versão antes do commit, descartar a proposta antiga e reconsultar sob fence novo. Uma entrega que chegue durante uma reconciliação fica pendente/assinala nova necessidade de reconciliação; não a perder ao limpar esse indicador. Após commit incerto, consultar/repetir a mesma operação; nunca apagar o recibo para desbloquear.

ACK webhook: 2xx apenas depois de `applied`/`ignored`/`quarantined` duráveis; transiente/DB indisponível/processing/commit ainda desconhecido dá 503 com retry controlado. Quarantine só evita replay infinito se existir alerta e percurso de reprocessamento autorizado; não conta como pagamento bem aplicado. Se falhar persistir o terminal, devolver não 2xx. A beta não depende de um novo broker: retries do fornecedor e reconciliação explícita da própria conta bastam se o runbook demonstrar recuperação dos pendentes/quarantines; caso contrário, billing fica fechado.

Convergência prometida: depois de entregas/retries relevantes e reconciliação bem-sucedida, a projeção coincide com o estado corrente recuperado; o replay não prolonga o prazo. Não há garantia de conhecimento instantâneo de uma mudança ainda não entregue pelo fornecedor. Enquanto este está indisponível, não se concede nem prolonga acesso; o direito já confirmado termina no prazo protegido e não vira ilimitado. Retenção cobre builds beta e janela de redelivery/reconciliação; não há GC de ledger/intenção nesta beta até política A0/A6 explícita. Logs sem corpos, URLs do portal/checkout, emails, tokens ou dados de pagamento.

## C-GL004-PORTAL-v1 — gestão só do próprio customer

Portal autentica o ator, resolve um binding comprovado e não ambíguo no ambiente beta, valida que o customer recuperado corresponde à conta e apenas depois chama o fornecedor. Ignora o `userId` legado; B rejeita campos de autoridade. Não procura por email, não aceita customer do body e não confia isoladamente no campo de perfil. Falha de leitura/ambiguidade não faz chamada de criação do portal.

O dono de um customer comprovado pode gerir o seu histórico mesmo quando a subscription está cancelada; não exigir premium ativo como prova de propriedade. Customer inexistente/eliminado ou binding ausente dá erro explícito sem URL. Retorno é configurado no servidor/allowlist e o deep link existente tem de ser ensaiado no iPhone com A6/A9; não aceitar URL livre nem inventar um domínio neste planeamento. Não persistir/logar URLs temporários nem tratá-los como direitos; logout/troca de conta invalida o resultado na app. Nenhum portal real é aberto nesta entrega.

## Proposta HTTP GL-004B

Mantêm-se caminhos atuais. OpenAPI comum define objetos fechados, IDs opacos, nulabilidade, limites e envelope `Falha` de GL-003; esta tabela descreve os trabalhos dos consumidores. A4/A3 fixam os detalhes antes de implementar.

| Método/caminho | Pedido B | Semântica de resposta |
|---|---|---|
| POST `/api/stripe/checkout-session` | JWT, body vazio, `Idempotency-Key` UUID | 200 com `sucesso:true`, URL temporária e `sessionId` apenas depois da intenção/binding persistidos; checkout não concede premium. |
| POST `/api/stripe/verify-session` | JWT, `{sessionId:string}` | 200: `sucesso` indica direito premium **confirmado** após commit; `plano` free/pago, `ativo_ate` UTC ou null, `estado` confirmado/pendente. Pendência de pagamento própria tem `sucesso:false`; erro de reconciliação é não 2xx. Não expor IDs customer/subscription. |
| POST `/api/stripe/portal` | JWT, body vazio | 200 com URL temporária apenas do customer comprovado. Sem URL quando binding/fornecedor indisponível. |
| POST `/api/stripe/webhook` | Raw body e `Stripe-Signature`, sem Bearer | 200 `{received:true}` só após resultado terminal durável; 400 assinatura inválida; 503 recuperável. Não se aplica envelope de sucesso do cliente ao ACK. |
| GET `/api/stripe/payment-return` | Público; parâmetros não autorizam direitos | HTML de retorno neutro: pagamento/subscrição são confirmados ao voltar à app. Não anuncia ativação nem faz mutações por query string. |

Erros B: 401 `NAO_AUTENTICADO`; 403 `ACESSO_NEGADO` para sessão alheia sem detalhes; 404 `SESSAO_NAO_ENCONTRADA`; 409 `VINCULO_NAO_CONFIRMADO`, `SUBSCRICAO_EM_CONFLITO`, `CHECKOUT_EM_CURSO`, `CHAVE_REUTILIZADA` ou `RECONCILIACAO_EM_CURSO`; 422 `VALIDACAO`; 429 limite por ator com Retry-After; 503 `PERSISTENCIA_INDISPONIVEL`/`BILLING_INDISPONIVEL`; 500 `ERRO_INTERNO` para falha não transitória. Recuperabilidade é por código e contexto, sem retry cego de 403/409 terminal. Nenhuma mensagem expõe outra conta ou internals SQL/SDK.

`plano.ts` partilha ficheiro com IA: A0 reserva um autor de integração e A3/A4 entregam patches por bloco. A migração B pode retirar `userId` do body e adicionar header/estado mantendo os caminhos; isso é evolução contratual, não pré-requisito do fix A. Tipos e fixtures novos derivam do OpenAPI, sem interfaces manuais concorrentes. A7 trata estados confirmado/pendente/erro; conclusão do browser/query/analytics nunca constitui prova de compra. Analytics de conclusão só após confirmação, com minimização A6.

## Critérios de aceitação

| ID | Resultado a demonstrar na implementação futura |
|---|---|
| GL004-AC01 | JWT A com sessão paga B dá 403 sem escrita/binding/portal/dados B; sem JWT dá 401; metadata/body/userId alterados não concedem autoridade. |
| GL004-AC02 | Sessão própria válida só atualiza A após cadeia completa validada; falta de customer/subscription/intenção, modo/preço/ambiente errados e vínculo ambíguo falham sem concessão. |
| GL004-AC03 | Erro em cada leitura/escrita, zero linhas esperadas e timeout de commit não produzem sucesso de verificação nem ACK de aplicação antes da confirmação durável; retry após recuperação aplica uma vez. |
| GL004-AC04 | Mesmo event.id repetido em horas/dias diferentes e eventos distintos da mesma renovação não prolongam período nem duplicam efeito; hash divergente é isolado e sinalizado. |
| GL004-AC05 | Permutações checkout/invoice/update/deleted, fatura antiga após cancelamento e deleted S1 após ativação S2 convergem para o snapshot atual; S2 e respetivo customer/dono não mudam por evento S1. |
| GL004-AC06 | Duas reconciliações/verify+webhook, lease expirada/worker lento, fence antigo e crash antes/depois de commit não deixam projeção/ledger parciais nem sobrescrevem snapshot novo. Entrega chegada durante processamento não se perde. |
| GL004-AC07 | Validade coincide com período elegível validado, incluindo meses de 28/29/30/31 dias, limites exatos, UTC/DST e item/prorrata adversos; nunca now+30. Cancelamento no fim mantém até ao fim; null/estado não suportado não autoriza. |
| GL004-AC08 | Portal A só cria URL do customer A comprovado; perfil adulterado/legado sem prova, binding duplicado, A→B e erro DB/fornecedor não criam portal. Cancelado próprio com customer válido continua gerível. |
| GL004-AC09 | Assinatura inválida, JSON previamente transformado, segredo/ambiente incorretos e body excessivo não mutam billing; tipo ignorado e quarantine só recebem 2xx após recibo durável. Não vazar erro SDK. |
| GL004-AC10 | Checkout repetido/duplo toque/timeout externo usa intenção estável e recupera a mesma sessão; crash entre criação externa e BD e webhook precoce não criam segundo customer/checkout/direito. Resultado desconhecido após janela do fornecedor não repete criação cega. |
| GL004-AC11 | Cliente não emite UPDATE plano nem envia autoridade nova; REST/SDK direto não alteram plano/prazo/customer/ledger e anon/authenticated não executam wrappers internos; grants/proteções GL-001 passam em instalação limpa/upgrade. |
| GL004-AC12 | Browser fechado, retorno forjado `status=sucesso`, pagamento pendente e erro de consulta não anunciam premium confirmado; respostas tardias A→B não aparecem em B. Erro de leitura não persiste free. |
| GL004-AC13 | Provider/consumer validam requests/respostas e erros no OpenAPI comum; builds/backend compatíveis; `plano.ts` mantém contratos IA de A3 e predicado premium único em serviços/RPC/jobs. |
| GL004-AC14 | Binário QA interno no iPhone usa backend/BD de teste e chaves de teste, duas contas sintéticas, retorno/portal sandbox autorizados e rede interrompida; URL temporária não vaza em logs/analytics. SHA/schema/configuração ligados na evidência. |
| GL004-AC15 | Pendentes, falhas e quarantines têm diagnóstico, alerta e reconciliação ensaiados com dados sintéticos; rollback desativa mutações sem perder ledger/bindings ou reabrir grants. Política de retenção/eliminação A6 documentada. |

Todos os testes acima estão **planeados, não executados**. Em A, AC01/03/08/11/12 são demonstrados na superfície compatível, incluindo recusa explícita quando falta prova; os restantes, atomicidade SQL e abertura de billing continuam em B. Desativar não equivale a provar o fluxo feliz completo.

## Decisões e donos

| Decisão | Dono e condição de fecho |
|---|---|
| Isolamento beta/teste, disponibilidade dos fluxos e política active/pago sem trial/grace | A0 com A4; ratificar antes de implementar B, sem novo pricing. |
| Modelo físico, migração, FK/UNIQUE, lease/fence/commit e transporte RPC | A5 com A4; wrappers Data API service-only alinhados A1, helpers/tabelas privados. Não presumir que `.rpc()` alcança schema não exposto. |
| ACL/perfil premium protegido | A1, C-GL001-PREMIUM-v1; nenhum cliente pode alterar plano, nem para free. |
| HTTP canónico e integração do ficheiro `plano.ts` | A3/A4 com reserva A0; um OpenAPI e um autor por bloco/merge. |
| Versão SDK/API, extrator de período pago e eventos suportados | A4 com A2; verificar na implementação contra versões fixadas/documentação oficial, sem supor campo pai `current_period_end` existente em todas as versões. |
| Retenção, conta eliminada, logs e troca de identidade | A6/A0; binding eliminado não é recriado por webhook tardio; usar tombstone mínimo conforme política e sem histórico financeiro inventado. |
| Estados UI/retorno e ensaio iPhone/observabilidade | A7/A9/A10; sem reescrever o design nesta unidade. |

Nenhuma decisão pendente autoriza APIs, instalações, migrações, deploys ou compras. Antes de B, A0 fecha os pontos acima e regista o contrato comum; A10 revê independentemente as provas.
