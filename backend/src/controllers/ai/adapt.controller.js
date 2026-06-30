// Controller de adaptação inteligente de treinos
// Recebe o workout_id e delega para o serviço que analisa readiness + dor + histórico
// A IA decide se o treino deve ser mantido, reduzido, ou substituído por day off

const adaptService = require('../../services/ai/adapt.service');

async function adaptWorkout(req, res) {
  const { userId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await adaptService.adaptWorkout(userId, req.body);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][ADAPT] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao adaptar treino' });
  }
}

module.exports = { adaptWorkout };
