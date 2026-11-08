# GL-003 — Plano técnico

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **Draft**, planeamento, sem alterações ao produto. Requisitos e critérios: [spec.md](spec.md). A fonte canónica HTTP futura será o `contracts/http/openapi.yaml` partilhado entre GL-003 e GL-004, com tipos/validadores/fixtures derivados; o bloco TS da spec é uma ilustração não normativa. RPCs, limites e calendário continuam Draft até ratificação.

## GL-003A — corrigir o P0 com o contrato atual

1. **Fixar a fronteira do ator com GL-001.** Usar o JWT verificado e impedir que URL/body/metadata se tornem autoridade. Esta confirmação não espera pela máquina de operações de A5 nem por novos DTOs.
2. **Mover ownership para antes dos efeitos.** Em feedback/adaptação, validar minimamente o ID atual e consultar metadados por ID+user_id; confirmar a relação sessão–treino. Só depois ler nomes/séries/notas, escrever feedback ou construir prompt. Queries de contexto próprias exigem ator; não basta corrigir o controller. Manter os bodies atuais e o sucesso atual para o cliente existente.
3. **Tratar falhas de BD já existentes.** Inspecionar error/data e zero linhas inesperadas nas leituras/escritas; erro não vira «sem dados» nem 200 de persistência. Usar o envelope legado `{erro,...}` nesta fatia, sem obrigar o cliente a entender metadados novos. Não atribuir a este passo garantias transacionais ainda inexistentes.
4. **Provar e fechar a fatia P0.** Casos A→A, A→B, inexistente, URL divergente, relação inconsistente e falhas BD em serviço/HTTP local; spies garantem zero escrita/modelo/conteúdo alheio. Reexecutar testes backend relevantes na versão suportada. A evidência identifica AC01–03/AC06 na camada HTTP/serviço e o subconjunto mínimo de AC04. Atomicidade/RPC e mudanças concorrentes dependentes de constraints continuam abertas em B.

GL-003A não depende de ratificar `begin_ai_operation`, metadados de versão, prescrição ou OpenAPI completo. A proteção REST direta e o saneamento de relações históricas são complementos GL-001/GL-005, não motivos para deixar o endpoint vulnerável enquanto aguardam. Antes da beta, estes complementos também têm de passar os respetivos gates.

## GL-003B — contratos e persistência após ratificação

1. **Fechar Draft com A1/A5/coordenação.** Confirmar RPCs restritas e transporte interno suportado, substituição com versão, prescrição, semântica comum de operações/falhas/retenção; ratificar calendário/limites/timeout/rate e mensagem de regeneração UI. Referenciar o contrato comum A5 sem o duplicar.
2. **Publicar o contrato canónico futuro.** Criar `contracts/http/openapi.yaml` após ratificação; gerar tipos, validadores e fixtures a partir daí. Escolher tooling compatível com GL-002 sem dependências RN no backend. Especificar aí os refinamentos semânticos; remover a necessidade de manter manualmente o exemplo TS da spec. Validar requests, respostas de modelo e cache.
3. **Isolar e validar o adaptador do modelo.** Timeout, limites de bytes/esquemas por operação e dublos/relógio para provas. Texto livre é dado delimitado; minimizar contexto. Aplicar fallback completo com origem explícita só a feedback/adaptação. Geração/relatório não substituem resultado válido por saída inválida.
4. **Consumir transações A5 para plano/importação/feedback.** Reserva após autorização; IA fora da transação; plano com compare-and-swap e sem arquivo antecipado; importação por referência com prescrição integral; feedback first-write por sessão e resultado da operação no mesmo commit. Revalidar owner no commit, devolver só estado confirmado e usar fencing/replay do contrato comum. Draft A3/A5: lease 120 s, sem GC beta, `finish_ai_operation_failure` comum e replay obrigatório quando o commit é incerto; sujeito a revisão final A0.
5. **Migrar a beta cliente.** `plano.ts` usa tipos derivados, UUID estável e erros tipados; `ai-plan.tsx` guarda plano_id/versao e envia índice; feedback guarda operacao_id. Atualizar timeouts/origem e mensagem de regeneração conforme decisão final. Body antigo de importação é incompatível, apesar das rotas iguais: migrar consumidores e aplicar gate de versão mínima se existirem builds distribuídos.
6. **Verificar a unidade completa.** Contrato/serviços/HTTP simulados; transações e grants reais em BD isolada com A5; depois iPhone beta com A9/GL-010 e dados sintéticos. Não chamar fornecedores nem aplicar SQL ao serviço ligado nesta tarefa de planeamento.

## Superfícies previstas de implementação futura

