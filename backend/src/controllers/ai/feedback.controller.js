// Controller de feedback pós-treino
// Recebe os dados de feedback do corpo do pedido e delega para o serviço
// O serviço guarda o feedback e gera resposta personalizada da Gemini

const feedbackService = require('../../services/ai/feedback.service');

async function submitFeedback(req, res) {
  const { userId } = req.params;
  if (req.user.id !== userId) return res.status(403).json({ erro: 'Acesso negado' });

  try {
    const result = await feedbackService.submitFeedback(userId, req.body);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[AI][FEEDBACK] Erro:', err.message);
    res.status(500).json({ erro: 'Erro ao processar feedback' });
  }
}

module.exports = { submitFeedback };
