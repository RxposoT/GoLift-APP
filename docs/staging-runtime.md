# Runtime de staging gratuito

## Preparação e dependências

O template [Render Free](../infra/render.staging.yaml.example) é um exemplo para aplicação deliberada. O provisionamento aguarda [acessos e orçamento #5](https://github.com/RxposoT/GoLift-APP/issues/5), uma vaga de projeto Supabase Free e a [baseline SQL #17](https://github.com/RxposoT/GoLift-APP/issues/17). A sua aplicação cria um serviço e pode iniciar o primeiro deploy. `autoDeployTrigger: off` controla os deploys automáticos seguintes.

Antes de aplicar o template, A0 confirma a conta, os limites de consumo e o plano Free. A9 escolhe o SHA integrado com CI aprovada e configura os segredos no Render. O custo imediato aprovado é 0 €. O teto de 150 € do próximo mês inclui a adesão Apple.

## Configuração

- Runtime Node 22.23.4 e npm 10.9.9. O build confirma ambas as versões antes de `npm ci` e termina se diferirem. A versão Node é fixada por `NODE_VERSION`. A distribuição Node aprovada inclui a versão npm esperada.
- `PORT` é fornecida pelo Render e a app escuta em `0.0.0.0`. O valor local inicial é 3001.
- `APP_ENV=staging` ativa validações obrigatórias antes de importar a app e os clientes externos.
- `SUPABASE_URL` é a origem HTTPS do projeto de staging e coincide com `STAGING_SUPABASE_URL`. `PRODUCTION_SUPABASE_URL` é apenas a referência pública de comparação. As origens têm de ser distintas.
- `SUPABASE_SERVICE_KEY` pertence ao projeto staging e fica nos segredos do serviço. A configuração valida presença e isolamento de URLs. A9 confirma efetivamente a correspondência da chave ao projeto durante o bootstrap.
- `SERVER_URL` recebe a URL HTTPS pública deste backend. `CLIENT_URL` segue a configuração aprovada dos consumidores. Esta fatia preserva o CORS existente.
- `NOTIFICATION_SCHEDULER_ENABLED=false` é obrigatório em staging. Stripe pode ficar desligado. Quando configurado em staging, exige chave `sk_test_`. Gemini é opcional para esta beta de sugestões gerais.

O modo legado com `APP_ENV` ausente mantém os valores e o scheduler por omissão. Uma migração futura de produção para configuração explícita segue tarefa e aprovação próprias.

## Validação e operação

`GET /api/health` mantém o body público de liveness. A resposta comprova que o processo arrancou. Schema, RLS, contas sintéticas A/B, credenciais e funcionalidades têm verificação própria na baseline #17 e no bootstrap #5.

Render Free suspende o processo após inatividade e pode reiniciá-lo. O filesystem é efémero. O staging usa persistência Supabase e tem os schedulers desligados. A ativação de notificações agendadas precisa de uma solução operacional própria.

Executar `node --test` em `backend` com Node 22.23.4. Os testes isolam configuração/arranque, incluindo falhas antes de importar a app, e mantêm os testes existentes de ownership. O deploy e as chamadas remotas são passos posteriores com evidências anexadas à tarefa #5.

Fontes oficiais consultadas em 2026-11-08. [Blueprint Render](https://render.com/docs/blueprint-spec), [versão Node](https://render.com/docs/node-version), [limites Free](https://render.com/docs/free).
