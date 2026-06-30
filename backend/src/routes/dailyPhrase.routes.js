// Rota da frase motivacional diária — GET /api/daily-phrase
// Pública, sem autenticação. Devolve uma frase diferente a cada dia.

const { Router } = require('express');
const dailyPhraseController = require('../controllers/dailyPhrase.controller');

const router = Router();

router.get('/', dailyPhraseController.getDailyPhrase);

module.exports = router;
