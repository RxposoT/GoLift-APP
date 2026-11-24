const test = require('node:test');
const assert = require('node:assert/strict');

const actor = 'account-a';
const premium = { plano: 'pago', objetivo: 'Força' };
const databaseError = { message: 'private SQL and credentials', code: 'XX000' };
const row = (table, kind, data, error = null) => ({ table, kind, data, error });

function harness(steps, modelResult = { plano: { descricao: 'Plano A', split: [] } }) {
  const events = [];
  const client = { from(table) {
    const query = { table, kind: 'read', filters: [] };
    const builder = {
      select(fields) { query.fields = fields; return this; },
      eq(...filter) { query.filters.push(filter); return this; },
      maybeSingle() { query.cardinality = 'maybe'; return this; },
      single() { query.cardinality = 'one'; return this; },
      update(payload) { query.kind = 'update'; query.payload = payload; return this; },
      insert(payload) { query.kind = 'insert'; query.payload = payload; return this; },
      then(resolve, reject) {
        events.push(query);
        const expected = steps.shift();
        assert.ok(expected, `Unexpected ${query.kind} on ${table}`);
        assert.equal(query.table, expected.table);
        assert.equal(query.kind, expected.kind);
        if (query.kind === 'insert') {
          assert.equal(query.payload.user_id, actor);
          assert.equal(query.fields, 'user_id');
          assert.equal(query.cardinality, 'one');
        } else {
          assert.ok(query.filters.some(([key, value]) =>
            key === (table === 'profiles' ? 'id' : 'user_id') && value === actor));
          if (table === 'profiles') assert.equal(query.cardinality, 'maybe');
        }
        return Promise.resolve({ data: expected.data, error: expected.error }).then(resolve, reject);
      },
    };
    return builder;
  } };
  for (const [moduleName, exports] of [
    ['../../config/supabase', client],
    ['../gemini.service', { geminiGenerate: async input => {
      events.push({ kind: 'model', input });
      return modelResult;
    } }],
  ]) {
    const filename = require.resolve(moduleName);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  }
  const filename = require.resolve('./plan.service');
  delete require.cache[filename];
  const service = require(filename);
  return { events, steps, run: method => service[method](actor, {}) };
}

for (const method of ['getPlan', 'generatePlan']) {
  test(`${method}: profile database errors stop before cache, effects and model`, async () => {
    const h = harness([row('profiles', 'read', premium, databaseError)]);
    assert.deepEqual(await h.run(method), { status: 500, erro: 'Erro ao consultar perfil' });
    assert.deepEqual(h.events.map(event => event.kind), ['read']);
  });
  test(`${method}: absent profile and free profile retain existing refusal responses`, async () => {
    for (const [profile, expected] of [
      [null, { status: 404, erro: 'Utilizador não encontrado' }],
      [{ plano: 'free' }, { status: 403, erro: 'Plano GoLift Pro necessário', codigo: 'PLANO_NECESSARIO' }],
    ]) {
      const h = harness([row('profiles', 'read', profile)]);
      assert.deepEqual(await h.run(method), expected);
      assert.deepEqual(h.events.map(event => event.kind), ['read']);
    }
  });
}

test('getPlan: cache failure is never returned as permission to generate', async () => {
  const h = harness([row('profiles', 'read', premium), row('ai_plans', 'read', null, databaseError)]);
  assert.deepEqual(await h.run('getPlan'), { status: 500, erro: 'Erro ao consultar plano' });
  assert.deepEqual(h.events.map(event => event.kind), ['read', 'read']);
});

test('getPlan: empty cache and cached plan preserve their public success bodies', async () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const empty = harness([row('profiles', 'read', premium), row('ai_plans', 'read', null)]);
  assert.deepEqual(await empty.run('getPlan'), { sucesso: true, plano: null, mes: month, pode_gerar: true });
  for (const rest of [0, 120]) {
    const cached = { conteudo: { descricao: 'Plano guardado' }, criado_em: '2026-11-01', descanso_segundos: rest };
    const h = harness([row('profiles', 'read', premium), row('ai_plans', 'read', cached)]);
    assert.deepEqual(await h.run('getPlan'), { sucesso: true, plano: cached.conteudo, mes: month,
      criado_em: cached.criado_em, descanso_segundos: rest || 90, pode_gerar: false });
    assert.deepEqual(h.events.map(event => event.kind), ['read', 'read']);
  }
});

test('generatePlan: archive errors stop before model and insertion', async () => {
  const h = harness([row('profiles', 'read', premium), row('ai_plans', 'update', null, databaseError)]);
  assert.deepEqual(await h.run('generatePlan'), { status: 500, erro: 'Erro ao arquivar plano' });
  assert.deepEqual(h.events.map(event => event.kind), ['read', 'update']);
});

test('generatePlan: insert errors and zero confirmed rows cannot return success', async () => {
  for (const error of [databaseError, null]) {
    const h = harness([row('profiles', 'read', premium), row('ai_plans', 'update', null),
      row('ai_plans', 'insert', null, error)]);
    assert.deepEqual(await h.run('generatePlan'), { status: 500, erro: 'Erro ao guardar plano' });
    assert.deepEqual(h.events.map(event => event.kind), ['read', 'update', 'model', 'insert']);
  }
});

test('generatePlan: zero archived rows permit generation and confirmed insertion preserves success', async () => {
  const plan = { descricao: 'Plano novo', split: [] };
  const h = harness([row('profiles', 'read', premium), row('ai_plans', 'update', null),
    row('ai_plans', 'insert', { user_id: actor })], { plano: plan });
  const result = await h.run('generatePlan');
  const insert = h.events.find(event => event.kind === 'insert');
  assert.deepEqual(result, { sucesso: true, plano: plan, mes: insert.payload.mes,
    descanso_segundos: 90, pode_gerar: false });
  assert.equal(insert.payload.conteudo, plan);
  assert.equal(h.steps.length, 0);
  assert.deepEqual(h.events.map(event => event.kind), ['read', 'update', 'model', 'insert']);
});
