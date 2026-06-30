// Controller de pagamentos Stripe
// Cada função lida com um endpoint específico:
//   - checkout-session: iniciar subscrição
//   - portal: gerir subscrição existente
//   - webhook: processar eventos Stripe (requer raw body, sem auth)
//   - verify-session: verificar estado do pagamento
//   - payment-return: página HTML de confirmação/cancelamento

const paymentService = require('../../services/stripe/payment.service');

// Cria uma sessão de checkout Stripe e devolve a URL para redirecionamento
async function createCheckoutSession(req, res) {
  try {
    const result = await paymentService.createCheckoutSession(req.user.id);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[Stripe]', err.message);
    res.status(500).json({ erro: 'Erro ao criar sessão de pagamento' });
  }
}

// Cria portal do cliente Stripe para gerir/aceder à subscrição
async function createPortalSession(req, res) {
  try {
    const result = await paymentService.createPortalSession(req.user.id);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[Stripe Portal]', err.message);
    res.status(500).json({ erro: 'Erro ao criar portal' });
  }
}

// Processa webhooks do Stripe (eventos de pagamento assíncronos)
// NOTA: usa req.body raw (não JSON) — o body parser é feito condicionalmente no app.js
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const result = await paymentService.handleWebhook(req.body, sig);
  const status = result.status || 200;
  if (result.status) delete result.status;
  res.status(status).json(result);
}

// Verifica manualmente o estado de uma sessão de checkout
async function verifySession(req, res) {
  try {
    const result = await paymentService.verifySession(req.user.id, req.body);
    const status = result.status || 200;
    if (result.status) delete result.status;
    res.status(status).json(result);
  } catch (err) {
    console.error('[Stripe verify]', err.message);
    res.status(500).json({ erro: 'Erro ao verificar sessão' });
  }
}

// Renderiza uma página HTML estática para o redirect pós-pagamento
// Mostra "Pagamento Confirmado!" ou "Pagamento Cancelado" conforme o status
function paymentReturnPage(req, res) {
  const status = req.query.status === 'sucesso' ? 'sucesso' : 'cancelado';
  const isSucesso = status === 'sucesso';
  res.send(`<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>GoLift — ${isSucesso ? 'Pagamento Confirmado' : 'Pagamento Cancelado'}</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0f0f;color:#fff;text-align:center}.card{background:#1a1a1a;border-radius:16px;padding:40px;max-width:360px}.icon{font-size:64px;margin-bottom:16px}h1{margin:0 0 12px;font-size:24px}p{color:#aaa;margin:0 0 24px}p.hint{font-size:13px;color:#555}</style></head>
<body><div class="card"><div class="icon">${isSucesso ? '✅' : '❌'}</div>
<h1>${isSucesso ? 'Pagamento Confirmado!' : 'Pagamento Cancelado'}</h1>
<p>${isSucesso ? 'A tua subscrição GoLift Pro está ativa. Podes voltar à app.' : 'O pagamento foi cancelado. Podes tentar novamente na app.'}</p>
<p class="hint">Podes fechar esta janela.</p></div></body></html>`);
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhook, verifySession, paymentReturnPage };
