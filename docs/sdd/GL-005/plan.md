# GL-005 — Plano técnico e de verificação

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: Draft, apenas planeamento. Requisitos e contratos: [spec.md](spec.md). Nenhuma migração, implementação ou prova nova foi executada. A ordem abaixo prepara trabalho futuro; não autoriza ambientes ligados.

## Sequência e propriedade

### 1. Fechar os contratos e conter P0 em paralelo

A0 ratifica as fatias GL-005A/B/C. A1 fecha autorização e RPCs métricas; A3 fecha ownership/erros em GL-003A com contrato atual. Não esperar por uma fila durável para estas correções. A5/A1 revêm os wrappers cliente definer com auth.uid e os wrappers IA invoker/service-only, incluindo overloads, owners, grants e schema exposto. Service key fica exclusivamente no backend.

A3/A5 fixam C-GL005-IA-v1 como contrato comum, sem duplicar a máquina de estados em GL-003. A7/A0 ratificam fórmula XP, limites de séries/peso/tempo e UX de conflito; A6/A0, retenção/descarte/logout e limites locais. Após GL-004 ratificado, A5 reserva a migração/constraints/ACL billing, separadas dos recibos IA/offline. O contrato A4 prevê deduplicação evento+ambiente, reconciliação serializada por conta com lease/fence e leitura do estado vigente no Stripe; commit local atómico do evento, binding, subscrição e projeção de direitos. Intenção de checkout e idempotency key externa precedem reconciliação; não há atomicidade com o fornecedor.

### 2. Inventariar e definir a baseline

Repetir a leitura estática no checkout completo do SHA a implementar; o snapshot não é um checkout e não contém binários. Mapear os scripts e extratos já recolhidos para um manifesto com checksums, identificando o SQL ausente das quatro migrações live. Nesta fase usar apenas estes ficheiros. Uma futura recolha autorizada de DDL/metadados fecha a baseline; ausência de conteúdo bloqueia declarar igualdade de upgrade.

Inventariar todos os consumidores de INSERT/UPDATE/DELETE, RPCs e AsyncStorage, incluindo chamadas diretas fora de wrappers. Marcar o dono de cada ficheiro antes de editar: A6 AuthContext/auth/perfil; A7 treino/métricas/resumo; A3 IA/plano; A1 segurança; A5 serviços de persistência e SQL. Não sobrescrever correções de outros donos com schema completo antigo.

Definir caminho único de instalação e upgrades suportados. Corrigir o percurso de 004 sem alterar retroativamente uma migração aplicada. Scripts reset/completo não são mecanismo de upgrade. Preparar apenas depois da autorização de implementação uma BD isolada com duas identidades sintéticas; nenhuma dependência em dados reais.

### 3. Expandir schema, diagnosticar e validar

Primeiro DDL aditiva: versões, sessão local, prescrição, recibos privados, FKs/índices e peso com tombstone. Criar diagnóstico separado para relações inválidas, sessões parciais, duplicados, calendários e saldos. Dados inválidos não são apagados nem reatribuídos automaticamente; o responsável decide remediação documentada. Backfills de versões válidas não atribuem XP retroativo ou intenções antigas.

Validar constraints em etapa própria após diagnóstico/backfill. Dimensionar locks e índices com dados sintéticos representativos; CONCURRENTLY apenas quando necessário e fora da transação, com recuperação de índice inválido. Inventariar defaults/ACL/RLS/owners/triggers/funções além das colunas. Um autor por migração, IDs novos sem colisão com histórico live; A1 revê conteúdo de segurança e A4 as estruturas de pagamentos quando definidas.

### 4. Implementar mutações transacionais e XP

Recibo comum vinculado a ator/tipo/UUID/hash. Construir write_workout, complete_workout_session e mutate_weight sem chamadas externas: uma transação por mutação, locks uniformes, constraints e resultado no mesmo commit. Auth.uid é a única identidade cliente. Verificar contagem real e resultados Supabase; zero linhas inesperadas é erro.

Sessão integra séries e crédito, verificando versão do treino e UUID local. Calcular histórico anterior e saldo sob lock de perfil, guardar crédito/regra na sessão. A7 retira escrita ao montar resumo premium e usa confirmação comum free/premium. Só depois de migrar consumidores, revogar writes diretos que contornem a operação. Tratar também deleteEntry e caminhos de delete/edição existentes: não deixar uma via antiga sem versão; desativação de ação exige decisão explícita de âmbito beta.

Provar falhas reais em PostgreSQL isolado em cada etapa, concorrência e timeout após commit. Mocks podem testar mapping/erro, mas não aprovam esta etapa. É condição para integrar retries automáticos da app.

