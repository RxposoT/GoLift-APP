const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    html: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.html = payload;
      return this;
    },
  };
}

test('createCheckoutSession returns service payload without status field', async () => {
  const servicePath = path.resolve(__dirname, '../../services/stripe/payment.service.js');
  const controllerPath = path.resolve(__dirname, './payment.controller.js');

  delete require.cache[servicePath];
  delete require.cache[controllerPath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      createCheckoutSession: async () => ({ status: 201, url: 'https://checkout.stripe.com/test' }),
      createPortalSession: async () => ({}),
      handleWebhook: async () => ({}),
      verifySession: async () => ({}),
    },
  };

  const { createCheckoutSession } = require('./payment.controller');

  const req = { user: { id: 'user-1' } };
  const res = createRes();

  await createCheckoutSession(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { url: 'https://checkout.stripe.com/test' });
  assert.equal('status' in res.body, false);
});

test('handleWebhook forwards stripe signature and payload', async () => {
  const servicePath = path.resolve(__dirname, '../../services/stripe/payment.service.js');
  const controllerPath = path.resolve(__dirname, './payment.controller.js');

  let bodyReceived = null;
  let signatureReceived = null;

  delete require.cache[servicePath];
  delete require.cache[controllerPath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      createCheckoutSession: async () => ({}),
      createPortalSession: async () => ({}),
      handleWebhook: async (body, signature) => {
        bodyReceived = body;
        signatureReceived = signature;
        return { status: 200, recebido: true };
      },
      verifySession: async () => ({}),
    },
  };

  const { handleWebhook } = require('./payment.controller');

  const req = {
    headers: { 'stripe-signature': 'sig_test' },
    body: Buffer.from('{"id":"evt_1"}'),
  };
  const res = createRes();

  await handleWebhook(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { recebido: true });
  assert.equal(bodyReceived.toString(), '{"id":"evt_1"}');
  assert.equal(signatureReceived, 'sig_test');
});

test('paymentReturnPage renders success and cancel variants', () => {
  const controllerPath = path.resolve(__dirname, './payment.controller.js');
  delete require.cache[controllerPath];

  const { paymentReturnPage } = require('./payment.controller');

  const successRes = createRes();
  paymentReturnPage({ query: { status: 'sucesso' } }, successRes);
  assert.match(successRes.html, /Pagamento Confirmado!/);

  const cancelRes = createRes();
  paymentReturnPage({ query: { status: 'cancelado' } }, cancelRes);
  assert.match(cancelRes.html, /Pagamento Cancelado/);
});
