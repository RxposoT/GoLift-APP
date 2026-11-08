# GL-003 — Isolamento e integridade dos fluxos de IA existentes

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **Draft — proposta para revisão**, apenas planeamento. Data: 2026-11-08. Base: `552f989b1d55adb22bee154a61d3f0062a8da207`. Destino: beta interna em iPhone, com pagamentos em sandbox.

## Objetivo e âmbito

Impedir que feedback, adaptação, relatórios ou planos usem objetos de outra conta; rejeitar pedidos e respostas da IA fora do contrato; tornar regeneração e importação recuperáveis sem perda nem duplicação. Abrange exclusivamente os endpoints de IA já existentes. O Coach mantém sugestões gerais e não passa a analisar histórico nem a chamar um novo modelo.

Ficam fora: Stripe/GL-004, alterações de prontidão, novos serviços de IA, histórico visível de versões, subscrições reais, deploys, chamadas a fornecedores e implementação de migrações nesta fase. A autorização de papéis/direitos é definida em GL-001. As transações, constraints, migrações e armazenamento de idempotência pertencem a GL-005/A5.

## Duas fatias de entrega

**GL-003A — P0, contrato atual preservado:** corrigir imediatamente a verificação de proprietário de sessão/treino e dos contextos associados antes de qualquer leitura detalhada, escrita ou modelo; tratar erros de BD e ausência inesperada; provar os casos negativos A/B. Manter caminhos, bodies e respostas de sucesso atuais. Validar apenas a estrutura/ID mínima necessária para proteger os fluxos, sem aguardar o catálogo completo de schemas, novos UUIDs, versões ou a máquina transacional A5. Usar os mecanismos de autenticação existentes corrigidos segundo GL-001; não esperar por funcionalidades de dados não relacionadas. Esta fatia fecha o caminho vulnerável do backend, mas não declara resolvida a atomicidade nem o acesso REST direto de GL-001/GL-005.

**GL-003B — integridade e evolução do contrato:** após ratificação, implementar a validação completa, metadados de versão, idempotência, substituição/importação atómicas e cliente correspondente. As tabelas HTTP/RPC, DTOs, limites e calendário abaixo são **Draft desta fatia**, não requisitos prévios para corrigir o P0. GL-003A pode ser verificada/entregue independentemente de A5; GL-003B continua bloqueada nas suas transações até A5 estar pronto.

Fonte canónica HTTP futura: **`contracts/http/openapi.yaml`**, a criar de forma coordenada em GL-003B/GL-004 após ratificação dos contratos. Tipos, validadores e fixtures derivam desse ficheiro; regras semânticas não expressáveis diretamente devem estar identificadas nesse contrato e cobertas por provas, sem inventar DTOs paralelos ou OpenAPI por equipa. GL-004 acrescentará os endpoints Stripe/envelope comum ao mesmo ficheiro; Stripe e pagamento continuam fora do âmbito comportamental GL-003. O bloco TypeScript deste documento é apenas uma ilustração Draft e não normativa. Esse ficheiro ainda não existe nesta entrega documental e não é criado fora do âmbito autorizado.

## Evidência e reconciliação

| Fonte local | Facto usado nesta proposta |
|---|---|
| `artefactos reservados da revisão/02-backend.md`, BE-02; `backend/src/services/ai/feedback.service.js`; `adapt.service.js` | Service role lê sessão/treino só por ID; feedback escreve antes da verificação de propriedade. Comparar o userId do URL não protege os IDs do body. |
| BE-05; `plan.service.js`; reconciliação de 00/02/03 | `UNIQUE(user_id,mes)` e `arquivado` existem no catálogo consultado. Arquivar não liberta a chave mensal; arquivar antes do modelo perde o plano atual em caso de falha. |
| BE-06; `plan.service.js`; `database/supabase-schema.sql` | A importação cria um treino antes das associações e ignora erros; a junction atual não armazena a prescrição. |
| `backend/src/services/gemini.service.js` | JSON.parse valida sintaxe, não o esquema do resultado. |
| `report.service.js`; `app/src/services/api/plano.ts` | O cliente depende dos nomes atuais; o relatório apenas envia nomes/durações e não tem evidência para afirmar progressão de cargas/equilíbrio muscular. |
| `artefactos reservados da revisão/03-dados.md`, reconciliação D02/D03/D09 | RLS de IA está ativa no serviço consultado e `arquivado` já existe. Não reclassificar esses pontos como falhas atuais confirmadas. Persistem drift e riscos dos scripts versionados. |

