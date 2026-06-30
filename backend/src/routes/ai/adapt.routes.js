// Rota de adaptação inteligente de treinos — POST /api/ai/adapt/:userId
// Requer autenticação + rate limiting (10/hora)
// Apenas premium recebem adaptação real; free users recebem resposta não adaptada

const { Router } = require('express');
const authenticateSupabase = require('../../middleware/auth');
const aiLimiter = require('../../middleware/rateLimiter');
const adaptController = require('../../controllers/ai/adapt.controller');

const router = Router();

router.post('/:userId', authenticateSupabase, aiLimiter, adaptController.adaptWorkout);

module.exports = router;
