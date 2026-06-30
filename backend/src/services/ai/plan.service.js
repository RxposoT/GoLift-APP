// Serviço de planos de treino mensais gerados por IA
// Permite: consultar plano existente, gerar novo plano, importar dia do plano como treino real
// O plano é personalizado com base no perfil completo do utilizador (nível, equipamento, lesões, etc.)

const supabaseAdmin = require('../../config/supabase');
const { geminiGenerate } = require('../gemini.service');

// Verifica se o utilizador tem plano premium ativo
function isValidPremium(profile) {
  return profile?.plano === 'pago' && (!profile.plano_ativo_ate || new Date(profile.plano_ativo_ate) > new Date());
}

// Consulta o plano do mês atual — devolve o cached ou indica que pode gerar
async function getPlan(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plano, plano_ativo_ate')
    .eq('id', userId)
    .single();

  if (!profile) return { status: 404, erro: 'Utilizador não encontrado' };
  if (!isValidPremium(profile)) return { status: 403, erro: 'Plano GoLift Pro necessário', codigo: 'PLANO_NECESSARIO' };

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

  // Verificar se já existe plano para este mês
  const { data: cached } = await supabaseAdmin
    .from('ai_plans')
    .select('conteudo, criado_em, descanso_segundos')
    .eq('user_id', userId)
    .eq('mes', mesAtual)
    .maybeSingle();

  if (cached) {
    return {
      sucesso: true,
      plano: cached.conteudo,
      mes: mesAtual,
      criado_em: cached.criado_em,
      descanso_segundos: cached.descanso_segundos || 90,
      pode_gerar: false,
    };
  }

  // Sem plano cached — o frontend deve mostrar opção de gerar
  return { sucesso: true, plano: null, mes: mesAtual, pode_gerar: true };
}