Nenhuma conclusão implica que o backend implantado corresponda ao commit. Harnesses do review confirmam o comportamento defeituoso, não a aceitação de uma correção.

## Regras de autorização e ordem de execução

1. Autenticar o JWT no servidor segundo GL-001. O ator é exclusivamente `req.user.id`; nunca vem do body ou de metadata editável. Validar tipos/limites antes de executar lógica de negócio. O parâmetro legado `:userId` deve ser UUID e igual ao ator; diferença dá 403.
2. Verificar o proprietário por consulta mínima filtrada por **ID e user_id**. Para sessão, confirmar também que o treino associado pertence ao ator; relações/filhos têm de pertencer a esse agregado. Um objeto alheio e um inexistente dão a mesma resposta 404. Não consultar nomes, séries ou notas do objeto antes deste passo. Para plano, usar `id + user_id + versao`.
3. Verificar direitos premium na fonte protegida de GL-001 antes de qualquer geração. Perfil/direitos indisponíveis são erro de dependência, nunca uma conta free inferida silenciosamente. Em adaptação free, confirmar primeiro propriedade e devolver a resposta geral já suportada, sem modelo. Restantes fluxos premium dão 403 `PLANO_NECESSARIO`.
4. Só depois carregar o contexto mínimo da própria conta, reservar uma operação quando aplicável e chamar o modelo. Filtrar também joins e dados históricos; uma FK simples para uma sessão não garante igualdade entre os dois user_id. Falha numa leitura necessária não se converte em «sem dados».
5. Validar o resultado do modelo antes de o apresentar ou persistir. Revalidar propriedade, versão e direito aplicável na transação final. Não manter uma transação PostgreSQL aberta durante uma chamada ao modelo.

A reserva de uma operação é uma escrita: também só ocorre depois de autorizar os objetos. Em pedidos alheios/inválidos: zero mutações e zero chamadas ao modelo. Não há bypass administrativo implícito nestas rotas.

## Contrato HTTP futuro — Draft GL-003B

Manter os caminhos existentes na beta para limitar a migração do cliente. São propostas de alteração do contrato, ainda não implementadas. Todos usam JSON e Bearer JWT; os GET não aceitam body nem parâmetros de proprietário alternativos. Não criar variantes `/me` nesta entrega.

| Método e caminho | Pedido | Resposta 200 |
|---|---|---|
| GET `/api/ai/plan/:userId` | Sem body | `PlanoResposta`, apenas mês atual e linha ativa; ausência legítima tem `plano:null`, `plano_id:null`, `versao:null`, `pode_gerar:true`. |
| POST `/api/ai/plan/:userId/generate` | `GerarPedido` | `PlanoResposta` confirmado pela BD. `versao_esperada:null` significa criar se ainda não existir; regenerar exige a versão lida. |
| POST `/api/ai/plan/:userId/import-day` | `ImportarPedido` | `ImportarResposta` após commit integral. Não aceita `exercicios`, `foco` ou `dia` livres. |
| POST `/api/ai/feedback/:userId` | `FeedbackPedido` | `FeedbackResposta` apenas após persistir feedback e resultado da operação. |
| POST `/api/ai/adapt/:userId` | `AdaptarPedido` | `AdaptarResposta`, sugestão transitória; não altera automaticamente o treino. |
| GET `/api/ai/report/:userId` | Sem body | `RelatorioResposta`; cache só do ator/semana e sujeito à mesma validação que uma resposta nova. |

