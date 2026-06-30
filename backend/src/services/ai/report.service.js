// Serviço de relatório semanal de desempenho com IA
// Gera uma análise detalhada da semana anterior usando Gemini
// Inclui: avaliação geral, equilíbrio muscular, progressão de cargas, descanso, melhorias
// O resultado é cached na BD para evitar regeneração desnecessária

const supabaseAdmin = require('../../config/supabase');
const { geminiGenerate } = require('../gemini.service');

// Verifica se o utilizador tem plano premium ativo
function isValidPremium(profile) {
  return profile?.plano === 'pago' && (!profile.plano_ativo_ate || new Date(profile.plano_ativo_ate) > new Date());
}

// Calcula o intervalo da semana anterior (segunda a domingo)
function getLastWeekRange() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diasDesdeSegunda = diaSemana === 0 ? 6 : diaSemana - 1;

  // Segunda-feira passada (início do dia)
  const segundaPassada = new Date(hoje);
  segundaPassada.setDate(hoje.getDate() - diasDesdeSegunda - 7);
  segundaPassada.setHours(0, 0, 0, 0);

  // Domingo passado (fim do dia)
  const domingoPassado = new Date(segundaPassada);
  domingoPassado.setDate(segundaPassada.getDate() + 6);
  domingoPassado.setHours(23, 59, 59, 999);

  const semanaInicio = segundaPassada.toISOString().split('T')[0];

  return { segundaPassada, domingoPassado, semanaInicio };
}

// Gera ou retorna o relatório semanal em cache
async function getWeeklyReport(userId) {
  // 1. Verificar perfil e plano premium
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plano, plano_ativo_ate')
    .eq('id', userId)
    .single();

  if (!profile) return { status: 404, erro: 'Utilizador não encontrado' };
  if (!isValidPremium(profile)) return { status: 403, erro: 'Plano GoLift Pro necessário', codigo: 'PLANO_NECESSARIO' };

  const { segundaPassada, domingoPassado, semanaInicio } = getLastWeekRange();

  // 2. Verificar cache — se já foi gerado esta semana, devolver versão guardada
  const { data: cached } = await supabaseAdmin
    .from('ai_reports')
    .select('conteudo')
    .eq('user_id', userId)
    .eq('semana_inicio', semanaInicio)
    .maybeSingle();

  if (cached) {
    return {
      sucesso: true,
      relatorio: cached.conteudo,
      semana_inicio: semanaInicio,
      cached: true,
    };
  }

  // 3. Buscar sessões de treino da semana passada
  const { data: treinos } = await supabaseAdmin
    .from('workout_sessions')
    .select(`
      id, data_fim, duracao_segundos,
      workout:workouts!inner(nome)
    `)
    .eq('user_id', userId)
    .gte('data_fim', segundaPassada.toISOString())
    .lte('data_fim', domingoPassado.toISOString())
    .not('data_fim', 'is', null);

  // 4. Se não houve treinos, devolver relatório vazio com sugestões genéricas
  if (!treinos || treinos.length === 0) {
    return {
      sucesso: true,
      relatorio: {
        avaliacao: 'Não realizaste nenhum treino na semana passada.',
        equilibrio: 'Sem dados para analisar.',
        progressao: 'Sem dados para analisar.',
        descanso: 'Sem dados para analisar.',
        melhorias: [
          'Começa a registar os teus treinos',
          'Define uma meta semanal',
          'Treina pelo menos 2 vezes esta semana',
        ],
      },
      semana_inicio: semanaInicio,
      cached: false,
    };
  }

  // 5. Buscar perfil completo para contexto do prompt
  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('nome, peso, altura, idade, objetivo, peso_alvo')
    .eq('id', userId)
    .single();

  // 6. Construir sumário legível dos treinos para o prompt da IA
  const treinosSummary = treinos
    .map((t, i) => {
      const data = new Date(t.data_fim).toLocaleDateString('pt-PT', {
        weekday: 'long', day: '2-digit', month: '2-digit',
      });
      const duracao = t.duracao_segundos
        ? `${Math.round(t.duracao_segundos / 60)} min`
        : 'duração desconhecida';
      return `  Treino ${i + 1} (${data}): "${t.workout?.nome || 'Treino'}", ${duracao}`;
    })
    .join('\n');

  // 7. Construir prompt detalhado para a Gemini
  const prompt = `Analisa os dados de treino semanais de um utilizador da app GoLift e gera um relatório simples e motivador em português europeu.

Perfil: objetivo "${perfil?.objetivo || 'não definido'}", ${perfil?.peso || '?'}kg, ${perfil?.altura || '?'}cm, ${perfil?.idade || '?'}anos.

Semana de ${semanaInicio}:
${treinosSummary}

Responde APENAS com JSON válido (sem markdown, sem código blocks) com exatamente esta estrutura:
{
  "avaliacao": "parágrafo curto de avaliação geral (máx 2 frases)",
  "equilibrio": "análise do equilíbrio muscular (máx 2 frases)",
  "progressao": "análise da progressão de cargas (máx 2 frases)",
  "descanso": "análise do descanso e recuperação (máx 2 frases)",
  "melhorias": ["melhoria concreta 1", "melhoria concreta 2", "melhoria concreta 3"]
}`;

  // 8. Chamar Gemini e guardar resultado em cache
  const geminiResp = await geminiGenerate({ prompt, type: 'report' });
  const relatorio = geminiResp.relatorio || geminiResp;

  await supabaseAdmin.from('ai_reports').upsert(
    { user_id: userId, semana_inicio: semanaInicio, conteudo: relatorio },
    { onConflict: 'user_id,semana_inicio' }
  );

  return { sucesso: true, relatorio, semana_inicio: semanaInicio, cached: false };
}

module.exports = { getWeeklyReport };