| Superfície | Mudança prevista | Propriedade |
|---|---|---|
| `backend/src/routes/ai/*`, controllers IA, middleware de erro/limite | Contrato fechado, falhas tipadas e limite por ator | GL-003; autenticação/direitos dependem GL-001 |
| `backend/src/services/ai/{feedback,adapt,plan,report}.service.js` | Predicados owner, tratamento de todos os resultados DB, semântica de fallback e transações | GL-003 |
| `backend/src/services/gemini.service.js` | Parsing e validação por operação, timeout, injeção em testes, sem spread irrestrito | GL-003 |
| `contracts/http/openapi.yaml` a criar em B | Fonte canónica; runtime/types/fixtures derivados | GL-003 + GL-002 |
| RPCs, constraints, migrações e operações | Atomicidade, relações entre proprietários, prescrição e replay durável | GL-005/A5 com regras GL-001 |
| `app/src/services/api/plano.ts`, `ai-plan.tsx`, `workout/feedback.tsx` e consumidores de adaptação/relatório | Requests/respostas e estados de retry compatíveis | GL-003, coordenar com responsável app |

Não abrir alterações de Stripe nesta unidade. Reutilização da camada HTTP da app não deve modificar os contratos de pagamentos inadvertidamente.

## Verificação planeada

| Camada | Evidência exigida | Critérios |
|---|---|---|
| A: serviço + HTTP atual | A/B/inexistente e spies de leitura detalhada/escrita/modelo; IDs mínimos; erros BD tratados; sem mudança de body/sucesso | AC01–03/AC06 na camada serviço/HTTP e subconjunto mínimo AC04 |
| B: contrato completo | Casos válidos/limites e rejeição de tipos, unknown keys, IDs BIGINT não seguros, dor e coerência de modelo | AC04–05 |
| B: serviço + HTTP novo | Payloads novos/adversos e spies, incluindo reservas; nenhum dado de B e envelopes completos | AC01–06, AC12, AC14 |
| Persistência isolada | Falhas em cada etapa, concorrência real, timeout após commit, replays e grants com anon/authenticated/backend | AC03, AC07–11, AC15 |
| Cliente | Mesmo ID em retry/duplo toque, versão desatualizada, erro tipado e fallback explícito; testes contratuais a partir dos schemas | AC10, AC13 |
| Calendário/observabilidade | Relógio fixo em mudança de mês/semana/DST e inspeção de logs sanitizados | AC16 |
| iPhone beta com A9/GL-010 | Duas contas sintéticas, erro de rede depois de importar, reabertura/retry, consulta de treino completo | AC02, AC09–10, AC13 |

Executar os testes backend existentes na versão Node suportada confirmada por GL-002; distinguir os antigos harnesses que reproduzem vulnerabilidades das novas asserções de rejeição. Não anunciar passagem com mocks como prova de atomicidade SQL. Não repetir testes amplos sem mudança/erro que o justifique.

## Compatibilidade e ordem de entrega futura

GL-003A mantém caminhos, bodies e sucesso atuais; recusas de segurança/erros BD passam a ocorrer corretamente no envelope existente. GL-003B mantém os caminhos, mas os bodies de geração/feedback ganham UUID e a importação é deliberadamente incompatível com exercícios livres. Metadados de versão/origem e erros só se tornam o contrato novo em B. A beta deve usar um par backend/cliente compatível, com gate de versão mínima se existirem builds antigos distribuídos. Não oferecer fallback que volte a aceitar importação arbitrária depois dessa migração.

Preparar e verificar migrações aditivas numa BD isolada antes de publicar backend consumidor. A5 deve detetar dados legados inconsistentes sem apagar ou reatribuir proprietários automaticamente; planos legacy válidos recebem versão inicial numa migração explícita. Depois publicar backend compatível e distribuir o cliente beta correspondente. A ordem de aplicação em ambientes ligados e quaisquer aprovações de publicação são trabalho futuro da coordenação, fora desta autorização.

Rollback: desativar geração/importação através do mecanismo acordado de configuração e continuar a mostrar plano/treinos persistidos válidos. Não repor o serviço vulnerável nem usar reset SQL. Migrações aditivas e resultados idempotentes devem sobreviver ao rollback da app. A5 define a janela de retenção antes da beta; não eliminar chaves de operações ainda reenviáveis.

## Riscos e decisões que bloqueiam implementação

- Sem GL-001, um perfil premium editável pelo cliente invalida o gate de direitos.
- Sem GL-005, chamadas separadas ao Supabase não oferecem rollback integral nem idempotência durável; isso bloqueia B, não a correção de ownership/erros em A.
- A prescrição não cabe hoje na junction; este plano exige decisão de dados e round-trip antes de abrir a importação.
- O modelo pode ser chamado mais de uma vez após crash antes do commit; o efeito de domínio mantém-se único. Não prometer uma só cobrança.
- Recusas 404 uniformes evitam distinguir objeto alheio de inexistente; a diferença URL userId/JWT continua 403 por compatibilidade explícita.
- Limites/rate/timeout/calendário e regeneração UI são propostas pendentes identificadas na spec, não decisões de produto silenciosas.

## Limite do trabalho realizado

Foram inspecionados os relatórios reconciliados e os serviços/rotas/controllers/cliente/schema locais necessários para propor estes contratos. Foram escritos apenas documentos em `docs/sdd/GL-003/`. Nenhuma correção, migração, chamada real de API, deploy ou teste de implementação foi executado.
