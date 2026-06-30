// Serviço de pagamentos com Stripe
// Responsável por: criar sessões de checkout, gerir portal de subscrição, processar webhooks,
// verificar sessões de pagamento, e atualizar o plano do utilizador na base de dados

const supabaseAdmin = require('../../config/supabase');
const stripe = require('../../config/stripe');
const { STRIPE_PRICE_ID, SERVER_URL } = require('../../config/env');

// Cria uma sessão de checkout Stripe para subscrição
// Devolve a URL para redirecionar o utilizador para o checkout
async function createCheckoutSession(userId) {
  if (!stripe) return { status: 500, erro: 'Stripe não configurado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',              // Pagamento recorrente
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      metadata: { userId },              // Guarda userId para o webhook processar depois
      customer_email: profile?.email,    // Pré-preenche o email no checkout
      success_url: `${SERVER_URL}/payment-return?status=sucesso`,
      cancel_url: `${SERVER_URL}/payment-return?status=cancelado`,
    });
    return { sucesso: true, url: session.url, sessionId: session.id };
  } catch (err) {
    console.error('[Stripe]', err.message);
    return { status: 500, erro: 'Erro ao criar sessão de pagamento' };
  }
}

// Cria uma sessão do portal do cliente Stripe para o utilizador gerir a subscrição
// (cancelar, alterar método de pagamento, etc.)
async function createPortalSession(userId) {
  if (!stripe) return { status: 500, erro: 'Stripe não configurado' };

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!profile?.stripe_customer_id) {
    return { status: 400, erro: 'Sem subscrição ativa' };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: 'golift://settings',  // Deep link para voltar à app
    });
    return { url: session.url };
  } catch (e) {
    console.error('[Stripe Portal]', e.message);
    return { status: 500, erro: 'Erro ao criar portal' };
  }
}

// Processa webhooks do Stripe (eventos assíncronos de pagamento)
// Eventos tratados:
//   - checkout.session.completed: ativa subscrição após pagamento
//   - invoice.paid: renova subscrição automaticamente
//   - customer.subscription.deleted: remove acesso premium
async function handleWebhook(rawBody, signature) {
  if (!stripe) return { status: 500, erro: 'Stripe não configurado' };

  let event;
  try {
    // Verifica a assinatura do webhook para garantir que é do Stripe
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature error:', err.message);
    return { status: 400, erro: `Webhook Error: ${err.message}` };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      // Pagamento inicial bem-sucedido — ativa plano premium por 30 dias
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const customerId = session.customer;
      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            plano: 'pago',
            plano_ativo_ate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_customer_id: customerId,
          })
          .eq('id', userId);
      }
      break;
    }
    case 'invoice.paid': {
      // Renovação mensal — estende subscrição por mais 30 dias
      const invoice = event.data.object;
      await supabaseAdmin
        .from('profiles')
        .update({ plano_ativo_ate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('stripe_customer_id', invoice.customer);
      break;
    }
    case 'customer.subscription.deleted': {
      // Subscrição cancelada — volta para plano free
      const sub = event.data.object;
      await supabaseAdmin
        .from('profiles')
        .update({ plano: 'free' })
        .eq('stripe_customer_id', sub.customer);
      break;
    }
  }

  return { received: true };
}

// Verifica o estado de uma sessão de checkout específica
// Usado como fallback caso o redirect não atualize o perfil corretamente
async function verifySession(userId, { sessionId }) {
  if (!stripe) return { status: 500, erro: 'Stripe não configurado' };
  if (!sessionId) return { status: 400, erro: 'sessionId em falta' };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      await supabaseAdmin
        .from('profiles')
        .update({
          plano: 'pago',
          plano_ativo_ate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: session.customer,
        })
        .eq('id', userId);
      return { sucesso: true, plano: 'pago' };
    }
    return { sucesso: false, status: session.payment_status };
  } catch (err) {
    console.error('[Stripe verify]', err.message);
    return { status: 500, erro: 'Erro ao verificar sessão' };
  }
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhook, verifySession };
