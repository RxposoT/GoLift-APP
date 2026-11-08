// Serviço de adaptação inteligente de treinos com IA
// Analisa o estado atual do utilizador (readiness, sono, stress, dor) e adapta o treino do dia
// Usa a Gemini para sugerir modificações: redução de carga, substituição de exercícios, ou day off

const supabaseAdmin = require('../../config/supabase');
const { geminiGenerate } = require('../gemini.service');

// Verifica se o utilizador tem plano premium ativo
function isValidPremium(profile) {
  return profile?.plano === 'pago' && (!profile.plano_ativo_ate || new Date(profile.plano_ativo_ate) > new Date());
}

// Analisa o estado do utilizador e adapta o treino conforme necessário
async function adaptWorkout(userId, data) {
  const { workout_id } = data || {};
  if (!workout_id) return { status: 400, erro: 'workout_id em falta' };
  if (!['number', 'string'].includes(typeof workout_id) || !/^\d+$/.test(String(workout_id)) ||
      !Number.isSafeInteger(Number(workout_id)) || Number(workout_id) <= 0) {
    return { status: 400, erro: 'workout_id inválido' };
  }
  const { data: ownedWorkout, error: ownerError } = await supabaseAdmin
    .from('workouts').select('id').eq('id', workout_id).eq('user_id', userId).maybeSingle();
  if (ownerError) return { status: 500, erro: 'Erro ao consultar treino' };
  if (!ownedWorkout) return { status: 404, erro: 'Treino não encontrado' };

  // 1. Verificar perfil e plano — free users recebem resposta não adaptada
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('plano, plano_ativo_ate, treino_dias_semana, treino_nivel, lesoes')
    .eq('id', userId)
    .single();

  if (profileError) return { status: 500, erro: 'Erro ao consultar perfil' };
  if (!profile) return { status: 404, erro: 'Utilizador não encontrado' };
  const temPremium = isValidPremium(profile);
  if (!temPremium) {
    return { sucesso: true, adaptado: false, motivo: 'plano_free' };
  }

  // 2. Obter dados de prontidão do dia (check-in matinal)
  const hoje = new Date().toISOString().split('T')[0];

  const { data: readiness, error: readinessError } = await supabaseAdmin
    .from('daily_readiness')
    .select('prontidao_score, sono_horas, sono_qualidade, energia, stress, musculo_dolorido')
    .eq('user_id', userId)
    .eq('data', hoje)
    .maybeSingle();
  if (readinessError) return { status: 500, erro: 'Erro ao consultar prontidão' };

  // 3. Obter histórico recente de dor (últimos 2 feedbacks com dor)
  const { data: recenteDor, error: painError } = await supabaseAdmin
    .from('workout_feedback')
    .select('dor_zones, dor_intensidade, session:workout_sessions!inner(workout:workouts!inner(id))')
    .eq('user_id', userId).eq('session.user_id', userId).eq('session.workout.user_id', userId)
    .not('dor_zones', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2);
  if (painError || !recenteDor) return { status: 500, erro: 'Erro ao consultar dor recente' };

  // 4. Obter exercícios do treino planeado
  const { data: workout, error: workoutError } = await supabaseAdmin
    .from('workouts')
    .select('nome, workout_exercises(exercise_id, exercises(nome, grupo_tipo))')
    .eq('id', workout_id).eq('user_id', userId).maybeSingle();

  if (workoutError) return { status: 500, erro: 'Erro ao consultar treino' };
  if (!workout) return { status: 404, erro: 'Treino não encontrado' };

  const exercicios = workout.workout_exercises?.map(we => ({
    nome: we.exercises?.nome,
    grupo: we.exercises?.grupo_tipo,
  })) || [];

  // 5. Prompt para a Gemini com todas as variáveis de estado do utilizador
  const prompt = `Analisa o estado atual do utilizador e adapta o treino de hoje.

ESTADO DO UTILIZADOR:
- Readiness: ${readiness?.prontidao_score || 'não disponível'}/10
- Sono: ${readiness?.sono_horas || '?'}h (qualidade: ${readiness?.sono_qualidade || '?'}/5)
- Energia: ${readiness?.energia || '?'}/5
- Stress: ${readiness?.stress || '?'}/5
- Músculos doridos: ${readiness?.musculo_dolorido?.join(', ') || 'nenhum'}
- Zonas de dor recentes: ${recenteDor?.map(f => f.dor_zones?.join(', ')).filter(Boolean).join('; ') || 'nenhuma'}
${profile.lesoes ? `- Lesões conhecidas: ${profile.lesoes}` : ''}
- Nível: ${profile.treino_nivel || 'intermediário'}

TREINO PLANEADO HOJE:
${exercicios.map((e, i) => `  ${i + 1}. ${e.nome} (${e.grupo || 'Geral'})`).join('\n') || '  (sem exercícios definidos)'}

Com base no estado do utilizador, decide:
1. Se readiness < 4: recomendar day off ou treino leve (mobilidade/recovery)
2. Se readiness entre 4-6: reduzir volume/carga
3. Se readiness > 6: treino normal, pode até aumentar
4. Se há dor recente: substituir exercícios que afetem essa zona
5. Se sono foi mau (< 5h): menos intensidade, mais aquecimento

Responde APENAS com JSON:
{
  "adaptado": true,
  "nivel_adaptacao": "leve" | "moderada" | "day_off" | "nenhuma",
  "motivo": "explicação curta da adaptação",
  "modificacoes": [
    {
      "exercicio": "nome original",
      "alteracao": "descrição da mudança (carga, séries, reps, substituição)",
      "motivo": "porquê esta mudança"
    }
  ],
  "aquecimento_extra": "sugestão de aquecimento específico ou null"
}`;

  // 6. Chamar Gemini — fallback para resposta segura se falhar
  try {
    const geminiResp = await geminiGenerate({ prompt, type: 'plan' });
    return { sucesso: true, ...geminiResp };
  } catch (err) {
    console.error('[AI][ADAPT] Erro:', err.message);
    return { sucesso: true, adaptado: false, nivel_adaptacao: 'nenhuma', motivo: null, modificacoes: [] };
  }
}

module.exports = { adaptWorkout };
