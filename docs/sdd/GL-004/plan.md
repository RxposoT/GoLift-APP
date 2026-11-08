# GL-004 — Plano técnico

> Recuperação documental em 2026-11-08. Fonte histórica `552f989b1d55adb22bee154a61d3f0062a8da207`. Estado **Draft** para ratificação A0. Observações de código e metadados referem-se à baseline da revisão. Fontes reservadas ficam identificadas textualmente para preservar a proveniência.


Estado: **Draft**, apenas planeamento. Regras/contratos e critérios: [spec.md](spec.md). Tarefas: [tasks.md](tasks.md). Não executa operações no produto nem fornecedores.

## GL-004A — contenção compatível

1. **Reconciliar o ponto de partida.** A0 fixa checkout completo/commit atual, reservas de ficheiros e diferença face ao review. A1 confirma a proteção de plano/prazo/customer; não esperar pelo ledger para impedir alterações cliente. Identificar binding legado sem prova e caminhos que ainda não podem ser abertos com segurança.
2. **Corrigir a fronteira de identidade.** `verifySession` usa ator do JWT, compara metadata/dono e recupera relações necessárias antes de escrever. Portal exige prova confiável do customer próprio, sem lookup por email. Nem perfil editável nem sessionId pago bastam. Se a prova/serialização necessária não existir ainda, recusar o fluxo; não aceitar um fallback inseguro para preservar o sucesso.
3. **Propagar falhas de persistência.** Verificar `error`, ausência inesperada e resultado efetivo em todos os pontos existentes; webhook dá não 2xx quando a operação não foi confirmada. Não recalcular validade por entrega nem anunciar premium só por `payment_status=paid`. Sem suporte para reconciliação segura do estado/período, conter a mutação e manter erro recuperável explícito.
4. **Retirar a escrita cliente.** A4 remove UPDATE de `plano` na expiração em `plano.ts`; mantém retorno de leitura compatível quando confirmado, propaga erro e calcula só apresentação. A1 fecha grants sem exceção para despromoção. A3 alinha o predicado de premium finito nos serviços IA e A5 nos commits; A9 no job aplicável.
5. **Corrigir a confirmação falsa.** Retorno HTML não afirma subscrição ativa por query string. A7 consome confirmação do servidor e não o fecho do browser; A6 impede publicação de respostas após troca de conta. Manter campos/rotas atuais nesta fatia, incluindo body legado tolerado sem autoridade e envelope `{erro}`.
6. **Provar a contenção.** HTTP/serviços com mocks locais A/B, owner em falta, binding adulterado, erro DB/zero linhas e browser/query forjados. Registar quais fluxos foram recusados e os critérios ainda abertos. Passar contenção não prova replay/atomicidade nem aprova billing beta.

## GL-004B — integridade e contrato canónico

1. **Fechar contratos antes do código.** A0/A1/A4/A5 ratificam C-GL004-IDENTIDADE/DIREITOS/LEDGER/PORTAL-v1, política de estados, isolamento e retenção. A3/A4 incluem as operações em `contracts/http/openapi.yaml`; A2 apoia validação/tipos derivados sem tooling novo nesta fase documental. Pin de SDK/API e extração de período são verificados só na implementação, com fonte oficial.
2. **Preparar persistência com A5.** Inventariar baseline real autorizada e dados sintéticos legados; nova migração aditiva para binding, intenção, subscription/event ledger, exclusão por conta, lease/fence e versão. Não presumir que `user_subscriptions` atual já satisfaz o contrato. Índices/constraints só depois do diagnóstico; conflitos não transferem owners. A1 revê ACL/RLS/grants/overloads/defaults.
3. **Fixar o transporte interno.** Reutilizar Data API com wrappers public explicitamente service-only, helpers e tabelas privados, conforme A3/A5; sem novo segredo/transporte presumido. Invoker com EXECUTE só service_role, caminho fixo/qualificação e grants mínimos. Funções derivam ator do JWT no backend para verify/checkout; webhook resolve-o por binding/intenção provados. Service role não dispensa validação nem prova que o caller é o dono.
4. **Implementar intenção de checkout.** Reserva durável antes do fornecedor; hash/chave por ator; provider idempotency por customer/sessão; impedir intenção concorrente; persistir cadeia antes de devolver URL. Recuperar timeout/crash com a mesma intenção; webhook precoce completa a cadeia comprovada. Não prometer atomicidade externa, nem recriar após janela do fornecedor sem reconciliação.
5. **Implementar o reconciliador único.** Webhook assinado e verify próprios entram na mesma lease por conta antes do fetch externo. Normalizar o snapshot recuperado, verificar preço/ambiente/cadeia e calcular período elegível. Um commit fenced atualiza billing, projeção do perfil e terminal do evento; conflito/lease perdida exige novo fetch. Manter indicador/recibos pendentes que chegaram durante o processamento. Duplicados terminais não estendem prazo; eventos S1 não movem o ponteiro S2.
6. **Fechar portal e adaptação cliente.** Portal só resolve binding provado do próprio customer. Configurar retorno allowlisted já suportado e ensaiar deep link real no iPhone depois. Migrar `plano.ts` aos tipos/erros/header/estado B, estados pendente/confirmado/indisponível e intents estáveis; A3 preserva chamadas IA partilhadas. Backend compatível precede cliente, com gate de versão mínima se houver builds incompatíveis distribuídos.
7. **Verificar e preparar recuperação.** Mocks/contrato/HTTP local, depois concorrência/falha SQL em BD descartável, limpo+upgrade, e revisão A10. Só num passo operacional posterior autorizado ensaiar fornecedor sandbox e binário QA no iPhone; nenhum ensaio live. Se bindings/períodos/recuperação não passarem, retirar esses fluxos da beta por decisão A0.

