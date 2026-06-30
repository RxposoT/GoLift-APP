// Rotas de pagamento Stripe — /api/stripe/*
// POST /checkout-session  — cria sessão de checkout (auth required)
// POST /portal            — cria portal do cliente (auth required)
// POST /webhook           — processa eventos Stripe (raw body, sem auth)
// POST /verify-session    — verifica estado do pagamento (auth required)
// GET  /payment-return    — página de redirect pós-pagamento (pública, HTML)

const { Router } = require('express');
const authenticateSupabase = require('../../middleware/auth');
const paymentController = require('../../controllers/stripe/payment.controller');

const router = Router();

router.post('/checkout-session', authenticateSupabase, paymentController.createCheckoutSession);
router.post('/portal', authenticateSupabase, paymentController.createPortalSession);
router.post('/webhook', paymentController.handleWebhook);
router.post('/verify-session', authenticateSupabase, paymentController.verifySession);
router.get('/payment-return', paymentController.paymentReturnPage);

module.exports = router;
