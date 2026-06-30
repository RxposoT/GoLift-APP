// Rota de health check — GET /api/health
// Pública, sem autenticação. Usada para monitorização e verificação do servidor.

const { Router } = require('express');
const healthController = require('../controllers/health.controller');

const router = Router();

router.get('/', healthController.getHealth);

module.exports = router;
