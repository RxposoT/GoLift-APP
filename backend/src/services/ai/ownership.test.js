const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const actor = 'account-a';
function step(table, data, filters = [], fields) {
  return { table, filters, fields, result: { data, error: null } };
}
function feedbackSteps() {
  return [
    step('workout_sessions', JSON.parse('{"workout_id":"2"}'), [['id', 1], ['user_id', actor]], 'workout_id::text'),
    step('workouts', { id: 2 }, [['id', '2'], ['user_id', actor]], 'id'),
    step('profiles', { plano: 'pago' }, [['id', actor]]),
    step('workout_sessions', { workout: { nome: 'Treino A' }, workout_sets: [] },
      [['id', 1], ['user_id', actor], ['workout_id', '2'], ['workout.user_id', actor]]),
    step('daily_readiness', null, [['user_id', actor]]),
    step('workout_sessions', [], [['user_id', actor], ['workout.user_id', actor]]),
    step('workout_feedback', [], [['user_id', actor], ['session.user_id', actor], ['session.workout.user_id', actor]]),
    step('workout_feedback', null, [['session_id', 1]], 'user_id'),
    step('workout_feedback', { session_id: 1 }),
  ];
}
function adaptSteps() {
  return [
    step('workouts', { id: 2 }, [['id', 2], ['user_id', actor]], 'id'),
    step('profiles', { plano: 'pago' }, [['id', actor]]),
    step('daily_readiness', null, [['user_id', actor]]),
    step('workout_feedback', [], [['user_id', actor], ['session.user_id', actor], ['session.workout.user_id', actor]]),
    step('workouts', { nome: 'Treino A', workout_exercises: [{ exercises: { nome: 'Exercício A' } }] }, [['id', 2], ['user_id', actor]]),
  ];
}
function harness(kind, steps) {
  const calls = [];
  const writes = [];
  const prompts = [];
  const supabase = { from(table) {
    const query = { table, filters: [] };
    const builder = {
      select(fields) { query.fields = fields; return this; },
      eq(...filter) { query.filters.push(filter); return this; },
      upsert(payload, options) { writes.push({ payload, options }); return this; },
      then(resolve, reject) {
        calls.push(query);
        const expected = steps.shift();
        assert.ok(expected, `Unexpected query to ${table}`);
        assert.equal(table, expected.table);
        if (expected.fields) assert.equal(query.fields, expected.fields);
        for (const filter of expected.filters) assert.ok(query.filters.some(value =>
          value[0] === filter[0] && value[1] === filter[1]), `Missing filter ${filter}`);
        return Promise.resolve(expected.result).then(resolve, reject);
      },
    };
    for (const method of ['single', 'maybeSingle', 'not', 'neq', 'order', 'limit', 'gte', 'lte']) {
      builder[method] = function () { return this; };
    }
    return builder;
  } };
  const model = kind === 'feedback' ? { mensagem: 'Bom treino A', sugestao: null } : { adaptado: true, motivo: 'Treino A' };
  for (const [name, exports] of [['../../config/supabase', supabase], ['../gemini.service', {
    geminiGenerate: async ({ prompt }) => { prompts.push(prompt); return model; },
  }]]) {
    const filename = require.resolve(name);
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
  }
  const filename = require.resolve(`./${kind}.service`);
  delete require.cache[filename];
  const service = require(filename);
  const method = { feedback: 'submitFeedback', adapt: 'adaptWorkout', report: 'getWeeklyReport' }[kind];
  return { calls, writes, prompts, model, steps, run: body => service[method](actor, body) };
}
const configs = [
  { kind: 'feedback', steps: feedbackSteps, body: { session_id: 1 } },
  { kind: 'adapt', steps: adaptSteps, body: { workout_id: 2 } },
];
for (const config of configs) {
  test(`${config.kind}: foreign and missing resources return identical 404 before details or effects`, async () => {
    for (const resource of ['account-b', 'missing']) {
      const steps = config.steps();
      steps[0].result.data = null; // Owner-filtered query finds neither foreign nor absent rows.
      const h = harness(config.kind, steps);
      const result = await h.run(config.body);
      assert.equal(result.status, 404, resource);
      assert.equal(h.calls.length, 1);
      assert.equal(h.writes.length, 0);
      assert.equal(h.prompts.length, 0);
    }
  });
  test(`${config.kind}: every required database error stops before model and success`, async () => {
    for (let index = 0; index < config.steps().length; index++) {
      const steps = config.steps();
      steps[index].result = { data: null, error: { message: 'private SQL details' } };
      const h = harness(config.kind, steps);
      const result = await h.run(config.body);
      assert.equal(result.status, 500, `query ${index}`);
      assert.equal(h.calls.length, index + 1);
      assert.equal(h.prompts.length, 0);
      assert.equal(h.writes.length, index === 8 ? 1 : 0);
      assert.ok(!JSON.stringify(result).includes('private SQL'));
    }
  });
  test(`${config.kind}: success keeps the existing model response and actor-scoped context`, async () => {
    const h = harness(config.kind, config.steps());
    assert.deepEqual(await h.run({ ...config.body, user_id: 'account-b' }), { sucesso: true, ...h.model });
    assert.equal(h.prompts.length, 1);
    assert.match(h.prompts[0], config.kind === 'feedback' ? /Treino A/ : /Exercício A/);
    assert.equal(h.steps.length, 0);
    if (config.kind === 'feedback') {
      assert.equal(h.writes.length, 1);
      assert.equal(h.writes[0].payload.user_id, actor);
      assert.deepEqual(h.writes[0].options, { onConflict: 'session_id' });
    }
  });
  test(`${config.kind}: malformed IDs and missing bodies do not query or mutate`, async () => {
    const field = config.kind === 'feedback' ? 'session_id' : 'workout_id';
    const invalidIds = [{}, -1, 1.5, true, 9007199254740992, '9223372036854775808', '0', '-1', '1.5', '1e3'];
    for (const body of [undefined, null, {}, ...invalidIds.map(value => ({ [field]: value }))]) {
      const h = harness(config.kind, []);
      assert.equal((await h.run(body)).status, 400);
      assert.equal(h.calls.length + h.writes.length + h.prompts.length, 0);
    }
  });
}
test('feedback rejects a session belonging to A that references a workout belonging to B', async () => {
  const steps = feedbackSteps();
  steps[1].result.data = null;
  const h = harness('feedback', steps);
  assert.equal((await h.run({ session_id: 1 })).status, 404);
  assert.equal(h.calls.length, 2);
  assert.equal(h.writes.length + h.prompts.length, 0);
});
test('feedback refuses to reassign a foreign feedback attached to an owned session', async () => {
  const steps = feedbackSteps();
  steps[7].result.data = { user_id: 'account-b' };
  const h = harness('feedback', steps);
  assert.equal((await h.run({ session_id: 1 })).status, 404);
  assert.equal(h.writes.length + h.prompts.length, 0);
});
test('feedback fails explicitly when an upsert returns no row', async () => {
  const steps = feedbackSteps();
  steps[8].result.data = null;
  const h = harness('feedback', steps);
  assert.equal((await h.run({ session_id: 1 })).status, 500);
  assert.equal(h.prompts.length, 0);
});
test('free adaptation is returned only after checking workout ownership', async () => {
  const steps = adaptSteps();
  steps[1].result.data = { plano: 'free' };
  const h = harness('adapt', steps);
  assert.deepEqual(await h.run({ workout_id: 2 }), { sucesso: true, adaptado: false, motivo: 'plano_free' });
  assert.equal(h.calls.length, 2);
  assert.equal(h.writes.length + h.prompts.length, 0);
});
test('controllers reject a URL account different from the JWT actor before querying', async () => {
  for (const config of configs) {
    const h = harness(config.kind, []);
    const filename = path.resolve(__dirname, `../../controllers/ai/${config.kind}.controller.js`);
    delete require.cache[filename];
    const controller = require(filename);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    const method = config.kind === 'feedback' ? 'submitFeedback' : 'adaptWorkout';
    await controller[method]({ user: { id: actor }, params: { userId: 'account-b' }, body: config.body }, res);
    assert.equal(res.code, 403);
    assert.equal(h.calls.length + h.writes.length + h.prompts.length, 0);
  }
});
test('unexpected missing profile, detail or list cannot become a successful response', async () => {
  for (const [kind, index, status] of [
    ['feedback', 2, 404], ['feedback', 3, 404], ['feedback', 5, 500], ['feedback', 6, 500],
    ['adapt', 1, 404], ['adapt', 3, 500], ['adapt', 4, 404],
  ]) {
    const config = configs.find(value => value.kind === kind);
    const steps = config.steps();
    steps[index].result.data = null;
    const h = harness(kind, steps);
    assert.equal((await h.run(config.body)).status, status);
    assert.equal(h.writes.length + h.prompts.length, 0);
  }
});
test('controllers preserve successful response bodies for the authenticated owner', async () => {
  for (const config of configs) {
    const h = harness(config.kind, config.steps());
    const filename = path.resolve(__dirname, `../../controllers/ai/${config.kind}.controller.js`);
    delete require.cache[filename];
    const controller = require(filename);
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
    const method = config.kind === 'feedback' ? 'submitFeedback' : 'adaptWorkout';
    await controller[method]({ user: { id: actor }, params: { userId: actor }, body: config.body }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(res.body, { sucesso: true, ...h.model });
  }
});
test('numeric string IDs retain compatibility without accepting arbitrary strings', async () => {
  for (const config of configs) {
    for (const id of ['1', '9007199254740993', '9223372036854775807']) {
      const steps = config.steps();
      for (const entry of steps) entry.filters = entry.filters.map(([name, value]) =>
        ['id', 'session_id'].includes(name) && value === (config.kind === 'feedback' ? 1 : 2) ? [name, id] : [name, value]);
      const h = harness(config.kind, steps);
      const body = config.kind === 'feedback' ? { session_id: id } : { workout_id: id };
      assert.equal((await h.run(body)).sucesso, true);
      if (config.kind === 'feedback') assert.equal(h.writes[0].payload.session_id, id);
    }
  }
});
test('feedback preserves a BIGINT workout FK returned as JSON text through both owner filters', async () => {
  const sessionId = '9223372036854775807';
  const workoutId = '9007199254740993';
  const steps = feedbackSteps();
  steps[0].result.data = JSON.parse('{"workout_id":"9007199254740993"}');
  steps[0].filters[0] = ['id', sessionId];
  steps[1].filters[0] = ['id', workoutId];
  steps[3].filters[0] = ['id', sessionId];
  steps[3].filters[2] = ['workout_id', workoutId];
  steps[7].filters[0] = ['session_id', sessionId];
  const h = harness('feedback', steps);
  assert.equal((await h.run({ session_id: sessionId })).sucesso, true);
  assert.deepEqual(h.calls[1].filters[0], ['id', workoutId]);
  assert.deepEqual(h.calls[3].filters[2], ['workout_id', workoutId]);
  assert.equal(h.writes[0].payload.session_id, sessionId);
});
function reportSteps() {
  return [
    step('profiles', { plano: 'pago' }, [['id', actor]]),
    step('ai_reports', null, [['user_id', actor]]),
    step('workout_sessions', [{ workout: { nome: 'Treino A' }, data_fim: new Date().toISOString() }],
      [['user_id', actor], ['workout.user_id', actor]]),
    step('profiles', {}, [['id', actor]]),
    step('ai_reports', { user_id: actor }),
  ];
}
test('report only uses owned session/workout context and preserves success shape', async () => {
  const h = harness('report', reportSteps());
  const result = await h.run();
  assert.equal(result.sucesso, true);
  assert.equal(result.cached, false);
  assert.deepEqual(result.relatorio, h.model);
  assert.match(result.semana_inicio, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(h.prompts[0], /Treino A/);
  assert.equal(h.writes[0].payload.user_id, actor);
});
test('report database failures never turn into cached/no-data success', async () => {
  for (let index = 0; index < reportSteps().length; index++) {
    const steps = reportSteps();
    steps[index].result = { data: null, error: { message: 'DB unavailable' } };
    const h = harness('report', steps);
    assert.equal((await h.run()).status, 500);
    assert.equal(h.prompts.length, index === 4 ? 1 : 0);
    assert.equal(h.writes.length, index === 4 ? 1 : 0);
  }
});
test('report empty history is legitimate but zero persisted rows is an error', async () => {
  let steps = reportSteps();
  steps[2].result.data = [];
  let h = harness('report', steps);
  assert.equal((await h.run()).sucesso, true);
  assert.equal(h.prompts.length + h.writes.length, 0);
  steps = reportSteps();
  steps[4].result.data = null;
  h = harness('report', steps);
  assert.equal((await h.run()).status, 500);
});
