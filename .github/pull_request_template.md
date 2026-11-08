## Tarefa e resultado

GL-ID, ligação à spec aprovada e resultado observável desta entrega.

## Alterações

Descrever a funcionalidade ou correção. Identificar alterações de contrato e migrações.

## Evidências

- [ ] Critérios de aceitação identificados e verificados
- [ ] CI do head atual aprovada
- [ ] Ficheiros gerados e assets binários revistos, quando aplicável
- [ ] Falhas, retries e compatibilidade verificados quando relevantes
- [ ] Riscos e procedimento de rollback descritos

## Relatório do agente revisor

O A0 confirma a revisão por um agente diferente do autor e publica o relatório abaixo com o SHA completo atual. Uma alteração ao head exige nova revisão e novo relatório. Este registo operacional é distinto de uma aprovação GitHub por outra conta.

```text
A0-REVIEW head=<40-character-sha> result=approved
author_agent=<agent>
reviewer_agent=<different-agent>
acceptance_criteria=<IDs and results>
tests=<commands, results and evidence>
generated_and_binary=<reviewed paths or none>
blockers=<none or unresolved items>
a0_verification=<confirmed by orchestrator>
```

## Release para main

- [ ] Promoção dos commits de develop revistos e manifesto com SHA e build
- [ ] Aprovação explícita do utilizador para integração em main
- [ ] Aprovação explícita do utilizador para deployment de produção
- [ ] Migrações compatíveis, configuração do ambiente e rollback confirmados
