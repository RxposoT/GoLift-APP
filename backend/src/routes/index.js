// Montagem central de todas as rotas da API
// Cada grupo de rotas é montado num prefixo específico
// As rotas são montadas em /api (definido no app.js)

const { Router } = require('express');

const healthRoutes = require('./health.routes');
const dailyPhraseRoutes = require('./dailyPhrase.routes');
const reportRoutes = require('./ai/report.routes');
const planRoutes = require('./ai/plan.routes');
const feedbackRoutes = require('./ai/feedback.routes');
const adaptRoutes = require('./ai/adapt.routes');
const paymentRoutes = require('./stripe/payment.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/daily-phrase', dailyPhraseRoutes);
router.use('/ai/report', reportRoutes);
router.use('/ai/plan', planRoutes);
router.use('/ai/feedback', feedbackRoutes);
router.use('/ai/adapt', adaptRoutes);
router.use('/stripe', paymentRoutes);

module.exports = router;
