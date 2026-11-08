# GL-002 — Plano de implementação

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.

> A execução de toolchain/CI segue a branch `chore/GL-002-toolchain-ci`. Reconciliar os resultados e o SHA integrado com estas tarefas históricas antes de atualizar o estado de aceitação.


Estado: planeado. Referência: `552f989b1d55adb22bee154a61d3f0062a8da207`. Critérios normativos em [spec.md](spec.md). Esta tarefa escreveu apenas documentação; os comandos abaixo são para execução futura autorizada, não resultados obtidos.

## Sequência e decisões

1. **Obter baseline completa.** Trabalhar num checkout completo e isolado do commit de implementação, com assets. Guardar SHA, hashes de manifestos/locks, logs CI/EAS originais se disponíveis e resultados da pesquisa de referências. A cópia de review não é Git e não serve de artefacto compilável. Não repetir instalações para explicar retrospectivamente a falha remota sem os seus logs.
2. **Fechar a toolchain.** Conferir Node22 LTS com versão patch mantida, npm compatível e engines de Expo/RN/SDKs backend/EAS. Fixar os valores exatos em ficheiro de versão e configuração CI/EAS; declarar `engines`/gestor no local apropriado sem supor que apenas `packageManager` faz o CI impor npm. CI deve verificar versões. Fixar Expo Doctor e EAS CLI; A9 escolhe/confirma imagem iOS nomeada e versão Xcode disponível. Guardar decisão e fontes com hashes/commit. Evitar alteração global da máquina do utilizador.
3. **Alinhar matriz da app.** Partir da candidata SDK54 em spec: Worklets0.5.1, jest-expo54, renderer19.1.0, RNTL13.3.3, Jest29 e tipos compatíveis. Validar todas as dependências Expo, não apenas as quatro incompatíveis: picker, safe-area-context, Router e restantes módulos também entram no check. Confirmar New Architecture para Reanimated4 e comportamento Babel/NativeWind; não acrescentar plugins duplicados por rotina. Se o mapa do patch Expo instalado diferir da branch oficial, registar e resolver a diferença antes do lock final.
4. **Corrigir infraestrutura de testes.** Remover a suite da funcionalidade Comunidades retirada e os skips vazios. Migrar consumidores para a API RNTL13 acordada, remover o mapper e adaptador de `test-renderer`, rever `IS_REACT_ACT_ENVIRONMENT`, tipos manuais e `@testing-library/jest-native`/matchers. Preservar assertions úteis e limpeza de mocks. Não alterar app/Coach para satisfazer testes nesta entrega de tooling; articular alterações funcionais com os respetivos responsáveis.
5. **Regenerar e verificar locks.** Atualizar manifestos deliberadamente e regenerar lock app com a toolchain fixada em diretório isolado. Preservar lock backend se válido; regenerar apenas se necessário e justificar o diff. Rever integridades, registry, introdução de novos pacotes e árvores duplicadas. Fazer dois `npm ci` de app/backend em workspaces descartáveis separados; não apagar recursivamente a workspace partilhada para simular um ensaio limpo.
6. **Integrar regressões e contratos.** A3 e responsáveis de dados/pagamentos definem schemas/fixtures e um script backend `test:contracts` com fixtures de teste, validando serialização do consumidor e respostas/erros do servidor. Testes funcionais para Coach geral, auth, treino e offline são fornecidos pelos donos dos fluxos; A2 garante que são descobertos e executados. Os scripts de reprodução do review não são automaticamente aprovados como regressões porque passam com defeitos presentes.
7. **Unificar gates.** Evoluir `.github/workflows/ci.yml` para jobs separados `app-quality`, `backend-quality`, `contracts` e `ios-export`, seguidos de `quality-gate`. Evoluir/remover o arranque independente de `.github/workflows/eas-build.yml`, usando um workflow reutilizável com `needs` explícito, ou mover o job iOS para o mesmo DAG. Proposta preferida: um DAG por SHA, evitando sincronização frágil entre workflows.
8. **Exercitar bloqueios e entregar.** Executar ensaios negativos e positivo, guardar recibo de qualidade e entregar a A9. A9/A10 executam build assinada e validação TestFlight em iPhone num passo posterior. Não efetuar submissão, deploy ou publicação como parte de GL-002.

