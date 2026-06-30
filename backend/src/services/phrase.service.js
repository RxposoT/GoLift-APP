// Serviço de frase motivacional diária
// Devolve uma frase diferente a cada dia, com cache na base de dados
// Se a frase do dia já existir na BD, devolve-a; caso contrário, escolhe uma aleatória do array mock

const supabaseAdmin = require('../config/supabase');

// Frases pré-definidas usadas como fallback quando não há frases configuradas na BD
const MOCK_PHRASES = [
  'O teu único limite és tu mesmo. Vai mais além.',
  'Cada treino é um passo rumo à melhor versão de ti.',
  'A consistência supera a intensidade. Aparece todos os dias.',
  'Não treinas para ontem. Treinas para o que ainda está por vir.',
  'Força não é o que consegues fazer. É superar o que pensavas não conseguir.',
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Acredita no processo. Os resultados vêm com o tempo.',
];

// Obtém a frase do dia: primeiro tenta da BD, se não existir, gera uma mock e guarda
async function getDailyPhrase() {
  const today = new Date().toISOString().split('T')[0];

  // Tenta buscar a frase já guardada para hoje
  const { data } = await supabaseAdmin
    .from('daily_phrases')
    .select('frase')
    .eq('data', today)
    .single();

  if (data) {
    return { frase: data.frase, cached: true };
  }

  // Escolhe uma frase com base no dia do mês (consistente ao longo do dia)
  const frase = MOCK_PHRASES[new Date().getDate() % MOCK_PHRASES.length];
  // Guarda a frase na BD para não repetir pedidos desnecessários
  await supabaseAdmin.from('daily_phrases').insert({ data: today, frase }).maybeSingle();
  return { frase, cached: false, mock: true };
}

module.exports = { getDailyPhrase };
