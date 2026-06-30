// Controller do relatório semanal de treino com IA
// Recebe o userId, valida que é o próprio utilizador, e delega para o serviço
// O serviço devolve { status?, ...data } — o controller extrai o status HTTP

const reportService = require('../../services/ai/report.service');

async function getReport(req, res) {
  const { userId } = req.params;

  // Verificação de autorização: o userId do URL deve corresponder ao user autenticado
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await reportService.getWeeklyReport(userId);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][GEMINI] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao gerar relatório' });
  }
}

module.exports = { getReport };
