# Releases iOS e ambientes GoLift

## Responsáveis e gates

A0 coordena o candidato integrado. A9 prepara os builds e A10 regista QA no SHA e no ID EAS. Tomas aprova a promoção para `main` e o environment `production`.

O workflow `iOS Release Gates` é manual. Cada execução recebe o SHA completo do HEAD de `develop` para beta ou de `main` para produção. Exige as últimas execuções de push de `ci.yml` e `governance.yml` concluídas com sucesso, com os jobs `CI Gate` e `Workflow Governance` aprovados nesse SHA. O workflow usa a versão Node fixada em `.nvmrc` e EAS CLI 27.5.0.

O preflight consulta o GitHub environment antes do job com credenciais. O environment `production` tem de existir, exigir exclusivamente `RxposoT` como reviewer, manter `prevent_self_review=true` e `can_admins_bypass=false`. A0 confirmou estes valores no remoto durante o bootstrap. Valor ausente ou incompatível exige rever a configuração/API antes de executar. A política remota permite deploy de produção a partir de `main`. Tags identificam versões aprovadas.

Com a identidade GitHub única atual, uma release/deployment iniciado por Tomas fica bloqueado pela revisão independente. A configuração de uma identidade de automação distinta é uma dependência de produção. O gate mantém-se ativo durante esse bloqueio. [Tarefa de identidade de automação #6](https://github.com/RxposoT/GoLift-APP/issues/6)

## Configuração necessária antes do primeiro build

Preparar orçamento e aprovação para backend staging, projeto Supabase staging, dados sintéticos, Stripe test, analytics separado e notificações limitadas a dispositivos internos. A9 confirma os recursos e documenta os endpoints antes de definir `RELEASE_INFRA_READY=true`. [Tarefa de infraestrutura staging #5](https://github.com/RxposoT/GoLift-APP/issues/5)

Configurar os GitHub environments `staging` e `production` com os seguintes valores.

| Tipo | Nome | Conteúdo |
|---|---|---|
| Variable | `RELEASE_INFRA_READY` | `true` após validação do ambiente |
| Variable | `EXPO_PUBLIC_BACKEND_URL` | URL HTTPS do backend desse ambiente |
| Variable | `EXPO_PUBLIC_SUPABASE_URL` | URL HTTPS do projeto desse ambiente |
| Secret | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon/publishable desse projeto |
| Variable | `EXPO_PUBLIC_POSTHOG_HOST` | Host de analytics desse ambiente, opcional |
| Variable | `EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN` | Token público de analytics desse ambiente, opcional |
| Variable | `PRODUCTION_BACKEND_URL` | Origem HTTPS aprovada de produção |
| Variable | `PRODUCTION_SUPABASE_URL` | Origem HTTPS aprovada de produção |
| Variable | `IOS_BUNDLE_IDENTIFIER` | Identificador registado no Apple Developer |
| Variable | `ASC_APP_ID` | ID numérico da app no App Store Connect |
| Variable | `TESTFLIGHT_QA_ISOLATED` | `true` após confirmar isolamento do grupo QA |
| Secret | `EXPO_TOKEN` | Credencial Expo de automação limitada ao projeto |

As URLs de produção são referências públicas de comparação. Staging exige origens distintas de produção. As chaves `service_role`, Stripe e fornecedores pertencem exclusivamente ao backend ou aos jobs de ambiente que as utilizem. `EXPO_PUBLIC_*` é compilado na app e contém apenas valores públicos.

Configurar certificados, provisioning profiles e credencial Apple de submissão no EAS para a app correta. Rever os ambientes EAS `development`, `preview` e `production`. O workflow injeta os valores públicos validados no perfil EAS selecionado antes do build. Configuração gerada é efémera no runner. O perfil `beta` utiliza `preview`, compila para iPhone e assinala staging. O desenvolvimento local usa `http://localhost:3001`, ajustável para o IP local do dispositivo.

No App Store Connect criar os grupos internos `GoLift QA` e `GoLift Internal`. Desativar distribuição automática e confirmar que uploads QA chegam exclusivamente a `GoLift QA`. Só então definir `TESTFLIGHT_QA_ISOLATED=true`. Essa variável regista uma verificação operacional, cuja prova deve acompanhar o bootstrap Apple.

## TestFlight em três passos

1. Executar `beta-build` na ref `develop` com o SHA aprovado. Guardar o ID do build exibido no resumo e o ID da execução GitHub. A execução emite o artefacto `ios-build-receipt-<SHA>-beta`, contendo `build-receipt.json`.
2. Executar `beta-upload-qa` no mesmo SHA e fornecer `build_id` e `build_run_id`. O preflight exige uma execução deste workflow, neste repositório/branch/SHA, com evento manual e conclusão aprovada. Descarrega o recibo único dessa execução, verifica tentativa, ID EAS e fingerprint da configuração pública atual. O metadata EAS atual tem de confirmar plataforma iOS, estado concluído, projeto EAS, bundle, distribuição STORE, dispositivo físico, perfil e hash. EAS Submit faz upload para o grupo `GoLift QA`.
3. Após processamento Apple, A10 instala esse build via TestFlight em iPhone e regista versão/build, SHA, ID EAS e resultados dos critérios de aceitação num issue, PR ou execução do próprio repositório.
4. Executar `beta-distribution-review` com esses IDs e a URL da evidência QA. O job verifica novamente recibo, proveniência e CI e regista o gate no resumo. A9 atribui manualmente o mesmo build processado ao grupo `GoLift Internal` no App Store Connect e anexa a confirmação à evidência.

A atribuição final ao grupo interno é uma ação manual explícita. O job regista a evidência para essa ação. Cada nova compilação passa novamente pelo percurso QA.

O recibo liga SHA, perfil, projeto, bundle, distribuição, ID de build, execução/tentativa e fingerprint da configuração pública compilada. O fingerprint cobre a configuração Expo, o perfil EAS com URLs/chaves públicas/analytics explícitos e o ID Apple. O artefacto guarda apenas o hash dessa configuração. Alterar qualquer valor exige novo build. Um ID EAS externo, mesmo com SHA e perfil iguais, exige a execução e o recibo confiáveis correspondentes.

## Produção

Preparar PR de release com os commits já revistos e a evidência do candidato. Após aprovação de Tomas e merge para `main`, executar `production-build` através da identidade de automação autorizada e obter a aprovação do environment. Executar `production-upload` com o ID do build e da execução GitHub resultantes, repetindo a aprovação protegida e a validação do recibo. Esse passo faz upload para App Store Connect. A revisão Apple e a publicação pública têm aprovação e registo próprios.

O artefacto de staging contém endpoints staging. O build de produção recompila o SHA aprovado com a configuração de produção e precisa de validação nesse ambiente antes da publicação. Registar SHA, tag, versão/build, ID EAS e versão da base de dados no relatório de release.

## Falhas, rollback e verificações

Um ambiente ausente, proteção incompleta, CI falhada, SHA diferente do integrado, chave privada na app ou URL incompatível interrompe o processo antes de EAS Build/Submit. URLs, bundle ID e credenciais ausentes exigem completar a tarefa de infraestrutura.

Para retirar uma beta defeituosa, remover o build dos grupos no App Store Connect e identificar o último build aprovado. Reverter código por PR e gerar novo build. Para backend, conservar artefactos anteriores e aplicar migrações compatíveis expand/contract. Correções de dados seguem migração corretiva revista por A5.

Executar `node --test .github/release/*.test.cjs` para validar os guards. A prova de ponta a ponta exige configuração GitHub/EAS/Apple e um build QA real. Os testes locais cobrem ref/SHA, reviewers adicionais, bypass, CI/governance, recibos, configuração divergente, execução incorreta e proveniência, com APIs simuladas e valores sintéticos. Os campos EAS foram confirmados no código da versão fixada. [BuildFragment de EAS CLI 27.5.0](https://github.com/expo/eas-cli/blob/78197795197f67b4deaf490d671c75dd9b81cb12/packages/eas-cli/src/graphql/types/Build.ts)

Referências oficiais consultadas em 2026-11-08 para os comandos de CI, grupos internos e submissão. [EAS CI](https://docs.expo.dev/build/building-on-ci/), [TestFlight](https://docs.expo.dev/submit/testflight/), [EAS CLI](https://docs.expo.dev/eas/cli/).
