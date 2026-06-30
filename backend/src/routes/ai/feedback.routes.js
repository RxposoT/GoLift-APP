// Rota de feedback pós-treino com IA — POST /api/ai/feedback/:userId
// Requer autenticação + rate limiting (10/hora)
// Apenas utilizadores premium recebem resposta personalizada da Gemini

const { Router } = require('express');
const authenticateSupabase = require('../../middleware/auth');
const aiLimiter = require('../../middleware/rateLimiter');
const feedbackController = require('../../controllers/ai/feedback.controller');

const router = Router();

router.post('/:userId', authenticateSupabase, aiLimiter, feedbackController.submitFeedback);

module.exports = router;
