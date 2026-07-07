const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('getPlan blocks access when user does not match userId', async () => {
  const servicePath = path.resolve(__dirname, '../../services/ai/plan.service.js');
  const controllerPath = path.resolve(__dirname, './plan.controller.js');

  delete require.cache[servicePath];
  delete require.cache[controllerPath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: { getPlan: async () => ({}) },
  };

  const { getPlan } = require('./plan.controller');

  const req = { params: { userId: 'user-2' }, user: { id: 'user-1' } };
  const res = createRes();

  await getPlan(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { erro: 'Acesso negado' });
});

test('generatePlan forwards status and removes internal status field', async () => {
  const servicePath = path.resolve(__dirname, '../../services/ai/plan.service.js');
  const controllerPath = path.resolve(__dirname, './plan.controller.js');

  delete require.cache[servicePath];
  delete require.cache[controllerPath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      generatePlan: async () => ({ status: 201, sucesso: true, plano: { mes: '2026-07' } }),
    },
  };

  const { generatePlan } = require('./plan.controller');

  const req = {
    params: { userId: 'user-1' },
    user: { id: 'user-1' },
    body: { objetivo: 'musculo' },
  };
  const res = createRes();

  await generatePlan(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { sucesso: true, plano: { mes: '2026-07' } });
  assert.equal('status' in res.body, false);
});

test('importDay returns 500 when service throws', async () => {
  const servicePath = path.resolve(__dirname, '../../services/ai/plan.service.js');
  const controllerPath = path.resolve(__dirname, './plan.controller.js');

  delete require.cache[servicePath];
  delete require.cache[controllerPath];
  require.cache[servicePath] = {
    id: servicePath,
    filename: servicePath,
    loaded: true,
    exports: {
      importDay: async () => {
        throw new Error('boom');
      },
    },
  };

  const { importDay } = require('./plan.controller');

  const req = {
    params: { userId: 'user-1' },
    user: { id: 'user-1' },
    body: { dia: 'segunda' },
  };
  const res = createRes();

  await importDay(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { erro: 'Erro ao importar dia' });
});
