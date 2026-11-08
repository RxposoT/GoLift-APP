# GL-002 — Dependências e gates de qualidade

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.

> A execução de toolchain/CI segue a branch `chore/GL-002-toolchain-ci`. Reconciliar os resultados e o SHA integrado com estas tarefas históricas antes de atualizar o estado de aceitação.


Estado: especificação para implementação; **nenhuma instalação, correção de produto ou build executado nesta tarefa**. Autor: A2 Tooling. Data: 2026-11-08. Referência: `552f989b1d55adb22bee154a61d3f0062a8da207`.

## Objetivo e âmbito

Tornar a instalação e a validação da app e do backend reproduzíveis e impedir que um commit sem qualidade comprovada origine uma build candidata à beta interna em iPhone via TestFlight. A beta usa pagamentos sandbox e apresenta o Coach como sugestões gerais; não pressupõe análise personalizada do histórico. CI verde e validação nativa são evidências distintas.

Abrange L01, L02 e L11 de 06-lancamento.md (fonte reservada da revisão histórica, `06-lancamento.md`), e a interface com L03/A9 iOS. Inclui matriz Expo/React Native/React/Worklets/testes, ambos os lockfiles, testes remanescentes de Comunidades, ferramentas fixadas, jobs app/backend/contratos e dependências do pipeline. Não inclui implementação dos defeitos de segurança, pagamentos, persistência ou Coach, configuração de contas Apple, assinatura, submissão, deploy ou publicação. Os respetivos responsáveis fornecem testes de regressão a integrar nos gates.

## Evidência de partida

| ID | Fonte local | Observação confirmada |
|---|---|---|
| E01 | `app/package.json`; `app/package-lock.json`, entradas `packages[node_modules/…]` | Expo resolvido 54.0.31, React 19.1.0 e RN 0.81.5. Reanimated resolve 4.1.6 dentro de `~4.1.1`. Worklets resolve 0.10.2 e declara peer RN `0.83 - 0.86`, incompatível com RN 0.81.5. |
| E02 | Mesmo lock | `react-test-renderer` 19.2.7 exige React `^19.2.7`. `jest-expo` 57.0.1 exige `@react-native/jest-preset ^0.86.0` e instala renderer 19.2.3, cujo peer é React `^19.2.3`. |
| E03 | Mesmo lock; `app/jest.config.js`; `app/__mocks__/test-renderer.js` | RNTL 14.0.1 exige `test-renderer ^1.0.0`, ausente como pacote no lock. O mapper fornece um adaptador de execução Jest, não resolve peers npm nem demonstra compatibilidade do renderer. Jest resolve 29.7.0; tipos Jest resolvem 30.0.0, desalinhamento a rever sem presumir falha. |
| E04 | `app/__tests__/contexts/CommunitiesContext.test.tsx:11`; `app/tsconfig.json` | Importa contexto removido; tem um teste ativo e quatro testes vazios `it.skip`. O tsconfig inclui os testes. Não recuperar Comunidades para satisfazer a suite. |
| E05 | `.github/workflows/ci.yml`; `.github/workflows/eas-build.yml` | CI instala/testa apenas `app`, Node 20 sem patch. EAS independente instala CLI sem versão e só pede Android. Não há gate backend ou contratos nem dependência de qualidade para a build. |
| E06 | `backend/package.json`; ambos os `package-lock.json` | Backend tem `npm test` → `node --test`; ambos os lockfiles são versão 3. Existe lock backend: verificar e preservar, não tratar como ausente. |
| E07 | validation-coordinator.json (fonte reservada da revisão histórica, `validation-coordinator.json`) | Backend 9/9 com mocks em Node 26.12.1; app bloqueada por `ENOTCACHED test-renderer` numa tentativa offline. Lint/tsc/Jest da app não executados. CI 29200112697 e EAS 29200112661 falharam na instalação; causa remota exata não estabelecida pelos logs disponíveis. |

Esta cópia contém 199 ficheiros de texto verificados e não é um checkout Git. Assets binários estão ausentes por limitação da recolha. Não usar esta cópia incompleta para concluir que export/build falham no repositório completo. Os harnesses que reproduzem defeitos não são testes de regressão aprovados: têm de passar a exigir comportamento corrigido pelos responsáveis.

## Decisão de compatibilidade