### Ilustração TypeScript — Draft não normativa

Este bloco ilustra a proposta, sem constituir uma segunda fonte de schemas. Após ratificação, prevalece `contracts/http/openapi.yaml`; tipos, validadores e fixtures são derivados desse contrato. As marcas de intervalo abaixo indicam refinamentos de runtime, não coerções TypeScript. Não manter cópias manuais paralelas nos mocks.

```ts
type Id = number; // inteiro positivo, Number.isSafeInteger; rejeitar IDs maiores
type UUID = string; // UUID válido
type Versao = number; // inteiro >= 1
type Score = 1 | 2 | 3 | 4 | 5;
type Objetivo = 'musculo' | 'forca' | 'peso' | 'atividade';
type Target = 'Peito' | 'Costas' | 'Ombros' | 'Braços' | 'Pernas' | 'Glúteos' | 'Core';
type Zona = 'cabeca' | 'ombro_e' | 'ombro_d' | 'braco_e' | 'braco_d'
  | 'peito' | 'costas_sup' | 'lombar' | 'abdominais' | 'gluteos'
  | 'quadriceps_e' | 'quadriceps_d' | 'isquiotibiais_e' | 'isquiotibiais_d'
  | 'joelho_e' | 'joelho_d' | 'gemeos_e' | 'gemeos_d';
type ExercicioPlano = {
  nome: string; series: number; repeticoes: string; observacao?: string;
};
type DiaPlano = { dia: string; foco: string; exercicios: ExercicioPlano[] };
type Plano = { descricao: string; split: DiaPlano[] };
type GerarPedido = {
  operacao_id: UUID; versao_esperada: Versao | null;
  diasPorSemana: 3 | 4 | 5 | 6 | 7; tempoTreino: 30 | 45 | 60 | 90;
  objetivo: Objetivo; targets: Target[]; condicoes: string;
  descansoEntreSeriesSegundos: number;
};
type PlanoResposta = {
  sucesso: true; plano: Plano | null; plano_id: Id | null; versao: Versao | null;
  mes: string; criado_em: string | null; atualizado_em: string | null;
  descanso_segundos: number; pode_gerar: boolean;
};
type ImportarPedido = {
  operacao_id: UUID; plano_id: Id; versao: Versao; dia_indice: number;
};
type ImportarResposta = {
  sucesso: true; operacao_id: UUID; id_treino: Id; nome: string;
  plano_id: Id; versao: Versao; dia_indice: number; exercicios_persistidos: number;
};
type FeedbackPedido = {
  operacao_id: UUID; session_id: Id; sentir_score: Score | null;
  dor_zones: Zona[]; dor_intensidade: Score | null;
  energia_treino: Score | null; notas?: string;
};
type FeedbackModelo = {
  mensagem: string; sugestao: string | null; feedback_dor: string | null;
  requer_atencao: boolean;
};
type FeedbackResposta = FeedbackModelo & {
  sucesso: true; persistido: true; origem: 'ia' | 'generica';
  operacao_id: UUID;
};
type AdaptarPedido = { workout_id: Id };
type AdaptacaoModelo = {
  adaptado: boolean; nivel_adaptacao: 'leve' | 'moderada' | 'day_off' | 'nenhuma';
  motivo: string | null;
  modificacoes: { exercicio: string; alteracao: string; motivo: string }[];
  aquecimento_extra: string | null;
};
type AdaptarResposta = AdaptacaoModelo & {
  sucesso: true; origem: 'ia' | 'generica';
};
type Relatorio = {
  avaliacao: string; equilibrio: string; progressao: string; descanso: string;
  melhorias: string[];
};
type RelatorioResposta = {
  sucesso: true; relatorio: Relatorio; semana_inicio: string;
  cached: boolean; origem: 'ia' | 'generica';
};
type Falha = {
  sucesso: false; erro: string; codigo: string; request_id: UUID;
  recuperavel: boolean; campos?: { caminho: string; codigo: string }[];
};
```

