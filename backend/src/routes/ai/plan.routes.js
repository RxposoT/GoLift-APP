// Rotas do plano de treino mensal com IA — /api/ai/plan/:userId
// GET  /:userId          — consulta plano do mês atual
// POST /:userId/generate — gera novo plano (rate limited: 10/h)
// POST /:userId/import-day — importa dia do plano como treino real (sem rate limit)
// Todas requerem autenticação. Apenas premium podem gerar/ver planos.

const { Router } = require('express');
const authenticateSupabase = require('../../middleware/auth');
const aiLimiter = require('../../middleware/rateLimiter');
const planController = require('../../controllers/ai/plan.controller');

const router = Router();

router.get('/:userId', authenticateSupabase, aiLimiter, planController.getPlan);
router.post('/:userId/generate', authenticateSupabase, aiLimiter, planController.generatePlan);
router.post('/:userId/import-day', authenticateSupabase, planController.importDay);

module.exports = router;