Ponto de partida conservador: manter a geração SDK 54; não atualizar apenas React, RN ou preset para acomodar os peers atuais. A matriz abaixo é **candidata fundamentada**, não uma instalação validada. Não atualizar automaticamente para o SDK mais recente. Se não houver imagem iOS/toolchain utilizável ou surgir incompatibilidade não resolúvel, A2/A9 propõem uma atualização conjunta com nova evidência antes de alterar a matriz.

| Componente | Base candidata | Evidência e condição de confirmação |
|---|---|---|
| Expo | 54.0.31 já resolvido; patches 54 avaliados por necessidade | O [anúncio SDK 54](https://expo.dev/changelog/sdk-54) identifica RN 0.81/React 19.1. Registar patch final e mapa do pacote efetivamente instalado. |
| React / react-dom / RN | 19.1.0 / 19.1.0 / 0.81.5 | [Mapa oficial sdk-54](https://raw.githubusercontent.com/expo/expo/sdk-54/packages/expo/bundledNativeModules.json) coincide com os valores locais. |
| Reanimated / Worklets | `~4.1.1` / **0.5.1** | Mesmo mapa oficial; patch Reanimated final fica no lock. Reanimated 4 exige New Architecture, condição documentada no anúncio SDK54; A9 confirma configuração nativa efetiva. |
| jest-expo | `~54.0.18`, sujeito ao mapa do patch Expo escolhido | [Manifesto oficial sdk-54](https://raw.githubusercontent.com/expo/expo/sdk-54/packages/jest-expo/package.json) consultado: 54.0.18, dependências Jest 29 e renderer exato 19.1.0. Não transportar o preset 57. |
| Jest / tipos Jest | 29.7.0 / linha 29 compatível | Jest 29 já está no lock e no contrato do preset 54; fixar patch dos tipos após conferir manifesto publicado. Não declarar esse patch verificado nesta especificação. |
| RNTL / renderer | 13.3.3 / **19.1.0** | [Tag oficial RNTL v13.3.3](https://raw.githubusercontent.com/callstack/react-native-testing-library/v13.3.3/package.json): peers Jest ≥29, React ≥18.2, RN ≥0.71 e renderer ≥18.2. A mesma tag usa React/renderer 19.1.0 em desenvolvimento. Isto fundamenta a candidata e não substitui executar testes. |
| Node / npm | Node **22 LTS** com patch e npm exatos a selecionar e registar na implementação | [Calendário oficial Node](https://nodejs.org/en/about/previous-releases): em 2026-11-08 Node 22 está LTS e Node 20 EOL. SDK54 anunciou mínimo Node 20.19.4; escolher patch 22 mantido e confirmar engines de toda a árvore, backend e toolchain EAS. Não herdar Node20 nem considerar o ensaio local Node26 a referência suportada. |
| EAS CLI / Expo Doctor / imagem iOS | Versões exatas a verificar e fixar com A9 | [Infraestrutura Expo](https://docs.expo.dev/build-reference/infrastructure/) permite imagem nomeada e configuração de ferramentas. Não usar `latest`, CLI global flutuante ou apenas `>=16` como prova de reprodutibilidade. |

Fontes consultadas em 2026-11-08. Os URLs `docs.expo.dev/versions/v54.0.0/` e `/sdk/reanimated/` redirecionaram para `latest`: não foram usados como prova da geração 54. A branch `sdk-54` é mutável; na implementação guardar URL/commit ou hash do conteúdo e comparar com `node_modules/expo/bundledNativeModules.json` da versão fixada. A [documentação atual de testes Expo](https://docs.expo.dev/develop/unit-testing/) descreve a geração atual; não aplicar automaticamente as suas versões/API à candidata histórica 54/13.

## Critérios de aceitação

| ID | Resultado mensurável | Evidência obrigatória |
|---|---|---|
| GL-002-AC01 | Matriz final sem peers inválidos/em falta e com runtime nativo alinhado ao SDK; um React e um par Reanimated/Worklets efetivo. Zero uso de `--force`, `--legacy-peer-deps` ou overrides para esconder incompatibilidade. | `npm ls --all` sem erros em app/backend; `expo install --check` e Expo Doctor sem falhas; mapa final, versões/engines e duplicados revistos. Qualquer exclusão de Doctor precisa de evidência específica e não pode esconder falha runtime. |
| GL-002-AC02 | Duas instalações limpas independentes de app e backend terminam com código 0 usando `npm ci` normal: uma sem cache prévia e outra com cache. Manifestos e locks mantêm hashes iguais antes/depois; árvore relevante igual entre ensaios. | Logs, versões Node/npm exatas, hashes SHA-256 dos quatro ficheiros e árvore resolvida. Cache acelera, não substitui instalação nem transporta `node_modules`. |
| GL-002-AC03 | Zero imports para módulos de Comunidades removidos nos testes executáveis; remover suite obsoleta e quatro skips vazios. Zero mapper/adaptador local `test-renderer` usado para contornar APIs incompatíveis. | Revisão do diff, pesquisa de referências e suite inteira; avaliar/remover a declaração manual `src/types/react-test-renderer.d.ts` se mascara tipos reais. Sem `passWithNoTests`, testes ocultados por exclusão global ou skips adicionados para obter verde. |
| GL-002-AC04 | Testes ativos preservados e pelo menos um cenário positivo e um negativo por fluxo aplicável: autenticação, Coach de sugestões gerais, gravação de treino e isolamento/recuperação offline. Cada teste valida resultado observável. | Relatório Jest com contagem pass/fail/skip e ligação aos AC funcionais dos responsáveis. A2 integra infraestrutura; responsáveis dos fluxos fornecem cenários finais. Coach não é validado por promessas de personalização inexistente. |
| GL-002-AC05 | App: lint com zero erros/avisos, tsc zero erros incluindo testes, Jest completo zero falhas e export iOS com código 0 no checkout completo do SHA candidato. | Logs e relatórios por comando, sem `continue-on-error`; export Metro não conta como compilação/execução iOS. |
| GL-002-AC06 | Backend: instalação e suite `node --test` verdes na versão Node fixada; os 9 casos existentes preservados ou substituídos com justificação e regressões aplicáveis adicionadas pelos responsáveis. | Relatório com zero falhas e zero testes pendentes sem justificação; mocks identificados. Falhas de ownership, pagamentos ou dados só ficam resolvidas quando os testes exigem o comportamento corrigido. |
| GL-002-AC07 | Job dedicado de contratos app/backend tem zero falhas, valida consumidor e resposta/erro do servidor com fixtures comuns, sem depender de fornecedores reais; inclui pelo menos sucesso, erro de autenticação e payload inválido. | Comando versionado `npm run test:contracts` a introduzir no backend, schemas/fixtures/testes acordados com A3 e responsáveis de pagamentos/dados, relatório rastreável ao SHA. Não duplicar apenas um objeto esperado em mocks sem validar ambas as partes. |
| GL-002-AC08 | Quality gate exige app, backend, contratos e export bem-sucedidos no mesmo SHA. Falha, skip, cancelamento ou timeout em qualquer um impede build candidata e promoção, incluindo arranque manual. | Quatro ensaios negativos isolados: erro lint, erro tsc, teste backend falhado e contrato quebrado. Em cada um: gate falha e **0 builds candidatas/submissões/promoções**. Ensaiar também cancelamento/skip e rejeitar evidência de SHA anterior. |
| GL-002-AC09 | Handoff A9/A10 aceite com SHA, hashes dos locks, matriz final, toolchain, relatórios e limitações. Estado de CI e estado nativo separados. | Recibo de entrega. A9 devolve ID da build assinada, versões imagem/Xcode e bundle/buildNumber; A10 devolve ensaio em iPhone/TestFlight. Até lá, campo `native_validation=pending` e promoção TestFlight bloqueada. |

## Fronteiras e bloqueios

GL-002 pode preparar tooling em paralelo com os P0; isso não autoriza beta com P0 aberto. A promoção depende da confirmação dos restantes responsáveis: isolamento de contas/dados, pagamentos exclusivamente sandbox, configuração de staging, política de acesso e Coach de sugestões gerais. Aprovação Apple/pública não faz parte deste resultado.

Pendências concretas: patch Node22/npm, patch dos tipos Jest, Expo Doctor/EAS CLI fixados; disponibilidade/compatibilidade da imagem iOS com A9; logs completos das falhas remotas; checkout completo com assets; testes de contratos acordados com A3; cenários funcionais dos restantes responsáveis; controlos de branch/environments existentes não consultados. Nenhuma destas pendências impede escrever o plano; impedem declarar AC cumpridos.
