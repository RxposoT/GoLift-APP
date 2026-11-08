# GL-002 — Tarefas executáveis

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.

> A execução de toolchain/CI segue a branch `chore/GL-002-toolchain-ci`. Reconciliar os resultados e o SHA integrado com estas tarefas históricas antes de atualizar o estado de aceitação.


Estado: backlog de implementação, **todas por executar**. Esta entrega contém só planeamento PT-PT. Referências: [spec.md](spec.md), [plan.md](plan.md), L01/L02/L11 em 06-lancamento.md (fonte reservada da revisão histórica, `06-lancamento.md`). Responsável principal A2; passagens explícitas a A3, A9/A10 e donos dos fluxos, sem criação de agentes adicionais por esta tarefa.

## Tarefas e dependências

| Estado | ID | Trabalho concreto | Depende de | AC / evidência de conclusão |
|---|---|---|---|---|
| [ ] | GL-002-T01 | Obter checkout completo do SHA base; verificar assets sem os classificar como defeito nesta cópia; recolher hashes e manifests; tentar obter logs completos das duas falhas remotas. | Acesso ao checkout e logs; logs indisponíveis ficam registados como limite. | AC02/05; baseline com SHA e hashes, sem atribuir causa remota a um pacote sem log. |
| [ ] | GL-002-T02 | Verificar e fixar patch Node22 LTS e npm mantidos; conferir engines app/backend/EAS e paridade local/CI; combinar com A9 CLI exata e imagem iOS nomeada. Fixar Expo Doctor; guardar evidência oficial versionada. | T01; A9 para ferramenta/imagem nativa. | AC01/02/09; decisão com versões exatas. Node20 EOL não é baseline; patch Node/npm/CLI/Doctor continua pendente. |
| [ ] | GL-002-T03 | Comparar mapa SDK54 do patch Expo escolhido com a fonte oficial; fechar matriz proposta Expo54/React19.1/RN0.81.5, Worklets0.5.1, Reanimated4.1, jest-expo54, Jest29, RNTL13.3.3 e renderer19.1.0. Conferir todos os módulos Expo e New Architecture. | T02. | AC01; matriz final e peers, fontes/hash, decisão de patches; nenhuma atualização isolada para contornar conflitos. |
| [ ] | GL-002-T04 | Remover teste CommunitiesContext e quatro skips vazios; migrar API RNTL, remover mapper/adaptador `test-renderer`; rever tipos manuais, setup act e matchers legados. | T03. | AC03; diff e pesquisa classificados; suite ativa não ocultada/excluída e Comunidades não reintroduzidas. |
| [ ] | GL-002-T05 | Regenerar lock app com toolchain final; verificar lock backend existente e alterar só se necessário. Rever integridades/peers/duplicados e justificar cada alteração direta. | T03/T04. | AC01/02; manifests/locks coerentes, `npm ls --all` zero erros. |
| [ ] | GL-002-T06 | Ensaiar `npm ci` app/backend em dois workspaces isolados, primeiro cache fria e segundo cache reaproveitada. Comparar hashes antes/depois e árvores relevantes. | T05. | AC02; quatro instalações com saída 0, sem flags de ignorar peers, hashes inalterados e versões iguais. |
| [ ] | GL-002-T07 | Com donos dos fluxos, integrar testes positivos/negativos de auth, Coach de sugestões gerais, treino e isolamento/recuperação offline. Converter provas do review apenas quando o dono fornecer assertions corrigidas. | T04/T06; especificações funcionais dos donos. | AC04/06; pelo menos dois cenários por fluxo, resultados observáveis, contagens reais e rastreio aos AC funcionais. Não inventar testes de personalização do Coach. |
| [ ] | GL-002-T08 | Acordar com A3 schemas/fixtures/erros e introduzir `backend` script `test:contracts`; exercitar serialização cliente e resposta/erro do servidor sem fornecedores externos. | T06; contrato de A3 e inputs de dados/pagamentos aplicáveis. | AC07; sucesso, auth inválida e payload inválido; relatório e contrato versionados. Script ausente deve falhar. |
| [ ] | GL-002-T09 | Criar jobs app/backend/contratos/export e gate agregado no mesmo SHA; fixar ferramentas/caches/timeouts/artefactos; ligar build futura iOS a `needs` e retirar bypass do workflow Android independente. Alinhar required checks com coordenador. | T06/T07/T08; interface A9. | AC05/06/07/08; DAG, relatórios e ausência de `continue-on-error`/skips aceites como sucesso. Configuração de branch remota não presumida como já aplicada. |
| [ ] | GL-002-T10 | Executar lint, tsc, Jest app, backend, contratos, check Expo/Doctor e export iOS no checkout completo; corrigir problemas de tooling descobertos e encaminhar defeitos funcionais aos donos. | T09. | AC01/05/06/07; todos os comandos com saída 0; matriz e relatório atualizados após qualquer alteração. Não marcar nativo como aprovado. |
| [ ] | GL-002-T11 | Executar quatro falhas injetadas separadas (lint/tsc/backend/contrato), cancelamento e skip; testar rejeição de receipt de outro SHA. Repor e correr gates no SHA final. | T09/T10; nenhuma promoção ativa nos ensaios. | AC08; cada negativo bloqueia, 0 builds candidatas/submissões/promoções; positivo identifica SHA final. |
| [ ] | GL-002-T12 | Produzir `quality-receipt.json` e entregar a A9/A10 matriz/locks/toolchain/relatórios/export/limitações. Registar aceitação do handoff e manter validação nativa pendente até resposta. | T10/T11; A9/A10. | AC09; receipt com hashes/IDs e estados separados. Build/TestFlight só passam com evidência nativa e gates funcionais externos fechados. |

