// Rotas do relatório semanal de IA — GET /api/ai/report/:userId
// Requer autenticação + rate limiting (10/hora)
// Apenas utilizadores com plano premium (pago) podem aceder

const { Router } = require('express');
const authenticateSupabase = require('../../middleware/auth');
const aiLimiter = require('../../middleware/rateLimiter');
const reportController = require('../../controllers/ai/report.controller');

const router = Router();

router.get('/:userId', authenticateSupabase, aiLimiter, reportController.getReport);

module.exports = router;
