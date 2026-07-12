// Serviço de feedback pós-treino com resposta personalizada da IA
// Guarda o feedback do utilizador na BD e gera uma resposta motivacional da Gemini
// A IA analisa padrões de dor e sugere adaptações com base no histórico

const supabaseAdmin = require('../../config/supabase');
const { geminiGenerate } = require('../gemini.service');

// Verifica se o utilizador tem plano premium ativo
function isValidPremium(profile) {
  return profile?.plano === 'pago' && (!profile.plano_ativo_ate || new Date(profile.plano_ativo_ate) > new Date());
}

// Submete feedback pós-treino, guarda na BD e obtém resposta personalizada da IA
async function submitFeedback(userId, data) {
  const { session_id, sentir_score, dor_zones, dor_intensidade, energia_treino, notas } = data;
  if (!session_id) return { status: 400, erro: 'session_id em falta' };

  // 1. Verificar perfil e plano premium
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plano, plano_ativo_ate')
    .eq('id', userId)
    .single();

  if (!profile) return { status: 404, erro: 'Utilizador não encontrado' };
  const temPremium = isValidPremium(profile);
  if (!temPremium) return { status: 403, erro: 'Plano GoLift Pro necessário', codigo: 'PLANO_NECESSARIO' };

  // 2. Guardar feedback na BD (upsert para evitar duplicados por sessão)
  await supabaseAdmin.from('workout_feedback').upsert({
    session_id, user_id: userId, sentir_score, dor_zones, dor_intensidade, energia_treino, notas,
  }, { onConflict: 'session_id' });

  // 3. Buscar dados da sessão e histórico de feedbacks para contexto da IA
  const { data: sessao } = await supabaseAdmin
    .from('workout_sessions')
    .select('data_inicio, data_fim, duracao_segundos, workout:workouts(nome), workout_sets(repeticoes, peso, exercise:exercises(nome, grupo_tipo))')
    .eq('id', session_id)
    .single();

  const { data: readiness } = await supabaseAdmin
    .from('daily_readiness')
    .select('prontidao_score, sono_horas, sono_qualidade, energia, stress, musculo_dolorido')
    .eq('user_id', userId)
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sessoesRecentes } = await supabaseAdmin
    .from('workout_sessions')
    .select('data_fim, duracao_segundos, workout:workouts(nome)')
    .eq('user_id', userId)
    .not('data_fim', 'is', null)
    .neq('id', session_id)
    .order('data_fim', { ascending: false })
    .limit(5);

  const { data: historico } = await supabaseAdmin
    .from('workout_feedback')
    .select('sentir_score, dor_zones, energia_treino, created_at')
    .eq('user_id', userId)
    .neq('session_id', session_id)
    .order('created_at', { ascending: false })
    .limit(10);

  // 4. Construir prompt com feedback atual + histórico para personalização
  const seriesResumo = (sessao?.workout_sets || [])
    .map((serie) => `${serie.exercise?.nome || 'Exercício'}: ${serie.repeticoes || 0} reps × ${serie.peso || 0}kg`)
    .join('; ') || 'sem séries registadas';
  const historicoTreinos = (sessoesRecentes || [])
    .map((treino) => `${treino.workout?.nome || 'Treino'} (${Math.round((treino.duracao_segundos || 0) / 60)} min)`)
    .join(', ') || 'sem sessões anteriores';

  const prompt = `O utilizador acabou de terminar um treino e reportou o seguinte feedback:

Sessão: "${sessao?.workout?.nome || 'Treino'}"
Duração: ${sessao?.duracao_segundos ? Math.round(sessao.duracao_segundos / 60) + ' min' : 'desconhecida'}
Como se sentiu: ${sentir_score || 'não reportado'}/5
Energia durante treino: ${energia_treino || 'não reportado'}/5
Zonas de dor: ${dor_zones?.length ? dor_zones.join(', ') : 'nenhuma'}
Intensidade da dor: ${dor_intensidade || 0}/5
Notas: "${notas || '—'}"

Séries executadas: ${seriesResumo}

Check-in mais recente:
- Prontidão: ${readiness?.prontidao_score || 'não disponível'}/10
- Sono: ${readiness?.sono_horas || '?'}h, qualidade ${readiness?.sono_qualidade || '?'}/5
- Energia: ${readiness?.energia || '?'}/5 | Stress: ${readiness?.stress || '?'}/5
- Músculos já doridos: ${readiness?.musculo_dolorido?.join(', ') || 'nenhum'}

Sessões recentes: ${historicoTreinos}

Últimos feedbacks do utilizador:
${historico?.map((h, i) => `  ${i + 1}. Sentir: ${h.sentir_score}/5, Dor: ${h.dor_zones?.join(', ') || 'nenhuma'}`).join('\n') || '  (sem histórico)'}

Gera uma resposta personalizada e motivacional em português europeu (2-3 frases).
Se houver padrões de dor, sugere uma adaptação concreta.
Responde APENAS com JSON:
{
  "mensagem": "resposta motivacional personalizada",
  "sugestao": "sugestão concreta se aplicável, ou null",
  "feedback_dor": "observação sobre padrão de dor se encontrado, ou null",
  "requer_atencao": true ou false
}`;

  // 5. Chamar Gemini — se falhar, devolver resposta genérica amigável
  try {
    const geminiResp = await geminiGenerate({ prompt, type: 'report' });
    return { sucesso: true, ...geminiResp };
  } catch (err) {
    console.error('[AI][FEEDBACK] Erro:', err.message);
    return { sucesso: true, mensagem: 'Bom treino! Continua assim.', sugestao: null, feedback_dor: null };
  }
}

module.exports = { submitFeedback };