## Contrato do pipeline

| Job | Dependências | Saída / condição |
|---|---|---|
| `app-quality` | Checkout do SHA escolhido; instalação app normal | Versões, hashes, checks Expo/Doctor, lint, tsc, relatório Jest. |
| `backend-quality` | Mesmo SHA; instalação backend normal | Versões/hashes e relatório `node --test`, sem segredos de produção. |
| `contracts` | Mesmo SHA; instalações necessárias com os mesmos locks | Testes de contrato consumidor/servidor/fixtures; mocks de fornecedores explicitados. |
| `ios-export` | Mesmo SHA; instalação app; ambiente público de teste acordado com A9 | Bundle iOS e log; não substitui build nativa. |
| `quality-gate` | Os quatro jobs anteriores | Só passa se todos forem `success`, SHA e hashes coincidirem. Se usar `always()` para emitir resumo, verificar explicitamente cada resultado; nunca deixar o resumo passar por omissão. |
| `ios-candidate-build` | `quality-gate`; evento trusted e configuração A9 preparada | Build iOS do mesmo SHA, sem promoção automática. Reconstituir checkout nesse SHA e exigir árvore limpa antes de upload EAS. |
| Promoção TestFlight | Qualidade e build do mesmo SHA; gates funcionais, sandbox e validação A9/A10 | Responsabilidade coordenada por A9/A10; não é habilitada apenas por CI verde. |

Em PRs: qualidade sem segredos; builds assinadas reservadas a contexto de confiança. Não usar `pull_request_target` para executar código arbitrário com credenciais. Arranque manual repete/reutiliza apenas evidência verificada para o SHA exato; não aceita o último verde de `main`, inputs de perfil livres ou artefactos de outro SHA. Se testes PR usarem um SHA de merge sintético, registar esse SHA e repetir a qualidade para o SHA que efetivamente será compilado.

Sem `continue-on-error` nos gates, `--passWithNoTests`, supressão generalizada de peers, scripts de fallback que devolvem 0 ou `--if-present` para contratos obrigatórios. `paths` não pode saltar qualidade necessária à build; required checks/branch protection devem refletir os nomes finais. Cache de npm por SO/Node/npm/hash dos locks; não reutilizar `node_modules`. Timeouts explícitos e cancelamentos impedem promoção. Persistir relatórios de falha com `if: always()` sem alterar o estado do job.

## Comandos de validação futura

Executar cada bloco no diretório indicado com Node/npm fixados. As ferramentas invocadas por `npx --no-install` devem existir nas devDependencies/lock acordados; não permitir download implícito. Definir `CI=true` no runner para comandos não interativos.

Na raiz, antes e depois das instalações (PowerShell):

```powershell
git rev-parse HEAD
git status --porcelain
node --version
npm --version
Get-FileHash app/package.json,app/package-lock.json,backend/package.json,backend/package-lock.json -Algorithm SHA256
```

Em `app/`, nos dois workspaces de ensaio independentes:

```powershell
npm ci --no-audit --no-fund
npm ls --all
npx --no-install expo install --check
npx --no-install expo-doctor
npx --no-install eslint . --max-warnings=0
npx --no-install tsc --noEmit
npm test -- --ci --runInBand --json --outputFile=jest-results.json
npx --no-install expo export --platform ios --output-dir dist-ios
```

Em `backend/`, nos mesmos ensaios:

```powershell
npm ci --no-audit --no-fund
npm ls --all
npm test
npm run test:contracts
```