### 5. Isolar o armazenamento e recuperar trabalho

Migrar chaves privadas para uid/schema; invalidar chaves legadas sem dono. A6 gere mudança de identidade e geração de pedidos. Uma resposta antiga não atualiza a nova conta. Caches vazios remotos são autoritativos; overlay da fila usa só o mesmo uid. TTL e atualização do consumidor têm comportamento observável.

Rascunho/outbox por uid em envelope durável e mutex comum. Persistência crítica propaga erro. Integrar treino e peso; não adaptar o helper genérico atual aceitando table/payload arbitrários. Um processador por runtime, payload imutável após primeiro envio, ACK/removal serializado, backoff e conflitos por código. Peso de uma semana encadeia versões após ACK, sem alterar operação tentada.

Guardar a intenção IA mínima antes do POST sob responsabilidade A3; sem reenvio automático do modelo pela fila offline. Implementar limites/idade/retoma/descarte ratificados e logout que preserva trabalho só para o mesmo uid. A6 inclui eliminação do namespace no fluxo de conta. A7 fornece ecrãs/strings PT-PT de pendente/confirmado/falha/conflito e tempo do rascunho, respeitando o design existente.

### 6. Integrar GL-003B sem máquina paralela

Implementar begin/commit/failure com lease de relógio BD, fence monotónico e replay. IA fora da transação; retenção sem GC beta; remoção de pedido bruto redundante após finalização. Todos os caminhos revalidam ator/objeto/direito. Lease antiga não confirma nem liberta uma nova tentativa.

Plano: mesma linha mensal, CAS na criação/update e período reservado. Importação: leitura da versão/plano próprios, resolução determinística de catálogo e prescrição completa, tudo na mesma transação. Feedback: sessão própria concluída, reserva por alvo antes do modelo, first-write com UNIQUE final; nunca upsert. A3 migra o wire e os consumidores pela fonte futura contracts/http/openapi.yaml. Sem preservação integral da prescrição, a importação fica fechada por decisão A0.

### 7. Verificar e integrar com o binário QA

Comparar instalação limpa e upgrades por manifesto normalizado. Testar como anon/A/B/service role e REST/RPC direto, não apenas pelos botões. Registar SHA/schema, configuração e exclusões ambientais. Backend e app usam contratos compatíveis, sem fallback para escrita parcial ou actor do body.

A2 executa checks relevantes no toolchain suportado; A10 revê asserções e evidências. A9 prepara o upload QA autorizado e depois o iPhone demonstra fecho/reabertura, modo avião, duas contas, replay e confirmação. O primeiro upload restrito QA precede a instalação TestFlight; abertura ao grupo depende destas provas. Nenhum teste nativo é dado como passado pelo planeamento.

## Evidência exigida

| Camada | Provas | Aceitação |
|---|---|---|
| SQL isolado | Instalação/upgrade; falhas por fase; duas ligações concorrentes; CAS, constraints, recibo/fence/ACL; manifesto | AC01–05, AC09–13 |
| Serviços/contratos | Pedido canónico, erros/zero linhas, IDs estáveis, resultado igual no replay, bigint/decimais/versões | AC02–05, AC09–13 |
| Local com armazenamento real/dublos de falha | 100 adds, dois processadores, crash/ACK, uid/geração, corrupção, limite/idade/logout | AC06–09, AC14 |
| Cliente | Restauro de rascunho, conflito conservado, XP confirmado, [] autoritativo e falha distinta de vazio | AC05–09 |
| iPhone candidato | Mesma conta e troca A/B; encerrar app; rede intermitente; conclusão offline e ACK uma vez | AC06–09, AC15 |

Casos XP têm fixtures de primeiro exercício/recorde/aumento/normal/zero/múltiplos/nível/replay. Casos temporais incluem segunda-feira, mudança de mês e DST Europe/Lisbon com relógio controlado. Falhas IA são dublos; esta especificação não faz chamadas ao fornecedor.

## Recuperação e rollback

Conservar dados aditivos, versões e recibos. Se integração falhar, suspender novas mutações do fluxo afetado e manter leituras confirmadas/rascunhos; não reativar grants antigos nem limpar a fila. Corrigir por migração forward. Backups/restauro e aplicação em ambiente ligado são tarefas futuras de operação com âmbito próprio.

Retirar uma build inclui inventário/drenagem de intenções suportadas antes de GC. Conta eliminada não recupera dados por replay; conta B não envia pendências A. A abertura da beta requer autorização segura, caminho de instalação reproduzível e provas dos fluxos incluídos; o documento não certifica lançamento público.