### Validação de runtime, limites e calendário — Draft

Objetos fechados: rejeitar propriedades desconhecidas, incluindo `user_id`, `owner`, `status`, `sucesso` e campos internos. Sem coerção de strings para números, arrays para strings ou null para zero. JSON malformado dá 400; media type errado, 415; body acima de 32 KiB, 413. Timestamps de resposta são ISO 8601 UTC; `mes` é `YYYY-MM`; `semana_inicio` é `YYYY-MM-DD`. Proposta de calendário da beta: `Europe/Lisbon`, calculado uma vez no início da operação; não depender do timezone do host. A decisão de calendário exige ratificação do coordenador.

| Campos | Refinamento canónico |
|---|---|
| Strings | Unicode normalizado NFC e trim; contagem em pontos de código. Rejeitar controlos não textuais; não executar/incluir conteúdo como instrução de sistema. |
| `targets`, `dor_zones` | Valores dos enums, sem duplicados; máximos iguais à cardinalidade dos respetivos enums. |
| `condicoes`, `notas` | Até 1000 caracteres; vazio permitido. Notas opcionais passam a vazio canónico para o hash. |
| `descansoEntreSeriesSegundos` | Inteiro 15–300; não substituir zero silenciosamente pelo default. |
| Feedback e dor | Scores são null ou 1–5. Sem zonas exige intensidade null; com zonas exige intensidade 1–5. Não usar 0, que contraria o CHECK atual. Sessão tem de estar concluída. |
| Plano | `descricao` 1–1000; split com 3–7 dias e cardinalidade igual a `diasPorSemana` na geração; dias distintos, `dia`/`foco` 1–80; 1–15 exercícios por dia. |
| Exercício | `nome` 1–120; `series` inteiro 1–10; `repeticoes` texto 1–40; `observacao` ausente ou até 300. Sem nomes duplicados no mesmo dia após trim/casefold, por compatibilidade com a junction atual. A prescrição textual não é convertida em séries executadas. |
| `dia_indice` | Inteiro com base zero dentro do split da versão persistida. |
| Respostas modelo | Até 64 KiB; nenhum wrapper alternativo `plano`/`relatorio` ou campos extra. Strings de feedback/adaptação/relatório até 1000, não vazias salvo nullable; melhorias 1–5 itens; modificações 0–15 e só exercícios do treino autorizado. |
| Coerência adaptação | `adaptado:false` exige nível `nenhuma` e modificações vazias; adaptação true exige motivo não vazio e nível diferente de `nenhuma`; aquecimento pode ser null. Free mantém `motivo:'plano_free'`. |

Os limites são decisões propostas para a beta, não funcionalidades já existentes. A lista Zona reproduz os IDs do PainBodyMap atual; a futura implementação partilha uma enumeração, não importa um componente de UI no backend. Conteúdo inválido do modelo/cache nunca é guardado/apresentado como válido. Guardar uma versão de esquema nos dados de IA para validar caches antigos; registos inválidos preservam-se para diagnóstico restrito e originam erro explícito.

### Erros e degradação