// Gera um novo plano de treino personalizado via Gemini
// Arquiva o plano anterior automaticamente (suporta regeneração)
async function generatePlan(userId, params) {
  const { diasPorSemana = 4, tempoTreino = 60, objetivo, targets = [], condicoes = '', descansoEntreSeriesSegundos = 90 } = params;

  // Buscar perfil completo com todos os campos relevantes para o treino
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plano, plano_ativo_ate, peso, altura, idade, objetivo, peso_alvo, treino_dias_semana, treino_duracao, treino_equipamento, treino_nivel, treino_split, lesoes, preferencias_exercicios')
    .eq('id', userId)
    .single();

  if (!profile) return { status: 404, erro: 'Utilizador não encontrado' };
  if (!isValidPremium(profile)) return { status: 403, erro: 'Plano GoLift Pro necessário', codigo: 'PLANO_NECESSARIO' };

  const agora = new Date();
  const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  const mesNome = agora.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

  // Arquiva plano anterior (se existir) para permitir regeneração
  await supabaseAdmin
    .from('ai_plans')
    .update({ arquivado: true })
    .eq('user_id', userId)
    .eq('mes', mesAtual);

  // Construir strings condicionais para o prompt
  const objFinal = objetivo || profile.objetivo || 'não definido';
  const targetStr = targets.length > 0 ? `Dar mais ênfase a: ${targets.join(', ')}.` : '';
  const condicoesStr = condicoes ? `Condições/notas do utilizador: "${condicoes}".` : '';
  const lesoesStr = profile.lesoes ? `Lesões/condições: ${profile.lesoes}.` : '';
  const prefStr = profile.preferencias_exercicios?.length ? `Exercícios preferidos: ${profile.preferencias_exercicios.join(', ')}.` : '';

  // Prompt detalhado com todo o perfil para a Gemini gerar o plano ideal
  const prompt = `Cria um plano de treino personalizado para ${mesNome}.

PERFIL DO UTILIZADOR:
- Peso: ${profile.peso || '?'}kg | Altura: ${profile.altura || '?'}cm | Idade: ${profile.idade || '?'}anos
- Objetivo: ${objFinal}${profile.peso_alvo ? ` (peso alvo: ${profile.peso_alvo}kg)` : ''}
- Dias de treino por semana: ${diasPorSemana || profile.treino_dias_semana || 4}
- Tempo disponível por treino: ${tempoTreino || profile.treino_duracao || 60} minutos
- Nível: ${profile.treino_nivel || 'intermediário'}
- Equipamento: ${profile.treino_equipamento || 'ginásio'}
- Split preferido: ${profile.treino_split || 'a definir pela IA'}
- Descanso entre séries: ${descansoEntreSeriesSegundos} segundos
${targetStr ? `- ${targetStr}` : ''}
${condicoesStr ? `- ${condicoesStr}` : ''}
${lesoesStr ? `- ${lesoesStr}` : ''}
${prefStr ? `- ${prefStr}` : ''}

REGRAS:
- Cada treino deve durar aproximadamente ${tempoTreino || profile.treino_duracao || 60} minutos.
- Adapta o número de exercícios e séries ao tempo disponível.
- Inclui apenas os dias de treino (sem dias de descanso no array).
${condicoes || profile.lesoes ? '- Respeita as condições/lesões mencionadas e adapta os exercícios em conformidade.' : ''}

Responde APENAS com JSON válido (sem markdown, sem código blocks) com exatamente esta estrutura:
{
  "descricao": "breve descrição do método de treino escolhido (1-2 frases)",
  "split": [
    {
      "dia": "Segunda-feira",
      "foco": "nome do grupo muscular principal",
      "exercicios": [
        { "nome": "nome do exercício", "series": 4, "repeticoes": "8-12", "observacao": "dica curta opcional" }
      ]
    }
  ]
}`;

  const geminiResp = await geminiGenerate({ prompt, type: 'plan' });
  const plano = geminiResp.plano || geminiResp;
  const parametros = JSON.stringify({ diasPorSemana, tempoTreino, objetivo: objFinal, targets, condicoes });

  // Guardar o novo plano na base de dados
  const { error: insertErr } = await supabaseAdmin.from('ai_plans').insert({
    user_id: userId,
    mes: mesAtual,
    conteudo: plano,
    parametros,
    descanso_segundos: descansoEntreSeriesSegundos,
  });

  if (insertErr) throw insertErr;

  return { sucesso: true, plano, mes: mesAtual, descanso_segundos: descansoEntreSeriesSegundos, pode_gerar: false };
}

// Importa um dia específico do plano IA como um treino real na conta do utilizador
// Cria o treino, encontra ou cria os exercícios, e associa-os
async function importDay(userId, { dia, foco, exercicios: exs }) {
  if (!dia || !exs?.length) return { status: 400, erro: 'Dados inválidos' };

  const nomeTreino = `${dia} — ${foco || 'IA'}`;

  // Criar o treino com flag is_ia = 1 para identificar origem
  const { data: workout, error: wErr } = await supabaseAdmin
    .from('workouts')
    .insert({ user_id: userId, nome: nomeTreino, is_ia: 1 })
    .select('id')
    .single();

  if (wErr) return { status: 500, erro: 'Erro ao criar treino' };

  // Para cada exercício do plano: tentar encontrar na BD ou criar novo
  for (const ex of exs) {
    const exName = ex.nome || ex.exercicio;
    if (!exName) continue;

    const { data: existing } = await supabaseAdmin
      .from('exercises')
      .select('id')
      .eq('nome', exName)
      .maybeSingle();

    let exerciseId;
    if (existing) {
      exerciseId = existing.id;
    } else {
      // Exercício novo (não existe no seed) — criar com categoria genérica
      const { data: newEx } = await supabaseAdmin
        .from('exercises')
        .insert({ nome: exName, grupo_tipo: 'Outros', sub_tipo: 'Geral' })
        .select('id')
        .single();
      exerciseId = newEx?.id;
    }

    if (exerciseId) {
      await supabaseAdmin.from('workout_exercises').insert({
        workout_id: workout.id,
        exercise_id: exerciseId,
      });
    }
  }

  return { sucesso: true, id_treino: workout.id, nome: nomeTreino };
}

module.exports = { getPlan, generatePlan, importDay };
