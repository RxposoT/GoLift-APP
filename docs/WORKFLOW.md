# Workflow de desenvolvimento GoLift

## Branches, agentes e worktrees

`main` é a referência de produção. `develop` integra funcionalidades para staging e beta interna TestFlight. Cada tarefa aprovada tem uma branch, uma worktree, um agente autor e um PR. A0 mantém até três especialistas ativos, reserva ficheiros partilhados e integra PRs um de cada vez.

O checkout principal fica como referência. A implementação acontece numa worktree ligada em `.worktrees/<GL-ID>-<slug>`. Confirmar a branch e a pasta antes de editar. O helper valida o destino, recusa caminhos reutilizados e cria a branch a partir de `origin/develop`.

```sh
git fetch --prune origin
node scripts/worktree.mjs hooks
node scripts/worktree.mjs create GL-003A fix session-owner
```

Executar estes comandos num checkout com os scripts já integrados, Node 22 e Git 2.35 ou superior. Entrar na worktree indicada e ler `AGENTS.md`. O instalador copia hooks e política para o gitdir comum, com caminho absoluto e independente dos scripts do checkout principal. Repetir a instalação após atualizar a política.

Branches seguem `<tipo>/<GL-ID>-<slug>`, por exemplo `fix/GL-003A-session-owner`. Os tipos aceites pelo helper são feat, fix, docs, chore, refactor, test, ci, perf e build. Hotfixes partem do SHA aprovado de main e regressam por PR a main e develop. A0 prepara estes casos deliberadamente, fora do helper de features.

## Ciclo SDD e entrega

1. A0 aprova spec, critérios de aceitação, contratos, ficheiros reservados e dependências da fatia.
2. O autor implementa na sua worktree e faz commits após cada alteração coerente. Comunica progresso a cada 30–60 minutos de trabalho.
3. O autor publica a branch e abre um PR Draft para develop com evidências e rollback. Uma tarefa grande divide-se antes da implementação.
4. Outro agente revê o SHA completo atual, os critérios de aceitação e o diff, incluindo ficheiros gerados e binários.
5. A0 verifica o relatório, a ausência de bloqueios e a CI atual. Depois integra por merge commit, preservando os commits da feature.
6. Depois do merge, A0 atualiza a tarefa. Remove a worktree apenas quando está limpa, o trabalho está no remoto e a branch está integrada.

Um autor por migração. Contratos partilhados entram primeiro e os consumidores dependem desse SHA. Resolver conflitos na worktree da feature, repetir a validação e atualizar o relatório. Branches publicadas recebem commits adicionais e merges de develop. O histórico partilhado permanece preservado.

## Commits e dimensão

Mensagens usam Conventional Commits, por exemplo `fix(auth): validar proprietário da sessão`. Cada commit cobre uma alteração funcional coerente.

| Unidade | Linhas manuais alteradas | Ficheiros |
|---|---|---|
| Commit | Até 300, contando adições e remoções | Até 10 |
| PR de feature ou hotfix | Até 500, contando adições e remoções | Até 15 |

Lockfiles package-lock.json, yarn.lock e pnpm-lock.yaml são identificados como gerados e excluídos apenas da contagem de linhas. Todos contam para o limite de ficheiros. O revisor verifica o respetivo diff. Assets binários exigem inspeção explícita. A promoção release/* para main pode agregar várias features já revistas quando o head pertence ao histórico de origin/develop. Os commits individuais continuam sujeitos aos limites. As alterações adicionais de merges são medidas contra o merge automático e têm revisão explícita.

```sh
node scripts/governance.mjs staged
node --test scripts/governance.test.mjs
node scripts/governance.mjs range <base-sha> <head-sha> develop fix/GL-003A-session-owner
```

O hook pre-commit bloqueia commits em main, develop, release/*, HEAD destacado e checkout de referência. O hook commit-msg valida a mensagem. Os hooks locais podem ser contornados pelo Git, por isso a proteção remota e a revisão A0 completam o controlo. A CI `Workflow Governance` corre também em PRs documentais, verifica os commits e o tamanho acumulado e testa a política com repositórios descartáveis.

## Review e integração

O template do PR inclui `A0-REVIEW head=<sha> result=approved`, autor, agente revisor, AC, testes, ficheiros gerados/binários, bloqueios e confirmação A0. Cada novo head invalida esse relatório. A0 exige nova revisão antes do merge. Este é um gate operacional verificável no PR.

As branches protegidas main e develop exigem PR, `CI Gate`, `Workflow Governance`, branch atualizada, conversas resolvidas e proteção aplicada aos administradores. Force push e eliminação estão bloqueados. Develop permite integração pelo A0 após os gates. Main exige uma aprovação de review GitHub.

Agentes que usam a mesma identidade GitHub dependem da confirmação A0 da independência do agente revisor. Essa identidade não consegue aprovar o próprio PR como reviewer GitHub distinto. Com uma única identidade, a release para main fica bloqueada até existir um autor de PR distinto e um reviewer elegível.

## Staging, release e produção

Cada release tem um manifesto com SHA, PRs, evidências, build, migrações e rollback. A beta interna usa staging isolado, pagamentos sandbox e Coach com sugestões gerais identificadas. O gate TestFlight distingue upload para QA, instalação no dispositivo e abertura ao grupo interno.

A0 promove os commits aprovados de develop para release/<versão> e prepara o PR para main. O utilizador aprova explicitamente a integração e o deployment de produção. A aprovação de uma etapa não implica aprovação da outra.

O ambiente GitHub production exige o reviewer RxposoT e impede autoaprovação pelo iniciador do deployment. Enquanto a única identidade inicia e aprova os workflows, esse gate fica bloqueado. Configurar uma identidade de automação distinta e elegível antes da primeira release de produção.

Publicar artefactos ligados ao SHA aprovado. Alterações de schema usam migrações versionadas e compatíveis. A promoção de produção e o rollback seguem o runbook de release com aprovação humana.
