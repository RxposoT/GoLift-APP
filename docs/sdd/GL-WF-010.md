# GL-WF-010 — Preparação do runtime de staging gratuito

Estado proposto para revisão A0. Esta fatia prepara código e um template de infraestrutura com orçamento imediato de 0 €. A execução de serviços depende das tarefas [#5](https://github.com/RxposoT/GoLift-APP/issues/5) e [#17](https://github.com/RxposoT/GoLift-APP/issues/17).

## Contrato de configuração

- `APP_ENV` admite `local`, `staging` e `production`. A ausência preserva o arranque legado.
- Em staging, `PORT` é inteiro entre 1 e 65535, com valor inicial 3001.
- `SUPABASE_URL`, `STAGING_SUPABASE_URL` e `PRODUCTION_SUPABASE_URL` são origens HTTPS explícitas. A origem ativa coincide com staging e difere de produção.
- `SUPABASE_SERVICE_KEY` é obrigatória em staging. A presença da chave é validada localmente. A correspondência efetiva entre credencial e projeto é um gate da configuração de staging.
- `NOTIFICATION_SCHEDULER_ENABLED` admite `true` ou `false`. Em staging, assume `false` e recusa `true`. O modo legado mantém o scheduler ativo por omissão.
- Uma chave Stripe configurada em staging tem de começar por `sk_test_`. Gemini é opcional nesta beta de sugestões gerais.
- A validação acontece antes de importar a app e os módulos que inicializam clientes externos. O scheduler é importado apenas quando ativado.

## Critérios de aceitação

1. Configuração staging incompleta, origem de produção, porta inválida, scheduler ativo ou chave Stripe live interrompem o arranque antes de importar a app.
2. Staging válido abre o servidor em `0.0.0.0` e preserva o contrato `GET /api/health`.
3. Staging mantém os timers de notificações desligados. O arranque legado continua a iniciar o scheduler.
4. Erros identificam a variável inválida sem imprimir credenciais.
5. Os testes backend existentes e os testes isolados de configuração/arranque passam com Node 22.23.4.
6. O template Render explicita plano Free, versões de ferramentas, porta fornecida pela plataforma e auto-deploy desligado. A primeira aplicação do template aguarda a baseline ratificada e os acessos.

## Entrega e operação

Implementar validador puro, adaptar os pontos de arranque, atualizar exemplos e preparar template Render. Separar os commits de contrato, runtime, testes e infraestrutura. A0 revê o SHA e a CI antes do merge para develop.

Esta fatia conserva o comportamento CORS atual. A criação de staging continua dependente da quota de projetos gratuitos e do acesso ao Render. O health existente comprova liveness do processo. Schema, RLS e contas sintéticas A/B são validados na baseline #17 antes de disponibilizar funcionalidades.

Rollback através de PR de revert. Credenciais e implantação permanecem ações separadas do código preparado.