| HTTP | Código | Efeito/recuperação |
|---|---|---|
| 400 / 413 / 415 / 422 | `JSON_INVALIDO` / `PEDIDO_DEMASIADO_GRANDE` / `TIPO_NAO_SUPORTADO` / `VALIDACAO` | Nenhuma escrita ou modelo; 422 inclui caminhos/códigos, sem repetir notas privadas. |
| 401 | `NAO_AUTENTICADO` | Sem contexto privado; cliente reautentica. |
| 403 | `ACESSO_NEGADO` ou `PLANO_NECESSARIO` | URL de outro utilizador ou direito insuficiente; sem modelo/mutação. |
| 404 | `OBJETO_NAO_ENCONTRADO` | Objeto alheio/inexistente indistinguíveis; nenhuma escrita/modelo. Perfil próprio inexistente também falha explicitamente. |
| 409 | `VERSAO_DESATUALIZADA`, `OPERACAO_EM_CURSO`, `CHAVE_REUTILIZADA`, `SESSAO_NAO_CONCLUIDA`, `FEEDBACK_JA_SUBMETIDO` | Recarregar versão; aguardar a mesma operação; corrigir chave; concluir sessão; ou manter o feedback já submetido, respetivamente. |
| 429 | `LIMITE_IA` | Retry-After; limite por ator no servidor. Replay concluído e leituras de cache não consomem geração. |
| 502 / 504 | `RESPOSTA_IA_INVALIDA` / `TEMPO_IA_EXCEDIDO` | Geração/relatório falham explicitamente, sem substituir plano/cache válido. |
| 503 | `PERSISTENCIA_INDISPONIVEL` ou `IA_INDISPONIVEL` | Nunca anunciar commit; retry de mutação mantém operacao_id e payload. |
| 500 | `ERRO_INTERNO` | request_id para correlação; não expor SQL, tokens, prompts ou stack. |

`recuperavel` é true apenas quando repetir pode resolver (429, operação em curso, dependência transitória/timeout); 409 versão exige recarregar antes de iniciar nova operação. Erro não transitório de BD é interno e não se resolve por retries ilimitados.

Manter fallback geral apenas em feedback e adaptação, onde já existe: falha/timeout/esquema inválido do modelo gera uma resposta local completa com `origem:'generica'`. Feedback só devolve 200 depois de guardar também esse resultado; não disfarçar falha de BD com mensagem motivacional. Adaptação geral não garante que o treino é adequado nem que foi analisado. Relatório sem sessões resulta numa resposta local `origem:'generica'`; falha de consulta não conta como ausência de sessões. Com o contexto atual, `equilibrio` e `progressao` indicam dados insuficientes, sem alegar medições não realizadas. Não expandir a recolha de histórico para resolver isso nesta entrega.

Meta operacional proposta: timeout do fornecedor 40 s, orçamento HTTP inferior a 55 s e cliente 60 s para geração/feedback/adaptação/relatório. Um timeout de rede do cliente não implica rollback remoto. Os valores e o limite de geração por ator (proposta: 10/hora, reutilizando o teto atual) ficam sujeitos à confirmação de operação/GL-002; não acrescentar chamadas de teste reais nesta fase.

## Regeneração, importação e idempotência

**Plano mensal:** escolher substituição da mesma linha, mantendo `UNIQUE(user_id,mes)`, `plano_id` estável e `versao` crescente. Não prometer histórico navegável nem criar uma nova linha arquivada no mesmo mês. Resultado válido é gerado fora da transação; o commit com compare-and-swap só substitui se `versao_esperada` ainda corresponder (null para criação). O plano anterior continua ativo até ao commit e sobrevive a qualquer falha. Duas gerações concorrentes para a mesma versão: no máximo uma vence, a outra dá 409. Importações anteriores conservam a prescrição efetivamente importada.

**Importação:** resolver dia e prescrição a partir do plano autorizado e da versão pedida, nunca a partir de exercícios reenviados pelo cliente. Uma transação cria treino, resolve/cria exercícios segundo as regras do catálogo, associa todos com ordem e persiste séries/repetições/observação/descanso previstos num modelo acordado com A5. Todos os erros abortam o conjunto, incluindo criação de catálogo. Se A5 ainda não conseguir preservar a prescrição, a importação fica indisponível na beta; não degradar para uma cópia parcial silenciosa. `exercicios_persistidos` é verificado no resultado da transação.