### Fronteiras internas de intenção — a fixar com A5

Não definir assinaturas SQL duplicadas antes de inventariar os tipos. A5 publica assinaturas únicas da implementação física que cumpram estes trabalhos:

| Primitiva de intenção | Garantia observável |
|---|---|
| Reservar/retomar checkout | Chave+ator+ambiente/hash imutáveis; replay/resultado desconhecido/conflito distintos; não cria recurso externo em SQL. |
| Registar evento | Unicidade e hash, referência mínima e estado durável, sem concessão de direitos por si só. |
| Adquirir reconciliação | Lease da conta, fence monotónico, versão e trabalho pendente; não usa transação longa durante Stripe. |
| Confirmar reconciliação | Revalida owner/binding/ponteiro/fence/versão e grava estado+projeção+terminal atomicamente; erro/zero linhas não são sucesso. |
| Registar falha/quarantine | Só fence válido quando necessário; não desfaz terminal já aplicado; classificação técnica estável, sem SQL/body livre. |

Um worker sem fence atual não confirma nem limpa estado de outro. Um retry com commit desconhecido consulta o recibo antes de qualquer efeito novo. Quarantine exige persistência/alerta/reprocessamento; não serve para disfarçar falha DB. Não reutilizar diretamente `operation_receipts` IA para eventos Stripe.

## Reservas de implementação futura

| Superfície | Dono e coordenação |
|---|---|
| `backend/src/services/stripe/payment.service.js`, controllers/rotas Stripe e adaptador billing | A4; A3 revê envelope/auth comum; A0 reserva extração de módulos se necessária. |
| `backend/src/app.js` parser raw e limites | A3/A4, um autor designado; testar caminho real, query/trailing slash e assinatura sem transformação JSON. |
| `backend/src/config/stripe.js`, env/lock/versionamento | A4 com A2/A9; sem chaves no código, ambiente beta obrigatório e versões suportadas. |
| `contracts/http/openapi.yaml` | A3 integra propostas A4; único contrato HTTP, sem YAML paralelo billing. |
| `app/src/services/api/plano.ts` | A4 blocos billing, A3 blocos IA; um autor de integração reservado A0. |
| `app/src/app/upgrade.tsx`, `settings.tsx`, estados visuais/analytics | A7 com A4/A6; A4 define semântica, sem redesenho nesta unidade. |
| AuthContext/troca de conta e eliminação | A6; A4 não edita concorrentemente. |
| Migração ledger/binding/constraints/lease e RPCs | A5 único autor SQL; A4 comportamento, A1 ACL, A10 revisão. |
| Autorizações premium IA/RPC/jobs | A3/A5/A9 respetivamente, predicado C-GL004-DIREITOS-v1; A1 proteção das fontes. |

## Verificação planeada e evidência

| Camada | Casos e prova necessária | Critérios |
|---|---|---|
| A serviço/HTTP legado | Ator A/B; nenhuma escrita/portal em negação; erro DB/zero linhas sem sucesso; remover UPDATE e retorno falso | AC01/03/08/11/12, subconjuntos identificados |
| B contrato/HTTP | Payload/header/unknown fields, sucesso confirmado/pendente, cada erro e resposta do fornecedor normalizada | AC01–03/09/12/13 |
| B persistência descartável | Falha em cada escrita/commit, duplicados e permutações, lease expirada/fence antigo, verify vs webhook e chegada durante processamento | AC03–06/10/11/15 |
| B relógio/adaptador | Meses/dias, limites UTC, fim de período/cancelamento, prorrata/item errado e formato API desconhecido | AC05/07 |
| B portal/checkout | Binding legado adverso, duplicação, customer eliminado, criação externa sem commit, janela de idempotência expirada | AC02/08/10 |
| Recuperação/observabilidade | Pendentes/quarantine, DB caída/restauro, replay após timeout de commit, ausência de URLs/dados pessoais em logs | AC03/06/09/15 |
| QA posterior autorizado | Teste sandbox separado + iPhone com par SHA/backend/schema/configuração, A/B, browser fechado/retorno/portal/rede intermitente | AC12–14 |

Fixar relógio e usar fixtures sintéticas/IDs de teste. Não tratar mocks como prova de transação SQL nem os antigos harnesses de defeito como regressões aprovadas. Executar checks relevantes no runtime suportado por GL-002 e validar provider/consumer contra o mesmo contrato; sem instalações/testes remotos nesta entrega.

## Sequência, rollback e abertura beta

Integrar A independentemente de novas tabelas. Para B: primeiro contrato ratificado e SQL ensaiado, depois backend protegido/compatível, cliente e QA; manter billing fechado até provas completas. A5 enquadra instalação limpa/upgrade sem reset e sem sobrescrever ACL de GL-001. A9 coordena execução/distribuição futura, fora desta autorização documental.

Rollback funcional desativa novas mutações/checkout/portal conforme o incidente e conserva ledger, intenções e bindings para recuperação. Mantém leituras próprias de estado confirmado quando seguras; indisponibilidade não é convertida em premium infinito. Não repor customer/plano editável, `now+30`, ACK sem persistência ou reatribuição por sessão paga. Correção SQL forward, sem apagar eventos para forçar replay. Eliminação de conta e retenção financeira mínima são fechadas com A6/A0 antes de GC; não ressuscitar uma conta por webhook tardio.

Esta unidade fica documentalmente pronta após os três ficheiros e revisão cruzada; a implementação e todos os critérios operacionais permanecem pendentes.