`test:contracts` ainda não existe: introduzir com A3 antes de tornar o gate obrigatório; a sua ausência é falha, não skip. Relatório backend deve usar formato estruturado suportado pelo Node fixado, preservando também a saída TAP/texto. Lint da app usa o ESLint local com a configuração Expo existente para impor zero avisos sem depender da aceitação de opções pelo wrapper `expo lint`.

Pesquisa de referências na raiz:

```powershell
rg -n 'CommunitiesContext|test-renderer|it\.skip|test\.skip|describe\.skip' app --glob '!package-lock.json' --glob '!node_modules/**'
```

O resultado exige classificação manual: `react-test-renderer` é uma dependência candidata legítima do preset54; o mapper `^test-renderer$`, o adaptador e imports da funcionalidade removida devem desaparecer. Um código 1 do `rg` significa ausência de matches, não falha de qualidade. Nos ensaios frios usar runner/workspace novos e cache npm inicialmente vazia; no segundo usar cache com os mesmos hashes. `npm ci --offline` não é gate de instalação online e a ausência de pacote em cache não mede compatibilidade.

Não executar EAS aqui. Após a entrega, A9 regista o comando iOS concreto do perfil TestFlight aprovado (distribuição store, não confundir com ad hoc `internal`), CLI fixada e imagem disponível. Expo export não verifica CocoaPods, assinatura, entitlements, Hermes nem ciclo de vida iOS.

## Ensaios negativos e rastreabilidade

Usar branches/commits temporários sem promoção habilitada: (1) introduzir erro lint, (2) erro TypeScript, (3) assertion backend falhada e (4) fixture incompatível entre cliente/servidor. Cada ensaio deve produzir job falhado, `quality-gate` falhado e zero builds candidatas/submissões/promoções. Ensaiar cancelamento e uma dependência skipped; rejeitar também tentativa de consumir receipt de SHA anterior. Reverter alterações de falha e executar o caminho positivo no SHA final, sem reutilizar resultados do commit de injeção.

Recibo planeado `quality-receipt.json`: `source_sha`, hashes SHA-256 dos dois manifestos e dois locks, Node/npm/Expo/RN/React/Worklets/Reanimated/Jest/preset/renderer/RNTL/Doctor/EAS CLI exatos, URL/ID de cada run e resultado/comando, contagem de testes/skips, hash de export e esquema/fixture dos contratos. Campos nativos separados: `native_validation: pending`, build ID/image/Xcode/bundle ID/buildNumber quando A9 os produzir. Ausência de evidência permanece `pending`, nunca `passed`.

Guardar logs/relatórios como artefactos de CI com retenção explícita (proposta: 30 dias) e referências no recibo; remover tokens, dados de saúde, credenciais Apple e segredos Stripe/Gemini. O ambiente de testes usa fixtures e fornecedores simulados; testes sandbox externos pertencem à validação dos respetivos responsáveis.

## Passagem a A9/A10 e riscos

A2 entrega matriz final e diffs dos manifestos/locks/configuração Jest/CI, receipt completo, confirmação New Architecture e estado de export. A9 confirma identidade iOS, imagem/Xcode, credenciais, configuração staging resolvida e perfil `store` para TestFlight; devolve build assinada associada ao SHA e hashes. A10 regista instalação e smoke em iPhone, reabertura/processo terminado, auth, treino, Coach geral e sandbox conforme cenários funcionais. Builds ou ensaios nativos não foram realizados nesta especificação.

Riscos: a matriz candidata pode revelar problemas de runtime apenas no binário; RNTL13/renderer19.1 usa uma geração anterior de ferramentas de teste e exige validação efetiva; plugins nativos/NativeWind podem precisar de ajustes limitados; a branch oficial SDK54 pode mudar; disponibilidade EAS/Xcode pode obrigar a rever a estratégia. Nenhum risco justifica ignorar peers ou usar outro SHA sem repetir gates. GL-002 desbloqueia a preparação da beta, mas os P0 e os restantes critérios funcionais continuam bloqueantes.