**Feedback GL-003B — Draft acordado A3/A5:** primeira submissão por sessão, sem edição nesta entrega. Mesma chave repete o resultado; outra chave para sessão que já tem feedback dá 409 `FEEDBACK_JA_SUBMETIDO`, detetado antes do modelo e confirmado pela constraint/transação. `begin_ai_operation` também recusa outra intenção em curso para a mesma sessão antes do modelo. Em concorrência, a primeira escrita válida vence; outra intenção não sobrescreve o conteúdo. GL-003A mantém a semântica atual de envio/upsert, protegendo o proprietário e tratando erros; a alteração para first-write pertence ao contrato B.

**Operações:** gerar, importar e submeter feedback exigem UUID estável criado antes do primeiro envio. Âmbito da chave: `(ator, tipo_de_operacao, operacao_id)`, com hash do pedido validado/canónico (ordem de objetos e enums normalizada). Não incluir tokens no hash. Mesma chave/payload após commit devolve o mesmo código/body e IDs, sem nova escrita de domínio nem chamada ao modelo; chave com payload diferente dá 409. Operações em curso dão 409 recuperável e Retry-After. Na importação, criar deliberadamente outra cópia usa uma nova chave. A interface conserva a chave durante retries e impede o duplo toque de criar duas intenções.

A5 define a reserva durável com lease/fencing e guarda o resultado no mesmo commit do efeito de domínio. Uma falha entre commit e resposta recupera por replay. Não é possível prometer uma única cobrança ao fornecedor perante crash no intervalo entre chamada IA e commit; garantir um único efeito de domínio, não «exactly once» do modelo. Não repetir automaticamente um erro terminal com a mesma chave. Replays continuam sujeitos a autenticação/propriedade atual; não devolver dados de recursos que deixaram de pertencer ao ator. Regeneração de outro mês não altera a chave de uma operação em retry: a reserva fixa mês e instante iniciais.

Draft operacional acordado A3/A5 para revisão final do coordenador: lease de 120 s, fencing monotónico e retoma de lease expirada apenas com fence novo. Commit de resultado desconhecido exige replay, nunca libertação cega. Encerrar falhas/libertar tentativas transitórias usa `finish_ai_operation_failure`, definido uma única vez no contrato comum GL-005; nunca desfaz um estado completed. Falha transitória conserva pedido/ID e permite nova tentativa; falha terminal repete o erro. Retenção cobre a vida do build beta e a janela de retry até retirada do build e drenagem dos reenvios; não há GC de recibos nesta beta. A definição física e a máquina de estados pertencem a GL-005, sem segunda cópia aqui.

## Contrato RPC interno — Draft, dependência GL-005/A5

Estas são assinaturas de intenção para ratificação conjunta, não SQL executado nem esquema físico duplicado. O backend chama com service role exclusivamente no servidor. `p_actor_id` vem do JWT verificado; nunca mapear um campo do body para este argumento. As funções são SECURITY INVOKER com EXECUTE revogado a PUBLIC/anon/authenticated e permitido apenas ao papel de backend acordado com GL-001. RLS não protege service role: cada função verifica explicitamente os predicados de propriedade e as relações antes de escrever. Revalida direito premium protegido quando a operação o exige. Execução direta pelo cliente deve falhar, mesmo com payload válido.

Harmonização com a secção «RPCs internas A3/A5» de `../GL-001/spec.md`: o Draft acordado A3/A5 usa wrappers public/Data API explicitamente service-only e helpers/tabelas num schema privado, sem criar novo transporte/segredo. Testar ACL para PUBLIC/anon/authenticated, sem entrada cliente que autodeclare o ator. Um schema não exposto exige um canal suportado; não presumir que `.rpc()` da Data API o alcança. Se algum fluxo futuro for JWT direto, o ator deriva de `auth.uid()` e deixa de aceitar `p_actor_id` do cliente. A escolha continua sujeita à revisão final A0 e não foi implementada nesta entrega.

