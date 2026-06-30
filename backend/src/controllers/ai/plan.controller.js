// Controller do plano de treino mensal com IA
// Três operações: consultar plano, gerar novo plano, importar dia como treino
// Todas validam que o userId do URL corresponde ao user autenticado

const planService = require('../../services/ai/plan.service');

// GET — consulta o plano do mês atual (cached ou indica que pode gerar)
async function getPlan(req, res) {
  const { userId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await planService.getPlan(userId);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][PLAN] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao obter plano' });
  }
}

// POST — gera um novo plano personalizado via Gemini
async function generatePlan(req, res) {
  const { userId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await planService.generatePlan(userId, req.body);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][GEMINI] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao gerar plano' });
  }
}

// POST — importa um dia do plano IA como treino real (cria workout + exercícios)
async function importDay(req, res) {
  const { userId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await planService.importDay(userId, req.body);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][IMPORT] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao importar dia' });
  }
}

module.exports = { getPlan, generatePlan, importDay };