## Checklist de revisão por AC

- [ ] **AC01:** peers/engines/matriz confirmados por árvore instalada e checks Expo; pacote nativo duplicado ausente ou analisado antes da aceitação.
- [ ] **AC02:** duas instalações limpas por componente, hashes sem alterações e versões fixadas.
- [ ] **AC03:** import inexistente removido; zero skips vazios; zero adaptadores usados para esconder contrato incompatível.
- [ ] **AC04:** auth/Coach geral/treino/offline com cenários úteis rastreáveis, sem afirmar personalização.
- [ ] **AC05:** lint zero avisos/erros, tsc e Jest verdes, export iOS válido; sem confundir export com execução nativa.
- [ ] **AC06:** suite backend na versão Node mantida; baseline 9 explicitada, regressões atuais exigem correções reais.
- [ ] **AC07:** contratos consumidor/servidor verdes no mesmo SHA, script obrigatório e fixtures partilhadas.
- [ ] **AC08:** gates positivos/negativos demonstrados, sem bypass manual nem promoção de SHA diferente.
- [ ] **AC09:** entrega A9/A10 aceite; build assinada e ensaio iPhone identificados separadamente quando existirem.

## Pendências a devolver ao coordenador

| Pendência | Responsável de resolução | Efeito |
|---|---|---|
| Patch Node22/npm, tipos Jest, Doctor/EAS CLI e imagem iOS exatos ainda não confirmados por instalação/toolchain | A2 + A9 | Bloqueia congelar matriz final e declarar AC01/02/09. A linha candidata tem fontes oficiais; não há build aprovada. |
| Checkout completo e ambiente de instalação/testes não usados nesta tarefa de planeamento | Coordenador/A2 | Bloqueia qualquer afirmação de lint/tsc/Jest/export verdes; ausência local de assets não é bug. |
| Logs completos do erro de instalação remoto não disponíveis no review | Coordenador/A2 | Causa remota permanece desconhecida; não impede corrigir incompatibilidades verificadas no lock. |
| Contratos/fixtures e regressões de auth/dados/Coach/pagamentos por fechar pelos donos | A3 e responsáveis dos fluxos | Bloqueia AC04/06/07 completos e promoção; tooling pode avançar antes. |
| Perfil store/TestFlight, identidade/credenciais, staging, sandbox e teste em iPhone | A9/A10 + responsáveis funcionais | Bloqueia promoção TestFlight; fora da execução GL-002. |
| P0 e restantes gates funcionais do programa | Coordenador e donos de cada GL | CI verde nunca autoriza, por si só, beta interna nem lançamento público. |

Concluído o planeamento quando estes três documentos forem revistos pelo coordenador. Concluída a implementação de tooling quando AC01–08 tiverem provas e o handoff AC09 for aceite; a aprovação da beta exige adicionalmente o retorno nativo A9/A10 e os restantes gates do programa. Nenhuma checkbox está marcada porque não se executou implementação ou validação nesta tarefa.