| Função proposta | Argumentos de intenção | Garantia e retorno |
|---|---|---|
| `begin_ai_operation` | `p_actor_id uuid, p_tipo text, p_operacao_id uuid, p_pedido jsonb` | Após autorização HTTP, volta a verificar referências. Reserva/replay/conflito, fixa hash/período/versão e devolve token de fencing opaco. Sem leitura detalhada de outra conta. Não executa modelo. |
| `commit_ai_plan` | `p_actor_id uuid, p_operacao_id uuid, p_fence text, p_resultado jsonb` | Usa pedido e período reservados; valida conteúdo, compara versão, cria/substitui linha e guarda PlanoResposta no mesmo commit. |
| `import_ai_plan_day` | `p_actor_id uuid, p_operacao_id uuid, p_fence text` | Usa ImportarPedido reservado; relê proprietário/versão; cria agregado inteiro + resultado numa transação. |
| `commit_ai_feedback` | `p_actor_id uuid, p_operacao_id uuid, p_fence text, p_resultado jsonb` | Usa FeedbackPedido reservado; confirma sessão concluída e relação utilizador–treino; primeira escrita por sessão + resultado numa transação. Outra intenção não sobrescreve; nunca altera user_id para corrigir um conflito. |

O resultado RPC é um DTO de sucesso ou erro de domínio estável que o backend mapeia para a tabela HTTP, sem devolver detalhes SQL. O contrato comum GL-005 define `finish_ai_operation_failure`, a forma concreta dos recibos/resultados, lease e retenção conforme o Draft conjunto; não inventar uma segunda máquina de estados em GL-003. O tipo SQL concreto de `p_fence` deve coincidir com o fence monotónico de GL-005; `text` na tabela é apenas um placeholder opaco Draft. Queries de contexto continuam a usar predicados de owner. Chaves compostas/constraints da sessão e políticas REST são GL-001/GL-005.

## Critérios de aceitação

| ID | Cenário verificável e resultado esperado |
|---|---|
| GL003-AC01 | Sem JWT ou JWT inválido: 401 em todas as rotas; URL B com JWT A: 403; contadores de mutação e modelo a zero. |
| GL003-AC02 | JWT A + session/workout/plano de B ou inexistente: 404 indistinto; nenhuma leitura detalhada de B, nenhuma reserva, escrita ou chamada IA. Exercitar feedback, adaptação e importação. |
| GL003-AC03 | Relação adulterada (sessão A aponta treino B), filhos alheios ou mudança de proprietário entre pré-validação e commit: rejeição sem alteração; restrições e RPC também a impedem em BD isolada. |
| GL003-AC04 | Matriz de campos em falta, desconhecidos, null, tipos errados, IDs inseguros, limites ±1, strings/arrays malformados, dor incoerente e bodies grandes: código correto e zero efeitos/modelo. Casos válidos nos limites são aceites. |
| GL003-AC05 | JSON válido mas esquema inválido, campos injetados como sucesso/status e saída excessiva do modelo/cache: não chegam ao cliente/BD; geração mantém plano anterior; fallback só nas operações e formatos definidos. |
| GL003-AC06 | Cada erro Supabase necessário, inclusive `.maybeSingle()` com erro e ausência inesperada de linha modificada, é tratado; nunca retorna sucesso de persistência. Leituras vazias legítimas distinguem-se de falha. |
| GL003-AC07 | Primeira geração cria versão 1; regeneração válida incrementa a versão da mesma linha mensal; consulta devolve só o plano atual. Falhas de modelo, validação ou commit conservam conteúdo/versão anteriores. |
| GL003-AC08 | Duas gerações concorrentes sobre a mesma versão produzem um vencedor; outro recebe 409. Sem duas linhas ativas, arquivo prematuro ou perda do plano. |
| GL003-AC09 | Falha injetada em cada etapa de importação deixa zero treino/exercício novo/associação parcial; sucesso preserva ordem e toda a prescrição e responde com contagem real. |
| GL003-AC10 | Retry da mesma importação/geração/feedback, incluindo timeout após commit, devolve exatamente o resultado guardado. Uma única mutação lógica; mesma chave com outro payload dá 409; dois envios simultâneos não duplicam. |
| GL003-AC11 | Feedback legítimo mantém uma linha por sessão; retry da mesma chave não chama modelo depois do commit. Em B, outra chave para sessão submetida dá 409 antes do modelo; corrida não sobrescreve a primeira submissão. Falha IA dá origem genérica explícita; falha BD não dá 200 nem `persistido:true`. |
| GL003-AC12 | Ator free só recebe adaptação geral de treino próprio, sem modelo; premium expirado/insuficiente é recusado nos restantes endpoints. Direito não pode vir do pedido/metadata editável (provas GL-001). |
| GL003-AC13 | Cliente atualizado usa plano_id/versao/índice e preserva UUID em retry; pedido legado de exercícios livres dá 422 sem efeitos. Publicar um backend que aceite o novo contrato antes da beta cliente correspondente. |
| GL003-AC14 | Relatórios/cache não cruzam contas ou semanas; falta de dados produz texto geral honesto; falha de consulta não gera relatório «sem treino». Contrato não acrescenta capacidades ao Coach. |
| GL003-AC15 | RPCs diretas anon/authenticated são recusadas; backend com ator A não opera sobre objeto B; validação DB aplica-se mesmo sem passar pelo controller. Verificar grants e constraints após instalação limpa e upgrade em BD isolada. |
| GL003-AC16 | Calendário fixado: mês, segunda-feira/semana e mudança de hora testados com relógio controlado; retry atravessando mês usa o período reservado. Logs/erros têm request_id e códigos, sem JWT, prompts, notas, dor ou respostas privadas. |

Para GL-003A, verificar AC01–03 e AC06 no percurso HTTP/serviço, com os envelopes existentes e o contexto de direitos de GL-001; AC04 apenas para IDs/estrutura mínima, sem impor ainda o body novo. As garantias DB de AC03/AC15, os envelopes/limites completos e os restantes critérios fecham-se em GL-003B. Registar a fatia na evidência: não afirmar que passar a prova P0 equivale a aceitar toda a unidade GL-003.

## Dependências e decisões por fechar

| Decisão/dependência | Responsável | Estado e condição de fecho |
|---|---|---|
| Autoridade do ator, direitos premium e proibição de escrita direta em IA/feedback que contorne ownership | GL-001/A1 | Obrigatória antes de implementar autorização; não confiar no plano atualmente editável. |
| Substituição mensal com versão, tabela/estado de operações, fencing, RPCs e tratamento de dados inconsistentes | GL-005/A5 | **Draft GL-003B acordado A3/A5**, sujeito a revisão final A0 e detalhe comum A5; sem transação/idempotência comprovada não abrir regeneração/importação na beta. Não bloqueia GL-003A. |
| Prescrição planeada na junction ou modelo equivalente; unicidade/resolução do catálogo | GL-005/A5 + coordenação | **Draft GL-003B**. Sem decisão física nesta spec. Exige round-trip de todas as prescrições suportadas e rollback do catálogo. |
| Formato JSON/validação de resultados RPC, encerramento de falhas e retenção de operações | GL-005/A5 | **Draft GL-003B acordado A3/A5**. Anexar ao contrato comum e referenciá-lo; first-write feedback, lease 120 s/fence monotónico, sem GC beta; detalhes e revisão final pendentes. |
| Limites de campos, Europe/Lisbon, timeout e rate limit por ator | Coordenação + GL-002/operação | **Draft GL-003B**; confirmar antes da implementação dos esquemas. |
| Regeneração disponível na interface | Coordenação/app | O backend anuncia regeneração, a UI diz «um por mês». Esta entrega garante integridade do endpoint; não exige criar nova ação de UI. Harmonizar a mensagem da beta com a decisão final. |

Aceitação final requer provas locais/integradas com duas contas sintéticas e BD isolada, depois ensaio no iPhone beta. Nenhum desses testes foi executado por estes documentos. Não há autorização implícita para migrações/deploys/chamadas reais.
